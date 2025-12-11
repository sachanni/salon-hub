import { Router, Request, Response } from 'express';
import { lateArrivalService } from '../services/lateArrival.service';
import { authenticateToken, requireSalonAccess } from '../middleware/auth';
import { authenticateMobileUser } from '../middleware/authMobile';
import { rbacService } from '../services/rbacService';
import { 
  createLateArrivalNotificationSchema, 
  acknowledgeLateArrivalSchema,
  LATE_ARRIVAL_DELAY_OPTIONS,
} from '@shared/schema';
import { z } from 'zod';

const router = Router();

router.get('/delay-options', (req: Request, res: Response) => {
  res.json({
    success: true,
    options: LATE_ARRIVAL_DELAY_OPTIONS,
  });
});

router.get('/bookings/:bookingId/can-notify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await lateArrivalService.canSendLateNotification(userId, bookingId);
    return res.json(result);
  } catch (error) {
    console.error('Error checking late notification eligibility:', error);
    return res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

router.post('/notify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedInput = createLateArrivalNotificationSchema.parse(req.body);
    const result = await lateArrivalService.createLateNotification(userId, validatedInput);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      message: 'Late arrival notification sent to salon',
      notification: result.notification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating late notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.get('/bookings/:bookingId/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const notifications = await lateArrivalService.getLateNotificationsForBooking(bookingId);
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching late notification history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/customer/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notifications = await lateArrivalService.getCustomerLateNotificationHistory(userId);
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching customer notification history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/salons/:salonId/pending', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const notifications = await lateArrivalService.getPendingLateNotificationsForSalon(salonId);
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/salons/:salonId/history', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await lateArrivalService.getLateNotificationHistory(salonId, limit);
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.post('/:notificationId/acknowledge', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notification = await lateArrivalService.getLateNotificationById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const userSalons = await rbacService.getSalonsForUser(userId);
    const allowedRoles = ['business_owner', 'owner', 'manager', 'shop_admin'];
    const salonAccess = userSalons.find(s => s.salonId === notification.salonId);
    
    if (!salonAccess || !allowedRoles.includes(salonAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to acknowledge this notification' });
    }

    const validatedInput = acknowledgeLateArrivalSchema.parse(req.body);
    const result = await lateArrivalService.acknowledgeLateArrival(
      notificationId,
      userId,
      validatedInput
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Notification acknowledged',
      notification: result.notification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error acknowledging notification:', error);
    return res.status(500).json({ error: 'Failed to acknowledge notification' });
  }
});

export default router;

const mobileRouter = Router();

mobileRouter.get('/delay-options', (req: Request, res: Response) => {
  res.json({
    success: true,
    options: LATE_ARRIVAL_DELAY_OPTIONS,
  });
});

mobileRouter.get('/bookings/:bookingId/can-notify', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await lateArrivalService.canSendLateNotification(userId, bookingId);
    return res.json(result);
  } catch (error) {
    console.error('Error checking late notification eligibility:', error);
    return res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

mobileRouter.post('/notify', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedInput = createLateArrivalNotificationSchema.parse(req.body);
    const result = await lateArrivalService.createLateNotification(userId, validatedInput);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      message: 'Late arrival notification sent to salon',
      notification: result.notification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating late notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

mobileRouter.get('/customer/history', authenticateMobileUser, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notifications = await lateArrivalService.getCustomerLateNotificationHistory(userId);
    return res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching customer notification history:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export { mobileRouter as mobileLateArrivalRouter };
