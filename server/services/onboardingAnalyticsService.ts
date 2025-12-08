import { db } from "../db";
import { eq, sql, and, gte, lte, count, sum } from "drizzle-orm";
import {
  customerImportBatches,
  importedCustomers,
  invitationCampaigns,
  invitationMessages,
  welcomeOffers,
  welcomeOfferRedemptions,
} from "@shared/schema";

export interface ImportMetrics {
  totalImported: number;
  thisWeek: number;
  thisMonth: number;
  byBatch: Array<{
    batchId: string;
    fileName: string | null;
    totalRecords: number;
    successfulImports: number;
    failedImports: number;
    duplicateSkipped: number;
    createdAt: Date | null;
  }>;
}

export interface CampaignMetrics {
  totalCampaigns: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesFailed: number;
  deliveryRate: number;
  byCampaign: Array<{
    campaignId: string;
    name: string;
    channel: string;
    status: string;
    targetCount: number;
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    createdAt: Date | null;
  }>;
}

export interface ConversionMetrics {
  totalImported: number;
  totalInvited: number;
  totalRegistered: number;
  importToInviteRate: number;
  inviteToRegisterRate: number;
  overallConversionRate: number;
}

export interface OfferMetrics {
  totalOffers: number;
  activeOffers: number;
  totalRedemptions: number;
  totalDiscountGivenInPaisa: number;
  redemptionsByOffer: Array<{
    offerId: string;
    offerName: string;
    discountType: string;
    discountValue: number;
    totalRedemptions: number;
    totalDiscountGiven: number;
    isActive: boolean;
  }>;
}

export interface ConversionFunnel {
  imported: number;
  invited: number;
  delivered: number;
  registered: number;
  firstBooking: number;
  rates: {
    importToInvite: number;
    inviteToDelivered: number;
    deliveredToRegistered: number;
    registeredToBooking: number;
    overallConversion: number;
  };
}

export interface OnboardingAnalytics {
  importMetrics: ImportMetrics;
  campaignMetrics: CampaignMetrics;
  conversionMetrics: ConversionMetrics;
  offerMetrics: OfferMetrics;
  funnel: ConversionFunnel;
}

class OnboardingAnalyticsService {
  async getImportMetrics(salonId: string): Promise<ImportMetrics> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(eq(importedCustomers.salonId, salonId));

    const [weekResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(
        and(
          eq(importedCustomers.salonId, salonId),
          gte(importedCustomers.createdAt, weekAgo)
        )
      );

    const [monthResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(
        and(
          eq(importedCustomers.salonId, salonId),
          gte(importedCustomers.createdAt, monthAgo)
        )
      );

    const batches = await db
      .select({
        batchId: customerImportBatches.id,
        fileName: customerImportBatches.fileName,
        totalRecords: customerImportBatches.totalRecords,
        successfulImports: customerImportBatches.successfulImports,
        failedImports: customerImportBatches.failedImports,
        duplicateSkipped: customerImportBatches.duplicateSkipped,
        createdAt: customerImportBatches.createdAt,
      })
      .from(customerImportBatches)
      .where(eq(customerImportBatches.salonId, salonId))
      .orderBy(sql`${customerImportBatches.createdAt} DESC`)
      .limit(20);

    return {
      totalImported: totalResult?.count || 0,
      thisWeek: weekResult?.count || 0,
      thisMonth: monthResult?.count || 0,
      byBatch: batches,
    };
  }

  async getCampaignMetrics(salonId: string): Promise<CampaignMetrics> {
    const campaigns = await db
      .select({
        campaignId: invitationCampaigns.id,
        name: invitationCampaigns.name,
        channel: invitationCampaigns.channel,
        status: invitationCampaigns.status,
        targetCount: invitationCampaigns.targetCustomerCount,
        sent: invitationCampaigns.messagesSent,
        delivered: invitationCampaigns.messagesDelivered,
        failed: invitationCampaigns.messagesFailed,
        createdAt: invitationCampaigns.createdAt,
      })
      .from(invitationCampaigns)
      .where(eq(invitationCampaigns.salonId, salonId))
      .orderBy(sql`${invitationCampaigns.createdAt} DESC`);

    const totalSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered || 0), 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + (c.failed || 0), 0);

    return {
      totalCampaigns: campaigns.length,
      totalMessagesSent: totalSent,
      totalMessagesDelivered: totalDelivered,
      totalMessagesFailed: totalFailed,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
      byCampaign: campaigns.map((c) => ({
        ...c,
        deliveryRate: c.sent > 0 ? Math.round((c.delivered / c.sent) * 100) : 0,
      })),
    };
  }

  async getConversionMetrics(salonId: string): Promise<ConversionMetrics> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(eq(importedCustomers.salonId, salonId));

    const [invitedResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(
        and(
          eq(importedCustomers.salonId, salonId),
          sql`${importedCustomers.status} IN ('invited', 'registered')`
        )
      );

    const [registeredResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(
        and(
          eq(importedCustomers.salonId, salonId),
          eq(importedCustomers.status, "registered")
        )
      );

    const total = totalResult?.count || 0;
    const invited = invitedResult?.count || 0;
    const registered = registeredResult?.count || 0;

    return {
      totalImported: total,
      totalInvited: invited,
      totalRegistered: registered,
      importToInviteRate: total > 0 ? Math.round((invited / total) * 100) : 0,
      inviteToRegisterRate: invited > 0 ? Math.round((registered / invited) * 100) : 0,
      overallConversionRate: total > 0 ? Math.round((registered / total) * 100) : 0,
    };
  }

  async getOfferMetrics(salonId: string): Promise<OfferMetrics> {
    const offers = await db
      .select({
        offerId: welcomeOffers.id,
        offerName: welcomeOffers.name,
        discountType: welcomeOffers.discountType,
        discountValue: welcomeOffers.discountValue,
        totalRedemptions: welcomeOffers.totalRedemptions,
        isActive: welcomeOffers.isActive,
      })
      .from(welcomeOffers)
      .where(eq(welcomeOffers.salonId, salonId));

    const redemptionTotals = await db
      .select({
        welcomeOfferId: welcomeOfferRedemptions.welcomeOfferId,
        totalDiscount: sum(welcomeOfferRedemptions.discountAppliedInPaisa),
        redemptionCount: count(),
      })
      .from(welcomeOfferRedemptions)
      .innerJoin(welcomeOffers, eq(welcomeOfferRedemptions.welcomeOfferId, welcomeOffers.id))
      .where(eq(welcomeOffers.salonId, salonId))
      .groupBy(welcomeOfferRedemptions.welcomeOfferId);

    const redemptionMap = new Map(
      redemptionTotals.map((r) => [
        r.welcomeOfferId,
        { totalDiscount: Number(r.totalDiscount) || 0, count: r.redemptionCount || 0 },
      ])
    );

    const totalRedemptions = offers.reduce((sum, o) => sum + (o.totalRedemptions || 0), 0);
    const totalDiscountGiven = Array.from(redemptionMap.values()).reduce(
      (sum, r) => sum + r.totalDiscount,
      0
    );

    return {
      totalOffers: offers.length,
      activeOffers: offers.filter((o) => o.isActive === 1).length,
      totalRedemptions,
      totalDiscountGivenInPaisa: totalDiscountGiven,
      redemptionsByOffer: offers.map((o) => ({
        offerId: o.offerId,
        offerName: o.offerName,
        discountType: o.discountType,
        discountValue: o.discountValue,
        totalRedemptions: o.totalRedemptions || 0,
        totalDiscountGiven: redemptionMap.get(o.offerId)?.totalDiscount || 0,
        isActive: o.isActive === 1,
      })),
    };
  }

  async getConversionFunnel(salonId: string): Promise<ConversionFunnel> {
    const [importedResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(eq(importedCustomers.salonId, salonId));

    const [invitedResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(
        and(
          eq(importedCustomers.salonId, salonId),
          sql`${importedCustomers.status} IN ('invited', 'registered')`
        )
      );

    const [deliveredResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${invitationMessages.importedCustomerId})` })
      .from(invitationMessages)
      .innerJoin(importedCustomers, eq(invitationMessages.importedCustomerId, importedCustomers.id))
      .where(
        and(
          eq(importedCustomers.salonId, salonId),
          eq(invitationMessages.status, "delivered")
        )
      );

    const [registeredResult] = await db
      .select({ count: count() })
      .from(importedCustomers)
      .where(
        and(
          eq(importedCustomers.salonId, salonId),
          eq(importedCustomers.status, "registered")
        )
      );

    const [bookingResult] = await db.execute(sql`
      SELECT COUNT(DISTINCT ic.id) as count
      FROM imported_customers ic
      INNER JOIN users u ON ic.linked_user_id = u.id
      INNER JOIN bookings b ON b.customer_id = u.id
      WHERE ic.salon_id = ${salonId}
      AND ic.status = 'registered'
    `);

    const imported = importedResult?.count || 0;
    const invited = invitedResult?.count || 0;
    const delivered = deliveredResult?.count || 0;
    const registered = registeredResult?.count || 0;
    const firstBooking = Number((bookingResult as any)?.[0]?.count) || 0;

    return {
      imported,
      invited,
      delivered,
      registered,
      firstBooking,
      rates: {
        importToInvite: imported > 0 ? Math.round((invited / imported) * 100) : 0,
        inviteToDelivered: invited > 0 ? Math.round((delivered / invited) * 100) : 0,
        deliveredToRegistered: delivered > 0 ? Math.round((registered / delivered) * 100) : 0,
        registeredToBooking: registered > 0 ? Math.round((firstBooking / registered) * 100) : 0,
        overallConversion: imported > 0 ? Math.round((firstBooking / imported) * 100) : 0,
      },
    };
  }

  async getFullAnalytics(salonId: string): Promise<OnboardingAnalytics> {
    const [importMetrics, campaignMetrics, conversionMetrics, offerMetrics, funnel] =
      await Promise.all([
        this.getImportMetrics(salonId),
        this.getCampaignMetrics(salonId),
        this.getConversionMetrics(salonId),
        this.getOfferMetrics(salonId),
        this.getConversionFunnel(salonId),
      ]);

    return {
      importMetrics,
      campaignMetrics,
      conversionMetrics,
      offerMetrics,
      funnel,
    };
  }
}

export const onboardingAnalyticsService = new OnboardingAnalyticsService();
