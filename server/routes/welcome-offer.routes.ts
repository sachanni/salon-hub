import express, { Router, Response } from 'express';
import { z } from 'zod';
import {
  createWelcomeOffer,
  getWelcomeOffer,
  getWelcomeOffersBySalon,
  updateWelcomeOffer,
  deleteWelcomeOffer,
  toggleWelcomeOfferActive,
  validateWelcomeOffer,
  redeemWelcomeOffer,
  getOfferRedemptions,
  checkImportedCustomerByPhone,
  autoApplyWelcomeOfferOnRegistration,
  getUserActiveOffers,
  formatOfferAmount,
  generateOfferCode,
} from '../services/welcomeOfferService';
import { requireSalonAccess, type AuthenticatedRequest } from '../middleware/auth';
import { authenticateMobileUser } from '../middleware/authMobile';
import { storage } from '../storage';

const router = Router();

const createOfferSchema = z.object({
  name: z.string().min(1, 'Offer name is required').max(255),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive('Discount value must be positive'),
  maxDiscountInPaisa: z.number().positive().optional(),
  minimumPurchaseInPaisa: z.number().positive().optional(),
  validityDays: z.number().min(1).max(365).optional().default(30),
  usageLimit: z.number().min(1).max(100).optional().default(1),
});

const updateOfferSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().positive().optional(),
  maxDiscountInPaisa: z.number().positive().nullable().optional(),
  minimumPurchaseInPaisa: z.number().positive().nullable().optional(),
  validityDays: z.number().min(1).max(365).optional(),
  usageLimit: z.number().min(1).max(100).optional(),
  isActive: z.number().min(0).max(1).optional(),
});

const redeemOfferSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  bookingAmountInPaisa: z.number().positive('Booking amount must be positive'),
});

const validateOfferSchema = z.object({
  bookingAmountInPaisa: z.number().positive('Booking amount must be positive'),
});

router.post(
  '/salons/:salonId/welcome-offers',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;

      const parseResult = createOfferSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      const offer = await createWelcomeOffer({
        salonId,
        ...parseResult.data,
      });

      res.status(201).json(offer);
    } catch (error: any) {
      console.error('Error creating welcome offer:', error);
      res.status(500).json({ error: error.message || 'Failed to create offer' });
    }
  }
);

router.get(
  '/salons/:salonId/welcome-offers',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId } = req.params;
      const offers = await getWelcomeOffersBySalon(salonId);
      res.json(offers);
    } catch (error: any) {
      console.error('Error fetching welcome offers:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch offers' });
    }
  }
);

router.get(
  '/salons/:salonId/welcome-offers/:offerId',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, offerId } = req.params;
      const offer = await getWelcomeOffer(offerId);

      if (!offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (offer.salonId !== salonId) {
        return res.status(403).json({ error: 'Offer does not belong to this salon' });
      }

      res.json(offer);
    } catch (error: any) {
      console.error('Error fetching welcome offer:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch offer' });
    }
  }
);

router.put(
  '/salons/:salonId/welcome-offers/:offerId',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, offerId } = req.params;

      const existingOffer = await getWelcomeOffer(offerId);
      if (!existingOffer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (existingOffer.salonId !== salonId) {
        return res.status(403).json({ error: 'Offer does not belong to this salon' });
      }

      const parseResult = updateOfferSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      const offer = await updateWelcomeOffer(offerId, parseResult.data);
      res.json(offer);
    } catch (error: any) {
      console.error('Error updating welcome offer:', error);
      res.status(500).json({ error: error.message || 'Failed to update offer' });
    }
  }
);

router.delete(
  '/salons/:salonId/welcome-offers/:offerId',
  requireSalonAccess(['owner']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, offerId } = req.params;

      const existingOffer = await getWelcomeOffer(offerId);
      if (!existingOffer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (existingOffer.salonId !== salonId) {
        return res.status(403).json({ error: 'Offer does not belong to this salon' });
      }

      const result = await deleteWelcomeOffer(offerId);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Offer deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting welcome offer:', error);
      res.status(500).json({ error: error.message || 'Failed to delete offer' });
    }
  }
);

router.post(
  '/salons/:salonId/welcome-offers/:offerId/toggle',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, offerId } = req.params;

      const existingOffer = await getWelcomeOffer(offerId);
      if (!existingOffer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (existingOffer.salonId !== salonId) {
        return res.status(403).json({ error: 'Offer does not belong to this salon' });
      }

      const offer = await toggleWelcomeOfferActive(offerId);
      res.json(offer);
    } catch (error: any) {
      console.error('Error toggling welcome offer:', error);
      res.status(500).json({ error: error.message || 'Failed to toggle offer' });
    }
  }
);

router.post(
  '/salons/:salonId/welcome-offers/:offerId/validate',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { offerId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parseResult = validateOfferSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      const result = await validateWelcomeOffer(
        offerId,
        userId,
        parseResult.data.bookingAmountInPaisa
      );

      res.json({
        valid: result.valid,
        discountInPaisa: result.discount,
        discountFormatted: result.offer ? formatOfferAmount(result.offer) : null,
        reason: result.reason,
      });
    } catch (error: any) {
      console.error('Error validating welcome offer:', error);
      res.status(500).json({ error: error.message || 'Failed to validate offer' });
    }
  }
);

router.post(
  '/salons/:salonId/welcome-offers/:offerId/redeem',
  requireSalonAccess(['owner', 'shop_admin', 'staff']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, offerId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const existingOffer = await getWelcomeOffer(offerId);
      if (!existingOffer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (existingOffer.salonId !== salonId) {
        return res.status(403).json({ error: 'Offer does not belong to this salon' });
      }

      const parseResult = redeemOfferSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.errors,
        });
      }

      const result = await redeemWelcomeOffer(
        offerId,
        userId,
        parseResult.data.bookingId,
        parseResult.data.bookingAmountInPaisa
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        message: 'Offer redeemed successfully',
        redemption: result.redemption,
        discountAppliedInPaisa: result.redemption?.discountAppliedInPaisa,
      });
    } catch (error: any) {
      console.error('Error redeeming welcome offer:', error);
      res.status(500).json({ error: error.message || 'Failed to redeem offer' });
    }
  }
);

router.get(
  '/salons/:salonId/welcome-offers/:offerId/redemptions',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { salonId, offerId } = req.params;
      const { limit, offset } = req.query;

      const existingOffer = await getWelcomeOffer(offerId);
      if (!existingOffer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (existingOffer.salonId !== salonId) {
        return res.status(403).json({ error: 'Offer does not belong to this salon' });
      }

      const result = await getOfferRedemptions(offerId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching redemptions:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch redemptions' });
    }
  }
);

router.get(
  '/salons/:salonId/welcome-offers/generate-code',
  requireSalonAccess(['owner', 'shop_admin']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prefix } = req.query;
      const code = generateOfferCode(prefix as string || 'WELCOME');
      res.json({ code });
    } catch (error: any) {
      console.error('Error generating offer code:', error);
      res.status(500).json({ error: error.message || 'Failed to generate code' });
    }
  }
);

router.get(
  '/mobile/check-imported-customer',
  authenticateMobileUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await storage.getUserById(userId);
      if (!user || !user.phone) {
        return res.status(400).json({ error: 'No verified phone number on account' });
      }

      const result = await checkImportedCustomerByPhone(user.phone);
      res.json(result);
    } catch (error: any) {
      console.error('Error checking imported customer:', error);
      res.status(500).json({ error: error.message || 'Failed to check customer' });
    }
  }
);

router.post(
  '/mobile/apply-welcome-offers',
  authenticateMobileUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.phone) {
        return res.status(400).json({ error: 'No verified phone number on account' });
      }

      const result = await autoApplyWelcomeOfferOnRegistration(userId, user.phone);
      res.json(result);
    } catch (error: any) {
      console.error('Error applying welcome offers:', error);
      res.status(500).json({ error: error.message || 'Failed to apply offers' });
    }
  }
);

router.get(
  '/mobile/my-offers',
  authenticateMobileUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const offers = await getUserActiveOffers(userId);
      
      res.json({
        offers: offers.map(({ redemption, offer }) => ({
          redemptionId: redemption.id,
          offerId: offer.id,
          offerName: offer.name,
          salonId: offer.salonId,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          discountFormatted: formatOfferAmount(offer),
          maxDiscountInPaisa: offer.maxDiscountInPaisa,
          minimumPurchaseInPaisa: offer.minimumPurchaseInPaisa,
          expiresAt: redemption.expiresAt,
          status: redemption.status,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching user offers:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch offers' });
    }
  }
);

export function registerWelcomeOfferRoutes(app: express.Application): void {
  app.use('/api', router);
}

export default router;
