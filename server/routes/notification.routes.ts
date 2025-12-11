import type { Express, Response } from "express";
import { db } from "../db";
import { userNotifications, userPushTokens } from "@shared/schema";
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

  // Register push notification token (persisted to database with deduplication)
  app.post("/api/mobile/notifications/register-token", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { token, platform, deviceId, deviceName } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // Generate unique device identifier if not provided (use token hash as fallback)
      const effectiveDeviceId = deviceId || `device_${token.substring(0, 32)}`;

      // First, check if this exact token already exists for this user
      const existingTokenRecord = await db.query.userPushTokens.findFirst({
        where: and(
          eq(userPushTokens.userId, userId),
          eq(userPushTokens.token, token)
        ),
      });

      if (existingTokenRecord) {
        // Token exists - update metadata and reactivate
        await db.update(userPushTokens)
          .set({
            platform: platform || existingTokenRecord.platform,
            deviceId: effectiveDeviceId,
            deviceName: deviceName || existingTokenRecord.deviceName,
            isActive: 1,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userPushTokens.id, existingTokenRecord.id));
      } else {
        // New token - deactivate any previous tokens for this device
        await db.update(userPushTokens)
          .set({ isActive: 0, updatedAt: new Date() })
          .where(and(
            eq(userPushTokens.userId, userId),
            eq(userPushTokens.deviceId, effectiveDeviceId)
          ));

        // Insert new token record
        await db.insert(userPushTokens).values({
          userId,
          token,
          platform: platform || 'unknown',
          deviceId: effectiveDeviceId,
          deviceName: deviceName || null,
        });
      }

      console.log(`Push token registered for user ${userId} (device: ${effectiveDeviceId.substring(0, 20)}...)`);

      res.json({
        success: true,
        message: "Push token registered successfully",
      });
    } catch (error) {
      console.error("Error registering push token:", error);
      res.status(500).json({ error: "Failed to register push token" });
    }
  });

  app.post("/api/mobile/notifications/unregister-token", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      const existingToken = await db.query.userPushTokens.findFirst({
        where: and(
          eq(userPushTokens.userId, userId),
          eq(userPushTokens.token, token)
        ),
      });

      if (!existingToken) {
        return res.json({
          success: true,
          message: "Token not found or already unregistered",
        });
      }

      await db.update(userPushTokens)
        .set({
          isActive: 0,
          updatedAt: new Date(),
        })
        .where(eq(userPushTokens.id, existingToken.id));

      console.log(`Push token unregistered for user ${userId}`);

      res.json({
        success: true,
        message: "Push token unregistered successfully",
      });
    } catch (error) {
      console.error("Error unregistering push token:", error);
      res.status(500).json({ error: "Failed to unregister push token" });
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

// Helper function to get active push tokens for a user (for notification dispatch)
export async function getActiveUserPushTokens(userId: string) {
  try {
    const tokens = await db.query.userPushTokens.findMany({
      where: and(
        eq(userPushTokens.userId, userId),
        eq(userPushTokens.isActive, 1)
      ),
    });
    return tokens.map(t => ({
      token: t.token,
      platform: t.platform,
      deviceId: t.deviceId,
    }));
  } catch (error) {
    console.error("Error fetching user push tokens:", error);
    return [];
  }
}

// Helper function to get all active push tokens for multiple users (batch dispatch)
export async function getActiveUsersPushTokens(userIds: string[]) {
  try {
    const tokens = await db.query.userPushTokens.findMany({
      where: and(
        sql`${userPushTokens.userId} = ANY(${userIds})`,
        eq(userPushTokens.isActive, 1)
      ),
    });
    
    // Group by userId
    const tokensByUser: Record<string, { token: string; platform: string }[]> = {};
    for (const t of tokens) {
      if (!tokensByUser[t.userId]) {
        tokensByUser[t.userId] = [];
      }
      tokensByUser[t.userId].push({
        token: t.token,
        platform: t.platform,
      });
    }
    return tokensByUser;
  } catch (error) {
    console.error("Error fetching users push tokens:", error);
    return {};
  }
}
