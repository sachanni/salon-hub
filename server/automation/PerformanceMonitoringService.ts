import { storage } from '../storage';
import { communicationService } from '../communicationService';
import type { 
  AbTestCampaign,
  TestVariant,
  TestMetric,
  PerformanceMonitoringSetting,
  AutomationConfiguration,
  InsertTestMetric,
  InsertAutomatedActionLog
} from '@shared/schema';

export interface PerformanceAlert {
  alertType: 'significant_change' | 'early_winner' | 'performance_drop' | 'test_complete';
  message: string;
  data: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction?: string;
}

export interface VariantPerformance {
  variantId: string;
  variantName: string;
  metrics: {
    sentCount: number;
    deliveredCount: number;
    openCount: number;
    clickCount: number;
    conversionCount: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  confidence: number;
  statisticalSignificance?: number;
}

class PerformanceMonitoringService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastAlertTimes: Map<string, Date> = new Map();

  // Start monitoring for a specific test campaign
  async startMonitoring(testCampaignId: string): Promise<void> {
    try {
      const campaign = await storage.getAbTestCampaign(testCampaignId);
      if (!campaign) {
        throw new Error('Test campaign not found');
      }

      const config = await this.getAutomationConfig(campaign.salonId);
      if (!config?.enablePerformanceMonitoring) {
        console.log(`Performance monitoring disabled for salon ${campaign.salonId}`);
        return;
      }

      const monitoringSettings = await this.getMonitoringSettings(campaign.salonId);
      
      // Start monitoring interval
      const intervalMs = (config.monitoringIntervalMinutes || 15) * 60 * 1000;
      const interval = setInterval(async () => {
        await this.performMonitoringCheck(testCampaignId);
      }, intervalMs);

      this.monitoringIntervals.set(testCampaignId, interval);
      
      console.log(`Started performance monitoring for test campaign ${testCampaignId}`);
      
      // Log the automation action
      await this.logAutomationAction(campaign.salonId, testCampaignId, 'monitoring_started', {
        intervalMinutes: config.monitoringIntervalMinutes,
        enabledSettings: monitoringSettings.map(s => s.monitoringName)
      });
      
    } catch (error) {
      console.error('Error starting performance monitoring:', error);
      throw error;
    }
  }

  // Stop monitoring for a specific test campaign
  async stopMonitoring(testCampaignId: string): Promise<void> {
    const interval = this.monitoringIntervals.get(testCampaignId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(testCampaignId);
      console.log(`Stopped performance monitoring for test campaign ${testCampaignId}`);
    }
  }

  // Perform a single monitoring check
  async performMonitoringCheck(testCampaignId: string): Promise<PerformanceAlert[]> {
    try {
      const campaign = await storage.getAbTestCampaign(testCampaignId);
      if (!campaign) {
        throw new Error('Test campaign not found');
      }

      // Collect latest metrics from providers
      await this.collectMetricsFromProviders(testCampaignId);
      
      // Get current performance data
      const variantPerformances = await this.getVariantPerformances(testCampaignId);
      
      // Analyze performance and generate alerts
      const alerts = await this.analyzePerformance(campaign, variantPerformances);
      
      // Send alerts if any
      if (alerts.length > 0) {
        await this.sendAlerts(campaign.salonId, alerts);
      }

      // Update monitoring timestamp
      await this.updateMonitoringTimestamp(campaign.salonId);
      
      return alerts;
      
    } catch (error) {
      console.error('Error performing monitoring check:', error);
      return [];
    }
  }

  // Collect metrics from email/SMS providers
  async collectMetricsFromProviders(testCampaignId: string): Promise<void> {
    try {
      const variants = await storage.getTestVariantsByTestId(testCampaignId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const variant of variants) {
        // Get communication history for this variant
        const history = await storage.getCommunicationHistoryByVariantId(variant.id);
        
        // Calculate metrics from communication history
        const metrics = this.calculateMetricsFromHistory(history);
        
        // Check if we already have metrics for today
        const existingMetric = await storage.getTestMetricByVariantAndDate(variant.id, today);
        
        if (existingMetric) {
          // Update existing metric
          await storage.updateTestMetric(existingMetric.id, metrics);
        } else {
          // Create new metric record
          const metricData: InsertTestMetric = {
            testCampaignId,
            variantId: variant.id,
            metricDate: today,
            ...metrics
          };
          await storage.createTestMetric(metricData);
        }
      }
      
    } catch (error) {
      console.error('Error collecting metrics from providers:', error);
    }
  }

  // Calculate metrics from communication history
  private calculateMetricsFromHistory(history: any[]): Partial<InsertTestMetric> {
    const totalSent = history.length;
    const delivered = history.filter(h => h.status === 'delivered' || h.status === 'sent');
    const opened = history.filter(h => h.openedAt);
    const clicked = history.filter(h => h.clickedAt);
    const bounced = history.filter(h => h.status === 'failed' && h.failureReason?.includes('bounce'));
    
    // For salon context, conversions could be bookings made after clicking
    const conversions = history.filter(h => h.bookingId); // Messages that led to bookings
    
    return {
      sentCount: totalSent,
      deliveredCount: delivered.length,
      openCount: opened.length,
      clickCount: clicked.length,
      conversionCount: conversions.length,
      bounceCount: bounced.length,
      participantCount: new Set(history.map(h => h.customerId)).size // Unique customers
    };
  }

  // Get performance data for all variants in a test
  private async getVariantPerformances(testCampaignId: string): Promise<VariantPerformance[]> {
    const variants = await storage.getTestVariantsByTestId(testCampaignId);
    const performances: VariantPerformance[] = [];

    for (const variant of variants) {
      const metrics = await storage.getTestMetricsByVariantId(variant.id);
      const aggregatedMetrics = this.aggregateMetrics(metrics);
      
      const performance: VariantPerformance = {
        variantId: variant.id,
        variantName: variant.variantName,
        metrics: {
          sentCount: aggregatedMetrics.sentCount,
          deliveredCount: aggregatedMetrics.deliveredCount,
          openCount: aggregatedMetrics.openCount,
          clickCount: aggregatedMetrics.clickCount,
          conversionCount: aggregatedMetrics.conversionCount,
          openRate: aggregatedMetrics.deliveredCount > 0 ? 
            (aggregatedMetrics.openCount / aggregatedMetrics.deliveredCount) * 100 : 0,
          clickRate: aggregatedMetrics.deliveredCount > 0 ? 
            (aggregatedMetrics.clickCount / aggregatedMetrics.deliveredCount) * 100 : 0,
          conversionRate: aggregatedMetrics.deliveredCount > 0 ? 
            (aggregatedMetrics.conversionCount / aggregatedMetrics.deliveredCount) * 100 : 0
        },
        confidence: this.calculateConfidence(aggregatedMetrics.sentCount)
      };

      performances.push(performance);
    }

    return performances;
  }

  // Aggregate metrics across multiple time periods
  private aggregateMetrics(metrics: any[]): any {
    return metrics.reduce((sum, metric) => ({
      sentCount: sum.sentCount + metric.sentCount,
      deliveredCount: sum.deliveredCount + metric.deliveredCount,
      openCount: sum.openCount + metric.openCount,
      clickCount: sum.clickCount + metric.clickCount,
      conversionCount: sum.conversionCount + metric.conversionCount,
      bounceCount: sum.bounceCount + metric.bounceCount,
      participantCount: Math.max(sum.participantCount, metric.participantCount)
    }), {
      sentCount: 0,
      deliveredCount: 0,
      openCount: 0,
      clickCount: 0,
      conversionCount: 0,
      bounceCount: 0,
      participantCount: 0
    });
  }

  // Analyze performance and generate alerts
  private async analyzePerformance(
    campaign: AbTestCampaign, 
    performances: VariantPerformance[]
  ): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = [];
    
    if (performances.length < 2) {
      return alerts; // Need at least 2 variants to compare
    }

    const config = await this.getAutomationConfig(campaign.salonId);
    if (!config) return alerts;

    // Check for early winner detection
    const earlyWinner = await this.detectEarlyWinner(performances, config);
    if (earlyWinner) {
      alerts.push(earlyWinner);
    }

    // Check for significant performance changes
    const performanceChange = await this.detectPerformanceChanges(campaign, performances, config);
    if (performanceChange) {
      alerts.push(performanceChange);
    }

    // Check for performance drops
    const performanceDrop = this.detectPerformanceDrops(performances);
    if (performanceDrop) {
      alerts.push(performanceDrop);
    }

    // Check if test should be completed
    const testCompletion = await this.checkTestCompletion(campaign, performances, config);
    if (testCompletion) {
      alerts.push(testCompletion);
    }

    return alerts;
  }

  // Detect early winner with statistical significance
  private async detectEarlyWinner(
    performances: VariantPerformance[], 
    config: AutomationConfiguration
  ): Promise<PerformanceAlert | null> {
    // Find control variant (usually the first one)
    const control = performances.find(p => p.variantName.toLowerCase().includes('control')) || performances[0];
    const variants = performances.filter(p => p.variantId !== control.variantId);

    for (const variant of variants) {
      const significance = this.calculateStatisticalSignificance(control, variant);
      variant.statisticalSignificance = significance;

      // Check if we have early winner
      if (significance >= (config.autoWinnerConfidenceLevel / 100) && 
          variant.metrics.sentCount >= config.minimumSampleSize) {
        
        const improvement = ((variant.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100;
        
        if (improvement > 10) { // At least 10% improvement
          return {
            alertType: 'early_winner',
            message: `Early winner detected: ${variant.variantName} is performing ${improvement.toFixed(1)}% better than control`,
            data: {
              winnerVariantId: variant.variantId,
              winnerVariantName: variant.variantName,
              improvement: improvement,
              significance: significance,
              controlRate: control.metrics.conversionRate,
              variantRate: variant.metrics.conversionRate
            },
            severity: 'high',
            recommendedAction: config.enableAutoWinnerSelection ? 
              'Auto-winner selection will be triggered' : 
              'Consider manually selecting this variant as the winner'
          };
        }
      }
    }

    return null;
  }

  // Calculate statistical significance using simplified z-test
  private calculateStatisticalSignificance(control: VariantPerformance, variant: VariantPerformance): number {
    const n1 = control.metrics.deliveredCount;
    const n2 = variant.metrics.deliveredCount;
    const p1 = control.metrics.conversionRate / 100;
    const p2 = variant.metrics.conversionRate / 100;

    if (n1 < 30 || n2 < 30) return 0; // Not enough sample size

    const pPooled = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
    
    if (se === 0) return 0;
    
    const zScore = Math.abs(p2 - p1) / se;
    
    // Convert z-score to confidence level (simplified)
    if (zScore >= 2.58) return 0.99; // 99% confidence
    if (zScore >= 1.96) return 0.95; // 95% confidence
    if (zScore >= 1.65) return 0.90; // 90% confidence
    
    return Math.max(0.5, 1 - (1 / (1 + Math.exp(zScore - 1.96)))); // Sigmoid approximation
  }

  // Detect significant performance changes
  private async detectPerformanceChanges(
    campaign: AbTestCampaign,
    performances: VariantPerformance[],
    config: AutomationConfiguration
  ): Promise<PerformanceAlert | null> {
    // Get historical performance to compare against
    const threshold = config.performanceAlertThreshold || 0.05; // 5% change threshold
    
    // This is simplified - would need historical data comparison
    const bestPerformer = performances.reduce((best, current) => 
      current.metrics.conversionRate > best.metrics.conversionRate ? current : best
    );

    const worstPerformer = performances.reduce((worst, current) => 
      current.metrics.conversionRate < worst.metrics.conversionRate ? current : worst
    );

    const performanceDiff = bestPerformer.metrics.conversionRate - worstPerformer.metrics.conversionRate;
    
    if (performanceDiff > threshold * 100) {
      return {
        alertType: 'significant_change',
        message: `Significant performance difference detected: ${performanceDiff.toFixed(1)}% gap between best and worst performing variants`,
        data: {
          bestVariantId: bestPerformer.variantId,
          worstVariantId: worstPerformer.variantId,
          performanceDiff: performanceDiff
        },
        severity: 'medium',
        recommendedAction: 'Consider analyzing variant differences to understand performance drivers'
      };
    }

    return null;
  }

  // Detect performance drops
  private detectPerformanceDrops(performances: VariantPerformance[]): PerformanceAlert | null {
    const poorPerformers = performances.filter(p => p.metrics.conversionRate < 1.0); // Less than 1% conversion
    
    if (poorPerformers.length > 0) {
      return {
        alertType: 'performance_drop',
        message: `${poorPerformers.length} variant(s) showing poor performance (< 1% conversion rate)`,
        data: {
          poorPerformers: poorPerformers.map(p => ({
            variantId: p.variantId,
            variantName: p.variantName,
            conversionRate: p.metrics.conversionRate
          }))
        },
        severity: 'medium',
        recommendedAction: 'Review variant configuration and consider pausing underperforming variants'
      };
    }

    return null;
  }

  // Check if test should be completed
  private async checkTestCompletion(
    campaign: AbTestCampaign,
    performances: VariantPerformance[],
    config: AutomationConfiguration
  ): Promise<PerformanceAlert | null> {
    // Check if minimum test duration has passed
    const testDurationHours = (Date.now() - new Date(campaign.startedAt || campaign.createdAt).getTime()) / (1000 * 60 * 60);
    
    if (testDurationHours < config.minimumTestDurationHours) {
      return null; // Test hasn't run long enough
    }

    // Check if we have sufficient sample size
    const totalSamples = performances.reduce((sum, p) => sum + p.metrics.sentCount, 0);
    
    if (totalSamples >= config.minimumSampleSize * performances.length) {
      return {
        alertType: 'test_complete',
        message: `Test has reached sufficient duration (${testDurationHours.toFixed(1)} hours) and sample size (${totalSamples} total samples)`,
        data: {
          testDurationHours: testDurationHours,
          totalSamples: totalSamples,
          requiredSamples: config.minimumSampleSize * performances.length
        },
        severity: 'low',
        recommendedAction: 'Consider completing the test and selecting a winner'
      };
    }

    return null;
  }

  // Send alerts to salon owners
  private async sendAlerts(salonId: string, alerts: PerformanceAlert[]): Promise<void> {
    try {
      const salon = await storage.getSalon(salonId);
      if (!salon) return;

      const monitoringSettings = await this.getMonitoringSettings(salonId);
      const activeSettings = monitoringSettings.filter(s => s.isActive);

      for (const setting of activeSettings) {
        // Check alert cooldown
        const lastAlertKey = `${salonId}-${setting.id}`;
        const lastAlert = this.lastAlertTimes.get(lastAlertKey);
        const cooldownMs = (setting.alertCooldownMinutes || 60) * 60 * 1000;
        
        if (lastAlert && (Date.now() - lastAlert.getTime()) < cooldownMs) {
          continue; // Still in cooldown period
        }

        // Send alerts via configured channels
        for (const alert of alerts) {
          if (setting.enableEmailAlerts && setting.alertRecipients) {
            await this.sendEmailAlert(salon, alert, setting.alertRecipients as string[]);
          }
          
          if (setting.enableSmsAlerts && setting.alertRecipients) {
            await this.sendSmsAlert(salon, alert, setting.alertRecipients as string[]);
          }
        }

        // Update last alert time
        this.lastAlertTimes.set(lastAlertKey, new Date());
      }
      
    } catch (error) {
      console.error('Error sending alerts:', error);
    }
  }

  // Send email alert
  private async sendEmailAlert(salon: any, alert: PerformanceAlert, recipients: string[]): Promise<void> {
    for (const email of recipients) {
      await communicationService.sendMessage({
        to: email,
        channel: 'email',
        type: 'transactional',
        salonId: salon.id,
        customContent: {
          subject: `A/B Test Alert: ${alert.alertType.replace('_', ' ')}`,
          body: `
Hello,

We have an important update about your A/B test campaign:

${alert.message}

Severity: ${alert.severity.toUpperCase()}

${alert.recommendedAction ? `Recommended Action: ${alert.recommendedAction}` : ''}

You can view detailed results in your dashboard.

Best regards,
${salon.name} Automation System
          `
        }
      });
    }
  }

  // Send SMS alert
  private async sendSmsAlert(salon: any, alert: PerformanceAlert, recipients: string[]): Promise<void> {
    const shortMessage = `A/B Test Alert: ${alert.message.substring(0, 100)}... View dashboard for details.`;
    
    for (const phone of recipients) {
      await communicationService.sendMessage({
        to: phone,
        channel: 'sms',
        type: 'transactional',
        salonId: salon.id,
        customContent: {
          body: shortMessage
        }
      });
    }
  }

  // Calculate confidence level based on sample size
  private calculateConfidence(sampleSize: number): number {
    if (sampleSize >= 1000) return 0.99;
    if (sampleSize >= 400) return 0.95;
    if (sampleSize >= 100) return 0.90;
    if (sampleSize >= 30) return 0.80;
    return 0.5;
  }

  // Utility methods
  private async getAutomationConfig(salonId: string): Promise<AutomationConfiguration | null> {
    try {
      return await storage.getAutomationConfigurationBySalonId(salonId);
    } catch (error) {
      console.error('Error fetching automation config:', error);
      return null;
    }
  }

  private async getMonitoringSettings(salonId: string): Promise<PerformanceMonitoringSetting[]> {
    try {
      return await storage.getPerformanceMonitoringSettingsBySalonId(salonId);
    } catch (error) {
      console.error('Error fetching monitoring settings:', error);
      return [];
    }
  }

  private async updateMonitoringTimestamp(salonId: string): Promise<void> {
    try {
      const settings = await this.getMonitoringSettings(salonId);
      for (const setting of settings) {
        await storage.updatePerformanceMonitoringSetting(setting.id, {
          lastMonitoredAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating monitoring timestamp:', error);
    }
  }

  private async logAutomationAction(salonId: string, testCampaignId: string, actionType: string, actionData: any): Promise<void> {
    try {
      const logData: InsertAutomatedActionLog = {
        salonId,
        testCampaignId,
        actionType,
        actionDescription: `Performance monitoring: ${actionType}`,
        actionData,
        triggeredBy: 'system',
        status: 'completed'
      };
      await storage.createAutomatedActionLog(logData);
    } catch (error) {
      console.error('Error logging automation action:', error);
    }
  }

  // Public methods for external integration
  async getRealtimePerformance(testCampaignId: string): Promise<VariantPerformance[]> {
    await this.collectMetricsFromProviders(testCampaignId);
    return this.getVariantPerformances(testCampaignId);
  }

  async forceMonitoringCheck(testCampaignId: string): Promise<PerformanceAlert[]> {
    return this.performMonitoringCheck(testCampaignId);
  }

  // Cleanup method to stop all monitoring
  async stopAllMonitoring(): Promise<void> {
    for (const [testCampaignId, interval] of this.monitoringIntervals) {
      clearInterval(interval);
      console.log(`Stopped monitoring for test campaign ${testCampaignId}`);
    }
    this.monitoringIntervals.clear();
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();