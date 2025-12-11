import cron from "node-cron";
import { waitlistService } from "../services/waitlistService";
import { db } from "../db";
import { timeSlots, slotWaitlist, WAITLIST_STATUS } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { subMinutes, format } from "date-fns";

let isProcessingSlots = false;
let isProcessingExpired = false;
let isProcessingEscalations = false;

export async function processNewlyAvailableSlots(): Promise<void> {
  if (isProcessingSlots) {
    console.log('[Waitlist Job] Slot processing already in progress, skipping...');
    return;
  }

  isProcessingSlots = true;
  console.log('[Waitlist Job] Processing newly available slots...');

  try {
    const now = new Date();

    const recentlyFreedSlots = await db.select({
      id: timeSlots.id,
      salonId: timeSlots.salonId,
      startDateTime: timeSlots.startDateTime,
    })
      .from(timeSlots)
      .where(and(
        eq(timeSlots.isBooked, 0),
        gte(timeSlots.startDateTime, now)
      ))
      .limit(100);

    let processedCount = 0;

    for (const slot of recentlyFreedSlots) {
      if (!slot.salonId || !slot.startDateTime) continue;
      
      const matchingEntries = await waitlistService.findMatchingWaitlistEntries(slot.id);
      
      if (matchingEntries.length > 0) {
        const entry = matchingEntries[0];
        
        if (entry.status === WAITLIST_STATUS.waiting) {
          await waitlistService.notifyWaitlistEntry(entry.id, slot.id);
          processedCount++;
          const slotDate = format(slot.startDateTime, 'yyyy-MM-dd');
          const slotTime = format(slot.startDateTime, 'HH:mm');
          console.log(`[Waitlist Job] Notified user for slot ${slot.id} on ${slotDate} at ${slotTime}`);
        }
      }
    }

    console.log(`[Waitlist Job] Processed ${processedCount} slot notifications`);
  } catch (error) {
    console.error('[Waitlist Job] Error processing slots:', error);
  } finally {
    isProcessingSlots = false;
  }
}

export async function expireOldWaitlistEntries(): Promise<void> {
  if (isProcessingExpired) {
    console.log('[Waitlist Job] Expiration processing already in progress, skipping...');
    return;
  }

  isProcessingExpired = true;
  console.log('[Waitlist Job] Processing expired waitlist entries...');

  try {
    const expiredCount = await waitlistService.expireOldEntries();
    console.log(`[Waitlist Job] Expired ${expiredCount} waitlist entries`);
  } catch (error) {
    console.error('[Waitlist Job] Error expiring entries:', error);
  } finally {
    isProcessingExpired = false;
  }
}

export async function escalateUnrespondedNotifications(): Promise<void> {
  if (isProcessingEscalations) {
    console.log('[Waitlist Job] Escalation processing already in progress, skipping...');
    return;
  }

  isProcessingEscalations = true;
  console.log('[Waitlist Job] Processing unresponded notifications...');

  try {
    const escalatedCount = await waitlistService.escalateUnrespondedNotifications();
    console.log(`[Waitlist Job] Escalated ${escalatedCount} unresponded notifications`);
  } catch (error) {
    console.error('[Waitlist Job] Error escalating notifications:', error);
  } finally {
    isProcessingEscalations = false;
  }
}

export function startWaitlistJobs(): void {
  console.log('[Waitlist Jobs] Starting waitlist background jobs...');

  cron.schedule('*/5 * * * *', async () => {
    await processNewlyAvailableSlots();
  }, { timezone: "Asia/Kolkata" });

  cron.schedule('0 * * * *', async () => {
    await expireOldWaitlistEntries();
  }, { timezone: "Asia/Kolkata" });

  cron.schedule('*/15 * * * *', async () => {
    await escalateUnrespondedNotifications();
  }, { timezone: "Asia/Kolkata" });

  console.log('[Waitlist Jobs] Background jobs scheduled:');
  console.log('  - Slot availability processing: every 5 minutes');
  console.log('  - Entry expiration: every hour');
  console.log('  - Notification escalation: every 15 minutes');
}
