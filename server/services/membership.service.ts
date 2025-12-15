import { db } from '../db';
import { 
  membershipPlans, 
  membershipPlanServices, 
  customerMemberships,
  membershipServiceUsage,
  membershipCreditTransactions,
  membershipPayments,
  services,
  users,
  salons,
  InsertMembershipPlan,
  InsertMembershipPlanService,
  MembershipPlan,
} from '@shared/schema';
import { eq, and, desc, sql, gte, lte, count, sum } from 'drizzle-orm';

export interface CreateMembershipPlanInput extends Omit<InsertMembershipPlan, 'salonId'> {
  includedServices?: {
    serviceId: string;
    quantityPerMonth: number;
    isUnlimited?: boolean;
  }[];
}

export interface UpdateMembershipPlanInput extends Partial<CreateMembershipPlanInput> {}

class MembershipService {
  async createPlan(salonId: string, input: CreateMembershipPlanInput): Promise<{ success: boolean; plan?: MembershipPlan; error?: string }> {
    try {
      const { includedServices, ...planData } = input;

      if (planData.planType === 'packaged' && (!includedServices || includedServices.length === 0)) {
        return { success: false, error: 'Packaged plans must include at least one service' };
      }

      if (planData.planType === 'discount') {
        if (!planData.discountPercentage) {
          return { success: false, error: 'Discount plans must specify a discount percentage' };
        }
        if (planData.discountPercentage < 1 || planData.discountPercentage > 100) {
          return { success: false, error: 'Discount percentage must be between 1 and 100' };
        }
      }

      if (planData.planType === 'credit' && !planData.creditAmountInPaisa) {
        return { success: false, error: 'Credit plans must specify a credit amount' };
      }

      if (includedServices && includedServices.length > 0) {
        const serviceIds = includedServices.map(s => s.serviceId);
        const salonServices = await db.select({ id: services.id })
          .from(services)
          .where(and(
            eq(services.salonId, salonId),
            sql`${services.id} = ANY(${serviceIds})`
          ));
        
        const validServiceIds = new Set(salonServices.map(s => s.id));
        const invalidServices = serviceIds.filter(id => !validServiceIds.has(id));
        
        if (invalidServices.length > 0) {
          return { success: false, error: `Services not found in this salon: ${invalidServices.join(', ')}` };
        }
      }

      const [plan] = await db.insert(membershipPlans).values({
        ...planData,
        salonId,
      }).returning();

      if (includedServices && includedServices.length > 0 && planData.planType === 'packaged') {
        const serviceEntries = includedServices.map(s => ({
          planId: plan.id,
          serviceId: s.serviceId,
          salonId,
          quantityPerMonth: s.quantityPerMonth,
          isUnlimited: s.isUnlimited ? 1 : 0,
        }));
        await db.insert(membershipPlanServices).values(serviceEntries);
      }

      return { success: true, plan };
    } catch (error) {
      console.error('Error creating membership plan:', error);
      return { success: false, error: 'Failed to create membership plan' };
    }
  }

  async getPlansForSalon(salonId: string, options: { activeOnly?: boolean; includeServices?: boolean } = {}): Promise<MembershipPlan[]> {
    const { activeOnly = true, includeServices = true } = options;

    let whereClause = eq(membershipPlans.salonId, salonId);
    
    if (activeOnly) {
      whereClause = and(eq(membershipPlans.salonId, salonId), eq(membershipPlans.isActive, 1)) as any;
    }

    const plans = await db.select().from(membershipPlans).where(whereClause).orderBy(membershipPlans.sortOrder);

    if (includeServices) {
      const plansWithServices = await Promise.all(
        plans.map(async (plan) => {
          if (plan.planType === 'packaged') {
            const includedServices = await db
              .select({
                id: membershipPlanServices.id,
                serviceId: membershipPlanServices.serviceId,
                quantityPerMonth: membershipPlanServices.quantityPerMonth,
                isUnlimited: membershipPlanServices.isUnlimited,
                serviceName: services.name,
                servicePrice: services.priceInPaisa,
              })
              .from(membershipPlanServices)
              .leftJoin(services, eq(membershipPlanServices.serviceId, services.id))
              .where(eq(membershipPlanServices.planId, plan.id));

            return { ...plan, includedServices };
          }
          return plan;
        })
      );
      return plansWithServices;
    }

    return plans;
  }

  async getPlanById(planId: string): Promise<MembershipPlan | null> {
    const [plan] = await db.select().from(membershipPlans).where(eq(membershipPlans.id, planId));
    
    if (!plan) return null;

    if (plan.planType === 'packaged') {
      const includedServices = await db
        .select({
          id: membershipPlanServices.id,
          serviceId: membershipPlanServices.serviceId,
          quantityPerMonth: membershipPlanServices.quantityPerMonth,
          isUnlimited: membershipPlanServices.isUnlimited,
          serviceName: services.name,
          servicePrice: services.priceInPaisa,
        })
        .from(membershipPlanServices)
        .leftJoin(services, eq(membershipPlanServices.serviceId, services.id))
        .where(eq(membershipPlanServices.planId, plan.id));

      return { ...plan, includedServices } as any;
    }

    return plan;
  }

  async updatePlan(planId: string, salonId: string, input: UpdateMembershipPlanInput): Promise<{ success: boolean; plan?: MembershipPlan; error?: string }> {
    try {
      const { includedServices, ...planData } = input;

      const [existingPlan] = await db.select().from(membershipPlans)
        .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.salonId, salonId)));

      if (!existingPlan) {
        return { success: false, error: 'Plan not found' };
      }

      const effectivePlanType = planData.planType || existingPlan.planType;

      if (effectivePlanType === 'packaged') {
        if (includedServices !== undefined && includedServices.length === 0) {
          return { success: false, error: 'Packaged plans must include at least one service' };
        }
        if (planData.planType === 'packaged' && existingPlan.planType !== 'packaged' && (!includedServices || includedServices.length === 0)) {
          return { success: false, error: 'Packaged plans must include at least one service' };
        }
      }

      if (effectivePlanType === 'discount') {
        const effectiveDiscount = planData.discountPercentage ?? existingPlan.discountPercentage;
        if (!effectiveDiscount) {
          return { success: false, error: 'Discount plans must specify a discount percentage' };
        }
        if (planData.discountPercentage !== undefined && (planData.discountPercentage < 1 || planData.discountPercentage > 100)) {
          return { success: false, error: 'Discount percentage must be between 1 and 100' };
        }
      }

      if (effectivePlanType === 'credit') {
        const effectiveCredit = planData.creditAmountInPaisa ?? existingPlan.creditAmountInPaisa;
        if (!effectiveCredit) {
          return { success: false, error: 'Credit plans must specify a credit amount' };
        }
      }

      if (includedServices && includedServices.length > 0) {
        const serviceIds = includedServices.map(s => s.serviceId);
        const salonServices = await db.select({ id: services.id })
          .from(services)
          .where(and(
            eq(services.salonId, salonId),
            sql`${services.id} = ANY(${serviceIds})`
          ));
        
        const validServiceIds = new Set(salonServices.map(s => s.id));
        const invalidServices = serviceIds.filter(id => !validServiceIds.has(id));
        
        if (invalidServices.length > 0) {
          return { success: false, error: `Services not found in this salon: ${invalidServices.join(', ')}` };
        }
      }

      const [updatedPlan] = await db.update(membershipPlans)
        .set({
          ...planData,
          updatedAt: new Date(),
        })
        .where(eq(membershipPlans.id, planId))
        .returning();

      if (effectivePlanType === 'packaged') {
        if (includedServices !== undefined) {
          await db.delete(membershipPlanServices).where(eq(membershipPlanServices.planId, planId));

          if (includedServices.length > 0) {
            const serviceEntries = includedServices.map(s => ({
              planId,
              serviceId: s.serviceId,
              salonId,
              quantityPerMonth: s.quantityPerMonth,
              isUnlimited: s.isUnlimited ? 1 : 0,
            }));
            await db.insert(membershipPlanServices).values(serviceEntries);
          }
        }
      } else if (existingPlan.planType === 'packaged' && planData.planType && planData.planType !== 'packaged') {
        await db.delete(membershipPlanServices).where(eq(membershipPlanServices.planId, planId));
      }

      return { success: true, plan: updatedPlan };
    } catch (error) {
      console.error('Error updating membership plan:', error);
      return { success: false, error: 'Failed to update membership plan' };
    }
  }

  async deletePlan(planId: string, salonId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [existingPlan] = await db.select().from(membershipPlans)
        .where(and(eq(membershipPlans.id, planId), eq(membershipPlans.salonId, salonId)));

      if (!existingPlan) {
        return { success: false, error: 'Plan not found' };
      }

      const activeMembers = await db.select({ count: count() }).from(customerMemberships)
        .where(and(
          eq(customerMemberships.planId, planId),
          eq(customerMemberships.status, 'active')
        ));

      if (activeMembers[0].count > 0) {
        await db.update(membershipPlans)
          .set({ isActive: 0, updatedAt: new Date() })
          .where(eq(membershipPlans.id, planId));
        return { success: true };
      }

      await db.delete(membershipPlans).where(eq(membershipPlans.id, planId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting membership plan:', error);
      return { success: false, error: 'Failed to delete membership plan' };
    }
  }

  async getMembersForSalon(salonId: string, options: { status?: string; limit?: number; offset?: number } = {}) {
    const { status, limit = 50, offset = 0 } = options;

    let whereClause = eq(customerMemberships.salonId, salonId);
    if (status) {
      whereClause = and(whereClause, eq(customerMemberships.status, status)) as any;
    }

    const members = await db
      .select({
        membership: customerMemberships,
        customer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          profileImageUrl: users.profileImageUrl,
        },
        plan: {
          id: membershipPlans.id,
          name: membershipPlans.name,
          planType: membershipPlans.planType,
        },
      })
      .from(customerMemberships)
      .leftJoin(users, eq(customerMemberships.customerId, users.id))
      .leftJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
      .where(whereClause)
      .orderBy(desc(customerMemberships.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalCount] = await db.select({ count: count() }).from(customerMemberships).where(whereClause);

    return {
      members,
      totalCount: totalCount.count,
      limit,
      offset,
    };
  }

  async getMembershipAnalytics(salonId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [activeMembersResult] = await db.select({ count: count() })
      .from(customerMemberships)
      .where(and(
        eq(customerMemberships.salonId, salonId),
        eq(customerMemberships.status, 'active')
      ));

    const [totalMembersResult] = await db.select({ count: count() })
      .from(customerMemberships)
      .where(eq(customerMemberships.salonId, salonId));

    const [revenueResult] = await db.select({ total: sum(membershipPayments.amountInPaisa) })
      .from(membershipPayments)
      .where(and(
        eq(membershipPayments.salonId, salonId),
        eq(membershipPayments.paymentStatus, 'completed')
      ));

    const [monthlyRevenueResult] = await db.select({ total: sum(membershipPayments.amountInPaisa) })
      .from(membershipPayments)
      .where(and(
        eq(membershipPayments.salonId, salonId),
        eq(membershipPayments.paymentStatus, 'completed'),
        gte(membershipPayments.paidAt, thirtyDaysAgo)
      ));

    const [newMembersResult] = await db.select({ count: count() })
      .from(customerMemberships)
      .where(and(
        eq(customerMemberships.salonId, salonId),
        gte(customerMemberships.createdAt, thirtyDaysAgo)
      ));

    const [cancelledResult] = await db.select({ count: count() })
      .from(customerMemberships)
      .where(and(
        eq(customerMemberships.salonId, salonId),
        eq(customerMemberships.status, 'cancelled'),
        gte(customerMemberships.cancelledAt, thirtyDaysAgo)
      ));

    const membersByPlan = await db
      .select({
        planId: membershipPlans.id,
        planName: membershipPlans.name,
        planType: membershipPlans.planType,
        count: count(),
      })
      .from(customerMemberships)
      .leftJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
      .where(and(
        eq(customerMemberships.salonId, salonId),
        eq(customerMemberships.status, 'active')
      ))
      .groupBy(membershipPlans.id, membershipPlans.name, membershipPlans.planType);

    const churnRate = totalMembersResult.count > 0 
      ? (cancelledResult.count / totalMembersResult.count) * 100 
      : 0;

    return {
      activeMembers: activeMembersResult.count,
      totalMembers: totalMembersResult.count,
      totalRevenue: revenueResult.total ? Number(revenueResult.total) : 0,
      monthlyRevenue: monthlyRevenueResult.total ? Number(monthlyRevenueResult.total) : 0,
      newMembersThisMonth: newMembersResult.count,
      cancelledThisMonth: cancelledResult.count,
      churnRate: Math.round(churnRate * 100) / 100,
      membersByPlan,
    };
  }

  async getCustomerMemberships(customerId: string) {
    const memberships = await db
      .select({
        membership: customerMemberships,
        plan: {
          id: membershipPlans.id,
          name: membershipPlans.name,
          planType: membershipPlans.planType,
          durationMonths: membershipPlans.durationMonths,
          priceInPaisa: membershipPlans.priceInPaisa,
          discountPercentage: membershipPlans.discountPercentage,
          creditAmountInPaisa: membershipPlans.creditAmountInPaisa,
          bonusPercentage: membershipPlans.bonusPercentage,
          priorityBooking: membershipPlans.priorityBooking,
        },
        salon: {
          id: salons.id,
          name: salons.name,
          address: salons.address,
          city: salons.city,
        },
      })
      .from(customerMemberships)
      .leftJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
      .leftJoin(salons, eq(customerMemberships.salonId, salons.id))
      .where(eq(customerMemberships.customerId, customerId))
      .orderBy(desc(customerMemberships.createdAt));

    return memberships;
  }

  async getCustomerMembershipById(membershipId: string, customerId: string) {
    const [membership] = await db
      .select({
        membership: customerMemberships,
        plan: membershipPlans,
        salon: {
          id: salons.id,
          name: salons.name,
          address: salons.address,
        },
      })
      .from(customerMemberships)
      .leftJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
      .leftJoin(salons, eq(customerMemberships.salonId, salons.id))
      .where(and(
        eq(customerMemberships.id, membershipId),
        eq(customerMemberships.customerId, customerId)
      ));

    if (!membership) return null;

    if (membership.plan?.planType === 'packaged') {
      const usage = await this.getServiceUsageForMembership(membershipId);
      return { ...membership, usage };
    }

    if (membership.plan?.planType === 'credit') {
      const transactions = await db.select()
        .from(membershipCreditTransactions)
        .where(eq(membershipCreditTransactions.membershipId, membershipId))
        .orderBy(desc(membershipCreditTransactions.createdAt))
        .limit(10);
      return { ...membership, recentTransactions: transactions };
    }

    return membership;
  }

  async getServiceUsageForMembership(membershipId: string) {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const usage = await db
      .select({
        serviceId: membershipServiceUsage.serviceId,
        serviceName: services.name,
        quantityUsed: sql<number>`SUM(${membershipServiceUsage.quantityUsed})`.as('quantity_used'),
      })
      .from(membershipServiceUsage)
      .leftJoin(services, eq(membershipServiceUsage.serviceId, services.id))
      .where(and(
        eq(membershipServiceUsage.membershipId, membershipId),
        gte(membershipServiceUsage.usageMonth, currentMonth)
      ))
      .groupBy(membershipServiceUsage.serviceId, services.name);

    return usage;
  }

  async pauseMembership(membershipId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [membership] = await db.select().from(customerMemberships)
        .where(and(
          eq(customerMemberships.id, membershipId),
          eq(customerMemberships.customerId, customerId)
        ));

      if (!membership) {
        return { success: false, error: 'Membership not found' };
      }

      if (membership.status !== 'active') {
        return { success: false, error: 'Only active memberships can be paused' };
      }

      await db.update(customerMemberships)
        .set({ status: 'paused', pausedAt: new Date(), updatedAt: new Date() })
        .where(eq(customerMemberships.id, membershipId));

      return { success: true };
    } catch (error) {
      console.error('Error pausing membership:', error);
      return { success: false, error: 'Failed to pause membership' };
    }
  }

  async resumeMembership(membershipId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [membership] = await db.select().from(customerMemberships)
        .where(and(
          eq(customerMemberships.id, membershipId),
          eq(customerMemberships.customerId, customerId)
        ));

      if (!membership) {
        return { success: false, error: 'Membership not found' };
      }

      if (membership.status !== 'paused') {
        return { success: false, error: 'Only paused memberships can be resumed' };
      }

      await db.update(customerMemberships)
        .set({ status: 'active', pausedAt: null, updatedAt: new Date() })
        .where(eq(customerMemberships.id, membershipId));

      return { success: true };
    } catch (error) {
      console.error('Error resuming membership:', error);
      return { success: false, error: 'Failed to resume membership' };
    }
  }

  async cancelMembership(membershipId: string, customerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const [membership] = await db.select().from(customerMemberships)
        .where(and(
          eq(customerMemberships.id, membershipId),
          eq(customerMemberships.customerId, customerId)
        ));

      if (!membership) {
        return { success: false, error: 'Membership not found' };
      }

      if (membership.status === 'cancelled' || membership.status === 'expired') {
        return { success: false, error: 'Membership is already cancelled or expired' };
      }

      await db.update(customerMemberships)
        .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(customerMemberships.id, membershipId));

      // Decrement salon's active members count
      await db.update(salons)
        .set({ 
          activeMembersCount: sql`GREATEST(COALESCE(${salons.activeMembersCount}, 0) - 1, 0)`,
          updatedAt: new Date() 
        })
        .where(eq(salons.id, membership.salonId));

      // Check if user has any other active memberships
      const [otherActiveMemberships] = await db.select({ count: count() })
        .from(customerMemberships)
        .where(and(
          eq(customerMemberships.customerId, customerId),
          eq(customerMemberships.status, 'active')
        ));

      if (otherActiveMemberships.count === 0) {
        await db.update(users)
          .set({ hasActiveMembership: 0, updatedAt: new Date() })
          .where(eq(users.id, customerId));
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling membership:', error);
      return { success: false, error: 'Failed to cancel membership' };
    }
  }

  async getAvailablePlansForCustomer(salonId: string) {
    const plans = await this.getPlansForSalon(salonId, { activeOnly: true, includeServices: true });
    
    const now = new Date();
    return plans.filter(plan => {
      if (plan.validFrom && new Date(plan.validFrom) > now) return false;
      if (plan.validUntil && new Date(plan.validUntil) < now) return false;
      return true;
    });
  }

  async purchaseMembership(
    customerId: string,
    planId: string,
    paymentDetails: {
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
    }
  ): Promise<{ success: boolean; membership?: any; error?: string }> {
    try {
      const plan = await this.getPlanById(planId);
      if (!plan) {
        return { success: false, error: 'Membership plan not found' };
      }

      if (!plan.isActive) {
        return { success: false, error: 'This membership plan is no longer available' };
      }

      const now = new Date();
      if (plan.validFrom && new Date(plan.validFrom) > now) {
        return { success: false, error: 'This plan is not yet available' };
      }
      if (plan.validUntil && new Date(plan.validUntil) < now) {
        return { success: false, error: 'This plan has expired' };
      }

      if (plan.maxMembers) {
        const [memberCount] = await db.select({ count: count() })
          .from(customerMemberships)
          .where(and(
            eq(customerMemberships.planId, planId),
            eq(customerMemberships.status, 'active')
          ));
        
        if (memberCount.count >= plan.maxMembers) {
          return { success: false, error: 'This plan has reached its maximum member limit' };
        }
      }

      const existingMembership = await db.select()
        .from(customerMemberships)
        .where(and(
          eq(customerMemberships.customerId, customerId),
          eq(customerMemberships.salonId, plan.salonId),
          eq(customerMemberships.status, 'active')
        ));

      if (existingMembership.length > 0) {
        return { success: false, error: 'You already have an active membership at this salon' };
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);

      let initialCredits = 0;
      if (plan.planType === 'credit' && plan.creditAmountInPaisa) {
        const bonusMultiplier = plan.bonusPercentage ? (1 + plan.bonusPercentage / 100) : 1;
        initialCredits = Math.round(plan.creditAmountInPaisa * bonusMultiplier);
      }

      const nextBillingDate = plan.billingType === 'monthly' 
        ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;

      const [membership] = await db.insert(customerMemberships).values({
        customerId,
        salonId: plan.salonId,
        planId,
        status: 'active',
        startDate,
        endDate,
        nextBillingDate,
        creditBalanceInPaisa: initialCredits,
        totalCreditsEarnedInPaisa: initialCredits,
        totalCreditsUsedInPaisa: 0,
        totalPaidInPaisa: plan.priceInPaisa,
        autoRenew: 0,
      }).returning();

      await db.insert(membershipPayments).values({
        membershipId: membership.id,
        customerId,
        salonId: plan.salonId,
        amountInPaisa: plan.priceInPaisa,
        paymentType: 'initial',
        razorpayPaymentId: paymentDetails.razorpayPaymentId || null,
        razorpayOrderId: paymentDetails.razorpayOrderId || null,
        paymentStatus: 'completed',
        paidAt: new Date(),
      });

      if (initialCredits > 0) {
        await db.insert(membershipCreditTransactions).values({
          membershipId: membership.id,
          transactionType: 'credit_added',
          amountInPaisa: initialCredits,
          balanceAfterInPaisa: initialCredits,
          description: 'Initial credits on membership purchase',
        });
      }

      await db.update(users)
        .set({ hasActiveMembership: 1, updatedAt: new Date() })
        .where(eq(users.id, customerId));

      await db.update(salons)
        .set({ 
          activeMembersCount: sql`COALESCE(${salons.activeMembersCount}, 0) + 1`,
          updatedAt: new Date() 
        })
        .where(eq(salons.id, plan.salonId));

      return { 
        success: true, 
        membership: {
          ...membership,
          plan: {
            id: plan.id,
            name: plan.name,
            planType: plan.planType,
          }
        }
      };
    } catch (error) {
      console.error('Error purchasing membership:', error);
      return { success: false, error: 'Failed to purchase membership' };
    }
  }
  // ============= BOOKING INTEGRATION METHODS =============

  async getActiveMembershipForBooking(customerId: string, salonId: string) {
    const [membership] = await db
      .select({
        membership: customerMemberships,
        plan: membershipPlans,
      })
      .from(customerMemberships)
      .leftJoin(membershipPlans, eq(customerMemberships.planId, membershipPlans.id))
      .where(and(
        eq(customerMemberships.customerId, customerId),
        eq(customerMemberships.salonId, salonId),
        eq(customerMemberships.status, 'active'),
        lte(customerMemberships.startDate, new Date()),
        gte(customerMemberships.endDate, new Date())
      ));

    return membership || null;
  }

  async calculateMembershipBenefits(
    customerId: string,
    salonId: string,
    serviceIds: string[],
    originalTotalInPaisa: number
  ): Promise<{
    hasMembership: boolean;
    membershipId?: string;
    planType?: 'discount' | 'credit' | 'packaged';
    planName?: string;
    discountAmount: number;
    discountPercentage?: number;
    creditBalance?: number;
    creditToUse?: number;
    finalAmount: number;
    includedServicesUsed?: { serviceId: string; serviceName: string; isFree: boolean }[];
    message?: string;
  }> {
    const membership = await this.getActiveMembershipForBooking(customerId, salonId);

    if (!membership || !membership.plan) {
      return {
        hasMembership: false,
        discountAmount: 0,
        finalAmount: originalTotalInPaisa,
      };
    }

    const { membership: customerMembership, plan } = membership;

    if (plan.planType === 'discount' && plan.discountPercentage) {
      const discountAmount = Math.round((originalTotalInPaisa * plan.discountPercentage) / 100);
      return {
        hasMembership: true,
        membershipId: customerMembership.id,
        planType: 'discount',
        planName: plan.name,
        discountAmount,
        discountPercentage: plan.discountPercentage,
        finalAmount: originalTotalInPaisa - discountAmount,
        message: `${plan.discountPercentage}% member discount applied`,
      };
    }

    if (plan.planType === 'credit') {
      const creditBalance = customerMembership.creditBalanceInPaisa;
      const creditToUse = Math.min(creditBalance, originalTotalInPaisa);
      return {
        hasMembership: true,
        membershipId: customerMembership.id,
        planType: 'credit',
        planName: plan.name,
        discountAmount: 0,
        creditBalance,
        creditToUse,
        finalAmount: originalTotalInPaisa - creditToUse,
        message: creditToUse > 0 
          ? `Using ₹${(creditToUse / 100).toFixed(0)} from your beauty bank` 
          : 'No credits available',
      };
    }

    if (plan.planType === 'packaged') {
      const includedServices = await db
        .select({
          serviceId: membershipPlanServices.serviceId,
          quantityPerMonth: membershipPlanServices.quantityPerMonth,
          isUnlimited: membershipPlanServices.isUnlimited,
          serviceName: services.name,
          servicePrice: services.priceInPaisa,
        })
        .from(membershipPlanServices)
        .leftJoin(services, eq(membershipPlanServices.serviceId, services.id))
        .where(eq(membershipPlanServices.planId, plan.id));

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const usageThisMonth = await db
        .select({
          serviceId: membershipServiceUsage.serviceId,
          totalUsed: sql<number>`SUM(${membershipServiceUsage.quantityUsed})`.as('total_used'),
        })
        .from(membershipServiceUsage)
        .where(and(
          eq(membershipServiceUsage.membershipId, customerMembership.id),
          gte(membershipServiceUsage.usageMonth, currentMonth)
        ))
        .groupBy(membershipServiceUsage.serviceId);

      // Create a mutable usage map that includes historical usage + in-booking usage
      const usageMap = new Map<string, number>(usageThisMonth.map(u => [u.serviceId, u.totalUsed]));

      let totalDiscount = 0;
      const includedServicesUsed: { serviceId: string; serviceName: string; isFree: boolean }[] = [];

      for (const serviceId of serviceIds) {
        const includedService = includedServices.find(s => s.serviceId === serviceId);
        if (includedService) {
          const usedCount = usageMap.get(serviceId) || 0;
          const canUse = includedService.isUnlimited === 1 || usedCount < includedService.quantityPerMonth;

          if (canUse) {
            totalDiscount += includedService.servicePrice || 0;
            includedServicesUsed.push({
              serviceId,
              serviceName: includedService.serviceName || '',
              isFree: true,
            });
            // Increment in-booking usage to correctly track quota for duplicate services
            usageMap.set(serviceId, usedCount + 1);
          } else {
            includedServicesUsed.push({
              serviceId,
              serviceName: includedService.serviceName || '',
              isFree: false,
            });
          }
        }
      }

      return {
        hasMembership: true,
        membershipId: customerMembership.id,
        planType: 'packaged',
        planName: plan.name,
        discountAmount: totalDiscount,
        finalAmount: Math.max(0, originalTotalInPaisa - totalDiscount),
        includedServicesUsed,
        message: totalDiscount > 0 
          ? `Included services from your ${plan.name} package` 
          : 'Package services quota exceeded for this month',
      };
    }

    return {
      hasMembership: true,
      membershipId: customerMembership.id,
      planType: plan.planType as 'discount' | 'credit' | 'packaged',
      planName: plan.name,
      discountAmount: 0,
      finalAmount: originalTotalInPaisa,
    };
  }

  async applyMembershipToBooking(
    membershipId: string,
    bookingId: string,
    serviceIds: string[],
    amountUsedInPaisa: number,
    planType: 'discount' | 'credit' | 'packaged'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (planType === 'credit' && amountUsedInPaisa > 0) {
        const [membership] = await db.select().from(customerMemberships)
          .where(eq(customerMemberships.id, membershipId));

        if (!membership) {
          return { success: false, error: 'Membership not found' };
        }

        const newBalance = membership.creditBalanceInPaisa - amountUsedInPaisa;
        if (newBalance < 0) {
          return { success: false, error: 'Insufficient credit balance' };
        }

        await db.update(customerMemberships)
          .set({
            creditBalanceInPaisa: newBalance,
            totalCreditsUsedInPaisa: membership.totalCreditsUsedInPaisa + amountUsedInPaisa,
            updatedAt: new Date(),
          })
          .where(eq(customerMemberships.id, membershipId));

        await db.insert(membershipCreditTransactions).values({
          membershipId,
          bookingId,
          transactionType: 'credit_used',
          amountInPaisa: amountUsedInPaisa,
          balanceAfterInPaisa: newBalance,
          description: `Used for booking ${bookingId}`,
        });
      }

      if (planType === 'packaged') {
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        for (const serviceId of serviceIds) {
          await db.insert(membershipServiceUsage).values({
            membershipId,
            serviceId,
            bookingId,
            quantityUsed: 1,
            usageMonth: currentMonth,
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error applying membership to booking:', error);
      return { success: false, error: 'Failed to apply membership benefits' };
    }
  }
}

export const membershipService = new MembershipService();
