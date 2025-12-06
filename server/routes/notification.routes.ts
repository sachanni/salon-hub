import type { Express, Response } from "express";
import { db } from "../db";
import { userNotifications } from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";

export function registerNotificationRoutes(app: Express) {
  app.get("/api/mobile/notifications", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unreadOnly === "true";

      let whereCondition = eq(userNotifications.userId, userId);
      if (unreadOnly) {
        whereCondition = and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, 0)
        )!;
      }

      const notifications = await db.query.userNotifications.findMany({
        where: whereCondition,
        orderBy: [desc(userNotifications.createdAt)],
        limit,
        offset,
      });

      res.json({
        success: true,
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          referenceId: n.referenceId,
          referenceType: n.referenceType,
          isRead: n.isRead === 1,
          readAt: n.readAt,
          imageUrl: n.imageUrl,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/mobile/notifications/count", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      const result = await db.select({ count: sql<number>`count(*)` })
        .from(userNotifications)
        .where(and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, 0)
        ));

      res.json({
        success: true,
        unreadCount: result[0]?.count || 0,
      });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ error: "Failed to fetch notification count" });
    }
  });

  app.post("/api/mobile/notifications/:id/read", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      const notification = await db.query.userNotifications.findFirst({
        where: and(
          eq(userNotifications.id, notificationId),
          eq(userNotifications.userId, userId)
        ),
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      await db.update(userNotifications)
        .set({
          isRead: 1,
          readAt: new Date(),
        })
        .where(eq(userNotifications.id, notificationId));

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/mobile/notifications/read-all", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      await db.update(userNotifications)
        .set({
          isRead: 1,
          readAt: new Date(),
        })
        .where(and(
          eq(userNotifications.userId, userId),
          eq(userNotifications.isRead, 0)
        ));

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  app.delete("/api/mobile/notifications/:id", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      const notification = await db.query.userNotifications.findFirst({
        where: and(
          eq(userNotifications.id, notificationId),
          eq(userNotifications.userId, userId)
        ),
      });

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      await db.delete(userNotifications)
        .where(eq(userNotifications.id, notificationId));

      res.json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  console.log("✅ Mobile notification routes registered");
}

export async function createUserNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
  imageUrl?: string;
  actionUrl?: string;
}) {
  try {
    const [notification] = await db.insert(userNotifications).values(data).returning();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}
