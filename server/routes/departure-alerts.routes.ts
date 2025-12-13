import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  departureAlerts,
  departureAlertSettings,
  customerDeparturePreferences,
  updateDeparturePreferencesSchema,
  acknowledgeDepartureAlertSchema,
  updateSalonDepartureSettingsSchema,
  bookings,
} from "@shared/schema";
import { queueCalculatorService } from "../services/queueCalculator.service";
import { departureCalculatorService } from "../services/departureCalculator.service";
import { departureNotificationService } from "../services/departureNotification.service";
import { authenticateToken, requireSalonAccess } from "../middleware/auth";
import { authenticateMobileUser } from "../middleware/authMobile";

const router = Router();

router.get("/bookings/:bookingId/departure-status", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: "Access denied - not your booking" });
    }

    const status = await departureCalculatorService.getDepartureStatusForBooking(bookingId);

    if (!status) {
      return res.status(404).json({ error: "Unable to calculate departure status for this booking" });
    }

    return res.json(status);
  } catch (error) {
    console.error("Error getting departure status:", error);
    return res.status(500).json({ error: "Failed to get departure status" });
  }
});

router.get("/departure-alerts", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { date } = req.query;
    const alerts = await departureNotificationService.getAlertsForUser(userId, date as string);

    return res.json({ alerts });
  } catch (error) {
    console.error("Error getting departure alerts:", error);
    return res.status(500).json({ error: "Failed to get departure alerts" });
  }
});

router.post("/departure-alerts/:alertId/acknowledge", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { alertId } = req.params;
    const parseResult = acknowledgeDepartureAlertSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid request body",
        details: parseResult.error.flatten() 
      });
    }

    const { response, actualDepartureTime } = parseResult.data;
    const success = await departureNotificationService.acknowledgeAlert(
      alertId,
      userId,
      response,
      actualDepartureTime
    );

    if (!success) {
      return res.status(404).json({ error: "Alert not found or access denied" });
    }

    return res.json({ success: true, message: "Alert acknowledged" });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return res.status(500).json({ error: "Failed to acknowledge alert" });
  }
});

router.get("/customers/departure-preferences", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const prefs = await db.query.customerDeparturePreferences.findFirst({
      where: eq(customerDeparturePreferences.userId, userId),
    });

    if (!prefs) {
      return res.json({
        receiveAlerts: true,
        defaultLocationLabel: "home",
        preferredBufferMinutes: 15,
        reminderTimingPreference: "60_minutes",
        preferredChannel: "push",
        quietHoursStart: null,
        quietHoursEnd: null,
      });
    }

    return res.json({
      receiveAlerts: prefs.receiveAlerts === 1,
      defaultLocationLabel: prefs.defaultLocationLabel,
      preferredBufferMinutes: prefs.preferredBufferMinutes,
      reminderTimingPreference: prefs.reminderTimingPreference,
      preferredChannel: prefs.preferredChannel,
      quietHoursStart: prefs.quietHoursStart,
      quietHoursEnd: prefs.quietHoursEnd,
    });
  } catch (error) {
    console.error("Error getting departure preferences:", error);
    return res.status(500).json({ error: "Failed to get departure preferences" });
  }
});

router.put("/customers/departure-preferences", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const parseResult = updateDeparturePreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid request body",
        details: parseResult.error.flatten() 
      });
    }

    const data = parseResult.data;
    const existing = await db.query.customerDeparturePreferences.findFirst({
      where: eq(customerDeparturePreferences.userId, userId),
    });

    const updateData = {
      receiveAlerts: data.receiveAlerts !== undefined ? (data.receiveAlerts ? 1 : 0) : undefined,
      defaultLocationLabel: data.defaultLocationLabel,
      preferredBufferMinutes: data.preferredBufferMinutes,
      reminderTimingPreference: data.reminderTimingPreference,
      preferredChannel: data.preferredChannel,
      quietHoursStart: data.quietHoursStart,
      quietHoursEnd: data.quietHoursEnd,
      updatedAt: new Date(),
    };

    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });

    if (existing) {
      await db.update(customerDeparturePreferences)
        .set(updateData)
        .where(eq(customerDeparturePreferences.id, existing.id));
    } else {
      await db.insert(customerDeparturePreferences).values({
        userId,
        receiveAlerts: data.receiveAlerts !== undefined ? (data.receiveAlerts ? 1 : 0) : 1,
        defaultLocationLabel: data.defaultLocationLabel || "home",
        preferredBufferMinutes: data.preferredBufferMinutes || 15,
        reminderTimingPreference: data.reminderTimingPreference || "60_minutes",
        preferredChannel: data.preferredChannel || "push",
        quietHoursStart: data.quietHoursStart || null,
        quietHoursEnd: data.quietHoursEnd || null,
      });
    }

    return res.json({ success: true, message: "Preferences updated" });
  } catch (error) {
    console.error("Error updating departure preferences:", error);
    return res.status(500).json({ error: "Failed to update departure preferences" });
  }
});

router.get("/salons/:salonId/queue-status", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { date } = req.query;

    if (!salonId) {
      return res.status(400).json({ error: "Salon ID is required" });
    }

    const status = await queueCalculatorService.getSalonQueueStatus(salonId, date as string);

    if (!status) {
      return res.status(404).json({ error: "Salon not found or no staff available" });
    }

    return res.json(status);
  } catch (error) {
    console.error("Error getting salon queue status:", error);
    return res.status(500).json({ error: "Failed to get salon queue status" });
  }
});

router.get("/staff/:staffId/queue-status", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { staffId } = req.params;
    const { date } = req.query;

    if (!staffId) {
      return res.status(400).json({ error: "Staff ID is required" });
    }

    const status = await queueCalculatorService.getStaffQueueStatus(staffId, date as string);

    if (!status) {
      return res.status(404).json({ error: "Staff not found" });
    }

    return res.json(status);
  } catch (error) {
    console.error("Error getting staff queue status:", error);
    return res.status(500).json({ error: "Failed to get staff queue status" });
  }
});

router.get("/salons/:salonId/departure-settings", authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ error: "Salon ID is required" });
    }

    const settings = await departureCalculatorService.getSalonDepartureSettings(salonId);
    return res.json(settings);
  } catch (error) {
    console.error("Error getting salon departure settings:", error);
    return res.status(500).json({ error: "Failed to get departure settings" });
  }
});

router.put("/salons/:salonId/departure-settings", authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ error: "Salon ID is required" });
    }

    const parseResult = updateSalonDepartureSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid request body",
        details: parseResult.error.flatten() 
      });
    }

    const data = parseResult.data;
    const existing = await db.query.departureAlertSettings.findFirst({
      where: eq(departureAlertSettings.salonId, salonId),
    });

    const updateData = {
      isEnabled: data.isEnabled !== undefined ? (data.isEnabled ? 1 : 0) : undefined,
      firstAlertMinutesBefore: data.firstAlertMinutesBefore,
      updateIntervalMinutes: data.updateIntervalMinutes,
      minDelayToNotify: data.minDelayToNotify,
      defaultBufferMinutes: data.defaultBufferMinutes,
      enablePushNotifications: data.enablePushNotifications !== undefined ? (data.enablePushNotifications ? 1 : 0) : undefined,
      enableSmsNotifications: data.enableSmsNotifications !== undefined ? (data.enableSmsNotifications ? 1 : 0) : undefined,
      enableWhatsappNotifications: data.enableWhatsappNotifications !== undefined ? (data.enableWhatsappNotifications ? 1 : 0) : undefined,
      useTrafficData: data.useTrafficData !== undefined ? (data.useTrafficData ? 1 : 0) : undefined,
      considerHistoricalOverrun: data.considerHistoricalOverrun !== undefined ? (data.considerHistoricalOverrun ? 1 : 0) : undefined,
      autoReassignStaff: data.autoReassignStaff !== undefined ? (data.autoReassignStaff ? 1 : 0) : undefined,
      updatedAt: new Date(),
    };

    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });

    if (existing) {
      await db.update(departureAlertSettings)
        .set(updateData)
        .where(eq(departureAlertSettings.id, existing.id));
    } else {
      await db.insert(departureAlertSettings).values({
        salonId,
        isEnabled: data.isEnabled !== undefined ? (data.isEnabled ? 1 : 0) : 1,
        firstAlertMinutesBefore: data.firstAlertMinutesBefore || 60,
        updateIntervalMinutes: data.updateIntervalMinutes || 15,
        minDelayToNotify: data.minDelayToNotify || 10,
        defaultBufferMinutes: data.defaultBufferMinutes || 10,
        enablePushNotifications: data.enablePushNotifications !== undefined ? (data.enablePushNotifications ? 1 : 0) : 1,
        enableSmsNotifications: data.enableSmsNotifications !== undefined ? (data.enableSmsNotifications ? 1 : 0) : 0,
        enableWhatsappNotifications: data.enableWhatsappNotifications !== undefined ? (data.enableWhatsappNotifications ? 1 : 0) : 0,
        useTrafficData: data.useTrafficData !== undefined ? (data.useTrafficData ? 1 : 0) : 0,
        considerHistoricalOverrun: data.considerHistoricalOverrun !== undefined ? (data.considerHistoricalOverrun ? 1 : 0) : 1,
        autoReassignStaff: data.autoReassignStaff !== undefined ? (data.autoReassignStaff ? 1 : 0) : 0,
      });
    }

    return res.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Error updating salon departure settings:", error);
    return res.status(500).json({ error: "Failed to update departure settings" });
  }
});

export const mobileDepartureAlertsRouter = Router();

mobileDepartureAlertsRouter.get("/departure-status/:bookingId", authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!bookingId) {
      return res.status(400).json({ error: "Booking ID is required" });
    }

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: "Access denied - not your booking" });
    }

    const status = await departureCalculatorService.getDepartureStatusForBooking(bookingId);

    if (!status) {
      return res.status(404).json({ success: false, error: "Unable to calculate departure status for this booking" });
    }

    return res.json({ success: true, status });
  } catch (error) {
    console.error("Error getting departure status:", error);
    return res.status(500).json({ success: false, error: "Failed to get departure status" });
  }
});

mobileDepartureAlertsRouter.get("/alerts", authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { date } = req.query;
    const alerts = await departureNotificationService.getAlertsForUser(userId, date as string);

    return res.json({ alerts });
  } catch (error) {
    console.error("Error getting departure alerts:", error);
    return res.status(500).json({ error: "Failed to get departure alerts" });
  }
});

mobileDepartureAlertsRouter.post("/alerts/:alertId/acknowledge", authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { alertId } = req.params;
    const parseResult = acknowledgeDepartureAlertSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid request body",
        details: parseResult.error.flatten() 
      });
    }

    const { response, actualDepartureTime } = parseResult.data;
    const success = await departureNotificationService.acknowledgeAlert(
      alertId,
      userId,
      response,
      actualDepartureTime
    );

    if (!success) {
      return res.status(404).json({ error: "Alert not found or access denied" });
    }

    return res.json({ success: true, message: "Alert acknowledged" });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return res.status(500).json({ error: "Failed to acknowledge alert" });
  }
});

mobileDepartureAlertsRouter.get("/preferences", authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const prefs = await db.query.customerDeparturePreferences.findFirst({
      where: eq(customerDeparturePreferences.userId, userId),
    });

    if (!prefs) {
      return res.json({
        success: true,
        preferences: {
          receiveAlerts: true,
          defaultLocationLabel: "home",
          preferredBufferMinutes: 15,
          reminderTimingPreference: "60_minutes",
          preferredChannel: "push",
          quietHoursStart: null,
          quietHoursEnd: null,
        }
      });
    }

    return res.json({
      success: true,
      preferences: {
        receiveAlerts: prefs.receiveAlerts === 1,
        defaultLocationLabel: prefs.defaultLocationLabel,
        preferredBufferMinutes: prefs.preferredBufferMinutes,
        reminderTimingPreference: prefs.reminderTimingPreference,
        preferredChannel: prefs.preferredChannel,
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
      }
    });
  } catch (error) {
    console.error("Error getting departure preferences:", error);
    return res.status(500).json({ success: false, error: "Failed to get departure preferences" });
  }
});

mobileDepartureAlertsRouter.put("/preferences", authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const parseResult = updateDeparturePreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid request body",
        details: parseResult.error.flatten() 
      });
    }

    const data = parseResult.data;
    const existing = await db.query.customerDeparturePreferences.findFirst({
      where: eq(customerDeparturePreferences.userId, userId),
    });

    const updateData = {
      receiveAlerts: data.receiveAlerts !== undefined ? (data.receiveAlerts ? 1 : 0) : undefined,
      defaultLocationLabel: data.defaultLocationLabel,
      preferredBufferMinutes: data.preferredBufferMinutes,
      reminderTimingPreference: data.reminderTimingPreference,
      preferredChannel: data.preferredChannel,
      quietHoursStart: data.quietHoursStart,
      quietHoursEnd: data.quietHoursEnd,
      updatedAt: new Date(),
    };

    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });

    if (existing) {
      await db.update(customerDeparturePreferences)
        .set(updateData)
        .where(eq(customerDeparturePreferences.id, existing.id));
    } else {
      await db.insert(customerDeparturePreferences).values({
        userId,
        receiveAlerts: data.receiveAlerts !== undefined ? (data.receiveAlerts ? 1 : 0) : 1,
        defaultLocationLabel: data.defaultLocationLabel || "home",
        preferredBufferMinutes: data.preferredBufferMinutes || 15,
        reminderTimingPreference: data.reminderTimingPreference || "60_minutes",
        preferredChannel: data.preferredChannel || "push",
        quietHoursStart: data.quietHoursStart || null,
        quietHoursEnd: data.quietHoursEnd || null,
      });
    }

    const updatedPrefs = await db.query.customerDeparturePreferences.findFirst({
      where: eq(customerDeparturePreferences.userId, userId),
    });

    return res.json({ 
      success: true, 
      message: "Preferences updated",
      preferences: updatedPrefs ? {
        receiveAlerts: updatedPrefs.receiveAlerts === 1,
        defaultLocationLabel: updatedPrefs.defaultLocationLabel,
        preferredBufferMinutes: updatedPrefs.preferredBufferMinutes,
        reminderTimingPreference: updatedPrefs.reminderTimingPreference,
        preferredChannel: updatedPrefs.preferredChannel,
        quietHoursStart: updatedPrefs.quietHoursStart,
        quietHoursEnd: updatedPrefs.quietHoursEnd,
      } : null
    });
  } catch (error) {
    console.error("Error updating departure preferences:", error);
    return res.status(500).json({ success: false, error: "Failed to update departure preferences" });
  }
});

export default router;
