import cron from 'node-cron';
import { serviceBundleService } from '../services/serviceBundle.service';

export function startServiceBundleJobs(): void {
  console.log('[Service Bundle Jobs] Starting background jobs...');

  cron.schedule('0 0 * * *', async () => {
    console.log('[Service Bundle Jobs] Running daily expired package cleanup...');
    try {
      const deactivatedCount = await serviceBundleService.deactivateExpiredPackages();
      console.log(`[Service Bundle Jobs] Deactivated ${deactivatedCount} expired packages`);
    } catch (error) {
      console.error('[Service Bundle Jobs] Error in expired package cleanup:', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[Service Bundle Jobs] Background jobs scheduled:');
  console.log('  - Expired package cleanup: daily at midnight IST');
}
