import cron from 'node-cron';
import { storage } from './storage';
import { communicationService, SendMessageRequest } from './communicationService';
import { ScheduledMessage } from '@shared/schema';

interface SchedulingJob {
  id: string;
  cronExpression: string;
  task: cron.ScheduledTask;
  messageId: string;
}

class SchedulingService {
  private jobs: Map<string, SchedulingJob> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startProcessing();
  }
  
  // Start the main processing loop
  private startProcessing() {
    // Process scheduled messages every minute
    this.processingInterval = setInterval(async () => {
      await this.processScheduledMessages();
    }, 60000); // 1 minute
    
    console.log('Message scheduling service started');
  }
  
  // Stop the processing loop
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Cancel all cron jobs
    this.jobs.forEach(job => {
      job.task.destroy();
    });
    this.jobs.clear();
    
    console.log('Message scheduling service stopped');
  }
  
  // Main processing method to handle scheduled messages
  private async processScheduledMessages() {
    try {
      // Get messages that are due to be sent
      const dueMessages = await storage.getScheduledMessagesDue(new Date());
      
      if (dueMessages.length === 0) {
        return;
      }
      
      console.log(`Processing ${dueMessages.length} scheduled messages`);
      
      // Process each message
      for (const message of dueMessages) {
        await this.processScheduledMessage(message);
      }
      
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  }
  
  // Process a single scheduled message
  private async processScheduledMessage(scheduledMessage: ScheduledMessage) {
    try {
      // Build the send request
      const sendRequest: SendMessageRequest = {
        to: scheduledMessage.recipient,
        channel: scheduledMessage.channel as 'email' | 'sms',
        templateId: scheduledMessage.templateId || undefined,
        customContent: scheduledMessage.templateId ? undefined : {
          subject: scheduledMessage.subject || undefined,
          body: scheduledMessage.content
        },
        variables: scheduledMessage.variables ? JSON.parse(scheduledMessage.variables) : {},
        salonId: scheduledMessage.salonId,
        customerId: scheduledMessage.customerId || undefined,
        bookingId: scheduledMessage.bookingId || undefined,
        campaignId: scheduledMessage.campaignId || undefined,
        type: scheduledMessage.type as any
      };
      
      // Send the message
      const result = await communicationService.sendMessage(sendRequest);
      
      if (result.success) {
        // Mark as sent
        await storage.markScheduledMessageSent(scheduledMessage.id, result.providerId);
        console.log(`Scheduled message ${scheduledMessage.id} sent successfully`);
      } else {
        // Mark as failed
        await storage.markScheduledMessageFailed(scheduledMessage.id, result.error || 'Unknown error');
        console.error(`Failed to send scheduled message ${scheduledMessage.id}:`, result.error);
      }
      
    } catch (error) {
      console.error(`Error processing scheduled message ${scheduledMessage.id}:`, error);
      
      // Mark as failed
      try {
        await storage.markScheduledMessageFailed(
          scheduledMessage.id, 
          error instanceof Error ? error.message : 'Processing error'
        );
      } catch (updateError) {
        console.error('Error updating failed message status:', updateError);
      }
    }
  }
  
  // Schedule a one-time message
  async scheduleMessage(params: {
    salonId: string;
    customerId?: string;
    bookingId?: string;
    campaignId?: string;
    templateId?: string;
    type: string;
    channel: 'email' | 'sms';
    recipient: string;
    subject?: string;
    content: string;
    variables?: Record<string, string>;
    scheduledFor: Date;
  }) {
    const scheduledMessage = await storage.createScheduledMessage({
      salonId: params.salonId,
      customerId: params.customerId || null,
      bookingId: params.bookingId || null,
      campaignId: params.campaignId || null,
      templateId: params.templateId || null,
      type: params.type,
      channel: params.channel,
      recipient: params.recipient,
      subject: params.subject || null,
      content: params.content,
      variables: params.variables ? JSON.stringify(params.variables) : null,
      scheduledFor: params.scheduledFor,
      status: 'scheduled'
    });
    
    return scheduledMessage;
  }
  
  // Schedule recurring campaign messages
  async scheduleRecurringCampaign(params: {
    campaignId: string;
    salonId: string;
    cronExpression: string; // e.g., "0 9 * * *" for daily at 9 AM
    templateId: string;
    segmentId: string;
  }) {
    // Validate cron expression
    if (!cron.validate(params.cronExpression)) {
      throw new Error('Invalid cron expression');
    }
    
    // Create the cron job
    const task = cron.schedule(params.cronExpression, async () => {
      await this.executeCampaignCron(params);
    }, {
      scheduled: false // Don't start immediately
    });
    
    // Store the job
    const jobId = `campaign-${params.campaignId}`;
    this.jobs.set(jobId, {
      id: jobId,
      cronExpression: params.cronExpression,
      task,
      messageId: params.campaignId
    });
    
    // Start the job
    task.start();
    
    return jobId;
  }
  
  // Execute a campaign cron job
  private async executeCampaignCron(params: {
    campaignId: string;
    salonId: string;
    templateId: string;
    segmentId: string;
  }) {
    try {
      console.log(`Executing recurring campaign ${params.campaignId}`);
      
      // Get campaign details
      const campaign = await storage.getCommunicationCampaign(params.campaignId);
      if (!campaign || campaign.status !== 'active') {
        console.log(`Campaign ${params.campaignId} is not active, skipping`);
        return;
      }
      
      // Get customers in segment
      const customers = await storage.getCustomersInSegment(params.segmentId, params.salonId);
      
      // Schedule messages for each customer
      for (const customer of customers) {
        if (customer.email) {
          await this.scheduleMessage({
            salonId: params.salonId,
            customerId: customer.id,
            campaignId: params.campaignId,
            templateId: params.templateId,
            type: 'campaign',
            channel: 'email',
            recipient: customer.email,
            content: '',
            scheduledFor: new Date() // Send immediately
          });
        }
      }
      
      console.log(`Scheduled ${customers.length} messages for campaign ${params.campaignId}`);
      
    } catch (error) {
      console.error(`Error executing campaign cron ${params.campaignId}:`, error);
    }
  }
  
  // Cancel a recurring job
  cancelRecurringJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.task.destroy();
      this.jobs.delete(jobId);
      return true;
    }
    return false;
  }
  
  // Schedule booking reminders
  async scheduleBookingReminders(bookingId: string) {
    try {
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      // Get customer preferences
      const preferences = await storage.getCommunicationPreferences(booking.customerEmail, booking.salonId);
      
      if (preferences?.bookingNotifications === false) {
        console.log(`Customer ${booking.customerEmail} has disabled booking notifications`);
        return;
      }
      
      const bookingDate = new Date(booking.date);
      const salon = await storage.getSalon(booking.salonId);
      const service = await storage.getService(booking.serviceId);
      
      // Variables for template substitution
      const variables = {
        customer_name: booking.customerName,
        salon_name: salon?.name || 'Your Salon',
        service_name: service?.name || 'Service',
        booking_date: bookingDate.toLocaleDateString(),
        booking_time: booking.time,
        staff_name: booking.staffId ? 'Your stylist' : 'Our team' // Would need to get actual staff name
      };
      
      // Schedule 24-hour reminder
      const reminder24h = new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000);
      if (reminder24h > new Date()) {
        await this.scheduleMessage({
          salonId: booking.salonId,
          customerId: booking.customerEmail,
          bookingId: booking.id,
          type: 'booking_reminder',
          channel: preferences?.preferredChannel as 'email' | 'sms' || 'email',
          recipient: booking.customerEmail,
          subject: 'Appointment Reminder - {{salon_name}}',
          content: 'Hi {{customer_name}}, you have an appointment tomorrow at {{booking_time}} for {{service_name}}. We look forward to seeing you!',
          variables,
          scheduledFor: reminder24h
        });
      }
      
      // Schedule 2-hour reminder
      const reminder2h = new Date(bookingDate.getTime() - 2 * 60 * 60 * 1000);
      if (reminder2h > new Date()) {
        await this.scheduleMessage({
          salonId: booking.salonId,
          customerId: booking.customerEmail,
          bookingId: booking.id,
          type: 'booking_reminder',
          channel: 'sms', // SMS for urgent reminders
          recipient: booking.customerEmail, // Would use phone if available
          content: 'Reminder: Appointment at {{salon_name}} in 2 hours ({{booking_time}}) for {{service_name}}',
          variables,
          scheduledFor: reminder2h
        });
      }
      
      console.log(`Scheduled reminders for booking ${bookingId}`);
      
    } catch (error) {
      console.error('Error scheduling booking reminders:', error);
    }
  }
  
  // Get status of all jobs
  getJobStatus() {
    const status = [];
    for (const [id, job] of this.jobs) {
      status.push({
        id,
        cronExpression: job.cronExpression,
        running: job.task.getStatus() === 'scheduled',
        messageId: job.messageId
      });
    }
    return status;
  }
}

// Export singleton instance
export const schedulingService = new SchedulingService();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down scheduling service...');
  schedulingService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down scheduling service...');
  schedulingService.stop();
  process.exit(0);
});