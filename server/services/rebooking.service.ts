import { storage } from '../storage';
import { communicationService } from '../communicationService';
import type {
  ServiceRebookingCycle,
  CustomerRebookingStat,
  RebookingReminder,
  RebookingSettings,
  Booking,
  Service,
  InsertCustomerRebookingStat,
  InsertRebookingReminder,
  RebookingSuggestion
} from '@shared/schema';

interface RebookingCalculation {
  nextDueDate: Date;
  status: 'not_due' | 'approaching' | 'due' | 'overdue';
  daysUntilDue: number;
}

class RebookingService {
  
  async calculateNextRebookingDate(
    lastBookingDate: Date,
    serviceCycle: ServiceRebookingCycle | null,
    salonSettings: RebookingSettings | null
  ): Promise<RebookingCalculation> {
    const recommendedDays = serviceCycle?.recommendedDays 
      || salonSettings?.defaultRecommendedDays 
      || 30;
    
    const minDays = serviceCycle?.minDays 
      || salonSettings?.defaultMinDays 
      || 14;

    const nextDueDate = new Date(lastBookingDate);
    nextDueDate.setDate(nextDueDate.getDate() + recommendedDays);

    const now = new Date();
    const daysUntilDue = Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: 'not_due' | 'approaching' | 'due' | 'overdue' = 'not_due';
    
    if (daysUntilDue < 0) {
      status = 'overdue';
    } else if (daysUntilDue <= 7) {
      status = 'due';
    } else if (daysUntilDue <= minDays) {
      status = 'approaching';
    }

    return { nextDueDate, status, daysUntilDue };
  }

  async updateCustomerStatsAfterBooking(booking: Booking): Promise<void> {
    if (!booking.salonId || !booking.customerId) return;

    const bookingServices = await storage.getBookingServicesByBookingId(booking.id);
    if (!bookingServices || bookingServices.length === 0) return;

    const salonSettings = await storage.getRebookingSettings(booking.salonId);

    for (const bs of bookingServices) {
      const serviceCycle = await storage.getServiceRebookingCycleBySalonAndService(
        booking.salonId,
        bs.serviceId
      );

      const existingStat = await storage.getCustomerRebookingStatByKeys(
        booking.salonId,
        booking.customerId,
        bs.serviceId
      );

      const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
      const { nextDueDate, status } = await this.calculateNextRebookingDate(
        bookingDate,
        serviceCycle || null,
        salonSettings || null
      );

      let avgDaysBetweenBookings: string | null = null;
      if (existingStat?.lastBookingDate) {
        const daysSinceLast = Math.floor(
          (bookingDate.getTime() - new Date(existingStat.lastBookingDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const totalBookings = (existingStat.totalBookings || 0) + 1;
        const currentAvg = existingStat.avgDaysBetweenBookings 
          ? parseFloat(existingStat.avgDaysBetweenBookings) 
          : daysSinceLast;
        avgDaysBetweenBookings = ((currentAvg * (totalBookings - 1) + daysSinceLast) / totalBookings).toFixed(2);
      }

      const preferredDayOfWeek = bookingDate.getDay();
      const hour = parseInt(booking.bookingTime?.split(':')[0] || '12');
      const preferredTimeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      const statData: InsertCustomerRebookingStat = {
        salonId: booking.salonId,
        customerId: booking.customerId,
        serviceId: bs.serviceId,
        totalBookings: (existingStat?.totalBookings || 0) + 1,
        lastBookingId: booking.id,
        lastBookingDate: bookingDate,
        nextRebookingDue: nextDueDate,
        rebookingStatus: status,
        avgDaysBetweenBookings,
        preferredDayOfWeek,
        preferredTimeSlot,
        preferredStaffId: booking.staffId || existingStat?.preferredStaffId || null,
        rebookingsFromReminders: existingStat?.rebookingsFromReminders || 0
      };

      await storage.upsertCustomerRebookingStat(statData);

      if (existingStat?.lastReminderSentAt) {
        const recentReminders = await storage.getRebookingRemindersBySalonId(booking.salonId, {
          status: 'sent'
        });
        
        for (const reminder of recentReminders) {
          if (reminder.customerId === booking.customerId && 
              reminder.serviceId === bs.serviceId &&
              !reminder.convertedAt) {
            await storage.markReminderConverted(reminder.id, booking.id);
            
            if (existingStat) {
              await storage.updateCustomerRebookingStat(existingStat.id, {
                rebookingsFromReminders: (existingStat.rebookingsFromReminders || 0) + 1
              });
            }
            break;
          }
        }
      }
    }
  }

  async identifyDueRebookings(salonId: string): Promise<CustomerRebookingStat[]> {
    const settings = await storage.getRebookingSettings(salonId);
    if (!settings?.isEnabled) return [];

    const dueStats = await storage.getDueRebookings(salonId);
    
    return dueStats.filter(stat => {
      if (stat.dismissUntil && new Date(stat.dismissUntil) > new Date()) {
        return false;
      }
      
      const maxReminders = settings.maxRemindersPerService || 2;
      if ((stat.remindersReceived || 0) >= maxReminders) {
        return false;
      }

      return true;
    });
  }

  async scheduleReminders(salonId: string): Promise<number> {
    const dueStats = await this.identifyDueRebookings(salonId);
    const settings = await storage.getOrCreateRebookingSettings(salonId);
    let scheduledCount = 0;

    for (const stat of dueStats) {
      try {
        const serviceCycle = await storage.getServiceRebookingCycleBySalonAndService(
          salonId,
          stat.serviceId
        );

        if (serviceCycle && !serviceCycle.reminderEnabled) continue;

        const channels = serviceCycle?.reminderChannels 
          || settings.defaultReminderChannels 
          || ['email'];

        const customer = await storage.getUserById(stat.customerId);
        const service = await storage.getService(stat.serviceId);
        const salon = await storage.getSalon(salonId);

        if (!customer || !service || !salon) continue;

        const reminderType = (stat.remindersReceived || 0) === 0 ? 'first' : 'second';
        
        let scheduledAt = new Date();
        if (settings.quietHoursStart && settings.quietHoursEnd) {
          scheduledAt = this.adjustForQuietHours(scheduledAt, settings.quietHoursStart, settings.quietHoursEnd);
        }

        for (const channel of channels) {
          if (channel === 'email' && !customer.email) continue;
          if (channel === 'sms' && !customer.phone) continue;

          const existingReminder = await this.findExistingPendingReminder(
            salonId, stat.customerId, stat.serviceId, channel
          );
          if (existingReminder) continue;

          const { subject, body } = this.generateReminderContent(
            customer,
            service,
            salon,
            stat,
            serviceCycle,
            settings,
            channel as 'email' | 'sms'
          );

          const reminder: InsertRebookingReminder = {
            salonId,
            customerId: stat.customerId,
            serviceId: stat.serviceId,
            customerStatId: stat.id,
            reminderType,
            channel,
            subject,
            messageBody: body,
            scheduledAt,
            status: 'scheduled'
          };

          await storage.createRebookingReminder(reminder);
          scheduledCount++;
        }
      } catch (error) {
        console.error(`Error scheduling reminder for stat ${stat.id}:`, error);
      }
    }

    return scheduledCount;
  }

  async sendReminder(reminderId: string): Promise<boolean> {
    const reminder = await storage.getRebookingReminder(reminderId);
    if (!reminder || reminder.status !== 'scheduled') return false;

    try {
      const customer = await storage.getUserById(reminder.customerId);
      if (!customer) {
        await storage.markReminderFailed(reminderId, 'Customer not found');
        return false;
      }

      const recipient = reminder.channel === 'email' ? customer.email : customer.phone;
      if (!recipient) {
        await storage.markReminderFailed(reminderId, `No ${reminder.channel} contact available`);
        return false;
      }

      const isEmail = reminder.channel === 'email';
      const messageBody = reminder.messageBody || '';
      
      const result = await communicationService.sendMessage({
        to: recipient,
        channel: reminder.channel as 'email' | 'sms',
        type: 'transactional',
        salonId: reminder.salonId,
        customContent: {
          subject: reminder.subject || 'Time for your next appointment!',
          body: isEmail ? this.stripHtmlForPlainText(messageBody) : messageBody,
          html: isEmail ? messageBody : undefined
        }
      });

      if (result.success) {
        await storage.markReminderSent(reminderId, result.messageId);
        await storage.incrementRebookingRemindersReceived(reminder.customerStatId!);
        return true;
      } else {
        await storage.markReminderFailed(reminderId, result.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await storage.markReminderFailed(reminderId, errorMessage);
      return false;
    }
  }

  async processPendingReminders(batchSize: number = 50): Promise<{ sent: number; failed: number }> {
    const pendingReminders = await storage.getPendingRebookingReminders(batchSize);
    let sent = 0;
    let failed = 0;

    for (const reminder of pendingReminders) {
      const success = await this.sendReminder(reminder.id);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    return { sent, failed };
  }

  async getCustomerSuggestions(customerId: string, salonId?: string): Promise<RebookingSuggestion[]> {
    const stats = await storage.getCustomerRebookingStatsByCustomerId(customerId, {
      salonId,
      status: undefined
    });

    const suggestions: RebookingSuggestion[] = [];

    for (const stat of stats) {
      if (!['approaching', 'due', 'overdue'].includes(stat.rebookingStatus)) continue;

      if (stat.dismissUntil && new Date(stat.dismissUntil) > new Date()) continue;

      const service = await storage.getService(stat.serviceId);
      if (!service) continue;

      const salon = await storage.getSalon(stat.salonId);
      if (!salon) continue;

      const settings = await storage.getRebookingSettings(stat.salonId);
      const daysOverdue = stat.nextRebookingDue 
        ? Math.floor((new Date().getTime() - new Date(stat.nextRebookingDue).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let staffName: string | undefined;
      if (stat.preferredStaffId) {
        const staff = await storage.getStaff(stat.preferredStaffId);
        staffName = staff?.name || undefined;
      }

      const discountAvailable = settings?.enableRebookingDiscount === 1 && 
        daysOverdue >= 0 && 
        daysOverdue <= (settings.discountValidDays || 7);

      const daysSinceLastBooking = stat.lastBookingDate
        ? Math.floor((new Date().getTime() - new Date(stat.lastBookingDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const serviceCycle = await storage.getServiceRebookingCycleBySalonAndService(stat.salonId, stat.serviceId);
      const recommendedDays = serviceCycle?.rebookingDays || settings?.defaultRebookingDays || 30;

      suggestions.push({
        id: `${stat.salonId}-${stat.serviceId}-${customerId}`,
        serviceId: stat.serviceId,
        serviceName: service.name,
        salonId: stat.salonId,
        salonName: salon.name,
        lastBookingDate: stat.lastBookingDate?.toISOString() || '',
        daysSinceLastBooking,
        recommendedDays,
        dueDate: stat.nextRebookingDue?.toISOString() || '',
        daysOverdue: Math.max(0, daysOverdue),
        status: stat.rebookingStatus as 'approaching' | 'due' | 'overdue',
        preferredStaffId: stat.preferredStaffId || undefined,
        preferredStaffName: staffName,
        preferredDayOfWeek: stat.preferredDayOfWeek || undefined,
        preferredTimeSlot: stat.preferredTimeSlot || undefined,
        discountAvailable,
        discountPercent: discountAvailable ? parseFloat(settings?.rebookingDiscountPercent || '0') : undefined
      });
    }

    return suggestions.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  async dismissRebooking(
    customerId: string,
    serviceId: string,
    salonId: string,
    reason: string,
    snoozeDays?: number
  ): Promise<void> {
    const stat = await storage.getCustomerRebookingStatByKeys(salonId, customerId, serviceId);
    if (!stat) return;

    let dismissUntil: Date | undefined;
    if (reason === 'snooze' && snoozeDays) {
      dismissUntil = new Date();
      dismissUntil.setDate(dismissUntil.getDate() + snoozeDays);
    }

    await storage.dismissCustomerRebooking(stat.id, dismissUntil);

    const pendingReminders = await storage.getRebookingRemindersBySalonId(salonId, {
      status: 'scheduled'
    });

    for (const reminder of pendingReminders) {
      if (reminder.customerId === customerId && reminder.serviceId === serviceId) {
        await storage.dismissRebookingReminder(reminder.id, reason);
      }
    }
  }

  async updateRebookingStatuses(salonId: string): Promise<number> {
    const stats = await storage.getCustomerRebookingStatsBySalonId(salonId);
    let updatedCount = 0;

    for (const stat of stats) {
      if (stat.rebookingStatus === 'dismissed' || stat.rebookingStatus === 'booked') continue;

      const settings = await storage.getRebookingSettings(salonId);
      const serviceCycle = await storage.getServiceRebookingCycleBySalonAndService(salonId, stat.serviceId);

      if (!stat.lastBookingDate) continue;

      const { status } = await this.calculateNextRebookingDate(
        new Date(stat.lastBookingDate),
        serviceCycle || null,
        settings || null
      );

      if (status !== stat.rebookingStatus) {
        await storage.updateCustomerRebookingStatus(stat.id, status);
        updatedCount++;
      }
    }

    return updatedCount;
  }

  private adjustForQuietHours(date: Date, quietStart: string, quietEnd: string): Date {
    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    
    const hour = date.getHours();
    const minute = date.getMinutes();
    const currentMinutes = hour * 60 + minute;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes <= endMinutes) {
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        date.setHours(endHour, endMin, 0, 0);
      }
    } else {
      if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
        date.setHours(endHour, endMin, 0, 0);
        if (currentMinutes >= startMinutes) {
          date.setDate(date.getDate() + 1);
        }
      }
    }

    return date;
  }

  private async findExistingPendingReminder(
    salonId: string,
    customerId: string,
    serviceId: string,
    channel: string
  ): Promise<RebookingReminder | null> {
    const reminders = await storage.getRebookingRemindersBySalonId(salonId, {
      status: 'scheduled',
      channel
    });

    return reminders.find(r => 
      r.customerId === customerId && r.serviceId === serviceId
    ) || null;
  }

  private getBaseUrl(): string {
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    }
    return 'http://localhost:5000';
  }

  private generateBookingUrl(salonId: string, serviceId: string, preferredStaffId?: string | null): string {
    const baseUrl = this.getBaseUrl();
    let url = `${baseUrl}/salons/${salonId}/book?serviceId=${serviceId}`;
    if (preferredStaffId) {
      url += `&staffId=${preferredStaffId}`;
    }
    return url;
  }

  private generateReminderContent(
    customer: any,
    service: Service,
    salon: any,
    stat: CustomerRebookingStat,
    serviceCycle: ServiceRebookingCycle | null,
    settings: RebookingSettings,
    channel: 'email' | 'sms' = 'email'
  ): { subject: string; body: string } {
    const customerName = customer.firstName || 'Valued Customer';
    const serviceName = service.name;
    const salonName = salon.name;
    const bookingUrl = this.generateBookingUrl(salon.id, service.id, stat.preferredStaffId);

    const daysOverdue = stat.nextRebookingDue
      ? Math.floor((new Date().getTime() - new Date(stat.nextRebookingDue).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    let discountText = '';
    let discountPercent = 0;
    if (settings.enableRebookingDiscount === 1 && parseFloat(settings.rebookingDiscountPercent || '0') > 0) {
      discountPercent = parseFloat(settings.rebookingDiscountPercent || '0');
      discountText = `${discountPercent}% off`;
    }

    if (channel === 'sms') {
      return this.generateSMSContent(customerName, serviceName, salonName, bookingUrl, daysOverdue, discountText);
    }

    return this.generateEmailContent(customerName, serviceName, salonName, salon, bookingUrl, daysOverdue, discountPercent, serviceCycle);
  }

  private generateSMSContent(
    customerName: string,
    serviceName: string,
    salonName: string,
    bookingUrl: string,
    daysOverdue: number,
    discountText: string
  ): { subject: string; body: string } {
    let message = '';
    
    if (daysOverdue > 14) {
      message = `Hi ${customerName}! We miss you at ${salonName}. Time for your ${serviceName}?`;
    } else if (daysOverdue > 0) {
      message = `Hi ${customerName}! Your ${serviceName} at ${salonName} is due.`;
    } else {
      message = `Hi ${customerName}! It's almost time for your next ${serviceName} at ${salonName}.`;
    }

    if (discountText) {
      message += ` Get ${discountText} when you book now!`;
    }

    message += ` Book now: ${bookingUrl}`;

    return {
      subject: '',
      body: message
    };
  }

  private generateEmailContent(
    customerName: string,
    serviceName: string,
    salonName: string,
    salon: any,
    bookingUrl: string,
    daysOverdue: number,
    discountPercent: number,
    serviceCycle: ServiceRebookingCycle | null
  ): { subject: string; body: string } {
    let urgencyHeadline = '';
    let urgencyText = '';
    
    if (daysOverdue > 14) {
      urgencyHeadline = "We miss you!";
      urgencyText = "It's been a while since your last visit and we'd love to see you again.";
    } else if (daysOverdue > 0) {
      urgencyHeadline = "Time for your next visit";
      urgencyText = "Your next appointment is due. Let's keep you looking and feeling your best!";
    } else {
      urgencyHeadline = "Coming up soon";
      urgencyText = "It's almost time for your next appointment. Book ahead to secure your preferred time slot.";
    }

    if (serviceCycle?.customMessage) {
      const customBody = serviceCycle.customMessage
        .replace(/\{customerName\}/g, customerName)
        .replace(/\{serviceName\}/g, serviceName)
        .replace(/\{salonName\}/g, salonName)
        .replace(/\{bookingUrl\}/g, bookingUrl);
      
      return {
        subject: `Time for your next ${serviceName} at ${salonName}`,
        body: this.wrapInEmailTemplate(customBody, salonName, bookingUrl, discountPercent)
      };
    }

    const discountBanner = discountPercent > 0 ? `
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
        <span style="font-size: 18px; font-weight: bold;">Special Offer: ${discountPercent}% OFF your next visit!</span>
      </div>
    ` : '';

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Time for your next ${serviceName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">${salonName}</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <!-- Greeting -->
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">Hi ${customerName},</p>
            
            <!-- Urgency Banner -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 10px 0;">${urgencyHeadline}</h2>
              <p style="color: #6b7280; font-size: 16px; margin: 0; line-height: 1.5;">${urgencyText}</p>
            </div>
            
            ${discountBanner}
            
            <!-- Service Card -->
            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
              <p style="color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0;">Recommended Service</p>
              <h3 style="color: #1f2937; font-size: 20px; margin: 0; font-weight: 600;">${serviceName}</h3>
            </div>
            
            <!-- Book Now Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${bookingUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                        color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                        font-size: 18px; font-weight: 600; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);">
                Book Now
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
              Click the button above or copy this link:<br>
              <a href="${bookingUrl}" style="color: #8b5cf6; word-break: break-all;">${bookingUrl}</a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 10px 0;">
              You're receiving this because you're a valued customer of ${salonName}.
            </p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              ${salon.address || ''}<br>
              ${salon.phone || ''}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject: `Time for your next ${serviceName} at ${salonName}`,
      body: htmlBody
    };
  }

  private stripHtmlForPlainText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private wrapInEmailTemplate(content: string, salonName: string, bookingUrl: string, discountPercent: number): string {
    const discountBanner = discountPercent > 0 ? `
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
        <span style="font-size: 18px; font-weight: bold;">Special Offer: ${discountPercent}% OFF your next visit!</span>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message from ${salonName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; font-size: 28px; margin: 0; font-weight: 600;">${salonName}</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            ${discountBanner}
            
            <div style="color: #374151; font-size: 16px; line-height: 1.6;">
              ${content.replace(/\n/g, '<br>')}
            </div>
            
            <!-- Book Now Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${bookingUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); 
                        color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; 
                        font-size: 18px; font-weight: 600; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);">
                Book Now
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
              You're receiving this because you're a valued customer of ${salonName}.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const rebookingService = new RebookingService();
