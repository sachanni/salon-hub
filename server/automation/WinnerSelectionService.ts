import { storage } from '../storage';
import { performanceMonitoringService } from './PerformanceMonitoringService';
import { communicationService } from '../communicationService';
import type { 
  AbTestCampaign,
  TestVariant,
  TestMetric,
  TestResult,
  InsertTestResult,
  AutomationConfiguration,
  InsertAutomatedActionLog,
  MessageTemplate
} from '@shared/schema';

export interface WinnerSelectionParams {
  testCampaignId: string;
  confidenceLevel: number; // 90, 95, 99
  businessRules?: BusinessRule[];
  forceSelection?: boolean;
}

export interface BusinessRule {
  id: string;
  type: 'minimum_improvement' | 'minimum_sample_size' | 'minimum_duration' | 'cost_threshold';
  condition: 'greater_than' | 'less_than' | 'equals';
  value: number;
  description: string;
}

export interface WinnerSelectionResult {
  success: boolean;
  winnerVariantId?: string;
  winnerVariantName?: string;
  confidence: number;
  improvement: number;
  statisticalSignificance: number;
  pValue: number;
  sampleSize: number;
  testDuration: number;
  rationale: string;
  businessRulesPassed: boolean;
  failedRules?: string[];
  recommendation: 'implement_winner' | 'continue_test' | 'inconclusive' | 'manual_review';
}

export interface VariantComparison {
  variantId: string;
  variantName: string;
  metrics: {
    participants: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  confidence: number;
  isControl: boolean;
}

class WinnerSelectionService {

  // Main method to analyze test and select winner
  async analyzeAndSelectWinner(params: WinnerSelectionParams): Promise<WinnerSelectionResult> {
    try {
      const campaign = await storage.getAbTestCampaign(params.testCampaignId);
      if (!campaign) {
        throw new Error('Test campaign not found');
      }

      const config = await this.getAutomationConfig(campaign.salonId);
      if (!config) {
        throw new Error('Automation configuration not found');
      }

      // Get variant performances
      const variants = await this.getVariantComparisons(params.testCampaignId);
      if (variants.length < 2) {
        throw new Error('Need at least 2 variants for winner selection');
      }

      // Find control variant
      const control = variants.find(v => v.isControl) || variants[0];
      const testVariants = variants.filter(v => !v.isControl && v.variantId !== control.variantId);

      // Perform statistical analysis
      const analyses = await this.performStatisticalAnalysis(control, testVariants, params.confidenceLevel);
      
      // Find the best performing variant
      const bestVariant = this.findBestVariant(analyses);
      
      if (!bestVariant) {
        return {
          success: false,
          confidence: 0,
          improvement: 0,
          statisticalSignificance: 0,
          pValue: 1,
          sampleSize: control.metrics.participants,
          testDuration: this.calculateTestDuration(campaign),
          rationale: 'No variant shows statistically significant improvement',
          businessRulesPassed: false,
          recommendation: 'continue_test'
        };
      }

      // Apply business rules
      const businessRulesResult = await this.applyBusinessRules(bestVariant, params.businessRules || [], campaign);
      
      // Generate recommendation
      const recommendation = this.generateRecommendation(bestVariant, businessRulesResult, params.forceSelection);
      
      // If we should implement the winner, create test result
      if (recommendation === 'implement_winner' && config.enableAutoWinnerSelection) {
        await this.implementWinner(campaign, bestVariant);
      }

      // Log the analysis
      await this.logWinnerSelectionAction(campaign.salonId, params.testCampaignId, 'winner_analysis', {
        recommendation,
        winnerVariantId: bestVariant.variantId,
        confidence: bestVariant.confidence,
        improvement: bestVariant.improvement
      });

      return {
        success: true,
        winnerVariantId: bestVariant.variantId,
        winnerVariantName: bestVariant.variantName,
        confidence: bestVariant.confidence,
        improvement: bestVariant.improvement,
        statisticalSignificance: bestVariant.statisticalSignificance,
        pValue: bestVariant.pValue,
        sampleSize: bestVariant.sampleSize,
        testDuration: this.calculateTestDuration(campaign),
        rationale: bestVariant.rationale,
        businessRulesPassed: businessRulesResult.passed,
        failedRules: businessRulesResult.failedRules,
        recommendation
      };

    } catch (error) {
      console.error('Error in winner selection analysis:', error);
      return {
        success: false,
        confidence: 0,
        improvement: 0,
        statisticalSignificance: 0,
        pValue: 1,
        sampleSize: 0,
        testDuration: 0,
        rationale: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        businessRulesPassed: false,
        recommendation: 'manual_review'
      };
    }
  }

  // Get variant performance comparisons
  private async getVariantComparisons(testCampaignId: string): Promise<VariantComparison[]> {
    const variants = await storage.getTestVariantsByTestId(testCampaignId);
    const comparisons: VariantComparison[] = [];

    for (const variant of variants) {
      const metrics = await storage.getTestMetricsByVariantId(variant.id);
      const aggregatedMetrics = this.aggregateMetrics(metrics);
      
      const comparison: VariantComparison = {
        variantId: variant.id,
        variantName: variant.variantName,
        metrics: {
          participants: aggregatedMetrics.participantCount,
          sent: aggregatedMetrics.sentCount,
          delivered: aggregatedMetrics.deliveredCount,
          opened: aggregatedMetrics.openCount,
          clicked: aggregatedMetrics.clickCount,
          converted: aggregatedMetrics.conversionCount,
          openRate: aggregatedMetrics.deliveredCount > 0 ? 
            (aggregatedMetrics.openCount / aggregatedMetrics.deliveredCount) * 100 : 0,
          clickRate: aggregatedMetrics.deliveredCount > 0 ? 
            (aggregatedMetrics.clickCount / aggregatedMetrics.deliveredCount) * 100 : 0,
          conversionRate: aggregatedMetrics.deliveredCount > 0 ? 
            (aggregatedMetrics.conversionCount / aggregatedMetrics.deliveredCount) * 100 : 0
        },
        confidence: this.calculateConfidence(aggregatedMetrics.participantCount),
        isControl: variant.isControl === 1
      };

      comparisons.push(comparison);
    }

    return comparisons;
  }

  // Perform statistical analysis comparing variants to control
  private async performStatisticalAnalysis(
    control: VariantComparison,
    testVariants: VariantComparison[],
    confidenceLevel: number
  ): Promise<any[]> {
    const analyses = [];

    for (const variant of testVariants) {
      const analysis = this.performZTest(control, variant, confidenceLevel);
      analyses.push({
        ...analysis,
        variantId: variant.variantId,
        variantName: variant.variantName,
        variant: variant
      });
    }

    return analyses;
  }

  // Perform Z-test for statistical significance
  private performZTest(control: VariantComparison, variant: VariantComparison, confidenceLevel: number): any {
    // Use conversion rate as primary metric
    const n1 = control.metrics.delivered;
    const n2 = variant.metrics.delivered;
    const x1 = control.metrics.converted;
    const x2 = variant.metrics.converted;

    if (n1 < 30 || n2 < 30) {
      return {
        isSignificant: false,
        pValue: 1,
        confidence: 0.5,
        improvement: 0,
        statisticalSignificance: 0,
        rationale: 'Insufficient sample size for statistical analysis'
      };
    }

    const p1 = x1 / n1;
    const p2 = x2 / n2;
    
    // Pooled proportion
    const pPooled = (x1 + x2) / (n1 + n2);
    
    // Standard error
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
    
    if (se === 0) {
      return {
        isSignificant: false,
        pValue: 1,
        confidence: 0.5,
        improvement: 0,
        statisticalSignificance: 0,
        rationale: 'Cannot calculate statistical significance (zero standard error)'
      };
    }
    
    // Z-score
    const zScore = Math.abs(p2 - p1) / se;
    
    // Two-tailed p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    // Improvement percentage
    const improvement = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
    
    // Required z-score for confidence level
    const requiredZ = this.getRequiredZScore(confidenceLevel);
    const isSignificant = zScore >= requiredZ && improvement > 0;
    
    // Calculate confidence achieved
    const confidenceAchieved = 1 - pValue;
    
    return {
      isSignificant,
      pValue,
      zScore,
      confidence: confidenceAchieved,
      improvement,
      statisticalSignificance: confidenceAchieved,
      sampleSize: n2,
      rationale: `${variant.variantName} shows ${improvement.toFixed(1)}% ${improvement > 0 ? 'improvement' : 'decline'} with ${(confidenceAchieved * 100).toFixed(1)}% confidence`
    };
  }

  // Normal cumulative distribution function (approximation)
  private normalCDF(x: number): number {
    // Abramowitz and Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return x > 0 ? 1 - prob : prob;
  }

  // Get required Z-score for confidence level
  private getRequiredZScore(confidenceLevel: number): number {
    switch (confidenceLevel) {
      case 90: return 1.645;
      case 95: return 1.96;
      case 99: return 2.576;
      default: return 1.96;
    }
  }

  // Find the best performing variant from statistical analyses
  private findBestVariant(analyses: any[]): any | null {
    // Filter for statistically significant improvements
    const significantVariants = analyses.filter(a => a.isSignificant && a.improvement > 0);
    
    if (significantVariants.length === 0) {
      return null;
    }

    // Sort by improvement * confidence score
    significantVariants.sort((a, b) => 
      (b.improvement * b.confidence) - (a.improvement * a.confidence)
    );

    return significantVariants[0];
  }

  // Apply business rules to validate winner selection
  private async applyBusinessRules(
    bestVariant: any, 
    businessRules: BusinessRule[], 
    campaign: AbTestCampaign
  ): Promise<{ passed: boolean; failedRules: string[] }> {
    const failedRules: string[] = [];

    // Default business rules if none provided
    if (businessRules.length === 0) {
      businessRules = [
        {
          id: 'min_improvement',
          type: 'minimum_improvement',
          condition: 'greater_than',
          value: 5, // 5% minimum improvement
          description: 'Minimum 5% improvement required'
        },
        {
          id: 'min_samples',
          type: 'minimum_sample_size',
          condition: 'greater_than',
          value: 100, // 100 minimum samples
          description: 'Minimum 100 samples required'
        }
      ];
    }

    for (const rule of businessRules) {
      const passed = await this.evaluateBusinessRule(rule, bestVariant, campaign);
      if (!passed) {
        failedRules.push(rule.description);
      }
    }

    return {
      passed: failedRules.length === 0,
      failedRules
    };
  }

  // Evaluate a single business rule
  private async evaluateBusinessRule(
    rule: BusinessRule, 
    variant: any, 
    campaign: AbTestCampaign
  ): Promise<boolean> {
    let actualValue: number;

    switch (rule.type) {
      case 'minimum_improvement':
        actualValue = Math.abs(variant.improvement);
        break;
      case 'minimum_sample_size':
        actualValue = variant.sampleSize;
        break;
      case 'minimum_duration':
        actualValue = this.calculateTestDuration(campaign);
        break;
      case 'cost_threshold':
        // Would calculate actual cost vs threshold
        actualValue = 0; // Simplified
        break;
      default:
        return true;
    }

    switch (rule.condition) {
      case 'greater_than':
        return actualValue > rule.value;
      case 'less_than':
        return actualValue < rule.value;
      case 'equals':
        return Math.abs(actualValue - rule.value) < 0.001; // Float comparison
      default:
        return true;
    }
  }

  // Generate recommendation based on analysis and business rules
  private generateRecommendation(
    bestVariant: any, 
    businessRulesResult: { passed: boolean; failedRules: string[] },
    forceSelection?: boolean
  ): 'implement_winner' | 'continue_test' | 'inconclusive' | 'manual_review' {
    
    if (forceSelection && bestVariant.isSignificant) {
      return 'implement_winner';
    }

    if (!bestVariant.isSignificant) {
      if (bestVariant.confidence < 0.8) {
        return 'continue_test';
      } else {
        return 'inconclusive';
      }
    }

    if (!businessRulesResult.passed) {
      if (businessRulesResult.failedRules.some(rule => rule.includes('sample'))) {
        return 'continue_test';
      } else {
        return 'manual_review';
      }
    }

    return 'implement_winner';
  }

  // Implement the winning variant
  private async implementWinner(campaign: AbTestCampaign, winner: any): Promise<void> {
    try {
      // Create test result record
      const testResult: InsertTestResult = {
        testCampaignId: campaign.id,
        winnerVariantId: winner.variantId,
        completedAt: new Date(),
        statisticalSignificance: winner.statisticalSignificance,
        confidenceLevel: Math.floor(winner.confidence * 100),
        pValue: winner.pValue,
        performanceImprovement: winner.improvement / 100,
        resultSummary: {
          winnerName: winner.variantName,
          improvement: winner.improvement,
          confidence: winner.confidence,
          rationale: winner.rationale
        },
        actionTaken: 'auto_winner',
        implementedAt: new Date(),
        notes: `Automatically selected winner: ${winner.rationale}`
      };

      await storage.createTestResult(testResult);

      // Update campaign status
      await storage.updateAbTestCampaign(campaign.id, { 
        status: 'completed',
        completedAt: new Date()
      });

      // Update winning variant status
      await storage.updateTestVariant(winner.variantId, { status: 'winner' });

      // Update losing variants status
      const allVariants = await storage.getTestVariantsByTestId(campaign.id);
      for (const variant of allVariants) {
        if (variant.id !== winner.variantId) {
          await storage.updateTestVariant(variant.id, { status: 'loser' });
        }
      }

      // Apply winner to base template if applicable
      if (campaign.baseTemplateId) {
        await this.applyWinnerToBaseTemplate(campaign.baseTemplateId, winner);
      }

      console.log(`Automatically implemented winner ${winner.variantName} for test ${campaign.id}`);

    } catch (error) {
      console.error('Error implementing winner:', error);
      throw error;
    }
  }

  // Apply winning variant changes to base template
  private async applyWinnerToBaseTemplate(templateId: string, winner: any): Promise<void> {
    try {
      const template = await storage.getMessageTemplate(templateId);
      if (!template) return;

      const variant = await storage.getTestVariant(winner.variantId);
      if (!variant || !variant.templateOverrides) return;

      const overrides = variant.templateOverrides as any;
      const updates: Partial<MessageTemplate> = {};

      // Apply template overrides
      if (overrides.subject) {
        updates.subject = overrides.subject;
      }
      
      if (overrides.content) {
        updates.content = overrides.content;
      }

      if (overrides.channel) {
        updates.channel = overrides.channel;
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateMessageTemplate(templateId, updates);
        console.log(`Applied winning variant changes to template ${templateId}`);
      }

    } catch (error) {
      console.error('Error applying winner to base template:', error);
    }
  }

  // Schedule automatic winner analysis for active tests
  async runAutomaticWinnerAnalysis(salonId: string): Promise<void> {
    try {
      const config = await this.getAutomationConfig(salonId);
      if (!config?.enableAutoWinnerSelection) {
        return;
      }

      // Get active test campaigns
      const activeTests = await storage.getAbTestCampaignsBySalonId(salonId, { status: 'running' });
      
      for (const test of activeTests) {
        const testDuration = this.calculateTestDuration(test);
        
        // Only analyze tests that have run for minimum duration
        if (testDuration >= config.minimumTestDurationHours) {
          try {
            const result = await this.analyzeAndSelectWinner({
              testCampaignId: test.id,
              confidenceLevel: config.autoWinnerConfidenceLevel,
              forceSelection: false
            });

            console.log(`Analyzed test ${test.id}: ${result.recommendation}`);
            
          } catch (error) {
            console.error(`Error analyzing test ${test.id}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Error running automatic winner analysis:', error);
    }
  }

  // Helper methods
  private aggregateMetrics(metrics: any[]): any {
    return metrics.reduce((sum, metric) => ({
      participantCount: Math.max(sum.participantCount, metric.participantCount),
      sentCount: sum.sentCount + metric.sentCount,
      deliveredCount: sum.deliveredCount + metric.deliveredCount,
      openCount: sum.openCount + metric.openCount,
      clickCount: sum.clickCount + metric.clickCount,
      conversionCount: sum.conversionCount + metric.conversionCount,
      bounceCount: sum.bounceCount + metric.bounceCount
    }), {
      participantCount: 0,
      sentCount: 0,
      deliveredCount: 0,
      openCount: 0,
      clickCount: 0,
      conversionCount: 0,
      bounceCount: 0
    });
  }

  private calculateConfidence(sampleSize: number): number {
    if (sampleSize >= 1000) return 0.99;
    if (sampleSize >= 400) return 0.95;
    if (sampleSize >= 100) return 0.90;
    if (sampleSize >= 30) return 0.80;
    return 0.5;
  }

  private calculateTestDuration(campaign: AbTestCampaign): number {
    const startTime = new Date(campaign.startedAt || campaign.createdAt);
    return (Date.now() - startTime.getTime()) / (1000 * 60 * 60); // Hours
  }

  private async getAutomationConfig(salonId: string): Promise<AutomationConfiguration | null> {
    try {
      return await storage.getAutomationConfigurationBySalonId(salonId);
    } catch (error) {
      console.error('Error fetching automation config:', error);
      return null;
    }
  }

  private async logWinnerSelectionAction(salonId: string, testCampaignId: string, actionType: string, actionData: any): Promise<void> {
    try {
      const logData: InsertAutomatedActionLog = {
        salonId,
        testCampaignId,
        actionType,
        actionDescription: `Winner selection: ${actionType}`,
        actionData,
        triggeredBy: 'system',
        status: 'completed'
      };
      await storage.createAutomatedActionLog(logData);
    } catch (error) {
      console.error('Error logging winner selection action:', error);
    }
  }

  // Public methods for manual winner selection
  async selectWinnerManually(
    testCampaignId: string, 
    selectedVariantId: string, 
    userId: string,
    notes?: string
  ): Promise<void> {
    try {
      const campaign = await storage.getAbTestCampaign(testCampaignId);
      if (!campaign) {
        throw new Error('Test campaign not found');
      }

      const variant = await storage.getTestVariant(selectedVariantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      // Get performance comparison for the manually selected variant
      const variants = await this.getVariantComparisons(testCampaignId);
      const control = variants.find(v => v.isControl) || variants[0];
      const selectedVariantData = variants.find(v => v.variantId === selectedVariantId);
      
      if (!selectedVariantData) {
        throw new Error('Variant performance data not found');
      }

      // Calculate improvement
      const improvement = control.metrics.conversionRate > 0 ? 
        ((selectedVariantData.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100 : 0;

      // Create test result record
      const testResult: InsertTestResult = {
        testCampaignId: campaign.id,
        winnerVariantId: selectedVariantId,
        completedAt: new Date(),
        performanceImprovement: improvement / 100,
        resultSummary: {
          winnerName: variant.variantName,
          improvement: improvement,
          selectionMethod: 'manual'
        },
        actionTaken: 'manual_selection',
        implementedAt: new Date(),
        notes: notes || `Manually selected winner: ${variant.variantName}`
      };

      await storage.createTestResult(testResult);

      // Update statuses
      await storage.updateAbTestCampaign(campaign.id, { 
        status: 'completed',
        completedAt: new Date()
      });

      await storage.updateTestVariant(selectedVariantId, { status: 'winner' });

      // Update losing variants
      const allVariants = await storage.getTestVariantsByTestId(campaign.id);
      for (const v of allVariants) {
        if (v.id !== selectedVariantId) {
          await storage.updateTestVariant(v.id, { status: 'loser' });
        }
      }

      // Apply winner to base template
      if (campaign.baseTemplateId) {
        await this.applyWinnerToBaseTemplate(campaign.baseTemplateId, { variantId: selectedVariantId });
      }

      // Log the manual selection
      await this.logWinnerSelectionAction(campaign.salonId, testCampaignId, 'manual_winner_selected', {
        selectedVariantId,
        selectedVariantName: variant.variantName,
        selectedByUserId: userId,
        improvement: improvement
      });

      console.log(`Manually selected winner ${variant.variantName} for test ${campaign.id}`);

    } catch (error) {
      console.error('Error selecting winner manually:', error);
      throw error;
    }
  }

  // Get test performance summary for dashboard
  async getTestPerformanceSummary(testCampaignId: string): Promise<any> {
    try {
      const campaign = await storage.getAbTestCampaign(testCampaignId);
      if (!campaign) {
        throw new Error('Test campaign not found');
      }

      const variants = await this.getVariantComparisons(testCampaignId);
      const control = variants.find(v => v.isControl) || variants[0];
      const testVariants = variants.filter(v => !v.isControl);

      const analyses = await this.performStatisticalAnalysis(control, testVariants, 95);
      const bestVariant = this.findBestVariant(analyses);

      return {
        campaignId: campaign.id,
        campaignName: campaign.campaignName,
        status: campaign.status,
        duration: this.calculateTestDuration(campaign),
        totalParticipants: variants.reduce((sum, v) => sum + v.metrics.participants, 0),
        variants: variants.map(v => ({
          id: v.variantId,
          name: v.variantName,
          isControl: v.isControl,
          metrics: v.metrics,
          confidence: v.confidence
        })),
        winner: bestVariant ? {
          variantId: bestVariant.variantId,
          variantName: bestVariant.variantName,
          improvement: bestVariant.improvement,
          confidence: bestVariant.confidence,
          isSignificant: bestVariant.isSignificant
        } : null,
        recommendation: bestVariant ? this.generateRecommendation(bestVariant, { passed: true, failedRules: [] }) : 'continue_test'
      };

    } catch (error) {
      console.error('Error getting test performance summary:', error);
      throw error;
    }
  }
}

export const winnerSelectionService = new WinnerSelectionService();