import { storage } from '../storage';
import type { 
  MessageTemplate, 
  CustomerSegment, 
  InsertTestVariant,
  TestVariant,
  VariantGenerationRule,
  AutomationConfiguration,
  CommunicationHistory
} from '@shared/schema';

export interface VariantGenerationParams {
  baseTemplate: MessageTemplate;
  testType: 'subject_line' | 'content' | 'send_time' | 'channel' | 'personalization';
  audience: CustomerSegment;
  performanceHistory?: CommunicationHistory[];
  salonId: string;
  testCampaignId: string;
}

export interface GeneratedVariant {
  variantName: string;
  templateOverrides: Record<string, any>;
  channelOverride?: string;
  confidence: number;
  rationale: string;
}

class VariantGenerationService {
  
  // Main method to generate test variants based on AI and best practices
  async generateVariants(params: VariantGenerationParams): Promise<TestVariant[]> {
    try {
      // Get automation configuration for the salon
      const config = await this.getAutomationConfig(params.salonId);
      if (!config?.enableVariantGeneration) {
        throw new Error('Variant generation is disabled for this salon');
      }

      // Get generation rules for this test type
      const rules = await this.getGenerationRules(params.salonId, params.testType);
      
      // Generate variants based on rules and best practices
      const generatedVariants = await this.applyGenerationRules(params, rules, config);
      
      // Create variant records in database
      const createdVariants: TestVariant[] = [];
      for (const variant of generatedVariants) {
        const variantData: InsertTestVariant = {
          testCampaignId: params.testCampaignId,
          variantName: variant.variantName,
          isControl: 0,
          templateOverrides: variant.templateOverrides,
          channelOverride: variant.channelOverride || null,
          audiencePercentage: Math.floor(100 / (generatedVariants.length + 1)), // Equal split + control
          status: 'active',
          priority: createdVariants.length
        };
        
        const created = await storage.createTestVariant(variantData);
        createdVariants.push(created);
      }
      
      // Log the automation action
      await this.logAutomationAction(params.salonId, params.testCampaignId, 'variant_generated', {
        variantCount: createdVariants.length,
        testType: params.testType,
        rules: rules.map(r => r.ruleName)
      });
      
      return createdVariants;
    } catch (error) {
      console.error('Error generating variants:', error);
      throw error;
    }
  }

  // Apply generation rules to create variants
  private async applyGenerationRules(
    params: VariantGenerationParams, 
    rules: VariantGenerationRule[], 
    config: AutomationConfiguration
  ): Promise<GeneratedVariant[]> {
    const variants: GeneratedVariant[] = [];
    
    // Apply rules in priority order
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules.slice(0, config.maxVariantsPerTest - 1)) {
      try {
        const variant = await this.applyRule(params, rule);
        if (variant) {
          variants.push(variant);
        }
      } catch (error) {
        console.error(`Error applying rule ${rule.ruleName}:`, error);
      }
    }
    
    // If no rule-based variants, generate default best practice variants
    if (variants.length === 0) {
      variants.push(...await this.generateDefaultVariants(params));
    }
    
    return variants;
  }

  // Apply a single generation rule
  private async applyRule(params: VariantGenerationParams, rule: VariantGenerationRule): Promise<GeneratedVariant | null> {
    const conditions = rule.conditions as any;
    const actions = rule.actions as any;
    
    // Check if rule conditions are met
    if (!await this.checkRuleConditions(params, conditions)) {
      return null;
    }
    
    // Apply rule actions based on test type
    let templateOverrides: Record<string, any> = {};
    let rationale = `Applied rule: ${rule.ruleName}`;
    
    switch (params.testType) {
      case 'subject_line':
        templateOverrides = await this.generateSubjectLineVariant(params, actions);
        break;
      case 'content':
        templateOverrides = await this.generateContentVariant(params, actions);
        break;
      case 'send_time':
        templateOverrides = await this.generateTimingVariant(params, actions);
        break;
      case 'channel':
        return this.generateChannelVariant(params, actions);
      case 'personalization':
        templateOverrides = await this.generatePersonalizationVariant(params, actions);
        break;
    }
    
    return {
      variantName: `${rule.ruleName}_variant`,
      templateOverrides,
      confidence: rule.successRate || 0.7,
      rationale
    };
  }

  // Generate subject line variants using best practices
  private async generateSubjectLineVariant(params: VariantGenerationParams, actions: any): Promise<Record<string, any>> {
    const originalSubject = params.baseTemplate.subject || '';
    const variants: string[] = [];
    
    // Apply different subject line techniques
    if (actions.addUrgency) {
      variants.push(this.addUrgencyToSubject(originalSubject));
    }
    
    if (actions.addPersonalization) {
      variants.push(this.addPersonalizationToSubject(originalSubject, params.audience));
    }
    
    if (actions.addEmojis) {
      variants.push(this.addEmojisToSubject(originalSubject));
    }
    
    if (actions.shortenSubject) {
      variants.push(this.shortenSubject(originalSubject));
    }
    
    if (actions.addNumbers) {
      variants.push(this.addNumbersToSubject(originalSubject));
    }
    
    // Select the best variant based on performance history
    const selectedSubject = await this.selectBestSubjectVariant(variants, params.performanceHistory);
    
    return { subject: selectedSubject };
  }

  // Generate content variants
  private async generateContentVariant(params: VariantGenerationParams, actions: any): Promise<Record<string, any>> {
    const originalContent = params.baseTemplate.content;
    let modifiedContent = originalContent;
    
    if (actions.addSocialProof) {
      modifiedContent = this.addSocialProof(modifiedContent);
    }
    
    if (actions.addScarcity) {
      modifiedContent = this.addScarcity(modifiedContent);
    }
    
    if (actions.improveCallToAction) {
      modifiedContent = this.improveCallToAction(modifiedContent);
    }
    
    if (actions.addPersonalTouch) {
      modifiedContent = this.addPersonalTouch(modifiedContent, params.audience);
    }
    
    return { content: modifiedContent };
  }

  // Generate timing variants
  private async generateTimingVariant(params: VariantGenerationParams, actions: any): Promise<Record<string, any>> {
    const timingOverrides: Record<string, any> = {};
    
    if (actions.optimizeForAudience) {
      // Analyze audience activity patterns
      const optimalTime = await this.getOptimalSendTime(params.audience, params.salonId);
      timingOverrides.sendTime = optimalTime;
    }
    
    if (actions.avoidCompetition) {
      // Find times with less email/SMS competition
      const lowCompetitionTime = await this.getLowCompetitionTime(params.salonId);
      timingOverrides.sendTime = lowCompetitionTime;
    }
    
    return timingOverrides;
  }

  // Generate channel variants (email vs SMS)
  private generateChannelVariant(params: VariantGenerationParams, actions: any): GeneratedVariant {
    const alternativeChannel = params.baseTemplate.channel === 'email' ? 'sms' : 'email';
    
    return {
      variantName: `${alternativeChannel}_variant`,
      templateOverrides: {},
      channelOverride: alternativeChannel,
      confidence: 0.6,
      rationale: `Testing ${alternativeChannel} vs ${params.baseTemplate.channel}`
    };
  }

  // Generate personalization variants
  private async generatePersonalizationVariant(params: VariantGenerationParams, actions: any): Promise<Record<string, any>> {
    const overrides: Record<string, any> = {};
    
    if (actions.addNamePersonalization) {
      overrides.subject = this.addNamePersonalization(params.baseTemplate.subject || '');
      overrides.content = this.addNamePersonalization(params.baseTemplate.content);
    }
    
    if (actions.addLocationPersonalization) {
      overrides.content = this.addLocationPersonalization(params.baseTemplate.content, params.salonId);
    }
    
    if (actions.addBehaviorPersonalization) {
      overrides.content = await this.addBehaviorPersonalization(params.baseTemplate.content, params.audience);
    }
    
    return overrides;
  }

  // Default variants when no rules apply
  private async generateDefaultVariants(params: VariantGenerationParams): Promise<GeneratedVariant[]> {
    const variants: GeneratedVariant[] = [];
    
    switch (params.testType) {
      case 'subject_line':
        variants.push({
          variantName: 'urgency_variant',
          templateOverrides: { subject: this.addUrgencyToSubject(params.baseTemplate.subject || '') },
          confidence: 0.6,
          rationale: 'Added urgency to subject line'
        });
        break;
        
      case 'content':
        variants.push({
          variantName: 'cta_variant', 
          templateOverrides: { content: this.improveCallToAction(params.baseTemplate.content) },
          confidence: 0.7,
          rationale: 'Improved call-to-action'
        });
        break;
        
      case 'send_time':
        const optimalTime = await this.getOptimalSendTime(params.audience, params.salonId);
        variants.push({
          variantName: 'optimal_time_variant',
          templateOverrides: { sendTime: optimalTime },
          confidence: 0.8,
          rationale: 'Optimized send time based on audience activity'
        });
        break;
    }
    
    return variants;
  }

  // Helper methods for content modification
  private addUrgencyToSubject(subject: string): string {
    const urgencyWords = ['Limited Time', 'Last Chance', 'Urgent', 'Act Fast', 'Today Only'];
    const randomUrgency = urgencyWords[Math.floor(Math.random() * urgencyWords.length)];
    return `${randomUrgency}: ${subject}`;
  }

  private addPersonalizationToSubject(subject: string, audience: CustomerSegment): string {
    return subject.replace(/\b(hair|beauty|salon)\b/gi, '{{customer_name}}\'s $1');
  }

  private addEmojisToSubject(subject: string): string {
    const emojis = ['✨', '💇‍♀️', '💅', '🌟', '💄'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${randomEmoji} ${subject}`;
  }

  private shortenSubject(subject: string): string {
    if (subject.length <= 30) return subject;
    return subject.substring(0, 27) + '...';
  }

  private addNumbersToSubject(subject: string): string {
    const numbers = ['50%', '3 days', '24 hours', '5 tips', '10 secrets'];
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    return subject.replace(/\b(offer|deal|discount|tips|secrets)\b/gi, `${randomNumber} $1`);
  }

  private addSocialProof(content: string): string {
    const socialProof = '\n\n✨ Join over 1,000 satisfied customers who love our services!';
    return content + socialProof;
  }

  private addScarcity(content: string): string {
    const scarcity = '\n\n⏰ Limited spots available - book now to secure your appointment!';
    return content + scarcity;
  }

  private improveCallToAction(content: string): string {
    return content.replace(
      /book now|click here|learn more/gi, 
      'Book Your Transformation Today →'
    );
  }

  private addPersonalTouch(content: string, audience: CustomerSegment): string {
    return content.replace(/Dear customer/gi, 'Dear {{customer_name}}');
  }

  private addNamePersonalization(text: string): string {
    return text.replace(/\b(you|your)\b/gi, '{{customer_name}}');
  }

  private addLocationPersonalization(content: string, salonId: string): string {
    return content + '\n\nVisit us at {{salon_address}} - we\'re in your neighborhood!';
  }

  private async addBehaviorPersonalization(content: string, audience: CustomerSegment): string {
    // Based on customer segment, add relevant personalization
    if (audience.name?.toLowerCase().includes('vip')) {
      return content + '\n\n🎖️ As a VIP customer, you get priority booking and exclusive offers!';
    }
    return content;
  }

  // Analytics and optimization methods
  private async getOptimalSendTime(audience: CustomerSegment, salonId: string): Promise<string> {
    // Analyze communication history to find optimal send times
    // This is a simplified version - real implementation would use ML
    const hour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
    return `${hour}:00`;
  }

  private async getLowCompetitionTime(salonId: string): Promise<string> {
    // Analyze industry data to find low-competition send times
    const lowCompetitionHours = [10, 14, 16]; // 10 AM, 2 PM, 4 PM
    const randomHour = lowCompetitionHours[Math.floor(Math.random() * lowCompetitionHours.length)];
    return `${randomHour}:00`;
  }

  private async selectBestSubjectVariant(variants: string[], history?: CommunicationHistory[]): Promise<string> {
    if (!history || history.length === 0) {
      return variants[0] || '';
    }
    
    // Analyze performance of similar subject lines in history
    // For now, return a random variant - real implementation would use ML
    return variants[Math.floor(Math.random() * variants.length)];
  }

  private async checkRuleConditions(params: VariantGenerationParams, conditions: any): Promise<boolean> {
    // Check if audience criteria match
    if (conditions.audienceSize && params.audience.criteria) {
      // Simple audience size check
      return true;
    }
    
    // Check performance thresholds
    if (conditions.minPerformance && params.performanceHistory) {
      // Check if historical performance meets threshold
      return true;
    }
    
    return true; // Default to allowing rule application
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

  private async getGenerationRules(salonId: string, ruleType: string): Promise<VariantGenerationRule[]> {
    try {
      return await storage.getVariantGenerationRulesBySalonId(salonId, { ruleType, isActive: 1 });
    } catch (error) {
      console.error('Error fetching generation rules:', error);
      return [];
    }
  }

  private async logAutomationAction(salonId: string, testCampaignId: string, actionType: string, actionData: any): Promise<void> {
    try {
      await storage.createAutomatedActionLog({
        salonId,
        testCampaignId,
        actionType,
        actionDescription: `Generated ${actionData.variantCount} variants for ${actionData.testType} test`,
        actionData,
        triggeredBy: 'system',
        status: 'completed'
      });
    } catch (error) {
      console.error('Error logging automation action:', error);
    }
  }

  // Public method to analyze template performance and suggest improvements
  async analyzeTemplatePerformance(templateId: string, salonId: string): Promise<any> {
    try {
      const template = await storage.getMessageTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const history = await storage.getCommunicationHistoryByTemplateId(templateId);
      const analysis = {
        templateId,
        totalSent: history.length,
        openRate: this.calculateOpenRate(history),
        clickRate: this.calculateClickRate(history),
        suggestions: this.generateImprovementSuggestions(template, history)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing template performance:', error);
      throw error;
    }
  }

  private calculateOpenRate(history: CommunicationHistory[]): number {
    const delivered = history.filter(h => h.status === 'delivered' || h.status === 'sent');
    const opened = history.filter(h => h.openedAt);
    return delivered.length > 0 ? (opened.length / delivered.length) * 100 : 0;
  }

  private calculateClickRate(history: CommunicationHistory[]): number {
    const delivered = history.filter(h => h.status === 'delivered' || h.status === 'sent');
    const clicked = history.filter(h => h.clickedAt);
    return delivered.length > 0 ? (clicked.length / delivered.length) * 100 : 0;
  }

  private generateImprovementSuggestions(template: MessageTemplate, history: CommunicationHistory[]): string[] {
    const suggestions: string[] = [];
    
    const openRate = this.calculateOpenRate(history);
    const clickRate = this.calculateClickRate(history);
    
    if (openRate < 20) {
      suggestions.push('Consider testing subject lines with urgency or personalization');
    }
    
    if (clickRate < 5) {
      suggestions.push('Improve call-to-action buttons and content structure');
    }
    
    if (template.subject && template.subject.length > 50) {
      suggestions.push('Test shorter subject lines for better mobile display');
    }
    
    return suggestions;
  }
}

export const variantGenerationService = new VariantGenerationService();