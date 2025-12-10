import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../db';
import { 
  subscriptionTiers, 
  salonSubscriptions, 
  subscriptionPayments,
  salons,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

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
        receipt: `sub_${salonId}_${Date.now()}`,
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

  async cancelSubscription(salonId: string, reason?: string) {
    const existing = await this.getSalonSubscription(salonId);
    if (!existing) {
      throw new Error('No active subscription found');
    }

    const freeTier = await this.getTierByName(SUBSCRIPTION_TIERS.FREE);
    const now = new Date();

    if (existing.subscription.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(existing.subscription.razorpaySubscriptionId);
      } catch (error) {
        console.error('Error cancelling Razorpay subscription:', error);
      }
    }

    await db
      .update(salonSubscriptions)
      .set({
        tierId: freeTier!.id,
        status: SUBSCRIPTION_STATUSES.CANCELLED,
        cancelledAt: now,
        cancelReason: reason,
        updatedAt: now,
      })
      .where(eq(salonSubscriptions.id, existing.subscription.id));

    return this.getSalonSubscription(salonId);
  }

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
}

export const subscriptionService = new SubscriptionService();
