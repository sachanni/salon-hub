import { db } from "../db";
import {
  departureAlerts,
  userNotifications,
  userPushTokens,
  bookings,
  salons,
  staff,
  users,
  customerDeparturePreferences,
  departureAlertSettings,
  type DepartureAlert,
} from "@shared/schema";
import { eq, and, lte, gte, inArray, sql, isNull } from "drizzle-orm";
import { sendMessage } from "./twilioService";
import { departureCalculatorService } from "./departureCalculator.service";
import { queueSocketService } from "./queueSocket.service";

const NOTIFICATION_TEMPLATES = {
  initial_reminder: {
    title: "Time to get ready!",
    body: "Your appointment at {salonName} is at {time}. Leave by {departureTime} to arrive on time.",
  },
  on_time: {
    title: "Your appointment is on schedule",
    body: "Your {time} appointment at {salonName} is on track. Suggested departure: {departureTime}",
  },
  delay_update: {
    title: "Schedule Update",
    body: "Your stylist {staffName} is running ~{delay} min behind. New suggested departure: {departureTime}",
  },
  earlier_available: {
    title: "Good news!",
    body: "Your stylist is ahead of schedule! You can leave {minutes} min earlier if convenient.",
  },
  staff_change: {
    title: "Staff Update",
    body: "{originalStaff} is unavailable. {newStaff} will serve you at {time}. Tap to confirm.",
  },
};

export class DepartureNotificationService {

  private getISTDate(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  }

  private getISTTimeString(): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date());
  }

  private parseTimeString(time: string): { hours: number; minutes: number } | null {
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return { hours, minutes };
  }

  private timeToMinutes(time: string): number {
    const parsed = this.parseTimeString(time);
    if (!parsed) return 0;
    return parsed.hours * 60 + parsed.minutes;
  }

  private formatTimeFor12Hour(time: string): string {
    const parsed = this.parseTimeString(time);
    if (!parsed) return time;
    const period = parsed.hours >= 12 ? 'PM' : 'AM';
    const displayHours = parsed.hours % 12 || 12;
    return `${displayHours}:${parsed.minutes.toString().padStart(2, '0')} ${period}`;
  }

  private formatNotificationMessage(
    template: { title: string; body: string },
    params: Record<string, string | number>
  ): { title: string; body: string } {
    let title = template.title;
    let body = template.body;

    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return { title, body };
  }

  async sendDepartureAlert(alertId: string): Promise<boolean> {
    try {
      const alert = await db.query.departureAlerts.findFirst({
        where: eq(departureAlerts.id, alertId),
      });

      if (!alert) {
        console.error('Departure alert not found:', alertId);
        return false;
      }

      if (alert.notificationSent === 1) {
        console.log('Notification already sent for alert:', alertId);
        return true;
      }

      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, alert.bookingId),
        with: {
          salon: true,
          staff: true,
        },
      });

      if (!booking) {
        console.error('Booking not found for alert:', alertId);
        return false;
      }

      const templateKey = alert.alertType as keyof typeof NOTIFICATION_TEMPLATES;
      const template = NOTIFICATION_TEMPLATES[templateKey] || NOTIFICATION_TEMPLATES.on_time;

      const { title, body } = this.formatNotificationMessage(template, {
        salonName: booking.salon?.name || 'the salon',
        time: this.formatTimeFor12Hour(alert.originalBookingTime),
        departureTime: this.formatTimeFor12Hour(alert.suggestedDepartureTime),
        staffName: booking.staff?.name || 'your stylist',
        delay: alert.delayMinutes,
        minutes: Math.abs(alert.delayMinutes),
      });

      await db.insert(userNotifications).values({
        userId: alert.userId,
        title,
        message: body,
        type: 'departure_alert',
        referenceId: alert.bookingId,
        referenceType: 'booking',
        isRead: 0,
      });

      const customerPrefs = await db.query.customerDeparturePreferences.findFirst({
        where: eq(customerDeparturePreferences.userId, alert.userId),
      });

      const preferredChannel = customerPrefs?.preferredChannel || 'push';
      let sentVia = 'in_app';
      let messageId: string | null = null;

      if (preferredChannel === 'sms' || preferredChannel === 'all') {
        const user = await db.query.users.findFirst({
          where: eq(users.id, alert.userId),
        });

        if (user?.phone) {
          try {
            const smsResult = await sendMessage({
              to: user.phone,
              message: `${title}\n\n${body}`,
              channel: 'sms',
            });
            if (smsResult.success) {
              sentVia = 'sms';
              messageId = smsResult.messageSid || null;
            }
          } catch (error) {
            console.error('Error sending SMS:', error);
          }
        }
      }

      await db.update(departureAlerts)
        .set({
          notificationSent: 1,
          sentAt: new Date(),
          sentVia,
          messageId,
          updatedAt: new Date(),
        })
        .where(eq(departureAlerts.id, alertId));

      queueSocketService.emitDepartureStatusUpdate(alert.userId, alert.bookingId, {
        bookingId: alert.bookingId,
        userId: alert.userId,
        originalTime: alert.originalBookingTime,
        predictedStartTime: alert.predictedStartTime,
        delayMinutes: alert.delayMinutes,
        delayReason: alert.delayReason || undefined,
        suggestedDepartureTime: alert.suggestedDepartureTime,
        staffName: booking.staff?.name || undefined,
        staffStatus: undefined,
        appointmentsAhead: undefined,
      });

      return true;
    } catch (error) {
      console.error('Error sending departure alert:', error);
      return false;
    }
  }

  async processPendingAlerts(): Promise<{ processed: number; sent: number; errors: number }> {
    const results = { processed: 0, sent: 0, errors: 0 };
    
    try {
      const today = this.getISTDate();
      const currentTime = this.getISTTimeString();
      const currentMinutes = this.timeToMinutes(currentTime);

      const pendingAlerts = await db.select()
        .from(departureAlerts)
        .where(and(
          eq(departureAlerts.bookingDate, today),
          eq(departureAlerts.notificationSent, 0),
          eq(departureAlerts.customerAcknowledged, 0)
        ));

      for (const alert of pendingAlerts) {
        results.processed++;

        const departureMinutes = this.timeToMinutes(alert.suggestedDepartureTime);
        const minutesUntilDeparture = departureMinutes - currentMinutes;

        const settings = await departureCalculatorService.getSalonDepartureSettings(alert.salonId);
        const sendWindowMinutes = settings.firstAlertMinutesBefore;

        if (minutesUntilDeparture <= sendWindowMinutes && minutesUntilDeparture > -30) {
          const success = await this.sendDepartureAlert(alert.id);
          if (success) {
            results.sent++;
          } else {
            results.errors++;
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing pending alerts:', error);
      return results;
    }
  }

  async recalculateAndUpdateAlerts(): Promise<{ updated: number; created: number; errors: number }> {
    const results = { updated: 0, created: 0, errors: 0 };

    try {
      const today = this.getISTDate();
      const currentTime = this.getISTTimeString();
      const currentMinutes = this.timeToMinutes(currentTime);

      const upcomingBookings = await db.select({
        id: bookings.id,
        bookingTime: bookings.bookingTime,
        salonId: bookings.salonId,
      })
        .from(bookings)
        .where(and(
          eq(bookings.bookingDate, today),
          inArray(bookings.status, ['confirmed', 'pending']),
          gte(bookings.bookingTime, currentTime)
        ));

      for (const booking of upcomingBookings) {
        try {
          const bookingMinutes = this.timeToMinutes(booking.bookingTime);
          const minutesUntilBooking = bookingMinutes - currentMinutes;

          if (minutesUntilBooking <= 180 && minutesUntilBooking > 0) {
            const recommendation = await departureCalculatorService.calculateDepartureTime(booking.id);
            
            if (recommendation) {
              const existingAlert = await db.query.departureAlerts.findFirst({
                where: and(
                  eq(departureAlerts.bookingId, booking.id),
                  eq(departureAlerts.bookingDate, today)
                ),
              });

              await departureCalculatorService.createOrUpdateDepartureAlert(recommendation);
              
              if (existingAlert) {
                results.updated++;
              } else {
                results.created++;
              }
            }
          }
        } catch (error) {
          console.error('Error processing booking:', booking.id, error);
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('Error recalculating alerts:', error);
      return results;
    }
  }

  async acknowledgeAlert(
    alertId: string,
    userId: string,
    response: 'acknowledged' | 'will_be_late' | 'reschedule' | 'cancel',
    actualDepartureTime?: string
  ): Promise<boolean> {
    try {
      const alert = await db.query.departureAlerts.findFirst({
        where: and(
          eq(departureAlerts.id, alertId),
          eq(departureAlerts.userId, userId)
        ),
      });

      if (!alert) {
        return false;
      }

      await db.update(departureAlerts)
        .set({
          customerAcknowledged: 1,
          acknowledgedAt: new Date(),
          customerResponse: response,
          actualDepartureTime: actualDepartureTime || null,
          updatedAt: new Date(),
        })
        .where(eq(departureAlerts.id, alertId));

      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  async getAlertsForUser(userId: string, date?: string): Promise<DepartureAlert[]> {
    try {
      const targetDate = date || this.getISTDate();

      return await db.select()
        .from(departureAlerts)
        .where(and(
          eq(departureAlerts.userId, userId),
          eq(departureAlerts.bookingDate, targetDate)
        ));
    } catch (error) {
      console.error('Error getting user alerts:', error);
      return [];
    }
  }

  async sendDelayUpdateIfNeeded(bookingId: string, previousDelay: number, newDelay: number): Promise<boolean> {
    try {
      const delayChange = newDelay - previousDelay;
      
      if (Math.abs(delayChange) < 10) {
        return false;
      }

      const today = this.getISTDate();
      const alert = await db.query.departureAlerts.findFirst({
        where: and(
          eq(departureAlerts.bookingId, bookingId),
          eq(departureAlerts.bookingDate, today)
        ),
      });

      if (!alert) {
        return false;
      }

      if (alert.notificationSent === 0) {
        return false;
      }

      const recommendation = await departureCalculatorService.calculateDepartureTime(bookingId);
      if (!recommendation) {
        return false;
      }

      recommendation.alertType = delayChange < 0 ? 'earlier_available' : 'delay_update';

      await departureCalculatorService.createOrUpdateDepartureAlert(recommendation);

      const updatedAlert = await db.query.departureAlerts.findFirst({
        where: and(
          eq(departureAlerts.bookingId, bookingId),
          eq(departureAlerts.bookingDate, today)
        ),
      });

      if (updatedAlert) {
        await this.sendDepartureAlert(updatedAlert.id);
        
        if (delayChange > 0) {
          queueSocketService.emitDelayAlert(updatedAlert.userId, bookingId, {
            delayMinutes: newDelay,
            newDepartureTime: recommendation.suggestedDepartureTime,
            reason: recommendation.delayReason || undefined,
          });
        } else if (delayChange < 0) {
          queueSocketService.emitQueueCaughtUp(updatedAlert.userId, bookingId, {
            newDepartureTime: recommendation.suggestedDepartureTime,
            minutesSaved: Math.abs(delayChange),
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending delay update:', error);
      return false;
    }
  }
}

export const departureNotificationService = new DepartureNotificationService();
