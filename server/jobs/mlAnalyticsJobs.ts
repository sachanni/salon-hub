import cron from 'node-cron';
import { db } from '../db';
import { salons, salonSubscriptions } from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { mlPredictionService } from '../services/mlPrediction.service';
import { PREMIUM_TIER_IDS } from '../constants/subscription';

async function aggregateMLAnalytics(): Promise<void> {
  console.log('[ML Analytics Job] Starting ML analytics aggregation...');

  try {
    // Get premium salons via salonSubscriptions table with active premium tier
    const premiumSalons = await db
      .select({ id: salons.id })
      .from(salons)
      .innerJoin(salonSubscriptions, eq(salonSubscriptions.salonId, salons.id))
      .where(
        and(
          eq(salons.isActive, 1),
          eq(salonSubscriptions.status, 'active'),
          inArray(salonSubscriptions.tierId, PREMIUM_TIER_IDS)
        )
      )
      .limit(100);

    console.log(`[ML Analytics Job] Processing ${premiumSalons.length} premium salons`);

    for (const salon of premiumSalons) {
      try {
        await mlPredictionService.aggregateServiceTimingAnalytics(salon.id);
        await mlPredictionService.aggregateStaffPerformancePatterns(salon.id);
      } catch (error) {
        console.error(`[ML Analytics Job] Error processing salon ${salon.id}:`, error);
      }
    }

    console.log('[ML Analytics Job] ML analytics aggregation complete');
  } catch (error) {
    console.error('[ML Analytics Job] Error in ML analytics aggregation:', error);
  }
}

async function cleanupOldPredictionLogs(): Promise<void> {
  console.log('[ML Analytics Job] Cleaning up old prediction logs...');

  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    await db.execute(`
      DELETE FROM prediction_accuracy_logs 
      WHERE created_at < '${ninetyDaysAgo.toISOString()}'
    `);

    console.log('[ML Analytics Job] Old prediction logs cleaned up');
  } catch (error) {
    console.error('[ML Analytics Job] Error cleaning up prediction logs:', error);
  }
}

export function startMLAnalyticsJobs(): void {
  console.log('[ML Analytics Jobs] Starting ML analytics background jobs...');

  cron.schedule('0 3 * * *', async () => {
    await aggregateMLAnalytics();
  });
  console.log('[ML Analytics Jobs] ✅ Daily ML aggregation scheduled (3 AM IST)');

  cron.schedule('0 4 * * 0', async () => {
    await cleanupOldPredictionLogs();
  });
  console.log('[ML Analytics Jobs] ✅ Weekly log cleanup scheduled (Sundays 4 AM)');

  console.log('✅ ML Analytics background jobs started');
}

export async function runMLAnalyticsNow(salonId?: string): Promise<void> {
  if (salonId) {
    console.log(`[ML Analytics] Running analytics for salon ${salonId}...`);
    await mlPredictionService.aggregateServiceTimingAnalytics(salonId);
    await mlPredictionService.aggregateStaffPerformancePatterns(salonId);
  } else {
    await aggregateMLAnalytics();
  }
}
