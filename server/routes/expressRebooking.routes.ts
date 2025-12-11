import { Router, Request, Response, NextFunction, Express } from 'express';
import { expressRebookingService } from '../services/expressRebooking.service';
import { 
  quickRebookSchema, 
  customizeRebookSchema, 
  dismissRebookSuggestionSchema 
} from '@shared/schema';
import { z } from 'zod';
import { authenticateMobileUser } from '../middleware/authMobile';
import rateLimit from 'express-rate-limit';

const router = Router();

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

const quickBookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many booking attempts. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/suggestions', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await expressRebookingService.getSuggestionsForUser(req.user!.id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching express rebook suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

router.post('/quick', requireAuth, quickBookLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = quickRebookSchema.parse(req.body);
    const result = await expressRebookingService.quickBook(req.user!.id, validatedData.suggestionId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error processing quick rebook:', error);
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

router.post('/customize', requireAuth, quickBookLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = customizeRebookSchema.parse(req.body);
    const result = await expressRebookingService.customizeBook(
      req.user!.id,
      validatedData.suggestionId,
      validatedData.modifications
    );

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error processing customized rebook:', error);
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

router.post('/dismiss', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = dismissRebookSuggestionSchema.parse(req.body);
    const result = await expressRebookingService.dismissSuggestion(
      req.user!.id,
      validatedData.suggestionId,
      validatedData.reason
    );

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    console.error('Error dismissing suggestion:', error);
    res.status(500).json({ error: 'Failed to dismiss suggestion' });
  }
});

router.get('/last-booking/:salonId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const result = await expressRebookingService.getLastBookingForSalon(req.user!.id, salonId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching last booking:', error);
    res.status(500).json({ error: 'Failed to fetch last booking' });
  }
});

export function registerMobileExpressRebookingRoutes(app: Express): void {
  const mobileQuickBookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many booking attempts. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/api/mobile/express-rebook/suggestions', authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await expressRebookingService.getSuggestionsForUser(userId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching mobile express rebook suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
  });

  app.post('/api/mobile/express-rebook/quick', authenticateMobileUser, mobileQuickBookLimiter, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const validatedData = quickRebookSchema.parse(req.body);
      const result = await expressRebookingService.quickBook(userId, validatedData.suggestionId);

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error processing mobile quick rebook:', error);
      res.status(500).json({ error: 'Failed to process booking' });
    }
  });

  app.post('/api/mobile/express-rebook/customize', authenticateMobileUser, mobileQuickBookLimiter, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const validatedData = customizeRebookSchema.parse(req.body);
      const result = await expressRebookingService.customizeBook(
        userId,
        validatedData.suggestionId,
        validatedData.modifications
      );

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error processing mobile customized rebook:', error);
      res.status(500).json({ error: 'Failed to process booking' });
    }
  });

  app.post('/api/mobile/express-rebook/dismiss', authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const validatedData = dismissRebookSuggestionSchema.parse(req.body);
      const result = await expressRebookingService.dismissSuggestion(
        userId,
        validatedData.suggestionId,
        validatedData.reason
      );

      if (result.success) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      console.error('Error dismissing mobile suggestion:', error);
      res.status(500).json({ error: 'Failed to dismiss suggestion' });
    }
  });

  app.get('/api/mobile/express-rebook/last-booking/:salonId', authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { salonId } = req.params;
      const result = await expressRebookingService.getLastBookingForSalon(userId, salonId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching mobile last booking:', error);
      res.status(500).json({ error: 'Failed to fetch last booking' });
    }
  });

  console.log('✅ Mobile Express Rebooking routes registered');
}

export default router;
