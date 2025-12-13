import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../db';
import { 
  subscriptionTiers, 
  salonSubscriptions, 
  subscriptionPayments,
  subscriptionRefunds,
  razorpayWebhookEvents,
  salons,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES
} from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export interface TierFeatures {
  instagramBooking: boolean;
  facebookBooking: boolean;
  messengerBot: boolean;
  reserveWithGoogle: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  analyticsAdvanced: boolean;
  apiAccess: boolean;
}

export interface TierLimits {
  maxStaff: number;
  maxServices: number;
  maxLocations: number;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  razorpayRefundId?: string;
  refundAmount?: number;
  message: string;
}

const TIER_CONFIGS: Record<string, { features: TierFeatures; limits: TierLimits; monthlyPricePaisa: number; yearlyPricePaisa: number }> = {
  [SUBSCRIPTION_TIERS.FREE]: {
    features: {
      instagramBooking: false,
      facebookBooking: false,
      messengerBot: false,
      reserveWithGoogle: false,
      customBranding: false,
      prioritySupport: false,
      analyticsAdvanced: false,
      apiAccess: false,
    },
    limits: {
      maxStaff: 3,
      maxServices: 10,
      maxLocations: 1,
    },
    monthlyPricePaisa: 0,
    yearlyPricePaisa: 0,
  },
  [SUBSCRIPTION_TIERS.GROWTH]: {
    features: {
      instagramBooking: true,
      facebookBooking: true,
      messengerBot: false,
      reserveWithGoogle: false,
      customBranding: false,
      prioritySupport: true,
      analyticsAdvanced: true,
      apiAccess: false,
    },
    limits: {
      maxStaff: 10,
      maxServices: 50,
      maxLocations: 2,
    },
    monthlyPricePaisa: 99900,
    yearlyPricePaisa: 999900,
  },
  [SUBSCRIPTION_TIERS.ELITE]: {
    features: {
      instagramBooking: true,
      facebookBooking: true,
      messengerBot: true,
      reserveWithGoogle: true,
      customBranding: true,
      prioritySupport: true,
      analyticsAdvanced: true,
      apiAccess: true,
    },
    limits: {
      maxStaff: -1,
      maxServices: -1,
      maxLocations: 5,
    },
    monthlyPricePaisa: 199900,
    yearlyPricePaisa: 1999900,
  },
};

// Industry standard refund policies
const REFUND_POLICIES = {
  FULL_REFUND_DAYS: 7,           // Full refund within 7 days of payment
  PRORATED_REFUND_DAYS: 30,     // Prorated refund up to 30 days
  MIN_REFUND_AMOUNT_PAISA: 100, // Minimum refund ₹1 (Razorpay requirement)
  GRACE_PERIOD_DAYS: 3,         // Days after period end before downgrade
  MAX_PAYMENT_RETRIES: 3,       // Max failed payments before downgrade
};

export class SubscriptionService {
  async initializeTiers(): Promise<void> {
    const existingTiers = await db.select().from(subscriptionTiers);
    
    if (existingTiers.length === 0) {
      const tierData = [
        {
          name: SUBSCRIPTION_TIERS.FREE,
          displayName: 'Free',
          description: 'Basic salon listing and booking features',
          monthlyPricePaisa: TIER_CONFIGS.free.monthlyPricePaisa,
          yearlyPricePaisa: TIER_CONFIGS.free.yearlyPricePaisa,
          features: JSON.stringify(TIER_CONFIGS.free.features),
          limits: JSON.stringify(TIER_CONFIGS.free.limits),
          sortOrder: 0,
        },
        {
          name: SUBSCRIPTION_TIERS.GROWTH,
          displayName: 'Growth',
          description: 'Instagram & Facebook booking buttons, priority support',
          monthlyPricePaisa: TIER_CONFIGS.growth.monthlyPricePaisa,
          yearlyPricePaisa: TIER_CONFIGS.growth.yearlyPricePaisa,
          features: JSON.stringify(TIER_CONFIGS.growth.features),
          limits: JSON.stringify(TIER_CONFIGS.growth.limits),
          sortOrder: 1,
        },
        {
          name: SUBSCRIPTION_TIERS.ELITE,
          displayName: 'Elite',
          description: 'All Growth features + Reserve with Google, Messenger bot, API access',
          monthlyPricePaisa: TIER_CONFIGS.elite.monthlyPricePaisa,
          yearlyPricePaisa: TIER_CONFIGS.elite.yearlyPricePaisa,
          features: JSON.stringify(TIER_CONFIGS.elite.features),
          limits: JSON.stringify(TIER_CONFIGS.elite.limits),
          sortOrder: 2,
        },
      ];

      for (const tier of tierData) {
        await db.insert(subscriptionTiers).values(tier);
      }
      console.log('✅ Subscription tiers initialized');
    }
  }

  async getAllTiers() {
    return db.select().from(subscriptionTiers).orderBy(subscriptionTiers.sortOrder);
  }

  async getTierById(tierId: string) {
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, tierId));
    return tier;
  }

  async getTierByName(tierName: string) {
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.name, tierName));
    return tier;
  }

  async getSalonSubscription(salonId: string) {
    const [subscription] = await db
      .select({
        subscription: salonSubscriptions,
        tier: subscriptionTiers,
      })
      .from(salonSubscriptions)
      .leftJoin(subscriptionTiers, eq(salonSubscriptions.tierId, subscriptionTiers.id))
      .where(eq(salonSubscriptions.salonId, salonId))
      .orderBy(desc(salonSubscriptions.createdAt))
      .limit(1);
    
    return subscription;
  }

  async createFreeSubscription(salonId: string) {
    const freeTier = await this.getTierByName(SUBSCRIPTION_TIERS.FREE);
    if (!freeTier) {
      throw new Error('Free tier not found. Please initialize tiers first.');
    }

    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(nextYear.getFullYear() + 100);

    const [subscription] = await db.insert(salonSubscriptions).values({
      salonId,
      tierId: freeTier.id,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
      billingCycle: 'none',
      currentPeriodStart: now,
      currentPeriodEnd: nextYear,
    }).returning();

    return subscription;
  }

  async createTrialSubscription(salonId: string, tierName: string, trialDays: number = 14) {
    const tier = await this.getTierByName(tierName);
    if (!tier) {
      throw new Error(`Tier ${tierName} not found`);
    }

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    const existing = await this.getSalonSubscription(salonId);
    if (existing) {
      await db
        .update(salonSubscriptions)
        .set({
          tierId: tier.id,
          status: SUBSCRIPTION_STATUSES.TRIALING,
          trialEndsAt: trialEnd,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          updatedAt: now,
        })
        .where(eq(salonSubscriptions.id, existing.subscription.id));
      
      return this.getSalonSubscription(salonId);
    }

    const [subscription] = await db.insert(salonSubscriptions).values({
      salonId,
      tierId: tier.id,
      status: SUBSCRIPTION_STATUSES.TRIALING,
      billingCycle: 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
    }).returning();

    return subscription;
  }

  async createRazorpaySubscription(salonId: string, tierName: string, billingCycle: 'monthly' | 'yearly') {
    const tier = await this.getTierByName(tierName);
    if (!tier) {
      throw new Error(`Tier ${tierName} not found`);
    }

    if (tier.name === SUBSCRIPTION_TIERS.FREE) {
      return this.createFreeSubscription(salonId);
    }

    const [salon] = await db.select().from(salons).where(eq(salons.id, salonId));
    if (!salon) {
      throw new Error('Salon not found');
    }

    const amount = billingCycle === 'monthly' ? tier.monthlyPricePaisa : tier.yearlyPricePaisa;
    const period = billingCycle === 'monthly' ? 'monthly' : 'yearly';
    const intervalCount = billingCycle === 'monthly' ? 1 : 12;

    try {
      const plan = await razorpay.plans.create({
        period,
        interval: intervalCount,
        item: {
          name: `${tier.displayName} Plan - ${billingCycle}`,
          amount,
          currency: 'INR',
          description: tier.description || '',
        },
      });

      const rzpSubscription = await razorpay.subscriptions.create({
        plan_id: plan.id,
        total_count: billingCycle === 'monthly' ? 120 : 10,
        quantity: 1,
        customer_notify: 1,
        notes: {
          salonId,
          tierName,
        },
      });

      const now = new Date();
      const periodEnd = new Date(now);
      if (billingCycle === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      const existing = await this.getSalonSubscription(salonId);
      if (existing) {
        await db
          .update(salonSubscriptions)
          .set({
            tierId: tier.id,
            status: SUBSCRIPTION_STATUSES.ACTIVE,
            billingCycle,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            razorpaySubscriptionId: rzpSubscription.id,
            razorpayPlanId: plan.id,
            nextPaymentAt: periodEnd,
            updatedAt: now,
          })
          .where(eq(salonSubscriptions.id, existing.subscription.id));
      } else {
        await db.insert(salonSubscriptions).values({
          salonId,
          tierId: tier.id,
          status: SUBSCRIPTION_STATUSES.ACTIVE,
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          razorpaySubscriptionId: rzpSubscription.id,
          razorpayPlanId: plan.id,
          nextPaymentAt: periodEnd,
        });
      }

      return {
        subscriptionId: rzpSubscription.id,
        shortUrl: rzpSubscription.short_url,
        status: rzpSubscription.status,
      };
    } catch (error: any) {
      console.error('Razorpay subscription creation error:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async createUpgradeOrder(salonId: string, tierName: string, billingCycle: 'monthly' | 'yearly') {
    const tier = await this.getTierByName(tierName);
    if (!tier) {
      throw new Error(`Tier ${tierName} not found`);
    }

    const amount = billingCycle === 'monthly' ? tier.monthlyPricePaisa : tier.yearlyPricePaisa;

    try {
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `sub_${salonId.substring(0, 8)}_${Date.now()}`.substring(0, 40),
        notes: {
          salonId,
          tierName,
          billingCycle,
          type: 'subscription_upgrade',
        },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async verifyPaymentAndActivate(
    salonId: string,
    tierName: string,
    billingCycle: 'monthly' | 'yearly',
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const sign = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign)
      .digest('hex');

    if (razorpaySignature !== expectedSign) {
      throw new Error('Invalid payment signature');
    }

    const tier = await this.getTierByName(tierName);
    if (!tier) {
      throw new Error(`Tier ${tierName} not found`);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const existing = await this.getSalonSubscription(salonId);
    let subscriptionId: string;

    if (existing) {
      await db
        .update(salonSubscriptions)
        .set({
          tierId: tier.id,
          status: SUBSCRIPTION_STATUSES.ACTIVE,
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          lastPaymentAt: now,
          nextPaymentAt: periodEnd,
          failedPaymentCount: 0,
          updatedAt: now,
        })
        .where(eq(salonSubscriptions.id, existing.subscription.id));
      subscriptionId = existing.subscription.id;
    } else {
      const [newSub] = await db.insert(salonSubscriptions).values({
        salonId,
        tierId: tier.id,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        lastPaymentAt: now,
        nextPaymentAt: periodEnd,
      }).returning();
      subscriptionId = newSub.id;
    }

    const amount = billingCycle === 'monthly' ? tier.monthlyPricePaisa : tier.yearlyPricePaisa;

    await db.insert(subscriptionPayments).values({
      subscriptionId,
      salonId,
      amountPaisa: amount,
      status: 'paid',
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      periodStart: now,
      periodEnd,
    });

    return this.getSalonSubscription(salonId);
  }

  // ==================== REFUND METHODS (Industry Standard) ====================

  /**
   * Calculate prorated refund amount based on unused days
   * Industry standard: Refund = (Original Amount * Unused Days) / Total Days
   */
  calculateProratedRefund(
    originalAmountPaisa: number,
    periodStart: Date,
    periodEnd: Date,
    cancellationDate: Date = new Date()
  ): { refundAmountPaisa: number; daysUsed: number; totalDays: number; refundType: 'full' | 'prorated' | 'none' } {
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysUsed = Math.ceil((cancellationDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const unusedDays = Math.max(0, totalDays - daysUsed);

    // Full refund within first 7 days (industry standard)
    if (daysUsed <= REFUND_POLICIES.FULL_REFUND_DAYS) {
      return {
        refundAmountPaisa: originalAmountPaisa,
        daysUsed,
        totalDays,
        refundType: 'full',
      };
    }

    // Prorated refund calculation
    const refundAmountPaisa = Math.floor((originalAmountPaisa * unusedDays) / totalDays);

    // No refund if amount is below minimum or no unused days
    if (refundAmountPaisa < REFUND_POLICIES.MIN_REFUND_AMOUNT_PAISA || unusedDays <= 0) {
      return {
        refundAmountPaisa: 0,
        daysUsed,
        totalDays,
        refundType: 'none',
      };
    }

    return {
      refundAmountPaisa,
      daysUsed,
      totalDays,
      refundType: 'prorated',
    };
  }

  /**
   * Process refund via Razorpay
   * Handles full, prorated, and partial refunds
   */
  async processRefund(
    salonId: string,
    reason?: string,
    requestedBy?: string
  ): Promise<RefundResult> {
    const subscription = await this.getSalonSubscription(salonId);
    if (!subscription) {
      return { success: false, message: 'No subscription found' };
    }

    // Get the last successful payment for this subscription
    const [lastPayment] = await db
      .select()
      .from(subscriptionPayments)
      .where(and(
        eq(subscriptionPayments.salonId, salonId),
        eq(subscriptionPayments.status, 'paid')
      ))
      .orderBy(desc(subscriptionPayments.createdAt))
      .limit(1);

    if (!lastPayment || !lastPayment.razorpayPaymentId) {
      return { success: false, message: 'No refundable payment found' };
    }

    // Calculate refund amount
    const refundCalc = this.calculateProratedRefund(
      lastPayment.amountPaisa,
      subscription.subscription.currentPeriodStart,
      subscription.subscription.currentPeriodEnd
    );

    if (refundCalc.refundType === 'none' || refundCalc.refundAmountPaisa === 0) {
      return { 
        success: false, 
        message: 'No refund applicable. Subscription period has been mostly used.' 
      };
    }

    try {
      // Create refund via Razorpay API
      const razorpayRefund = await razorpay.payments.refund(lastPayment.razorpayPaymentId, {
        amount: refundCalc.refundAmountPaisa,
        speed: 'normal', // 'normal' (5-7 days) or 'optimum' (instant if possible)
        notes: {
          salonId,
          subscriptionId: subscription.subscription.id,
          refundType: refundCalc.refundType,
          reason: reason || 'Subscription cancellation',
        },
        receipt: `ref_${salonId.substring(0, 6)}_${Date.now()}`.substring(0, 40),
      });

      // Record refund in database
      const [refundRecord] = await db.insert(subscriptionRefunds).values({
        paymentId: lastPayment.id,
        subscriptionId: subscription.subscription.id,
        salonId,
        originalAmountPaisa: lastPayment.amountPaisa,
        refundAmountPaisa: refundCalc.refundAmountPaisa,
        refundType: refundCalc.refundType,
        reason,
        status: 'processing',
        razorpayRefundId: razorpayRefund.id,
        razorpayPaymentId: lastPayment.razorpayPaymentId,
        daysUsed: refundCalc.daysUsed,
        totalDays: refundCalc.totalDays,
        requestedBy,
      }).returning();

      return {
        success: true,
        refundId: refundRecord.id,
        razorpayRefundId: razorpayRefund.id,
        refundAmount: refundCalc.refundAmountPaisa / 100,
        message: `Refund of ₹${(refundCalc.refundAmountPaisa / 100).toFixed(2)} initiated. Will be processed within 5-7 business days.`,
      };
    } catch (error: any) {
      console.error('Razorpay refund error:', error);

      // Record failed refund attempt
      await db.insert(subscriptionRefunds).values({
        paymentId: lastPayment.id,
        subscriptionId: subscription.subscription.id,
        salonId,
        originalAmountPaisa: lastPayment.amountPaisa,
        refundAmountPaisa: refundCalc.refundAmountPaisa,
        refundType: refundCalc.refundType,
        reason,
        status: 'failed',
        razorpayPaymentId: lastPayment.razorpayPaymentId,
        failureReason: error.message,
        daysUsed: refundCalc.daysUsed,
        totalDays: refundCalc.totalDays,
        requestedBy,
      });

      return {
        success: false,
        message: `Refund failed: ${error.message}. Please contact support.`,
      };
    }
  }

  /**
   * Cancel subscription with optional refund processing
   * Industry standard: User retains access until current period ends (grace period)
   */
  async cancelSubscription(
    salonId: string, 
    reason?: string, 
    processRefund: boolean = true,
    requestedBy?: string
  ): Promise<{ subscription: any; refund?: RefundResult }> {
    const existing = await this.getSalonSubscription(salonId);
    if (!existing) {
      throw new Error('No active subscription found');
    }

    const now = new Date();
    let refundResult: RefundResult | undefined;

    // Process refund if requested and subscription is paid
    if (processRefund && existing.tier?.name !== SUBSCRIPTION_TIERS.FREE) {
      refundResult = await this.processRefund(salonId, reason, requestedBy);
    }

    // Cancel Razorpay subscription if exists
    if (existing.subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(existing.subscription.razorpaySubscriptionId, {
          cancel_at_cycle_end: false, // Immediate cancellation
        });
      } catch (error) {
        console.error('Error cancelling Razorpay subscription:', error);
      }
    }

    // Update subscription status
    // Industry standard: Keep current tier until period end (grace period)
    const gracePeriodEnd = new Date(existing.subscription.currentPeriodEnd);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + REFUND_POLICIES.GRACE_PERIOD_DAYS);

    await db
      .update(salonSubscriptions)
      .set({
        status: SUBSCRIPTION_STATUSES.CANCELLED,
        cancelledAt: now,
        cancelReason: reason,
        updatedAt: now,
        // Don't immediately downgrade - keep tier until period end
      })
      .where(eq(salonSubscriptions.id, existing.subscription.id));

    const updatedSubscription = await this.getSalonSubscription(salonId);

    return {
      subscription: updatedSubscription,
      refund: refundResult,
    };
  }

  /**
   * Handle expired subscriptions - downgrade to free tier
   * Called by background job after grace period ends
   */
  async handleExpiredSubscriptions(): Promise<number> {
    const now = new Date();
    const gracePeriodAgo = new Date(now);
    gracePeriodAgo.setDate(gracePeriodAgo.getDate() - REFUND_POLICIES.GRACE_PERIOD_DAYS);

    const freeTier = await this.getTierByName(SUBSCRIPTION_TIERS.FREE);
    if (!freeTier) {
      console.error('Free tier not found');
      return 0;
    }

    // Find cancelled subscriptions past grace period
    const expiredSubs = await db
      .select()
      .from(salonSubscriptions)
      .where(and(
        eq(salonSubscriptions.status, SUBSCRIPTION_STATUSES.CANCELLED),
        lte(salonSubscriptions.currentPeriodEnd, gracePeriodAgo)
      ));

    let downgradeCount = 0;
    for (const sub of expiredSubs) {
      if (sub.tierId !== freeTier.id) {
        await db
          .update(salonSubscriptions)
          .set({
            tierId: freeTier.id,
            status: SUBSCRIPTION_STATUSES.EXPIRED,
            updatedAt: now,
          })
          .where(eq(salonSubscriptions.id, sub.id));
        downgradeCount++;
      }
    }

    if (downgradeCount > 0) {
      console.log(`[Subscription] Downgraded ${downgradeCount} expired subscriptions to free tier`);
    }

    return downgradeCount;
  }

  // ==================== PAUSE/RESUME FUNCTIONALITY ====================

  /**
   * Pause subscription - keeps data but suspends billing
   * Industry standard: Max pause duration is typically 3 months
   */
  async pauseSubscription(salonId: string, pauseUntil?: Date): Promise<any> {
    const subscription = await this.getSalonSubscription(salonId);
    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.tier?.name === SUBSCRIPTION_TIERS.FREE) {
      throw new Error('Cannot pause free subscription');
    }

    const now = new Date();
    const maxPauseDate = new Date(now);
    maxPauseDate.setMonth(maxPauseDate.getMonth() + 3); // Max 3 months pause

    const pauseEnd = pauseUntil && pauseUntil < maxPauseDate ? pauseUntil : maxPauseDate;

    // Pause Razorpay subscription if exists
    if (subscription.subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.pause(subscription.subscription.razorpaySubscriptionId);
      } catch (error) {
        console.error('Error pausing Razorpay subscription:', error);
      }
    }

    await db
      .update(salonSubscriptions)
      .set({
        status: 'paused',
        updatedAt: now,
      })
      .where(eq(salonSubscriptions.id, subscription.subscription.id));

    return this.getSalonSubscription(salonId);
  }

  /**
   * Resume paused subscription
   */
  async resumeSubscription(salonId: string): Promise<any> {
    const subscription = await this.getSalonSubscription(salonId);
    if (!subscription) {
      throw new Error('No subscription found');
    }

    if (subscription.subscription.status !== 'paused') {
      throw new Error('Subscription is not paused');
    }

    // Resume Razorpay subscription if exists
    if (subscription.subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.resume(subscription.subscription.razorpaySubscriptionId);
      } catch (error) {
        console.error('Error resuming Razorpay subscription:', error);
      }
    }

    const now = new Date();
    await db
      .update(salonSubscriptions)
      .set({
        status: SUBSCRIPTION_STATUSES.ACTIVE,
        updatedAt: now,
      })
      .where(eq(salonSubscriptions.id, subscription.subscription.id));

    return this.getSalonSubscription(salonId);
  }

  // ==================== FAILED PAYMENT HANDLING (Dunning) ====================

  /**
   * Handle failed payment - increment counter and potentially downgrade
   * Industry standard dunning: 3 retries over 7 days, then downgrade
   */
  async handleFailedPayment(salonId: string, paymentId: string, failureReason: string): Promise<void> {
    const subscription = await this.getSalonSubscription(salonId);
    if (!subscription) return;

    const newFailedCount = (subscription.subscription.failedPaymentCount || 0) + 1;
    const now = new Date();

    // Record failed payment
    await db.insert(subscriptionPayments).values({
      subscriptionId: subscription.subscription.id,
      salonId,
      amountPaisa: subscription.tier?.monthlyPricePaisa || 0,
      status: 'failed',
      razorpayPaymentId: paymentId,
      failureReason,
      periodStart: now,
      periodEnd: now,
    });

    // Update subscription with failed count
    const updateData: any = {
      failedPaymentCount: newFailedCount,
      updatedAt: now,
    };

    // After max retries, mark as past_due
    if (newFailedCount >= REFUND_POLICIES.MAX_PAYMENT_RETRIES) {
      updateData.status = SUBSCRIPTION_STATUSES.PAST_DUE;
      console.log(`[Subscription] Salon ${salonId} marked as past_due after ${newFailedCount} failed payments`);
    }

    await db
      .update(salonSubscriptions)
      .set(updateData)
      .where(eq(salonSubscriptions.id, subscription.subscription.id));
  }

  /**
   * Handle successful payment after failures - reset counter
   */
  async handleSuccessfulPayment(salonId: string, paymentId: string, amountPaisa: number): Promise<void> {
    const subscription = await this.getSalonSubscription(salonId);
    if (!subscription) return;

    const now = new Date();
    const periodEnd = new Date(now);
    
    if (subscription.subscription.billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Record successful payment
    await db.insert(subscriptionPayments).values({
      subscriptionId: subscription.subscription.id,
      salonId,
      amountPaisa,
      status: 'paid',
      razorpayPaymentId: paymentId,
      periodStart: now,
      periodEnd,
    });

    // Reset failed count and update subscription
    await db
      .update(salonSubscriptions)
      .set({
        status: SUBSCRIPTION_STATUSES.ACTIVE,
        failedPaymentCount: 0,
        lastPaymentAt: now,
        nextPaymentAt: periodEnd,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      })
      .where(eq(salonSubscriptions.id, subscription.subscription.id));
  }

  // ==================== WEBHOOK HANDLING ====================

  /**
   * Verify Razorpay webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Check if webhook event was already processed (idempotency)
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(razorpayWebhookEvents)
      .where(eq(razorpayWebhookEvents.eventId, eventId));
    
    return !!existing && existing.status === 'processed';
  }

  /**
   * Record webhook event for idempotency
   */
  async recordWebhookEvent(eventId: string, eventType: string, payload: any, status: 'received' | 'processed' | 'failed', errorMessage?: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(razorpayWebhookEvents)
      .where(eq(razorpayWebhookEvents.eventId, eventId));

    if (existing) {
      await db
        .update(razorpayWebhookEvents)
        .set({
          status,
          processedAt: status === 'processed' ? new Date() : null,
          errorMessage,
          retryCount: existing.retryCount + 1,
        })
        .where(eq(razorpayWebhookEvents.id, existing.id));
    } else {
      await db.insert(razorpayWebhookEvents).values({
        eventId,
        eventType,
        payload,
        status,
        processedAt: status === 'processed' ? new Date() : null,
        errorMessage,
      });
    }
  }

  // ==================== EXISTING METHODS ====================

  async checkFeatureAccess(salonId: string, feature: keyof TierFeatures): Promise<boolean> {
    const subscription = await this.getSalonSubscription(salonId);
    
    if (!subscription || !subscription.tier) {
      return false;
    }

    if (subscription.subscription.status !== SUBSCRIPTION_STATUSES.ACTIVE && 
        subscription.subscription.status !== SUBSCRIPTION_STATUSES.TRIALING) {
      return false;
    }

    const features = subscription.tier.features as TierFeatures;
    return features[feature] === true;
  }

  async getPaymentHistory(salonId: string, limit: number = 10) {
    return db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.salonId, salonId))
      .orderBy(desc(subscriptionPayments.createdAt))
      .limit(limit);
  }

  async getRefundHistory(salonId: string, limit: number = 10) {
    return db
      .select()
      .from(subscriptionRefunds)
      .where(eq(subscriptionRefunds.salonId, salonId))
      .orderBy(desc(subscriptionRefunds.createdAt))
      .limit(limit);
  }

  /**
   * Get refund estimate without processing
   */
  async getRefundEstimate(salonId: string): Promise<{
    eligible: boolean;
    refundAmount?: number;
    refundType?: string;
    daysUsed?: number;
    totalDays?: number;
    message: string;
  }> {
    const subscription = await this.getSalonSubscription(salonId);
    if (!subscription || subscription.tier?.name === SUBSCRIPTION_TIERS.FREE) {
      return { eligible: false, message: 'No paid subscription to refund' };
    }

    const [lastPayment] = await db
      .select()
      .from(subscriptionPayments)
      .where(and(
        eq(subscriptionPayments.salonId, salonId),
        eq(subscriptionPayments.status, 'paid')
      ))
      .orderBy(desc(subscriptionPayments.createdAt))
      .limit(1);

    if (!lastPayment) {
      return { eligible: false, message: 'No refundable payment found' };
    }

    const refundCalc = this.calculateProratedRefund(
      lastPayment.amountPaisa,
      subscription.subscription.currentPeriodStart,
      subscription.subscription.currentPeriodEnd
    );

    if (refundCalc.refundType === 'none') {
      return {
        eligible: false,
        daysUsed: refundCalc.daysUsed,
        totalDays: refundCalc.totalDays,
        message: 'No refund available. Most of the subscription period has been used.',
      };
    }

    return {
      eligible: true,
      refundAmount: refundCalc.refundAmountPaisa / 100,
      refundType: refundCalc.refundType,
      daysUsed: refundCalc.daysUsed,
      totalDays: refundCalc.totalDays,
      message: refundCalc.refundType === 'full' 
        ? 'Full refund available (within 7-day cancellation window)'
        : `Prorated refund of ₹${(refundCalc.refundAmountPaisa / 100).toFixed(2)} available for ${refundCalc.totalDays - refundCalc.daysUsed} unused days`,
    };
  }
}

export const subscriptionService = new SubscriptionService();
