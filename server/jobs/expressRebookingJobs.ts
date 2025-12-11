import cron from 'node-cron';
import { expressRebookingService } from '../services/expressRebooking.service';

export function startExpressRebookingJobs(): void {
  console.log('[Express Rebooking Jobs] Starting background jobs...');

  cron.schedule('0 6 * * *', async () => {
    console.log('[Express Rebooking Jobs] Running daily suggestion generation...');
    try {
      const generatedCount = await expressRebookingService.generateSuggestionsForAllUsers();
      console.log(`[Express Rebooking Jobs] Generated ${generatedCount} new suggestions`);
    } catch (error) {
      console.error('[Express Rebooking Jobs] Error generating suggestions:', error);
    }
  });

  cron.schedule('0 * * * *', async () => {
    try {
      const expiredCount = await expressRebookingService.expireOldSuggestions();
      if (expiredCount > 0) {
        console.log(`[Express Rebooking Jobs] Expired ${expiredCount} old suggestions`);
      }
    } catch (error) {
      console.error('[Express Rebooking Jobs] Error expiring suggestions:', error);
    }
  });

  console.log('[Express Rebooking Jobs] Background jobs scheduled:');
  console.log('  - Suggestion generation: daily at 6 AM');
  console.log('  - Suggestion expiration: every hour');
}
