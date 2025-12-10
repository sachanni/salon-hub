import { Router, Request, Response } from 'express';
import { db } from '../db';
import {
  commissions,
  commissionRates,
  staffPayouts,
  staffAdjustments,
  commissionReversals,
  staff,
  salons,
  services,
  products,
  users,
  jobCardTips,
  jobCards,
  insertStaffPayoutSchema,
  insertStaffAdjustmentSchema,
  insertCommissionReversalSchema,
  insertCommissionRateSchema,
} from '@shared/schema';
import { eq, and, desc, sql, gte, lte, inArray, or, sum, count, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { requireSalonAccess, requireBusinessOwner, populateUserFromSession, type AuthenticatedRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = Router();

router.use(populateUserFromSession);

const formatCurrency = (paisa: number): string => {
  return `₹${(paisa / 100).toFixed(2)}`;
};

const getStaffSummary = async (salonId: string, staffId: string, periodStart: Date, periodEnd: Date) => {
  const commissionsResult = await db
    .select({
      totalCommissions: sql<number>`COALESCE(SUM(${commissions.commissionAmountPaisa}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(commissions)
    .where(
      and(
        eq(commissions.salonId, salonId),
        eq(commissions.staffId, staffId),
        eq(commissions.paymentStatus, 'pending'),
        eq(commissions.isReversed, 0),
        gte(commissions.serviceDate, periodStart),
        lte(commissions.serviceDate, periodEnd)
      )
    );

  const tipsResult = await db
    .select({
      totalTips: sql<number>`COALESCE(SUM(${jobCardTips.amountPaisa}), 0)`,
    })
    .from(jobCardTips)
    .innerJoin(jobCards, eq(jobCardTips.jobCardId, jobCards.id))
    .where(
      and(
        eq(jobCards.salonId, salonId),
        eq(jobCardTips.staffId, staffId),
        gte(jobCardTips.createdAt, periodStart),
        lte(jobCardTips.createdAt, periodEnd)
      )
    );

  const adjustmentsResult = await db
    .select({
      totalBonuses: sql<number>`COALESCE(SUM(CASE WHEN ${staffAdjustments.adjustmentType} = 'bonus' THEN ${staffAdjustments.amountPaisa} ELSE 0 END), 0)`,
      totalDeductions: sql<number>`COALESCE(SUM(CASE WHEN ${staffAdjustments.adjustmentType} = 'deduction' THEN ${staffAdjustments.amountPaisa} ELSE 0 END), 0)`,
    })
    .from(staffAdjustments)
    .where(
      and(
        eq(staffAdjustments.salonId, salonId),
        eq(staffAdjustments.staffId, staffId),
        eq(staffAdjustments.status, 'pending'),
        gte(staffAdjustments.effectiveDate, periodStart),
        lte(staffAdjustments.effectiveDate, periodEnd)
      )
    );

  const commissionTotal = Number(commissionsResult[0]?.totalCommissions || 0);
  const tipsTotal = Number(tipsResult[0]?.totalTips || 0);
  const bonuses = Number(adjustmentsResult[0]?.totalBonuses || 0);
  const deductions = Number(adjustmentsResult[0]?.totalDeductions || 0);
  const adjustmentsNet = bonuses - deductions;
  const total = commissionTotal + tipsTotal + adjustmentsNet;

  return {
    commissions: commissionTotal,
    tips: tipsTotal,
    bonuses,
    deductions,
    adjustmentsNet,
    total,
    commissionCount: Number(commissionsResult[0]?.count || 0),
  };
};

router.get('/summary/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate, staffId } = req.query;

    const periodStart = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const periodEnd = endDate ? new Date(endDate as string) : new Date();

    let staffFilter = eq(staff.salonId, salonId);
    if (staffId) {
      staffFilter = and(staffFilter, eq(staff.id, staffId as string))!;
    }

    const staffList = await db.select().from(staff).where(staffFilter);

    const summaries = await Promise.all(
      staffList.map(async (s) => {
        const summary = await getStaffSummary(salonId, s.id, periodStart, periodEnd);
        return {
          staffId: s.id,
          staffName: s.name,
          ...summary,
        };
      })
    );

    const totals = summaries.reduce(
      (acc, s) => ({
        commissions: acc.commissions + s.commissions,
        tips: acc.tips + s.tips,
        bonuses: acc.bonuses + s.bonuses,
        deductions: acc.deductions + s.deductions,
        adjustmentsNet: acc.adjustmentsNet + s.adjustmentsNet,
        total: acc.total + s.total,
      }),
      { commissions: 0, tips: 0, bonuses: 0, deductions: 0, adjustmentsNet: 0, total: 0 }
    );

    res.json({
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      staffSummaries: summaries,
      totals,
    });
  } catch (error) {
    console.error('Error fetching commission summary:', error);
    res.status(500).json({ error: 'Failed to fetch commission summary' });
  }
});

router.get('/commissions/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate, staffId, sourceType, status, limit = '50', offset = '0' } = req.query;

    let conditions = [eq(commissions.salonId, salonId)];

    if (startDate) {
      conditions.push(gte(commissions.serviceDate, new Date(startDate as string)));
    }
    if (endDate) {
      conditions.push(lte(commissions.serviceDate, new Date(endDate as string)));
    }
    if (staffId) {
      conditions.push(eq(commissions.staffId, staffId as string));
    }
    if (sourceType) {
      conditions.push(eq(commissions.sourceType, sourceType as string));
    }
    if (status === 'paid') {
      conditions.push(eq(commissions.paymentStatus, 'paid'));
    } else if (status === 'unpaid') {
      conditions.push(eq(commissions.paymentStatus, 'pending'));
    } else if (status === 'reversed') {
      conditions.push(eq(commissions.isReversed, 1));
    }

    const commissionsData = await db
      .select({
        commission: commissions,
        staffName: staff.name,
        serviceName: services.name,
        productName: products.name,
      })
      .from(commissions)
      .leftJoin(staff, eq(commissions.staffId, staff.id))
      .leftJoin(services, eq(commissions.serviceId, services.id))
      .leftJoin(products, eq(commissions.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(commissions.serviceDate))
      .limit(Number(limit))
      .offset(Number(offset));

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(commissions)
      .where(and(...conditions));

    res.json({
      commissions: commissionsData.map((c) => ({
        ...c.commission,
        staffName: c.staffName,
        serviceName: c.serviceName,
        productName: c.productName,
      })),
      total: Number(countResult[0]?.count || 0),
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

router.get('/payouts/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { staffId, status, limit = '50', offset = '0' } = req.query;

    let conditions = [eq(staffPayouts.salonId, salonId)];

    if (staffId) {
      conditions.push(eq(staffPayouts.staffId, staffId as string));
    }
    if (status) {
      conditions.push(eq(staffPayouts.status, status as string));
    }

    const payoutsData = await db
      .select({
        payout: staffPayouts,
        staffName: staff.name,
        processedByName: users.firstName,
      })
      .from(staffPayouts)
      .leftJoin(staff, eq(staffPayouts.staffId, staff.id))
      .leftJoin(users, eq(staffPayouts.processedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(staffPayouts.paymentDate))
      .limit(Number(limit))
      .offset(Number(offset));

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(staffPayouts)
      .where(and(...conditions));

    res.json({
      payouts: payoutsData.map((p) => ({
        ...p.payout,
        staffName: p.staffName,
        processedByName: p.processedByName,
      })),
      total: Number(countResult[0]?.count || 0),
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

router.post('/payouts/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    const payoutSchema = z.object({
      staffId: z.string(),
      periodStart: z.string().datetime(),
      periodEnd: z.string().datetime(),
      paymentMethod: z.enum(['cash', 'bank_transfer', 'cheque', 'upi', 'other']),
      paymentReference: z.string().optional(),
      notes: z.string().optional(),
    });

    const validatedData = payoutSchema.parse(req.body);

    const periodStart = new Date(validatedData.periodStart);
    const periodEnd = new Date(validatedData.periodEnd);

    const summary = await getStaffSummary(salonId, validatedData.staffId, periodStart, periodEnd);

    if (summary.total <= 0) {
      return res.status(400).json({ error: 'No payable amount for this period' });
    }

    const [payout] = await db.transaction(async (tx) => {
      const [newPayout] = await tx
        .insert(staffPayouts)
        .values({
          salonId,
          staffId: validatedData.staffId,
          totalAmountPaisa: summary.total,
          commissionAmountPaisa: summary.commissions,
          tipsAmountPaisa: summary.tips,
          adjustmentsAmountPaisa: summary.adjustmentsNet,
          periodStart,
          periodEnd,
          paymentMethod: validatedData.paymentMethod,
          paymentReference: validatedData.paymentReference || null,
          paymentDate: new Date(),
          status: 'completed',
          processedBy: userId || null,
          notes: validatedData.notes || null,
        })
        .returning();

      await tx
        .update(commissions)
        .set({ paymentStatus: 'paid', paidAt: new Date(), paidBy: userId || null, payoutId: newPayout.id })
        .where(
          and(
            eq(commissions.salonId, salonId),
            eq(commissions.staffId, validatedData.staffId),
            eq(commissions.paymentStatus, 'pending'),
            eq(commissions.isReversed, 0),
            gte(commissions.serviceDate, periodStart),
            lte(commissions.serviceDate, periodEnd)
          )
        );

      await tx
        .update(staffAdjustments)
        .set({ status: 'included', payoutId: newPayout.id })
        .where(
          and(
            eq(staffAdjustments.salonId, salonId),
            eq(staffAdjustments.staffId, validatedData.staffId),
            eq(staffAdjustments.status, 'pending'),
            gte(staffAdjustments.effectiveDate, periodStart),
            lte(staffAdjustments.effectiveDate, periodEnd)
          )
        );

      return [newPayout];
    });

    res.status(201).json(payout);
  } catch (error) {
    console.error('Error creating payout:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create payout' });
  }
});

router.get('/adjustments/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { staffId, status, type, limit = '50', offset = '0' } = req.query;

    let conditions = [eq(staffAdjustments.salonId, salonId)];

    if (staffId) {
      conditions.push(eq(staffAdjustments.staffId, staffId as string));
    }
    if (status) {
      conditions.push(eq(staffAdjustments.status, status as string));
    }
    if (type) {
      conditions.push(eq(staffAdjustments.adjustmentType, type as string));
    }

    const adjustmentsData = await db
      .select({
        adjustment: staffAdjustments,
        staffName: staff.name,
        createdByName: users.firstName,
      })
      .from(staffAdjustments)
      .leftJoin(staff, eq(staffAdjustments.staffId, staff.id))
      .leftJoin(users, eq(staffAdjustments.createdBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(staffAdjustments.effectiveDate))
      .limit(Number(limit))
      .offset(Number(offset));

    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(staffAdjustments)
      .where(and(...conditions));

    res.json({
      adjustments: adjustmentsData.map((a) => ({
        ...a.adjustment,
        staffName: a.staffName,
        createdByName: a.createdByName,
      })),
      total: Number(countResult[0]?.count || 0),
    });
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch adjustments' });
  }
});

router.post('/adjustments/:salonId', requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const adjustmentSchema = z.object({
      staffId: z.string(),
      adjustmentType: z.enum(['bonus', 'deduction']),
      category: z.string(),
      amountPaisa: z.number().positive(),
      reason: z.string().min(1),
      effectiveDate: z.string().datetime(),
    });

    const validatedData = adjustmentSchema.parse(req.body);

    const [adjustment] = await db
      .insert(staffAdjustments)
      .values({
        salonId,
        staffId: validatedData.staffId,
        adjustmentType: validatedData.adjustmentType,
        category: validatedData.category,
        amountPaisa: validatedData.amountPaisa,
        reason: validatedData.reason,
        effectiveDate: new Date(validatedData.effectiveDate),
        status: 'pending',
        createdBy: userId,
      })
      .returning();

    res.status(201).json(adjustment);
  } catch (error) {
    console.error('Error creating adjustment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create adjustment' });
  }
});

router.delete('/adjustments/:salonId/:adjustmentId', requireBusinessOwner(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, adjustmentId } = req.params;

    const [adjustment] = await db
      .select()
      .from(staffAdjustments)
      .where(and(eq(staffAdjustments.id, adjustmentId), eq(staffAdjustments.salonId, salonId)));

    if (!adjustment) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }

    if (adjustment.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete adjustment that has been processed' });
    }

    await db.delete(staffAdjustments).where(eq(staffAdjustments.id, adjustmentId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting adjustment:', error);
    res.status(500).json({ error: 'Failed to delete adjustment' });
  }
});

router.get('/rates/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { type } = req.query;

    let conditions = [eq(commissionRates.salonId, salonId), eq(commissionRates.isActive, 1)];

    if (type === 'service') {
      conditions.push(eq(commissionRates.appliesTo, 'service'));
    } else if (type === 'product') {
      conditions.push(eq(commissionRates.appliesTo, 'product'));
    }

    const ratesData = await db
      .select({
        rate: commissionRates,
        staffName: staff.name,
        serviceName: services.name,
        productName: products.name,
      })
      .from(commissionRates)
      .leftJoin(staff, eq(commissionRates.staffId, staff.id))
      .leftJoin(services, eq(commissionRates.serviceId, services.id))
      .leftJoin(products, eq(commissionRates.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(commissionRates.createdAt));

    res.json(
      ratesData.map((r) => ({
        ...r.rate,
        staffName: r.staffName,
        serviceName: r.serviceName,
        productName: r.productName,
      }))
    );
  } catch (error) {
    console.error('Error fetching commission rates:', error);
    res.status(500).json({ error: 'Failed to fetch commission rates' });
  }
});

router.post('/rates/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    const rateSchema = z.object({
      staffId: z.string().nullable().optional(),
      serviceId: z.string().nullable().optional(),
      productId: z.string().nullable().optional(),
      rateType: z.enum(['percentage', 'fixed']),
      rateValue: z.number().positive(),
      appliesTo: z.enum(['service', 'product']).default('service'),
      minAmount: z.number().nullable().optional(),
      maxAmount: z.number().nullable().optional(),
    });

    const validatedData = rateSchema.parse(req.body);

    const [rate] = await db
      .insert(commissionRates)
      .values({
        salonId,
        staffId: validatedData.staffId || null,
        serviceId: validatedData.serviceId || null,
        productId: validatedData.productId || null,
        rateType: validatedData.rateType,
        rateValue: validatedData.rateValue.toString(),
        appliesTo: validatedData.appliesTo,
        minAmount: validatedData.minAmount || null,
        maxAmount: validatedData.maxAmount || null,
        isActive: 1,
      })
      .returning();

    res.status(201).json(rate);
  } catch (error) {
    console.error('Error creating commission rate:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create commission rate' });
  }
});

router.put('/rates/:salonId/:rateId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, rateId } = req.params;

    const rateSchema = z.object({
      rateType: z.enum(['percentage', 'fixed']).optional(),
      rateValue: z.number().positive().optional(),
      isActive: z.number().min(0).max(1).optional(),
      minAmount: z.number().nullable().optional(),
      maxAmount: z.number().nullable().optional(),
    });

    const validatedData = rateSchema.parse(req.body);

    const updateData: Record<string, any> = {};
    if (validatedData.rateType) updateData.rateType = validatedData.rateType;
    if (validatedData.rateValue) updateData.rateValue = validatedData.rateValue.toString();
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.minAmount !== undefined) updateData.minAmount = validatedData.minAmount;
    if (validatedData.maxAmount !== undefined) updateData.maxAmount = validatedData.maxAmount;

    const [rate] = await db
      .update(commissionRates)
      .set(updateData)
      .where(and(eq(commissionRates.id, rateId), eq(commissionRates.salonId, salonId)))
      .returning();

    if (!rate) {
      return res.status(404).json({ error: 'Commission rate not found' });
    }

    res.json(rate);
  } catch (error) {
    console.error('Error updating commission rate:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update commission rate' });
  }
});

router.get('/reversals/:salonId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const reversalsData = await db
      .select({
        reversal: commissionReversals,
        commission: commissions,
        staffName: staff.name,
        reversedByName: users.firstName,
      })
      .from(commissionReversals)
      .innerJoin(commissions, eq(commissionReversals.originalCommissionId, commissions.id))
      .leftJoin(staff, eq(commissions.staffId, staff.id))
      .leftJoin(users, eq(commissionReversals.reversedBy, users.id))
      .where(eq(commissionReversals.salonId, salonId))
      .orderBy(desc(commissionReversals.reversedAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json(
      reversalsData.map((r) => ({
        ...r.reversal,
        originalCommission: r.commission,
        staffName: r.staffName,
        reversedByName: r.reversedByName,
      }))
    );
  } catch (error) {
    console.error('Error fetching reversals:', error);
    res.status(500).json({ error: 'Failed to fetch reversals' });
  }
});

export async function reverseCommission(
  commissionId: string,
  reason: string,
  reversedBy: string | null,
  isPartial: boolean = false,
  partialAmount?: number
): Promise<{ success: boolean; reversal?: any; recoveryAdjustment?: any }> {
  const [commission] = await db.select().from(commissions).where(eq(commissions.id, commissionId));

  if (!commission) {
    throw new Error('Commission not found');
  }

  if (commission.isReversed === 1) {
    throw new Error('Commission already reversed');
  }

  const reversalAmount = isPartial && partialAmount ? partialAmount : commission.commissionAmountPaisa;
  const alreadyPaid = commission.paymentStatus === 'paid' ? 1 : 0;

  return await db.transaction(async (tx) => {
    const [reversal] = await tx
      .insert(commissionReversals)
      .values({
        salonId: commission.salonId,
        originalCommissionId: commissionId,
        reversalAmountPaisa: reversalAmount,
        reversalReason: reason,
        alreadyPaid,
        reversedBy,
      })
      .returning();

    await tx
      .update(commissions)
      .set({
        isReversed: 1,
        reversalId: reversal.id,
        updatedAt: new Date(),
      })
      .where(eq(commissions.id, commissionId));

    let recoveryAdjustment = null;

    if (alreadyPaid === 1) {
      const [adjustment] = await tx
        .insert(staffAdjustments)
        .values({
          salonId: commission.salonId,
          staffId: commission.staffId,
          adjustmentType: 'deduction',
          category: 'commission_recovery',
          amountPaisa: reversalAmount,
          reason: `Recovery for reversed commission (${reason})`,
          effectiveDate: new Date(),
          status: 'pending',
          createdBy: reversedBy || 'system',
        })
        .returning();

      recoveryAdjustment = adjustment;

      await tx
        .update(commissionReversals)
        .set({ recoveryAdjustmentId: adjustment.id })
        .where(eq(commissionReversals.id, reversal.id));
    }

    return { success: true, reversal, recoveryAdjustment };
  });
}

router.post('/reverse/:salonId/:commissionId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, commissionId } = req.params;
    const userId = req.user?.id || null;

    const reverseSchema = z.object({
      reason: z.string().min(1),
      isPartial: z.boolean().optional().default(false),
      partialAmount: z.number().positive().optional(),
    });

    const validatedData = reverseSchema.parse(req.body);

    const [commission] = await db.select().from(commissions).where(and(eq(commissions.id, commissionId), eq(commissions.salonId, salonId)));

    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    const result = await reverseCommission(commissionId, validatedData.reason, userId, validatedData.isPartial, validatedData.partialAmount);

    res.json(result);
  } catch (error) {
    console.error('Error reversing commission:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to reverse commission' });
  }
});

router.get('/export/:salonId/excel', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate, staffId, type = 'summary' } = req.query;

    const periodStart = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const periodEnd = endDate ? new Date(endDate as string) : new Date();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SalonHub';
    workbook.created = new Date();

    if (type === 'summary' || type === 'all') {
      const summarySheet = workbook.addWorksheet('Commission Summary');

      summarySheet.columns = [
        { header: 'Staff Name', key: 'staffName', width: 25 },
        { header: 'Commissions', key: 'commissions', width: 15 },
        { header: 'Tips', key: 'tips', width: 15 },
        { header: 'Bonuses', key: 'bonuses', width: 15 },
        { header: 'Deductions', key: 'deductions', width: 15 },
        { header: 'Net Adjustments', key: 'adjustmentsNet', width: 15 },
        { header: 'Total Payable', key: 'total', width: 15 },
      ];

      let staffFilter = eq(staff.salonId, salonId);
      if (staffId) {
        staffFilter = and(staffFilter, eq(staff.id, staffId as string))!;
      }

      const staffList = await db.select().from(staff).where(staffFilter);

      for (const s of staffList) {
        const summary = await getStaffSummary(salonId, s.id, periodStart, periodEnd);
        summarySheet.addRow({
          staffName: s.name,
          commissions: formatCurrency(summary.commissions),
          tips: formatCurrency(summary.tips),
          bonuses: formatCurrency(summary.bonuses),
          deductions: formatCurrency(summary.deductions),
          adjustmentsNet: formatCurrency(summary.adjustmentsNet),
          total: formatCurrency(summary.total),
        });
      }
    }

    if (type === 'detailed' || type === 'all') {
      const detailSheet = workbook.addWorksheet('Commission Details');

      detailSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Staff', key: 'staff', width: 20 },
        { header: 'Source', key: 'source', width: 15 },
        { header: 'Item', key: 'item', width: 25 },
        { header: 'Sale Amount', key: 'saleAmount', width: 15 },
        { header: 'Commission', key: 'commission', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      let conditions = [eq(commissions.salonId, salonId), gte(commissions.serviceDate, periodStart), lte(commissions.serviceDate, periodEnd)];

      if (staffId) {
        conditions.push(eq(commissions.staffId, staffId as string));
      }

      const commissionsData = await db
        .select({
          commission: commissions,
          staffName: staff.name,
          serviceName: services.name,
          productName: products.name,
        })
        .from(commissions)
        .leftJoin(staff, eq(commissions.staffId, staff.id))
        .leftJoin(services, eq(commissions.serviceId, services.id))
        .leftJoin(products, eq(commissions.productId, products.id))
        .where(and(...conditions))
        .orderBy(desc(commissions.serviceDate));

      for (const c of commissionsData) {
        detailSheet.addRow({
          date: c.commission.serviceDate?.toISOString().split('T')[0],
          staff: c.staffName,
          source: c.commission.sourceType,
          item: c.serviceName || c.productName || 'N/A',
          saleAmount: formatCurrency(c.commission.baseAmountPaisa),
          commission: formatCurrency(c.commission.commissionAmountPaisa),
          status: c.commission.isReversed ? 'Reversed' : c.commission.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
        });
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=commission-report-${periodStart.toISOString().split('T')[0]}-${periodEnd.toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating Excel export:', error);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

router.get('/export/:salonId/pdf', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate, staffId } = req.query;

    const periodStart = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const periodEnd = endDate ? new Date(endDate as string) : new Date();

    const [salon] = await db.select().from(salons).where(eq(salons.id, salonId));

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payout-statement-${periodStart.toISOString().split('T')[0]}-${periodEnd.toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text(salon?.name || 'Salon', { align: 'center' });
    doc.fontSize(14).text('Commission & Payout Statement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Period: ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`, { align: 'center' });
    doc.moveDown(2);

    let staffFilter = eq(staff.salonId, salonId);
    if (staffId) {
      staffFilter = and(staffFilter, eq(staff.id, staffId as string))!;
    }

    const staffList = await db.select().from(staff).where(staffFilter);

    for (const s of staffList) {
      const summary = await getStaffSummary(salonId, s.id, periodStart, periodEnd);

      doc.fontSize(12).font('Helvetica-Bold').text(s.name);
      doc.font('Helvetica').fontSize(10);
      doc.text(`Service Commissions: ${formatCurrency(summary.commissions)}`);
      doc.text(`Tips Received: ${formatCurrency(summary.tips)}`);
      doc.text(`Bonuses: ${formatCurrency(summary.bonuses)}`);
      doc.text(`Deductions: ${formatCurrency(summary.deductions)}`);
      doc.font('Helvetica-Bold').text(`Total Payable: ${formatCurrency(summary.total)}`);
      doc.font('Helvetica');
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF export:', error);
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});

router.get('/staff-statement/:salonId/:staffId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, staffId } = req.params;
    const { startDate, endDate } = req.query;

    const periodStart = startDate ? new Date(startDate as string) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const periodEnd = endDate ? new Date(endDate as string) : new Date();

    const [staffMember] = await db.select().from(staff).where(and(eq(staff.id, staffId), eq(staff.salonId, salonId)));

    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const summary = await getStaffSummary(salonId, staffId, periodStart, periodEnd);

    const commissionsData = await db
      .select({
        commission: commissions,
        serviceName: services.name,
        productName: products.name,
      })
      .from(commissions)
      .leftJoin(services, eq(commissions.serviceId, services.id))
      .leftJoin(products, eq(commissions.productId, products.id))
      .where(
        and(eq(commissions.salonId, salonId), eq(commissions.staffId, staffId), gte(commissions.serviceDate, periodStart), lte(commissions.serviceDate, periodEnd))
      )
      .orderBy(desc(commissions.serviceDate));

    const tipsData = await db
      .select({
        tip: jobCardTips,
        jobCardNumber: jobCards.jobCardNumber,
      })
      .from(jobCardTips)
      .innerJoin(jobCards, eq(jobCardTips.jobCardId, jobCards.id))
      .where(and(eq(jobCards.salonId, salonId), eq(jobCardTips.staffId, staffId), gte(jobCardTips.createdAt, periodStart), lte(jobCardTips.createdAt, periodEnd)))
      .orderBy(desc(jobCardTips.createdAt));

    const adjustmentsData = await db
      .select()
      .from(staffAdjustments)
      .where(
        and(
          eq(staffAdjustments.salonId, salonId),
          eq(staffAdjustments.staffId, staffId),
          gte(staffAdjustments.effectiveDate, periodStart),
          lte(staffAdjustments.effectiveDate, periodEnd)
        )
      )
      .orderBy(desc(staffAdjustments.effectiveDate));

    const payoutsData = await db
      .select()
      .from(staffPayouts)
      .where(
        and(eq(staffPayouts.salonId, salonId), eq(staffPayouts.staffId, staffId), gte(staffPayouts.periodStart, periodStart), lte(staffPayouts.periodEnd, periodEnd))
      )
      .orderBy(desc(staffPayouts.paymentDate));

    res.json({
      staff: staffMember,
      period: { start: periodStart, end: periodEnd },
      summary,
      commissions: commissionsData.map((c) => ({
        ...c.commission,
        itemName: c.serviceName || c.productName,
      })),
      tips: tipsData.map((t) => ({
        ...t.tip,
        jobCardNumber: t.jobCardNumber,
      })),
      adjustments: adjustmentsData,
      payouts: payoutsData,
    });
  } catch (error) {
    console.error('Error fetching staff statement:', error);
    res.status(500).json({ error: 'Failed to fetch staff statement' });
  }
});

export default router;

export function registerCommissionPayoutRoutes(app: any) {
  app.use('/api/commission-payout', router);
}
