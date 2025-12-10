import { Router, Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { db } from '../db';
import { salons, subscriptionTiers, salonSubscriptions } from '@shared/schema';
import { eq, count, sql, and, gte, lte, desc } from 'drizzle-orm';
import { requireSuperAdmin, populateUserFromSession } from '../middleware/auth';

const router = Router();

router.get('/tiers', async (req: Request, res: Response) => {
  try {
    const tiers = await subscriptionService.getAllTiers();
    
    const formattedTiers = tiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      displayName: tier.displayName,
      description: tier.description,
      monthlyPrice: tier.monthlyPricePaisa / 100,
      yearlyPrice: tier.yearlyPricePaisa / 100,
      monthlyPricePaisa: tier.monthlyPricePaisa,
      yearlyPricePaisa: tier.yearlyPricePaisa,
      features: tier.features,
      limits: tier.limits,
    }));

    res.json({ tiers: formattedTiers });
  } catch (error: any) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({ error: 'Failed to fetch subscription tiers' });
  }
});

router.get('/salon/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const [salon] = await db.select().from(salons).where(eq(salons.id, salonId));
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    let subscription = await subscriptionService.getSalonSubscription(salonId);
    
    if (!subscription) {
      await subscriptionService.createFreeSubscription(salonId);
      subscription = await subscriptionService.getSalonSubscription(salonId);
    }

    if (!subscription) {
      return res.status(500).json({ error: 'Failed to get subscription' });
    }

    res.json({
      subscription: {
        id: subscription.subscription.id,
        status: subscription.subscription.status,
        billingCycle: subscription.subscription.billingCycle,
        currentPeriodStart: subscription.subscription.currentPeriodStart,
        currentPeriodEnd: subscription.subscription.currentPeriodEnd,
        trialEndsAt: subscription.subscription.trialEndsAt,
        nextPaymentAt: subscription.subscription.nextPaymentAt,
      },
      tier: subscription.tier ? {
        id: subscription.tier.id,
        name: subscription.tier.name,
        displayName: subscription.tier.displayName,
        features: subscription.tier.features,
        limits: subscription.tier.limits,
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching salon subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.get('/salon/:salonId/status', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const [salon] = await db.select().from(salons).where(eq(salons.id, salonId));
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    let subscription = await subscriptionService.getSalonSubscription(salonId);
    
    if (!subscription) {
      await subscriptionService.createFreeSubscription(salonId);
      subscription = await subscriptionService.getSalonSubscription(salonId);
    }

    if (!subscription) {
      return res.status(500).json({ error: 'Failed to get subscription' });
    }

    const normalizedStatus = subscription.subscription.status?.toLowerCase() as 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
    const normalizedTierSlug = subscription.tier?.name?.toLowerCase() || 'free';

    res.json({
      subscription: {
        id: subscription.subscription.id,
        salonId: subscription.subscription.salonId,
        tierId: subscription.subscription.tierId,
        status: normalizedStatus,
        billingCycle: subscription.subscription.billingCycle,
        currentPeriodStart: subscription.subscription.currentPeriodStart,
        currentPeriodEnd: subscription.subscription.currentPeriodEnd,
        trialEndsAt: subscription.subscription.trialEndsAt,
        tier: subscription.tier ? {
          id: subscription.tier.id,
          name: subscription.tier.name,
          slug: normalizedTierSlug,
          monthlyPricePaisa: subscription.tier.monthlyPricePaisa,
          yearlyPricePaisa: subscription.tier.yearlyPricePaisa,
          maxStaff: (subscription.tier.limits as any)?.maxStaff ?? null,
          maxServices: (subscription.tier.limits as any)?.maxServices ?? null,
          features: Object.keys((subscription.tier.features as object) || {}).filter(
            k => (subscription.tier?.features as any)?.[k] === true
          ),
        } : null,
      },
      tier: subscription.tier ? {
        id: subscription.tier.id,
        name: subscription.tier.name,
        slug: normalizedTierSlug,
        monthlyPricePaisa: subscription.tier.monthlyPricePaisa,
        yearlyPricePaisa: subscription.tier.yearlyPricePaisa,
        maxStaff: (subscription.tier.limits as any)?.maxStaff ?? null,
        maxServices: (subscription.tier.limits as any)?.maxServices ?? null,
        features: Object.keys((subscription.tier.features as object) || {}).filter(
          k => (subscription.tier?.features as any)?.[k] === true
        ),
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching salon subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

router.post('/salon/:salonId/start-trial', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { tierName, trialDays = 14 } = req.body;

    if (!tierName) {
      return res.status(400).json({ error: 'Tier name is required' });
    }

    const subscription = await subscriptionService.createTrialSubscription(salonId, tierName, trialDays);
    
    res.json({
      success: true,
      message: `${trialDays}-day trial started for ${tierName} tier`,
      subscription,
    });
  } catch (error: any) {
    console.error('Error starting trial:', error);
    res.status(500).json({ error: error.message || 'Failed to start trial' });
  }
});

router.post('/salon/:salonId/create-upgrade-order', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { tierName, billingCycle = 'monthly' } = req.body;

    if (!tierName) {
      return res.status(400).json({ error: 'Tier name is required' });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Billing cycle must be monthly or yearly' });
    }

    const order = await subscriptionService.createUpgradeOrder(salonId, tierName, billingCycle);
    
    res.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('Error creating upgrade order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

router.post('/salon/:salonId/verify-upgrade', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { 
      tierName, 
      billingCycle, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!tierName || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters' });
    }

    const subscription = await subscriptionService.verifyPaymentAndActivate(
      salonId,
      tierName,
      billingCycle || 'monthly',
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    res.json({
      success: true,
      message: `Subscription upgraded to ${tierName}`,
      subscription,
    });
  } catch (error: any) {
    console.error('Error verifying upgrade:', error);
    res.status(400).json({ error: error.message || 'Payment verification failed' });
  }
});

router.post('/salon/:salonId/cancel', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { reason } = req.body;

    const subscription = await subscriptionService.cancelSubscription(salonId, reason);

    res.json({
      success: true,
      message: 'Subscription cancelled. You have been moved to the Free tier.',
      subscription,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

router.get('/salon/:salonId/feature-access/:feature', async (req: Request, res: Response) => {
  try {
    const { salonId, feature } = req.params;

    const validFeatures = [
      'instagramBooking',
      'facebookBooking',
      'messengerBot',
      'reserveWithGoogle',
      'customBranding',
      'prioritySupport',
      'analyticsAdvanced',
      'apiAccess',
    ];

    if (!validFeatures.includes(feature)) {
      return res.status(400).json({ error: 'Invalid feature name' });
    }

    const hasAccess = await subscriptionService.checkFeatureAccess(salonId, feature as any);

    res.json({
      feature,
      hasAccess,
    });
  } catch (error: any) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ error: 'Failed to check feature access' });
  }
});

router.get('/salon/:salonId/payment-history', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const payments = await subscriptionService.getPaymentHistory(salonId, limit);

    res.json({
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amountPaisa / 100,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        createdAt: p.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

router.post('/initialize-tiers', async (req: Request, res: Response) => {
  try {
    await subscriptionService.initializeTiers();
    res.json({ success: true, message: 'Subscription tiers initialized' });
  } catch (error: any) {
    console.error('Error initializing tiers:', error);
    res.status(500).json({ error: 'Failed to initialize tiers' });
  }
});

// ==================== SUPER ADMIN TIER MANAGEMENT ====================

// Get all tiers for admin with comprehensive details and analytics
router.get('/admin/tiers', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    // Get all tiers with subscriber counts
    const tiers = await db.select().from(subscriptionTiers).orderBy(subscriptionTiers.sortOrder);
    
    // Get subscriber counts per tier
    const subscriberCounts = await db
      .select({
        tierId: salonSubscriptions.tierId,
        totalSubscribers: count(salonSubscriptions.id),
        activeSubscribers: sql<number>`SUM(CASE WHEN ${salonSubscriptions.status} = 'active' THEN 1 ELSE 0 END)`,
        trialingSubscribers: sql<number>`SUM(CASE WHEN ${salonSubscriptions.status} = 'trialing' THEN 1 ELSE 0 END)`,
      })
      .from(salonSubscriptions)
      .groupBy(salonSubscriptions.tierId);
    
    const countMap = subscriberCounts.reduce((acc, item) => {
      acc[item.tierId] = {
        total: parseInt(String(item.totalSubscribers)) || 0,
        active: parseInt(String(item.activeSubscribers)) || 0,
        trialing: parseInt(String(item.trialingSubscribers)) || 0,
      };
      return acc;
    }, {} as Record<string, any>);
    
    const tiersWithStats = tiers.map(tier => ({
      ...tier,
      subscribers: countMap[tier.id] || { total: 0, active: 0, trialing: 0 },
      monthlyRevenuePaisa: (countMap[tier.id]?.active || 0) * tier.monthlyPricePaisa,
    }));
    
    res.json({ tiers: tiersWithStats });
  } catch (error: any) {
    console.error('Error fetching tiers for admin:', error);
    res.status(500).json({ error: 'Failed to fetch subscription tiers' });
  }
});

// Get subscription analytics overview
router.get('/admin/analytics', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Total revenue from active subscriptions
    const revenueStats = await db
      .select({
        tierId: salonSubscriptions.tierId,
        tierName: subscriptionTiers.name,
        totalActive: count(salonSubscriptions.id),
        monthlyRevenuePaisa: sql<number>`SUM(CASE 
          WHEN ${salonSubscriptions.billingCycle} = 'monthly' THEN ${subscriptionTiers.monthlyPricePaisa}
          WHEN ${salonSubscriptions.billingCycle} = 'yearly' THEN ${subscriptionTiers.yearlyPricePaisa} / 12
          ELSE 0
        END)`,
      })
      .from(salonSubscriptions)
      .innerJoin(subscriptionTiers, eq(salonSubscriptions.tierId, subscriptionTiers.id))
      .where(eq(salonSubscriptions.status, 'active'))
      .groupBy(salonSubscriptions.tierId, subscriptionTiers.name);
    
    // Total subscriptions by status
    const statusCounts = await db
      .select({
        status: salonSubscriptions.status,
        count: count(salonSubscriptions.id),
      })
      .from(salonSubscriptions)
      .groupBy(salonSubscriptions.status);
    
    // New subscriptions in last 30 days
    const newSubscriptions = await db
      .select({
        count: count(salonSubscriptions.id),
      })
      .from(salonSubscriptions)
      .where(gte(salonSubscriptions.createdAt, thirtyDaysAgo));
    
    // Cancellations in last 30 days
    const cancellations = await db
      .select({
        count: count(salonSubscriptions.id),
      })
      .from(salonSubscriptions)
      .where(and(
        gte(salonSubscriptions.cancelledAt, thirtyDaysAgo),
        eq(salonSubscriptions.status, 'canceled')
      ));
    
    const totalMonthlyRevenue = revenueStats.reduce((sum, tier) => sum + (parseInt(String(tier.monthlyRevenuePaisa)) || 0), 0);
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = parseInt(String(item.count)) || 0;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      overview: {
        totalMonthlyRevenuePaisa: totalMonthlyRevenue,
        totalAnnualRevenuePaisa: totalMonthlyRevenue * 12,
        totalActive: statusMap.active || 0,
        totalTrialing: statusMap.trialing || 0,
        totalCanceled: statusMap.canceled || 0,
        totalPastDue: statusMap.past_due || 0,
        newSubscriptions30Days: parseInt(String(newSubscriptions[0]?.count)) || 0,
        cancellations30Days: parseInt(String(cancellations[0]?.count)) || 0,
      },
      revenueByTier: revenueStats.map(tier => ({
        tierId: tier.tierId,
        tierName: tier.tierName,
        activeSubscribers: parseInt(String(tier.totalActive)) || 0,
        monthlyRevenuePaisa: parseInt(String(tier.monthlyRevenuePaisa)) || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({ error: 'Failed to fetch subscription analytics' });
  }
});

// Get all active subscriptions with details
router.get('/admin/subscriptions', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { status, tierId, limit = 50, offset = 0 } = req.query;
    
    let query = db
      .select({
        subscription: salonSubscriptions,
        tier: subscriptionTiers,
        salon: salons,
      })
      .from(salonSubscriptions)
      .innerJoin(subscriptionTiers, eq(salonSubscriptions.tierId, subscriptionTiers.id))
      .innerJoin(salons, eq(salonSubscriptions.salonId, salons.id))
      .orderBy(desc(salonSubscriptions.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    const subscriptions = await query;
    
    res.json({
      subscriptions: subscriptions.map(sub => ({
        id: sub.subscription.id,
        salonId: sub.subscription.salonId,
        salonName: sub.salon.name,
        salonCity: sub.salon.city,
        tierName: sub.tier.name,
        tierDisplayName: sub.tier.displayName,
        status: sub.subscription.status,
        billingCycle: sub.subscription.billingCycle,
        currentPeriodStart: sub.subscription.currentPeriodStart,
        currentPeriodEnd: sub.subscription.currentPeriodEnd,
        trialEndsAt: sub.subscription.trialEndsAt,
        createdAt: sub.subscription.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions for admin:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Update a subscription tier with comprehensive controls
router.put('/admin/tiers/:tierId', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { tierId } = req.params;
    const { 
      displayName, 
      description, 
      monthlyPricePaisa, 
      yearlyPricePaisa, 
      features, 
      limits, 
      isActive, 
      sortOrder,
      trialDays,
      billingConfig 
    } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (monthlyPricePaisa !== undefined) updateData.monthlyPricePaisa = monthlyPricePaisa;
    if (yearlyPricePaisa !== undefined) updateData.yearlyPricePaisa = yearlyPricePaisa;
    if (features !== undefined) updateData.features = features;
    if (limits !== undefined) updateData.limits = limits;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [updatedTier] = await db
      .update(subscriptionTiers)
      .set(updateData)
      .where(eq(subscriptionTiers.id, tierId))
      .returning();

    if (!updatedTier) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    res.json({ tier: updatedTier, message: 'Tier updated successfully' });
  } catch (error: any) {
    console.error('Error updating tier:', error);
    res.status(500).json({ error: 'Failed to update tier' });
  }
});

// Create a new subscription tier
router.post('/admin/tiers', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      displayName, 
      description, 
      monthlyPricePaisa, 
      yearlyPricePaisa, 
      features, 
      limits, 
      sortOrder 
    } = req.body;

    if (!name || !displayName) {
      return res.status(400).json({ error: 'Name and display name are required' });
    }

    const [existingTier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.name, name.toLowerCase()));
    if (existingTier) {
      return res.status(400).json({ error: 'A tier with this name already exists' });
    }

    const [newTier] = await db
      .insert(subscriptionTiers)
      .values({
        name: name.toLowerCase(),
        displayName,
        description: description || '',
        monthlyPricePaisa: monthlyPricePaisa || 0,
        yearlyPricePaisa: yearlyPricePaisa || 0,
        features: features || {},
        limits: limits || {},
        isActive: 1,
        sortOrder: sortOrder || 99,
      })
      .returning();

    res.status(201).json({ tier: newTier, message: 'Tier created successfully' });
  } catch (error: any) {
    console.error('Error creating tier:', error);
    res.status(500).json({ error: 'Failed to create tier' });
  }
});

// Delete a subscription tier (soft delete by deactivating)
router.delete('/admin/tiers/:tierId', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { tierId } = req.params;

    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, tierId));
    if (!tier) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    if (tier.name === 'free') {
      return res.status(400).json({ error: 'Cannot delete the Free tier' });
    }

    await db
      .update(subscriptionTiers)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(subscriptionTiers.id, tierId));

    res.json({ message: 'Tier deactivated successfully' });
  } catch (error: any) {
    console.error('Error deleting tier:', error);
    res.status(500).json({ error: 'Failed to delete tier' });
  }
});

// Manually upgrade/downgrade a salon's subscription
router.post('/admin/subscriptions/:salonId/change-tier', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { tierId, reason } = req.body;

    if (!tierId) {
      return res.status(400).json({ error: 'Tier ID is required' });
    }

    // Verify tier exists
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, tierId));
    if (!tier) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    // Update the subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    const [existingSub] = await db
      .select()
      .from(salonSubscriptions)
      .where(eq(salonSubscriptions.salonId, salonId));
    
    if (existingSub) {
      await db
        .update(salonSubscriptions)
        .set({
          tierId,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(salonSubscriptions.salonId, salonId));
    } else {
      await db.insert(salonSubscriptions).values({
        salonId,
        tierId,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    }

    res.json({ 
      success: true, 
      message: `Salon subscription changed to ${tier.displayName}`,
      tier: tier.name,
    });
  } catch (error: any) {
    console.error('Error changing subscription tier:', error);
    res.status(500).json({ error: 'Failed to change subscription tier' });
  }
});

// Cancel a salon's subscription
router.post('/admin/subscriptions/:salonId/cancel', populateUserFromSession, requireSuperAdmin(), async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { reason } = req.body;

    // Get Free tier to downgrade to
    const [freeTier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.name, 'free'));
    if (!freeTier) {
      return res.status(500).json({ error: 'Free tier not configured' });
    }

    const now = new Date();
    
    await db
      .update(salonSubscriptions)
      .set({
        tierId: freeTier.id,
        status: 'canceled',
        cancelledAt: now,
        cancelReason: reason || 'Admin cancelled',
        updatedAt: now,
      })
      .where(eq(salonSubscriptions.salonId, salonId));

    res.json({ 
      success: true, 
      message: 'Subscription cancelled and downgraded to Free tier',
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
