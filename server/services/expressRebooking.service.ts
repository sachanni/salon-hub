import { db } from '../db';
import { 
  userBookingPreferences, 
  rebookSuggestions,
  bookings,
  users,
  salons,
  services,
  staff,
  type UserBookingPreference,
  type InsertUserBookingPreference,
} from '@shared/schema';
import { eq, and, desc, gte, lte, sql, inArray } from 'drizzle-orm';
import { addDays, parseISO, differenceInDays, format, isAfter } from 'date-fns';

const SUGGESTION_LOOKAHEAD_DAYS = 14;
const SUGGESTION_EXPIRY_DAYS = 7;
const MIN_BOOKINGS_FOR_SUGGESTIONS = 2;

interface EnrichedSuggestion {
  id: string;
  salon: {
    id: string;
    name: string;
    imageUrl: string | null;
    rating: number | null;
  };
  suggestedDate: string;
  suggestedTime: string;
  services: Array<{
    id: string;
    name: string;
    priceInPaisa: number | null;
    durationMinutes: number | null;
  }>;
  staff: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  estimatedTotal: number;
  reason: string;
  confidenceScore: number;
  slotAvailable: boolean;
  status: string;
  expiresAt: Date;
}

interface LastVisit {
  salonId: string;
  salonName: string;
  salonImageUrl: string | null;
  lastVisitDate: string;
  daysSince: number;
  services: string[];
  staffName: string | null;
}

interface QuickBookResult {
  success: boolean;
  bookingId?: string;
  booking?: {
    id: string;
    salonName: string;
    date: string;
    time: string;
    services: string[];
    staffName: string | null;
    totalAmountPaisa: number;
  };
  error?: string;
}

class ExpressRebookingService {
  
  async updatePreferencesAfterBooking(bookingId: string): Promise<void> {
    const booking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (booking.length === 0 || !booking[0].userId || !booking[0].salonId) {
      return;
    }

    const { userId, salonId, serviceId, staffId, bookingDate, bookingTime, totalAmountPaisa } = booking[0];
    if (!userId || !salonId) return;

    const [existingPref, allBookings, staffCounts, serviceCounts, dayCounts] = await Promise.all([
      db.select()
        .from(userBookingPreferences)
        .where(and(
          eq(userBookingPreferences.userId, userId),
          eq(userBookingPreferences.salonId, salonId)
        ))
        .limit(1),
      db.select({ bookingDate: bookings.bookingDate })
        .from(bookings)
        .where(and(
          eq(bookings.userId, userId),
          eq(bookings.salonId, salonId),
          eq(bookings.status, 'completed')
        ))
        .orderBy(desc(bookings.bookingDate)),
      this.getStaffBookingCounts(userId, salonId),
      this.getServiceBookingCounts(userId, salonId),
      this.getDayOfWeekCounts(userId, salonId),
    ]);

    const topStaffId = staffCounts.length > 0 ? staffCounts[0].staffId : staffId;
    const topServiceIds = serviceCounts.slice(0, 3).map(s => s.serviceId);
    const preferredDayOfWeek = dayCounts.length > 0 ? dayCounts[0].dayOfWeek : null;
    const timeSlotClassified = this.classifyTimeSlot(bookingTime || '12:00');

    const intervals = this.calculateBookingIntervals(
      allBookings.map(b => b.bookingDate).filter(Boolean) as string[]
    );
    const avgInterval = intervals.length > 0 ? Math.round(this.median(intervals)) : 30;

    const currentTotalBookings = (existingPref[0]?.totalCompletedBookings || 0) + 1;
    const currentTotalSpent = (existingPref[0]?.totalSpentPaisa || 0) + (totalAmountPaisa || 0);

    const prefData: InsertUserBookingPreference = {
      userId,
      salonId,
      preferredStaffId: topStaffId,
      preferredServiceIds: topServiceIds.length > 0 ? topServiceIds : (serviceId ? [serviceId] : null),
      preferredDayOfWeek,
      preferredTimeSlot: timeSlotClassified,
      preferredTimeExact: bookingTime,
      averageBookingIntervalDays: avgInterval,
      lastBookingId: bookingId,
      lastBookingDate: bookingDate,
      totalCompletedBookings: currentTotalBookings,
      totalSpentPaisa: currentTotalSpent,
    };

    if (existingPref.length > 0) {
      await db.update(userBookingPreferences)
        .set({ ...prefData, updatedAt: new Date() })
        .where(eq(userBookingPreferences.id, existingPref[0].id));
    } else {
      await db.insert(userBookingPreferences).values(prefData);
    }
  }

  async getSuggestionsForUser(userId: string): Promise<{
    suggestions: EnrichedSuggestion[];
    lastVisits: LastVisit[];
  }> {
    const now = new Date();

    const activeSuggestions = await db.select()
      .from(rebookSuggestions)
      .where(and(
        eq(rebookSuggestions.userId, userId),
        inArray(rebookSuggestions.status, ['pending', 'shown']),
        gte(rebookSuggestions.expiresAt, now)
      ))
      .orderBy(desc(rebookSuggestions.confidenceScore))
      .limit(10);

    if (activeSuggestions.length === 0) {
      const lastVisits = await this.getLastVisitsBatched(userId);
      return { suggestions: [], lastVisits };
    }

    const salonIds = [...new Set(activeSuggestions.map(s => s.salonId))];
    const allServiceIds = [...new Set(activeSuggestions.flatMap(s => s.suggestedServiceIds || []))];
    const staffIds = [...new Set(activeSuggestions.map(s => s.suggestedStaffId).filter(Boolean))] as string[];

    const slotKeys = activeSuggestions.map(s => ({
      salonId: s.salonId,
      date: s.suggestedDate,
      time: s.suggestedTime,
      staffId: s.suggestedStaffId,
    }));

    const dates = [...new Set(slotKeys.map(k => k.date))];
    const [salonData, serviceData, staffData, conflictingBookings] = await Promise.all([
      salonIds.length > 0 
        ? db.select({
            id: salons.id,
            name: salons.name,
            imageUrl: salons.imageUrl,
            rating: salons.rating,
          }).from(salons).where(inArray(salons.id, salonIds))
        : [],
      allServiceIds.length > 0
        ? db.select({
            id: services.id,
            name: services.name,
            priceInPaisa: services.priceInPaisa,
            durationMinutes: services.durationMinutes,
          }).from(services).where(inArray(services.id, allServiceIds))
        : [],
      staffIds.length > 0
        ? db.select({
            id: staff.id,
            name: staff.name,
            photoUrl: staff.photoUrl,
          }).from(staff).where(inArray(staff.id, staffIds))
        : [],
      db.select({
        salonId: bookings.salonId,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        staffId: bookings.staffId,
      })
        .from(bookings)
        .where(and(
          inArray(bookings.salonId, salonIds),
          inArray(bookings.bookingDate, dates),
          inArray(bookings.status, ['confirmed', 'pending'])
        )),
    ]);

    const salonMap = new Map(salonData.map(s => [s.id, s]));
    const serviceMap = new Map(serviceData.map(s => [s.id, s]));
    const staffMap = new Map(staffData.map(s => [s.id, s]));

    const conflictSet = new Set(
      conflictingBookings.map(b => 
        `${b.salonId}|${b.bookingDate}|${b.bookingTime}|${b.staffId || 'any'}`
      )
    );

    const checkSlotAvailable = (salonId: string, date: string, time: string, staffId: string | null): boolean => {
      if (staffId) {
        return !conflictSet.has(`${salonId}|${date}|${time}|${staffId}`);
      }
      for (const key of conflictSet) {
        if (key.startsWith(`${salonId}|${date}|${time}|`)) {
          return false;
        }
      }
      return true;
    };

    const pendingIds = activeSuggestions
      .filter(s => s.status === 'pending')
      .map(s => s.id);

    if (pendingIds.length > 0) {
      await db.update(rebookSuggestions)
        .set({ status: 'shown', shownAt: now })
        .where(inArray(rebookSuggestions.id, pendingIds));
    }

    const enrichedSuggestions: EnrichedSuggestion[] = activeSuggestions.map((suggestion) => {
      const salon = salonMap.get(suggestion.salonId);
      if (!salon) return null;

      const serviceList = (suggestion.suggestedServiceIds || [])
        .map(id => serviceMap.get(id))
        .filter(Boolean) as Array<{ id: string; name: string; priceInPaisa: number | null; durationMinutes: number | null }>;

      const estimatedTotal = serviceList.reduce((sum, svc) => sum + (svc.priceInPaisa ?? 0), 0);
      const staffInfo = suggestion.suggestedStaffId ? staffMap.get(suggestion.suggestedStaffId) || null : null;

      const slotAvailable = checkSlotAvailable(
        suggestion.salonId,
        suggestion.suggestedDate,
        suggestion.suggestedTime,
        suggestion.suggestedStaffId
      );

      return {
        id: suggestion.id,
        salon: {
          id: salon.id,
          name: salon.name,
          imageUrl: salon.imageUrl,
          rating: salon.rating ? parseFloat(String(salon.rating)) : null,
        },
        suggestedDate: suggestion.suggestedDate,
        suggestedTime: suggestion.suggestedTime,
        services: serviceList,
        staff: staffInfo,
        estimatedTotal,
        reason: suggestion.reason,
        confidenceScore: suggestion.confidenceScore,
        slotAvailable,
        status: 'shown',
        expiresAt: suggestion.expiresAt,
      };
    }).filter(Boolean) as EnrichedSuggestion[];

    const lastVisits = await this.getLastVisitsBatched(userId);

    return { suggestions: enrichedSuggestions, lastVisits };
  }

  private generateSlotLockKey(salonId: string, date: string, time: string, staffId: string | null): number {
    const key = `${salonId}|${date}|${time}|${staffId || 'any'}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async quickBook(userId: string, suggestionId: string): Promise<QuickBookResult> {
    return await db.transaction(async (tx) => {
      const suggestion = await tx.select()
        .from(rebookSuggestions)
        .where(and(
          eq(rebookSuggestions.id, suggestionId),
          eq(rebookSuggestions.userId, userId)
        ))
        .limit(1);

      if (suggestion.length === 0) {
        return { success: false, error: 'Suggestion not found or not authorized' };
      }

      if (suggestion[0].status === 'accepted') {
        return { success: false, error: 'Suggestion already used' };
      }

      const now = new Date();
      if (isAfter(now, suggestion[0].expiresAt)) {
        return { success: false, error: 'Suggestion has expired' };
      }

      const lockKey = this.generateSlotLockKey(
        suggestion[0].salonId,
        suggestion[0].suggestedDate,
        suggestion[0].suggestedTime,
        suggestion[0].suggestedStaffId
      );
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

      const existingBooking = await tx.select({ id: bookings.id })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, suggestion[0].salonId),
          eq(bookings.bookingDate, suggestion[0].suggestedDate),
          eq(bookings.bookingTime, suggestion[0].suggestedTime),
          inArray(bookings.status, ['confirmed', 'pending']),
          suggestion[0].suggestedStaffId 
            ? eq(bookings.staffId, suggestion[0].suggestedStaffId) 
            : sql`true`
        ))
        .limit(1);

      if (existingBooking.length > 0) {
        return { success: false, error: 'The suggested time slot is no longer available' };
      }

      const [user, salon] = await Promise.all([
        tx.select().from(users).where(eq(users.id, userId)).limit(1),
        tx.select().from(salons).where(eq(salons.id, suggestion[0].salonId)).limit(1),
      ]);

      if (user.length === 0) {
        return { success: false, error: 'User not found' };
      }
      if (salon.length === 0) {
        return { success: false, error: 'Salon not found' };
      }

      let totalAmount = 0;
      const serviceNames: string[] = [];

      if (suggestion[0].suggestedServiceIds && suggestion[0].suggestedServiceIds.length > 0) {
        const serviceData = await tx.select()
          .from(services)
          .where(inArray(services.id, suggestion[0].suggestedServiceIds));

        for (const svc of serviceData) {
          totalAmount += svc.priceInPaisa ?? 0;
          serviceNames.push(svc.name);
        }
      }

      let staffName: string | null = null;
      if (suggestion[0].suggestedStaffId) {
        const staffResult = await tx.select({ name: staff.name })
          .from(staff)
          .where(eq(staff.id, suggestion[0].suggestedStaffId))
          .limit(1);
        staffName = staffResult[0]?.name || null;
      }

      const primaryServiceId = suggestion[0].suggestedServiceIds?.[0] || null;

      const [newBooking] = await tx.insert(bookings).values({
        salonId: suggestion[0].salonId,
        serviceId: primaryServiceId,
        staffId: suggestion[0].suggestedStaffId,
        userId,
        customerName: `${user[0].firstName || ''} ${user[0].lastName || ''}`.trim() || 'Customer',
        customerEmail: user[0].email || '',
        customerPhone: user[0].phone || '',
        bookingDate: suggestion[0].suggestedDate,
        bookingTime: suggestion[0].suggestedTime,
        status: 'confirmed',
        totalAmountPaisa: totalAmount,
        paymentMethod: 'pay_at_salon',
        source: 'express_rebook',
      }).returning();

      await tx.update(rebookSuggestions)
        .set({
          status: 'accepted',
          respondedAt: now,
          resultingBookingId: newBooking.id,
        })
        .where(eq(rebookSuggestions.id, suggestionId));

      return {
        success: true,
        bookingId: newBooking.id,
        booking: {
          id: newBooking.id,
          salonName: salon[0].name,
          date: suggestion[0].suggestedDate,
          time: suggestion[0].suggestedTime,
          services: serviceNames,
          staffName,
          totalAmountPaisa: totalAmount,
        },
      };
    });
  }

  async customizeBook(
    userId: string,
    suggestionId: string,
    modifications: {
      date?: string;
      time?: string;
      addServiceIds?: string[];
      removeServiceIds?: string[];
      staffId?: string;
    }
  ): Promise<QuickBookResult> {
    return await db.transaction(async (tx) => {
      const suggestion = await tx.select()
        .from(rebookSuggestions)
        .where(and(
          eq(rebookSuggestions.id, suggestionId),
          eq(rebookSuggestions.userId, userId)
        ))
        .limit(1);

      if (suggestion.length === 0) {
        return { success: false, error: 'Suggestion not found or not authorized' };
      }

      const now = new Date();
      if (isAfter(now, suggestion[0].expiresAt)) {
        return { success: false, error: 'Suggestion has expired' };
      }

      const finalDate = modifications.date || suggestion[0].suggestedDate;
      const finalTime = modifications.time || suggestion[0].suggestedTime;
      const finalStaffId = modifications.staffId || suggestion[0].suggestedStaffId;

      let finalServiceIds = [...(suggestion[0].suggestedServiceIds || [])];
      if (modifications.removeServiceIds) {
        finalServiceIds = finalServiceIds.filter(id => !modifications.removeServiceIds!.includes(id));
      }
      if (modifications.addServiceIds) {
        finalServiceIds = [...finalServiceIds, ...modifications.addServiceIds];
      }

      if (finalServiceIds.length === 0) {
        return { success: false, error: 'At least one service is required' };
      }

      const lockKey = this.generateSlotLockKey(
        suggestion[0].salonId,
        finalDate,
        finalTime,
        finalStaffId
      );
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

      const existingBooking = await tx.select({ id: bookings.id })
        .from(bookings)
        .where(and(
          eq(bookings.salonId, suggestion[0].salonId),
          eq(bookings.bookingDate, finalDate),
          eq(bookings.bookingTime, finalTime),
          inArray(bookings.status, ['confirmed', 'pending']),
          finalStaffId ? eq(bookings.staffId, finalStaffId) : sql`true`
        ))
        .limit(1);

      if (existingBooking.length > 0) {
        return { success: false, error: 'The selected time slot is not available' };
      }

      const [user, salon] = await Promise.all([
        tx.select().from(users).where(eq(users.id, userId)).limit(1),
        tx.select().from(salons).where(eq(salons.id, suggestion[0].salonId)).limit(1),
      ]);

      if (user.length === 0) {
        return { success: false, error: 'User not found' };
      }
      if (salon.length === 0) {
        return { success: false, error: 'Salon not found' };
      }

      let totalAmount = 0;
      const serviceNames: string[] = [];

      const serviceData = await tx.select()
        .from(services)
        .where(inArray(services.id, finalServiceIds));

      for (const svc of serviceData) {
        totalAmount += svc.priceInPaisa ?? 0;
        serviceNames.push(svc.name);
      }

      let staffName: string | null = null;
      if (finalStaffId) {
        const staffResult = await tx.select({ name: staff.name })
          .from(staff)
          .where(eq(staff.id, finalStaffId))
          .limit(1);
        staffName = staffResult[0]?.name || null;
      }

      const [newBooking] = await tx.insert(bookings).values({
        salonId: suggestion[0].salonId,
        serviceId: finalServiceIds[0],
        staffId: finalStaffId,
        userId,
        customerName: `${user[0].firstName || ''} ${user[0].lastName || ''}`.trim() || 'Customer',
        customerEmail: user[0].email || '',
        customerPhone: user[0].phone || '',
        bookingDate: finalDate,
        bookingTime: finalTime,
        status: 'confirmed',
        totalAmountPaisa: totalAmount,
        paymentMethod: 'pay_at_salon',
        source: 'express_rebook_custom',
      }).returning();

      await tx.update(rebookSuggestions)
        .set({
          status: 'accepted',
          respondedAt: now,
          resultingBookingId: newBooking.id,
        })
        .where(eq(rebookSuggestions.id, suggestionId));

      return {
        success: true,
        bookingId: newBooking.id,
        booking: {
          id: newBooking.id,
          salonName: salon[0].name,
          date: finalDate,
          time: finalTime,
          services: serviceNames,
          staffName,
          totalAmountPaisa: totalAmount,
        },
      };
    });
  }

  async dismissSuggestion(
    userId: string,
    suggestionId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await db.update(rebookSuggestions)
      .set({
        status: 'dismissed',
        respondedAt: new Date(),
        reason: reason ? `Dismissed: ${reason}` : undefined,
      })
      .where(and(
        eq(rebookSuggestions.id, suggestionId),
        eq(rebookSuggestions.userId, userId)
      ))
      .returning({ id: rebookSuggestions.id });

    if (result.length === 0) {
      return { success: false, error: 'Suggestion not found or not authorized' };
    }

    return { success: true };
  }

  async getLastBookingForSalon(userId: string, salonId: string): Promise<{
    lastBooking: any | null;
    nextAvailableSlot: { date: string; time: string; available: boolean } | null;
    suggestedRebookDate: string | null;
  }> {
    const [lastBooking, pref] = await Promise.all([
      db.select()
        .from(bookings)
        .where(and(
          eq(bookings.userId, userId),
          eq(bookings.salonId, salonId),
          eq(bookings.status, 'completed')
        ))
        .orderBy(desc(bookings.bookingDate))
        .limit(1),
      db.select()
        .from(userBookingPreferences)
        .where(and(
          eq(userBookingPreferences.userId, userId),
          eq(userBookingPreferences.salonId, salonId)
        ))
        .limit(1),
    ]);

    if (lastBooking.length === 0) {
      return { lastBooking: null, nextAvailableSlot: null, suggestedRebookDate: null };
    }

    const avgInterval = pref[0]?.averageBookingIntervalDays || 30;
    const lastDate = parseISO(lastBooking[0].bookingDate || '');
    const suggestedRebookDate = format(addDays(lastDate, avgInterval), 'yyyy-MM-dd');

    const [serviceInfo, staffInfo] = await Promise.all([
      lastBooking[0].serviceId
        ? db.select().from(services).where(eq(services.id, lastBooking[0].serviceId)).limit(1)
        : Promise.resolve([]),
      lastBooking[0].staffId
        ? db.select().from(staff).where(eq(staff.id, lastBooking[0].staffId)).limit(1)
        : Promise.resolve([]),
    ]);

    const nextSlot = await this.findNextAvailableSlot(
      salonId,
      lastBooking[0].bookingTime || '10:00',
      pref[0]?.preferredStaffId
    );

    return {
      lastBooking: {
        id: lastBooking[0].id,
        date: lastBooking[0].bookingDate,
        time: lastBooking[0].bookingTime,
        services: serviceInfo.length > 0 ? serviceInfo : [],
        staff: staffInfo[0] || null,
        totalPaid: lastBooking[0].totalAmountPaisa,
      },
      nextAvailableSlot: nextSlot,
      suggestedRebookDate,
    };
  }

  async generateSuggestionsForAllUsers(): Promise<number> {
    const preferences = await db.select()
      .from(userBookingPreferences)
      .where(gte(userBookingPreferences.totalCompletedBookings, MIN_BOOKINGS_FOR_SUGGESTIONS));

    let generatedCount = 0;
    const now = new Date();

    for (const pref of preferences) {
      try {
        const existingSuggestion = await db.select({ id: rebookSuggestions.id })
          .from(rebookSuggestions)
          .where(and(
            eq(rebookSuggestions.userId, pref.userId),
            eq(rebookSuggestions.salonId, pref.salonId),
            inArray(rebookSuggestions.status, ['pending', 'shown']),
            gte(rebookSuggestions.expiresAt, now)
          ))
          .limit(1);

        if (existingSuggestion.length > 0) continue;

        if (!pref.lastBookingDate || !pref.averageBookingIntervalDays) continue;

        const lastDate = parseISO(pref.lastBookingDate);
        const dueDate = addDays(lastDate, pref.averageBookingIntervalDays);
        const daysToDue = differenceInDays(dueDate, now);

        if (daysToDue > 3) continue;

        const slot = await this.findMatchingSlot({
          salonId: pref.salonId,
          staffId: pref.preferredStaffId,
          dayOfWeek: pref.preferredDayOfWeek,
          preferredTime: pref.preferredTimeExact || '10:00',
          startDate: daysToDue < 0 ? now : dueDate,
          lookAheadDays: SUGGESTION_LOOKAHEAD_DAYS,
        });

        if (!slot) continue;

        const confidenceScore = this.calculateConfidenceScore(pref, slot);
        const reason = this.generateSuggestionReason(pref, daysToDue);

        await db.insert(rebookSuggestions).values({
          userId: pref.userId,
          salonId: pref.salonId,
          suggestedDate: slot.date,
          suggestedTime: slot.time,
          suggestedServiceIds: pref.preferredServiceIds || [],
          suggestedStaffId: pref.preferredStaffId,
          confidenceScore,
          reason,
          status: 'pending',
          expiresAt: addDays(now, SUGGESTION_EXPIRY_DAYS),
        });

        generatedCount++;
      } catch (error) {
        console.error(`Error generating suggestion for user ${pref.userId}:`, error);
      }
    }

    return generatedCount;
  }

  async expireOldSuggestions(): Promise<number> {
    const now = new Date();
    
    const result = await db.update(rebookSuggestions)
      .set({ status: 'expired' })
      .where(and(
        inArray(rebookSuggestions.status, ['pending', 'shown']),
        lte(rebookSuggestions.expiresAt, now)
      ))
      .returning({ id: rebookSuggestions.id });

    return result.length;
  }

  private async getLastVisitsBatched(userId: string): Promise<LastVisit[]> {
    const prefs = await db.select()
      .from(userBookingPreferences)
      .where(eq(userBookingPreferences.userId, userId))
      .orderBy(desc(userBookingPreferences.updatedAt))
      .limit(5);

    if (prefs.length === 0) return [];

    const salonIds = prefs.map(p => p.salonId);
    const allServiceIds = [...new Set(prefs.flatMap(p => p.preferredServiceIds || []))];
    const staffIds = [...new Set(prefs.map(p => p.preferredStaffId).filter(Boolean))] as string[];

    const [salonData, serviceData, staffData] = await Promise.all([
      db.select({ id: salons.id, name: salons.name, imageUrl: salons.imageUrl })
        .from(salons)
        .where(inArray(salons.id, salonIds)),
      allServiceIds.length > 0
        ? db.select({ id: services.id, name: services.name })
            .from(services)
            .where(inArray(services.id, allServiceIds))
        : [],
      staffIds.length > 0
        ? db.select({ id: staff.id, name: staff.name })
            .from(staff)
            .where(inArray(staff.id, staffIds))
        : [],
    ]);

    const salonMap = new Map(salonData.map(s => [s.id, s]));
    const serviceMap = new Map(serviceData.map(s => [s.id, s.name]));
    const staffMap = new Map(staffData.map(s => [s.id, s.name]));

    const now = new Date();

    return prefs.map(pref => {
      const salon = salonMap.get(pref.salonId);
      if (!salon) return null;

      const serviceNames = (pref.preferredServiceIds || [])
        .map(id => serviceMap.get(id))
        .filter(Boolean) as string[];

      const staffName = pref.preferredStaffId ? staffMap.get(pref.preferredStaffId) || null : null;
      const daysSince = pref.lastBookingDate
        ? differenceInDays(now, parseISO(pref.lastBookingDate))
        : 0;

      return {
        salonId: salon.id,
        salonName: salon.name,
        salonImageUrl: salon.imageUrl,
        lastVisitDate: pref.lastBookingDate || '',
        daysSince,
        services: serviceNames,
        staffName,
      };
    }).filter(Boolean) as LastVisit[];
  }

  private async getStaffBookingCounts(userId: string, salonId: string): Promise<Array<{ staffId: string; count: number }>> {
    const result = await db.select({
      staffId: bookings.staffId,
      count: sql<number>`count(*)::int`,
    })
      .from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        sql`${bookings.staffId} IS NOT NULL`
      ))
      .groupBy(bookings.staffId)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return result.filter(r => r.staffId).map(r => ({
      staffId: r.staffId!,
      count: Number(r.count),
    }));
  }

  private async getServiceBookingCounts(userId: string, salonId: string): Promise<Array<{ serviceId: string; count: number }>> {
    const result = await db.select({
      serviceId: bookings.serviceId,
      count: sql<number>`count(*)::int`,
    })
      .from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed'),
        sql`${bookings.serviceId} IS NOT NULL`
      ))
      .groupBy(bookings.serviceId)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return result.filter(r => r.serviceId).map(r => ({
      serviceId: r.serviceId!,
      count: Number(r.count),
    }));
  }

  private async getDayOfWeekCounts(userId: string, salonId: string): Promise<Array<{ dayOfWeek: number; count: number }>> {
    const result = await db.select({
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${bookings.bookingDate}::date)::int`,
      count: sql<number>`count(*)::int`,
    })
      .from(bookings)
      .where(and(
        eq(bookings.userId, userId),
        eq(bookings.salonId, salonId),
        eq(bookings.status, 'completed')
      ))
      .groupBy(sql`EXTRACT(DOW FROM ${bookings.bookingDate}::date)`)
      .orderBy(desc(sql`count(*)`))
      .limit(3);

    return result.map(r => ({
      dayOfWeek: Number(r.dayOfWeek),
      count: Number(r.count),
    }));
  }

  private classifyTimeSlot(time: string): string {
    const hour = parseInt(time.split(':')[0] || '12');
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private calculateBookingIntervals(dates: string[]): number[] {
    if (dates.length < 2) return [];

    const sortedDates = dates.sort((a, b) => parseISO(b).getTime() - parseISO(a).getTime());
    const intervals: number[] = [];

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diff = differenceInDays(parseISO(sortedDates[i]), parseISO(sortedDates[i + 1]));
      if (diff > 0 && diff < 180) {
        intervals.push(diff);
      }
    }

    return intervals;
  }

  private median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private async checkSlotAvailability(
    salonId: string,
    date: string,
    time: string,
    staffId?: string | null
  ): Promise<boolean> {
    const existingBooking = await db.select({ id: bookings.id })
      .from(bookings)
      .where(and(
        eq(bookings.salonId, salonId),
        eq(bookings.bookingDate, date),
        eq(bookings.bookingTime, time),
        inArray(bookings.status, ['confirmed', 'pending']),
        staffId ? eq(bookings.staffId, staffId) : sql`true`
      ))
      .limit(1);

    return existingBooking.length === 0;
  }

  private async findNextAvailableSlot(
    salonId: string,
    preferredTime: string,
    preferredStaffId?: string | null
  ): Promise<{ date: string; time: string; available: boolean } | null> {
    const startDate = new Date();
    const dates: string[] = [];
    
    for (let i = 0; i < 14; i++) {
      dates.push(format(addDays(startDate, i), 'yyyy-MM-dd'));
    }

    const existingBookings = await db.select({
      bookingDate: bookings.bookingDate,
    })
      .from(bookings)
      .where(and(
        eq(bookings.salonId, salonId),
        inArray(bookings.bookingDate, dates),
        eq(bookings.bookingTime, preferredTime),
        inArray(bookings.status, ['confirmed', 'pending']),
        preferredStaffId ? eq(bookings.staffId, preferredStaffId) : sql`true`
      ));

    const bookedDates = new Set(existingBookings.map(b => b.bookingDate));

    for (const dateStr of dates) {
      if (!bookedDates.has(dateStr)) {
        return { date: dateStr, time: preferredTime, available: true };
      }
    }

    return null;
  }

  private async findMatchingSlot(options: {
    salonId: string;
    staffId?: string | null;
    dayOfWeek?: number | null;
    preferredTime: string;
    startDate: Date;
    lookAheadDays: number;
  }): Promise<{ date: string; time: string } | null> {
    const { salonId, staffId, dayOfWeek, preferredTime, startDate, lookAheadDays } = options;

    const dates: string[] = [];
    for (let i = 0; i < lookAheadDays; i++) {
      dates.push(format(addDays(startDate, i), 'yyyy-MM-dd'));
    }

    const existingBookings = await db.select({
      bookingDate: bookings.bookingDate,
    })
      .from(bookings)
      .where(and(
        eq(bookings.salonId, salonId),
        inArray(bookings.bookingDate, dates),
        eq(bookings.bookingTime, preferredTime),
        inArray(bookings.status, ['confirmed', 'pending']),
        staffId ? eq(bookings.staffId, staffId) : sql`true`
      ));

    const bookedDates = new Set(existingBookings.map(b => b.bookingDate));

    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      for (let i = 0; i < lookAheadDays; i++) {
        const checkDate = addDays(startDate, i);
        if (checkDate.getDay() === dayOfWeek) {
          const dateStr = format(checkDate, 'yyyy-MM-dd');
          if (!bookedDates.has(dateStr)) {
            return { date: dateStr, time: preferredTime };
          }
        }
      }
    }

    for (const dateStr of dates) {
      if (!bookedDates.has(dateStr)) {
        return { date: dateStr, time: preferredTime };
      }
    }

    return null;
  }

  private calculateConfidenceScore(pref: UserBookingPreference, slot: { date: string; time: string }): number {
    let score = 50;

    if (pref.preferredStaffId) {
      score += 10;
    }

    if (pref.preferredTimeExact === slot.time) {
      score += 10;
    }

    const slotDayOfWeek = parseISO(slot.date).getDay();
    if (pref.preferredDayOfWeek === slotDayOfWeek) {
      score += 5;
    }

    if ((pref.totalCompletedBookings ?? 0) >= 5) {
      score += 15;
    } else if ((pref.totalCompletedBookings ?? 0) >= 3) {
      score += 8;
    }

    return Math.min(100, score);
  }

  private generateSuggestionReason(pref: UserBookingPreference, daysToDue: number): string {
    const interval = pref.averageBookingIntervalDays || 30;

    if (daysToDue < -7) {
      return `It's been over ${interval + Math.abs(daysToDue)} days since your last visit. We miss you!`;
    } else if (daysToDue < 0) {
      return `Your ${interval}-day appointment cycle is ${Math.abs(daysToDue)} days overdue`;
    } else if (daysToDue === 0) {
      return `Today is the perfect day for your next appointment!`;
    } else {
      return `It's almost time for your next visit (in ${daysToDue} days)`;
    }
  }
}

export const expressRebookingService = new ExpressRebookingService();
