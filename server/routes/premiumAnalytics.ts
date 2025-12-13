import { Router, Request, Response, NextFunction } from "express";
import { mlAnalyticsService } from "../services/mlAnalytics.service";
import { populateUserFromSession, type AuthenticatedRequest } from "../middleware/auth";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { staff, salons } from "@shared/schema";

const router = Router();

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }
  next();
}

async function verifySalonAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const userId = req.user?.id;
  const salonId = req.query.salonId as string;

  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (!salonId) {
    return res.status(400).json({ success: false, error: "salonId is required" });
  }

  const [salon] = await db
    .select()
    .from(salons)
    .where(eq(salons.id, salonId))
    .limit(1);

  if (!salon) {
    return res.status(404).json({ success: false, error: "Salon not found" });
  }

  if (salon.ownerId !== userId) {
    const [staffAccess] = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.salonId, salonId),
          eq(staff.userId, userId)
        )
      )
      .limit(1);

    if (!staffAccess) {
      return res.status(403).json({ success: false, error: "Access denied to this salon" });
    }
  }

  next();
}

async function verifyPremiumTier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const salonId = req.query.salonId as string;

  const isPremium = await mlAnalyticsService.isSalonPremium(salonId);
  if (!isPremium) {
    return res.status(403).json({
      success: false,
      error: "ML Analytics is a premium feature",
      upgradeRequired: true,
    });
  }

  next();
}

function getDateRange(req: Request): { startDate: string; endDate: string } {
  const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];
  let startDate = req.query.startDate as string;

  if (!startDate) {
    const days = parseInt(req.query.days as string) || 7;
    const start = new Date(endDate);
    start.setDate(start.getDate() - days);
    startDate = start.toISOString().split('T')[0];
  }

  return { startDate, endDate };
}

router.get(
  "/dashboard/overview",
  populateUserFromSession,
  requireAuth,
  verifySalonAccess,
  verifyPremiumTier,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const salonId = req.query.salonId as string;
      const dateRange = getDateRange(req);

      const data = await mlAnalyticsService.getOverviewKPIs(salonId, dateRange);

      res.json({
        success: true,
        data,
        meta: {
          salonId,
          dateRange,
          dataFreshness: mlAnalyticsService.getDataFreshness(),
        },
      });
    } catch (error) {
      console.error("Error fetching overview KPIs:", error);
      res.status(500).json({ success: false, error: "Failed to fetch analytics" });
    }
  }
);

router.get(
  "/predictions/accuracy",
  populateUserFromSession,
  requireAuth,
  verifySalonAccess,
  verifyPremiumTier,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const salonId = req.query.salonId as string;
      const dateRange = getDateRange(req);

      const data = await mlAnalyticsService.getPredictionAccuracyTrend(salonId, dateRange);

      res.json({
        success: true,
        data,
        meta: {
          salonId,
          dateRange,
          dataFreshness: mlAnalyticsService.getDataFreshness(),
        },
      });
    } catch (error) {
      console.error("Error fetching prediction accuracy:", error);
      res.status(500).json({ success: false, error: "Failed to fetch accuracy data" });
    }
  }
);

router.get(
  "/staff/performance",
  populateUserFromSession,
  requireAuth,
  verifySalonAccess,
  verifyPremiumTier,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const salonId = req.query.salonId as string;
      const dateRange = getDateRange(req);

      const data = await mlAnalyticsService.getStaffPerformance(salonId, dateRange);

      res.json({
        success: true,
        data,
        meta: {
          salonId,
          dateRange,
          dataFreshness: mlAnalyticsService.getDataFreshness(),
        },
      });
    } catch (error) {
      console.error("Error fetching staff performance:", error);
      res.status(500).json({ success: false, error: "Failed to fetch staff data" });
    }
  }
);

router.get(
  "/services/timing-trends",
  populateUserFromSession,
  requireAuth,
  verifySalonAccess,
  verifyPremiumTier,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const salonId = req.query.salonId as string;
      const dateRange = getDateRange(req);

      const [heatmapData, serviceTrends] = await Promise.all([
        mlAnalyticsService.getServiceTimingHeatmap(salonId, dateRange),
        mlAnalyticsService.getServiceTypeTrends(salonId),
      ]);

      res.json({
        success: true,
        data: {
          heatmap: heatmapData.heatmap,
          summary: heatmapData.summary,
          services: serviceTrends.services,
        },
        meta: {
          salonId,
          dateRange,
          dataFreshness: mlAnalyticsService.getDataFreshness(),
        },
      });
    } catch (error) {
      console.error("Error fetching timing trends:", error);
      res.status(500).json({ success: false, error: "Failed to fetch timing data" });
    }
  }
);

export default router;
