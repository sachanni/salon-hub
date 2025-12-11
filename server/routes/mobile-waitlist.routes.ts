import { Router, Request, Response } from "express";
import { waitlistService } from "../services/waitlistService";
import { joinWaitlistSchema, respondWaitlistSchema } from "@shared/schema";
import { ZodError } from "zod";
import rateLimit from "express-rate-limit";

const router = Router();

const waitlistRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

function handleZodError(error: ZodError) {
  const issues = error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  return { error: "Validation failed", issues };
}

router.post("/join", waitlistRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const parseResult = joinWaitlistSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(handleZodError(parseResult.error));
    }

    const result = await waitlistService.joinWaitlist(userId, parseResult.data);

    if (!result.success) {
      if (result.availableSlots) {
        return res.status(422).json({
          error: result.error,
          availableSlots: result.availableSlots,
          code: "SLOTS_AVAILABLE",
        });
      }
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      waitlistEntry: result.waitlistEntry,
    });
  } catch (error) {
    console.error("Error joining waitlist (mobile):", error);
    return res.status(500).json({ error: "Failed to join waitlist" });
  }
});

router.get("/my-entries", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const entries = await waitlistService.getUserWaitlistEntries(userId);
    
    return res.json({ 
      entries: entries.map(entry => ({
        id: entry.id,
        salon: entry.salon,
        service: entry.service,
        staff: entry.staff,
        requestedDate: entry.requestedDate,
        timeWindow: `${entry.timeWindowStart} - ${entry.timeWindowEnd}`,
        flexibilityDays: entry.flexibilityDays,
        priority: entry.priority,
        position: entry.position,
        status: entry.status,
        notifiedAt: entry.notifiedAt,
        responseDeadline: entry.responseDeadline,
        expiresAt: entry.expiresAt,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching waitlist entries (mobile):", error);
    return res.status(500).json({ error: "Failed to fetch waitlist entries" });
  }
});

router.delete("/:waitlistId", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { waitlistId } = req.params;

    if (!waitlistId) {
      return res.status(400).json({ error: "Waitlist ID is required" });
    }

    const result = await waitlistService.cancelWaitlistEntry(userId, waitlistId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ success: true, message: "Removed from waitlist" });
  } catch (error) {
    console.error("Error cancelling waitlist entry (mobile):", error);
    return res.status(500).json({ error: "Failed to remove from waitlist" });
  }
});

router.post("/:waitlistId/respond", waitlistRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { waitlistId } = req.params;

    if (!waitlistId) {
      return res.status(400).json({ error: "Waitlist ID is required" });
    }

    const parseResult = respondWaitlistSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(handleZodError(parseResult.error));
    }

    const result = await waitlistService.respondToNotification(userId, waitlistId, parseResult.data.response);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    if (parseResult.data.response === 'accepted') {
      return res.json({
        success: true,
        bookingId: result.bookingId,
        slotInfo: result.slotInfo,
        message: "Slot booked successfully!",
      });
    }

    return res.json({
      success: true,
      message: "Slot offer declined",
    });
  } catch (error) {
    console.error("Error responding to waitlist notification (mobile):", error);
    return res.status(500).json({ error: "Failed to respond to notification" });
  }
});

export default router;
