import cron from 'node-cron';
import { dynamicPricingService } from '../services/dynamicPricing.service';

let isProcessingDemand = false;
let lastDemandUpdateTime: Date | null = null;
let lastDemandUpdateStatus: 'success' | 'error' | 'skipped' | null = null;
let demandUpdateMetrics = {
  totalRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  skippedRuns: 0,
  lastEntriesUpdated: 0,
  averageDurationMs: 0,
};

export function getDynamicPricingJobHealth() {
  return {
    lastRunTime: lastDemandUpdateTime?.toISOString() || null,
    lastRunStatus: lastDemandUpdateStatus,
    isCurrentlyRunning: isProcessingDemand,
    metrics: demandUpdateMetrics,
    nextScheduledRuns: {
      dailyUpdate: '02:00 IST daily',
      weeklyRefresh: '14:00 IST Sundays',
    },
  };
}

export async function updateAllSalonsDemandPatterns(): Promise<void> {
  const startTime = Date.now();
  demandUpdateMetrics.totalRuns++;

  if (isProcessingDemand) {
    console.log('[Dynamic Pricing Job] Demand update already in progress, skipping...');
    lastDemandUpdateStatus = 'skipped';
    demandUpdateMetrics.skippedRuns++;
    return;
  }

  isProcessingDemand = true;
  lastDemandUpdateTime = new Date();
  console.log(`[Dynamic Pricing Job] Starting demand pattern update at ${lastDemandUpdateTime.toISOString()}`);

  try {
    const updatedCount = await dynamicPricingService.updateDemandPatternsForAllSalons();
    const durationMs = Date.now() - startTime;
    
    lastDemandUpdateStatus = 'success';
    demandUpdateMetrics.successfulRuns++;
    demandUpdateMetrics.lastEntriesUpdated = updatedCount;
    demandUpdateMetrics.averageDurationMs = Math.round(
      (demandUpdateMetrics.averageDurationMs * (demandUpdateMetrics.successfulRuns - 1) + durationMs) / demandUpdateMetrics.successfulRuns
    );

    console.log(`[Dynamic Pricing Job] SUCCESS: Updated ${updatedCount} demand entries in ${durationMs}ms`);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    lastDemandUpdateStatus = 'error';
    demandUpdateMetrics.failedRuns++;
    
    console.error(`[Dynamic Pricing Job] ERROR: Failed after ${durationMs}ms:`, error);
  } finally {
    isProcessingDemand = false;
  }
}

export function startDynamicPricingJobs(): void {
  console.log('[Dynamic Pricing Jobs] Starting background jobs...');

  cron.schedule('0 2 * * *', async () => {
    console.log('[Dynamic Pricing Job] Daily demand update triggered');
    await updateAllSalonsDemandPatterns();
  }, { timezone: 'Asia/Kolkata' });

  cron.schedule('0 14 * * 0', async () => {
    console.log('[Dynamic Pricing Job] Weekly demand pattern refresh triggered');
    await updateAllSalonsDemandPatterns();
  }, { timezone: 'Asia/Kolkata' });

  console.log('[Dynamic Pricing Jobs] Background jobs scheduled:');
  console.log('  - Demand pattern update: daily at 2 AM IST');
  console.log('  - Weekly refresh: Sundays at 2 PM IST');
}
