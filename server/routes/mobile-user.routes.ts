import type { Express, Response } from "express";
import { db } from "../db";
import { users, bookings, services, salons } from "@shared/schema";
import { eq, and, sql, desc, gte, lt } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
  email: z.string().email().optional(),
  profileImageUrl: z.string().url().optional().nullable(),
});

export function registerMobileUserRoutes(app: Express) {
  app.get("/api/mobile/users/profile", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profileImageUrl: user.profileImageUrl,
          emailVerified: user.emailVerified === 1,
          phoneVerified: user.phoneVerified === 1,
          createdAt: user.createdAt,
          memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
        },
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  app.patch("/api/mobile/users/profile", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const parsed = updateProfileSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const updateData: any = {};
      if (parsed.data.firstName !== undefined) updateData.firstName = parsed.data.firstName;
      if (parsed.data.lastName !== undefined) updateData.lastName = parsed.data.lastName;
      if (parsed.data.phoneNumber !== undefined) updateData.phone = parsed.data.phoneNumber;
      if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
      if (parsed.data.profileImageUrl !== undefined) updateData.profileImageUrl = parsed.data.profileImageUrl;
      updateData.updatedAt = new Date();

      if (parsed.data.email) {
        const existingEmail = await db.query.users.findFirst({
          where: and(
            eq(users.email, parsed.data.email),
            sql`${users.id} != ${userId}`
          ),
        });
        if (existingEmail) {
          return res.status(409).json({ 
            error: "Email already in use",
            field: "email"
          });
        }
      }

      if (parsed.data.phoneNumber) {
        const existingPhone = await db.query.users.findFirst({
          where: and(
            eq(users.phone, parsed.data.phoneNumber),
            sql`${users.id} != ${userId}`
          ),
        });
        if (existingPhone) {
          return res.status(409).json({ 
            error: "Phone number already in use",
            field: "phoneNumber"
          });
        }
      }

      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          profileImageUrl: updatedUser.profileImageUrl,
          emailVerified: updatedUser.emailVerified === 1,
          phoneVerified: updatedUser.phoneVerified === 1,
        },
      });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      if (error.code === '23505') {
        return res.status(409).json({ 
          error: "Email or phone number already in use",
          details: error.detail
        });
      }
      res.status(500).json({ error: "Failed to update user profile" });
    }
  });

  app.get("/api/mobile/users/stats", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const now = new Date();

      const [upcomingResult] = await db.select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(and(
          eq(bookings.userId, userId),
          sql`${bookings.status} IN ('pending', 'confirmed')`,
          sql`${bookings.bookingDate}::date >= CURRENT_DATE`
        ));

      const [totalResult] = await db.select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(eq(bookings.userId, userId));

      const [spentResult] = await db.select({ 
        total: sql<number>`COALESCE(SUM(${bookings.finalAmountPaisa}), 0)` 
      })
        .from(bookings)
        .where(and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'completed')
        ));

      const favoriteServiceResult = await db.select({
        serviceName: services.name,
        count: sql<number>`count(*)`,
      })
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'completed')
        ))
        .groupBy(services.name)
        .orderBy(desc(sql`count(*)`))
        .limit(1);

      res.json({
        success: true,
        stats: {
          upcomingBookings: parseInt(String(upcomingResult?.count || 0)),
          totalBookings: parseInt(String(totalResult?.count || 0)),
          totalSpent: parseInt(String(spentResult?.total || 0)),
          totalSpentFormatted: `₹${(parseInt(String(spentResult?.total || 0)) / 100).toFixed(0)}`,
          favoriteService: favoriteServiceResult[0]?.serviceName || 'None',
          favoriteServiceCount: parseInt(String(favoriteServiceResult[0]?.count || 0)),
        },
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });
}
