import cron from "node-cron";
import { db } from "../db";
import { staff, salons } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { queueCalculatorService } from "../services/queueCalculator.service";
import { departureNotificationService } from "../services/departureNotification.service";

let isRecalculatingQueues = false;
let isProcessingAlerts = false;

const BATCH_SIZE = 100;

export async function recalculateAllQueues(): Promise<void> {
  if (isRecalculatingQueues) {
    console.log('[Departure Job] Queue recalculation already in progress, skipping...');
    return;
  }

  isRecalculatingQueues = true;
  console.log('[Departure Job] Recalculating staff queues...');

  try {
    let salonCount = 0;
    let staffCount = 0;
    let lastSalonId = '';
    let hasMoreSalons = true;

    while (hasMoreSalons) {
      const activeSalons = await db.select({ id: salons.id })
        .from(salons)
        .where(
          lastSalonId
            ? and(eq(salons.isActive, 1), gt(salons.id, lastSalonId))
            : eq(salons.isActive, 1)
        )
        .orderBy(salons.id)
        .limit(BATCH_SIZE);

      if (activeSalons.length === 0) {
        hasMoreSalons = false;
        break;
      }

      for (const salon of activeSalons) {
        try {
          const salonStaff = await db.select({ id: staff.id })
            .from(staff)
            .where(and(
              eq(staff.salonId, salon.id),
              eq(staff.isActive, 1)
            ));

          for (const s of salonStaff) {
            await queueCalculatorService.updateStaffQueueStatusRecord(s.id);
            staffCount++;
          }
          salonCount++;
        } catch (error) {
          console.error(`[Departure Job] Error processing salon ${salon.id}:`, error);
        }
      }

      lastSalonId = activeSalons[activeSalons.length - 1].id;

      if (activeSalons.length < BATCH_SIZE) {
        hasMoreSalons = false;
      }
    }

    console.log(`[Departure Job] Recalculated queues for ${staffCount} staff across ${salonCount} salons`);
  } catch (error) {
    console.error('[Departure Job] Error recalculating queues:', error);
  } finally {
    isRecalculatingQueues = false;
  }
}

export async function processAndSendDepartureAlerts(): Promise<void> {
  if (isProcessingAlerts) {
    console.log('[Departure Job] Alert processing already in progress, skipping...');
    return;
  }

  isProcessingAlerts = true;
  console.log('[Departure Job] Processing departure alerts...');

  try {
    const updateResults = await departureNotificationService.recalculateAndUpdateAlerts();
    console.log(`[Departure Job] Created ${updateResults.created} new alerts, updated ${updateResults.updated} existing alerts`);

    const sendResults = await departureNotificationService.processPendingAlerts();
    console.log(`[Departure Job] Sent ${sendResults.sent}/${sendResults.processed} departure notifications`);

    if (updateResults.errors > 0 || sendResults.errors > 0) {
      console.warn(`[Departure Job] Encountered ${updateResults.errors + sendResults.errors} errors during processing`);
    }
  } catch (error) {
    console.error('[Departure Job] Error processing alerts:', error);
  } finally {
    isProcessingAlerts = false;
  }
}

export function startDepartureAlertsJobs(): void {
  console.log('[Departure Job] Starting Smart Departure Alerts background jobs...');

  cron.schedule('*/5 * * * *', async () => {
    console.log('[Departure Job] Running scheduled queue recalculation...');
    await recalculateAllQueues();
  });

  cron.schedule('*/5 * * * *', async () => {
    console.log('[Departure Job] Running scheduled alert processing...');
    await processAndSendDepartureAlerts();
  });

  console.log('[Departure Job] ✅ Queue recalculation job scheduled (every 5 minutes)');
  console.log('[Departure Job] ✅ Departure alert processing job scheduled (every 5 minutes)');
}
