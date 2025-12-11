import { db } from "../db";
import { eq, and, sql, gte, lte, desc, count } from "drizzle-orm";
import {
  bookings,
  bookingCancellations,
  payments,
  salons,
  users,
  CANCELLATION_REASON_CODES,
  type CancellationReasonCode,
  type Booking,
  type BookingCancellation,
} from "@shared/schema";
import { waitlistService } from "./waitlistService";

export interface CancellationFeePolicy {
  gracePeriodHours: number;
  tiers: {
    hoursBeforeMin: number;
    hoursBeforeMax: number;
    feePercentage: number;
  }[];
}

const DEFAULT_CANCELLATION_POLICY: CancellationFeePolicy = {
  gracePeriodHours: 24,
  tiers: [
    { hoursBeforeMin: 24, hoursBeforeMax: Infinity, feePercentage: 0 },
    { hoursBeforeMin: 12, hoursBeforeMax: 24, feePercentage: 25 },
    { hoursBeforeMin: 0, hoursBeforeMax: 12, feePercentage: 50 },
  ],
};

export interface CancelBookingInput {
  bookingId: string;
  userId?: string;
  cancelledBy: 'customer' | 'salon' | 'system';
  reasonCode: CancellationReasonCode;
  additionalComments?: string;
  requestRefund?: boolean;
  salonOwnerId?: string;
}

export interface CancelBookingResult {
  success: boolean;
  cancellation?: BookingCancellation;
  refundStatus?: 'pending' | 'processed' | 'not_applicable';
  refundAmountPaisa?: number;
  cancellationFeePaisa?: number;
  error?: string;
}

export interface CancellationAnalytics {
  totalCancellations: number;
  cancellationRate: number;
  topReasons: { code: string; count: number; percentage: number }[];
  averageHoursBeforeCancellation: number;
  rescheduledPercentage: number;
  refundRequestedPercentage: number;
  byCategory: Record<string, number>;
  trend: { date: string; count: number }[];
}

class CancellationService {
  validateReasonCode(code: string): code is CancellationReasonCode {
    return code in CANCELLATION_REASON_CODES;
  }

  getReasonCategory(code: CancellationReasonCode): string {
    return CANCELLATION_REASON_CODES[code].category;
  }

  getReasonLabel(code: CancellationReasonCode): string {
    return CANCELLATION_REASON_CODES[code].label;
  }

  calculateHoursBeforeAppointment(
    bookingDate: string,
    bookingTime: string,
    cancellationTime: Date = new Date()
  ): number {
    const appointmentDateTime = new Date(`${bookingDate}T${bookingTime}:00+05:30`);
    const diffMs = appointmentDateTime.getTime() - cancellationTime.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  }

  calculateCancellationFee(
    bookingAmountPaisa: number,
    hoursBeforeAppointment: number,
    policy: CancellationFeePolicy = DEFAULT_CANCELLATION_POLICY
  ): { feePaisa: number; feePercentage: number } {
    for (const tier of policy.tiers) {
      if (
        hoursBeforeAppointment >= tier.hoursBeforeMin &&
        hoursBeforeAppointment < tier.hoursBeforeMax
      ) {
        const feePaisa = Math.round((bookingAmountPaisa * tier.feePercentage) / 100);
        return { feePaisa, feePercentage: tier.feePercentage };
      }
    }
    return { feePaisa: bookingAmountPaisa, feePercentage: 100 };
  }

  async cancelBooking(input: CancelBookingInput): Promise<CancelBookingResult> {
    const {
      bookingId,
      userId,
      cancelledBy,
      reasonCode,
      additionalComments,
      requestRefund = false,
      salonOwnerId,
    } = input;

    if (!this.validateReasonCode(reasonCode)) {
      return { success: false, error: "Invalid cancellation reason code" };
    }

    const reasonCategory = this.getReasonCategory(reasonCode);

    return await db.transaction(async (tx) => {
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .for("update");

      if (!booking) {
        return { success: false, error: "Booking not found" };
      }

      if (booking.status === "cancelled") {
        return { success: false, error: "Booking is already cancelled" };
      }

      if (booking.status === "completed") {
        return { success: false, error: "Cannot cancel a completed booking" };
      }

      if (cancelledBy === "customer" && userId && booking.userId !== userId) {
        return { success: false, error: "You can only cancel your own bookings" };
      }

      if (cancelledBy === "salon" && salonOwnerId) {
        const salon = await tx.query.salons.findFirst({
          where: eq(salons.id, booking.salonId),
        });
        if (!salon || salon.ownerId !== salonOwnerId) {
          return { success: false, error: "You can only cancel bookings at your own salon" };
        }
      }

      const hoursBeforeAppointment = this.calculateHoursBeforeAppointment(
        booking.bookingDate,
        booking.bookingTime
      );

      const bookingAmount = booking.finalAmountPaisa ?? booking.totalAmountPaisa ?? 0;
      let cancellationFeePaisa = 0;
      let refundAmountPaisa = 0;

      if (bookingAmount <= 0) {
        cancellationFeePaisa = 0;
        refundAmountPaisa = 0;
      } else if (cancelledBy === "salon" || cancelledBy === "system") {
        cancellationFeePaisa = 0;
        refundAmountPaisa = bookingAmount;
      } else {
        const feeCalculation = this.calculateCancellationFee(
          bookingAmount,
          hoursBeforeAppointment
        );
        cancellationFeePaisa = feeCalculation.feePaisa;
        refundAmountPaisa = bookingAmount - cancellationFeePaisa;
      }

      await tx
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, bookingId));

      const [cancellation] = await tx
        .insert(bookingCancellations)
        .values({
          bookingId,
          userId: userId || booking.userId,
          cancelledBy,
          reasonCode,
          reasonCategory,
          additionalComments,
          wasRescheduled: 0,
          refundRequested: requestRefund ? 1 : 0,
          refundAmountPaisa: refundAmountPaisa > 0 ? refundAmountPaisa : null,
          cancellationFeePaisa: cancellationFeePaisa > 0 ? cancellationFeePaisa : null,
          hoursBeforeAppointment,
        })
        .returning();

      let refundStatus: 'pending' | 'processed' | 'not_applicable' = 'not_applicable';
      if (requestRefund && refundAmountPaisa > 0) {
        refundStatus = 'pending';
      }

      if (booking.timeSlotId) {
        setImmediate(async () => {
          try {
            await waitlistService.processSlotRelease(booking.timeSlotId!);
            console.log(`[Waitlist] Processed slot release for booking ${bookingId}`);
          } catch (error) {
            console.error(`[Waitlist] Error processing slot release for booking ${bookingId}:`, error);
          }
        });
      }

      return {
        success: true,
        cancellation,
        refundStatus,
        refundAmountPaisa,
        cancellationFeePaisa,
      };
    });
  }

  async getCancellationPreview(
    bookingId: string,
    userId?: string
  ): Promise<{
    booking: Partial<Booking>;
    hoursBeforeAppointment: number;
    cancellationFeePaisa: number;
    refundAmountPaisa: number;
    feePercentage: number;
    policy: { tier: string; description: string }[];
    canCancel: boolean;
    cancelError?: string;
  } | null> {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) return null;

    if (userId && booking.userId !== userId) return null;

    if (booking.status === 'cancelled') {
      return {
        booking: { id: booking.id, status: booking.status },
        hoursBeforeAppointment: 0,
        cancellationFeePaisa: 0,
        refundAmountPaisa: 0,
        feePercentage: 0,
        policy: [],
        canCancel: false,
        cancelError: 'This booking is already cancelled',
      };
    }

    if (booking.status === 'completed') {
      return {
        booking: { id: booking.id, status: booking.status },
        hoursBeforeAppointment: 0,
        cancellationFeePaisa: 0,
        refundAmountPaisa: 0,
        feePercentage: 0,
        policy: [],
        canCancel: false,
        cancelError: 'Cannot cancel a completed booking',
      };
    }

    const hoursBeforeAppointment = this.calculateHoursBeforeAppointment(
      booking.bookingDate,
      booking.bookingTime
    );

    const bookingAmount = booking.finalAmountPaisa ?? booking.totalAmountPaisa ?? 0;
    const { feePaisa, feePercentage } = this.calculateCancellationFee(
      bookingAmount,
      hoursBeforeAppointment
    );

    const policy = [
      { tier: "24+ hours", description: "Free cancellation" },
      { tier: "12-24 hours", description: "25% cancellation fee" },
      { tier: "Less than 12 hours", description: "50% cancellation fee" },
    ];

    return {
      booking: {
        id: booking.id,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        status: booking.status,
        totalAmountPaisa: booking.totalAmountPaisa,
        finalAmountPaisa: booking.finalAmountPaisa,
      },
      hoursBeforeAppointment,
      cancellationFeePaisa: feePaisa,
      refundAmountPaisa: bookingAmount - feePaisa,
      feePercentage,
      policy,
      canCancel: true,
    };
  }

  async getCancellationBySalonId(
    bookingId: string,
    salonId: string
  ): Promise<BookingCancellation | null> {
    const booking = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.salonId, salonId)),
    });

    if (!booking) return null;

    const cancellation = await db.query.bookingCancellations.findFirst({
      where: eq(bookingCancellations.bookingId, bookingId),
    });

    return cancellation || null;
  }

  async getSalonCancellationAnalytics(
    salonId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CancellationAnalytics> {
    const salonBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.salonId, salonId));

    const bookingIds = salonBookings.map((b) => b.id);

    if (bookingIds.length === 0) {
      return {
        totalCancellations: 0,
        cancellationRate: 0,
        topReasons: [],
        averageHoursBeforeCancellation: 0,
        rescheduledPercentage: 0,
        refundRequestedPercentage: 0,
        byCategory: {},
        trend: [],
      };
    }

    const cancellations = await db
      .select()
      .from(bookingCancellations)
      .where(
        and(
          sql`${bookingCancellations.bookingId} = ANY(${sql`ARRAY[${sql.join(
            bookingIds.map((id) => sql`${id}`),
            sql`, `
          )}]`})`,
          gte(bookingCancellations.createdAt, startDate),
          lte(bookingCancellations.createdAt, endDate)
        )
      );

    const totalBookings = bookingIds.length;
    const totalCancellations = cancellations.length;
    const cancellationRate =
      totalBookings > 0 ? (totalCancellations / totalBookings) * 100 : 0;

    const reasonCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let totalHours = 0;
    let rescheduledCount = 0;
    let refundRequestedCount = 0;

    for (const c of cancellations) {
      reasonCounts[c.reasonCode] = (reasonCounts[c.reasonCode] || 0) + 1;
      categoryCounts[c.reasonCategory] = (categoryCounts[c.reasonCategory] || 0) + 1;
      if (c.hoursBeforeAppointment) totalHours += c.hoursBeforeAppointment;
      if (c.wasRescheduled) rescheduledCount++;
      if (c.refundRequested) refundRequestedCount++;
    }

    const topReasons = Object.entries(reasonCounts)
      .map(([code, count]) => ({
        code,
        count,
        percentage: totalCancellations > 0 ? (count / totalCancellations) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const averageHoursBeforeCancellation =
      totalCancellations > 0 ? totalHours / totalCancellations : 0;

    const rescheduledPercentage =
      totalCancellations > 0 ? (rescheduledCount / totalCancellations) * 100 : 0;

    const refundRequestedPercentage =
      totalCancellations > 0 ? (refundRequestedCount / totalCancellations) * 100 : 0;

    const trendData: Record<string, number> = {};
    for (const c of cancellations) {
      if (c.createdAt) {
        const dateKey = c.createdAt.toISOString().split("T")[0];
        trendData[dateKey] = (trendData[dateKey] || 0) + 1;
      }
    }

    const trend = Object.entries(trendData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCancellations,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      topReasons,
      averageHoursBeforeCancellation: Math.round(averageHoursBeforeCancellation * 10) / 10,
      rescheduledPercentage: Math.round(rescheduledPercentage * 10) / 10,
      refundRequestedPercentage: Math.round(refundRequestedPercentage * 10) / 10,
      byCategory: categoryCounts,
      trend,
    };
  }

  getAvailableReasonCodes(cancelledBy: 'customer' | 'salon' | 'system'): {
    code: CancellationReasonCode;
    label: string;
    category: string;
  }[] {
    const customerReasons: CancellationReasonCode[] = [
      'schedule_conflict',
      'found_better_price',
      'service_not_needed',
      'health_issue',
      'family_emergency',
      'travel_plans',
      'staff_unavailable',
      'long_wait_time',
      'poor_reviews',
      'booked_by_mistake',
      'weather_conditions',
      'transportation_issue',
      'financial_reason',
      'other',
    ];

    const salonReasons: CancellationReasonCode[] = [
      'staff_sick',
      'staff_emergency',
      'equipment_issue',
      'double_booking',
      'salon_closed',
      'customer_no_show_history',
      'other',
    ];

    const systemReasons: CancellationReasonCode[] = [
      'payment_failed',
      'payment_timeout',
      'slot_no_longer_available',
      'service_discontinued',
    ];

    let codes: CancellationReasonCode[];
    switch (cancelledBy) {
      case 'customer':
        codes = customerReasons;
        break;
      case 'salon':
        codes = salonReasons;
        break;
      case 'system':
        codes = systemReasons;
        break;
      default:
        codes = [];
    }

    return codes.map((code) => ({
      code,
      label: CANCELLATION_REASON_CODES[code].label,
      category: CANCELLATION_REASON_CODES[code].category,
    }));
  }
}

export const cancellationService = new CancellationService();
