import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  depositSettings,
  serviceDepositRules,
  cancellationPolicies,
  trustedCustomers,
  depositTransactions,
  customerSavedCards,
  salons,
  services,
  users,
  bookings
} from '@shared/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireSalonAccess, requireStaffAccess, type AuthenticatedRequest } from '../middleware/auth';
import { authenticateMobileUser } from '../middleware/authMobile';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const router = Router();

const updateDepositSettingsSchema = z.object({
  isEnabled: z.number().min(0).max(1).optional(),
  depositPercentage: z.number().min(5).max(100).optional(),
  usePriceThreshold: z.number().min(0).max(1).optional(),
  priceThresholdPaisa: z.number().optional().nullable(),
  useCategoryBased: z.number().min(0).max(1).optional(),
  protectedCategories: z.array(z.string()).optional().nullable(),
  useManualToggle: z.number().min(0).max(1).optional(),
  allowTrustedCustomerBypass: z.number().min(0).max(1).optional(),
  requireCardOnFile: z.number().min(0).max(1).optional(),
});

const updateCancellationPolicySchema = z.object({
  cancellationWindowHours: z.number().min(1).max(168).optional(),
  withinWindowAction: z.enum(['forfeit_full', 'forfeit_partial', 'no_penalty']).optional(),
  partialForfeitPercentage: z.number().min(0).max(100).optional(),
  noShowAction: z.enum(['forfeit_full', 'forfeit_partial', 'charge_full_service']).optional(),
  noShowChargeFull: z.number().min(0).max(1).optional(),
  noShowGraceMinutes: z.number().min(0).max(60).optional(),
  policyText: z.string().max(2000).optional().nullable(),
});

const serviceDepositRuleSchema = z.object({
  serviceId: z.string(),
  requiresDeposit: z.number().min(0).max(1),
  customPercentage: z.number().min(5).max(100).optional().nullable(),
  minimumDepositPaisa: z.number().optional().nullable(),
  maximumDepositPaisa: z.number().optional().nullable(),
});

const trustedCustomerSchema = z.object({
  customerId: z.string(),
  trustLevel: z.enum(['trusted', 'vip', 'blacklisted']).optional(),
  reason: z.string().max(500).optional().nullable(),
  canBypassDeposit: z.number().min(0).max(1).optional(),
});

const depositTransactionSchema = z.object({
  bookingId: z.string(),
  transactionType: z.enum(['deposit_collected', 'deposit_refunded', 'deposit_forfeited', 'no_show_charged', 'deposit_applied']),
  amountPaisa: z.number().min(0),
  serviceAmountPaisa: z.number().min(0),
  depositPercentage: z.number().min(0).max(100),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

router.get('/:salonId/deposit-settings', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    let settings = await db.query.depositSettings.findFirst({
      where: eq(depositSettings.salonId, salonId),
    });

    if (!settings) {
      const [newSettings] = await db.insert(depositSettings).values({
        salonId,
        isEnabled: 0,
        depositPercentage: 25,
        usePriceThreshold: 0,
        useCategoryBased: 0,
        useManualToggle: 1,
        allowTrustedCustomerBypass: 1,
        requireCardOnFile: 1,
      }).returning();
      settings = newSettings;
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching deposit settings:', error);
    res.status(500).json({ error: 'Failed to fetch deposit settings' });
  }
});

router.put('/:salonId/deposit-settings', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;
    
    const parsed = updateDepositSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    let existing = await db.query.depositSettings.findFirst({
      where: eq(depositSettings.salonId, salonId),
    });

    if (!existing) {
      const [newSettings] = await db.insert(depositSettings).values({
        salonId,
        ...parsed.data,
        updatedBy: userId,
      }).returning();
      return res.json(newSettings);
    }

    const [updated] = await db.update(depositSettings)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(depositSettings.salonId, salonId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating deposit settings:', error);
    res.status(500).json({ error: 'Failed to update deposit settings' });
  }
});

router.get('/:salonId/cancellation-policy', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    let policy = await db.query.cancellationPolicies.findFirst({
      where: eq(cancellationPolicies.salonId, salonId),
    });

    if (!policy) {
      const [newPolicy] = await db.insert(cancellationPolicies).values({
        salonId,
        cancellationWindowHours: 24,
        withinWindowAction: 'forfeit_full',
        partialForfeitPercentage: 50,
        noShowAction: 'forfeit_full',
        noShowChargeFull: 0,
        noShowGraceMinutes: 15,
      }).returning();
      policy = newPolicy;
    }

    res.json(policy);
  } catch (error) {
    console.error('Error fetching cancellation policy:', error);
    res.status(500).json({ error: 'Failed to fetch cancellation policy' });
  }
});

router.put('/:salonId/cancellation-policy', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;
    
    const parsed = updateCancellationPolicySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    let existing = await db.query.cancellationPolicies.findFirst({
      where: eq(cancellationPolicies.salonId, salonId),
    });

    if (!existing) {
      const [newPolicy] = await db.insert(cancellationPolicies).values({
        salonId,
        ...parsed.data,
        updatedBy: userId,
      }).returning();
      return res.json(newPolicy);
    }

    const [updated] = await db.update(cancellationPolicies)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(cancellationPolicies.salonId, salonId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating cancellation policy:', error);
    res.status(500).json({ error: 'Failed to update cancellation policy' });
  }
});

router.get('/:salonId/service-deposit-rules', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const rules = await db.select({
      id: serviceDepositRules.id,
      salonId: serviceDepositRules.salonId,
      serviceId: serviceDepositRules.serviceId,
      requiresDeposit: serviceDepositRules.requiresDeposit,
      customPercentage: serviceDepositRules.customPercentage,
      minimumDepositPaisa: serviceDepositRules.minimumDepositPaisa,
      maximumDepositPaisa: serviceDepositRules.maximumDepositPaisa,
      serviceName: services.name,
      serviceCategory: services.category,
      servicePriceInPaisa: services.priceInPaisa,
    })
    .from(serviceDepositRules)
    .leftJoin(services, eq(serviceDepositRules.serviceId, services.id))
    .where(eq(serviceDepositRules.salonId, salonId));

    res.json(rules);
  } catch (error) {
    console.error('Error fetching service deposit rules:', error);
    res.status(500).json({ error: 'Failed to fetch service deposit rules' });
  }
});

router.post('/:salonId/service-deposit-rules', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const parsed = serviceDepositRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, parsed.data.serviceId),
        eq(services.salonId, salonId)
      ),
    });

    if (!service) {
      return res.status(400).json({ error: 'Service does not belong to this salon' });
    }

    const existing = await db.query.serviceDepositRules.findFirst({
      where: and(
        eq(serviceDepositRules.salonId, salonId),
        eq(serviceDepositRules.serviceId, parsed.data.serviceId)
      ),
    });

    if (existing) {
      const [updated] = await db.update(serviceDepositRules)
        .set({
          requiresDeposit: parsed.data.requiresDeposit,
          customPercentage: parsed.data.customPercentage,
          minimumDepositPaisa: parsed.data.minimumDepositPaisa,
          maximumDepositPaisa: parsed.data.maximumDepositPaisa,
          updatedAt: new Date(),
        })
        .where(eq(serviceDepositRules.id, existing.id))
        .returning();
      return res.json(updated);
    }

    const [newRule] = await db.insert(serviceDepositRules).values({
      salonId,
      ...parsed.data,
    }).returning();

    res.status(201).json(newRule);
  } catch (error) {
    console.error('Error creating/updating service deposit rule:', error);
    res.status(500).json({ error: 'Failed to create/update service deposit rule' });
  }
});

router.delete('/:salonId/service-deposit-rules/:ruleId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, ruleId } = req.params;

    const existing = await db.query.serviceDepositRules.findFirst({
      where: and(
        eq(serviceDepositRules.id, ruleId),
        eq(serviceDepositRules.salonId, salonId)
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Service deposit rule not found' });
    }

    await db.delete(serviceDepositRules).where(eq(serviceDepositRules.id, ruleId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service deposit rule:', error);
    res.status(500).json({ error: 'Failed to delete service deposit rule' });
  }
});

router.post('/:salonId/service-deposit-rules/bulk', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { rules } = req.body as { rules: z.infer<typeof serviceDepositRuleSchema>[] };

    if (!Array.isArray(rules)) {
      return res.status(400).json({ error: 'rules must be an array' });
    }

    const validatedRules: z.infer<typeof serviceDepositRuleSchema>[] = [];
    const invalidServiceIds: string[] = [];

    for (const rule of rules) {
      const parsed = serviceDepositRuleSchema.safeParse(rule);
      if (!parsed.success) continue;

      const service = await db.query.services.findFirst({
        where: and(
          eq(services.id, parsed.data.serviceId),
          eq(services.salonId, salonId)
        ),
      });

      if (!service) {
        invalidServiceIds.push(parsed.data.serviceId);
      } else {
        validatedRules.push(parsed.data);
      }
    }

    if (invalidServiceIds.length > 0) {
      return res.status(400).json({ 
        error: 'Some services do not belong to this salon',
        invalidServiceIds 
      });
    }

    const results = [];
    for (const rule of validatedRules) {
      const existing = await db.query.serviceDepositRules.findFirst({
        where: and(
          eq(serviceDepositRules.salonId, salonId),
          eq(serviceDepositRules.serviceId, rule.serviceId)
        ),
      });

      if (existing) {
        const [updated] = await db.update(serviceDepositRules)
          .set({
            requiresDeposit: rule.requiresDeposit,
            customPercentage: rule.customPercentage,
            minimumDepositPaisa: rule.minimumDepositPaisa,
            maximumDepositPaisa: rule.maximumDepositPaisa,
            updatedAt: new Date(),
          })
          .where(eq(serviceDepositRules.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [newRule] = await db.insert(serviceDepositRules).values({
          salonId,
          ...rule,
        }).returning();
        results.push(newRule);
      }
    }

    res.json({ updated: results.length, rules: results });
  } catch (error) {
    console.error('Error bulk updating service deposit rules:', error);
    res.status(500).json({ error: 'Failed to bulk update service deposit rules' });
  }
});

router.get('/:salonId/trusted-customers', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { trustLevel, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let whereCondition = eq(trustedCustomers.salonId, salonId);
    if (trustLevel && ['trusted', 'vip', 'blacklisted'].includes(trustLevel as string)) {
      whereCondition = and(
        eq(trustedCustomers.salonId, salonId),
        eq(trustedCustomers.trustLevel, trustLevel as string)
      ) as any;
    }

    const customers = await db.select({
      id: trustedCustomers.id,
      salonId: trustedCustomers.salonId,
      customerId: trustedCustomers.customerId,
      trustLevel: trustedCustomers.trustLevel,
      reason: trustedCustomers.reason,
      canBypassDeposit: trustedCustomers.canBypassDeposit,
      hasCardOnFile: trustedCustomers.hasCardOnFile,
      cardLast4: trustedCustomers.cardLast4,
      cardBrand: trustedCustomers.cardBrand,
      totalBookings: trustedCustomers.totalBookings,
      completedBookings: trustedCustomers.completedBookings,
      noShowCount: trustedCustomers.noShowCount,
      lateCancellationCount: trustedCustomers.lateCancellationCount,
      addedAt: trustedCustomers.addedAt,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      customerEmail: users.email,
      customerPhone: users.phone,
    })
    .from(trustedCustomers)
    .leftJoin(users, eq(trustedCustomers.customerId, users.id))
    .where(whereCondition)
    .orderBy(desc(trustedCustomers.addedAt))
    .limit(limitNum)
    .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(trustedCustomers)
      .where(whereCondition);

    res.json({
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching trusted customers:', error);
    res.status(500).json({ error: 'Failed to fetch trusted customers' });
  }
});

router.post('/:salonId/trusted-customers', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;
    
    const parsed = trustedCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    const existing = await db.query.trustedCustomers.findFirst({
      where: and(
        eq(trustedCustomers.salonId, salonId),
        eq(trustedCustomers.customerId, parsed.data.customerId)
      ),
    });

    if (existing) {
      const [updated] = await db.update(trustedCustomers)
        .set({
          trustLevel: parsed.data.trustLevel || existing.trustLevel,
          reason: parsed.data.reason,
          canBypassDeposit: parsed.data.canBypassDeposit ?? existing.canBypassDeposit,
          lastUpdatedAt: new Date(),
          lastUpdatedBy: userId,
        })
        .where(eq(trustedCustomers.id, existing.id))
        .returning();
      return res.json(updated);
    }

    const [newCustomer] = await db.insert(trustedCustomers).values({
      salonId,
      customerId: parsed.data.customerId,
      trustLevel: parsed.data.trustLevel || 'trusted',
      reason: parsed.data.reason,
      canBypassDeposit: parsed.data.canBypassDeposit ?? 1,
      addedBy: userId,
    }).returning();

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error adding trusted customer:', error);
    res.status(500).json({ error: 'Failed to add trusted customer' });
  }
});

router.put('/:salonId/trusted-customers/:trustedCustomerId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, trustedCustomerId } = req.params;
    const userId = req.user?.id;
    
    const parsed = trustedCustomerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    const existing = await db.query.trustedCustomers.findFirst({
      where: and(
        eq(trustedCustomers.id, trustedCustomerId),
        eq(trustedCustomers.salonId, salonId)
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Trusted customer not found' });
    }

    const [updated] = await db.update(trustedCustomers)
      .set({
        ...parsed.data,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: userId,
      })
      .where(eq(trustedCustomers.id, trustedCustomerId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating trusted customer:', error);
    res.status(500).json({ error: 'Failed to update trusted customer' });
  }
});

router.delete('/:salonId/trusted-customers/:trustedCustomerId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, trustedCustomerId } = req.params;

    const existing = await db.query.trustedCustomers.findFirst({
      where: and(
        eq(trustedCustomers.id, trustedCustomerId),
        eq(trustedCustomers.salonId, salonId)
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Trusted customer not found' });
    }

    await db.delete(trustedCustomers).where(eq(trustedCustomers.id, trustedCustomerId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing trusted customer:', error);
    res.status(500).json({ error: 'Failed to remove trusted customer' });
  }
});

router.get('/:salonId/check-deposit/:serviceId/:customerId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, serviceId, customerId } = req.params;

    const settings = await db.query.depositSettings.findFirst({
      where: eq(depositSettings.salonId, salonId),
    });

    if (!settings || settings.isEnabled !== 1) {
      return res.json({
        requiresDeposit: false,
        reason: 'deposits_disabled',
      });
    }

    const trustedCustomer = await db.query.trustedCustomers.findFirst({
      where: and(
        eq(trustedCustomers.salonId, salonId),
        eq(trustedCustomers.customerId, customerId)
      ),
    });

    if (trustedCustomer && trustedCustomer.trustLevel === 'blacklisted') {
      return res.json({
        requiresDeposit: true,
        depositPercentage: 100,
        reason: 'customer_blacklisted',
        forceFullPayment: true,
      });
    }

    if (settings.allowTrustedCustomerBypass === 1 && trustedCustomer) {
      if (trustedCustomer.canBypassDeposit === 1) {
        if (settings.requireCardOnFile === 0 || trustedCustomer.hasCardOnFile === 1) {
          return res.json({
            requiresDeposit: false,
            reason: 'trusted_customer',
            hasCardOnFile: trustedCustomer.hasCardOnFile === 1,
          });
        }
      }
    }

    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const serviceRule = await db.query.serviceDepositRules.findFirst({
      where: and(
        eq(serviceDepositRules.salonId, salonId),
        eq(serviceDepositRules.serviceId, serviceId)
      ),
    });

    let requiresDeposit = false;
    let depositPercentage = settings.depositPercentage;
    let reason = '';

    if (settings.useManualToggle === 1 && serviceRule?.requiresDeposit === 1) {
      requiresDeposit = true;
      reason = 'manual_toggle';
      if (serviceRule.customPercentage) {
        depositPercentage = serviceRule.customPercentage;
      }
    } else if (settings.useCategoryBased === 1 && settings.protectedCategories?.includes(service.category || '')) {
      requiresDeposit = true;
      reason = 'protected_category';
    } else if (settings.usePriceThreshold === 1 && settings.priceThresholdPaisa && service.priceInPaisa >= settings.priceThresholdPaisa) {
      requiresDeposit = true;
      reason = 'price_threshold';
    }

    if (!requiresDeposit) {
      return res.json({
        requiresDeposit: false,
        reason: 'no_trigger',
      });
    }

    let depositAmountPaisa = Math.round(service.priceInPaisa * depositPercentage / 100);

    if (serviceRule?.minimumDepositPaisa && depositAmountPaisa < serviceRule.minimumDepositPaisa) {
      depositAmountPaisa = serviceRule.minimumDepositPaisa;
    }
    if (serviceRule?.maximumDepositPaisa && depositAmountPaisa > serviceRule.maximumDepositPaisa) {
      depositAmountPaisa = serviceRule.maximumDepositPaisa;
    }

    const policy = await db.query.cancellationPolicies.findFirst({
      where: eq(cancellationPolicies.salonId, salonId),
    });

    res.json({
      requiresDeposit: true,
      depositPercentage,
      depositAmountPaisa,
      serviceAmountPaisa: service.priceInPaisa,
      reason,
      cancellationPolicy: policy ? {
        windowHours: policy.cancellationWindowHours,
        withinWindowAction: policy.withinWindowAction,
        noShowAction: policy.noShowAction,
        policyText: policy.policyText,
      } : null,
    });
  } catch (error) {
    console.error('Error checking deposit requirement:', error);
    res.status(500).json({ error: 'Failed to check deposit requirement' });
  }
});

router.get('/:salonId/deposit-transactions', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { 
      status, 
      transactionType, 
      startDate, 
      endDate,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    let conditions = [eq(depositTransactions.salonId, salonId)];

    if (status) {
      conditions.push(eq(depositTransactions.status, status as string));
    }
    if (transactionType) {
      conditions.push(eq(depositTransactions.transactionType, transactionType as string));
    }
    if (startDate) {
      conditions.push(sql`${depositTransactions.createdAt} >= ${new Date(startDate as string)}`);
    }
    if (endDate) {
      conditions.push(sql`${depositTransactions.createdAt} <= ${new Date(endDate as string)}`);
    }

    const transactions = await db.select({
      id: depositTransactions.id,
      salonId: depositTransactions.salonId,
      customerId: depositTransactions.customerId,
      bookingId: depositTransactions.bookingId,
      transactionType: depositTransactions.transactionType,
      amountPaisa: depositTransactions.amountPaisa,
      currency: depositTransactions.currency,
      serviceAmountPaisa: depositTransactions.serviceAmountPaisa,
      depositPercentage: depositTransactions.depositPercentage,
      status: depositTransactions.status,
      reason: depositTransactions.reason,
      wasNoShow: depositTransactions.wasNoShow,
      createdAt: depositTransactions.createdAt,
      customerFirstName: users.firstName,
      customerLastName: users.lastName,
      customerEmail: users.email,
    })
    .from(depositTransactions)
    .leftJoin(users, eq(depositTransactions.customerId, users.id))
    .where(and(...conditions))
    .orderBy(desc(depositTransactions.createdAt))
    .limit(limitNum)
    .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(depositTransactions)
      .where(and(...conditions));

    const [stats] = await db.select({
      totalCollected: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_collected' AND ${depositTransactions.status} = 'completed' THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
      totalRefunded: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_refunded' THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
      totalForfeited: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_forfeited' THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
      noShowCount: sql<number>`COUNT(CASE WHEN ${depositTransactions.wasNoShow} = 1 THEN 1 END)::int`,
    })
    .from(depositTransactions)
    .where(eq(depositTransactions.salonId, salonId));

    res.json({
      transactions,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching deposit transactions:', error);
    res.status(500).json({ error: 'Failed to fetch deposit transactions' });
  }
});

router.post('/:salonId/deposit-transactions', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { customerId } = req.body;
    
    const parsed = depositTransactionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }

    if (!customerId) {
      return res.status(400).json({ error: 'customerId is required' });
    }

    const policy = await db.query.cancellationPolicies.findFirst({
      where: eq(cancellationPolicies.salonId, salonId),
    });

    const [transaction] = await db.insert(depositTransactions).values({
      salonId,
      customerId,
      bookingId: parsed.data.bookingId,
      transactionType: parsed.data.transactionType,
      amountPaisa: parsed.data.amountPaisa,
      serviceAmountPaisa: parsed.data.serviceAmountPaisa,
      depositPercentage: parsed.data.depositPercentage,
      razorpayPaymentId: parsed.data.razorpayPaymentId,
      razorpayOrderId: parsed.data.razorpayOrderId,
      status: parsed.data.transactionType === 'deposit_collected' ? 'completed' : 'pending',
      reason: parsed.data.reason,
      notes: parsed.data.notes,
      cancellationWindowHours: policy?.cancellationWindowHours,
      collectedAt: parsed.data.transactionType === 'deposit_collected' ? new Date() : null,
    }).returning();

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating deposit transaction:', error);
    res.status(500).json({ error: 'Failed to create deposit transaction' });
  }
});

router.put('/:salonId/deposit-transactions/:transactionId/refund', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, transactionId } = req.params;
    const userId = req.user?.id;
    const { razorpayRefundId, reason } = req.body;

    const existing = await db.query.depositTransactions.findFirst({
      where: and(
        eq(depositTransactions.id, transactionId),
        eq(depositTransactions.salonId, salonId)
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (existing.status === 'refunded') {
      return res.status(400).json({ error: 'Transaction already refunded' });
    }

    const [updated] = await db.update(depositTransactions)
      .set({
        status: 'refunded',
        razorpayRefundId,
        reason: reason || existing.reason,
        refundedAt: new Date(),
        processedAt: new Date(),
        processedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(depositTransactions.id, transactionId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

router.put('/:salonId/deposit-transactions/:transactionId/forfeit', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, transactionId } = req.params;
    const userId = req.user?.id;
    const { reason, wasNoShow = false, cancelledWithinWindow = false } = req.body;

    const existing = await db.query.depositTransactions.findFirst({
      where: and(
        eq(depositTransactions.id, transactionId),
        eq(depositTransactions.salonId, salonId)
      ),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (existing.status === 'refunded') {
      return res.status(400).json({ error: 'Cannot forfeit refunded transaction' });
    }

    const [updated] = await db.update(depositTransactions)
      .set({
        transactionType: 'deposit_forfeited',
        status: 'completed',
        reason,
        wasNoShow: wasNoShow ? 1 : 0,
        cancelledWithinWindow: cancelledWithinWindow ? 1 : 0,
        forfeitedAt: new Date(),
        processedAt: new Date(),
        processedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(depositTransactions.id, transactionId))
      .returning();

    if (wasNoShow) {
      const trustedCustomer = await db.query.trustedCustomers.findFirst({
        where: and(
          eq(trustedCustomers.salonId, salonId),
          eq(trustedCustomers.customerId, existing.customerId)
        ),
      });

      if (trustedCustomer) {
        await db.update(trustedCustomers)
          .set({
            noShowCount: sql`${trustedCustomers.noShowCount} + 1`,
            lastUpdatedAt: new Date(),
          })
          .where(eq(trustedCustomers.id, trustedCustomer.id));
      }
    }

    if (cancelledWithinWindow) {
      const trustedCustomer = await db.query.trustedCustomers.findFirst({
        where: and(
          eq(trustedCustomers.salonId, salonId),
          eq(trustedCustomers.customerId, existing.customerId)
        ),
      });

      if (trustedCustomer) {
        await db.update(trustedCustomers)
          .set({
            lateCancellationCount: sql`${trustedCustomers.lateCancellationCount} + 1`,
            lastUpdatedAt: new Date(),
          })
          .where(eq(trustedCustomers.id, trustedCustomer.id));
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error forfeiting deposit:', error);
    res.status(500).json({ error: 'Failed to forfeit deposit' });
  }
});

router.post('/:salonId/bookings/:bookingId/mark-no-show', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, bookingId } = req.params;
    const userId = req.user?.id;

    const { noShowService } = await import('../services/noshow.service');
    
    const result = await noShowService.markBookingAsNoShow(bookingId, salonId, userId);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: result.error,
        bookingId: result.bookingId,
        previousStatus: result.previousStatus,
      });
    }

    res.json({
      success: true,
      message: 'Booking marked as no-show',
      bookingId: result.bookingId,
      previousStatus: result.previousStatus,
      depositAction: result.depositAction,
      depositAmountPaisa: result.depositAmountPaisa,
    });
  } catch (error) {
    console.error('Error marking booking as no-show:', error);
    res.status(500).json({ error: 'Failed to mark booking as no-show' });
  }
});

router.get('/:salonId/no-show-statistics', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { days = '30' } = req.query;

    const { noShowService } = await import('../services/noshow.service');
    
    const stats = await noShowService.getNoShowStatistics(salonId, parseInt(days as string) || 30);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching no-show statistics:', error);
    res.status(500).json({ error: 'Failed to fetch no-show statistics' });
  }
});

router.get('/:salonId/customers', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { search = '', page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offset = (pageNum - 1) * limitNum;
    const searchTerm = (search as string).toLowerCase();

    const customersWithBookings = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      bookingCount: sql<number>`COUNT(${bookings.id})::int`,
      lastVisit: sql<string>`MAX(${bookings.bookingDate})`,
    })
    .from(users)
    .innerJoin(bookings, eq(bookings.userId, users.id))
    .where(and(
      eq(bookings.salonId, salonId),
      searchTerm 
        ? sql`(LOWER(${users.firstName}) LIKE ${`%${searchTerm}%`} OR LOWER(${users.lastName}) LIKE ${`%${searchTerm}%`} OR LOWER(${users.email}) LIKE ${`%${searchTerm}%`})`
        : sql`1=1`
    ))
    .groupBy(users.id, users.firstName, users.lastName, users.email, users.phone)
    .orderBy(sql`MAX(${bookings.bookingDate}) DESC NULLS LAST`)
    .limit(limitNum)
    .offset(offset);

    const [countResult] = await db.select({ 
      count: sql<number>`COUNT(DISTINCT ${users.id})::int` 
    })
    .from(users)
    .innerJoin(bookings, eq(bookings.userId, users.id))
    .where(and(
      eq(bookings.salonId, salonId),
      searchTerm 
        ? sql`(LOWER(${users.firstName}) LIKE ${`%${searchTerm}%`} OR LOWER(${users.lastName}) LIKE ${`%${searchTerm}%`} OR LOWER(${users.email}) LIKE ${`%${searchTerm}%`})`
        : sql`1=1`
    ));

    res.json({
      customers: customersWithBookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/:salonId/deposit-analytics', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { period = '30' } = req.query;

    const daysAgo = parseInt(period as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [stats] = await db.select({
      totalDepositsCollected: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_collected' AND ${depositTransactions.status} = 'completed' THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
      totalRefunded: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_refunded' THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
      totalForfeited: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_forfeited' THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
      depositsCount: sql<number>`COUNT(CASE WHEN ${depositTransactions.transactionType} = 'deposit_collected' THEN 1 END)::int`,
      refundsCount: sql<number>`COUNT(CASE WHEN ${depositTransactions.transactionType} = 'deposit_refunded' THEN 1 END)::int`,
      forfeitsCount: sql<number>`COUNT(CASE WHEN ${depositTransactions.transactionType} = 'deposit_forfeited' THEN 1 END)::int`,
      noShowsCount: sql<number>`COUNT(CASE WHEN ${depositTransactions.wasNoShow} = 1 THEN 1 END)::int`,
    })
    .from(depositTransactions)
    .where(and(
      eq(depositTransactions.salonId, salonId),
      sql`${depositTransactions.createdAt} >= ${startDate}`
    ));

    const [trustedStats] = await db.select({
      totalTrusted: sql<number>`COUNT(CASE WHEN ${trustedCustomers.trustLevel} = 'trusted' THEN 1 END)::int`,
      totalVip: sql<number>`COUNT(CASE WHEN ${trustedCustomers.trustLevel} = 'vip' THEN 1 END)::int`,
      totalBlacklisted: sql<number>`COUNT(CASE WHEN ${trustedCustomers.trustLevel} = 'blacklisted' THEN 1 END)::int`,
      customersWithCards: sql<number>`COUNT(CASE WHEN ${trustedCustomers.hasCardOnFile} = 1 THEN 1 END)::int`,
    })
    .from(trustedCustomers)
    .where(eq(trustedCustomers.salonId, salonId));

    res.json({
      period: daysAgo,
      deposits: {
        totalCollectedPaisa: stats.totalDepositsCollected,
        totalRefundedPaisa: stats.totalRefunded,
        totalForfeitedPaisa: stats.totalForfeited,
        netRevenuePaisa: stats.totalDepositsCollected - stats.totalRefunded,
        count: {
          collected: stats.depositsCount,
          refunded: stats.refundsCount,
          forfeited: stats.forfeitsCount,
        },
        noShowsCount: stats.noShowsCount,
      },
      customers: {
        trusted: trustedStats.totalTrusted,
        vip: trustedStats.totalVip,
        blacklisted: trustedStats.totalBlacklisted,
        withSavedCards: trustedStats.customersWithCards,
      },
    });
  } catch (error) {
    console.error('Error fetching deposit analytics:', error);
    res.status(500).json({ error: 'Failed to fetch deposit analytics' });
  }
});

export const publicDepositsRouter = Router();

publicDepositsRouter.post('/check-booking-deposit', async (req: Request, res: Response) => {
  try {
    const { salonId, serviceIds, customerId } = req.body;

    if (!salonId || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'salonId and serviceIds are required' });
    }

    const settings = await db.query.depositSettings.findFirst({
      where: eq(depositSettings.salonId, salonId),
    });

    if (!settings || settings.isEnabled !== 1) {
      return res.json({
        requiresDeposit: false,
        reason: 'deposits_disabled',
        totalDepositPaisa: 0,
        serviceDeposits: [],
      });
    }

    let trustedCustomer = null;
    if (customerId) {
      trustedCustomer = await db.query.trustedCustomers.findFirst({
        where: and(
          eq(trustedCustomers.salonId, salonId),
          eq(trustedCustomers.customerId, customerId)
        ),
      });

      if (trustedCustomer && trustedCustomer.trustLevel === 'blacklisted') {
        const allServices = await db.query.services.findMany({
          where: inArray(services.id, serviceIds),
        });
        const totalServiceAmount = allServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
        
        const policy = await db.query.cancellationPolicies.findFirst({
          where: eq(cancellationPolicies.salonId, salonId),
        });

        return res.json({
          requiresDeposit: true,
          depositPercentage: 100,
          totalDepositPaisa: totalServiceAmount,
          totalServicePaisa: totalServiceAmount,
          reason: 'customer_blacklisted',
          forceFullPayment: true,
          serviceDeposits: allServices.map(s => ({
            serviceId: s.id,
            serviceName: s.name,
            servicePriceInPaisa: s.priceInPaisa,
            depositAmountPaisa: s.priceInPaisa,
            depositPercentage: 100,
          })),
          cancellationPolicy: policy ? {
            windowHours: policy.cancellationWindowHours,
            withinWindowAction: policy.withinWindowAction,
            noShowAction: policy.noShowAction,
            policyText: policy.policyText,
          } : null,
        });
      }

      if (settings.allowTrustedCustomerBypass === 1 && trustedCustomer) {
        if (trustedCustomer.canBypassDeposit === 1) {
          if (settings.requireCardOnFile === 0 || trustedCustomer.hasCardOnFile === 1) {
            return res.json({
              requiresDeposit: false,
              reason: 'trusted_customer',
              totalDepositPaisa: 0,
              totalServicePaisa: 0,
              balanceDuePaisa: 0,
              serviceDeposits: [],
            });
          }
        }
      }
    }

    const allServices = await db.query.services.findMany({
      where: inArray(services.id, serviceIds),
    });

    const serviceRules = await db.select()
      .from(serviceDepositRules)
      .where(and(
        eq(serviceDepositRules.salonId, salonId),
        inArray(serviceDepositRules.serviceId, serviceIds)
      ));

    const rulesMap = new Map(serviceRules.map(r => [r.serviceId, r]));

    let totalDepositPaisa = 0;
    let totalServicePaisa = 0;
    let anyServiceRequiresDeposit = false;
    const serviceDeposits: Array<{
      serviceId: string;
      serviceName: string;
      servicePriceInPaisa: number;
      depositAmountPaisa: number;
      depositPercentage: number;
      requiresDeposit: boolean;
      reason: string;
    }> = [];

    for (const service of allServices) {
      const serviceRule = rulesMap.get(service.id);
      let requiresDeposit = false;
      let depositPercentage = settings.depositPercentage;
      let reason = '';

      if (settings.useManualToggle === 1 && serviceRule?.requiresDeposit === 1) {
        requiresDeposit = true;
        reason = 'manual_toggle';
        if (serviceRule.customPercentage) {
          depositPercentage = serviceRule.customPercentage;
        }
      } else if (settings.useCategoryBased === 1 && settings.protectedCategories?.includes(service.category || '')) {
        requiresDeposit = true;
        reason = 'protected_category';
      } else if (settings.usePriceThreshold === 1 && settings.priceThresholdPaisa && service.priceInPaisa >= settings.priceThresholdPaisa) {
        requiresDeposit = true;
        reason = 'price_threshold';
      }

      let depositAmountPaisa = 0;
      if (requiresDeposit) {
        anyServiceRequiresDeposit = true;
        depositAmountPaisa = Math.round(service.priceInPaisa * depositPercentage / 100);

        if (serviceRule?.minimumDepositPaisa && depositAmountPaisa < serviceRule.minimumDepositPaisa) {
          depositAmountPaisa = serviceRule.minimumDepositPaisa;
        }
        if (serviceRule?.maximumDepositPaisa && depositAmountPaisa > serviceRule.maximumDepositPaisa) {
          depositAmountPaisa = serviceRule.maximumDepositPaisa;
        }

        totalDepositPaisa += depositAmountPaisa;
      }

      totalServicePaisa += service.priceInPaisa;

      serviceDeposits.push({
        serviceId: service.id,
        serviceName: service.name,
        servicePriceInPaisa: service.priceInPaisa,
        depositAmountPaisa,
        depositPercentage: requiresDeposit ? depositPercentage : 0,
        requiresDeposit,
        reason: reason || 'no_trigger',
      });
    }

    if (!anyServiceRequiresDeposit) {
      return res.json({
        requiresDeposit: false,
        reason: 'no_services_require_deposit',
        totalDepositPaisa: 0,
        totalServicePaisa,
        serviceDeposits,
      });
    }

    const policy = await db.query.cancellationPolicies.findFirst({
      where: eq(cancellationPolicies.salonId, salonId),
    });

    res.json({
      requiresDeposit: true,
      totalDepositPaisa,
      totalServicePaisa,
      balanceDuePaisa: totalServicePaisa - totalDepositPaisa,
      serviceDeposits,
      cancellationPolicy: policy ? {
        windowHours: policy.cancellationWindowHours,
        withinWindowAction: policy.withinWindowAction,
        partialForfeitPercentage: policy.partialForfeitPercentage,
        noShowAction: policy.noShowAction,
        noShowGraceMinutes: policy.noShowGraceMinutes,
        policyText: policy.policyText,
      } : null,
    });
  } catch (error) {
    console.error('Error checking booking deposit:', error);
    res.status(500).json({ error: 'Failed to check deposit requirement' });
  }
});

publicDepositsRouter.get('/cancellation-policy/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;

    const policy = await db.query.cancellationPolicies.findFirst({
      where: eq(cancellationPolicies.salonId, salonId),
    });

    if (!policy) {
      return res.json({
        cancellationWindowHours: 24,
        withinWindowAction: 'forfeit_full',
        noShowAction: 'forfeit_full',
        policyText: 'Standard cancellation policy applies. Please cancel at least 24 hours in advance to avoid losing your deposit.',
      });
    }

    res.json({
      cancellationWindowHours: policy.cancellationWindowHours,
      withinWindowAction: policy.withinWindowAction,
      partialForfeitPercentage: policy.partialForfeitPercentage,
      noShowAction: policy.noShowAction,
      noShowGraceMinutes: policy.noShowGraceMinutes,
      policyText: policy.policyText,
    });
  } catch (error) {
    console.error('Error fetching cancellation policy:', error);
    res.status(500).json({ error: 'Failed to fetch cancellation policy' });
  }
});

const createDepositOrderSchema = z.object({
  salonId: z.string(),
  serviceIds: z.array(z.string()).min(1),
  amountPaisa: z.number().min(100),
  paymentType: z.enum(['deposit', 'full_payment']),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  bookingDate: z.string(),
  bookingTime: z.string(),
  staffId: z.string().optional().nullable(),
});

publicDepositsRouter.post('/create-deposit-order', async (req: Request, res: Response) => {
  try {
    const parsed = createDepositOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors });
    }

    const { salonId, serviceIds, amountPaisa, paymentType, customerEmail, bookingDate, bookingTime, staffId } = parsed.data;

    const salon = await db.query.salons.findFirst({
      where: eq(salons.id, salonId),
    });

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const allServices = await db.query.services.findMany({
      where: inArray(services.id, serviceIds),
    });

    if (allServices.length === 0) {
      return res.status(400).json({ error: 'No valid services found' });
    }

    const totalServicePaisa = allServices.reduce((sum, s) => sum + s.priceInPaisa, 0);

    if (paymentType === 'full_payment' && amountPaisa !== totalServicePaisa) {
      return res.status(400).json({ 
        error: 'Amount mismatch for full payment',
        expected: totalServicePaisa,
        received: amountPaisa,
      });
    }

    if (amountPaisa > totalServicePaisa) {
      return res.status(400).json({ error: 'Payment amount cannot exceed service total' });
    }

    const orderNumber = `DEP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const options = {
      amount: amountPaisa,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        salonId,
        serviceIds: serviceIds.join(','),
        paymentType,
        bookingDate,
        bookingTime,
        staffId: staffId || '',
        customerEmail: customerEmail || '',
        totalServicePaisa: totalServicePaisa.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
      salonName: salon.name,
      serviceNames: allServices.map(s => s.name),
    });
  } catch (error: any) {
    console.error('Deposit order creation error:', error);
    res.status(500).json({
      error: 'Failed to create deposit order',
      message: error.message,
    });
  }
});

const verifyDepositPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  salonId: z.string(),
  serviceIds: z.array(z.string()).min(1),
  bookingDate: z.string(),
  bookingTime: z.string(),
  staffId: z.string().optional().nullable(),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  paymentType: z.enum(['deposit', 'full_payment']),
});

publicDepositsRouter.post('/verify-deposit-payment', async (req: Request, res: Response) => {
  try {
    const parsed = verifyDepositPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      salonId,
      serviceIds,
      bookingDate,
      bookingTime,
      staffId,
      customerEmail,
      customerPhone,
      customerName,
      paymentType,
    } = parsed.data;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
      });
    }

    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: 'Payment does not match order',
      });
    }

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        paymentStatus: payment.status,
      });
    }

    const amountPaidPaisa = typeof razorpayOrder.amount === 'number' 
      ? razorpayOrder.amount 
      : parseInt(razorpayOrder.amount as string);

    const allServices = await db.query.services.findMany({
      where: inArray(services.id, serviceIds),
    });
    const totalServicePaisa = allServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
    const totalDuration = allServices.reduce((sum, s) => sum + s.durationMinutes, 0);

    let customer = await db.query.users.findFirst({
      where: eq(users.email, customerEmail),
    });

    if (!customer) {
      const [newUser] = await db.insert(users).values({
        email: customerEmail,
        firstName: customerName || '',
        lastName: '',
        phone: customerPhone || null,
        role: 'customer',
      }).returning();
      customer = newUser;
    }

    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const [booking] = await db.insert(bookings).values({
      id: bookingId,
      salonId,
      userId: customer.id,
      staffId: staffId || null,
      serviceId: serviceIds[0],
      customerName: customerName || customer.firstName || '',
      customerEmail: customerEmail,
      customerPhone: customerPhone || '',
      bookingDate: bookingDate,
      bookingTime: bookingTime,
      status: 'confirmed',
      totalAmountPaisa: totalServicePaisa,
      paymentMethod: paymentType === 'deposit' ? 'deposit' : 'pay_now',
      notes: serviceIds.length > 1 
        ? `Multiple services: ${allServices.map(s => s.name).join(', ')}. Payment: ${razorpay_payment_id}` 
        : `Payment: ${razorpay_payment_id}`,
    }).returning();

    await db.insert(depositTransactions).values({
      salonId,
      bookingId: booking.id,
      customerId: customer.id,
      transactionType: paymentType === 'deposit' ? 'deposit_collected' : 'deposit_collected',
      amountPaisa: amountPaidPaisa,
      serviceAmountPaisa: totalServicePaisa,
      depositPercentage: paymentType === 'deposit' ? Math.round((amountPaidPaisa / totalServicePaisa) * 100) : 100,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      status: 'completed',
      notes: paymentType === 'full_payment' ? 'Full payment collected at booking' : 'Deposit collected at booking',
    });

    res.json({
      success: true,
      message: 'Payment verified and booking created',
      booking: {
        id: booking.id,
        date: booking.bookingDate,
        time: booking.bookingTime,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        totalAmount: totalServicePaisa,
        amountPaid: amountPaidPaisa,
        balanceDue: paymentType === 'deposit' ? totalServicePaisa - amountPaidPaisa : 0,
      },
      payment: {
        id: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: amountPaidPaisa,
        status: payment.status,
      },
    });
  } catch (error: any) {
    console.error('Deposit payment verification error:', error);
    res.status(500).json({
      error: 'Payment verification failed',
      message: error.message,
    });
  }
});

// =============================================================================
// CUSTOMER-FACING DEPOSIT ENDPOINTS
// =============================================================================

// Get customer's own deposit history across all salons
router.get('/my-deposits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch customer's deposit transactions with salon and booking details
    const transactions = await db
      .select({
        id: depositTransactions.id,
        salonId: depositTransactions.salonId,
        salonName: salons.name,
        salonImageUrl: salons.imageUrl,
        bookingId: depositTransactions.bookingId,
        transactionType: depositTransactions.transactionType,
        amountPaisa: depositTransactions.amountPaisa,
        currency: depositTransactions.currency,
        serviceAmountPaisa: depositTransactions.serviceAmountPaisa,
        depositPercentage: depositTransactions.depositPercentage,
        status: depositTransactions.status,
        reason: depositTransactions.reason,
        notes: depositTransactions.notes,
        createdAt: depositTransactions.createdAt,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        serviceName: services.name,
      })
      .from(depositTransactions)
      .leftJoin(salons, eq(depositTransactions.salonId, salons.id))
      .leftJoin(bookings, eq(depositTransactions.bookingId, bookings.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(eq(depositTransactions.customerId, userId))
      .orderBy(desc(depositTransactions.createdAt))
      .limit(100);

    // Calculate summary statistics
    const stats = {
      totalDeposits: 0,
      totalRefunded: 0,
      totalForfeited: 0,
      activeDeposits: 0,
    };

    transactions.forEach(tx => {
      const amount = tx.amountPaisa || 0;
      switch (tx.transactionType) {
        case 'deposit_collected':
          stats.totalDeposits += amount;
          if (tx.status === 'completed' || tx.status === 'pending') {
            stats.activeDeposits += amount;
          }
          break;
        case 'deposit_refunded':
          stats.totalRefunded += amount;
          break;
        case 'deposit_forfeited':
        case 'no_show_charged':
          stats.totalForfeited += amount;
          break;
        case 'deposit_applied':
          stats.activeDeposits -= amount;
          break;
      }
    });

    res.json({
      transactions,
      stats,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Error fetching customer deposits:', error);
    res.status(500).json({ error: 'Failed to fetch deposit history' });
  }
});

// Get specific deposit transaction details for customer
router.get('/my-deposits/:transactionId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { transactionId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const [transaction] = await db
      .select({
        id: depositTransactions.id,
        salonId: depositTransactions.salonId,
        salonName: salons.name,
        salonAddress: salons.address,
        salonCity: salons.city,
        salonImageUrl: salons.imageUrl,
        bookingId: depositTransactions.bookingId,
        transactionType: depositTransactions.transactionType,
        amountPaisa: depositTransactions.amountPaisa,
        currency: depositTransactions.currency,
        serviceAmountPaisa: depositTransactions.serviceAmountPaisa,
        depositPercentage: depositTransactions.depositPercentage,
        razorpayPaymentId: depositTransactions.razorpayPaymentId,
        razorpayRefundId: depositTransactions.razorpayRefundId,
        status: depositTransactions.status,
        reason: depositTransactions.reason,
        notes: depositTransactions.notes,
        createdAt: depositTransactions.createdAt,
        updatedAt: depositTransactions.updatedAt,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        bookingStatus: bookings.status,
        serviceName: services.name,
        serviceDuration: services.durationMinutes,
      })
      .from(depositTransactions)
      .leftJoin(salons, eq(depositTransactions.salonId, salons.id))
      .leftJoin(bookings, eq(depositTransactions.bookingId, bookings.id))
      .leftJoin(services, eq(bookings.serviceId, services.id))
      .where(
        and(
          eq(depositTransactions.id, transactionId),
          eq(depositTransactions.customerId, userId)
        )
      );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching deposit transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction details' });
  }
});

// =============================================================================
// CUSTOMER SAVED CARDS ENDPOINTS
// =============================================================================

const savedCardSchema = z.object({
  razorpayTokenId: z.string().min(1),
  razorpayCustomerId: z.string().optional(),
  cardNetwork: z.string().optional(),
  cardType: z.string().optional(),
  cardLast4: z.string().length(4).optional(),
  cardIssuer: z.string().optional(),
  cardBrand: z.string().optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(2024).optional(),
  nickname: z.string().max(50).optional(),
  isDefault: z.number().min(0).max(1).optional(),
});

router.get('/my-cards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cards = await db.query.customerSavedCards.findMany({
      where: and(
        eq(customerSavedCards.customerId, userId),
        eq(customerSavedCards.isActive, 1)
      ),
      orderBy: [desc(customerSavedCards.isDefault), desc(customerSavedCards.createdAt)],
    });

    const formattedCards = cards.map(card => ({
      id: card.id,
      cardNetwork: card.cardNetwork,
      cardType: card.cardType,
      cardLast4: card.cardLast4,
      cardIssuer: card.cardIssuer,
      cardBrand: card.cardBrand,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      nickname: card.nickname,
      isDefault: card.isDefault === 1,
      lastUsedAt: card.lastUsedAt,
      createdAt: card.createdAt,
    }));

    res.json({
      cards: formattedCards,
      count: formattedCards.length,
    });
  } catch (error) {
    console.error('Error fetching saved cards:', error);
    res.status(500).json({ error: 'Failed to fetch saved cards' });
  }
});

router.post('/my-cards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const parsed = savedCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid card data', details: parsed.error.errors });
    }

    const existingCard = await db.query.customerSavedCards.findFirst({
      where: eq(customerSavedCards.razorpayTokenId, parsed.data.razorpayTokenId),
    });

    if (existingCard) {
      return res.status(409).json({ error: 'Card already saved' });
    }

    if (parsed.data.isDefault === 1) {
      await db
        .update(customerSavedCards)
        .set({ isDefault: 0, updatedAt: new Date() })
        .where(eq(customerSavedCards.customerId, userId));
    }

    const [newCard] = await db.insert(customerSavedCards).values({
      customerId: userId,
      razorpayTokenId: parsed.data.razorpayTokenId,
      razorpayCustomerId: parsed.data.razorpayCustomerId || null,
      cardNetwork: parsed.data.cardNetwork || null,
      cardType: parsed.data.cardType || null,
      cardLast4: parsed.data.cardLast4 || null,
      cardIssuer: parsed.data.cardIssuer || null,
      cardBrand: parsed.data.cardBrand || null,
      expiryMonth: parsed.data.expiryMonth || null,
      expiryYear: parsed.data.expiryYear || null,
      nickname: parsed.data.nickname || null,
      isDefault: parsed.data.isDefault ?? 0,
      consentTimestamp: new Date(),
    }).returning();

    res.status(201).json({
      id: newCard.id,
      cardNetwork: newCard.cardNetwork,
      cardType: newCard.cardType,
      cardLast4: newCard.cardLast4,
      cardIssuer: newCard.cardIssuer,
      nickname: newCard.nickname,
      isDefault: newCard.isDefault === 1,
      createdAt: newCard.createdAt,
    });
  } catch (error) {
    console.error('Error saving card:', error);
    res.status(500).json({ error: 'Failed to save card' });
  }
});

router.put('/my-cards/:cardId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const existingCard = await db.query.customerSavedCards.findFirst({
      where: and(
        eq(customerSavedCards.id, cardId),
        eq(customerSavedCards.customerId, userId)
      ),
    });

    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const { nickname, isDefault } = req.body;

    if (isDefault === 1 || isDefault === true) {
      await db
        .update(customerSavedCards)
        .set({ isDefault: 0, updatedAt: new Date() })
        .where(eq(customerSavedCards.customerId, userId));
    }

    const [updatedCard] = await db
      .update(customerSavedCards)
      .set({
        nickname: nickname !== undefined ? nickname : existingCard.nickname,
        isDefault: isDefault !== undefined ? (isDefault ? 1 : 0) : existingCard.isDefault,
        updatedAt: new Date(),
      })
      .where(and(
        eq(customerSavedCards.id, cardId),
        eq(customerSavedCards.customerId, userId)
      ))
      .returning();

    res.json({
      id: updatedCard.id,
      nickname: updatedCard.nickname,
      isDefault: updatedCard.isDefault === 1,
      updatedAt: updatedCard.updatedAt,
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.delete('/my-cards/:cardId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const existingCard = await db.query.customerSavedCards.findFirst({
      where: and(
        eq(customerSavedCards.id, cardId),
        eq(customerSavedCards.customerId, userId)
      ),
    });

    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await db
      .update(customerSavedCards)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(and(
        eq(customerSavedCards.id, cardId),
        eq(customerSavedCards.customerId, userId)
      ));

    res.json({ success: true, message: 'Card removed successfully' });
  } catch (error) {
    console.error('Error removing card:', error);
    res.status(500).json({ error: 'Failed to remove card' });
  }
});

router.post('/my-cards/:cardId/set-default', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const existingCard = await db.query.customerSavedCards.findFirst({
      where: and(
        eq(customerSavedCards.id, cardId),
        eq(customerSavedCards.customerId, userId),
        eq(customerSavedCards.isActive, 1)
      ),
    });

    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await db
      .update(customerSavedCards)
      .set({ isDefault: 0, updatedAt: new Date() })
      .where(eq(customerSavedCards.customerId, userId));

    await db
      .update(customerSavedCards)
      .set({ isDefault: 1, updatedAt: new Date() })
      .where(and(
        eq(customerSavedCards.id, cardId),
        eq(customerSavedCards.customerId, userId)
      ));

    res.json({ success: true, message: 'Default card updated' });
  } catch (error) {
    console.error('Error setting default card:', error);
    res.status(500).json({ error: 'Failed to set default card' });
  }
});

export function registerMobileDepositRoutes(app: any) {
  app.get('/api/mobile/deposits/my-deposits', authenticateMobileUser, async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const transactions = await db
        .select({
          id: depositTransactions.id,
          salonId: depositTransactions.salonId,
          salonName: salons.name,
          salonImageUrl: salons.imageUrl,
          bookingId: depositTransactions.bookingId,
          transactionType: depositTransactions.transactionType,
          amountPaisa: depositTransactions.amountPaisa,
          currency: depositTransactions.currency,
          serviceAmountPaisa: depositTransactions.serviceAmountPaisa,
          depositPercentage: depositTransactions.depositPercentage,
          status: depositTransactions.status,
          reason: depositTransactions.reason,
          notes: depositTransactions.notes,
          wasNoShow: depositTransactions.wasNoShow,
          createdAt: depositTransactions.createdAt,
          bookingDate: bookings.bookingDate,
          bookingTime: bookings.bookingTime,
          serviceName: services.name,
        })
        .from(depositTransactions)
        .leftJoin(salons, eq(depositTransactions.salonId, salons.id))
        .leftJoin(bookings, eq(depositTransactions.bookingId, bookings.id))
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(eq(depositTransactions.customerId, userId))
        .orderBy(desc(depositTransactions.createdAt))
        .limit(100);

      const stats = {
        totalDeposits: 0,
        totalRefunded: 0,
        totalForfeited: 0,
        activeDeposits: 0,
      };

      transactions.forEach(tx => {
        const amount = tx.amountPaisa || 0;
        switch (tx.transactionType) {
          case 'deposit_collected':
            stats.totalDeposits += amount;
            if (tx.status === 'completed' || tx.status === 'pending') {
              stats.activeDeposits += amount;
            }
            break;
          case 'deposit_refunded':
            stats.totalRefunded += amount;
            break;
          case 'deposit_forfeited':
          case 'no_show_charged':
            stats.totalForfeited += amount;
            break;
          case 'deposit_applied':
            stats.activeDeposits -= amount;
            break;
        }
      });

      res.json({
        transactions,
        stats,
        count: transactions.length,
      });
    } catch (error) {
      console.error('Error fetching mobile deposits:', error);
      res.status(500).json({ error: 'Failed to fetch deposit history' });
    }
  });

  app.post('/api/mobile/deposits/check-booking-deposit', authenticateMobileUser, async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { salonId, serviceIds } = req.body;

      if (!salonId || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({ error: 'salonId and serviceIds are required' });
      }

      const settings = await db.query.depositSettings.findFirst({
        where: eq(depositSettings.salonId, salonId),
      });

      if (!settings || settings.isEnabled !== 1) {
        return res.json({
          requiresDeposit: false,
          reason: 'deposits_disabled',
          totalDepositPaisa: 0,
          serviceDeposits: [],
        });
      }

      let trustedCustomer = null;
      if (userId) {
        trustedCustomer = await db.query.trustedCustomers.findFirst({
          where: and(
            eq(trustedCustomers.salonId, salonId),
            eq(trustedCustomers.customerId, userId)
          ),
        });

        if (trustedCustomer && trustedCustomer.trustLevel === 'blacklisted') {
          const allServices = await db.query.services.findMany({
            where: inArray(services.id, serviceIds),
          });
          const totalServiceAmount = allServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
          
          return res.json({
            requiresDeposit: true,
            depositPercentage: 100,
            totalDepositPaisa: totalServiceAmount,
            totalServicePaisa: totalServiceAmount,
            reason: 'customer_blacklisted',
            forceFullPayment: true,
          });
        }

        if (settings.allowTrustedCustomerBypass === 1 && trustedCustomer) {
          if (trustedCustomer.canBypassDeposit === 1) {
            if (settings.requireCardOnFile === 0 || trustedCustomer.hasCardOnFile === 1) {
              return res.json({
                requiresDeposit: false,
                reason: 'trusted_customer',
                totalDepositPaisa: 0,
              });
            }
          }
        }
      }

      const allServices = await db.query.services.findMany({
        where: inArray(services.id, serviceIds),
      });

      const serviceRules = await db.select()
        .from(serviceDepositRules)
        .where(and(
          eq(serviceDepositRules.salonId, salonId),
          inArray(serviceDepositRules.serviceId, serviceIds)
        ));

      const rulesMap = new Map(serviceRules.map(r => [r.serviceId, r]));

      let totalDepositPaisa = 0;
      let totalServicePaisa = 0;
      let anyServiceRequiresDeposit = false;

      for (const service of allServices) {
        const serviceRule = rulesMap.get(service.id);
        let requiresDeposit = false;
        let depositPercentage = settings.depositPercentage;

        if (settings.useManualToggle === 1 && serviceRule?.requiresDeposit === 1) {
          requiresDeposit = true;
          if (serviceRule.customPercentage) {
            depositPercentage = serviceRule.customPercentage;
          }
        } else if (settings.useCategoryBased === 1 && settings.protectedCategories?.includes(service.category || '')) {
          requiresDeposit = true;
        } else if (settings.usePriceThreshold === 1 && settings.priceThresholdPaisa && service.priceInPaisa >= settings.priceThresholdPaisa) {
          requiresDeposit = true;
        }

        if (requiresDeposit) {
          anyServiceRequiresDeposit = true;
          let depositAmountPaisa = Math.round(service.priceInPaisa * depositPercentage / 100);

          if (serviceRule?.minimumDepositPaisa && depositAmountPaisa < serviceRule.minimumDepositPaisa) {
            depositAmountPaisa = serviceRule.minimumDepositPaisa;
          }
          if (serviceRule?.maximumDepositPaisa && depositAmountPaisa > serviceRule.maximumDepositPaisa) {
            depositAmountPaisa = serviceRule.maximumDepositPaisa;
          }

          totalDepositPaisa += depositAmountPaisa;
        }

        totalServicePaisa += service.priceInPaisa;
      }

      if (!anyServiceRequiresDeposit) {
        return res.json({
          requiresDeposit: false,
          reason: 'no_services_require_deposit',
          totalDepositPaisa: 0,
          totalServicePaisa,
        });
      }

      const policy = await db.query.cancellationPolicies.findFirst({
        where: eq(cancellationPolicies.salonId, salonId),
      });

      res.json({
        requiresDeposit: true,
        totalDepositPaisa,
        totalServicePaisa,
        balanceDuePaisa: totalServicePaisa - totalDepositPaisa,
        cancellationPolicy: policy ? {
          windowHours: policy.cancellationWindowHours,
          noShowAction: policy.noShowAction,
          noShowGraceMinutes: policy.noShowGraceMinutes,
          policyText: policy.policyText,
        } : null,
      });
    } catch (error) {
      console.error('Error checking mobile booking deposit:', error);
      res.status(500).json({ error: 'Failed to check deposit requirement' });
    }
  });

  app.get('/api/mobile/deposits/cancellation-policy/:salonId', authenticateMobileUser, async (req: any, res: any) => {
    try {
      const { salonId } = req.params;

      const policy = await db.query.cancellationPolicies.findFirst({
        where: eq(cancellationPolicies.salonId, salonId),
      });

      if (!policy) {
        return res.json({
          cancellationWindowHours: 24,
          withinWindowAction: 'forfeit_full',
          noShowAction: 'forfeit_full',
          noShowGraceMinutes: 15,
          policyText: 'Standard cancellation policy applies. Please cancel at least 24 hours in advance to avoid losing your deposit.',
        });
      }

      res.json({
        cancellationWindowHours: policy.cancellationWindowHours,
        withinWindowAction: policy.withinWindowAction,
        partialForfeitPercentage: policy.partialForfeitPercentage,
        noShowAction: policy.noShowAction,
        noShowGraceMinutes: policy.noShowGraceMinutes,
        policyText: policy.policyText,
      });
    } catch (error) {
      console.error('Error fetching mobile cancellation policy:', error);
      res.status(500).json({ error: 'Failed to fetch cancellation policy' });
    }
  });

  app.post('/api/deposits/create-deposit-order', authenticateMobileUser, async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { salonId, bookingId, amountPaisa, serviceAmountPaisa, depositPercentage, serviceIds } = req.body;

      if (!salonId || !amountPaisa || amountPaisa < 100) {
        return res.status(400).json({ error: 'salonId and amountPaisa (minimum 100) are required' });
      }

      const settings = await db.query.depositSettings.findFirst({
        where: eq(depositSettings.salonId, salonId),
      });

      if (!settings || settings.isEnabled !== 1) {
        return res.status(400).json({ error: 'Deposits are not enabled for this salon' });
      }

      const amountInr = amountPaisa / 100;
      const receiptId = `dep_${Date.now()}_${userId?.substring(0, 8) || 'guest'}`;

      const order = await razorpay.orders.create({
        amount: amountPaisa,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          type: 'deposit',
          userId: userId || 'guest',
          salonId,
          bookingId: bookingId || '',
          serviceIds: JSON.stringify(serviceIds || []),
          depositPercentage: String(depositPercentage || settings.depositPercentage),
          serviceAmountPaisa: String(serviceAmountPaisa || 0),
        },
      });

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error: any) {
      console.error('Error creating deposit order:', error);
      res.status(500).json({ error: error.message || 'Failed to create deposit order' });
    }
  });

  app.post('/api/deposits/verify-deposit-payment', authenticateMobileUser, async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      const { 
        razorpayOrderId, 
        razorpayPaymentId, 
        razorpaySignature,
        salonId,
        bookingId,
        amountPaisa,
        serviceAmountPaisa,
        depositPercentage,
        serviceIds,
      } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ error: 'Missing payment verification parameters' });
      }

      if (!salonId || !amountPaisa) {
        return res.status(400).json({ error: 'salonId and amountPaisa are required' });
      }

      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        console.error('Payment signature verification failed');
        return res.status(400).json({ error: 'Payment verification failed - invalid signature' });
      }

      const [transaction] = await db.insert(depositTransactions).values({
        salonId,
        customerId: userId,
        bookingId: bookingId || null,
        transactionType: 'deposit_collected',
        amountPaisa,
        currency: 'INR',
        serviceAmountPaisa: serviceAmountPaisa || 0,
        depositPercentage: depositPercentage || 0,
        razorpayPaymentId,
        razorpayOrderId,
        status: 'completed',
        notes: `Deposit collected via mobile app for services: ${JSON.stringify(serviceIds || [])}`,
      }).returning();

      if (bookingId) {
        await db.update(bookings)
          .set({
            notes: sql`COALESCE(${bookings.notes}, '') || '\n\nDeposit paid: ₹' || ${amountPaisa / 100}::text || ' (Transaction: ' || ${transaction.id}::text || ')'`,
          })
          .where(eq(bookings.id, bookingId));
      }

      res.json({
        success: true,
        message: 'Deposit payment verified successfully',
        transaction: {
          id: transaction.id,
          amountPaisa: transaction.amountPaisa,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error verifying deposit payment:', error);
      res.status(500).json({ error: error.message || 'Failed to verify deposit payment' });
    }
  });

  console.log('✅ Mobile deposit routes registered');
}

export default router;
