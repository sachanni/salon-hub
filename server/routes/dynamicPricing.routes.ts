import { Router, Request, Response } from 'express';
import { dynamicPricingService } from '../services/dynamicPricing.service';
import { authenticateToken } from '../middleware/auth';
import { 
  createPricingRuleSchema, 
  updatePricingRuleSchema,
  createDemandOverrideSchema,
} from '@shared/schema';
import { z } from 'zod';
import { getDynamicPricingJobHealth } from '../jobs/dynamicPricingJobs';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    const jobHealth = getDynamicPricingJobHealth();
    return res.json({
      status: 'healthy',
      service: 'dynamic-pricing',
      jobs: jobHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dynamic pricing health:', error);
    return res.status(500).json({ 
      status: 'unhealthy',
      service: 'dynamic-pricing',
      error: 'Failed to fetch health status',
    });
  }
});

router.get('/salons/:salonId/demand-heatmap', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const result = await dynamicPricingService.getDemandHeatmap(salonId);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching demand heatmap:', error);
    return res.status(500).json({ error: 'Failed to fetch demand heatmap' });
  }
});

router.get('/salons/:salonId/slots/:date/pricing', async (req: Request, res: Response) => {
  try {
    const { salonId, date } = req.params;
    const { serviceId } = req.query;

    if (!salonId || !date) {
      return res.status(400).json({ error: 'Salon ID and date are required' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    const result = await dynamicPricingService.getSlotsPricingForDate(
      salonId,
      date,
      serviceId as string | undefined
    );

    return res.json(result);
  } catch (error) {
    console.error('Error fetching slot pricing:', error);
    return res.status(500).json({ error: 'Failed to fetch slot pricing' });
  }
});

router.post('/salons/:salonId/pricing-rules', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedInput = createPricingRuleSchema.parse(req.body);
    const result = await dynamicPricingService.createPricingRule(salonId, userId, validatedInput);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating pricing rule:', error);
    return res.status(500).json({ error: 'Failed to create pricing rule' });
  }
});

router.get('/salons/:salonId/pricing-rules', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await dynamicPricingService.getPricingRules(salonId, userId);

    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    return res.json({ rules: result.rules });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

router.put('/salons/:salonId/pricing-rules/:ruleId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId, ruleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedInput = updatePricingRuleSchema.parse(req.body);
    const result = await dynamicPricingService.updatePricingRule(salonId, ruleId, userId, validatedInput);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating pricing rule:', error);
    return res.status(500).json({ error: 'Failed to update pricing rule' });
  }
});

router.delete('/salons/:salonId/pricing-rules/:ruleId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId, ruleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await dynamicPricingService.deletePricingRule(salonId, ruleId, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ message: 'Pricing rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    return res.status(500).json({ error: 'Failed to delete pricing rule' });
  }
});

router.get('/salons/:salonId/pricing-analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await dynamicPricingService.getPricingAnalytics(salonId, userId);

    if (!result.success) {
      return res.status(403).json({ error: result.error });
    }

    return res.json(result.analytics);
  } catch (error) {
    console.error('Error fetching pricing analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch pricing analytics' });
  }
});

router.post('/salons/:salonId/demand-overrides', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedInput = createDemandOverrideSchema.parse(req.body);
    const result = await dynamicPricingService.createDemandOverride(salonId, userId, validatedInput);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.override);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating demand override:', error);
    return res.status(500).json({ error: 'Failed to create demand override' });
  }
});

router.get('/salons/:salonId/demand-overrides', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    const overrides = await dynamicPricingService.getDemandOverrides(salonId);
    return res.json({ overrides });
  } catch (error) {
    console.error('Error fetching demand overrides:', error);
    return res.status(500).json({ error: 'Failed to fetch demand overrides' });
  }
});

router.delete('/salons/:salonId/demand-overrides/:overrideId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId, overrideId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await dynamicPricingService.deleteDemandOverride(salonId, overrideId, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ message: 'Demand override deleted successfully' });
  } catch (error) {
    console.error('Error deleting demand override:', error);
    return res.status(500).json({ error: 'Failed to delete demand override' });
  }
});

router.post('/salons/:salonId/calculate-price', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { serviceId, bookingDate, bookingTime, basePrice } = req.body;

    if (!serviceId || !bookingDate || !bookingTime || basePrice === undefined) {
      return res.status(400).json({ 
        error: 'serviceId, bookingDate, bookingTime, and basePrice are required' 
      });
    }

    const result = await dynamicPricingService.calculatePriceForBooking(
      salonId,
      serviceId,
      bookingDate,
      bookingTime,
      basePrice
    );

    return res.json(result);
  } catch (error) {
    console.error('Error calculating price:', error);
    return res.status(500).json({ error: 'Failed to calculate price' });
  }
});

export default router;

export function registerMobileDynamicPricingRoutes(app: any, authenticateMobile: any) {
  // Mobile: Get demand heatmap (public)
  app.get('/api/mobile/salons/:salonId/demand-heatmap', async (req: Request, res: Response) => {
    try {
      const { salonId } = req.params;
      const result = await dynamicPricingService.getDemandHeatmap(salonId);
      return res.json(result);
    } catch (error) {
      console.error('Error fetching demand heatmap:', error);
      return res.status(500).json({ error: 'Failed to fetch demand heatmap' });
    }
  });

  // Mobile: Get slot pricing for date (public)
  app.get('/api/mobile/salons/:salonId/slots/:date/pricing', async (req: Request, res: Response) => {
    try {
      const { salonId, date } = req.params;
      const { serviceId } = req.query;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
      }

      const result = await dynamicPricingService.getSlotsPricingForDate(
        salonId,
        date,
        serviceId as string | undefined
      );

      return res.json(result);
    } catch (error) {
      console.error('Error fetching slot pricing:', error);
      return res.status(500).json({ error: 'Failed to fetch slot pricing' });
    }
  });

  // Mobile: Calculate price for booking (public)
  app.post('/api/mobile/salons/:salonId/calculate-price', async (req: Request, res: Response) => {
    try {
      const { salonId } = req.params;
      const { serviceId, bookingDate, bookingTime, basePrice } = req.body;

      if (!serviceId || !bookingDate || !bookingTime || basePrice === undefined) {
        return res.status(400).json({ 
          error: 'serviceId, bookingDate, bookingTime, and basePrice are required' 
        });
      }

      const result = await dynamicPricingService.calculatePriceForBooking(
        salonId,
        serviceId,
        bookingDate,
        bookingTime,
        basePrice
      );

      return res.json(result);
    } catch (error) {
      console.error('Error calculating price:', error);
      return res.status(500).json({ error: 'Failed to calculate price' });
    }
  });

  // Mobile: Get demand overrides (public)
  app.get('/api/mobile/salons/:salonId/demand-overrides', async (req: Request, res: Response) => {
    try {
      const { salonId } = req.params;
      const overrides = await dynamicPricingService.getDemandOverrides(salonId);
      return res.json({ overrides });
    } catch (error) {
      console.error('Error fetching demand overrides:', error);
      return res.status(500).json({ error: 'Failed to fetch demand overrides' });
    }
  });

  console.log('✅ Mobile Dynamic Pricing routes registered');
}
