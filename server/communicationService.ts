import { MailService } from '@sendgrid/mail';
import twilio from 'twilio';
import { storage } from './storage';
import { CommunicationHistory, InsertCommunicationHistory, MessageTemplate } from '@shared/schema';

// Types for the communication service
export interface SendMessageRequest {
  to: string;
  channel: 'email' | 'sms';
  templateId?: string;
  customContent?: {
    subject?: string;
    body: string;
  };
  variables?: Record<string, string>;
  salonId: string;
  customerId?: string;
  bookingId?: string;
  campaignId?: string;
  type: 'transactional' | 'marketing' | 'booking_confirmation' | 'booking_reminder' | 'booking_rescheduled' | 'campaign';
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  providerId?: string;
  error?: string;
  historyId?: string;
}

export interface EmailProvider {
  send(params: {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<{ messageId: string }>;
}

export interface SMSProvider {
  send(params: {
    to: string;
    from: string;
    body: string;
  }): Promise<{ messageId: string }>;
}

class CommunicationService {
  private emailService: MailService | null = null;
  private smsService: any = null; // Twilio client
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    // Initialize SendGrid for email
    if (process.env.SENDGRID_API_KEY) {
      this.emailService = new MailService();
      this.emailService.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      console.warn("SENDGRID_API_KEY not set - email functionality disabled");
    }
    
    // Initialize Twilio for SMS
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.smsService = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } else {
      console.warn("Twilio credentials not set - SMS functionality disabled");
    }
  }
  
  // Main method to send messages across channels
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      // Create communication history record first
      const historyRecord: InsertCommunicationHistory = {
        salonId: request.salonId,
        customerId: request.customerId || null,
        bookingId: request.bookingId || null,
        campaignId: request.campaignId || null,
        templateId: request.templateId || null,
        type: request.type,
        channel: request.channel,
        recipient: request.to,
        status: 'pending',
        subject: request.customContent?.subject || null,
        content: request.customContent?.body || null,
        metadata: request.variables ? JSON.stringify(request.variables) : null,
        createdAt: new Date(),
      };
      
      const history = await storage.createCommunicationHistory(historyRecord);
      
      let content: { subject?: string; body: string };
      
      if (request.templateId) {
        // Get template and apply variables
        const template = await storage.getMessageTemplate(request.templateId);
        if (!template) {
          await this.updateHistoryStatus(history.id, 'failed', 'Template not found');
          return { success: false, error: 'Template not found', historyId: history.id };
        }
        
        content = this.applyTemplateVariables(template, request.variables || {});
      } else if (request.customContent) {
        content = request.customContent;
      } else {
        await this.updateHistoryStatus(history.id, 'failed', 'No content provided');
        return { success: false, error: 'No content provided', historyId: history.id };
      }
      
      // Send via appropriate channel
      let result: { messageId: string };
      
      if (request.channel === 'email') {
        result = await this.sendEmail({
          to: request.to,
          subject: content.subject || 'Notification from your salon',
          body: content.body,
          salonId: request.salonId
        });
      } else if (request.channel === 'sms') {
        result = await this.sendSMS({
          to: request.to,
          body: content.body,
          salonId: request.salonId
        });
      } else {
        await this.updateHistoryStatus(history.id, 'failed', 'Invalid channel');
        return { success: false, error: 'Invalid channel', historyId: history.id };
      }
      
      // Update history with success
      await storage.updateCommunicationHistory(history.id, {
        status: 'sent',
        providerId: result.messageId,
        sentAt: new Date()
      });
      
      return {
        success: true,
        messageId: result.messageId,
        providerId: result.messageId,
        historyId: history.id
      };
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (request.customerId) {
        // Try to update history if we have an ID
        try {
          const historyRecord: InsertCommunicationHistory = {
            salonId: request.salonId,
            customerId: request.customerId,
            bookingId: request.bookingId || null,
            campaignId: request.campaignId || null,
            templateId: request.templateId || null,
            type: request.type,
            channel: request.channel,
            recipient: request.to,
            status: 'failed',
            subject: request.customContent?.subject || null,
            content: request.customContent?.body || null,
            failureReason: error instanceof Error ? error.message : 'Unknown error',
            metadata: request.variables ? JSON.stringify(request.variables) : null,
            createdAt: new Date(),
          };
          
          await storage.createCommunicationHistory(historyRecord);
        } catch (historyError) {
          console.error('Error creating failure history record:', historyError);
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    salonId: string;
  }): Promise<{ messageId: string }> {
    if (!this.emailService) {
      throw new Error('Email service not configured');
    }
    
    // Get salon info for from email
    const salon = await storage.getSalon(params.salonId);
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || salon?.email || 'noreply@salonhub.com';
    const fromName = salon?.name || 'SalonHub';
    
    const emailData = {
      to: params.to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: params.subject,
      html: this.formatEmailHTML(params.body, salon?.name),
      text: params.body
    };
    
    const [response] = await this.emailService.send(emailData);
    return { messageId: response.headers['x-message-id'] || 'email-sent' };
  }
  
  private async sendSMS(params: {
    to: string;
    body: string;
    salonId: string;
  }): Promise<{ messageId: string }> {
    if (!this.smsService) {
      throw new Error('SMS service not configured');
    }
    
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!fromNumber) {
      throw new Error('Twilio phone number not configured');
    }
    
    // Ensure phone number is in proper format
    let toNumber = params.to;
    if (!toNumber.startsWith('+')) {
      // Assume Indian number if no country code
      toNumber = '+91' + toNumber.replace(/^0/, '');
    }
    
    const message = await this.smsService.messages.create({
      to: toNumber,
      from: fromNumber,
      body: params.body
    });
    
    return { messageId: message.sid };
  }
  
  // Apply template variables to template content
  private applyTemplateVariables(template: MessageTemplate, variables: Record<string, string>): {
    subject?: string;
    body: string;
  } {
    let subject = template.subject;
    let body = template.content;
    
    // Replace variables in format {{variable_name}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      if (subject) {
        subject = subject.replace(regex, value);
      }
      body = body.replace(regex, value);
    }
    
    return { subject: subject || undefined, body };
  }
  
  // Format email content with basic HTML structure
  private formatEmailHTML(content: string, salonName?: string): string {
    // Convert line breaks to <br> tags
    const htmlContent = content.replace(/\n/g, '<br>');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message from ${salonName || 'Your Salon'}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #8b5cf6; font-size: 20px; margin: 0;">${salonName || 'Your Salon'}</h2>
              </div>
              
              <div style="color: #333; font-size: 16px; line-height: 1.6;">
                  ${htmlContent}
              </div>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                  <p style="color: #999; font-size: 12px;">
                      You received this message because you are a valued customer.
                      If you no longer wish to receive these messages, please contact us.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }
  
  private async updateHistoryStatus(historyId: string, status: string, failureReason?: string) {
    try {
      await storage.updateCommunicationHistory(historyId, {
        status,
        failureReason: failureReason || null
      });
    } catch (error) {
      console.error('Error updating communication history:', error);
    }
  }
  
  // Bulk send messages (for campaigns)
  async sendBulkMessages(requests: SendMessageRequest[]): Promise<SendMessageResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.sendMessage(request))
    );
    
    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: 'Failed to send message' }
    );
  }
  
  // Get delivery status from providers
  async getDeliveryStatus(providerId: string, channel: 'email' | 'sms'): Promise<{
    status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
    timestamp?: Date;
  }> {
    // This would integrate with provider webhooks in a real implementation
    // For now, return a basic status
    return { status: 'sent' };
  }
  
  // Validate phone number format
  isValidPhoneNumber(phone: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
  
  // Validate email address format  
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export const communicationService = new CommunicationService();

// Helper functions for common use cases
export async function sendBookingConfirmation(
  salonId: string,
  bookingId: string,
  customerEmail: string,
  customerPhone?: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse[]> {
  const results: SendMessageResponse[] = [];
  
  // Get customer communication preferences
  const preferences = await storage.getCommunicationPreferences(customerEmail, salonId);
  const preferredChannel = preferences?.preferredChannel || 'email';
  
  // Send booking confirmation via preferred channel
  if (preferredChannel === 'email' || !customerPhone) {
    const emailResult = await communicationService.sendMessage({
      to: customerEmail,
      channel: 'email',
      type: 'booking_confirmation',
      salonId,
      customerId: customerEmail,
      bookingId,
      customContent: {
        subject: 'Booking Confirmation - {{salon_name}}',
        body: `Hi {{customer_name}},\n\nYour booking has been confirmed!\n\nDetails:\n- Service: {{service_name}}\n- Date: {{booking_date}}\n- Time: {{booking_time}}\n- Staff: {{staff_name}}\n\nWe look forward to seeing you!\n\nBest regards,\n{{salon_name}}`
      },
      variables
    });
    results.push(emailResult);
  }
  
  if (preferredChannel === 'sms' && customerPhone) {
    const smsResult = await communicationService.sendMessage({
      to: customerPhone,
      channel: 'sms',
      type: 'booking_confirmation',
      salonId,
      customerId: customerEmail,
      bookingId,
      customContent: {
        body: `Hi {{customer_name}}! Your booking at {{salon_name}} is confirmed for {{booking_date}} at {{booking_time}}. Service: {{service_name}}, Staff: {{staff_name}}. See you soon!`
      },
      variables
    });
    results.push(smsResult);
  }
  
  return results;
}

export async function sendBookingReminder(
  salonId: string,
  bookingId: string,
  customerEmail: string,
  customerPhone?: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse[]> {
  const results: SendMessageResponse[] = [];
  
  // Get customer communication preferences  
  const preferences = await storage.getCommunicationPreferences(customerEmail, salonId);
  
  if (preferences?.bookingNotifications !== false) {
    const preferredChannel = preferences?.preferredChannel || 'email';
    
    if (preferredChannel === 'email' || !customerPhone) {
      const emailResult = await communicationService.sendMessage({
        to: customerEmail,
        channel: 'email',
        type: 'booking_reminder',
        salonId,
        customerId: customerEmail,
        bookingId,
        customContent: {
          subject: 'Appointment Reminder - {{salon_name}}',
          body: `Hi {{customer_name}},\n\nThis is a friendly reminder about your upcoming appointment:\n\n- Service: {{service_name}}\n- Date: {{booking_date}}\n- Time: {{booking_time}}\n- Staff: {{staff_name}}\n\nWe're excited to see you soon!\n\n{{salon_name}}`
        },
        variables
      });
      results.push(emailResult);
    }
    
    if (preferredChannel === 'sms' && customerPhone) {
      const smsResult = await communicationService.sendMessage({
        to: customerPhone,
        channel: 'sms',
        type: 'booking_reminder',
        salonId,
        customerId: customerEmail,
        bookingId,
        customContent: {
          body: `Reminder: You have an appointment at {{salon_name}} tomorrow at {{booking_time}} for {{service_name}} with {{staff_name}}. Looking forward to seeing you!`
        },
        variables
      });
      results.push(smsResult);
    }
  }
  
  return results;
}

export async function sendRescheduleNotification(
  salonId: string,
  bookingId: string,
  customerEmail: string,
  customerPhone?: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse[]> {
  const results: SendMessageResponse[] = [];
  
  // Get customer communication preferences
  const preferences = await storage.getCommunicationPreferences(customerEmail, salonId);
  
  if (preferences?.bookingNotifications !== false) {
    const preferredChannel = preferences?.preferredChannel || 'email';
    
    if (preferredChannel === 'email' || !customerPhone) {
      const emailResult = await communicationService.sendMessage({
        to: customerEmail,
        channel: 'email',
        type: 'booking_rescheduled',
        salonId,
        customerId: customerEmail,
        bookingId,
        customContent: {
          subject: 'Booking Rescheduled - {{salon_name}}',
          body: `Hi {{customer_name}},\n\nYour booking has been rescheduled.\n\nPrevious Time:\nDate: {{old_date}}\nTime: {{old_time}}\n\nNew Time:\nDate: {{new_date}}\nTime: {{new_time}}\n\nService: {{service_name}}\nStaff: {{staff_name}}\nTotal: Rs.{{total_amount}}\n\nThank you for your flexibility!\n\n{{salon_name}}`
        },
        variables
      });
      results.push(emailResult);
    }
    
    if (preferredChannel === 'sms' && customerPhone) {
      const smsResult = await communicationService.sendMessage({
        to: customerPhone,
        channel: 'sms',
        type: 'booking_rescheduled',
        salonId,
        customerId: customerEmail,
        bookingId,
        customContent: {
          body: `Hi {{customer_name}}! Your booking at {{salon_name}} has been rescheduled from {{old_date}} {{old_time}} to {{new_date}} {{new_time}}. Service: {{service_name}}.`
        },
        variables
      });
      results.push(smsResult);
    }
  }
  
  return results;
}

export async function sendOrderConfirmation(
  salonId: string,
  orderId: string,
  customerEmail: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse> {
  return await communicationService.sendMessage({
    to: customerEmail,
    channel: 'email',
    type: 'transactional',
    salonId,
    customerId: customerEmail,
    customContent: {
      subject: 'Order Confirmation #{{order_number}} - {{salon_name}}',
      body: `Hi {{customer_name}},\n\nThank you for your order! Your order has been confirmed and is being prepared.\n\nOrder Details:\nOrder Number: #{{order_number}}\nTotal Items: {{item_count}}\nTotal Amount: Rs.{{total_amount}}\n\nDelivery Address:\n{{delivery_address}}\n\nOrder Items:\n{{order_items}}\n\nPayment Method: {{payment_method}}\nPayment Status: {{payment_status}}\n\nWe'll notify you when your order is ready for pickup/delivery!\n\nThank you for shopping with us!\n\n{{salon_name}}`
    },
    variables
  });
}

export async function sendPaymentSuccess(
  salonId: string,
  orderId: string,
  customerEmail: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse> {
  return await communicationService.sendMessage({
    to: customerEmail,
    channel: 'email',
    type: 'transactional',
    salonId,
    customerId: customerEmail,
    customContent: {
      subject: 'Payment Successful - Order #{{order_number}}',
      body: `Hi {{customer_name}},\n\nYour payment has been successfully processed!\n\nPayment Details:\nOrder Number: #{{order_number}}\nAmount Paid: Rs.{{amount_paid}}\nPayment Method: {{payment_method}}\nTransaction ID: {{transaction_id}}\n\nYour order is now being prepared and you'll receive updates as it progresses.\n\nThank you for your purchase!\n\n{{salon_name}}`
    },
    variables
  });
}

export async function sendPaymentFailure(
  salonId: string,
  orderId: string,
  customerEmail: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse> {
  return await communicationService.sendMessage({
    to: customerEmail,
    channel: 'email',
    type: 'transactional',
    salonId,
    customerId: customerEmail,
    customContent: {
      subject: 'Payment Failed - Order #{{order_number}}',
      body: `Hi {{customer_name}},\n\nWe were unable to process your payment for order #{{order_number}}.\n\nPayment Details:\nOrder Number: #{{order_number}}\nAmount: Rs.{{amount}}\nPayment Method: {{payment_method}}\nReason: {{failure_reason}}\n\nWhat's Next?\n1. Your order has been saved and is on hold\n2. Please retry payment from your Order History\n3. Or contact us if you need assistance\n\nDon't worry - we've reserved your items for the next 24 hours!\n\nNeed help? Reply to this email or contact our support team.\n\n{{salon_name}}`
    },
    variables
  });
}

export async function sendOrderStatusUpdate(
  salonId: string,
  orderId: string,
  customerEmail: string,
  newStatus: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse> {
  const statusMessages: Record<string, { subject: string; body: string }> = {
    processing: {
      subject: 'Order #{{order_number}} is Being Prepared',
      body: `Hi {{customer_name}},\n\nGreat news! Your order is now being prepared.\n\nOrder Number: #{{order_number}}\nStatus: Processing\n\nWe'll notify you once your order is packed and ready!\n\n{{salon_name}}`
    },
    packed: {
      subject: 'Order #{{order_number}} is Packed & Ready',
      body: `Hi {{customer_name}},\n\nYour order has been packed and is ready!\n\nOrder Number: #{{order_number}}\nStatus: Packed\n\n{{#if delivery_method_pickup}}\nPickup Details:\nLocation: {{salon_address}}\nReady for pickup anytime during business hours\n{{else}}\nYour order will be shipped soon!\n{{/if}}\n\n{{salon_name}}`
    },
    shipped: {
      subject: 'Order #{{order_number}} Has Been Shipped',
      body: `Hi {{customer_name}},\n\nYour order is on its way!\n\nOrder Number: #{{order_number}}\nStatus: Shipped\n{{#if tracking_number}}\nTracking Number: {{tracking_number}}\n{{/if}}\nEstimated Delivery: {{estimated_delivery}}\n\nYou can track your order from your Order History page.\n\n{{salon_name}}`
    },
    delivered: {
      subject: 'Order #{{order_number}} Delivered Successfully',
      body: `Hi {{customer_name}},\n\nYour order has been delivered!\n\nOrder Number: #{{order_number}}\nStatus: Delivered\nDelivered On: {{delivered_date}}\n\nWe hope you love your products! If you have any concerns, please contact us within 7 days.\n\nWe'd love your feedback! Please rate your experience and help other customers.\n\nThank you for shopping with us!\n\n{{salon_name}}`
    }
  };

  const statusMessage = statusMessages[newStatus] || {
    subject: 'Order #{{order_number}} Status Update',
    body: `Hi {{customer_name}},\n\nYour order status has been updated.\n\nOrder Number: #{{order_number}}\nNew Status: ${newStatus}\n\n{{salon_name}}`
  };

  return await communicationService.sendMessage({
    to: customerEmail,
    channel: 'email',
    type: 'transactional',
    salonId,
    customerId: customerEmail,
    customContent: statusMessage,
    variables
  });
}

export async function sendOrderCancellation(
  salonId: string,
  orderId: string,
  customerEmail: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse> {
  return await communicationService.sendMessage({
    to: customerEmail,
    channel: 'email',
    type: 'transactional',
    salonId,
    customerId: customerEmail,
    customContent: {
      subject: 'Order #{{order_number}} Cancelled',
      body: `Hi {{customer_name}},\n\nYour order has been cancelled.\n\nOrder Number: #{{order_number}}\nCancellation Reason: {{cancellation_reason}}\nCancelled On: {{cancelled_date}}\n\nRefund Information:\n{{#if refund_applicable}}\nAmount to be Refunded: Rs.{{refund_amount}}\nRefund Method: {{refund_method}}\nExpected in: {{refund_timeline}}\n{{else}}\nNo refund applicable for this order.\n{{/if}}\n\nIf you have any questions, please don't hesitate to contact us.\n\nWe hope to serve you again soon!\n\n{{salon_name}}`
    },
    variables
  });
}

export async function sendLowStockAlert(
  salonId: string,
  adminEmail: string,
  variables: Record<string, string> = {}
): Promise<SendMessageResponse> {
  return await communicationService.sendMessage({
    to: adminEmail,
    channel: 'email',
    type: 'transactional',
    salonId,
    customContent: {
      subject: 'LOW STOCK ALERT - {{product_name}}',
      body: `Hello Admin,\n\nStock Alert: {{product_name}} is running low!\n\nStock Details:\nProduct: {{product_name}}\nCurrent Stock: {{current_stock}} units\nLow Stock Threshold: {{threshold}} units\nRetail Allocated: {{retail_allocated}} units\nService Allocated: {{service_allocated}} units\n\nRecommended Action:\nPlease restock this product soon to avoid running out.\n\nView Product: {{product_link}}\n\nSalonHub Admin`
    },
    variables
  });
}