import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db';
import {
  jobCards,
  jobCardServices,
  jobCardProducts,
  jobCardPayments,
  jobCardTips,
  jobCardActivityLog,
  salons,
  services,
  products,
  staff,
  users,
  bookings,
  bookingServices,
  commissions,
  commissionRates,
  clientProfiles,
  phoneVerificationTokens,
  checkInCustomerSchema,
  addJobCardServiceSchema,
  addJobCardProductSchema,
  processJobCardPaymentSchema,
  addJobCardTipSchema,
  applyJobCardDiscountSchema,
  updateJobCardStatusSchema,
  JOB_CARD_STATUSES,
  JOB_CARD_PAYMENT_STATUSES,
  CHECK_IN_METHODS,
  PAYMENT_METHODS,
  BOOKING_STATUSES,
  validateJobCardStatusTransition,
} from '@shared/schema';
import { eq, and, desc, sql, gte, lte, inArray, or, gt } from 'drizzle-orm';
import { z } from 'zod';
import { requireSalonAccess, populateUserFromSession, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

async function getUserDisplayName(userId: string | null | undefined): Promise<string> {
  if (!userId) return 'Staff';
  try {
    const [user] = await db.select({ firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(eq(users.id, userId));
    if (user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return name || user.email || 'Staff';
    }
  } catch (e) {
    console.error('Error fetching user name:', e);
  }
  return 'Staff';
}

router.use(populateUserFromSession);

const publicCheckInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many check-in attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

async function createJobCardWithNumber<T>(
  salonId: string,
  insertCallback: (jobCardNumber: string, tx: any) => Promise<T>
): Promise<T> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  const lockKey = `job_card_seq:${salonId}:${dateStr}`;
  
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);
    
    const countResult = await tx.execute(sql`
      SELECT COUNT(*) as cnt FROM job_cards 
      WHERE salon_id = ${salonId}
        AND created_at >= ${startOfDay.toISOString()}
        AND created_at <= ${endOfDay.toISOString()}
    `);
    
    const count = Number((countResult.rows as any[])[0]?.cnt || 0) + 1;
    const jobCardNumber = `JC-${dateStr}-${String(count).padStart(3, '0')}`;
    
    const result = await insertCallback(jobCardNumber, tx);
    
    return result;
  });
}

async function logJobCardActivity(
  jobCardId: string,
  salonId: string,
  activityType: string,
  description: string,
  performedBy: string | null,
  performedByName: string | null,
  previousValue?: any,
  newValue?: any
) {
  await db.insert(jobCardActivityLog).values({
    jobCardId,
    salonId,
    activityType,
    description,
    previousValue: previousValue ? previousValue : null,
    newValue: newValue ? newValue : null,
    performedBy,
    performedByName,
  });
}

async function recalculateJobCardTotals(jobCardId: string) {
  const jobCard = await db.query.jobCards.findFirst({
    where: eq(jobCards.id, jobCardId),
  });
  
  if (!jobCard) return null;
  
  const cardServices = await db.select().from(jobCardServices)
    .where(and(
      eq(jobCardServices.jobCardId, jobCardId),
      sql`${jobCardServices.status} != 'cancelled'`
    ));
  
  const cardProducts = await db.select().from(jobCardProducts)
    .where(eq(jobCardProducts.jobCardId, jobCardId));
  
  // Service and product prices are GST-INCLUSIVE
  // GST rates: 5% for services, 18% for products
  const serviceTaxRate = 5;
  const productTaxRate = 18;
  
  // Calculate GST extracted from inclusive prices (reverse calculation)
  // Formula: Tax = Price - (Price / (1 + TaxRate/100))
  const servicesTotalPaisa = cardServices.reduce((sum, s) => sum + s.finalPricePaisa, 0);
  const productsTotalPaisa = cardProducts.reduce((sum, p) => sum + p.totalPricePaisa, 0);
  
  // Extract GST from inclusive prices
  const serviceBasePaisa = Math.round(servicesTotalPaisa / (1 + serviceTaxRate / 100));
  const productBasePaisa = Math.round(productsTotalPaisa / (1 + productTaxRate / 100));
  
  let serviceTaxPaisa = servicesTotalPaisa - serviceBasePaisa;
  let productTaxPaisa = productsTotalPaisa - productBasePaisa;
  
  // Subtotal is the total of all items (GST-inclusive prices)
  const subtotalPaisa = servicesTotalPaisa + productsTotalPaisa;
  
  let discountAmountPaisa = 0;
  if (jobCard.discountType === 'percentage' && jobCard.discountValue) {
    discountAmountPaisa = Math.round(subtotalPaisa * (Number(jobCard.discountValue) / 100));
  } else if (jobCard.discountType === 'fixed' && jobCard.discountValue) {
    discountAmountPaisa = Math.round(Number(jobCard.discountValue) * 100);
  }
  
  // If there's a discount, proportionally reduce the tax as well
  if (subtotalPaisa > 0 && discountAmountPaisa > 0) {
    const discountRatio = discountAmountPaisa / subtotalPaisa;
    serviceTaxPaisa = Math.round(serviceTaxPaisa * (1 - discountRatio));
    productTaxPaisa = Math.round(productTaxPaisa * (1 - discountRatio));
  }
  
  const taxAmountPaisa = serviceTaxPaisa + productTaxPaisa;
  
  // Total = Subtotal (inclusive prices) - Discount + Tips
  // GST is already included in subtotal, so we don't add it again
  const totalAmountPaisa = subtotalPaisa - discountAmountPaisa + (jobCard.tipAmountPaisa || 0);
  const balancePaisa = totalAmountPaisa - (jobCard.paidAmountPaisa || 0);
  
  const cardPayments = await db.select().from(jobCardPayments)
    .where(and(
      eq(jobCardPayments.jobCardId, jobCardId),
      eq(jobCardPayments.status, 'completed'),
      eq(jobCardPayments.isRefund, 0)
    ));
  
  const paidAmountPaisa = cardPayments.reduce((sum, p) => sum + p.amountPaisa, 0);
  const actualBalancePaisa = totalAmountPaisa - paidAmountPaisa;
  
  let paymentStatus: string = JOB_CARD_PAYMENT_STATUSES.UNPAID;
  if (paidAmountPaisa >= totalAmountPaisa) {
    paymentStatus = JOB_CARD_PAYMENT_STATUSES.PAID;
  } else if (paidAmountPaisa > 0) {
    paymentStatus = JOB_CARD_PAYMENT_STATUSES.PARTIAL;
  }
  
  const estimatedDurationMinutes = cardServices.reduce((sum, s) => sum + s.estimatedDurationMinutes, 0);
  
  const [updated] = await db.update(jobCards)
    .set({
      subtotalPaisa,
      discountAmountPaisa,
      taxAmountPaisa,
      totalAmountPaisa,
      paidAmountPaisa,
      balancePaisa: actualBalancePaisa,
      paymentStatus,
      estimatedDurationMinutes,
      updatedAt: new Date(),
    })
    .where(eq(jobCards.id, jobCardId))
    .returning();
  
  return updated;
}

router.post('/:salonId/check-in', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const parsed = checkInCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }
    
    const { bookingId, customerName, customerEmail, customerPhone, assignedStaffId, checkInMethod, isWalkIn, notes, serviceIds, staffId, verificationSessionId } = parsed.data;
    
    let booking = null;
    let customerId: string | null = null;
    let servicesFromBooking: any[] = [];
    let servicesFromWalkIn: any[] = [];
    let newUserCreated = false;
    
    // For walk-in customers, require phone verification
    if (checkInMethod === 'walk_in' && !bookingId) {
      if (!customerPhone || !verificationSessionId) {
        return res.status(400).json({ 
          error: 'Phone verification is required for walk-in customers',
          requiresVerification: true 
        });
      }
      
      // Validate the verification session (works for both new and returning customers)
      const now = new Date();
      const verificationToken = await db.query.phoneVerificationTokens.findFirst({
        where: and(
          eq(phoneVerificationTokens.verificationSessionId, verificationSessionId),
          gt(phoneVerificationTokens.sessionExpiresAt, now)
        ),
      });
      
      if (!verificationToken || !verificationToken.verifiedAt) {
        return res.status(400).json({ 
          error: 'Invalid or expired phone verification. Please verify your phone again.',
          sessionExpired: true 
        });
      }
      
      // Normalize phone for comparison
      const normalizedInputPhone = customerPhone.replace(/\D/g, '').slice(-10);
      const normalizedVerifiedPhone = verificationToken.phone.replace(/\D/g, '').slice(-10);
      
      if (normalizedInputPhone !== normalizedVerifiedPhone) {
        return res.status(400).json({ 
          error: 'Phone number does not match verified number',
          phoneMismatch: true 
        });
      }
      
      const isReturningCustomer = verificationToken.context === 'walk-in-returning';
      console.log(`✅ Walk-in phone verified: ${customerPhone} (session: ${verificationSessionId.substring(0, 8)}..., returning: ${isReturningCustomer})`);
    }
    
    // For walk-in customers with phone number, find or create user account
    // Normalize phone: strip country code and non-digits, keep last 10 digits
    const normalizedCustomerPhone = customerPhone ? customerPhone.replace(/\D/g, '').slice(-10) : null;
    
    if (!bookingId && normalizedCustomerPhone) {
      // Check if user with this phone already exists (try both formats)
      const phoneWithPrefixWalkin = '+91' + normalizedCustomerPhone;
      let existingUser = await db.query.users.findFirst({
        where: eq(users.phone, phoneWithPrefixWalkin),
      });
      
      // Fallback: check without prefix
      if (!existingUser) {
        existingUser = await db.query.users.findFirst({
          where: eq(users.phone, normalizedCustomerPhone),
        });
      }
      
      if (existingUser) {
        customerId = existingUser.id;
      } else {
        // Create new user account for walk-in customer
        const nameParts = (customerName || '').trim().split(' ');
        const firstName = nameParts[0] || 'Guest';
        const lastName = nameParts.slice(1).join(' ') || null;
        
        const [newUser] = await db.insert(users).values({
          phone: normalizedCustomerPhone,
          email: customerEmail || null,
          firstName,
          lastName,
          emailVerified: 0,
          phoneVerified: 1, // Phone was verified via OTP
          isActive: 1,
        }).returning();
        
        customerId = newUser.id;
        newUserCreated = true;
        console.log(`Created new user account for walk-in customer: ${newUser.id} (${normalizedCustomerPhone})`);
      }
    }
    
    if (bookingId) {
      booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.salonId, salonId)
        ),
      });
      
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }
      
      const existingJobCard = await db.query.jobCards.findFirst({
        where: eq(jobCards.bookingId, bookingId),
      });
      
      if (existingJobCard) {
        return res.status(400).json({ 
          error: 'A job card already exists for this booking',
          jobCardId: existingJobCard.id 
        });
      }
      
      customerId = booking.userId;
      
      // If booking has no user_id but has customer phone, create/link user account
      if (!customerId && booking.customerPhone) {
        // Normalize phone: remove country codes (+91, +1, etc) and non-digits, keep last 10 digits for India
        const cleanPhone = booking.customerPhone.replace(/\D/g, '');
        const normalizedPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;
        
        // Check if user with this phone already exists (try both formats)
        const phoneWithPrefix = '+91' + normalizedPhone;
        let existingUser = await db.query.users.findFirst({
          where: eq(users.phone, phoneWithPrefix),
        });
        
        // Fallback: check without prefix
        if (!existingUser) {
          existingUser = await db.query.users.findFirst({
            where: eq(users.phone, normalizedPhone),
          });
        }
        
        if (existingUser) {
          customerId = existingUser.id;
          console.log(`Linked booking to existing user: ${existingUser.id} (${normalizedPhone})`);
        } else {
          // Create new user account for booking customer
          const nameParts = (booking.customerName || '').trim().split(' ');
          const firstName = nameParts[0] || 'Guest';
          const lastName = nameParts.slice(1).join(' ') || null;
          
          const [newUser] = await db.insert(users).values({
            phone: normalizedPhone,
            email: booking.customerEmail || null,
            firstName,
            lastName,
            emailVerified: 0,
            phoneVerified: 0,
            isActive: 1,
          }).returning();
          
          customerId = newUser.id;
          console.log(`Created new user account for booking customer: ${newUser.id} (${normalizedPhone})`);
        }
        
        // Update the booking with the user_id for future reference
        await db.update(bookings)
          .set({ userId: customerId })
          .where(eq(bookings.id, bookingId));
        console.log(`Updated booking ${bookingId} with userId ${customerId}`);
      }
      
      // First try to get services from booking_services table (multi-service bookings)
      servicesFromBooking = await db.select({
        id: bookingServices.id,
        serviceId: bookingServices.serviceId,
        serviceName: services.name,
        serviceCategory: services.category,
        pricePaisa: services.priceInPaisa,
        durationMinutes: services.durationMinutes,
        staffId: sql<string | null>`NULL`.as('staffId'),
      })
      .from(bookingServices)
      .leftJoin(services, eq(bookingServices.serviceId, services.id))
      .where(eq(bookingServices.bookingId, bookingId));
      
      // If no services in booking_services table, fall back to single service from booking record
      if (servicesFromBooking.length === 0 && booking.serviceId) {
        const [singleService] = await db.select({
          id: services.id,
          serviceId: services.id,
          serviceName: services.name,
          serviceCategory: services.category,
          pricePaisa: services.priceInPaisa,
          durationMinutes: services.durationMinutes,
        })
        .from(services)
        .where(eq(services.id, booking.serviceId));
        
        if (singleService) {
          servicesFromBooking = [{
            ...singleService,
            staffId: booking.staffId || null,
          }];
        }
      }
    }
    
    if (serviceIds && serviceIds.length > 0 && !bookingId) {
      const fetchedServices = await db.select({
        id: services.id,
        serviceName: services.name,
        serviceCategory: services.category,
        pricePaisa: services.priceInPaisa,
        durationMinutes: services.durationMinutes,
      })
      .from(services)
      .where(and(
        eq(services.salonId, salonId),
        inArray(services.id, serviceIds)
      ));
      
      servicesFromWalkIn = fetchedServices.map(s => ({
        ...s,
        serviceId: s.id,
        staffId: staffId || assignedStaffId || null,
      }));
    }
    
    const effectiveStaffId = staffId || assignedStaffId || booking?.staffId || null;
    const isWalkInCheck = checkInMethod === 'walk_in' || isWalkIn;
    
    const newJobCard = await createJobCardWithNumber(salonId, async (jobCardNumber, tx) => {
      const [insertedJobCard] = await tx.insert(jobCards).values({
        salonId,
        bookingId: bookingId || null,
        customerId,
        jobCardNumber,
        customerName,
        customerEmail: customerEmail || booking?.customerEmail || null,
        customerPhone: customerPhone || booking?.customerPhone || null,
        checkInMethod: checkInMethod || CHECK_IN_METHODS.MANUAL,
        checkInAt: new Date(),
        checkInBy: userId || null,
        assignedStaffId: effectiveStaffId,
        status: JOB_CARD_STATUSES.OPEN,
        isWalkIn: isWalkInCheck ? 1 : 0,
        internalNotes: notes || null,
      }).returning();
      return insertedJobCard;
    });
    
    if (servicesFromBooking.length > 0) {
      const jobCardServicesData = servicesFromBooking.map((s, index) => ({
        jobCardId: newJobCard.id,
        salonId,
        serviceId: s.serviceId,
        staffId: s.staffId || effectiveStaffId,
        serviceName: s.serviceName || 'Unknown Service',
        serviceCategory: s.serviceCategory || null,
        originalPricePaisa: s.pricePaisa || 0,
        discountPaisa: 0,
        finalPricePaisa: s.pricePaisa || 0,
        estimatedDurationMinutes: s.durationMinutes || 30,
        status: 'pending',
        sequence: index + 1,
        source: 'booking' as const,
      }));
      
      await db.insert(jobCardServices).values(jobCardServicesData);
    }
    
    if (servicesFromWalkIn.length > 0) {
      const walkInServicesData = servicesFromWalkIn.map((s, index) => ({
        jobCardId: newJobCard.id,
        salonId,
        serviceId: s.serviceId,
        staffId: effectiveStaffId,
        serviceName: s.serviceName || 'Unknown Service',
        serviceCategory: s.serviceCategory || null,
        originalPricePaisa: s.pricePaisa || 0,
        discountPaisa: 0,
        finalPricePaisa: s.pricePaisa || 0,
        estimatedDurationMinutes: s.durationMinutes || 30,
        status: 'pending',
        sequence: index + 1,
        source: 'walk_in' as const,
      }));
      
      await db.insert(jobCardServices).values(walkInServicesData);
    }
    
    await recalculateJobCardTotals(newJobCard.id);
    
    await logJobCardActivity(
      newJobCard.id,
      salonId,
      'check_in',
      `Customer ${customerName} checked in via ${checkInMethod}`,
      userId || null,
      userName,
      null,
      { jobCardNumber: newJobCard.jobCardNumber, checkInMethod, isWalkIn }
    );
    
    if (bookingId) {
      await db.update(bookings)
        .set({ status: BOOKING_STATUSES.ARRIVED })
        .where(eq(bookings.id, bookingId));
    }
    
    // Auto-create client profile for any customer with a user account
    if (customerId) {
      // Check if client profile already exists for this salon + customer
      const existingProfile = await db.query.clientProfiles.findFirst({
        where: and(
          eq(clientProfiles.salonId, salonId),
          eq(clientProfiles.customerId, customerId)
        ),
      });
      
      if (!existingProfile) {
        await db.insert(clientProfiles).values({
          salonId,
          customerId,
        });
        const checkInType = isWalkInCheck ? 'walk-in' : 'booking';
        console.log(`Created client profile for ${checkInType} customer: salonId=${salonId}, customerId=${customerId}`);
      }
    }
    
    const fullJobCard = await db.query.jobCards.findFirst({
      where: eq(jobCards.id, newJobCard.id),
    });
    
    const cardServices = await db.select().from(jobCardServices)
      .where(eq(jobCardServices.jobCardId, newJobCard.id));
    
    res.status(201).json({
      jobCard: {
        ...fullJobCard,
        services: cardServices,
      },
    });
    
  } catch (error) {
    console.error('Error checking in customer:', error);
    res.status(500).json({ error: 'Failed to check in customer' });
  }
});

router.get('/:salonId/job-cards', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { status, date, staffId, customerId, limit = '50', offset = '0' } = req.query;
    
    let conditions: any[] = [eq(jobCards.salonId, salonId)];
    
    if (status && status !== 'all') {
      const statusArray = String(status).split(',');
      conditions.push(inArray(jobCards.status, statusArray));
    }
    
    if (date) {
      const dateObj = new Date(String(date));
      const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
      const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
      conditions.push(and(
        gte(jobCards.checkInAt, startOfDay),
        lte(jobCards.checkInAt, endOfDay)
      ));
    }
    
    if (staffId) {
      conditions.push(eq(jobCards.assignedStaffId, String(staffId)));
    }
    
    if (customerId) {
      conditions.push(eq(jobCards.customerId, String(customerId)));
    }
    
    const allJobCards = await db.select()
      .from(jobCards)
      .where(and(...conditions))
      .orderBy(desc(jobCards.checkInAt))
      .limit(Number(limit))
      .offset(Number(offset));
    
    const jobCardIds = allJobCards.map(jc => jc.id);
    
    const cardServices = jobCardIds.length > 0
      ? await db.select().from(jobCardServices)
          .where(inArray(jobCardServices.jobCardId, jobCardIds))
      : [];
    
    const staffIds = Array.from(new Set(allJobCards.map(jc => jc.assignedStaffId).filter(Boolean)));
    const staffMembers = staffIds.length > 0
      ? await db.select().from(staff)
          .where(inArray(staff.id, staffIds as string[]))
      : [];
    
    const staffMap = Object.fromEntries(staffMembers.map(s => [s.id, s]));
    
    const result = allJobCards.map(jc => ({
      ...jc,
      services: cardServices.filter(s => s.jobCardId === jc.id),
      assignedStaffDetails: jc.assignedStaffId ? staffMap[jc.assignedStaffId] : null,
    }));
    
    res.json({
      jobCards: result,
      total: result.length,
      limit: Number(limit),
      offset: Number(offset),
    });
    
  } catch (error) {
    console.error('Error fetching job cards:', error);
    res.status(500).json({ error: 'Failed to fetch job cards' });
  }
});

router.get('/:salonId/job-cards/:jobCardId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    const cardServices = await db.select({
      id: jobCardServices.id,
      jobCardId: jobCardServices.jobCardId,
      serviceId: jobCardServices.serviceId,
      staffId: jobCardServices.staffId,
      serviceName: jobCardServices.serviceName,
      serviceCategory: jobCardServices.serviceCategory,
      originalPricePaisa: jobCardServices.originalPricePaisa,
      discountPaisa: jobCardServices.discountPaisa,
      finalPricePaisa: jobCardServices.finalPricePaisa,
      estimatedDurationMinutes: jobCardServices.estimatedDurationMinutes,
      actualDurationMinutes: jobCardServices.actualDurationMinutes,
      status: jobCardServices.status,
      startedAt: jobCardServices.startedAt,
      completedAt: jobCardServices.completedAt,
      sequence: jobCardServices.sequence,
      notes: jobCardServices.notes,
      source: jobCardServices.source,
      staffName: staff.name,
    })
    .from(jobCardServices)
    .leftJoin(staff, eq(jobCardServices.staffId, staff.id))
    .where(eq(jobCardServices.jobCardId, jobCardId))
    .orderBy(jobCardServices.sequence);
    
    const cardProducts = await db.select({
      id: jobCardProducts.id,
      jobCardId: jobCardProducts.jobCardId,
      productId: jobCardProducts.productId,
      staffId: jobCardProducts.staffId,
      productName: jobCardProducts.productName,
      productSku: jobCardProducts.productSku,
      productCategory: jobCardProducts.productCategory,
      quantity: jobCardProducts.quantity,
      unitPricePaisa: jobCardProducts.unitPricePaisa,
      discountPaisa: jobCardProducts.discountPaisa,
      totalPricePaisa: jobCardProducts.totalPricePaisa,
      taxAmountPaisa: jobCardProducts.taxAmountPaisa,
      notes: jobCardProducts.notes,
      staffName: staff.name,
    })
    .from(jobCardProducts)
    .leftJoin(staff, eq(jobCardProducts.staffId, staff.id))
    .where(eq(jobCardProducts.jobCardId, jobCardId));
    
    const cardPayments = await db.select({
      id: jobCardPayments.id,
      paymentMethod: jobCardPayments.paymentMethod,
      amountPaisa: jobCardPayments.amountPaisa,
      status: jobCardPayments.status,
      transactionId: jobCardPayments.transactionId,
      cardLast4: jobCardPayments.cardLast4,
      cardNetwork: jobCardPayments.cardNetwork,
      upiId: jobCardPayments.upiId,
      isRefund: jobCardPayments.isRefund,
      notes: jobCardPayments.notes,
      createdAt: jobCardPayments.createdAt,
      completedAt: jobCardPayments.completedAt,
      collectedByName: users.firstName,
    })
    .from(jobCardPayments)
    .leftJoin(users, eq(jobCardPayments.collectedBy, users.id))
    .where(eq(jobCardPayments.jobCardId, jobCardId))
    .orderBy(desc(jobCardPayments.createdAt));
    
    const cardTips = await db.select({
      id: jobCardTips.id,
      staffId: jobCardTips.staffId,
      amountPaisa: jobCardTips.amountPaisa,
      paymentMethod: jobCardTips.paymentMethod,
      notes: jobCardTips.notes,
      staffName: staff.name,
    })
    .from(jobCardTips)
    .leftJoin(staff, eq(jobCardTips.staffId, staff.id))
    .where(eq(jobCardTips.jobCardId, jobCardId));
    
    const activityLog = await db.select()
      .from(jobCardActivityLog)
      .where(eq(jobCardActivityLog.jobCardId, jobCardId))
      .orderBy(desc(jobCardActivityLog.createdAt))
      .limit(50);
    
    let assignedStaffDetails = null;
    if (jobCard.assignedStaffId) {
      assignedStaffDetails = await db.query.staff.findFirst({
        where: eq(staff.id, jobCard.assignedStaffId),
      });
    }
    
    res.json({
      ...jobCard,
      services: cardServices,
      products: cardProducts,
      payments: cardPayments,
      tips: cardTips,
      activityLog,
      assignedStaffDetails,
    });
    
  } catch (error) {
    console.error('Error fetching job card details:', error);
    res.status(500).json({ error: 'Failed to fetch job card details' });
  }
});

router.post('/:salonId/job-cards/:jobCardId/services', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const parsed = addJobCardServiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }
    
    const { serviceId, staffId, discountPaisa, notes } = parsed.data;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.status === JOB_CARD_STATUSES.COMPLETED || jobCard.status === JOB_CARD_STATUSES.CANCELLED) {
      return res.status(400).json({ error: 'Cannot add services to a closed or cancelled job card' });
    }
    
    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.salonId, salonId)
      ),
    });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    if (staffId) {
      const staffMember = await db.query.staff.findFirst({
        where: and(
          eq(staff.id, staffId),
          eq(staff.salonId, salonId)
        ),
      });
      
      if (!staffMember) {
        return res.status(400).json({ error: 'Staff member not found or does not belong to this salon' });
      }
    }
    
    const existingServices = await db.select({ maxSequence: sql<number>`COALESCE(MAX(${jobCardServices.sequence}), 0)` })
      .from(jobCardServices)
      .where(eq(jobCardServices.jobCardId, jobCardId));
    
    const nextSequence = (existingServices[0]?.maxSequence || 0) + 1;
    
    const finalPricePaisa = service.priceInPaisa - (discountPaisa || 0);
    
    const [newService] = await db.insert(jobCardServices).values({
      jobCardId,
      salonId,
      serviceId,
      staffId: staffId || jobCard.assignedStaffId || null,
      serviceName: service.name,
      serviceCategory: service.category || null,
      originalPricePaisa: service.priceInPaisa,
      discountPaisa: discountPaisa || 0,
      finalPricePaisa,
      estimatedDurationMinutes: service.durationMinutes,
      status: 'pending',
      sequence: nextSequence,
      notes: notes || null,
      source: 'addon',
    }).returning();
    
    await recalculateJobCardTotals(jobCardId);
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'service_added',
      `Added service: ${service.name}`,
      userId || null,
      userName,
      null,
      { serviceId, serviceName: service.name, pricePaisa: service.priceInPaisa }
    );
    
    res.status(201).json(newService);
    
  } catch (error) {
    console.error('Error adding service to job card:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

router.delete('/:salonId/job-cards/:jobCardId/services/:serviceItemId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId, serviceItemId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.paymentStatus === JOB_CARD_PAYMENT_STATUSES.PAID) {
      return res.status(400).json({ error: 'Cannot remove services after payment is completed' });
    }
    
    const serviceItem = await db.query.jobCardServices.findFirst({
      where: and(
        eq(jobCardServices.id, serviceItemId),
        eq(jobCardServices.jobCardId, jobCardId)
      ),
    });
    
    if (!serviceItem) {
      return res.status(404).json({ error: 'Service not found on this job card' });
    }
    
    await db.update(jobCardServices)
      .set({ status: 'cancelled' })
      .where(eq(jobCardServices.id, serviceItemId));
    
    await recalculateJobCardTotals(jobCardId);
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'service_removed',
      `Removed service: ${serviceItem.serviceName}`,
      userId || null,
      userName,
      { serviceId: serviceItem.serviceId, serviceName: serviceItem.serviceName },
      null
    );
    
    res.json({ success: true, message: 'Service removed from job card' });
    
  } catch (error) {
    console.error('Error removing service from job card:', error);
    res.status(500).json({ error: 'Failed to remove service' });
  }
});

router.patch('/:salonId/job-cards/:jobCardId/services/:serviceItemId/status', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId, serviceItemId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const serviceItem = await db.query.jobCardServices.findFirst({
      where: and(
        eq(jobCardServices.id, serviceItemId),
        eq(jobCardServices.jobCardId, jobCardId)
      ),
    });
    
    if (!serviceItem) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const updateData: any = { status };
    
    if (status === 'in_progress' && !serviceItem.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === 'completed' && !serviceItem.completedAt) {
      updateData.completedAt = new Date();
      if (serviceItem.startedAt) {
        const durationMs = new Date().getTime() - new Date(serviceItem.startedAt).getTime();
        updateData.actualDurationMinutes = Math.round(durationMs / 60000);
      }
    }
    
    const [updated] = await db.update(jobCardServices)
      .set(updateData)
      .where(eq(jobCardServices.id, serviceItemId))
      .returning();
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'service_status_changed',
      `Service ${serviceItem.serviceName} status changed to ${status}`,
      userId || null,
      userName,
      { previousStatus: serviceItem.status },
      { newStatus: status }
    );
    
    const allServices = await db.select().from(jobCardServices)
      .where(and(
        eq(jobCardServices.jobCardId, jobCardId),
        sql`${jobCardServices.status} != 'cancelled'`
      ));
    
    const allCompleted = allServices.every(s => s.status === 'completed');
    const anyInProgress = allServices.some(s => s.status === 'in_progress');
    
    let jobCardStatus: string = JOB_CARD_STATUSES.OPEN;
    if (anyInProgress) {
      jobCardStatus = JOB_CARD_STATUSES.IN_SERVICE;
    } else if (allCompleted && allServices.length > 0) {
      jobCardStatus = JOB_CARD_STATUSES.PENDING_CHECKOUT;
    }
    
    const jobCard = await db.query.jobCards.findFirst({
      where: eq(jobCards.id, jobCardId),
    });
    
    if (jobCard && jobCard.status !== jobCardStatus) {
      const updateJobCardData: any = { status: jobCardStatus, updatedAt: new Date() };
      
      if (status === 'in_progress' && !jobCard.serviceStartAt) {
        updateJobCardData.serviceStartAt = new Date();
      } else if (allCompleted && !jobCard.serviceEndAt) {
        updateJobCardData.serviceEndAt = new Date();
        if (jobCard.serviceStartAt) {
          const durationMs = new Date().getTime() - new Date(jobCard.serviceStartAt).getTime();
          updateJobCardData.actualDurationMinutes = Math.round(durationMs / 60000);
        }
      }
      
      await db.update(jobCards)
        .set(updateJobCardData)
        .where(eq(jobCards.id, jobCardId));
    }
    
    res.json(updated);
    
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ error: 'Failed to update service status' });
  }
});

router.post('/:salonId/job-cards/:jobCardId/products', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const parsed = addJobCardProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }
    
    const { productId, staffId, quantity, discountPaisa, notes } = parsed.data;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.status === JOB_CARD_STATUSES.COMPLETED || jobCard.status === JOB_CARD_STATUSES.CANCELLED) {
      return res.status(400).json({ error: 'Cannot add products to a closed or cancelled job card' });
    }
    
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.salonId, salonId)
      ),
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.trackStock && product.currentStock !== null && Number(product.currentStock) < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        availableStock: product.currentStock,
        requestedQuantity: quantity 
      });
    }
    
    const unitPricePaisa = product.retailPriceInPaisa || product.costPriceInPaisa || 0;
    const totalBeforeDiscount = unitPricePaisa * quantity;
    const totalPricePaisa = totalBeforeDiscount - (discountPaisa || 0);
    const taxRatePercent = 18;
    const taxAmountPaisa = Math.round(totalPricePaisa * (taxRatePercent / 100));
    
    const [newProduct] = await db.insert(jobCardProducts).values({
      jobCardId,
      salonId,
      productId,
      staffId: staffId || jobCard.assignedStaffId || null,
      productName: product.name,
      productSku: product.sku || null,
      productCategory: product.categoryId || null,
      quantity,
      unitPricePaisa,
      discountPaisa: discountPaisa || 0,
      totalPricePaisa,
      taxRatePercent: String(taxRatePercent),
      taxAmountPaisa,
      notes: notes || null,
    }).returning();
    
    await recalculateJobCardTotals(jobCardId);
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'product_added',
      `Added product: ${product.name} (qty: ${quantity})`,
      userId || null,
      userName,
      null,
      { productId, productName: product.name, quantity, totalPricePaisa }
    );
    
    res.status(201).json(newProduct);
    
  } catch (error) {
    console.error('Error adding product to job card:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

router.delete('/:salonId/job-cards/:jobCardId/products/:productItemId', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId, productItemId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.paymentStatus === JOB_CARD_PAYMENT_STATUSES.PAID) {
      return res.status(400).json({ error: 'Cannot remove products after payment is completed' });
    }
    
    const productItem = await db.query.jobCardProducts.findFirst({
      where: and(
        eq(jobCardProducts.id, productItemId),
        eq(jobCardProducts.jobCardId, jobCardId)
      ),
    });
    
    if (!productItem) {
      return res.status(404).json({ error: 'Product not found on this job card' });
    }
    
    await db.delete(jobCardProducts)
      .where(eq(jobCardProducts.id, productItemId));
    
    await recalculateJobCardTotals(jobCardId);
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'product_removed',
      `Removed product: ${productItem.productName}`,
      userId || null,
      userName,
      { productId: productItem.productId, productName: productItem.productName },
      null
    );
    
    res.json({ success: true, message: 'Product removed from job card' });
    
  } catch (error) {
    console.error('Error removing product from job card:', error);
    res.status(500).json({ error: 'Failed to remove product' });
  }
});

router.post('/:salonId/job-cards/:jobCardId/discount', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const parsed = applyJobCardDiscountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }
    
    const { discountType, discountValue, discountReason } = parsed.data;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.paymentStatus === JOB_CARD_PAYMENT_STATUSES.PAID) {
      return res.status(400).json({ error: 'Cannot apply discount after payment is completed' });
    }
    
    await db.update(jobCards)
      .set({
        discountType,
        discountValue: String(discountValue),
        discountReason: discountReason || null,
        updatedAt: new Date(),
      })
      .where(eq(jobCards.id, jobCardId));
    
    const updated = await recalculateJobCardTotals(jobCardId);
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'discount_applied',
      `Applied ${discountType} discount of ${discountValue}${discountType === 'percentage' ? '%' : ' paisa'}`,
      userId || null,
      userName,
      { previousDiscount: jobCard.discountAmountPaisa },
      { discountType, discountValue, discountReason }
    );
    
    res.json(updated);
    
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

router.post('/:salonId/job-cards/:jobCardId/payments', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const parsed = processJobCardPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }
    
    const { paymentMethod, amountPaisa, transactionId, cardLast4, cardNetwork, upiId, notes } = parsed.data;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.status === JOB_CARD_STATUSES.COMPLETED) {
      return res.status(400).json({ error: 'Job card is already completed' });
    }
    
    if (jobCard.paymentStatus === JOB_CARD_PAYMENT_STATUSES.PAID) {
      return res.status(400).json({ error: 'Job card is already fully paid' });
    }
    
    const lockKey = `payment:${jobCardId}`;
    try {
      await db.execute(sql`SELECT pg_advisory_lock(hashtext(${lockKey}))`);
      
      const freshTotals = await db.execute(sql`
        SELECT 
          jc.total_amount_paisa,
          COALESCE((
            SELECT SUM(amount_paisa) FROM job_card_payments 
            WHERE job_card_id = ${jobCardId} 
              AND status = 'completed' 
              AND is_refund = 0
          ), 0) as total_paid
        FROM job_cards jc
        WHERE jc.id = ${jobCardId}
      `);
      
      const totals = (freshTotals.rows as any[])[0];
      const totalAmount = Number(totals?.total_amount_paisa || 0);
      const totalPaid = Number(totals?.total_paid || 0);
      const freshBalance = totalAmount - totalPaid;
      
      if (amountPaisa > freshBalance) {
        await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${lockKey}))`);
        return res.status(400).json({ 
          error: 'Payment amount exceeds balance',
          balancePaisa: freshBalance,
          requestedAmountPaisa: amountPaisa
        });
      }
      
      const [newPayment] = await db.insert(jobCardPayments).values({
        jobCardId,
        salonId,
        paymentMethod,
        amountPaisa,
        status: 'completed',
        transactionId: transactionId || null,
        cardLast4: cardLast4 || null,
        cardNetwork: cardNetwork || null,
        upiId: upiId || null,
        notes: notes || null,
        collectedBy: userId || null,
        completedAt: new Date(),
      }).returning();
      
      await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${lockKey}))`);
      
      const updated = await recalculateJobCardTotals(jobCardId);
      
      await logJobCardActivity(
        jobCardId,
        salonId,
        'payment_received',
        `Payment received: ${paymentMethod} - ${amountPaisa / 100} INR`,
        userId || null,
        userName,
        null,
        { paymentMethod, amountPaisa, transactionId }
      );
      
      res.status(201).json({
        payment: newPayment,
        jobCard: updated,
      });
    } catch (lockError) {
      await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${lockKey}))`);
      throw lockError;
    }
    
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

router.post('/:salonId/job-cards/:jobCardId/tips', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const parsed = addJobCardTipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }
    
    const { staffId, amountPaisa, paymentMethod, notes } = parsed.data;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    const staffMember = await db.query.staff.findFirst({
      where: and(
        eq(staff.id, staffId),
        eq(staff.salonId, salonId)
      ),
    });
    
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    const [newTip] = await db.insert(jobCardTips).values({
      jobCardId,
      salonId,
      staffId,
      amountPaisa,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || null,
    }).returning();
    
    const allTips = await db.select({ total: sql<number>`SUM(${jobCardTips.amountPaisa})` })
      .from(jobCardTips)
      .where(eq(jobCardTips.jobCardId, jobCardId));
    
    const totalTipsPaisa = allTips[0]?.total || 0;
    
    await db.update(jobCards)
      .set({
        tipAmountPaisa: totalTipsPaisa,
        updatedAt: new Date(),
      })
      .where(eq(jobCards.id, jobCardId));
    
    await recalculateJobCardTotals(jobCardId);
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'tip_added',
      `Tip added for ${staffMember.name}: ${amountPaisa / 100} INR`,
      userId || null,
      userName,
      null,
      { staffId, staffName: staffMember.name, amountPaisa, paymentMethod }
    );
    
    res.status(201).json(newTip);
    
  } catch (error) {
    console.error('Error adding tip:', error);
    res.status(500).json({ error: 'Failed to add tip' });
  }
});

router.patch('/:salonId/job-cards/:jobCardId/status', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const parsed = updateJobCardStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors });
    }
    
    const { status, notes } = parsed.data;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    const previousStatus = jobCard.status;
    
    const transitionValidation = validateJobCardStatusTransition(previousStatus, status);
    if (!transitionValidation.valid) {
      return res.status(400).json({ error: transitionValidation.error });
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (status === JOB_CARD_STATUSES.IN_SERVICE && !jobCard.serviceStartAt) {
      updateData.serviceStartAt = new Date();
    }
    
    if (status === JOB_CARD_STATUSES.PENDING_CHECKOUT && !jobCard.serviceEndAt) {
      updateData.serviceEndAt = new Date();
      if (jobCard.serviceStartAt) {
        const durationMs = new Date().getTime() - new Date(jobCard.serviceStartAt).getTime();
        updateData.actualDurationMinutes = Math.round(durationMs / 60000);
      }
    }
    
    if (notes) {
      updateData.internalNotes = jobCard.internalNotes 
        ? `${jobCard.internalNotes}\n\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`;
    }
    
    const [updated] = await db.update(jobCards)
      .set(updateData)
      .where(eq(jobCards.id, jobCardId))
      .returning();
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'status_changed',
      `Job card status changed from ${previousStatus} to ${status}`,
      userId || null,
      userName,
      { previousStatus },
      { newStatus: status, notes }
    );
    
    res.json(updated);
    
  } catch (error) {
    console.error('Error updating job card status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/:salonId/job-cards/:jobCardId/cancel', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.status === JOB_CARD_STATUSES.COMPLETED) {
      return res.status(400).json({ error: 'Cannot cancel a completed job card' });
    }
    
    if (jobCard.status === JOB_CARD_STATUSES.CANCELLED) {
      return res.status(400).json({ error: 'Job card is already cancelled' });
    }
    
    const cardPayments = await db.select().from(jobCardPayments)
      .where(and(
        eq(jobCardPayments.jobCardId, jobCardId),
        eq(jobCardPayments.status, 'completed'),
        eq(jobCardPayments.isRefund, 0)
      ));
    
    const paidAmountPaisa = cardPayments.reduce((sum, p) => sum + p.amountPaisa, 0);
    
    if (paidAmountPaisa > 0) {
      return res.status(400).json({ 
        error: 'Cannot cancel job card with payments. Process refund first.',
        paidAmountPaisa
      });
    }
    
    const cardTips = await db.select().from(jobCardTips)
      .where(eq(jobCardTips.jobCardId, jobCardId));
    
    if (cardTips.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot cancel job card with tips recorded. Remove tips first.',
        tipCount: cardTips.length
      });
    }
    
    const completedServices = await db.select().from(jobCardServices)
      .where(and(
        eq(jobCardServices.jobCardId, jobCardId),
        eq(jobCardServices.status, 'completed')
      ));
    
    if (completedServices.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot cancel job card with completed services.',
        completedServiceCount: completedServices.length
      });
    }
    
    const previousStatus = jobCard.status;
    
    const cardProducts = await db.select().from(jobCardProducts)
      .where(eq(jobCardProducts.jobCardId, jobCardId));
    
    for (const cardProduct of cardProducts) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, cardProduct.productId),
      });
      
      if (product && product.trackStock) {
        const previousStock = Number(product.currentStock) || 0;
        const newStock = previousStock + cardProduct.quantity;
        await db.execute(sql`UPDATE products SET current_stock = ${newStock} WHERE id = ${cardProduct.productId}`);
        
        await logJobCardActivity(
          jobCardId,
          salonId,
          'stock_restored',
          `Restored ${cardProduct.quantity} units of ${cardProduct.productName} to inventory`,
          userId || null,
          userName,
          { previousStock },
          { newStock }
        );
      }
    }
    
    await db.delete(jobCardProducts)
      .where(eq(jobCardProducts.jobCardId, jobCardId));
    
    await db.update(jobCardServices)
      .set({ status: 'cancelled' })
      .where(eq(jobCardServices.jobCardId, jobCardId));
    
    const [updated] = await db.update(jobCards)
      .set({
        status: JOB_CARD_STATUSES.CANCELLED,
        cancellationReason: reason || 'No reason provided',
        cancelledAt: new Date(),
        cancelledBy: userId || null,
        updatedAt: new Date(),
      })
      .where(eq(jobCards.id, jobCardId))
      .returning();
    
    if (jobCard.bookingId) {
      await db.update(bookings)
        .set({ status: 'cancelled' })
        .where(eq(bookings.id, jobCard.bookingId));
    }
    
    await logJobCardActivity(
      jobCardId,
      salonId,
      'cancelled',
      `Job card cancelled: ${reason || 'No reason provided'}`,
      userId || null,
      userName,
      { previousStatus },
      { newStatus: JOB_CARD_STATUSES.CANCELLED, reason }
    );
    
    res.json({
      success: true,
      message: 'Job card cancelled successfully',
      jobCard: updated
    });
    
  } catch (error) {
    console.error('Error cancelling job card:', error);
    res.status(500).json({ error: 'Failed to cancel job card' });
  }
});

router.post('/:salonId/job-cards/:jobCardId/complete', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    const userId = req.user?.id;
    const userName = await getUserDisplayName(req.user?.id);
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    if (jobCard.status === JOB_CARD_STATUSES.COMPLETED) {
      return res.status(400).json({ error: 'Job card is already completed' });
    }
    
    // Re-validate payment status by checking actual payments (not cached status)
    const cardPayments = await db.select().from(jobCardPayments)
      .where(and(
        eq(jobCardPayments.jobCardId, jobCardId),
        eq(jobCardPayments.status, 'completed'),
        eq(jobCardPayments.isRefund, 0)
      ));
    
    const actualPaidAmountPaisa = cardPayments.reduce((sum, p) => sum + p.amountPaisa, 0);
    const totalAmountPaisa = jobCard.totalAmountPaisa || 0;
    
    if (actualPaidAmountPaisa < totalAmountPaisa) {
      return res.status(400).json({ 
        error: 'Cannot complete job card with outstanding balance',
        totalAmountPaisa,
        paidAmountPaisa: actualPaidAmountPaisa,
        balancePaisa: totalAmountPaisa - actualPaidAmountPaisa 
      });
    }
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const receiptNumber = `REC-${dateStr}-${jobCard.jobCardNumber.split('-').pop()}`;
    
    // Prepare results tracking
    const commissionsCalculated: string[] = [];
    const inventoryUpdates: { productId: string; quantity: number; productName: string }[] = [];
    let feedbackSent = false;
    let updatedJobCard: typeof jobCard | null = null;
    
    // === TRANSACTIONAL CORE OPERATIONS ===
    // All DB mutations wrapped in a single transaction for atomicity
    try {
      await db.transaction(async (tx) => {
        // 1. Update job card to completed status
        const [updated] = await tx.update(jobCards)
          .set({
            status: JOB_CARD_STATUSES.COMPLETED,
            checkoutAt: new Date(),
            checkoutBy: userId || null,
            receiptNumber,
            serviceEndAt: jobCard.serviceEndAt || new Date(),
            paidAmountPaisa: actualPaidAmountPaisa,
            balancePaisa: 0,
            paymentStatus: JOB_CARD_PAYMENT_STATUSES.PAID,
            updatedAt: new Date(),
          })
          .where(eq(jobCards.id, jobCardId))
          .returning();
        
        if (!updated) {
          throw new Error('Failed to update job card status');
        }
        
        updatedJobCard = updated;
        
        // 2. Update booking status if linked
        if (jobCard.bookingId) {
          await tx.update(bookings)
            .set({ status: 'completed' })
            .where(eq(bookings.id, jobCard.bookingId));
        }
        
        // 3. Mark all pending/in-progress services as completed
        await tx.update(jobCardServices)
          .set({
            status: 'completed',
          })
          .where(and(
            eq(jobCardServices.jobCardId, jobCardId),
            sql`${jobCardServices.status} IN ('pending', 'in_progress')`
          ));
        
        // === STAFF COMMISSION CALCULATION ===
        // Calculate commissions only for completed services (not cancelled)
        const cardServices = await tx.select().from(jobCardServices)
          .where(and(
            eq(jobCardServices.jobCardId, jobCardId),
            eq(jobCardServices.commissionCalculated, 0),
            sql`${jobCardServices.status} = 'completed'`
          ));
        
        for (const service of cardServices) {
          if (service.staffId) {
            // Look for specific rate for this staff + service combination
            const [specificRate] = await tx.select().from(commissionRates)
              .where(and(
                eq(commissionRates.salonId, salonId),
                eq(commissionRates.staffId, service.staffId),
                eq(commissionRates.serviceId, service.serviceId),
                eq(commissionRates.isActive, 1)
              ))
              .limit(1);
            
            let commissionRateRecord = specificRate;
            
            // Fallback to staff default rate (no specific service)
            if (!commissionRateRecord) {
              const [staffDefaultRate] = await tx.select().from(commissionRates)
                .where(and(
                  eq(commissionRates.salonId, salonId),
                  eq(commissionRates.staffId, service.staffId),
                  sql`${commissionRates.serviceId} IS NULL`,
                  eq(commissionRates.isActive, 1)
                ))
                .limit(1);
              commissionRateRecord = staffDefaultRate;
            }
            
            // Fallback to salon default rate
            if (!commissionRateRecord) {
              const [salonDefaultRate] = await tx.select().from(commissionRates)
                .where(and(
                  eq(commissionRates.salonId, salonId),
                  eq(commissionRates.isDefault, 1),
                  eq(commissionRates.isActive, 1)
                ))
                .limit(1);
              commissionRateRecord = salonDefaultRate;
            }
            
            // Default to 10% if no rate configuration found
            let ratePercent = 10;
            let rateId: string | null = null;
            
            if (commissionRateRecord) {
              ratePercent = Number(commissionRateRecord.rateValue);
              rateId = commissionRateRecord.id;
            }
            
            // Calculate commission based on rate type
            let commissionAmount = 0;
            if (commissionRateRecord?.rateType === 'fixed_amount') {
              commissionAmount = Math.round(Number(commissionRateRecord.rateValue) * 100);
            } else {
              commissionAmount = Math.round(service.finalPricePaisa * (ratePercent / 100));
            }
            
            // Apply min/max caps if configured
            if (commissionRateRecord?.minAmount && commissionAmount < commissionRateRecord.minAmount) {
              commissionAmount = commissionRateRecord.minAmount;
            }
            if (commissionRateRecord?.maxAmount && commissionAmount > commissionRateRecord.maxAmount) {
              commissionAmount = commissionRateRecord.maxAmount;
            }
            
            const serviceDate = new Date();
            
            const [newCommission] = await tx.insert(commissions).values({
              salonId,
              staffId: service.staffId,
              serviceId: service.serviceId,
              bookingId: jobCard.bookingId || null,
              rateId,
              baseAmountPaisa: service.finalPricePaisa,
              commissionAmountPaisa: commissionAmount,
              commissionRate: String(ratePercent),
              serviceDate,
              periodYear: serviceDate.getFullYear(),
              periodMonth: serviceDate.getMonth() + 1,
              paymentStatus: 'pending',
            }).returning();
            
            await tx.update(jobCardServices)
              .set({
                commissionCalculated: 1,
                commissionId: newCommission.id,
              })
              .where(eq(jobCardServices.id, service.id));
            
            commissionsCalculated.push(newCommission.id);
          }
        }
        
        // === PRODUCT COMMISSION CALCULATION ===
        // Calculate commissions for product sales
        const cardProductsForCommission = await tx.select().from(jobCardProducts)
          .where(and(
            eq(jobCardProducts.jobCardId, jobCardId),
            sql`${jobCardProducts.commissionCalculated} = 0 OR ${jobCardProducts.commissionCalculated} IS NULL`
          ));
        
        for (const productItem of cardProductsForCommission) {
          if (productItem.staffId) {
            // Look for specific rate for this staff + product combination
            const [specificProductRate] = await tx.select().from(commissionRates)
              .where(and(
                eq(commissionRates.salonId, salonId),
                eq(commissionRates.staffId, productItem.staffId),
                eq(commissionRates.productId, productItem.productId),
                eq(commissionRates.appliesTo, 'product'),
                eq(commissionRates.isActive, 1)
              ))
              .limit(1);
            
            let productCommissionRateRecord = specificProductRate;
            
            // Fallback to staff default product rate
            if (!productCommissionRateRecord) {
              const [staffDefaultProductRate] = await tx.select().from(commissionRates)
                .where(and(
                  eq(commissionRates.salonId, salonId),
                  eq(commissionRates.staffId, productItem.staffId),
                  sql`${commissionRates.productId} IS NULL`,
                  eq(commissionRates.appliesTo, 'product'),
                  eq(commissionRates.isActive, 1)
                ))
                .limit(1);
              productCommissionRateRecord = staffDefaultProductRate;
            }
            
            // Fallback to salon default product rate
            if (!productCommissionRateRecord) {
              const [salonDefaultProductRate] = await tx.select().from(commissionRates)
                .where(and(
                  eq(commissionRates.salonId, salonId),
                  sql`${commissionRates.staffId} IS NULL`,
                  sql`${commissionRates.productId} IS NULL`,
                  eq(commissionRates.appliesTo, 'product'),
                  eq(commissionRates.isActive, 1)
                ))
                .limit(1);
              productCommissionRateRecord = salonDefaultProductRate;
            }
            
            // Only create commission if a product rate is configured
            if (productCommissionRateRecord) {
              const productRatePercent = Number(productCommissionRateRecord.rateValue);
              const productRateId = productCommissionRateRecord.id;
              
              let productCommissionAmount = 0;
              const productSaleAmount = productItem.finalPricePaisa || productItem.totalPricePaisa || (productItem.unitPricePaisa * productItem.quantity);
              
              if (productCommissionRateRecord.rateType === 'fixed_amount') {
                productCommissionAmount = Math.round(Number(productCommissionRateRecord.rateValue) * 100) * productItem.quantity;
              } else {
                productCommissionAmount = Math.round(productSaleAmount * (productRatePercent / 100));
              }
              
              // Apply min/max caps
              if (productCommissionRateRecord.minAmount && productCommissionAmount < productCommissionRateRecord.minAmount) {
                productCommissionAmount = productCommissionRateRecord.minAmount;
              }
              if (productCommissionRateRecord.maxAmount && productCommissionAmount > productCommissionRateRecord.maxAmount) {
                productCommissionAmount = productCommissionRateRecord.maxAmount;
              }
              
              const productCommissionDate = new Date();
              
              const [newProductCommission] = await tx.insert(commissions).values({
                salonId,
                staffId: productItem.staffId,
                productId: productItem.productId,
                bookingId: jobCard.bookingId || null,
                jobCardId: jobCardId,
                rateId: productRateId,
                sourceType: 'product',
                baseAmountPaisa: productSaleAmount,
                commissionAmountPaisa: productCommissionAmount,
                commissionRate: String(productRatePercent),
                serviceDate: productCommissionDate,
                periodYear: productCommissionDate.getFullYear(),
                periodMonth: productCommissionDate.getMonth() + 1,
                paymentStatus: 'pending',
              }).returning();
              
              await tx.update(jobCardProducts)
                .set({
                  commissionCalculated: 1,
                  commissionId: newProductCommission.id,
                })
                .where(eq(jobCardProducts.id, productItem.id));
              
              commissionsCalculated.push(newProductCommission.id);
            }
          }
        }
        
        // === INVENTORY UPDATE FOR PRODUCTS USED ===
        const cardProducts = await tx.select().from(jobCardProducts)
          .where(eq(jobCardProducts.jobCardId, jobCardId));
        
        for (const productItem of cardProducts) {
          const [product] = await tx.select().from(products)
            .where(and(
              eq(products.id, productItem.productId),
              eq(products.salonId, salonId)
            ))
            .limit(1);
          
          if (product && product.trackStock === 1) {
            const currentStock = Number(product.currentStock) || 0;
            const quantityUsed = productItem.quantity || 1;
            const newStock = Math.max(0, currentStock - quantityUsed);
            
            await tx.update(products)
              .set({
                currentStock: String(newStock),
                updatedAt: new Date(),
              })
              .where(eq(products.id, productItem.productId));
            
            inventoryUpdates.push({
              productId: productItem.productId,
              quantity: quantityUsed,
              productName: productItem.productName,
            });
          }
        }
        
        // Log completion activity within transaction
        await tx.insert(jobCardActivityLog).values({
          jobCardId,
          salonId,
          activityType: 'completed',
          description: `Job card completed. Receipt: ${receiptNumber}${commissionsCalculated.length > 0 ? `. Commissions calculated: ${commissionsCalculated.length}` : ''}${inventoryUpdates.length > 0 ? `. Inventory updated: ${inventoryUpdates.length} products` : ''}`,
          previousValue: null,
          newValue: { 
            receiptNumber,
            totalAmountPaisa: jobCard.totalAmountPaisa,
            paidAmountPaisa: actualPaidAmountPaisa,
            commissionsCalculated: commissionsCalculated.length,
            inventoryUpdates: inventoryUpdates.length,
          },
          performedBy: userId || null,
          performedByName: userName,
        });
      });
      
      // === FEEDBACK NOTIFICATION (Non-blocking, after transaction completes) ===
      // Send feedback request to customer if they have email or phone
      if (jobCard.customerEmail || jobCard.customerPhone) {
        try {
          const salon = await db.query.salons.findFirst({
            where: eq(salons.id, salonId),
          });
          
          const feedbackLink = `${process.env.REPL_SLUG ? 
            `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
            'http://localhost:5000'}/feedback/${jobCardId}`;
          
          await logJobCardActivity(
            jobCardId,
            salonId,
            'feedback_requested',
            `Feedback request queued for customer${jobCard.customerEmail ? ` (${jobCard.customerEmail})` : ''}`,
            userId || null,
            userName,
            null,
            {
              customerEmail: jobCard.customerEmail,
              customerPhone: jobCard.customerPhone,
              feedbackLink,
            }
          );
          
          if (jobCard.customerEmail && process.env.SENDGRID_API_KEY) {
            const { sendEmail } = await import('../emailService');
            const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@salonhub.com';
            
            const feedbackHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>How was your visit?</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${salon?.name || 'SalonHub'}</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">How was your visit?</h2>
                            <p style="margin: 0 0 16px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                              Hi ${jobCard.customerName},
                            </p>
                            <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                              Thank you for visiting us today! We'd love to hear about your experience. Your feedback helps us improve our services.
                            </p>
                            <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                              <tr>
                                <td align="center" bgcolor="#667eea" style="background-color: #667eea; border-radius: 8px;">
                                  <a href="${feedbackLink}" style="display: block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                                    Share Your Feedback
                                  </a>
                                </td>
                              </tr>
                            </table>
                            <p style="margin: 20px 0 0; color: #666666; font-size: 14px;">
                              Receipt: ${receiptNumber}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background-color: #f9f9f9; padding: 24px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0; color: #888888; font-size: 12px;">
                              Thank you for choosing ${salon?.name || 'us'}!
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `;
            
            try {
              await sendEmail({
                to: jobCard.customerEmail,
                from: fromEmail,
                subject: `How was your visit to ${salon?.name || 'our salon'}?`,
                html: feedbackHtml,
                text: `Hi ${jobCard.customerName}, Thank you for visiting ${salon?.name || 'us'} today! We'd love to hear about your experience. Please share your feedback at: ${feedbackLink}. Receipt: ${receiptNumber}`,
              });
              feedbackSent = true;
            } catch (emailError) {
              console.error('Failed to send feedback email (will retry later):', emailError);
              await logJobCardActivity(
                jobCardId,
                salonId,
                'feedback_email_failed',
                `Failed to send feedback email to ${jobCard.customerEmail}. Manual follow-up may be required.`,
                userId || null,
                userName,
                null,
                { error: String(emailError) }
              );
            }
          }
        } catch (feedbackError) {
          console.error('Error in feedback notification flow:', feedbackError);
        }
      }
      
      res.json({
        ...(updatedJobCard || {}),
        message: 'Job card completed successfully',
        receiptNumber,
        commissionsCalculated: commissionsCalculated.length,
        inventoryUpdates,
        feedbackSent,
      });
      
    } catch (dbError) {
      console.error('Error in job card completion transaction:', dbError);
      throw dbError;
    }
    
  } catch (error) {
    console.error('Error completing job card:', error);
    res.status(500).json({ error: 'Failed to complete job card' });
  }
});

router.get('/:salonId/job-cards/:jobCardId/bill', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId, jobCardId } = req.params;
    
    const jobCard = await db.query.jobCards.findFirst({
      where: and(
        eq(jobCards.id, jobCardId),
        eq(jobCards.salonId, salonId)
      ),
    });
    
    if (!jobCard) {
      return res.status(404).json({ error: 'Job card not found' });
    }
    
    const cardServices = await db.select().from(jobCardServices)
      .where(and(
        eq(jobCardServices.jobCardId, jobCardId),
        sql`${jobCardServices.status} != 'cancelled'`
      ));
    
    const cardProducts = await db.select().from(jobCardProducts)
      .where(eq(jobCardProducts.jobCardId, jobCardId));
    
    const cardPayments = await db.select().from(jobCardPayments)
      .where(and(
        eq(jobCardPayments.jobCardId, jobCardId),
        eq(jobCardPayments.status, 'completed')
      ));
    
    const cardTips = await db.select().from(jobCardTips)
      .where(eq(jobCardTips.jobCardId, jobCardId));
    
    const servicesTotalPaisa = cardServices.reduce((sum, s) => sum + s.finalPricePaisa, 0);
    const productsTotalPaisa = cardProducts.reduce((sum, p) => sum + p.totalPricePaisa, 0);
    
    res.json({
      jobCardNumber: jobCard.jobCardNumber,
      customerName: jobCard.customerName,
      checkInAt: jobCard.checkInAt,
      status: jobCard.status,
      
      services: cardServices.map(s => ({
        id: s.id,
        name: s.serviceName,
        category: s.serviceCategory,
        originalPricePaisa: s.originalPricePaisa,
        discountPaisa: s.discountPaisa,
        finalPricePaisa: s.finalPricePaisa,
        status: s.status,
      })),
      servicesTotal: servicesTotalPaisa,
      
      products: cardProducts.map(p => ({
        id: p.id,
        name: p.productName,
        quantity: p.quantity,
        unitPricePaisa: p.unitPricePaisa,
        discountPaisa: p.discountPaisa,
        totalPricePaisa: p.totalPricePaisa,
        taxAmountPaisa: p.taxAmountPaisa,
      })),
      productsTotal: productsTotalPaisa,
      
      subtotalPaisa: jobCard.subtotalPaisa,
      discountType: jobCard.discountType,
      discountValue: jobCard.discountValue,
      discountAmountPaisa: jobCard.discountAmountPaisa,
      taxAmountPaisa: jobCard.taxAmountPaisa,
      tipAmountPaisa: jobCard.tipAmountPaisa,
      totalAmountPaisa: jobCard.totalAmountPaisa,
      
      payments: cardPayments.map(p => ({
        id: p.id,
        method: p.paymentMethod,
        amountPaisa: p.amountPaisa,
        transactionId: p.transactionId,
        createdAt: p.createdAt,
      })),
      paidAmountPaisa: jobCard.paidAmountPaisa,
      balancePaisa: jobCard.balancePaisa,
      paymentStatus: jobCard.paymentStatus,
      
      tips: cardTips.map(t => ({
        id: t.id,
        staffId: t.staffId,
        amountPaisa: t.amountPaisa,
        paymentMethod: t.paymentMethod,
      })),
    });
    
  } catch (error) {
    console.error('Error fetching job card bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

router.get('/public/checkin/:salonId', publicCheckInLimiter, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const salon = await db.query.salons.findFirst({
      where: eq(salons.id, salonId),
    });
    
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    
    res.json({
      salonId: salon.id,
      salonName: salon.name,
      salonLogo: salon.imageUrl,
      salonAddress: salon.address,
    });
    
  } catch (error) {
    console.error('Error fetching salon for check-in:', error);
    res.status(500).json({ error: 'Failed to fetch salon info' });
  }
});

router.post('/public/checkin/:salonId', publicCheckInLimiter, async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { phone, bookingId, customerName } = req.body;
    
    const salon = await db.query.salons.findFirst({
      where: eq(salons.id, salonId),
    });
    
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    
    let booking = null;
    
    if (bookingId) {
      booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.id, bookingId),
          eq(bookings.salonId, salonId),
          inArray(bookings.status, ['confirmed', 'pending'])
        ),
      });
    } else if (phone) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      booking = await db.query.bookings.findFirst({
        where: and(
          eq(bookings.salonId, salonId),
          eq(bookings.customerPhone, phone),
          inArray(bookings.status, ['confirmed', 'pending']),
          eq(bookings.bookingDate, todayStr)
        ),
        orderBy: [desc(bookings.bookingDate)],
      });
    }
    
    if (!booking && !customerName) {
      return res.status(404).json({ 
        error: 'No booking found for today',
        requiresWalkIn: true 
      });
    }
    
    const existingJobCard = booking 
      ? await db.query.jobCards.findFirst({
          where: eq(jobCards.bookingId, booking.id),
        })
      : null;
    
    if (existingJobCard) {
      return res.status(400).json({ 
        error: 'You are already checked in',
        jobCardId: existingJobCard.id,
        jobCardNumber: existingJobCard.jobCardNumber 
      });
    }
    
    const newJobCard = await createJobCardWithNumber(salonId, async (jobCardNumber, tx) => {
      const [insertedJobCard] = await tx.insert(jobCards).values({
        salonId,
        bookingId: booking?.id || null,
        customerId: booking?.userId || null,
        jobCardNumber,
        customerName: booking?.customerName || customerName,
        customerEmail: booking?.customerEmail || null,
        customerPhone: booking?.customerPhone || phone || null,
        checkInMethod: CHECK_IN_METHODS.SELF_CHECKIN,
        checkInAt: new Date(),
        status: JOB_CARD_STATUSES.OPEN,
        isWalkIn: booking ? 0 : 1,
      }).returning();
      return insertedJobCard;
    });
    
    if (booking) {
      const bookingServicesData = await db.select({
        serviceId: bookingServices.serviceId,
        serviceName: services.name,
        serviceCategory: services.category,
        pricePaisa: services.priceInPaisa,
        durationMinutes: services.durationMinutes,
      })
      .from(bookingServices)
      .leftJoin(services, eq(bookingServices.serviceId, services.id))
      .where(eq(bookingServices.bookingId, booking.id));
      
      if (bookingServicesData.length > 0) {
        const jobCardServicesData = bookingServicesData.map((s, index) => ({
          jobCardId: newJobCard.id,
          salonId,
          serviceId: s.serviceId,
          staffId: null,
          serviceName: s.serviceName || 'Unknown Service',
          serviceCategory: s.serviceCategory || null,
          originalPricePaisa: s.pricePaisa || 0,
          discountPaisa: 0,
          finalPricePaisa: s.pricePaisa || 0,
          estimatedDurationMinutes: s.durationMinutes || 30,
          status: 'pending',
          sequence: index + 1,
          source: 'booking' as const,
        }));
        
        await db.insert(jobCardServices).values(jobCardServicesData);
      }
      
      await db.update(bookings)
        .set({ status: BOOKING_STATUSES.ARRIVED })
        .where(eq(bookings.id, booking.id));
    }
    
    await recalculateJobCardTotals(newJobCard.id);
    
    await logJobCardActivity(
      newJobCard.id,
      salonId,
      'self_check_in',
      `Customer self-checked in via QR code`,
      null,
      booking?.customerName || customerName || 'Guest',
      null,
      { checkInMethod: CHECK_IN_METHODS.SELF_CHECKIN, isWalkIn: !booking }
    );
    
    const customerId = booking?.userId || newJobCard.customerId;
    if (customerId) {
      const existingProfile = await db.query.clientProfiles.findFirst({
        where: and(
          eq(clientProfiles.salonId, salonId),
          eq(clientProfiles.customerId, customerId)
        ),
      });
      
      if (!existingProfile) {
        await db.insert(clientProfiles).values({
          salonId,
          customerId,
        });
        console.log(`Created client profile for self-check-in customer: salonId=${salonId}, customerId=${customerId}`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Check-in successful!',
      jobCardNumber: newJobCard.jobCardNumber,
      customerName: newJobCard.customerName,
      salonName: salon.name,
    });
    
  } catch (error) {
    console.error('Error processing self check-in:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

router.get('/:salonId/today-stats', requireSalonAccess(), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayJobCards = await db.select()
      .from(jobCards)
      .where(and(
        eq(jobCards.salonId, salonId),
        gte(jobCards.checkInAt, startOfDay),
        lte(jobCards.checkInAt, endOfDay)
      ));
    
    const stats = {
      total: todayJobCards.length,
      open: todayJobCards.filter(jc => jc.status === JOB_CARD_STATUSES.OPEN).length,
      inService: todayJobCards.filter(jc => jc.status === JOB_CARD_STATUSES.IN_SERVICE).length,
      pendingCheckout: todayJobCards.filter(jc => jc.status === JOB_CARD_STATUSES.PENDING_CHECKOUT).length,
      completed: todayJobCards.filter(jc => jc.status === JOB_CARD_STATUSES.COMPLETED).length,
      cancelled: todayJobCards.filter(jc => jc.status === JOB_CARD_STATUSES.CANCELLED).length,
      noShow: todayJobCards.filter(jc => jc.status === JOB_CARD_STATUSES.NO_SHOW).length,
      totalRevenuePaisa: todayJobCards
        .filter(jc => jc.status === JOB_CARD_STATUSES.COMPLETED)
        .reduce((sum, jc) => sum + jc.paidAmountPaisa, 0),
      walkIns: todayJobCards.filter(jc => jc.isWalkIn === 1).length,
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export function registerJobCardRoutes(app: any) {
  app.use('/api/salons', router);
}

export default router;
