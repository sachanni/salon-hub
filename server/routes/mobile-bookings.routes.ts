import type { Express, Response } from "express";
import { db } from "../db";
import { bookings, services, salons, staff, salonReviews, users, servicePackages, platformOffers, userOfferUsage } from "@shared/schema";
import { eq, and, sql, desc, or, gte, lt, asc, inArray } from "drizzle-orm";
import { authenticateMobileUser } from "../middleware/authMobile";
import { z } from "zod";
import { OfferCalculator } from "../offerCalculator";

const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
});

const rescheduleBookingSchema = z.object({
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookingTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const submitReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const createBookingSchema = z.object({
  salonId: z.string().min(1),
  serviceIds: z.array(z.string()).min(1),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  serviceType: z.enum(['salon', 'home']).default('salon'),
  address: z.string().optional(),
  notes: z.string().max(1000).optional(),
  // Package booking fields
  packageId: z.string().optional(),
  isPackageBooking: z.boolean().optional(),
  totalPrice: z.number().optional(),
  totalDuration: z.number().optional(),
  // Offer/coupon discount fields
  offerId: z.string().optional(),
}).refine(
  (data) => data.serviceType !== 'home' || (data.address && data.address.trim().length > 0),
  { message: "Address is required for home service", path: ["address"] }
);

export function registerMobileBookingsRoutes(app: Express) {
  app.post("/api/mobile/bookings", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const parsed = createBookingSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid booking data", 
          details: parsed.error.flatten() 
        });
      }

      const { salonId, serviceIds, staffId, date, time, serviceType, address, notes } = parsed.data;

      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        return res.status(400).json({ error: "Cannot book appointments in the past" });
      }

      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, salonId),
      });

      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      if (salon.isActive !== 1) {
        return res.status(400).json({ error: "This salon is not currently accepting bookings" });
      }

      const selectedServices = await db.select()
        .from(services)
        .where(and(
          eq(services.salonId, salonId),
          inArray(services.id, serviceIds),
          eq(services.isActive, 1)
        ));

      if (selectedServices.length === 0) {
        return res.status(400).json({ error: "No valid services found for this salon" });
      }

      if (selectedServices.length !== serviceIds.length) {
        const foundIds = new Set(selectedServices.map(s => s.id));
        const invalidIds = serviceIds.filter(id => !foundIds.has(id));
        return res.status(400).json({ 
          error: "Some services are invalid or do not belong to this salon",
          invalidServiceIds: invalidIds
        });
      }

      if (staffId) {
        const staffMember = await db.query.staff.findFirst({
          where: and(
            eq(staff.id, staffId),
            eq(staff.salonId, salonId),
            eq(staff.isActive, 1)
          ),
        });
        if (!staffMember) {
          return res.status(400).json({ error: "Invalid or inactive staff member" });
        }
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Calculate service totals
      const serviceTotalPaisa = selectedServices.reduce((sum, s) => sum + (s.priceInPaisa || 0), 0);
      const serviceTotalDuration = selectedServices.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
      const primaryService = selectedServices[0];
      const serviceNames = selectedServices.map(s => s.name).join(', ');

      // Handle package booking - use package price instead of service sum
      let totalAmountPaisa = serviceTotalPaisa;
      let totalDuration = serviceTotalDuration;
      let packageName: string | null = null;
      let isPackageBookingFlag = false;

      const { packageId, isPackageBooking: isPackageBookingInput, totalPrice: clientTotalPrice, totalDuration: clientTotalDuration } = parsed.data;

      if (packageId && isPackageBookingInput) {
        const packageData = await db.query.servicePackages.findFirst({
          where: and(
            eq(servicePackages.id, packageId),
            eq(servicePackages.salonId, salonId)
          ),
        });

        if (!packageData) {
          return res.status(404).json({ error: "Package not found" });
        }

        if (!packageData.isActive) {
          return res.status(400).json({ error: "Package is no longer active" });
        }

        // Check validity dates
        const now = new Date();
        if (packageData.validFrom && new Date(packageData.validFrom) > now) {
          return res.status(400).json({ error: "Package is not yet available" });
        }
        if (packageData.validUntil && new Date(packageData.validUntil) < now) {
          return res.status(400).json({ error: "Package has expired" });
        }

        // Validate that serviceIds match the package services
        const packageServiceIds = Array.isArray(packageData.serviceIds) 
          ? packageData.serviceIds 
          : JSON.parse(packageData.serviceIds as string || '[]');
        
        const sortedPackageServiceIds = [...packageServiceIds].sort();
        const sortedRequestServiceIds = [...serviceIds].sort();
        
        if (JSON.stringify(sortedPackageServiceIds) !== JSON.stringify(sortedRequestServiceIds)) {
          console.warn(`Package service mismatch: package has ${packageServiceIds.join(',')}, request has ${serviceIds.join(',')}`);
          return res.status(400).json({
            error: "Service mismatch",
            details: "The services in your booking do not match the package contents",
          });
        }

        // Use server-calculated package price and duration (never trust client)
        totalAmountPaisa = packageData.packagePriceInPaisa;
        totalDuration = packageData.totalDurationMinutes;
        packageName = packageData.name;
        isPackageBookingFlag = true;

        console.log(`📦 Mobile package booking: using package price ${totalAmountPaisa} instead of service total ${serviceTotalPaisa}`);
      } else {
        // For non-package bookings, always use server-calculated totals (ignore client values)
        totalAmountPaisa = serviceTotalPaisa;
        totalDuration = serviceTotalDuration;
        
        if (clientTotalPrice && clientTotalPrice !== serviceTotalPaisa) {
          console.warn(`Non-package price mismatch ignored: client sent ${clientTotalPrice}, using server calculated ${serviceTotalPaisa}`);
        }
      }

      // Handle offer/coupon discount
      const { offerId } = parsed.data;
      let offerDiscountPaisa = 0;
      let appliedOffer: { id: string; title: string; discountType: string; discountValue: number } | null = null;

      if (offerId && !isPackageBookingFlag) {
        // Fetch the offer from database
        const offer = await db.query.platformOffers.findFirst({
          where: eq(platformOffers.id, offerId),
        });

        if (offer) {
          // Check if offer is active and valid (with null-safety for dates)
          const now = new Date();
          const validFrom = offer.validFrom ? new Date(offer.validFrom) : new Date(0);
          const validUntil = offer.validUntil ? new Date(offer.validUntil) : new Date('2099-12-31');
          const isDateValid = now >= validFrom && now <= validUntil;
          const isOfferActive = offer.isActive === 1 && isDateValid;

          // Check usage limit (global limit)
          const hasUsageRemaining = !offer.usageLimit || (offer.usageCount || 0) < offer.usageLimit;

          // Check salon applicability (offer.salonId null means platform-wide)
          const isSalonApplicable = !offer.salonId || offer.salonId === salonId || offer.isPlatformWide === 1;

          // Check minimum purchase requirement
          const meetsMinimum = !offer.minimumPurchase || totalAmountPaisa >= offer.minimumPurchase;

          // Check per-user usage limit if applicable (maxUsagePerUser may not exist on all offers)
          let userUsageValid = true;
          const maxPerUser = (offer as any).maxUsagePerUser;
          if (maxPerUser) {
            const [userUsageCount] = await db.select({ count: sql<number>`count(*)` })
              .from(userOfferUsage)
              .where(and(
                eq(userOfferUsage.userId, userId),
                eq(userOfferUsage.offerId, offerId)
              ));
            const userUsages = parseInt(String(userUsageCount?.count || 0)) || 0;
            userUsageValid = userUsages < maxPerUser;
            if (!userUsageValid) {
              console.log(`⚠️ User ${userId} exceeded per-user limit for offer ${offerId}`);
            }
          }

          if (isOfferActive && hasUsageRemaining && isSalonApplicable && meetsMinimum && userUsageValid) {
            // Calculate discount using OfferCalculator
            const offerDetails = {
              id: offer.id,
              title: offer.title,
              description: offer.description,
              discountType: offer.discountType as 'percentage' | 'fixed',
              discountValue: offer.discountValue,
              minimumPurchase: offer.minimumPurchase,
              maxDiscount: offer.maxDiscount,
              isPlatformWide: offer.isPlatformWide,
              salonId: offer.salonId,
              ownedBySalonId: offer.ownedBySalonId,
              validFrom: validFrom,
              validUntil: validUntil,
              usageLimit: offer.usageLimit,
              usageCount: offer.usageCount || 0,
              imageUrl: offer.imageUrl,
            };

            offerDiscountPaisa = OfferCalculator.calculateDiscount(offerDetails, totalAmountPaisa);
            
            if (offerDiscountPaisa > 0) {
              appliedOffer = {
                id: offer.id,
                title: offer.title,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
              };
              console.log(`🎟️ Mobile offer applied: ${offer.title}, discount ${offerDiscountPaisa} paisa on total ${totalAmountPaisa}`);
            }
          } else {
            console.log(`⚠️ Offer ${offerId} not applicable: active=${isOfferActive}, usage=${hasUsageRemaining}, salon=${isSalonApplicable}, minimum=${meetsMinimum}`);
          }
        } else {
          console.warn(`⚠️ Offer ${offerId} not found`);
        }
      }

      // Calculate final amounts with offer discount
      const originalAmountPaisa = serviceTotalPaisa;
      const packageDiscountPaisa = isPackageBookingFlag ? serviceTotalPaisa - totalAmountPaisa : 0;
      const totalDiscountPaisa = packageDiscountPaisa + offerDiscountPaisa;
      const finalAmountPaisa = totalAmountPaisa - offerDiscountPaisa;

      const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
      const customerEmail = user.email || '';
      const customerPhone = user.phone || '';

      const bookingNotes = isPackageBookingFlag && packageName
        ? `Package: ${packageName}${notes ? `\n${notes}` : ''}`
        : notes || null;

      const [newBooking] = await db.insert(bookings).values({
        userId,
        salonId,
        salonName: salon.name,
        serviceId: primaryService.id,
        staffId: staffId || null,
        bookingDate: date,
        bookingTime: time,
        status: 'pending',
        totalAmountPaisa: finalAmountPaisa,
        originalAmountPaisa,
        finalAmountPaisa,
        discountAmountPaisa: totalDiscountPaisa,
        offerId: appliedOffer?.id || null,
        offerTitle: appliedOffer?.title || null,
        notes: bookingNotes,
        customerName,
        customerEmail,
        customerPhone,
      }).returning();

      // Track offer usage if an offer was applied
      if (appliedOffer && offerDiscountPaisa > 0) {
        try {
          // Increment usage count on the offer
          await db.update(platformOffers)
            .set({ usageCount: sql`COALESCE(${platformOffers.usageCount}, 0) + 1` })
            .where(eq(platformOffers.id, appliedOffer.id));

          // Get current usage count for this user and offer
          const [existingUsage] = await db.select({ count: sql<number>`count(*)` })
            .from(userOfferUsage)
            .where(and(
              eq(userOfferUsage.userId, userId),
              eq(userOfferUsage.offerId, appliedOffer.id)
            ));
          
          const usageNumber = (parseInt(String(existingUsage?.count || 0)) || 0) + 1;

          // Record offer usage for this user
          await db.insert(userOfferUsage).values({
            offerId: appliedOffer.id,
            userId,
            bookingId: newBooking.id,
            discountAppliedInPaisa: offerDiscountPaisa,
            usageNumber,
          });

          console.log(`✅ Mobile offer usage tracked: user ${userId}, offer ${appliedOffer.id}, usage #${usageNumber}`);
        } catch (usageError) {
          console.error('Failed to track offer usage:', usageError);
        }
      }

      // Send booking confirmation notification (email + SMS)
      try {
        const { sendBookingConfirmation } = await import("../communicationService");
        await sendBookingConfirmation(
          salonId,
          newBooking.id,
          customerEmail,
          customerPhone || undefined,
          {
            customer_name: customerName || "Valued Customer",
            salon_name: salon.name || "Our Salon",
            service_name: serviceNames,
            booking_date: date,
            booking_time: time,
            staff_name: staffId ? "Your assigned stylist" : "Our Team",
            total_amount: (finalAmountPaisa / 100).toFixed(0),
          }
        );
        console.log(`✅ Mobile booking confirmation sent for booking ${newBooking.id}`);
      } catch (notificationError) {
        console.error("Failed to send mobile booking confirmation:", notificationError);
        // Don't fail the booking if notification fails
      }

      const totalSavings = totalDiscountPaisa > 0 ? totalDiscountPaisa / 100 : 0;

      res.status(201).json({
        success: true,
        message: appliedOffer 
          ? `Booking created with ${appliedOffer.title} applied!` 
          : (isPackageBookingFlag ? "Package booking created successfully" : "Booking created successfully"),
        booking: {
          ...newBooking,
          salonName: salon.name,
          serviceName: serviceNames,
          serviceDuration: totalDuration,
          totalAmount: finalAmountPaisa / 100,
          originalAmount: originalAmountPaisa / 100,
          finalAmount: finalAmountPaisa / 100,
          discountAmount: totalDiscountPaisa / 100,
          savings: totalSavings,
          serviceCount: selectedServices.length,
          isPackageBooking: isPackageBookingFlag,
          packageName,
          offerId: appliedOffer?.id || null,
          offerTitle: appliedOffer?.title || null,
          appliedOffer: appliedOffer ? {
            id: appliedOffer.id,
            title: appliedOffer.title,
            discountAmount: offerDiscountPaisa / 100,
          } : null,
        },
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.get("/api/mobile/bookings/my-bookings", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      let whereCondition = eq(bookings.userId, userId);

      if (status === 'upcoming') {
        whereCondition = and(
          eq(bookings.userId, userId),
          or(
            eq(bookings.status, 'pending'),
            eq(bookings.status, 'confirmed')
          ),
          sql`${bookings.bookingDate}::date >= CURRENT_DATE`
        ) as any;
      } else if (status === 'completed') {
        whereCondition = and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'completed')
        ) as any;
      } else if (status === 'cancelled') {
        whereCondition = and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'cancelled')
        ) as any;
      }

      const userBookings = await db.select({
        id: bookings.id,
        salonId: bookings.salonId,
        salonName: salons.name,
        salonImageUrl: salons.imageUrl,
        salonAddress: salons.address,
        serviceId: bookings.serviceId,
        serviceName: services.name,
        serviceDuration: services.durationMinutes,
        staffId: bookings.staffId,
        staffName: staff.name,
        staffImageUrl: staff.photoUrl,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        status: bookings.status,
        totalAmountPaisa: bookings.totalAmountPaisa,
        finalAmountPaisa: bookings.finalAmountPaisa,
        discountAmountPaisa: bookings.discountAmountPaisa,
        paymentMethod: bookings.paymentMethod,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
      })
        .from(bookings)
        .leftJoin(salons, eq(bookings.salonId, salons.id))
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(whereCondition)
        .orderBy(
          status === 'upcoming' 
            ? asc(sql`${bookings.bookingDate}::date`) 
            : desc(bookings.createdAt)
        )
        .limit(limit)
        .offset(offset);

      const [countResult] = await db.select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(whereCondition);

      res.json({
        success: true,
        bookings: userBookings.map(b => ({
          ...b,
          totalAmount: b.totalAmountPaisa ? b.totalAmountPaisa / 100 : 0,
          finalAmount: b.finalAmountPaisa ? b.finalAmountPaisa / 100 : 0,
          discountAmount: b.discountAmountPaisa ? b.discountAmountPaisa / 100 : 0,
        })),
        pagination: {
          total: parseInt(String(countResult?.count || 0)),
          limit,
          offset,
          hasMore: offset + userBookings.length < parseInt(String(countResult?.count || 0)),
        },
      });
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/mobile/bookings/:bookingId", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { bookingId } = req.params;

      const booking = await db.select({
        id: bookings.id,
        salonId: bookings.salonId,
        salonName: salons.name,
        salonImageUrl: salons.imageUrl,
        salonAddress: salons.address,
        salonPhone: salons.phone,
        salonLatitude: salons.latitude,
        salonLongitude: salons.longitude,
        serviceId: bookings.serviceId,
        serviceName: services.name,
        serviceDuration: services.durationMinutes,
        serviceDescription: services.description,
        staffId: bookings.staffId,
        staffName: staff.name,
        staffImageUrl: staff.photoUrl,
        staffRoles: staff.roles,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        status: bookings.status,
        totalAmountPaisa: bookings.totalAmountPaisa,
        originalAmountPaisa: bookings.originalAmountPaisa,
        finalAmountPaisa: bookings.finalAmountPaisa,
        discountAmountPaisa: bookings.discountAmountPaisa,
        offerTitle: bookings.offerTitle,
        paymentMethod: bookings.paymentMethod,
        notes: bookings.notes,
        customerName: bookings.customerName,
        customerEmail: bookings.customerEmail,
        customerPhone: bookings.customerPhone,
        createdAt: bookings.createdAt,
      })
        .from(bookings)
        .leftJoin(salons, eq(bookings.salonId, salons.id))
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .leftJoin(staff, eq(bookings.staffId, staff.id))
        .where(and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, userId)
        ))
        .limit(1);

      if (booking.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const b = booking[0];
      res.json({
        success: true,
        booking: {
          ...b,
          totalAmount: b.totalAmountPaisa ? b.totalAmountPaisa / 100 : 0,
          originalAmount: b.originalAmountPaisa ? b.originalAmountPaisa / 100 : 0,
          finalAmount: b.finalAmountPaisa ? b.finalAmountPaisa / 100 : 0,
          discountAmount: b.discountAmountPaisa ? b.discountAmountPaisa / 100 : 0,
        },
      });
    } catch (error) {
      console.error("Error fetching booking details:", error);
      res.status(500).json({ error: "Failed to fetch booking details" });
    }
  });

  app.post("/api/mobile/bookings/:bookingId/cancel", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { bookingId } = req.params;
      const parsed = cancelBookingSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const existing = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, userId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (existing.status === 'cancelled') {
        return res.status(400).json({ error: "Booking is already cancelled" });
      }

      if (existing.status === 'completed') {
        return res.status(400).json({ error: "Cannot cancel a completed booking" });
      }

      const cancellationNote = parsed.data.reason 
        ? `Cancelled by customer: ${parsed.data.reason}`
        : 'Cancelled by customer via mobile app';

      const [updatedBooking] = await db.update(bookings)
        .set({
          status: 'cancelled',
          notes: existing.notes 
            ? `${existing.notes}\n\n${cancellationNote}`
            : cancellationNote,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      res.json({
        success: true,
        message: "Booking cancelled successfully",
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
        },
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  });

  app.patch("/api/mobile/bookings/:bookingId/reschedule", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { bookingId } = req.params;
      const parsed = rescheduleBookingSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const existing = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, userId)
        ),
      });

      if (!existing) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (existing.status === 'cancelled') {
        return res.status(400).json({ error: "Cannot reschedule a cancelled booking" });
      }

      if (existing.status === 'completed') {
        return res.status(400).json({ error: "Cannot reschedule a completed booking" });
      }

      const newDate = new Date(parsed.data.bookingDate);
      if (newDate < new Date()) {
        return res.status(400).json({ error: "Cannot reschedule to a past date" });
      }

      const rescheduleNote = `Rescheduled from ${existing.bookingDate} ${existing.bookingTime} to ${parsed.data.bookingDate} ${parsed.data.bookingTime}`;

      const [updatedBooking] = await db.update(bookings)
        .set({
          bookingDate: parsed.data.bookingDate,
          bookingTime: parsed.data.bookingTime,
          notes: existing.notes 
            ? `${existing.notes}\n\n${rescheduleNote}`
            : rescheduleNote,
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      res.json({
        success: true,
        message: "Booking rescheduled successfully",
        booking: {
          id: updatedBooking.id,
          bookingDate: updatedBooking.bookingDate,
          bookingTime: updatedBooking.bookingTime,
          status: updatedBooking.status,
        },
      });
    } catch (error) {
      console.error("Error rescheduling booking:", error);
      res.status(500).json({ error: "Failed to reschedule booking" });
    }
  });

  app.post("/api/mobile/bookings/:bookingId/review", authenticateMobileUser, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { bookingId } = req.params;
      const parsed = submitReviewSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.errors });
      }

      const booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.userId, userId)
        ),
      });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({ error: "You can only review completed bookings" });
      }

      const existingReview = await db.query.salonReviews.findFirst({
        where: and(
          eq(salonReviews.bookingId, bookingId),
          eq(salonReviews.customerId, userId)
        ),
      });

      if (existingReview) {
        return res.status(400).json({ error: "You have already reviewed this booking" });
      }

      const [newReview] = await db.insert(salonReviews).values({
        salonId: booking.salonId,
        customerId: userId,
        bookingId: bookingId,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
        isVerified: 1,
        source: 'salonhub',
      }).returning();

      const [ratingStats] = await db.select({
        avgRating: sql<number>`AVG(${salonReviews.rating})`,
        reviewCount: sql<number>`COUNT(*)`,
      })
        .from(salonReviews)
        .where(eq(salonReviews.salonId, booking.salonId));

      await db.update(salons)
        .set({
          rating: parseFloat(String(ratingStats.avgRating || 0)).toFixed(1),
          reviewCount: parseInt(String(ratingStats.reviewCount || 0)),
        })
        .where(eq(salons.id, booking.salonId));

      res.json({
        success: true,
        message: "Review submitted successfully",
        review: {
          id: newReview.id,
          rating: newReview.rating,
          createdAt: newReview.createdAt,
        },
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });
}
