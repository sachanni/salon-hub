import type { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";
import {
  bookings,
  bookingCancellations,
  salons,
  CANCELLATION_REASON_CODES,
  type CancellationReasonCode,
} from "@shared/schema";
import { cancellationService } from "../services/cancellationService";
import { authenticateMobileUser } from "../middleware/authMobile";
import {
  requireSalonAccess,
  populateUserFromSession,
  type AuthenticatedRequest,
} from "../middleware/auth";

const cancelBookingSchema = z.object({
  reasonCode: z.string().min(1),
  additionalComments: z.string().max(1000).optional(),
  requestRefund: z.boolean().optional().default(true),
});

const analyticsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupBy: z.enum(["reason_code", "reason_category", "day", "week", "month"]).optional(),
});

export function registerCancellationRoutes(app: Express) {
  app.get("/api/cancellation/reasons", (req: Request, res: Response) => {
    try {
      const cancelledBy = (req.query.type as string) || "customer";

      if (!["customer", "salon", "system"].includes(cancelledBy)) {
        return res.status(400).json({ error: "Invalid cancellation type" });
      }

      const reasons = cancellationService.getAvailableReasonCodes(
        cancelledBy as "customer" | "salon" | "system"
      );

      const groupedByCategory: Record<
        string,
        { code: string; label: string }[]
      > = {};
      for (const reason of reasons) {
        if (!groupedByCategory[reason.category]) {
          groupedByCategory[reason.category] = [];
        }
        groupedByCategory[reason.category].push({
          code: reason.code,
          label: reason.label,
        });
      }

      res.json({
        success: true,
        reasons,
        byCategory: groupedByCategory,
      });
    } catch (error) {
      console.error("Error fetching cancellation reasons:", error);
      res.status(500).json({ error: "Failed to fetch cancellation reasons" });
    }
  });

  app.get(
    "/api/bookings/:bookingId/cancellation-preview",
    populateUserFromSession,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { bookingId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const preview = await cancellationService.getCancellationPreview(
          bookingId,
          userId
        );

        if (!preview) {
          return res.status(404).json({ error: "Booking not found or access denied" });
        }

        res.json({
          success: true,
          preview: {
            bookingId: preview.booking.id,
            bookingDate: preview.booking.bookingDate,
            bookingTime: preview.booking.bookingTime,
            hoursBeforeAppointment: preview.hoursBeforeAppointment,
            cancellationFee: preview.cancellationFeePaisa / 100,
            cancellationFeePaisa: preview.cancellationFeePaisa,
            refundAmount: preview.refundAmountPaisa / 100,
            refundAmountPaisa: preview.refundAmountPaisa,
            feePercentage: preview.feePercentage,
            policy: preview.policy,
            canCancel: preview.canCancel,
            cancelError: preview.cancelError,
          },
        });
      } catch (error) {
        console.error("Error getting cancellation preview:", error);
        res.status(500).json({ error: "Failed to get cancellation preview" });
      }
    }
  );

  app.post(
    "/api/bookings/:bookingId/cancel",
    populateUserFromSession,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { bookingId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const parsed = cancelBookingSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid request body",
            details: parsed.error.flatten(),
          });
        }

        const { reasonCode, additionalComments, requestRefund } = parsed.data;

        const result = await cancellationService.cancelBooking({
          bookingId,
          userId,
          cancelledBy: "customer",
          reasonCode: reasonCode as CancellationReasonCode,
          additionalComments,
          requestRefund,
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({
          success: true,
          message: "Booking cancelled successfully",
          cancellation: {
            id: result.cancellation?.id,
            refundStatus: result.refundStatus,
            refundAmount: (result.refundAmountPaisa || 0) / 100,
            refundAmountPaisa: result.refundAmountPaisa,
            cancellationFee: (result.cancellationFeePaisa || 0) / 100,
            cancellationFeePaisa: result.cancellationFeePaisa,
          },
        });
      } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ error: "Failed to cancel booking" });
      }
    }
  );

  app.post(
    "/api/salons/:salonId/bookings/:bookingId/cancel",
    requireSalonAccess,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { salonId, bookingId } = req.params;
        const ownerId = req.user?.id;

        if (!ownerId) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const parsed = cancelBookingSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid request body",
            details: parsed.error.flatten(),
          });
        }

        const { reasonCode, additionalComments, requestRefund } = parsed.data;

        const booking = await db.query.bookings.findFirst({
          where: and(eq(bookings.id, bookingId), eq(bookings.salonId, salonId)),
        });

        if (!booking) {
          return res.status(404).json({ error: "Booking not found in this salon" });
        }

        const result = await cancellationService.cancelBooking({
          bookingId,
          userId: booking.userId || undefined,
          cancelledBy: "salon",
          reasonCode: reasonCode as CancellationReasonCode,
          additionalComments,
          requestRefund,
          salonOwnerId: ownerId,
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({
          success: true,
          message: "Booking cancelled by salon",
          cancellation: {
            id: result.cancellation?.id,
            refundStatus: result.refundStatus,
            refundAmountPaisa: result.refundAmountPaisa,
            cancellationFeePaisa: result.cancellationFeePaisa,
          },
        });
      } catch (error) {
        console.error("Error cancelling booking by salon:", error);
        res.status(500).json({ error: "Failed to cancel booking" });
      }
    }
  );

  app.get(
    "/api/salons/:salonId/cancellation-analytics",
    requireSalonAccess,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { salonId } = req.params;
        const parsed = analyticsQuerySchema.safeParse(req.query);

        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid query parameters",
            details: parsed.error.flatten(),
          });
        }

        const { startDate, endDate } = parsed.data;

        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate
          ? new Date(startDate)
          : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

        const analytics = await cancellationService.getSalonCancellationAnalytics(
          salonId,
          start,
          end
        );

        res.json({
          success: true,
          period: {
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
          },
          analytics,
        });
      } catch (error) {
        console.error("Error fetching cancellation analytics:", error);
        res.status(500).json({ error: "Failed to fetch cancellation analytics" });
      }
    }
  );

  app.get(
    "/api/salons/:salonId/cancellations",
    requireSalonAccess,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { salonId } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        const salonBookings = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.salonId, salonId));

        const bookingIds = salonBookings.map((b) => b.id);

        if (bookingIds.length === 0) {
          return res.json({
            success: true,
            cancellations: [],
            pagination: { total: 0, limit, offset, hasMore: false },
          });
        }

        const cancellations = await db
          .select()
          .from(bookingCancellations)
          .where(
            sql`${bookingCancellations.bookingId} = ANY(${sql`ARRAY[${sql.join(
              bookingIds.map((id) => sql`${id}`),
              sql`, `
            )}]`})`
          )
          .orderBy(desc(bookingCancellations.createdAt))
          .limit(limit)
          .offset(offset);

        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(bookingCancellations)
          .where(
            sql`${bookingCancellations.bookingId} = ANY(${sql`ARRAY[${sql.join(
              bookingIds.map((id) => sql`${id}`),
              sql`, `
            )}]`})`
          );

        const total = parseInt(String(countResult?.count || 0));

        const cancellationBookingIds = cancellations.map((c) => c.bookingId);
        const relatedBookings = cancellationBookingIds.length > 0
          ? await db
              .select({
                id: bookings.id,
                customerName: bookings.customerName,
                customerPhone: bookings.customerPhone,
                bookingDate: bookings.bookingDate,
                bookingTime: bookings.bookingTime,
                totalAmountPaisa: bookings.totalAmountPaisa,
              })
              .from(bookings)
              .where(sql`${bookings.id} = ANY(${sql`ARRAY[${sql.join(
                cancellationBookingIds.map((id) => sql`${id}`),
                sql`, `
              )}]`})`)
          : [];

        const bookingsMap = new Map(relatedBookings.map((b) => [b.id, b]));

        const enrichedCancellations = cancellations.map((c) => {
          const booking = bookingsMap.get(c.bookingId);
          return {
            ...c,
            reasonLabel: CANCELLATION_REASON_CODES[c.reasonCode as CancellationReasonCode]?.label || c.reasonCode,
            booking: booking || null,
          };
        });

        res.json({
          success: true,
          cancellations: enrichedCancellations,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + cancellations.length < total,
          },
        });
      } catch (error) {
        console.error("Error fetching cancellations:", error);
        res.status(500).json({ error: "Failed to fetch cancellations" });
      }
    }
  );
}

export function registerMobileCancellationRoutes(app: Express) {
  app.get("/api/mobile/cancellation/reasons", (req: Request, res: Response) => {
    try {
      const reasons = cancellationService.getAvailableReasonCodes("customer");

      const groupedByCategory: Record<
        string,
        { code: string; label: string }[]
      > = {};
      for (const reason of reasons) {
        if (!groupedByCategory[reason.category]) {
          groupedByCategory[reason.category] = [];
        }
        groupedByCategory[reason.category].push({
          code: reason.code,
          label: reason.label,
        });
      }

      res.json({
        success: true,
        reasons,
        byCategory: groupedByCategory,
      });
    } catch (error) {
      console.error("Error fetching cancellation reasons:", error);
      res.status(500).json({ error: "Failed to fetch cancellation reasons" });
    }
  });

  app.get(
    "/api/mobile/bookings/:bookingId/cancellation-preview",
    authenticateMobileUser,
    async (req: any, res: Response) => {
      try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const preview = await cancellationService.getCancellationPreview(
          bookingId,
          userId
        );

        if (!preview) {
          return res.status(404).json({ error: "Booking not found" });
        }

        res.json({
          success: true,
          preview: {
            bookingId: preview.booking.id,
            bookingDate: preview.booking.bookingDate,
            bookingTime: preview.booking.bookingTime,
            hoursBeforeAppointment: preview.hoursBeforeAppointment,
            cancellationFee: preview.cancellationFeePaisa / 100,
            cancellationFeePaisa: preview.cancellationFeePaisa,
            refundAmount: preview.refundAmountPaisa / 100,
            refundAmountPaisa: preview.refundAmountPaisa,
            feePercentage: preview.feePercentage,
            policy: preview.policy,
            canCancel: preview.canCancel,
            cancelError: preview.cancelError,
          },
        });
      } catch (error) {
        console.error("Error getting cancellation preview:", error);
        res.status(500).json({ error: "Failed to get cancellation preview" });
      }
    }
  );

  app.post(
    "/api/mobile/bookings/:bookingId/cancel",
    authenticateMobileUser,
    async (req: any, res: Response) => {
      try {
        const { bookingId } = req.params;
        const userId = req.user.id;

        const parsed = cancelBookingSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid request body",
            details: parsed.error.flatten(),
          });
        }

        const { reasonCode, additionalComments, requestRefund } = parsed.data;

        const result = await cancellationService.cancelBooking({
          bookingId,
          userId,
          cancelledBy: "customer",
          reasonCode: reasonCode as CancellationReasonCode,
          additionalComments,
          requestRefund,
        });

        if (!result.success) {
          return res.status(400).json({ error: result.error });
        }

        res.json({
          success: true,
          message: "Booking cancelled successfully",
          cancellation: {
            id: result.cancellation?.id,
            refundStatus: result.refundStatus,
            refundAmount: (result.refundAmountPaisa || 0) / 100,
            refundAmountPaisa: result.refundAmountPaisa,
            cancellationFee: (result.cancellationFeePaisa || 0) / 100,
            cancellationFeePaisa: result.cancellationFeePaisa,
          },
        });
      } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ error: "Failed to cancel booking" });
      }
    }
  );
}
