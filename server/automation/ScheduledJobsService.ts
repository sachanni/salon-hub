import * as cron from 'node-cron';
import { variantGenerationService } from './VariantGenerationService';
import { performanceMonitoringService } from './PerformanceMonitoringService';
import { winnerSelectionService } from './WinnerSelectionService';
import { campaignOptimizationService } from './CampaignOptimizationService';
import { communicationService } from '../communicationService';
import { storage } from '../storage';
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

    // Store job references
    this.jobs.set('performance_collection', performanceJob);
    this.jobs.set('winner_analysis', winnerAnalysisJob);
    this.jobs.set('campaign_optimization', optimizationJob);
    this.jobs.set('automated_reports', reportsJob);
    this.jobs.set('cleanup', cleanupJob);

    // Start all jobs
    performanceJob.start();
    winnerAnalysisJob.start();
    optimizationJob.start();
    reportsJob.start();
    cleanupJob.start();

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