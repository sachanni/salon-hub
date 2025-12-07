import { db } from '../db';
import { 
  bookings, 
  depositTransactions, 
  depositSettings,
  cancellationPolicies, 
  trustedCustomers,
  salons
} from '@shared/schema';
import { eq, and, sql, lt, isNotNull } from 'drizzle-orm';

export interface NoShowResult {
  success: boolean;
  bookingId: string;
  previousStatus: string;
  depositAction?: 'forfeited' | 'charged_full' | 'partial_forfeit' | 'no_deposit';
  depositAmountPaisa?: number;
  error?: string;
}

export interface NoShowDetectionResult {
  processed: number;
  noShowsMarked: number;
  depositsForfeited: number;
  errors: string[];
}

class NoShowService {
  async markBookingAsNoShow(
    bookingId: string, 
    salonId: string, 
    processedBy?: string
  ): Promise<NoShowResult> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.salonId, salonId)
        ),
      });

      if (!booking) {
        return { 
          success: false, 
          bookingId, 
          previousStatus: '', 
          error: 'Booking not found' 
        };
      }

      if (booking.status !== 'confirmed') {
        return { 
          success: false, 
          bookingId, 
          previousStatus: booking.status, 
          error: `Cannot mark as no-show: booking status is ${booking.status}, must be confirmed` 
        };
      }

      await db.update(bookings)
        .set({ 
          status: 'no_show',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

      const depositResult = await this.processDepositForNoShow(
        bookingId, 
        salonId, 
        booking.userId,
        processedBy
      );

      await this.updateCustomerNoShowStats(salonId, booking.userId);

      return {
        success: true,
        bookingId,
        previousStatus: booking.status,
        depositAction: depositResult.action,
        depositAmountPaisa: depositResult.amountPaisa,
      };
    } catch (error) {
      console.error('Error marking booking as no-show:', error);
      return { 
        success: false, 
        bookingId, 
        previousStatus: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  private async processDepositForNoShow(
    bookingId: string,
    salonId: string,
    customerId: string | null,
    processedBy?: string
  ): Promise<{ action: 'forfeited' | 'charged_full' | 'partial_forfeit' | 'no_deposit'; amountPaisa?: number; refundedPaisa?: number }> {
    const depositTx = await db.query.depositTransactions.findFirst({
      where: and(
        eq(depositTransactions.bookingId, bookingId),
        eq(depositTransactions.transactionType, 'deposit_collected'),
        eq(depositTransactions.status, 'completed')
      ),
    });

    if (!depositTx) {
      return { action: 'no_deposit' };
    }

    const policy = await db.query.cancellationPolicies.findFirst({
      where: eq(cancellationPolicies.salonId, salonId),
    });

    const noShowAction = policy?.noShowAction || 'forfeit_full';
    const originalDepositAmount = depositTx.amountPaisa;
    let forfeitAmount = originalDepositAmount;
    let refundAmount = 0;
    let action: 'forfeited' | 'charged_full' | 'partial_forfeit' = 'forfeited';

    if (noShowAction === 'forfeit_partial' && policy?.partialForfeitPercentage) {
      forfeitAmount = Math.round(originalDepositAmount * policy.partialForfeitPercentage / 100);
      refundAmount = originalDepositAmount - forfeitAmount;
      action = 'partial_forfeit';
    } else if (noShowAction === 'charge_full_service' && policy?.noShowChargeFull === 1) {
      forfeitAmount = depositTx.serviceAmountPaisa;
      action = 'charged_full';
    }

    await db.update(depositTransactions)
      .set({
        transactionType: 'deposit_forfeited',
        amountPaisa: forfeitAmount,
        status: 'completed',
        reason: `No-show: ${noShowAction}`,
        wasNoShow: 1,
        forfeitedAt: new Date(),
        processedAt: new Date(),
        processedBy: processedBy || null,
        updatedAt: new Date(),
      })
      .where(eq(depositTransactions.id, depositTx.id));

    if (noShowAction === 'forfeit_partial' && refundAmount > 0) {
      await db.insert(depositTransactions).values({
        salonId,
        bookingId,
        customerId: customerId || depositTx.customerId,
        transactionType: 'deposit_refunded',
        amountPaisa: refundAmount,
        serviceAmountPaisa: depositTx.serviceAmountPaisa,
        depositPercentage: 100 - (policy?.partialForfeitPercentage || 0),
        status: 'pending',
        reason: 'Partial refund for no-show (policy allows partial forfeit)',
        wasNoShow: 1,
        notes: `Refund of ${refundAmount / 100} (${100 - (policy?.partialForfeitPercentage || 0)}% of deposit) per cancellation policy`,
      });
    }

    if (noShowAction === 'charge_full_service' && forfeitAmount > originalDepositAmount) {
      await db.insert(depositTransactions).values({
        salonId,
        bookingId,
        customerId: customerId || depositTx.customerId,
        transactionType: 'no_show_charged',
        amountPaisa: forfeitAmount - originalDepositAmount,
        serviceAmountPaisa: depositTx.serviceAmountPaisa,
        depositPercentage: 100,
        status: 'pending',
        reason: 'Additional charge for no-show (full service price)',
        wasNoShow: 1,
        notes: 'Pending charge for remaining service amount due to no-show',
      });
    }

    return { action, amountPaisa: forfeitAmount, refundedPaisa: refundAmount > 0 ? refundAmount : undefined };
  }

  private async updateCustomerNoShowStats(salonId: string, customerId: string | null): Promise<void> {
    if (!customerId) return;

    const trustedCustomer = await db.query.trustedCustomers.findFirst({
      where: and(
        eq(trustedCustomers.salonId, salonId),
        eq(trustedCustomers.customerId, customerId)
      ),
    });

    if (trustedCustomer) {
      const newNoShowCount = (trustedCustomer.noShowCount || 0) + 1;
      
      let newTrustLevel = trustedCustomer.trustLevel;
      let newCanBypassDeposit = trustedCustomer.canBypassDeposit;
      
      if (newNoShowCount >= 3) {
        newTrustLevel = 'blacklisted';
        newCanBypassDeposit = 0;
      } else if (newNoShowCount >= 2) {
        newCanBypassDeposit = 0;
      }

      await db.update(trustedCustomers)
        .set({
          noShowCount: newNoShowCount,
          trustLevel: newTrustLevel,
          canBypassDeposit: newCanBypassDeposit,
          lastUpdatedAt: new Date(),
        })
        .where(eq(trustedCustomers.id, trustedCustomer.id));
    } else {
      await db.insert(trustedCustomers).values({
        salonId,
        customerId,
        trustLevel: 'trusted',
        noShowCount: 1,
        totalBookings: 1,
        completedBookings: 0,
        canBypassDeposit: 0,
      });
    }
  }

  async detectAndMarkNoShows(): Promise<NoShowDetectionResult> {
    const result: NoShowDetectionResult = {
      processed: 0,
      noShowsMarked: 0,
      depositsForfeited: 0,
      errors: [],
    };

    try {
      const allSalons = await db.query.salons.findMany({
        where: eq(salons.status, 'active'),
      });

      for (const salon of allSalons) {
        const policy = await db.query.cancellationPolicies.findFirst({
          where: eq(cancellationPolicies.salonId, salon.id),
        });

        const graceMinutes = policy?.noShowGraceMinutes || 15;
        
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - graceMinutes * 60 * 1000);
        
        const overdueBookings = await db.select()
          .from(bookings)
          .where(and(
            eq(bookings.salonId, salon.id),
            eq(bookings.status, 'confirmed'),
            sql`CONCAT(${bookings.bookingDate}, ' ', ${bookings.bookingTime})::timestamp < ${cutoffTime.toISOString()}`
          ));

        for (const booking of overdueBookings) {
          result.processed++;
          
          const noShowResult = await this.markBookingAsNoShow(
            booking.id, 
            salon.id, 
            'system_auto_detection'
          );

          if (noShowResult.success) {
            result.noShowsMarked++;
            if (noShowResult.depositAction && noShowResult.depositAction !== 'no_deposit') {
              result.depositsForfeited++;
            }
          } else {
            result.errors.push(`Booking ${booking.id}: ${noShowResult.error}`);
          }
        }
      }

      console.log(`[NoShow Detection] Processed: ${result.processed}, Marked: ${result.noShowsMarked}, Deposits: ${result.depositsForfeited}`);
      
      return result;
    } catch (error) {
      console.error('Error in no-show detection:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  async getNoShowStatistics(salonId: string, days: number = 30): Promise<{
    totalNoShows: number;
    depositsForfeited: number;
    totalForfeitedAmountPaisa: number;
    totalRefundedAmountPaisa: number;
    repeatOffenders: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [stats] = await db.select({
      totalNoShows: sql<number>`COUNT(DISTINCT ${bookings.id})::int`,
      depositsForfeited: sql<number>`COUNT(CASE WHEN ${depositTransactions.transactionType} = 'deposit_forfeited' AND ${depositTransactions.wasNoShow} = 1 THEN 1 END)::int`,
      totalForfeitedAmountPaisa: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_forfeited' AND ${depositTransactions.wasNoShow} = 1 THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
      totalRefundedAmountPaisa: sql<number>`COALESCE(SUM(CASE WHEN ${depositTransactions.transactionType} = 'deposit_refunded' AND ${depositTransactions.wasNoShow} = 1 THEN ${depositTransactions.amountPaisa} ELSE 0 END), 0)::int`,
    })
    .from(bookings)
    .leftJoin(depositTransactions, eq(bookings.id, depositTransactions.bookingId))
    .where(and(
      eq(bookings.salonId, salonId),
      eq(bookings.status, 'no_show'),
      sql`${bookings.createdAt} >= ${startDate}`
    ));

    const [repeatOffendersResult] = await db.select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(trustedCustomers)
    .where(and(
      eq(trustedCustomers.salonId, salonId),
      sql`${trustedCustomers.noShowCount} >= 2`
    ));

    return {
      totalNoShows: stats?.totalNoShows || 0,
      depositsForfeited: stats?.depositsForfeited || 0,
      totalForfeitedAmountPaisa: stats?.totalForfeitedAmountPaisa || 0,
      totalRefundedAmountPaisa: stats?.totalRefundedAmountPaisa || 0,
      repeatOffenders: repeatOffendersResult?.count || 0,
    };
  }
}

export const noShowService = new NoShowService();
