import { db } from "../db";
import { 
  slotWaitlist, 
  waitlistNotifications, 
  services, 
  salons, 
  staff, 
  timeSlots,
  bookings,
  users,
  userPoints,
  loyaltyTiers,
  WAITLIST_STATUS,
  WAITLIST_PRIORITY,
  type SlotWaitlist,
  type JoinWaitlistInput,
  type RespondWaitlistInput,
} from "@shared/schema";
import { eq, and, or, desc, asc, gte, lte, inArray, sql, isNull, ne } from "drizzle-orm";
import { addDays, addMinutes, parseISO, format, differenceInMinutes, isAfter, isBefore } from "date-fns";

const IST_OFFSET_MINUTES = 330;
const RESPONSE_TIMEOUT_MINUTES = 15;
const WAITLIST_EXPIRY_DAYS = 7;
const MAX_ENTRIES_PER_USER_PER_DAY = 5;

interface WaitlistEntry extends SlotWaitlist {
  salon?: { id: string; name: string; imageUrl?: string | null };
  service?: { id: string; name: string; priceInPaisa: number | null; durationMinutes: number | null };
  staff?: { id: string; name: string } | null;
  position?: number;
}

interface MatchingSlot {
  slotId: string;
  slotDate: string;
  slotTime: string;
  staffId: string | null;
  salonId: string;
}

export class WaitlistService {
  
  private getNowIST(): Date {
    const now = new Date();
    return new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  }

  private formatDateIST(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  async getUserLoyaltyPriority(userId: string): Promise<number> {
    try {
      const userPointsData = await db.select({
        tierName: loyaltyTiers.name,
      })
        .from(userPoints)
        .leftJoin(loyaltyTiers, eq(userPoints.currentTierId, loyaltyTiers.id))
        .where(eq(userPoints.userId, userId))
        .limit(1);

      if (userPointsData.length === 0 || !userPointsData[0].tierName) {
        return WAITLIST_PRIORITY.regular;
      }

      const tierName = userPointsData[0].tierName.toLowerCase();
      if (tierName.includes('elite') || tierName.includes('platinum')) {
        return WAITLIST_PRIORITY.elite;
      } else if (tierName.includes('gold')) {
        return WAITLIST_PRIORITY.gold;
      }
      return WAITLIST_PRIORITY.regular;
    } catch (error) {
      console.error('Error fetching user loyalty priority:', error);
      return WAITLIST_PRIORITY.regular;
    }
  }

  async checkDuplicateEntry(userId: string, salonId: string, serviceId: string, requestedDate: string): Promise<boolean> {
    const existing = await db.select({ id: slotWaitlist.id })
      .from(slotWaitlist)
      .where(and(
        eq(slotWaitlist.userId, userId),
        eq(slotWaitlist.salonId, salonId),
        eq(slotWaitlist.serviceId, serviceId),
        eq(slotWaitlist.requestedDate, requestedDate),
        inArray(slotWaitlist.status, [WAITLIST_STATUS.waiting, WAITLIST_STATUS.notified])
      ))
      .limit(1);
    
    return existing.length > 0;
  }

  async countUserEntriesForDate(userId: string, date: string): Promise<number> {
    const entries = await db.select({ count: sql<number>`count(*)` })
      .from(slotWaitlist)
      .where(and(
        eq(slotWaitlist.userId, userId),
        eq(slotWaitlist.requestedDate, date),
        inArray(slotWaitlist.status, [WAITLIST_STATUS.waiting, WAITLIST_STATUS.notified])
      ));
    
    return Number(entries[0]?.count || 0);
  }

  async validateTimeWindow(start: string, end: string): Promise<{ valid: boolean; error?: string }> {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return { valid: false, error: 'End time must be after start time' };
    }

    if (endMinutes - startMinutes < 30) {
      return { valid: false, error: 'Time window must be at least 30 minutes' };
    }

    return { valid: true };
  }

  async validateEntities(salonId: string, serviceId: string, staffId?: string | null): Promise<{ valid: boolean; error?: string }> {
    const salon = await db.select({ id: salons.id, isActive: salons.isActive })
      .from(salons)
      .where(eq(salons.id, salonId))
      .limit(1);

    if (salon.length === 0) {
      return { valid: false, error: 'Salon not found' };
    }

    if (!salon[0].isActive) {
      return { valid: false, error: 'Salon is currently not accepting bookings' };
    }

    const service = await db.select({ id: services.id, salonId: services.salonId })
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.salonId, salonId)))
      .limit(1);

    if (service.length === 0) {
      return { valid: false, error: 'Service not found or not available at this salon' };
    }

    if (staffId) {
      const staffMember = await db.select({ id: staff.id, salonId: staff.salonId })
        .from(staff)
        .where(and(eq(staff.id, staffId), eq(staff.salonId, salonId)))
        .limit(1);

      if (staffMember.length === 0) {
        return { valid: false, error: 'Staff member not found or not available at this salon' };
      }
    }

    return { valid: true };
  }

  async checkSlotAvailability(
    salonId: string, 
    serviceId: string, 
    requestedDate: string, 
    timeWindowStart: string, 
    timeWindowEnd: string,
    staffId?: string | null
  ): Promise<MatchingSlot[]> {
    const requestedDateStart = parseISO(`${requestedDate}T${timeWindowStart}:00`);
    const requestedDateEnd = parseISO(`${requestedDate}T${timeWindowEnd}:00`);

    const baseConditions = [
      eq(timeSlots.salonId, salonId),
      eq(timeSlots.isBooked, 0),
      gte(timeSlots.startDateTime, requestedDateStart),
      lte(timeSlots.startDateTime, requestedDateEnd),
    ];

    if (staffId) {
      baseConditions.push(eq(timeSlots.staffId, staffId));
    }

    const availableSlots = await db.select({
      slotId: timeSlots.id,
      startDateTime: timeSlots.startDateTime,
      staffId: timeSlots.staffId,
      salonId: timeSlots.salonId,
      isBooked: timeSlots.isBooked,
    })
      .from(timeSlots)
      .where(and(...baseConditions));
    
    return availableSlots.map(s => ({
      slotId: s.slotId,
      slotDate: format(s.startDateTime, 'yyyy-MM-dd'),
      slotTime: format(s.startDateTime, 'HH:mm'),
      staffId: s.staffId,
      salonId: s.salonId,
    }));
  }

  async joinWaitlist(userId: string, input: JoinWaitlistInput): Promise<{ 
    success: boolean; 
    waitlistEntry?: WaitlistEntry;
    error?: string;
    availableSlots?: MatchingSlot[];
  }> {
    const { salonId, serviceId, staffId, requestedDate, timeWindowStart, timeWindowEnd, flexibilityDays } = input;

    const nowIST = this.getNowIST();
    const requestedDateParsed = parseISO(requestedDate);
    if (isBefore(requestedDateParsed, parseISO(this.formatDateIST(nowIST)))) {
      return { success: false, error: 'Cannot join waitlist for past dates' };
    }

    const entityValidation = await this.validateEntities(salonId, serviceId, staffId);
    if (!entityValidation.valid) {
      return { success: false, error: entityValidation.error };
    }

    const timeValidation = await this.validateTimeWindow(timeWindowStart, timeWindowEnd);
    if (!timeValidation.valid) {
      return { success: false, error: timeValidation.error };
    }

    const isDuplicate = await this.checkDuplicateEntry(userId, salonId, serviceId, requestedDate);
    if (isDuplicate) {
      return { success: false, error: 'You are already on the waitlist for this service on this date' };
    }

    const dailyCount = await this.countUserEntriesForDate(userId, requestedDate);
    if (dailyCount >= MAX_ENTRIES_PER_USER_PER_DAY) {
      return { success: false, error: `Maximum ${MAX_ENTRIES_PER_USER_PER_DAY} waitlist entries per date allowed` };
    }

    const availableSlots = await this.checkSlotAvailability(
      salonId, serviceId, requestedDate, timeWindowStart, timeWindowEnd, staffId
    );

    if (availableSlots.length > 0) {
      return { 
        success: false, 
        error: 'Slots are actually available for this time window. Please proceed to booking.',
        availableSlots 
      };
    }

    const priority = await this.getUserLoyaltyPriority(userId);
    const expiresAt = addDays(requestedDateParsed, WAITLIST_EXPIRY_DAYS);

    const [entry] = await db.insert(slotWaitlist).values({
      userId,
      salonId,
      serviceId,
      staffId: staffId || null,
      requestedDate,
      timeWindowStart,
      timeWindowEnd,
      flexibilityDays: flexibilityDays || 0,
      priority,
      status: WAITLIST_STATUS.waiting,
      expiresAt,
    }).returning();

    const position = await this.getQueuePosition(entry.id);
    const salonInfo = await this.getSalonInfo(salonId);
    const serviceInfo = await this.getServiceInfo(serviceId);

    return {
      success: true,
      waitlistEntry: {
        ...entry,
        salon: salonInfo,
        service: serviceInfo,
        position,
      },
    };
  }

  async getQueuePosition(waitlistId: string): Promise<number> {
    const entry = await db.select().from(slotWaitlist).where(eq(slotWaitlist.id, waitlistId)).limit(1);
    if (entry.length === 0) return 0;

    const { salonId, requestedDate, status, priority, createdAt } = entry[0];

    if (status !== WAITLIST_STATUS.waiting) return 0;

    const aheadEntries = await db.select({ count: sql<number>`count(*)` })
      .from(slotWaitlist)
      .where(and(
        eq(slotWaitlist.salonId, salonId),
        eq(slotWaitlist.requestedDate, requestedDate),
        eq(slotWaitlist.status, WAITLIST_STATUS.waiting),
        or(
          sql`${slotWaitlist.priority} > ${priority}`,
          and(
            eq(slotWaitlist.priority, priority),
            sql`${slotWaitlist.createdAt} < ${createdAt}`
          )
        )
      ));

    return Number(aheadEntries[0]?.count || 0) + 1;
  }

  async getSalonInfo(salonId: string): Promise<{ id: string; name: string; imageUrl?: string | null } | undefined> {
    const result = await db.select({
      id: salons.id,
      name: salons.name,
      imageUrl: salons.imageUrl,
    }).from(salons).where(eq(salons.id, salonId)).limit(1);
    
    return result[0];
  }

  async getServiceInfo(serviceId: string): Promise<{ id: string; name: string; priceInPaisa: number | null; durationMinutes: number | null } | undefined> {
    const result = await db.select({
      id: services.id,
      name: services.name,
      priceInPaisa: services.priceInPaisa,
      durationMinutes: services.durationMinutes,
    }).from(services).where(eq(services.id, serviceId)).limit(1);
    
    return result[0];
  }

  async getUserWaitlistEntries(userId: string): Promise<WaitlistEntry[]> {
    const entries = await db.select()
      .from(slotWaitlist)
      .where(and(
        eq(slotWaitlist.userId, userId),
        inArray(slotWaitlist.status, [WAITLIST_STATUS.waiting, WAITLIST_STATUS.notified])
      ))
      .orderBy(asc(slotWaitlist.requestedDate), asc(slotWaitlist.timeWindowStart));

    const enrichedEntries: WaitlistEntry[] = [];
    
    for (const entry of entries) {
      const salon = await this.getSalonInfo(entry.salonId);
      const service = await this.getServiceInfo(entry.serviceId);
      const position = entry.status === WAITLIST_STATUS.waiting 
        ? await this.getQueuePosition(entry.id)
        : 0;

      let staffInfo: { id: string; name: string } | null = null;
      if (entry.staffId) {
        const staffResult = await db.select({ id: staff.id, name: staff.name })
          .from(staff).where(eq(staff.id, entry.staffId)).limit(1);
        staffInfo = staffResult[0] || null;
      }

      enrichedEntries.push({
        ...entry,
        salon,
        service,
        staff: staffInfo,
        position,
      });
    }

    return enrichedEntries;
  }

  async cancelWaitlistEntry(userId: string, waitlistId: string): Promise<{ success: boolean; error?: string }> {
    const entry = await db.select()
      .from(slotWaitlist)
      .where(eq(slotWaitlist.id, waitlistId))
      .limit(1);

    if (entry.length === 0) {
      return { success: false, error: 'Waitlist entry not found' };
    }

    if (entry[0].userId !== userId) {
      return { success: false, error: 'Not authorized to cancel this entry' };
    }

    if (entry[0].status === WAITLIST_STATUS.booked) {
      return { success: false, error: 'This entry has already been converted to a booking' };
    }

    if (entry[0].status === WAITLIST_STATUS.cancelled || entry[0].status === WAITLIST_STATUS.expired) {
      return { success: false, error: 'This entry is already cancelled or expired' };
    }

    await db.update(slotWaitlist)
      .set({ status: WAITLIST_STATUS.cancelled })
      .where(eq(slotWaitlist.id, waitlistId));

    return { success: true };
  }

  async respondToNotification(
    userId: string, 
    waitlistId: string, 
    response: RespondWaitlistInput['response']
  ): Promise<{ 
    success: boolean; 
    bookingId?: string; 
    error?: string;
    slotInfo?: { date: string; time: string };
  }> {
    const entry = await db.select()
      .from(slotWaitlist)
      .where(eq(slotWaitlist.id, waitlistId))
      .limit(1);

    if (entry.length === 0) {
      return { success: false, error: 'Waitlist entry not found' };
    }

    if (entry[0].userId !== userId) {
      return { success: false, error: 'Not authorized to respond to this entry' };
    }

    if (entry[0].status !== WAITLIST_STATUS.notified) {
      return { success: false, error: 'This entry is not pending a response' };
    }

    const now = new Date();
    if (entry[0].responseDeadline && isAfter(now, entry[0].responseDeadline)) {
      await db.update(slotWaitlist)
        .set({ status: WAITLIST_STATUS.expired })
        .where(eq(slotWaitlist.id, waitlistId));
      return { success: false, error: 'Response deadline has passed' };
    }

    if (response === 'declined') {
      await db.update(slotWaitlist)
        .set({ status: WAITLIST_STATUS.cancelled })
        .where(eq(slotWaitlist.id, waitlistId));

      await db.update(waitlistNotifications)
        .set({ 
          response: 'declined', 
          respondedAt: now 
        })
        .where(and(
          eq(waitlistNotifications.waitlistId, waitlistId),
          isNull(waitlistNotifications.response)
        ));

      if (entry[0].notifiedSlotId) {
        await this.processNextInQueue(entry[0].notifiedSlotId);
      }

      return { success: true };
    }

    if (!entry[0].notifiedSlotId) {
      return { success: false, error: 'No slot information available' };
    }

    const slot = await db.select()
      .from(timeSlots)
      .where(eq(timeSlots.id, entry[0].notifiedSlotId))
      .limit(1);

    if (slot.length === 0) {
      return { success: false, error: 'Slot no longer exists' };
    }

    if (slot[0].isBooked === 1) {
      await db.update(slotWaitlist)
        .set({ status: WAITLIST_STATUS.expired })
        .where(eq(slotWaitlist.id, waitlistId));
      return { success: false, error: 'Slot is no longer available' };
    }

    const service = await this.getServiceInfo(entry[0].serviceId);
    if (!service) {
      return { success: false, error: 'Service no longer available' };
    }

    const userInfo = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userInfo.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const bookingAmount = service.priceInPaisa ?? 0;
    const slotDate = format(slot[0].startDateTime, 'yyyy-MM-dd');
    const slotTime = format(slot[0].startDateTime, 'HH:mm');

    let booking;
    try {
      [booking] = await db.insert(bookings).values({
        salonId: entry[0].salonId,
        serviceId: entry[0].serviceId,
        staffId: entry[0].staffId,
        timeSlotId: entry[0].notifiedSlotId,
        userId,
        customerName: `${userInfo[0].firstName || ''} ${userInfo[0].lastName || ''}`.trim() || 'Customer',
        customerEmail: userInfo[0].email || '',
        customerPhone: userInfo[0].phone || '',
        bookingDate: slotDate,
        bookingTime: slotTime,
        status: 'confirmed',
        totalAmountPaisa: bookingAmount,
        paymentMethod: 'pay_at_salon',
      }).returning();
    } catch (dbError) {
      console.error('Error creating booking from waitlist:', dbError);
      return { success: false, error: 'Failed to create booking. Please try again.' };
    }

    await db.update(timeSlots)
      .set({ isBooked: 1 })
      .where(eq(timeSlots.id, entry[0].notifiedSlotId));

    await db.update(slotWaitlist)
      .set({ 
        status: WAITLIST_STATUS.booked,
        bookedAt: now,
      })
      .where(eq(slotWaitlist.id, waitlistId));

    await db.update(waitlistNotifications)
      .set({ 
        response: 'accepted', 
        respondedAt: now 
      })
      .where(and(
        eq(waitlistNotifications.waitlistId, waitlistId),
        isNull(waitlistNotifications.response)
      ));

    return { 
      success: true, 
      bookingId: booking.id,
      slotInfo: { date: slotDate, time: slotTime }
    };
  }

  async findMatchingWaitlistEntries(slotId: string): Promise<SlotWaitlist[]> {
    const slot = await db.select()
      .from(timeSlots)
      .where(eq(timeSlots.id, slotId))
      .limit(1);

    if (slot.length === 0) return [];

    const { salonId, startDateTime, staffId } = slot[0];
    const slotDate = format(startDateTime, 'yyyy-MM-dd');
    const slotTime = format(startDateTime, 'HH:mm');

    let entries = await db.select()
      .from(slotWaitlist)
      .where(and(
        eq(slotWaitlist.salonId, salonId),
        eq(slotWaitlist.status, WAITLIST_STATUS.waiting),
        lte(slotWaitlist.timeWindowStart, slotTime),
        gte(slotWaitlist.timeWindowEnd, slotTime)
      ))
      .orderBy(desc(slotWaitlist.priority), asc(slotWaitlist.createdAt));

    entries = entries.filter(entry => {
      const requestedDate = parseISO(entry.requestedDate);
      const slotDateParsed = parseISO(slotDate);
      const daysDiff = Math.abs(Math.floor((slotDateParsed.getTime() - requestedDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      if (daysDiff > entry.flexibilityDays) return false;

      if (entry.staffId && entry.staffId !== staffId) return false;

      return true;
    });

    return entries;
  }

  async notifyWaitlistEntry(waitlistId: string, slotId: string): Promise<boolean> {
    const now = new Date();
    const responseDeadline = addMinutes(now, RESPONSE_TIMEOUT_MINUTES);

    await db.update(slotWaitlist)
      .set({
        status: WAITLIST_STATUS.notified,
        notifiedAt: now,
        notifiedSlotId: slotId,
        responseDeadline,
      })
      .where(eq(slotWaitlist.id, waitlistId));

    await db.insert(waitlistNotifications).values({
      waitlistId,
      slotId,
      notificationType: 'push',
      sentAt: now,
    });

    return true;
  }

  async processNextInQueue(slotId: string): Promise<void> {
    const slot = await db.select()
      .from(timeSlots)
      .where(eq(timeSlots.id, slotId))
      .limit(1);

    if (slot.length === 0 || slot[0].isBooked === 1) return;

    const matchingEntries = await this.findMatchingWaitlistEntries(slotId);
    if (matchingEntries.length === 0) return;

    await this.notifyWaitlistEntry(matchingEntries[0].id, slotId);
  }

  async processSlotRelease(slotId: string): Promise<void> {
    const matchingEntries = await this.findMatchingWaitlistEntries(slotId);
    if (matchingEntries.length === 0) return;

    await this.notifyWaitlistEntry(matchingEntries[0].id, slotId);
  }

  async expireOldEntries(): Promise<number> {
    const now = new Date();
    
    const result = await db.update(slotWaitlist)
      .set({ status: WAITLIST_STATUS.expired })
      .where(and(
        eq(slotWaitlist.status, WAITLIST_STATUS.waiting),
        lte(slotWaitlist.expiresAt, now)
      ))
      .returning({ id: slotWaitlist.id });

    return result.length;
  }

  async escalateUnrespondedNotifications(): Promise<number> {
    const now = new Date();
    
    const expiredNotifications = await db.select()
      .from(slotWaitlist)
      .where(and(
        eq(slotWaitlist.status, WAITLIST_STATUS.notified),
        lte(slotWaitlist.responseDeadline, now)
      ));

    let escalatedCount = 0;

    for (const entry of expiredNotifications) {
      await db.update(slotWaitlist)
        .set({ status: WAITLIST_STATUS.expired })
        .where(eq(slotWaitlist.id, entry.id));

      await db.update(waitlistNotifications)
        .set({ 
          response: 'expired', 
          respondedAt: now 
        })
        .where(and(
          eq(waitlistNotifications.waitlistId, entry.id),
          isNull(waitlistNotifications.response)
        ));

      if (entry.notifiedSlotId) {
        await this.processNextInQueue(entry.notifiedSlotId);
      }

      escalatedCount++;
    }

    return escalatedCount;
  }

  async getSalonWaitlistAnalytics(salonId: string, ownerId: string): Promise<{
    totalWaiting: number;
    byDate: Record<string, number>;
    byService: Array<{ serviceId: string; serviceName: string; count: number }>;
    recentEntries: WaitlistEntry[];
  }> {
    const salon = await db.select({ ownerId: salons.ownerId })
      .from(salons)
      .where(eq(salons.id, salonId))
      .limit(1);

    if (salon.length === 0 || salon[0].ownerId !== ownerId) {
      throw new Error('Not authorized to view this salon\'s waitlist');
    }

    const waitingEntries = await db.select()
      .from(slotWaitlist)
      .where(and(
        eq(slotWaitlist.salonId, salonId),
        inArray(slotWaitlist.status, [WAITLIST_STATUS.waiting, WAITLIST_STATUS.notified])
      ))
      .orderBy(desc(slotWaitlist.createdAt))
      .limit(50);

    const byDate: Record<string, number> = {};
    for (const entry of waitingEntries) {
      byDate[entry.requestedDate] = (byDate[entry.requestedDate] || 0) + 1;
    }

    const serviceIds = Array.from(new Set(waitingEntries.map(e => e.serviceId)));
    const serviceInfos = serviceIds.length > 0 
      ? await db.select({ id: services.id, name: services.name })
          .from(services)
          .where(inArray(services.id, serviceIds))
      : [];
    
    const serviceMap = new Map(serviceInfos.map(s => [s.id, s.name]));
    
    const byServiceMap: Record<string, number> = {};
    for (const entry of waitingEntries) {
      byServiceMap[entry.serviceId] = (byServiceMap[entry.serviceId] || 0) + 1;
    }
    
    const byService = Object.entries(byServiceMap).map(([serviceId, count]) => ({
      serviceId,
      serviceName: serviceMap.get(serviceId) || 'Unknown Service',
      count,
    }));

    const enrichedEntries: WaitlistEntry[] = [];
    for (const entry of waitingEntries.slice(0, 10)) {
      const service = await this.getServiceInfo(entry.serviceId);
      const position = entry.status === WAITLIST_STATUS.waiting 
        ? await this.getQueuePosition(entry.id)
        : 0;
      
      enrichedEntries.push({
        ...entry,
        service,
        position,
      });
    }

    return {
      totalWaiting: waitingEntries.length,
      byDate,
      byService,
      recentEntries: enrichedEntries,
    };
  }
}

export const waitlistService = new WaitlistService();
