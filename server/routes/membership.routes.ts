import { Router, Request, Response } from 'express';
import { membershipService } from '../services/membership.service';
import { authenticateToken, requireSalonAccess } from '../middleware/auth';
import { rbacService } from '../services/rbacService';
import { insertMembershipPlanSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

const createMembershipPlanSchema = insertMembershipPlanSchema.omit({ salonId: true }).extend({
  includedServices: z.array(z.object({
    serviceId: z.string(),
    quantityPerMonth: z.number().int().positive(),
    isUnlimited: z.boolean().optional(),
  })).optional(),
});

const updateMembershipPlanSchema = createMembershipPlanSchema.partial();

router.post('/salons/:salonId/membership-plans', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { salonId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userSalons = await rbacService.getSalonsForUser(userId);
    const salonAccess = userSalons.find(s => s.salonId === salonId);
    const allowedRoles = ['business_owner', 'owner', 'manager', 'shop_admin'];
    
    if (!salonAccess || !allowedRoles.includes(salonAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to create membership plans for this salon' });
    }

    const validatedInput = createMembershipPlanSchema.parse(req.body);
    const result = await membershipService.createPlan(salonId, {
      ...validatedInput,
      validFrom: validatedInput.validFrom ? new Date(validatedInput.validFrom) : null,
      validUntil: validatedInput.validUntil ? new Date(validatedInput.validUntil) : null,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      plan: result.plan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error creating membership plan:', error);
    return res.status(500).json({ error: 'Failed to create membership plan' });
  }
});

router.get('/salons/:salonId/membership-plans', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { active } = req.query;

    const plans = await membershipService.getPlansForSalon(salonId, {
      activeOnly: active !== 'false',
      includeServices: true,
    });

    return res.json({
      success: true,
      plans,
      totalCount: plans.length,
    });
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    return res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
});

router.get('/salons/:salonId/membership-plans/manage', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const plans = await membershipService.getPlansForSalon(salonId, {
      activeOnly: false,
      includeServices: true,
    });

    return res.json({
      success: true,
      plans,
      totalCount: plans.length,
    });
  } catch (error) {
    console.error('Error fetching membership plans for management:', error);
    return res.status(500).json({ error: 'Failed to fetch membership plans' });
  }
});

router.get('/membership-plans/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const plan = await membershipService.getPlanById(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    return res.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error('Error fetching membership plan:', error);
    return res.status(500).json({ error: 'Failed to fetch membership plan' });
  }
});

router.put('/membership-plans/:planId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const plan = await membershipService.getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    const userSalons = await rbacService.getSalonsForUser(userId);
    const salonAccess = userSalons.find(s => s.salonId === plan.salonId);
    const allowedRoles = ['business_owner', 'owner', 'manager', 'shop_admin'];
    
    if (!salonAccess || !allowedRoles.includes(salonAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to update this membership plan' });
    }

    const validatedInput = updateMembershipPlanSchema.parse(req.body);
    const result = await membershipService.updatePlan(planId, plan.salonId, {
      ...validatedInput,
      validFrom: validatedInput.validFrom ? new Date(validatedInput.validFrom) : undefined,
      validUntil: validatedInput.validUntil ? new Date(validatedInput.validUntil) : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Membership plan updated successfully',
      plan: result.plan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error updating membership plan:', error);
    return res.status(500).json({ error: 'Failed to update membership plan' });
  }
});

router.delete('/membership-plans/:planId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const plan = await membershipService.getPlanById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Membership plan not found' });
    }

    const userSalons = await rbacService.getSalonsForUser(userId);
    const salonAccess = userSalons.find(s => s.salonId === plan.salonId);
    const allowedRoles = ['business_owner', 'owner', 'manager'];
    
    if (!salonAccess || !allowedRoles.includes(salonAccess.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this membership plan' });
    }

    const result = await membershipService.deletePlan(planId, plan.salonId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Membership plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting membership plan:', error);
    return res.status(500).json({ error: 'Failed to delete membership plan' });
  }
});

router.get('/salons/:salonId/members', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { status, limit, offset } = req.query;

    const result = await membershipService.getMembersForSalon(salonId, {
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.get('/salons/:salonId/membership-analytics', authenticateToken, requireSalonAccess(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const analytics = await membershipService.getMembershipAnalytics(salonId);

    return res.json({
      success: true,
      ...analytics,
    });
  } catch (error) {
    console.error('Error fetching membership analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/salons/:salonId/memberships/available', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const plans = await membershipService.getAvailablePlansForCustomer(salonId);

    return res.json({
      success: true,
      plans,
      totalCount: plans.length,
    });
  } catch (error) {
    console.error('Error fetching available plans:', error);
    return res.status(500).json({ error: 'Failed to fetch available plans' });
  }
});

router.get('/my/memberships', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const rawMemberships = await membershipService.getCustomerMemberships(userId);

    // Transform to flattened format expected by frontend (web and mobile)
    const memberships = rawMemberships.map((item: any) => ({
      id: item.membership.id,
      planId: item.membership.planId,
      customerId: item.membership.customerId,
      salonId: item.membership.salonId,
      status: item.membership.status,
      startDate: item.membership.startDate,
      endDate: item.membership.endDate,
      creditBalanceInPaisa: item.membership.creditBalanceInPaisa,
      remainingCreditsInPaisa: item.membership.creditBalanceInPaisa, // alias for mobile app
      pausedAt: item.membership.pausedAt,
      resumeDate: item.membership.resumeDate,
      resumedAt: item.membership.resumedAt,
      cancelledAt: item.membership.cancelledAt,
      createdAt: item.membership.createdAt,
      plan: {
        id: item.plan?.id,
        name: item.plan?.name,
        planType: item.plan?.planType,
        durationMonths: item.plan?.durationMonths,
        priceInPaisa: item.plan?.priceInPaisa,
        discountPercentage: item.plan?.discountPercentage,
        creditAmountInPaisa: item.plan?.creditAmountInPaisa,
        bonusPercentage: item.plan?.bonusPercentage,
        priorityBooking: item.plan?.priorityBooking,
      },
      salon: {
        id: item.salon?.id,
        name: item.salon?.name,
        address: item.salon?.address,
        city: item.salon?.city,
      },
    }));

    return res.json({
      success: true,
      memberships,
    });
  } catch (error) {
    console.error('Error fetching customer memberships:', error);
    return res.status(500).json({ error: 'Failed to fetch memberships' });
  }
});

router.get('/my/memberships/:membershipId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { membershipId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const membership = await membershipService.getCustomerMembershipById(membershipId, userId);

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    return res.json({
      success: true,
      membership,
    });
  } catch (error) {
    console.error('Error fetching membership details:', error);
    return res.status(500).json({ error: 'Failed to fetch membership' });
  }
});

router.post('/my/memberships/:membershipId/pause', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { membershipId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await membershipService.pauseMembership(membershipId, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Membership paused successfully',
    });
  } catch (error) {
    console.error('Error pausing membership:', error);
    return res.status(500).json({ error: 'Failed to pause membership' });
  }
});

router.post('/my/memberships/:membershipId/resume', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { membershipId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await membershipService.resumeMembership(membershipId, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Membership resumed successfully',
    });
  } catch (error) {
    console.error('Error resuming membership:', error);
    return res.status(500).json({ error: 'Failed to resume membership' });
  }
});

router.post('/my/memberships/:membershipId/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { membershipId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await membershipService.cancelMembership(membershipId, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Membership cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling membership:', error);
    return res.status(500).json({ error: 'Failed to cancel membership' });
  }
});

const purchaseMembershipSchema = z.object({
  planId: z.string(),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
});

// Calculate membership benefits for booking preview
const calculateBenefitsSchema = z.object({
  serviceIds: z.array(z.string()).min(1),
  originalTotalInPaisa: z.number().int().positive(),
});

router.post('/salons/:salonId/calculate-membership-benefits', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { salonId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedInput = calculateBenefitsSchema.parse(req.body);
    
    const benefits = await membershipService.calculateMembershipBenefits(
      userId,
      salonId,
      validatedInput.serviceIds,
      validatedInput.originalTotalInPaisa
    );

    return res.json({
      success: true,
      ...benefits,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error calculating membership benefits:', error);
    return res.status(500).json({ error: 'Failed to calculate membership benefits' });
  }
});

router.post('/memberships/purchase', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validatedInput = purchaseMembershipSchema.parse(req.body);
    
    const result = await membershipService.purchaseMembership(
      userId,
      validatedInput.planId,
      {
        razorpayPaymentId: validatedInput.razorpayPaymentId,
        razorpayOrderId: validatedInput.razorpayOrderId,
      }
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({
      success: true,
      message: 'Membership purchased successfully',
      membership: result.membership,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Error purchasing membership:', error);
    return res.status(500).json({ error: 'Failed to purchase membership' });
  }
});

export default router;
