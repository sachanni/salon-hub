import { Router, Request, Response, NextFunction, Express } from 'express';
import { storage } from '../storage';
import { rebookingService } from '../services/rebooking.service';
import { 
  createRebookingCycleSchema,
  updateRebookingCycleSchema,
  updateRebookingSettingsRequestSchema,
  dismissRebookingSchema
} from '@shared/schema';
import { z } from 'zod';
import { authenticateMobileUser } from '../middleware/authMobile';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: { id: string };
  salonId?: string;
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const requireSalonAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const salonId = req.params.salonId || req.body.salonId;
  if (!salonId) {
    return res.status(400).json({ error: 'Salon ID required' });
  }
  
  const salon = await storage.getSalon(salonId);
  if (!salon) {
    return res.status(404).json({ error: 'Salon not found' });
  }

  const hasAccess = salon.ownerId === req.user?.id || 
    await storage.isUserStaffOfSalon(req.user?.id || '', salonId);
  
  if (!hasAccess) {
    return res.status(403).json({ error: 'Access denied to this salon' });
  }

  req.salonId = salonId;
  next();
};

router.get('/settings/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await storage.getOrCreateRebookingSettings(req.salonId!);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching rebooking settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = updateRebookingSettingsRequestSchema.parse(req.body);
    
    const updateData: any = { ...validatedData };
    if (validatedData.isEnabled !== undefined) {
      updateData.isEnabled = validatedData.isEnabled ? 1 : 0;
    }
    if (validatedData.defaultReminderEnabled !== undefined) {
      updateData.defaultReminderEnabled = validatedData.defaultReminderEnabled ? 1 : 0;
    }
    if (validatedData.enableRebookingDiscount !== undefined) {
      updateData.enableRebookingDiscount = validatedData.enableRebookingDiscount ? 1 : 0;
    }
    if (validatedData.respectCustomerOptOut !== undefined) {
      updateData.respectCustomerOptOut = validatedData.respectCustomerOptOut ? 1 : 0;
    }
    if (validatedData.rebookingDiscountPercent !== undefined) {
      updateData.rebookingDiscountPercent = validatedData.rebookingDiscountPercent.toString();
    }
    
    await storage.updateRebookingSettings(req.salonId!, updateData);
    const updated = await storage.getRebookingSettings(req.salonId!);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating rebooking settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/cycles/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isActive = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
    const cycles = await storage.getServiceRebookingCyclesBySalonId(req.salonId!, { isActive });
    res.json(cycles);
  } catch (error) {
    console.error('Error fetching rebooking cycles:', error);
    res.status(500).json({ error: 'Failed to fetch cycles' });
  }
});

router.post('/cycles/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createRebookingCycleSchema.parse(req.body);
    
    const existing = await storage.getServiceRebookingCycleBySalonAndService(
      req.salonId!,
      validatedData.serviceId
    );
    
    if (existing) {
      return res.status(409).json({ error: 'Rebooking cycle already exists for this service' });
    }

    const cycle = await storage.createServiceRebookingCycle({
      salonId: req.salonId!,
      serviceId: validatedData.serviceId,
      recommendedDays: validatedData.recommendedDays,
      minDays: validatedData.minDays,
      maxDays: validatedData.maxDays,
      reminderEnabled: validatedData.reminderEnabled ? 1 : 0,
      firstReminderDays: validatedData.firstReminderDays,
      secondReminderDays: validatedData.secondReminderDays,
      reminderChannels: validatedData.reminderChannels,
      customMessage: validatedData.customMessage,
      createdBy: req.user?.id
    });

    res.status(201).json(cycle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error creating rebooking cycle:', error);
    res.status(500).json({ error: 'Failed to create cycle' });
  }
});

router.put('/cycles/:salonId/:cycleId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cycleId } = req.params;
    const validatedData = updateRebookingCycleSchema.parse(req.body);
    
    const updateData: any = { ...validatedData };
    if (validatedData.reminderEnabled !== undefined) {
      updateData.reminderEnabled = validatedData.reminderEnabled ? 1 : 0;
    }

    await storage.updateServiceRebookingCycle(cycleId, req.salonId!, updateData);
    const updated = await storage.getServiceRebookingCycle(cycleId);
    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error updating rebooking cycle:', error);
    res.status(500).json({ error: 'Failed to update cycle' });
  }
});

router.delete('/cycles/:salonId/:cycleId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cycleId } = req.params;
    await storage.deleteServiceRebookingCycle(cycleId, req.salonId!);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting rebooking cycle:', error);
    res.status(500).json({ error: 'Failed to delete cycle' });
  }
});

router.get('/stats/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;
    const stats = await storage.getCustomerRebookingStatsBySalonId(req.salonId!, {
      status: status as string | undefined
    });
    res.json(stats);
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/due/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const dueRebookings = await rebookingService.identifyDueRebookings(req.salonId!);
    
    const limitedResults = limit ? dueRebookings.slice(0, limit) : dueRebookings;
    
    const enrichedResults = await Promise.all(
      limitedResults.map(async (stat) => {
        const customer = await storage.getUserById(stat.customerId);
        const service = await storage.getService(stat.serviceId);
        return {
          ...stat,
          customerName: customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() : 'Unknown',
          customerEmail: customer?.email,
          customerPhone: customer?.phone,
          serviceName: service?.name || 'Unknown Service'
        };
      })
    );

    res.json(enrichedResults);
  } catch (error) {
    console.error('Error fetching due rebookings:', error);
    res.status(500).json({ error: 'Failed to fetch due rebookings' });
  }
});

router.get('/analytics/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dashboardAnalytics = await storage.getRebookingDashboardAnalytics(req.salonId!);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const reminderAnalytics = await storage.getRebookingReminderAnalytics(req.salonId!, startDate, new Date());

    res.json({
      dashboard: dashboardAnalytics,
      reminders: reminderAnalytics
    });
  } catch (error) {
    console.error('Error fetching rebooking analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.post('/schedule/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scheduledCount = await rebookingService.scheduleReminders(req.salonId!);
    res.json({ 
      success: true, 
      scheduledCount,
      message: `${scheduledCount} reminders scheduled` 
    });
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    res.status(500).json({ error: 'Failed to schedule reminders' });
  }
});

router.post('/process-reminders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const batchSize = req.body.batchSize || 50;
    const result = await rebookingService.processPendingReminders(batchSize);
    res.json({ 
      success: true,
      ...result,
      message: `Sent ${result.sent} reminders, ${result.failed} failed`
    });
  } catch (error) {
    console.error('Error processing reminders:', error);
    res.status(500).json({ error: 'Failed to process reminders' });
  }
});

router.get('/suggestions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const salonId = req.query.salonId as string | undefined;
    const suggestions = await rebookingService.getCustomerSuggestions(req.user!.id, salonId);
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

router.post('/dismiss', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = dismissRebookingSchema.parse(req.body);

    await rebookingService.dismissRebooking(
      req.user!.id,
      validatedData.serviceId,
      validatedData.salonId,
      validatedData.reason,
      validatedData.snoozeDays
    );

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid data', details: error.errors });
    }
    console.error('Error dismissing rebooking:', error);
    res.status(500).json({ error: 'Failed to dismiss rebooking' });
  }
});

router.post('/update-statuses/:salonId', requireAuth, requireSalonAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updatedCount = await rebookingService.updateRebookingStatuses(req.salonId!);
    res.json({ 
      success: true, 
      updatedCount,
      message: `${updatedCount} statuses updated`
    });
  } catch (error) {
    console.error('Error updating statuses:', error);
    res.status(500).json({ error: 'Failed to update statuses' });
  }
});

export function registerMobileRebookingRoutes(app: Express): void {
  app.get('/api/mobile/rebooking/suggestions', authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const salonId = req.query.salonId as string | undefined;
      const suggestions = await rebookingService.getCustomerSuggestions(userId, salonId);
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching mobile rebooking suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  });

  app.post('/api/mobile/rebooking/dismiss', authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const validatedData = dismissRebookingSchema.parse(req.body);

      await rebookingService.dismissRebooking(
        userId,
        validatedData.serviceId,
        validatedData.salonId,
        validatedData.reason,
        validatedData.snoozeDays
      );

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid data', details: error.errors });
      }
      console.error('Error dismissing mobile rebooking:', error);
      res.status(500).json({ error: 'Failed to dismiss rebooking' });
    }
  });
}

export default router;
