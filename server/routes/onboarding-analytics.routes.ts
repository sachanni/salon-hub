import { Router, type Request, type Response } from "express";
import { requireSalonAccess, type AuthenticatedRequest } from "../middleware/auth";
import { onboardingAnalyticsService } from "../services/onboardingAnalyticsService";

const router = Router();

router.get(
  "/salons/:salonId/onboarding-analytics",
  requireSalonAccess(["owner", "shop_admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const analytics = await onboardingAnalyticsService.getFullAnalytics(salonId);

      res.json(analytics);
    } catch (error: any) {
      console.error("Error fetching onboarding analytics:", error);
      res.status(500).json({ error: "Failed to fetch onboarding analytics" });
    }
  }
);

router.get(
  "/salons/:salonId/onboarding-analytics/import",
  requireSalonAccess(["owner", "shop_admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const importMetrics = await onboardingAnalyticsService.getImportMetrics(salonId);

      res.json(importMetrics);
    } catch (error: any) {
      console.error("Error fetching import metrics:", error);
      res.status(500).json({ error: "Failed to fetch import metrics" });
    }
  }
);

router.get(
  "/salons/:salonId/onboarding-analytics/campaigns",
  requireSalonAccess(["owner", "shop_admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const campaignMetrics = await onboardingAnalyticsService.getCampaignMetrics(salonId);

      res.json(campaignMetrics);
    } catch (error: any) {
      console.error("Error fetching campaign metrics:", error);
      res.status(500).json({ error: "Failed to fetch campaign metrics" });
    }
  }
);

router.get(
  "/salons/:salonId/onboarding-analytics/conversions",
  requireSalonAccess(["owner", "shop_admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const conversionMetrics = await onboardingAnalyticsService.getConversionMetrics(salonId);

      res.json(conversionMetrics);
    } catch (error: any) {
      console.error("Error fetching conversion metrics:", error);
      res.status(500).json({ error: "Failed to fetch conversion metrics" });
    }
  }
);

router.get(
  "/salons/:salonId/onboarding-analytics/offers",
  requireSalonAccess(["owner", "shop_admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const offerMetrics = await onboardingAnalyticsService.getOfferMetrics(salonId);

      res.json(offerMetrics);
    } catch (error: any) {
      console.error("Error fetching offer metrics:", error);
      res.status(500).json({ error: "Failed to fetch offer metrics" });
    }
  }
);

router.get(
  "/salons/:salonId/onboarding-analytics/funnel",
  requireSalonAccess(["owner", "shop_admin"]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const funnel = await onboardingAnalyticsService.getConversionFunnel(salonId);

      res.json(funnel);
    } catch (error: any) {
      console.error("Error fetching conversion funnel:", error);
      res.status(500).json({ error: "Failed to fetch conversion funnel" });
    }
  }
);

export function registerOnboardingAnalyticsRoutes(app: any) {
  app.use("/api", router);
}

export default router;
