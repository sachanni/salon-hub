import { storage } from '../storage';
import { variantGenerationService } from './VariantGenerationService';
import { performanceMonitoringService } from './PerformanceMonitoringService';
import { winnerSelectionService } from './WinnerSelectionService';
import type { 
  CommunicationCampaign,
  AbTestCampaign,
  CustomerSegment,
  MessageTemplate,
  CommunicationHistory,
  InsertOptimizationRecommendation,
  OptimizationRecommendation,
  InsertCampaignOptimizationInsight,
  CampaignOptimizationInsight,
  AutomationConfiguration,
  InsertAutomatedActionLog
} from '@shared/schema';

export interface OptimizationContext {
  salonId: string;
  campaignId?: string;
  testCampaignId?: string;
  timeframe: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';
  optimizationTypes: ('send_time' | 'audience' | 'content' | 'frequency' | 'channel')[];
}

export interface SendTimeOptimization {
  recommendedTime: string;
  expectedImprovement: number;
  confidence: number;
  rationale: string;
  supportingData: {
    hourlyEngagement: Record<string, number>;
    dayOfWeekEngagement: Record<string, number>;
    audienceTimeZone: string;
  };
}

export interface AudienceOptimization {
  recommendedSegments: string[];
  expectedImprovement: number;
  confidence: number;
  rationale: string;
  supportingData: {
    segmentPerformance: Record<string, any>;
    engagementPatterns: any;
    demographicInsights: any;
  };
}

export interface ContentOptimization {
  recommendedChanges: {
    subjectLine?: string;
    content?: string;
    callToAction?: string;
  };
  expectedImprovement: number;
  confidence: number;
  rationale: string;
  supportingData: {
    performingElements: string[];
    underperformingElements: string[];
    bestPractices: string[];
  };
}

export interface ChannelOptimization {
  recommendedChannel: 'email' | 'sms' | 'both';
  expectedImprovement: number;
  confidence: number;
  rationale: string;
  supportingData: {
    channelPerformance: Record<string, any>;
    audiencePreferences: any;
    costEffectiveness: any;
  };
}

export interface FrequencyOptimization {
  recommendedFrequency: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  expectedImprovement: number;
  confidence: number;
  rationale: string;
  supportingData: {
    engagementByFrequency: Record<string, number>;
    fatigueAnalysis: any;
    optimalTiming: any;
  };
}

class CampaignOptimizationService {

  // Main method to generate comprehensive optimization recommendations
  async generateOptimizations(context: OptimizationContext): Promise<OptimizationRecommendation[]> {
    try {
      const config = await this.getAutomationConfig(context.salonId);
      if (!config?.enableCampaignOptimization) {
        console.log('Campaign optimization is disabled for this salon');
        return [];
      }

      const recommendations: OptimizationRecommendation[] = [];
      
      // Generate recommendations for each requested optimization type
      for (const optimizationType of context.optimizationTypes) {
        try {
          const recommendation = await this.generateOptimizationByType(context, optimizationType);
          if (recommendation) {
            recommendations.push(recommendation);
          }
        } catch (error) {
          console.error(`Error generating ${optimizationType} optimization:`, error);
        }
      }

      // Sort recommendations by impact score and confidence
      recommendations.sort((a, b) => 
        (b.impactScore * b.confidenceScore) - (a.impactScore * a.confidenceScore)
      );

      // Log the optimization generation
      await this.logAutomationAction(context.salonId, 'optimization_generated', {
        recommendationCount: recommendations.length,
        optimizationTypes: context.optimizationTypes,
        timeframe: context.timeframe
      });

      return recommendations;
      
    } catch (error) {
      console.error('Error generating optimizations:', error);
      return [];
    }
  }

  // Generate optimization recommendation by type
  private async generateOptimizationByType(
    context: OptimizationContext, 
    type: string
  ): Promise<OptimizationRecommendation | null> {
    
    switch (type) {
      case 'send_time':
        return await this.generateSendTimeOptimization(context);
      case 'audience':
        return await this.generateAudienceOptimization(context);
      case 'content':
        return await this.generateContentOptimization(context);
      case 'channel':
        return await this.generateChannelOptimization(context);
      case 'frequency':
        return await this.generateFrequencyOptimization(context);
      default:
        return null;
    }
  }

  // Generate send time optimization
  private async generateSendTimeOptimization(context: OptimizationContext): Promise<OptimizationRecommendation | null> {
    try {
      const analysis = await this.analyzeSendTimePerformance(context);
      
      if (!analysis || analysis.confidence < 0.6) {
        return null; // Not enough data or low confidence
      }

      const recommendationData: InsertOptimizationRecommendation = {
        salonId: context.salonId,
        campaignId: context.campaignId || null,
        testCampaignId: context.testCampaignId || null,
        recommendationType: 'send_time',
        recommendationTitle: `Optimize Send Time for ${analysis.expectedImprovement.toFixed(1)}% Better Engagement`,
        recommendationDescription: `Send your campaigns at ${analysis.recommendedTime} to maximize engagement. ${analysis.rationale}`,
        confidenceScore: analysis.confidence,
        expectedImprovement: analysis.expectedImprovement / 100,
        impactScore: this.calculateImpactScore(analysis.expectedImprovement, 'send_time'),
        implementationData: {
          recommendedTime: analysis.recommendedTime,
          supportingData: analysis.supportingData,
          implementationSteps: [
            'Update campaign send time to recommended time',
            'Apply to all future campaigns',
            'Monitor performance for 2 weeks'
          ]
        },
        implementationComplexity: 'low',
        estimatedEffortHours: 0.25,
        modelVersion: 'send_time_v1.0',
        basedOnDataPoints: this.getDataPointCount(analysis.supportingData),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        priority: this.calculatePriority(analysis.expectedImprovement, analysis.confidence)
      };

      return await storage.createOptimizationRecommendation(recommendationData);
      
    } catch (error) {
      console.error('Error generating send time optimization:', error);
      return null;
    }
  }

  // Analyze send time performance patterns
  private async analyzeSendTimePerformance(context: OptimizationContext): Promise<SendTimeOptimization | null> {
    try {
      const dateRange = this.getDateRange(context.timeframe);
      const history = await storage.getCommunicationHistoryBySalonId(context.salonId, {
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      if (history.length < 50) {
        return null; // Not enough data
      }

      // Analyze engagement by hour and day of week
      const hourlyEngagement = this.calculateHourlyEngagement(history);
      const dayOfWeekEngagement = this.calculateDayOfWeekEngagement(history);
      
      // Find optimal send time
      const optimalHour = this.findOptimalHour(hourlyEngagement);
      const optimalDay = this.findOptimalDay(dayOfWeekEngagement);
      
      // Calculate expected improvement
      const currentAvgEngagement = this.calculateAverageEngagement(history);
      const optimalEngagement = hourlyEngagement[optimalHour] || currentAvgEngagement;
      const expectedImprovement = ((optimalEngagement - currentAvgEngagement) / currentAvgEngagement) * 100;
      
      if (expectedImprovement < 5) {
        return null; // Improvement too small to matter
      }

      return {
        recommendedTime: `${optimalHour}:00`,
        expectedImprovement,
        confidence: this.calculateSendTimeConfidence(history, hourlyEngagement),
        rationale: `Analysis of ${history.length} messages shows ${optimalHour}:00 has ${optimalEngagement.toFixed(1)}% engagement vs ${currentAvgEngagement.toFixed(1)}% average.`,
        supportingData: {
          hourlyEngagement,
          dayOfWeekEngagement,
          audienceTimeZone: 'UTC+05:30' // Assuming Indian timezone
        }
      };
      
    } catch (error) {
      console.error('Error analyzing send time performance:', error);
      return null;
    }
  }

  // Generate audience optimization
  private async generateAudienceOptimization(context: OptimizationContext): Promise<OptimizationRecommendation | null> {
    try {
      const analysis = await this.analyzeAudiencePerformance(context);
      
      if (!analysis || analysis.confidence < 0.6) {
        return null;
      }

      const recommendationData: InsertOptimizationRecommendation = {
        salonId: context.salonId,
        campaignId: context.campaignId || null,
        testCampaignId: context.testCampaignId || null,
        recommendationType: 'audience',
        recommendationTitle: `Target High-Performing Segments for ${analysis.expectedImprovement.toFixed(1)}% Better Results`,
        recommendationDescription: `Focus your campaigns on segments: ${analysis.recommendedSegments.join(', ')}. ${analysis.rationale}`,
        confidenceScore: analysis.confidence,
        expectedImprovement: analysis.expectedImprovement / 100,
        impactScore: this.calculateImpactScore(analysis.expectedImprovement, 'audience'),
        implementationData: {
          recommendedSegments: analysis.recommendedSegments,
          supportingData: analysis.supportingData,
          implementationSteps: [
            'Create refined audience segments',
            'Update campaign targeting',
            'Monitor segment performance'
          ]
        },
        implementationComplexity: 'medium',
        estimatedEffortHours: 1.0,
        modelVersion: 'audience_v1.0',
        basedOnDataPoints: this.getDataPointCount(analysis.supportingData),
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        priority: this.calculatePriority(analysis.expectedImprovement, analysis.confidence)
      };

      return await storage.createOptimizationRecommendation(recommendationData);
      
    } catch (error) {
      console.error('Error generating audience optimization:', error);
      return null;
    }
  }

  // Analyze audience performance patterns
  private async analyzeAudiencePerformance(context: OptimizationContext): Promise<AudienceOptimization | null> {
    try {
      const segments = await storage.getCustomerSegmentsBySalonId(context.salonId);
      const dateRange = this.getDateRange(context.timeframe);
      
      const segmentPerformance: Record<string, any> = {};
      
      for (const segment of segments) {
        const history = await storage.getCommunicationHistoryBySegment(segment.id, {
          startDate: dateRange.start,
          endDate: dateRange.end
        });
        
        if (history.length > 0) {
          segmentPerformance[segment.name] = {
            totalSent: history.length,
            engagement: this.calculateAverageEngagement(history),
            conversion: this.calculateConversionRate(history),
            segmentId: segment.id
          };
        }
      }
      
      // Find top performing segments
      const topSegments = Object.entries(segmentPerformance)
        .filter(([_, data]) => data.totalSent >= 10) // Minimum 10 messages
        .sort((a, b) => b[1].engagement - a[1].engagement)
        .slice(0, 3)
        .map(([name, _]) => name);
      
      if (topSegments.length === 0) {
        return null;
      }
      
      // Calculate expected improvement
      const avgPerformance = Object.values(segmentPerformance).reduce((sum: number, data: any) => sum + data.engagement, 0) / Object.keys(segmentPerformance).length;
      const topPerformance = topSegments.reduce((sum, name) => sum + segmentPerformance[name].engagement, 0) / topSegments.length;
      const expectedImprovement = ((topPerformance - avgPerformance) / avgPerformance) * 100;
      
      if (expectedImprovement < 5) {
        return null;
      }

      return {
        recommendedSegments: topSegments,
        expectedImprovement,
        confidence: topSegments.length >= 2 ? 0.8 : 0.6,
        rationale: `Top segments show ${topPerformance.toFixed(1)}% engagement vs ${avgPerformance.toFixed(1)}% average across all segments.`,
        supportingData: {
          segmentPerformance,
          engagementPatterns: this.analyzeEngagementPatterns(segmentPerformance),
          demographicInsights: this.analyzeDemographicInsights(segments, segmentPerformance)
        }
      };
      
    } catch (error) {
      console.error('Error analyzing audience performance:', error);
      return null;
    }
  }

  // Generate content optimization
  private async generateContentOptimization(context: OptimizationContext): Promise<OptimizationRecommendation | null> {
    try {
      const analysis = await this.analyzeContentPerformance(context);
      
      if (!analysis || analysis.confidence < 0.6) {
        return null;
      }

      const recommendationData: InsertOptimizationRecommendation = {
        salonId: context.salonId,
        campaignId: context.campaignId || null,
        testCampaignId: context.testCampaignId || null,
        recommendationType: 'content',
        recommendationTitle: `Optimize Content Elements for ${analysis.expectedImprovement.toFixed(1)}% Better Performance`,
        recommendationDescription: `Apply proven content improvements to boost engagement. ${analysis.rationale}`,
        confidenceScore: analysis.confidence,
        expectedImprovement: analysis.expectedImprovement / 100,
        impactScore: this.calculateImpactScore(analysis.expectedImprovement, 'content'),
        implementationData: {
          recommendedChanges: analysis.recommendedChanges,
          supportingData: analysis.supportingData,
          implementationSteps: [
            'Update template with recommended changes',
            'Test new content with A/B test',
            'Apply to future campaigns'
          ]
        },
        implementationComplexity: 'medium',
        estimatedEffortHours: 2.0,
        modelVersion: 'content_v1.0',
        basedOnDataPoints: this.getDataPointCount(analysis.supportingData),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        priority: this.calculatePriority(analysis.expectedImprovement, analysis.confidence)
      };

      return await storage.createOptimizationRecommendation(recommendationData);
      
    } catch (error) {
      console.error('Error generating content optimization:', error);
      return null;
    }
  }

  // Analyze content performance patterns
  private async analyzeContentPerformance(context: OptimizationContext): Promise<ContentOptimization | null> {
    try {
      const dateRange = this.getDateRange(context.timeframe);
      const templates = await storage.getMessageTemplatesBySalonId(context.salonId);
      
      const templatePerformance: any[] = [];
      
      for (const template of templates) {
        const history = await storage.getCommunicationHistoryByTemplateId(template.id, {
          startDate: dateRange.start,
          endDate: dateRange.end
        });
        
        if (history.length >= 5) { // Minimum 5 messages for analysis
          templatePerformance.push({
            template,
            engagement: this.calculateAverageEngagement(history),
            messageCount: history.length,
            subjectLength: template.subject?.length || 0,
            contentLength: template.content.length,
            hasEmojis: this.hasEmojis(template.subject || template.content),
            hasUrgency: this.hasUrgencyWords(template.subject || template.content),
            hasPersonalization: this.hasPersonalization(template.content)
          });
        }
      }
      
      if (templatePerformance.length < 3) {
        return null; // Not enough templates to analyze
      }
      
      // Analyze patterns
      const patterns = this.analyzeContentPatterns(templatePerformance);
      const recommendations = this.generateContentRecommendations(patterns);
      
      if (!recommendations) {
        return null;
      }
      
      return {
        recommendedChanges: recommendations.changes,
        expectedImprovement: recommendations.expectedImprovement,
        confidence: recommendations.confidence,
        rationale: recommendations.rationale,
        supportingData: {
          performingElements: patterns.performingElements,
          underperformingElements: patterns.underperformingElements,
          bestPractices: patterns.bestPractices
        }
      };
      
    } catch (error) {
      console.error('Error analyzing content performance:', error);
      return null;
    }
  }

  // Generate channel optimization
  private async generateChannelOptimization(context: OptimizationContext): Promise<OptimizationRecommendation | null> {
    try {
      const analysis = await this.analyzeChannelPerformance(context);
      
      if (!analysis || analysis.confidence < 0.6) {
        return null;
      }

      const recommendationData: InsertOptimizationRecommendation = {
        salonId: context.salonId,
        campaignId: context.campaignId || null,
        testCampaignId: context.testCampaignId || null,
        recommendationType: 'channel',
        recommendationTitle: `Optimize Channel Mix for ${analysis.expectedImprovement.toFixed(1)}% Better ROI`,
        recommendationDescription: `Focus on ${analysis.recommendedChannel} for better performance. ${analysis.rationale}`,
        confidenceScore: analysis.confidence,
        expectedImprovement: analysis.expectedImprovement / 100,
        impactScore: this.calculateImpactScore(analysis.expectedImprovement, 'channel'),
        implementationData: {
          recommendedChannel: analysis.recommendedChannel,
          supportingData: analysis.supportingData,
          implementationSteps: [
            'Adjust channel allocation',
            'Update campaign preferences',
            'Monitor channel performance'
          ]
        },
        implementationComplexity: 'low',
        estimatedEffortHours: 0.5,
        modelVersion: 'channel_v1.0',
        basedOnDataPoints: this.getDataPointCount(analysis.supportingData),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        priority: this.calculatePriority(analysis.expectedImprovement, analysis.confidence)
      };

      return await storage.createOptimizationRecommendation(recommendationData);
      
    } catch (error) {
      console.error('Error generating channel optimization:', error);
      return null;
    }
  }

  // Generate frequency optimization
  private async generateFrequencyOptimization(context: OptimizationContext): Promise<OptimizationRecommendation | null> {
    try {
      const analysis = await this.analyzeFrequencyPerformance(context);
      
      if (!analysis || analysis.confidence < 0.6) {
        return null;
      }

      const recommendationData: InsertOptimizationRecommendation = {
        salonId: context.salonId,
        campaignId: context.campaignId || null,
        testCampaignId: context.testCampaignId || null,
        recommendationType: 'frequency',
        recommendationTitle: `Optimize Send Frequency for ${analysis.expectedImprovement.toFixed(1)}% Better Engagement`,
        recommendationDescription: `Adjust communication frequency to reduce fatigue and improve engagement. ${analysis.rationale}`,
        confidenceScore: analysis.confidence,
        expectedImprovement: analysis.expectedImprovement / 100,
        impactScore: this.calculateImpactScore(analysis.expectedImprovement, 'frequency'),
        implementationData: {
          recommendedFrequency: analysis.recommendedFrequency,
          supportingData: analysis.supportingData,
          implementationSteps: [
            'Update campaign frequency settings',
            'Implement frequency capping',
            'Monitor engagement changes'
          ]
        },
        implementationComplexity: 'medium',
        estimatedEffortHours: 1.5,
        modelVersion: 'frequency_v1.0',
        basedOnDataPoints: this.getDataPointCount(analysis.supportingData),
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
        priority: this.calculatePriority(analysis.expectedImprovement, analysis.confidence)
      };

      return await storage.createOptimizationRecommendation(recommendationData);
      
    } catch (error) {
      console.error('Error generating frequency optimization:', error);
      return null;
    }
  }

  // Helper methods for various calculations and analyses
  private calculateHourlyEngagement(history: CommunicationHistory[]): Record<string, number> {
    const hourlyData: Record<string, { sent: number; engaged: number }> = {};
    
    for (const msg of history) {
      const hour = new Date(msg.createdAt).getHours().toString();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { sent: 0, engaged: 0 };
      }
      
      hourlyData[hour].sent++;
      if (msg.openedAt || msg.clickedAt) {
        hourlyData[hour].engaged++;
      }
    }
    
    const engagement: Record<string, number> = {};
    for (const [hour, data] of Object.entries(hourlyData)) {
      engagement[hour] = data.sent > 0 ? (data.engaged / data.sent) * 100 : 0;
    }
    
    return engagement;
  }

  private calculateDayOfWeekEngagement(history: CommunicationHistory[]): Record<string, number> {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyData: Record<string, { sent: number; engaged: number }> = {};
    
    for (const msg of history) {
      const day = dayNames[new Date(msg.createdAt).getDay()];
      if (!dailyData[day]) {
        dailyData[day] = { sent: 0, engaged: 0 };
      }
      
      dailyData[day].sent++;
      if (msg.openedAt || msg.clickedAt) {
        dailyData[day].engaged++;
      }
    }
    
    const engagement: Record<string, number> = {};
    for (const [day, data] of Object.entries(dailyData)) {
      engagement[day] = data.sent > 0 ? (data.engaged / data.sent) * 100 : 0;
    }
    
    return engagement;
  }

  private findOptimalHour(hourlyEngagement: Record<string, number>): number {
    let bestHour = 10; // Default 10 AM
    let bestEngagement = 0;
    
    for (const [hour, engagement] of Object.entries(hourlyEngagement)) {
      if (engagement > bestEngagement) {
        bestEngagement = engagement;
        bestHour = parseInt(hour);
      }
    }
    
    return bestHour;
  }

  private findOptimalDay(dayOfWeekEngagement: Record<string, number>): string {
    let bestDay = 'Tuesday';
    let bestEngagement = 0;
    
    for (const [day, engagement] of Object.entries(dayOfWeekEngagement)) {
      if (engagement > bestEngagement) {
        bestEngagement = engagement;
        bestDay = day;
      }
    }
    
    return bestDay;
  }

  private calculateAverageEngagement(history: CommunicationHistory[]): number {
    const engaged = history.filter(h => h.openedAt || h.clickedAt).length;
    return history.length > 0 ? (engaged / history.length) * 100 : 0;
  }

  private calculateConversionRate(history: CommunicationHistory[]): number {
    const conversions = history.filter(h => h.bookingId).length; // Messages that led to bookings
    return history.length > 0 ? (conversions / history.length) * 100 : 0;
  }

  private calculateSendTimeConfidence(history: CommunicationHistory[], hourlyEngagement: Record<string, number>): number {
    const dataPoints = Object.keys(hourlyEngagement).length;
    const sampleSize = history.length;
    
    if (sampleSize >= 200 && dataPoints >= 10) return 0.9;
    if (sampleSize >= 100 && dataPoints >= 8) return 0.8;
    if (sampleSize >= 50 && dataPoints >= 6) return 0.7;
    return 0.6;
  }

  private analyzeChannelPerformance(context: OptimizationContext): Promise<ChannelOptimization | null> {
    // Simplified implementation for channel analysis
    // Would analyze email vs SMS performance, cost, audience preferences
    return Promise.resolve(null);
  }

  private analyzeFrequencyPerformance(context: OptimizationContext): Promise<FrequencyOptimization | null> {
    // Simplified implementation for frequency analysis
    // Would analyze engagement fatigue, optimal frequency patterns
    return Promise.resolve(null);
  }

  private analyzeEngagementPatterns(segmentPerformance: Record<string, any>): any {
    // Simplified engagement pattern analysis
    return {
      highEngagementSegments: Object.entries(segmentPerformance)
        .filter(([_, data]) => data.engagement > 20)
        .map(([name, _]) => name),
      lowEngagementSegments: Object.entries(segmentPerformance)
        .filter(([_, data]) => data.engagement < 10)
        .map(([name, _]) => name)
    };
  }

  private analyzeDemographicInsights(segments: CustomerSegment[], performance: Record<string, any>): any {
    // Simplified demographic analysis
    return {
      insights: 'Demographic analysis would be implemented here',
      topDemographics: [],
      recommendations: []
    };
  }

  private analyzeContentPatterns(templatePerformance: any[]): any {
    const topPerformers = templatePerformance
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, Math.ceil(templatePerformance.length / 3));
    
    const bottomPerformers = templatePerformance
      .sort((a, b) => a.engagement - b.engagement)
      .slice(0, Math.ceil(templatePerformance.length / 3));
    
    return {
      performingElements: this.extractPerformingElements(topPerformers),
      underperformingElements: this.extractUnderperformingElements(bottomPerformers),
      bestPractices: this.generateBestPractices(topPerformers)
    };
  }

  private extractPerformingElements(topPerformers: any[]): string[] {
    const elements: string[] = [];
    
    const avgSubjectLength = topPerformers.reduce((sum, p) => sum + p.subjectLength, 0) / topPerformers.length;
    if (avgSubjectLength < 50) elements.push('Short subject lines');
    
    const emojiUsage = topPerformers.filter(p => p.hasEmojis).length / topPerformers.length;
    if (emojiUsage > 0.6) elements.push('Emoji usage');
    
    const urgencyUsage = topPerformers.filter(p => p.hasUrgency).length / topPerformers.length;
    if (urgencyUsage > 0.5) elements.push('Urgency language');
    
    return elements;
  }

  private extractUnderperformingElements(bottomPerformers: any[]): string[] {
    const elements: string[] = [];
    
    const avgSubjectLength = bottomPerformers.reduce((sum, p) => sum + p.subjectLength, 0) / bottomPerformers.length;
    if (avgSubjectLength > 60) elements.push('Long subject lines');
    
    const avgContentLength = bottomPerformers.reduce((sum, p) => sum + p.contentLength, 0) / bottomPerformers.length;
    if (avgContentLength > 500) elements.push('Lengthy content');
    
    return elements;
  }

  private generateBestPractices(topPerformers: any[]): string[] {
    return [
      'Keep subject lines under 50 characters',
      'Use emojis strategically',
      'Include urgency when appropriate',
      'Personalize content for audience',
      'Include clear call-to-action'
    ];
  }

  private generateContentRecommendations(patterns: any): any | null {
    if (patterns.performingElements.length === 0) {
      return null;
    }
    
    const changes: any = {};
    let expectedImprovement = 0;
    
    if (patterns.performingElements.includes('Short subject lines')) {
      changes.subjectLine = 'Shorten subject line to under 50 characters';
      expectedImprovement += 8;
    }
    
    if (patterns.performingElements.includes('Urgency language')) {
      changes.content = 'Add urgency elements to content';
      expectedImprovement += 12;
    }
    
    if (patterns.performingElements.includes('Emoji usage')) {
      changes.callToAction = 'Add relevant emojis to call-to-action';
      expectedImprovement += 6;
    }
    
    return {
      changes,
      expectedImprovement: Math.min(expectedImprovement, 25), // Cap at 25%
      confidence: 0.75,
      rationale: `Based on analysis of top-performing content patterns`
    };
  }

  private hasEmojis(text: string): boolean {
    const emojiRegex = /[\u{1F600}-\\u{1F64F}]|[\\u{1F300}-\\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\\u{1F1E0}-\\u{1F1FF}]/u;
    return emojiRegex.test(text);
  }

  private hasUrgencyWords(text: string): boolean {
    const urgencyWords = ['urgent', 'limited', 'hurry', 'act now', 'expires', 'deadline', 'last chance'];
    return urgencyWords.some(word => text.toLowerCase().includes(word));
  }

  private hasPersonalization(text: string): boolean {
    return text.includes('{{') && text.includes('}}');
  }

  private calculateImpactScore(expectedImprovement: number, type: string): number {
    // Weight different optimization types
    const typeWeights = {
      send_time: 0.7,
      content: 0.9,
      audience: 0.8,
      channel: 0.6,
      frequency: 0.75
    };
    
    const weight = typeWeights[type as keyof typeof typeWeights] || 0.7;
    return Math.min((expectedImprovement / 100) * weight, 1);
  }

  private calculatePriority(expectedImprovement: number, confidence: number): number {
    const score = (expectedImprovement / 100) * confidence;
    if (score >= 0.2) return 9; // High priority
    if (score >= 0.15) return 7; // Medium-high priority
    if (score >= 0.1) return 5; // Medium priority
    return 3; // Low priority
  }

  private getDataPointCount(supportingData: any): number {
    if (supportingData.hourlyEngagement) {
      return Object.keys(supportingData.hourlyEngagement).length;
    }
    if (supportingData.segmentPerformance) {
      return Object.keys(supportingData.segmentPerformance).length;
    }
    return 0;
  }

  private getDateRange(timeframe: string): { start: string; end: string } {
    const end = new Date();
    const start = new Date();
    
    switch (timeframe) {
      case 'last_7_days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(start.getDate() - 30);
        break;
      case 'last_90_days':
        start.setDate(start.getDate() - 90);
        break;
      case 'all_time':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    
    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
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

  private async logAutomationAction(salonId: string, actionType: string, actionData: any): Promise<void> {
    try {
      const logData: InsertAutomatedActionLog = {
        salonId,
        actionType,
        actionDescription: `Campaign optimization: ${actionType}`,
        actionData,
        triggeredBy: 'system',
        status: 'completed'
      };
      await storage.createAutomatedActionLog(logData);
    } catch (error) {
      console.error('Error logging automation action:', error);
    }
  }

  // Public methods for scheduled optimization jobs
  async runDailyOptimizationJob(salonId: string): Promise<void> {
    try {
      const config = await this.getAutomationConfig(salonId);
      if (!config?.enableCampaignOptimization) {
        return;
      }

      const context: OptimizationContext = {
        salonId,
        timeframe: 'last_30_days',
        optimizationTypes: ['send_time', 'audience', 'content', 'frequency', 'channel']
      };

      const recommendations = await this.generateOptimizations(context);
      
      console.log(`Generated ${recommendations.length} optimization recommendations for salon ${salonId}`);
      
    } catch (error) {
      console.error('Error running daily optimization job:', error);
    }
  }

  async generateInsights(salonId: string): Promise<CampaignOptimizationInsight[]> {
    try {
      const insights: CampaignOptimizationInsight[] = [];
      
      // Generate various types of insights
      const sendTimeInsight = await this.generateSendTimeInsight(salonId);
      if (sendTimeInsight) insights.push(sendTimeInsight);
      
      const audienceInsight = await this.generateAudienceInsight(salonId);
      if (audienceInsight) insights.push(audienceInsight);
      
      return insights;
      
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  private async generateSendTimeInsight(salonId: string): Promise<CampaignOptimizationInsight | null> {
    try {
      const context: OptimizationContext = {
        salonId,
        timeframe: 'last_30_days',
        optimizationTypes: ['send_time']
      };
      
      const analysis = await this.analyzeSendTimePerformance(context);
      if (!analysis) return null;
      
      const insightData: InsertCampaignOptimizationInsight = {
        salonId,
        insightType: 'send_time_patterns',
        insightTitle: 'Optimal Send Time Patterns Identified',
        insightDescription: `Your audience is most engaged at ${analysis.recommendedTime}. Consider scheduling campaigns around this time.`,
        insightData: analysis.supportingData,
        supportingMetrics: {
          recommendedTime: analysis.recommendedTime,
          expectedImprovement: analysis.expectedImprovement,
          confidence: analysis.confidence
        },
        confidenceScore: analysis.confidence,
        sampleSize: this.getDataPointCount(analysis.supportingData),
        isActionable: 1,
        recommendedActions: [
          'Update default campaign send time',
          'Schedule future campaigns at optimal time',
          'Test send time variations'
        ],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };
      
      return await storage.createCampaignOptimizationInsight(insightData);
      
    } catch (error) {
      console.error('Error generating send time insight:', error);
      return null;
    }
  }

  private async generateAudienceInsight(salonId: string): Promise<CampaignOptimizationInsight | null> {
    try {
      const context: OptimizationContext = {
        salonId,
        timeframe: 'last_30_days',
        optimizationTypes: ['audience']
      };
      
      const analysis = await this.analyzeAudiencePerformance(context);
      if (!analysis) return null;
      
      const insightData: InsertCampaignOptimizationInsight = {
        salonId,
        insightType: 'audience_preferences',
        insightTitle: 'High-Performing Audience Segments Identified',
        insightDescription: `Segments ${analysis.recommendedSegments.join(', ')} show ${analysis.expectedImprovement.toFixed(1)}% better engagement.`,
        insightData: analysis.supportingData,
        supportingMetrics: {
          recommendedSegments: analysis.recommendedSegments,
          expectedImprovement: analysis.expectedImprovement,
          confidence: analysis.confidence
        },
        confidenceScore: analysis.confidence,
        sampleSize: this.getDataPointCount(analysis.supportingData),
        isActionable: 1,
        recommendedActions: [
          'Focus campaigns on high-performing segments',
          'Analyze characteristics of top segments',
          'Create similar audience segments'
        ],
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days
      };
      
      return await storage.createCampaignOptimizationInsight(insightData);
      
    } catch (error) {
      console.error('Error generating audience insight:', error);
      return null;
    }
  }
}

export const campaignOptimizationService = new CampaignOptimizationService();