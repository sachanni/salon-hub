import * as cron from 'node-cron';
import { variantGenerationService } from './VariantGenerationService';
import { performanceMonitoringService } from './PerformanceMonitoringService';
import { winnerSelectionService } from './WinnerSelectionService';
import { campaignOptimizationService } from './CampaignOptimizationService';
import { communicationService } from '../communicationService';
import { storage } from '../storage';
import { rebookingService } from '../services/rebooking.service';
import { noShowService } from '../services/noshow.service';
import { giftCardService } from '../services/giftcard.service';
import type { 
  AbTestCampaign,
  AutomationConfiguration,
  Salon,
  InsertAutomatedActionLog
} from '@shared/schema';

class ScheduledJobsService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  // Start all scheduled automation jobs
  async startScheduledJobs(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduled jobs are already running');
      return;
    }

    console.log('Starting automation scheduled jobs...');

    // Performance Collection Job - Every 15 minutes
    const performanceJob = cron.schedule('*/15 * * * *', async () => {
      await this.runPerformanceCollectionJob();
    }, { scheduled: false });

    // Winner Analysis Job - Every hour
    const winnerAnalysisJob = cron.schedule('0 * * * *', async () => {
      await this.runWinnerAnalysisJob();
    }, { scheduled: false });

    // Campaign Optimization Job - Daily at 2 AM
    const optimizationJob = cron.schedule('0 2 * * *', async () => {
      await this.runCampaignOptimizationJob();
    }, { scheduled: false });

    // Automated Reports Job - Weekly on Monday at 9 AM
    const reportsJob = cron.schedule('0 9 * * 1', async () => {
      await this.runAutomatedReportsJob();
    }, { scheduled: false });

    // Cleanup Job - Daily at 3 AM
    const cleanupJob = cron.schedule('0 3 * * *', async () => {
      await this.runCleanupJob();
    }, { scheduled: false });

    // Rebooking Status Update Job - Daily at 6 AM
    const rebookingStatusJob = cron.schedule('0 6 * * *', async () => {
      await this.runRebookingStatusUpdateJob();
    }, { scheduled: false });

    // Rebooking Reminder Scheduling Job - Daily at 7 AM
    const rebookingScheduleJob = cron.schedule('0 7 * * *', async () => {
      await this.runRebookingReminderSchedulingJob();
    }, { scheduled: false });

    // Rebooking Reminder Processing Job - Every hour at minute 30
    const rebookingProcessJob = cron.schedule('30 * * * *', async () => {
      await this.runRebookingReminderProcessingJob();
    }, { scheduled: false });

    // Weekly Rebooking Optimization Job - Sundays at 4 AM
    const rebookingOptimizationJob = cron.schedule('0 4 * * 0', async () => {
      await this.runWeeklyRebookingOptimizationJob();
    }, { scheduled: false });

    // No-Show Detection Job - Every 15 minutes during business hours (8 AM - 10 PM)
    const noShowDetectionJob = cron.schedule('*/15 8-22 * * *', async () => {
      await this.runNoShowDetectionJob();
    }, { scheduled: false });

    // Gift Card Expiry Job - Daily at 1 AM
    const giftCardExpiryJob = cron.schedule('0 1 * * *', async () => {
      await this.runGiftCardExpiryJob();
    }, { scheduled: false });

    // Gift Card Scheduled Delivery Job - Every 30 minutes
    const giftCardDeliveryJob = cron.schedule('*/30 * * * *', async () => {
      await this.runGiftCardDeliveryJob();
    }, { scheduled: false });

    // Store job references
    this.jobs.set('performance_collection', performanceJob);
    this.jobs.set('winner_analysis', winnerAnalysisJob);
    this.jobs.set('campaign_optimization', optimizationJob);
    this.jobs.set('automated_reports', reportsJob);
    this.jobs.set('cleanup', cleanupJob);
    this.jobs.set('rebooking_status_update', rebookingStatusJob);
    this.jobs.set('rebooking_reminder_scheduling', rebookingScheduleJob);
    this.jobs.set('rebooking_reminder_processing', rebookingProcessJob);
    this.jobs.set('rebooking_weekly_optimization', rebookingOptimizationJob);
    this.jobs.set('no_show_detection', noShowDetectionJob);
    this.jobs.set('gift_card_expiry', giftCardExpiryJob);
    this.jobs.set('gift_card_delivery', giftCardDeliveryJob);

    // Start all jobs
    performanceJob.start();
    winnerAnalysisJob.start();
    optimizationJob.start();
    reportsJob.start();
    cleanupJob.start();
    rebookingStatusJob.start();
    rebookingScheduleJob.start();
    rebookingProcessJob.start();
    rebookingOptimizationJob.start();
    noShowDetectionJob.start();
    giftCardExpiryJob.start();
    giftCardDeliveryJob.start();

    this.isRunning = true;
    console.log('All automation scheduled jobs started successfully');
  }

  // Stop all scheduled jobs
  async stopScheduledJobs(): Promise<void> {
    console.log('Stopping automation scheduled jobs...');
    
    for (const [jobName, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job: ${jobName}`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    
    // Stop performance monitoring
    await performanceMonitoringService.stopAllMonitoring();
    
    console.log('All scheduled jobs stopped');
  }

  // Performance Collection Job - Runs every 15 minutes
  private async runPerformanceCollectionJob(): Promise<void> {
    try {
      console.log('Running performance collection job...');
      
      // Get all salons with automation enabled
      const salons = await this.getSalonsWithAutomationEnabled();
      
      for (const salon of salons) {
        try {
          await this.collectPerformanceForSalon(salon.id);
        } catch (error) {
          console.error(`Error collecting performance for salon ${salon.id}:`, error);
        }
      }
      
      console.log(`Performance collection completed for ${salons.length} salons`);
      
    } catch (error) {
      console.error('Error in performance collection job:', error);
    }
  }

  // Winner Analysis Job - Runs every hour
  private async runWinnerAnalysisJob(): Promise<void> {
    try {
      console.log('Running winner analysis job...');
      
      const salons = await this.getSalonsWithAutomationEnabled();
      let analysisCount = 0;
      
      for (const salon of salons) {
        try {
          const config = await storage.getAutomationConfigurationBySalonId(salon.id);
          if (!config?.enableAutoWinnerSelection) {
            continue;
          }
          
          await winnerSelectionService.runAutomaticWinnerAnalysis(salon.id);
          analysisCount++;
          
        } catch (error) {
          console.error(`Error running winner analysis for salon ${salon.id}:`, error);
        }
      }
      
      console.log(`Winner analysis completed for ${analysisCount} salons`);
      
    } catch (error) {
      console.error('Error in winner analysis job:', error);
    }
  }

  // Campaign Optimization Job - Runs daily
  private async runCampaignOptimizationJob(): Promise<void> {
    try {
      console.log('Running campaign optimization job...');
      
      const salons = await this.getSalonsWithAutomationEnabled();
      let optimizationCount = 0;
      
      for (const salon of salons) {
        try {
          await campaignOptimizationService.runDailyOptimizationJob(salon.id);
          optimizationCount++;
          
          // Generate insights
          await campaignOptimizationService.generateInsights(salon.id);
          
        } catch (error) {
          console.error(`Error running optimization for salon ${salon.id}:`, error);
        }
      }
      
      console.log(`Campaign optimization completed for ${optimizationCount} salons`);
      
    } catch (error) {
      console.error('Error in campaign optimization job:', error);
    }
  }

  // Automated Reports Job - Runs weekly
  private async runAutomatedReportsJob(): Promise<void> {
    try {
      console.log('Running automated reports job...');
      
      const salons = await this.getSalonsWithAutomationEnabled();
      let reportCount = 0;
      
      for (const salon of salons) {
        try {
          await this.generateAndSendWeeklyReport(salon);
          reportCount++;
          
        } catch (error) {
          console.error(`Error generating report for salon ${salon.id}:`, error);
        }
      }
      
      console.log(`Automated reports sent to ${reportCount} salons`);
      
    } catch (error) {
      console.error('Error in automated reports job:', error);
    }
  }

  // Cleanup Job - Runs daily
  private async runCleanupJob(): Promise<void> {
    try {
      console.log('Running cleanup job...');
      
      // Clean up expired optimization recommendations
      await this.cleanupExpiredRecommendations();
      
      // Clean up old automation logs (keep last 30 days)
      await this.cleanupOldLogs();
      
      // Clean up old test metrics (aggregate and clean up daily metrics older than 90 days)
      await this.cleanupOldMetrics();
      
      console.log('Cleanup job completed');
      
    } catch (error) {
      console.error('Error in cleanup job:', error);
    }
  }

  // Collect performance data for a specific salon
  private async collectPerformanceForSalon(salonId: string): Promise<void> {
    try {
      // Get active test campaigns for this salon
      const activeTests = await storage.getAbTestCampaignsBySalonId(salonId, { status: 'running' });
      
      for (const test of activeTests) {
        // Trigger performance monitoring check
        await performanceMonitoringService.performMonitoringCheck(test.id);
      }
      
      // Log the performance collection
      await this.logAutomationAction(salonId, 'performance_collection', {
        activeTests: activeTests.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Error collecting performance for salon ${salonId}:`, error);
    }
  }

  // Generate and send weekly report for a salon
  private async generateAndSendWeeklyReport(salon: Salon): Promise<void> {
    try {
      const report = await this.generateWeeklyReport(salon.id);
      
      if (report.hasData) {
        await this.sendWeeklyReport(salon, report);
      }
      
      // Log the report generation
      await this.logAutomationAction(salon.id, 'weekly_report_generated', {
        reportPeriod: report.period,
        testsAnalyzed: report.testsAnalyzed,
        optimizationsGenerated: report.optimizationsGenerated
      });
      
    } catch (error) {
      console.error(`Error generating weekly report for salon ${salon.id}:`, error);
    }
  }

  // Generate weekly performance report
  private async generateWeeklyReport(salonId: string): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Get completed tests from last week
    const completedTests = await storage.getAbTestCampaignsBySalonId(salonId, {
      status: 'completed',
      completedAfter: startDate,
      completedBefore: endDate
    });
    
    // Get active tests
    const activeTests = await storage.getAbTestCampaignsBySalonId(salonId, { status: 'running' });
    
    // Get optimization recommendations from last week
    const recommendations = await storage.getOptimizationRecommendationsBySalonId(salonId, {
      createdAfter: startDate,
      createdBefore: endDate
    });
    
    // Get performance insights
    const insights = await storage.getCampaignOptimizationInsightsBySalonId(salonId, {
      createdAfter: startDate,
      status: 'active'
    });

    const report = {
      hasData: completedTests.length > 0 || activeTests.length > 0 || recommendations.length > 0,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      testsAnalyzed: completedTests.length,
      activeTests: activeTests.length,
      optimizationsGenerated: recommendations.length,
      completedTests: completedTests.map(test => ({
        id: test.id,
        name: test.campaignName,
        status: test.status,
        completedAt: test.completedAt,
        performance: this.calculateTestPerformance(test)
      })),
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      insights: insights.slice(0, 3), // Top 3 insights
      summary: this.generateReportSummary(completedTests, recommendations, insights)
    };
    
    return report;
  }

  // Send weekly report via email
  private async sendWeeklyReport(salon: Salon, report: any): Promise<void> {
    try {
      const reportContent = this.formatReportContent(salon, report);
      
      // Get salon owner email
      const owner = await storage.getUserById(salon.ownerId);
      if (!owner?.email) {
        console.log(`No email found for salon owner ${salon.ownerId}`);
        return;
      }
      
      // Send email report
      await communicationService.sendMessage({
        to: owner.email,
        channel: 'email',
        type: 'transactional',
        salonId: salon.id,
        customContent: {
          subject: `${salon.name} - Weekly A/B Testing & Optimization Report`,
          body: reportContent
        }
      });
      
      console.log(`Weekly report sent to ${owner.email} for salon ${salon.name}`);
      
    } catch (error) {
      console.error('Error sending weekly report:', error);
    }
  }

  // Format report content for email
  private formatReportContent(salon: Salon, report: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .metric { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .recommendation { background-color: #f3e5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .insight { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Weekly A/B Testing & Optimization Report</h1>
        <h2>${salon.name}</h2>
        <p><strong>Report Period:</strong> ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h3>📈 Summary</h3>
        <div class="metric">
            <strong>Tests Completed:</strong> ${report.testsAnalyzed}<br>
            <strong>Active Tests:</strong> ${report.activeTests}<br>
            <strong>Optimization Recommendations:</strong> ${report.optimizationsGenerated}<br>
            <strong>Performance Insights:</strong> ${report.insights.length}
        </div>
    </div>

    ${report.completedTests.length > 0 ? `
    <div class="section">
        <h3>✅ Completed Tests</h3>
        ${report.completedTests.map((test: any) => `
        <div class="metric">
            <strong>${test.name}</strong><br>
            Completed: ${new Date(test.completedAt).toLocaleDateString()}<br>
            ${test.performance ? `Performance: ${test.performance}` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${report.recommendations.length > 0 ? `
    <div class="section">
        <h3>💡 Top Optimization Recommendations</h3>
        ${report.recommendations.slice(0, 3).map((rec: any) => `
        <div class="recommendation">
            <strong>${rec.recommendationTitle}</strong><br>
            ${rec.recommendationDescription}<br>
            <em>Expected Improvement: ${(rec.expectedImprovement * 100).toFixed(1)}%</em>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${report.insights.length > 0 ? `
    <div class="section">
        <h3>🎯 Performance Insights</h3>
        ${report.insights.slice(0, 2).map((insight: any) => `
        <div class="insight">
            <strong>${insight.insightTitle}</strong><br>
            ${insight.insightDescription}
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h3>🎯 Key Takeaways</h3>
        <div class="metric">
            ${report.summary}
        </div>
    </div>

    <div class="footer">
        <p>This automated report was generated by your salon's A/B testing automation system.</p>
        <p>Log in to your dashboard to view detailed analytics and take action on recommendations.</p>
    </div>
</body>
</html>
    `;
  }

  // Helper methods
  private async getSalonsWithAutomationEnabled(): Promise<Salon[]> {
    try {
      const allSalons = await storage.getAllSalons();
      const enabledSalons: Salon[] = [];
      
      for (const salon of allSalons) {
        const config = await storage.getAutomationConfigurationBySalonId(salon.id);
        if (config?.isEnabled) {
          enabledSalons.push(salon);
        }
      }
      
      return enabledSalons;
    } catch (error) {
      console.error('Error getting salons with automation enabled:', error);
      return [];
    }
  }

  private calculateTestPerformance(test: AbTestCampaign): string {
    // Simplified performance calculation
    // In a real implementation, this would analyze the test results
    return 'Performance data available in dashboard';
  }

  private generateReportSummary(completedTests: any[], recommendations: any[], insights: any[]): string {
    if (completedTests.length === 0 && recommendations.length === 0) {
      return 'No significant A/B testing activity this week. Consider running new tests to optimize your campaigns.';
    }
    
    let summary = '';
    
    if (completedTests.length > 0) {
      summary += `✅ ${completedTests.length} A/B test${completedTests.length > 1 ? 's' : ''} completed this week. `;
    }
    
    if (recommendations.length > 0) {
      summary += `💡 ${recommendations.length} optimization recommendation${recommendations.length > 1 ? 's' : ''} generated. `;
    }
    
    if (insights.length > 0) {
      summary += `🎯 ${insights.length} new performance insight${insights.length > 1 ? 's' : ''} identified. `;
    }
    
    summary += '\n\nReview the recommendations above and implement them to improve your campaign performance.';
    
    return summary;
  }

  // Rebooking Status Update Job - Updates rebooking statuses for all salons
  private async runRebookingStatusUpdateJob(): Promise<void> {
    try {
      console.log('Running rebooking status update job...');
      
      const salons = await storage.getAllSalons();
      let totalUpdated = 0;
      
      for (const salon of salons) {
        try {
          const settings = await storage.getRebookingSettings(salon.id);
          if (!settings?.isEnabled) continue;
          
          const updatedCount = await rebookingService.updateRebookingStatuses(salon.id);
          totalUpdated += updatedCount;
          
        } catch (error) {
          console.error(`Error updating rebooking statuses for salon ${salon.id}:`, error);
        }
      }
      
      console.log(`Rebooking status update completed: ${totalUpdated} statuses updated`);
      
    } catch (error) {
      console.error('Error in rebooking status update job:', error);
    }
  }

  // Rebooking Reminder Scheduling Job - Schedules reminders for all salons
  private async runRebookingReminderSchedulingJob(): Promise<void> {
    try {
      console.log('Running rebooking reminder scheduling job...');
      
      const salons = await storage.getAllSalons();
      let totalScheduled = 0;
      
      for (const salon of salons) {
        try {
          const settings = await storage.getRebookingSettings(salon.id);
          if (!settings?.isEnabled) continue;
          
          const scheduledCount = await rebookingService.scheduleReminders(salon.id);
          totalScheduled += scheduledCount;
          
          if (scheduledCount > 0) {
            await this.logAutomationAction(salon.id, 'rebooking_reminders_scheduled', {
              scheduledCount,
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (error) {
          console.error(`Error scheduling rebooking reminders for salon ${salon.id}:`, error);
        }
      }
      
      console.log(`Rebooking reminder scheduling completed: ${totalScheduled} reminders scheduled`);
      
    } catch (error) {
      console.error('Error in rebooking reminder scheduling job:', error);
    }
  }

  // Rebooking Reminder Processing Job - Sends pending reminders
  private async runRebookingReminderProcessingJob(): Promise<void> {
    try {
      console.log('Running rebooking reminder processing job...');
      
      const result = await rebookingService.processPendingReminders(100);
      
      console.log(`Rebooking reminder processing completed: ${result.sent} sent, ${result.failed} failed`);
      
    } catch (error) {
      console.error('Error in rebooking reminder processing job:', error);
    }
  }

  // Weekly Rebooking Optimization Job - Analyzes reminder performance and optimizes channels/timing
  private async runWeeklyRebookingOptimizationJob(): Promise<void> {
    try {
      console.log('Running weekly rebooking optimization job...');
      
      const salons = await storage.getAllSalons();
      let totalOptimized = 0;
      
      for (const salon of salons) {
        try {
          const settings = await storage.getRebookingSettings(salon.id);
          if (!settings?.isEnabled) continue;
          
          const optimizedCount = await this.optimizeRebookingForSalon(salon.id);
          totalOptimized += optimizedCount;
          
          if (optimizedCount > 0) {
            await this.logAutomationAction(salon.id, 'rebooking_optimization', {
              optimizedCount,
              timestamp: new Date().toISOString()
            });
          }
          
        } catch (error) {
          console.error(`Error optimizing rebooking for salon ${salon.id}:`, error);
        }
      }
      
      console.log(`Weekly rebooking optimization completed: ${totalOptimized} customer stats optimized`);
      
    } catch (error) {
      console.error('Error in weekly rebooking optimization job:', error);
    }
  }

  // Analyze reminder performance and update optimal channels/timing for customers
  private async optimizeRebookingForSalon(salonId: string): Promise<number> {
    const stats = await storage.getCustomerRebookingStatsBySalonId(salonId);
    let optimizedCount = 0;
    
    // Get reminder history for analysis (last 90 days)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const endDate = new Date();
    
    const reminders = await storage.getRebookingRemindersForChannelAnalysis(salonId, startDate, endDate);
    
    // Calculate optimal channel based on conversion rates
    const channelPerformance: Record<string, { sent: number; converted: number }> = {
      email: { sent: 0, converted: 0 },
      sms: { sent: 0, converted: 0 }
    };
    
    for (const reminder of reminders) {
      const channel = reminder.channel || 'email';
      if (channelPerformance[channel]) {
        channelPerformance[channel].sent++;
        if (reminder.convertedAt) {
          channelPerformance[channel].converted++;
        }
      }
    }
    
    // Calculate conversion rates
    const emailRate = channelPerformance.email.sent > 0 
      ? channelPerformance.email.converted / channelPerformance.email.sent 
      : 0;
    const smsRate = channelPerformance.sms.sent > 0 
      ? channelPerformance.sms.converted / channelPerformance.sms.sent 
      : 0;
    
    // Determine optimal channel order
    const optimalChannels = emailRate >= smsRate ? ['email', 'sms'] : ['sms', 'email'];
    
    // Update settings if we have enough data
    if (channelPerformance.email.sent + channelPerformance.sms.sent >= 10) {
      await storage.updateRebookingSettings(salonId, {
        defaultReminderChannels: optimalChannels
      });
      optimizedCount++;
      
      console.log(`Salon ${salonId}: Optimized channels to ${optimalChannels.join(', ')} (email: ${(emailRate * 100).toFixed(1)}%, sms: ${(smsRate * 100).toFixed(1)}%)`);
    }
    
    return optimizedCount;
  }

  private async runNoShowDetectionJob(): Promise<void> {
    try {
      console.log('Running no-show detection job...');
      
      const result = await noShowService.detectAndMarkNoShows();
      
      console.log(`No-show detection completed: processed=${result.processed}, marked=${result.noShowsMarked}, deposits=${result.depositsForfeited}`);
      
      if (result.errors.length > 0) {
        console.warn('No-show detection errors:', result.errors.slice(0, 5));
      }
      
    } catch (error) {
      console.error('Error in no-show detection job:', error);
    }
  }

  private async runGiftCardExpiryJob(): Promise<void> {
    try {
      console.log('Running gift card expiry job...');
      
      const expiryResult = await giftCardService.processExpiredGiftCards();
      const cleanupResult = await giftCardService.cleanupPendingPayments();
      
      console.log(`Gift card expiry completed: expired=${expiryResult.expired}, cleaned=${cleanupResult.cleaned}`);
      
    } catch (error) {
      console.error('Error in gift card expiry job:', error);
    }
  }

  private async runGiftCardDeliveryJob(): Promise<void> {
    try {
      console.log('Running gift card delivery job...');
      
      const result = await giftCardService.processScheduledDeliveries();
      
      console.log(`Gift card delivery completed: processed=${result.processed}, sent=${result.sent}`);
      
    } catch (error) {
      console.error('Error in gift card delivery job:', error);
    }
  }

  private async cleanupExpiredRecommendations(): Promise<void> {
    try {
      const expiredCount = await storage.updateExpiredOptimizationRecommendations();
      console.log(`Cleaned up ${expiredCount} expired optimization recommendations`);
    } catch (error) {
      console.error('Error cleaning up expired recommendations:', error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days
      
      const deletedCount = await storage.deleteAutomatedActionLogsBefore(cutoffDate);
      console.log(`Cleaned up ${deletedCount} old automation logs`);
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
    }
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep last 90 days
      
      const deletedCount = await storage.deleteTestMetricsBefore(cutoffDate);
      console.log(`Cleaned up ${deletedCount} old test metrics`);
    } catch (error) {
      console.error('Error cleaning up old metrics:', error);
    }
  }

  private async logAutomationAction(salonId: string, actionType: string, actionData: any): Promise<void> {
    try {
      const logData: InsertAutomatedActionLog = {
        salonId,
        actionType,
        actionDescription: `Scheduled job: ${actionType}`,
        actionData,
        triggeredBy: 'system',
        status: 'completed'
      };
      await storage.createAutomatedActionLog(logData);
    } catch (error) {
      console.error('Error logging automation action:', error);
    }
  }

  // Public methods for manual job execution
  async runJobManually(jobType: string): Promise<void> {
    console.log(`Manually running job: ${jobType}`);
    
    switch (jobType) {
      case 'performance_collection':
        await this.runPerformanceCollectionJob();
        break;
      case 'winner_analysis':
        await this.runWinnerAnalysisJob();
        break;
      case 'campaign_optimization':
        await this.runCampaignOptimizationJob();
        break;
      case 'automated_reports':
        await this.runAutomatedReportsJob();
        break;
      case 'cleanup':
        await this.runCleanupJob();
        break;
      case 'rebooking_status_update':
        await this.runRebookingStatusUpdateJob();
        break;
      case 'rebooking_reminder_scheduling':
        await this.runRebookingReminderSchedulingJob();
        break;
      case 'rebooking_reminder_processing':
        await this.runRebookingReminderProcessingJob();
        break;
      case 'rebooking_weekly_optimization':
        await this.runWeeklyRebookingOptimizationJob();
        break;
      case 'no_show_detection':
        await this.runNoShowDetectionJob();
        break;
      case 'gift_card_expiry':
        await this.runGiftCardExpiryJob();
        break;
      case 'gift_card_delivery':
        await this.runGiftCardDeliveryJob();
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }

  // Get job status
  getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const [jobName, job] of this.jobs) {
      status[jobName] = job.running;
    }
    
    return status;
  }

  // Restart a specific job
  async restartJob(jobName: string): Promise<void> {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      job.start();
      console.log(`Restarted job: ${jobName}`);
    } else {
      throw new Error(`Job not found: ${jobName}`);
    }
  }
}

export const scheduledJobsService = new ScheduledJobsService();