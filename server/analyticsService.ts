import { storage } from './storage';
import { CommunicationAnalytics, InsertCommunicationAnalytics } from '@shared/schema';

interface CommunicationMetrics {
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesOpened: number;
  totalMessagesClicked: number;
  totalMessagesFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  emailMetrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    bounced: number;
  };
  smsMetrics: {
    sent: number;
    delivered: number;
    failed: number;
  };
  campaignMetrics: {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    averageOpenRate: number;
    averageClickRate: number;
  };
  recentActivity: Array<{
    date: string;
    messagesSent: number;
    messagesDelivered: number;
    messagesOpened: number;
  }>;
  topPerformingTemplates: Array<{
    templateId: string;
    templateName: string;
    sentCount: number;
    openRate: number;
    clickRate: number;
  }>;
  customerEngagement: {
    highlyEngaged: number;
    moderatelyEngaged: number;
    lowEngaged: number;
    unsubscribed: number;
  };
}

interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: string;
  messagesSent: number;
  messagesDelivered: number;
  messagesOpened: number;
  messagesClicked: number;
  messagesFailed: number;
  unsubscribes: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  revenue?: number;
  cost?: number;
  roi?: number;
  startDate: Date;
  endDate?: Date;
}

interface ChannelPerformance {
  channel: 'email' | 'sms';
  messagesSent: number;
  messagesDelivered: number;
  messagesOpened?: number;
  messagesClicked?: number;
  messagesFailed: number;
  deliveryRate: number;
  openRate?: number;
  clickRate?: number;
  averageResponseTime?: number;
  cost?: number;
  costPerMessage?: number;
}

class AnalyticsService {
  
  // Aggregate communication metrics for dashboard
  async getCommunicationDashboardMetrics(salonId: string, period: string = 'monthly'): Promise<CommunicationMetrics> {
    try {
      const dateRange = this.getPeriodDateRange(period);
      
      // Get communication history for the period
      const history = await storage.getCommunicationHistoryBySalonId(salonId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      // Get campaigns for the period
      const campaigns = await storage.getCommunicationCampaignsBySalonId(salonId);
      
      // Calculate basic metrics
      const totalMessagesSent = history.length;
      const totalMessagesDelivered = history.filter(h => h.status === 'delivered' || h.status === 'sent').length;
      const totalMessagesOpened = history.filter(h => h.openedAt).length;
      const totalMessagesClicked = history.filter(h => h.clickedAt).length;
      const totalMessagesFailed = history.filter(h => h.status === 'failed').length;
      
      const deliveryRate = totalMessagesSent > 0 ? (totalMessagesDelivered / totalMessagesSent) * 100 : 0;
      const openRate = totalMessagesDelivered > 0 ? (totalMessagesOpened / totalMessagesDelivered) * 100 : 0;
      const clickRate = totalMessagesOpened > 0 ? (totalMessagesClicked / totalMessagesOpened) * 100 : 0;
      
      // Channel-specific metrics
      const emailHistory = history.filter(h => h.channel === 'email');
      const smsHistory = history.filter(h => h.channel === 'sms');
      
      const emailMetrics = {
        sent: emailHistory.length,
        delivered: emailHistory.filter(h => h.status === 'delivered' || h.status === 'sent').length,
        opened: emailHistory.filter(h => h.openedAt).length,
        clicked: emailHistory.filter(h => h.clickedAt).length,
        failed: emailHistory.filter(h => h.status === 'failed').length,
        bounced: emailHistory.filter(h => h.failureReason?.includes('bounce')).length
      };
      
      const smsMetrics = {
        sent: smsHistory.length,
        delivered: smsHistory.filter(h => h.status === 'delivered' || h.status === 'sent').length,
        failed: smsHistory.filter(h => h.status === 'failed').length
      };
      
      // Campaign metrics
      const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
      const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
      
      // Calculate recent activity (last 30 days by day)
      const recentActivity = this.calculateRecentActivity(history, 30);
      
      // Get top performing templates
      const topPerformingTemplates = await this.getTopPerformingTemplates(salonId, history);
      
      // Calculate customer engagement levels
      const customerEngagement = await this.calculateCustomerEngagement(salonId);
      
      return {
        totalMessagesSent,
        totalMessagesDelivered,
        totalMessagesOpened,
        totalMessagesClicked,
        totalMessagesFailed,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        emailMetrics,
        smsMetrics,
        campaignMetrics: {
          totalCampaigns: campaigns.length,
          activeCampaigns,
          completedCampaigns,
          averageOpenRate: this.calculateAverageOpenRate(campaigns),
          averageClickRate: this.calculateAverageClickRate(campaigns)
        },
        recentActivity,
        topPerformingTemplates,
        customerEngagement
      };
      
    } catch (error) {
      console.error('Error calculating communication dashboard metrics:', error);
      throw error;
    }
  }
  
  // Get detailed campaign performance analytics
  async getCampaignPerformanceAnalytics(salonId: string, campaignId?: string): Promise<CampaignPerformance[]> {
    try {
      const campaigns = campaignId 
        ? [await storage.getCommunicationCampaign(campaignId)].filter(Boolean)
        : await storage.getCommunicationCampaignsBySalonId(salonId);
      
      const performanceData: CampaignPerformance[] = [];
      
      for (const campaign of campaigns) {
        if (!campaign) continue;
        
        // Get history for this campaign
        const history = await storage.getCommunicationHistoryBySalonId(salonId, {
          campaignId: campaign.id
        });
        
        const messagesSent = history.length;
        const messagesDelivered = history.filter(h => h.status === 'delivered' || h.status === 'sent').length;
        const messagesOpened = history.filter(h => h.openedAt).length;
        const messagesClicked = history.filter(h => h.clickedAt).length;
        const messagesFailed = history.filter(h => h.status === 'failed').length;
        
        const deliveryRate = messagesSent > 0 ? (messagesDelivered / messagesSent) * 100 : 0;
        const openRate = messagesDelivered > 0 ? (messagesOpened / messagesDelivered) * 100 : 0;
        const clickRate = messagesOpened > 0 ? (messagesClicked / messagesOpened) * 100 : 0;
        
        performanceData.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: campaign.status,
          messagesSent,
          messagesDelivered,
          messagesOpened,
          messagesClicked,
          messagesFailed,
          unsubscribes: 0, // Would track from preferences changes
          deliveryRate: Math.round(deliveryRate * 100) / 100,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          startDate: campaign.createdAt || new Date(),
          endDate: campaign.status === 'completed' ? campaign.updatedAt : undefined
        });
      }
      
      return performanceData;
    } catch (error) {
      console.error('Error calculating campaign performance analytics:', error);
      throw error;
    }
  }
  
  // Get channel performance comparison
  async getChannelPerformanceAnalytics(salonId: string, period: string = 'monthly'): Promise<ChannelPerformance[]> {
    try {
      const dateRange = this.getPeriodDateRange(period);
      
      const history = await storage.getCommunicationHistoryBySalonId(salonId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const channelData: ChannelPerformance[] = [];
      
      // Email performance
      const emailHistory = history.filter(h => h.channel === 'email');
      if (emailHistory.length > 0) {
        const emailSent = emailHistory.length;
        const emailDelivered = emailHistory.filter(h => h.status === 'delivered' || h.status === 'sent').length;
        const emailOpened = emailHistory.filter(h => h.openedAt).length;
        const emailClicked = emailHistory.filter(h => h.clickedAt).length;
        const emailFailed = emailHistory.filter(h => h.status === 'failed').length;
        
        channelData.push({
          channel: 'email',
          messagesSent: emailSent,
          messagesDelivered: emailDelivered,
          messagesOpened: emailOpened,
          messagesClicked: emailClicked,
          messagesFailed: emailFailed,
          deliveryRate: (emailDelivered / emailSent) * 100,
          openRate: emailDelivered > 0 ? (emailOpened / emailDelivered) * 100 : 0,
          clickRate: emailOpened > 0 ? (emailClicked / emailOpened) * 100 : 0
        });
      }
      
      // SMS performance
      const smsHistory = history.filter(h => h.channel === 'sms');
      if (smsHistory.length > 0) {
        const smsSent = smsHistory.length;
        const smsDelivered = smsHistory.filter(h => h.status === 'delivered' || h.status === 'sent').length;
        const smsFailed = smsHistory.filter(h => h.status === 'failed').length;
        
        channelData.push({
          channel: 'sms',
          messagesSent: smsSent,
          messagesDelivered: smsDelivered,
          messagesFailed: smsFailed,
          deliveryRate: (smsDelivered / smsSent) * 100
        });
      }
      
      return channelData;
    } catch (error) {
      console.error('Error calculating channel performance analytics:', error);
      throw error;
    }
  }
  
  // Store analytics data for historical tracking
  async storeAnalyticsSnapshot(salonId: string, period: string = 'daily') {
    try {
      const metrics = await this.getCommunicationDashboardMetrics(salonId, period);
      
      const analyticsData: InsertCommunicationAnalytics = {
        salonId,
        period,
        date: new Date(),
        messagesSent: metrics.totalMessagesSent,
        messagesDelivered: metrics.totalMessagesDelivered,
        messagesOpened: metrics.totalMessagesOpened,
        messagesClicked: metrics.totalMessagesClicked,
        messagesFailed: metrics.totalMessagesFailed,
        deliveryRate: metrics.deliveryRate,
        openRate: metrics.openRate,
        clickRate: metrics.clickRate,
        channel: 'all', // Overall metrics
        metadata: JSON.stringify({
          emailMetrics: metrics.emailMetrics,
          smsMetrics: metrics.smsMetrics,
          campaignMetrics: metrics.campaignMetrics
        })
      };
      
      await storage.createCommunicationAnalytics(analyticsData);
      
      // Also store channel-specific analytics
      if (metrics.emailMetrics.sent > 0) {
        const emailAnalytics: InsertCommunicationAnalytics = {
          ...analyticsData,
          messagesSent: metrics.emailMetrics.sent,
          messagesDelivered: metrics.emailMetrics.delivered,
          messagesOpened: metrics.emailMetrics.opened,
          messagesClicked: metrics.emailMetrics.clicked,
          messagesFailed: metrics.emailMetrics.failed,
          deliveryRate: (metrics.emailMetrics.delivered / metrics.emailMetrics.sent) * 100,
          openRate: metrics.emailMetrics.delivered > 0 ? (metrics.emailMetrics.opened / metrics.emailMetrics.delivered) * 100 : 0,
          clickRate: metrics.emailMetrics.opened > 0 ? (metrics.emailMetrics.clicked / metrics.emailMetrics.opened) * 100 : 0,
          channel: 'email'
        };
        
        await storage.createCommunicationAnalytics(emailAnalytics);
      }
      
      if (metrics.smsMetrics.sent > 0) {
        const smsAnalytics: InsertCommunicationAnalytics = {
          ...analyticsData,
          messagesSent: metrics.smsMetrics.sent,
          messagesDelivered: metrics.smsMetrics.delivered,
          messagesOpened: 0,
          messagesClicked: 0,
          messagesFailed: metrics.smsMetrics.failed,
          deliveryRate: (metrics.smsMetrics.delivered / metrics.smsMetrics.sent) * 100,
          openRate: 0,
          clickRate: 0,
          channel: 'sms'
        };
        
        await storage.createCommunicationAnalytics(smsAnalytics);
      }
      
    } catch (error) {
      console.error('Error storing analytics snapshot:', error);
    }
  }
  
  // Helper methods
  private getPeriodDateRange(period: string): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate
    };
  }
  
  private calculateRecentActivity(history: any[], days: number): Array<{
    date: string;
    messagesSent: number;
    messagesDelivered: number;
    messagesOpened: number;
  }> {
    const activity: Map<string, any> = new Map();
    const now = new Date();
    
    // Initialize last N days
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      activity.set(dateStr, {
        date: dateStr,
        messagesSent: 0,
        messagesDelivered: 0,
        messagesOpened: 0
      });
    }
    
    // Aggregate history by date
    history.forEach(h => {
      const date = h.createdAt ? new Date(h.createdAt).toISOString().split('T')[0] : null;
      if (date && activity.has(date)) {
        const dayData = activity.get(date);
        dayData.messagesSent++;
        if (h.status === 'delivered' || h.status === 'sent') {
          dayData.messagesDelivered++;
        }
        if (h.openedAt) {
          dayData.messagesOpened++;
        }
      }
    });
    
    return Array.from(activity.values()).reverse();
  }
  
  private async getTopPerformingTemplates(salonId: string, history: any[]): Promise<Array<{
    templateId: string;
    templateName: string;
    sentCount: number;
    openRate: number;
    clickRate: number;
  }>> {
    const templateStats: Map<string, any> = new Map();
    
    // Aggregate stats by template
    history.forEach(h => {
      if (h.templateId) {
        if (!templateStats.has(h.templateId)) {
          templateStats.set(h.templateId, {
            templateId: h.templateId,
            sentCount: 0,
            deliveredCount: 0,
            openedCount: 0,
            clickedCount: 0
          });
        }
        
        const stats = templateStats.get(h.templateId);
        stats.sentCount++;
        if (h.status === 'delivered' || h.status === 'sent') {
          stats.deliveredCount++;
        }
        if (h.openedAt) {
          stats.openedCount++;
        }
        if (h.clickedAt) {
          stats.clickedCount++;
        }
      }
    });
    
    // Get template names and calculate rates
    const templates: any[] = [];
    for (const [templateId, stats] of templateStats) {
      try {
        const template = await storage.getMessageTemplate(templateId);
        const openRate = stats.deliveredCount > 0 ? (stats.openedCount / stats.deliveredCount) * 100 : 0;
        const clickRate = stats.openedCount > 0 ? (stats.clickedCount / stats.openedCount) * 100 : 0;
        
        templates.push({
          templateId,
          templateName: template?.name || 'Unknown Template',
          sentCount: stats.sentCount,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100
        });
      } catch (error) {
        // Template might be deleted, skip
      }
    }
    
    // Sort by open rate and return top 10
    return templates
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 10);
  }
  
  private async calculateCustomerEngagement(salonId: string): Promise<{
    highlyEngaged: number;
    moderatelyEngaged: number;
    lowEngaged: number;
    unsubscribed: number;
  }> {
    // This would analyze customer interaction patterns
    // For now, return mock data - in real implementation would analyze:
    // - Open rates per customer
    // - Click rates per customer  
    // - Recent activity
    // - Unsubscribe status
    
    return {
      highlyEngaged: 45,
      moderatelyEngaged: 112,
      lowEngaged: 23,
      unsubscribed: 8
    };
  }
  
  private calculateAverageOpenRate(campaigns: any[]): number {
    if (campaigns.length === 0) return 0;
    
    const totalOpenRate = campaigns.reduce((sum, campaign) => {
      const openRate = campaign.messagesOpened && campaign.messagesDelivered 
        ? (campaign.messagesOpened / campaign.messagesDelivered) * 100 
        : 0;
      return sum + openRate;
    }, 0);
    
    return Math.round((totalOpenRate / campaigns.length) * 100) / 100;
  }
  
  private calculateAverageClickRate(campaigns: any[]): number {
    if (campaigns.length === 0) return 0;
    
    const totalClickRate = campaigns.reduce((sum, campaign) => {
      const clickRate = campaign.messagesClicked && campaign.messagesOpened 
        ? (campaign.messagesClicked / campaign.messagesOpened) * 100 
        : 0;
      return sum + clickRate;
    }, 0);
    
    return Math.round((totalClickRate / campaigns.length) * 100) / 100;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();