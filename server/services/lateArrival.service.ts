import { db } from '../db';
import { 
  lateArrivalNotifications, 
  bookings, 
  salons, 
  users,
  userNotifications,
  LATE_ARRIVAL_DELAY_OPTIONS,
  type LateArrivalNotification,
  type InsertLateArrivalNotification,
} from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { sendMessage } from './twilioService';

interface CreateLateNotificationInput {
  bookingId: string;
  estimatedDelayMinutes: number;
  customerMessage?: string;
}

interface AcknowledgeLateArrivalInput {
  response: 'acknowledged' | 'rescheduled' | 'cancelled';
  responseNote?: string;
}

interface LateNotificationResult {
  success: boolean;
  notification?: LateArrivalNotification;
  error?: string;
}

const IST_TIMEZONE = 'Asia/Kolkata';

function getISTDate(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function getISTTimeString(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

function parseTimeString(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function calculateEstimatedArrivalTime(bookingTime: string, delayMinutes: number): string {
  const parsed = parseTimeString(bookingTime);
  if (!parsed) return bookingTime;
  const totalMinutes = parsed.hours * 60 + parsed.minutes + delayMinutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

function hasBookingTimePassed(bookingTime: string): boolean {
  const parsed = parseTimeString(bookingTime);
  if (!parsed) return false;
  
  const currentTime = getISTTimeString();
  const currentParsed = parseTimeString(currentTime);
  if (!currentParsed) return false;
  
  const bookingMinutes = parsed.hours * 60 + parsed.minutes;
  const currentMinutes = currentParsed.hours * 60 + currentParsed.minutes;
  
  return currentMinutes > bookingMinutes + 60;
}

function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

class LateArrivalService {
  async createLateNotification(
    userId: string,
    input: CreateLateNotificationInput
  ): Promise<LateNotificationResult> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, input.bookingId),
        with: {
          salon: true,
        },
      });

      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      if (booking.userId !== userId) {
        return { success: false, error: 'You can only notify for your own bookings' };
      }

      if (booking.status !== 'confirmed' && booking.status !== 'pending') {
        return { success: false, error: 'Cannot send late notification for this booking status' };
      }

      const today = getISTDate();
      if (booking.bookingDate !== today) {
        return { success: false, error: 'Late notifications can only be sent for today\'s bookings' };
      }

      if (hasBookingTimePassed(booking.bookingTime)) {
        return { success: false, error: 'Your appointment time has already passed' };
      }

      const validDelay = LATE_ARRIVAL_DELAY_OPTIONS.find(
        opt => opt.value === input.estimatedDelayMinutes
      );
      if (!validDelay) {
        return { success: false, error: 'Invalid delay time selected' };
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentNotification = await db.query.lateArrivalNotifications.findFirst({
        where: and(
          eq(lateArrivalNotifications.bookingId, input.bookingId),
          gte(lateArrivalNotifications.createdAt, fiveMinutesAgo)
        ),
      });

      if (recentNotification && recentNotification.estimatedDelayMinutes === input.estimatedDelayMinutes) {
        return { success: false, error: 'You recently sent a notification with this delay time. Please wait a few minutes.' };
      }

      const existingNotification = await db.query.lateArrivalNotifications.findFirst({
        where: and(
          eq(lateArrivalNotifications.bookingId, input.bookingId),
          eq(lateArrivalNotifications.salonAcknowledged, 0)
        ),
      });

      if (existingNotification) {
        const [updated] = await db.update(lateArrivalNotifications)
          .set({
            estimatedDelayMinutes: input.estimatedDelayMinutes,
            estimatedArrivalTime: calculateEstimatedArrivalTime(
              booking.bookingTime, 
              input.estimatedDelayMinutes
            ),
            customerMessage: input.customerMessage || null,
            salonNotified: 0,
            updatedAt: new Date(),
          })
          .where(eq(lateArrivalNotifications.id, existingNotification.id))
          .returning();

        await this.notifySalon(updated, booking);
        return { success: true, notification: updated };
      }

      const estimatedArrivalTime = calculateEstimatedArrivalTime(
        booking.bookingTime,
        input.estimatedDelayMinutes
      );

      const [notification] = await db.insert(lateArrivalNotifications).values({
        bookingId: input.bookingId,
        salonId: booking.salonId,
        userId,
        estimatedDelayMinutes: input.estimatedDelayMinutes,
        originalBookingTime: booking.bookingTime,
        estimatedArrivalTime,
        customerMessage: input.customerMessage || null,
      }).returning();

      await this.notifySalon(notification, booking);

      return { success: true, notification };
    } catch (error) {
      console.error('Error creating late notification:', error);
      return { success: false, error: 'Failed to create late notification' };
    }
  }

  private async notifySalon(
    notification: LateArrivalNotification,
    booking: any
  ): Promise<void> {
    try {
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, notification.salonId),
      });

      if (!salon) return;

      const customerName = booking.customerName || 'A customer';
      const delayLabel = LATE_ARRIVAL_DELAY_OPTIONS.find(
        opt => opt.value === notification.estimatedDelayMinutes
      )?.label || `${notification.estimatedDelayMinutes} minutes`;
      
      const originalTimeDisplay = formatTimeForDisplay(notification.originalBookingTime);
      const newTimeDisplay = formatTimeForDisplay(notification.estimatedArrivalTime);
      
      const message = `🕐 Late Arrival Alert\n\n${customerName} is running ${delayLabel} late for their ${originalTimeDisplay} appointment.\n\nNew estimated arrival: ${newTimeDisplay}${notification.customerMessage ? `\n\nMessage: "${notification.customerMessage}"` : ''}\n\nBooking ID: ${notification.bookingId.slice(0, 8)}`;

      let notificationChannel: string | null = null;
      let messageSid: string | null = null;

      if (salon.phone) {
        try {
          const smsResult = await sendMessage({
            to: salon.phone,
            message,
            channel: 'sms',
          });

          if (smsResult.success) {
            notificationChannel = 'sms';
            messageSid = smsResult.messageSid || null;
          }
        } catch (smsError) {
          console.log('SMS notification failed, falling back to in-app:', smsError);
        }
      }

      if (!notificationChannel) {
        notificationChannel = 'in_app';
      }

      if (salon.ownerId) {
        await db.insert(userNotifications).values({
          userId: salon.ownerId,
          title: 'Customer Running Late',
          message: `${customerName} will arrive ${delayLabel} late for their ${originalTimeDisplay} appointment. New ETA: ${newTimeDisplay}`,
          type: 'booking',
          referenceId: notification.bookingId,
          referenceType: 'late_arrival',
        });
      }

      await db.update(lateArrivalNotifications)
        .set({
          salonNotified: 1,
          salonNotifiedAt: new Date(),
          notificationChannel,
          notificationMessageSid: messageSid,
          updatedAt: new Date(),
        })
        .where(eq(lateArrivalNotifications.id, notification.id));

    } catch (error) {
      console.error('Error notifying salon:', error);
    }
  }

  /**
   * Acknowledge a late arrival notification from the salon side.
   * 
   * DESIGN DECISION: Booking status is NOT automatically updated when salon responds "cancelled".
   * Reasons:
   * 1. Avoid unexpected payment/refund issues from automated cancellations
   * 2. Salon may still want to accommodate or reschedule manually
   * 3. Customer should be notified and take action themselves via normal cancellation flow
   * 4. Reduces complexity and potential for disputes
   * 
   * The customer is notified of the salon's response and can cancel/reschedule themselves.
   */
  async acknowledgeLateArrival(
    notificationId: string,
    acknowledgedByUserId: string,
    input: AcknowledgeLateArrivalInput
  ): Promise<LateNotificationResult> {
    try {
      const notification = await db.query.lateArrivalNotifications.findFirst({
        where: eq(lateArrivalNotifications.id, notificationId),
      });

      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }

      if (notification.salonAcknowledged === 1) {
        return { success: false, error: 'Notification already acknowledged' };
      }

      const [updated] = await db.update(lateArrivalNotifications)
        .set({
          salonAcknowledged: 1,
          salonAcknowledgedAt: new Date(),
          salonAcknowledgedBy: acknowledgedByUserId,
          salonResponse: input.response,
          salonResponseNote: input.responseNote || null,
          updatedAt: new Date(),
        })
        .where(eq(lateArrivalNotifications.id, notificationId))
        .returning();

      if (notification.userId) {
        let responseMessage = '';
        switch (input.response) {
          case 'acknowledged':
            responseMessage = 'The salon has acknowledged your late arrival notification. See you soon!';
            break;
          case 'rescheduled':
            responseMessage = `The salon has noted your delay. ${input.responseNote || 'They may contact you about rescheduling.'}`;
            break;
          case 'cancelled':
            responseMessage = `Due to scheduling constraints, your appointment may need to be rescheduled. ${input.responseNote || 'The salon will contact you shortly.'}`;
            break;
        }

        await db.insert(userNotifications).values({
          userId: notification.userId,
          title: 'Late Arrival Update',
          message: responseMessage,
          type: 'booking',
          referenceId: notification.bookingId,
          referenceType: 'late_arrival_response',
        });
      }

      return { success: true, notification: updated };
    } catch (error) {
      console.error('Error acknowledging late arrival:', error);
      return { success: false, error: 'Failed to acknowledge notification' };
    }
  }

  async getLateNotificationById(notificationId: string): Promise<LateArrivalNotification | null> {
    const notification = await db.query.lateArrivalNotifications.findFirst({
      where: eq(lateArrivalNotifications.id, notificationId),
    });
    return notification || null;
  }

  async getLateNotificationsForBooking(bookingId: string): Promise<LateArrivalNotification[]> {
    return db.query.lateArrivalNotifications.findMany({
      where: eq(lateArrivalNotifications.bookingId, bookingId),
      orderBy: [desc(lateArrivalNotifications.createdAt)],
    });
  }

  async getPendingLateNotificationsForSalon(salonId: string): Promise<LateArrivalNotification[]> {
    const today = getISTDate();
    
    const notifications = await db.query.lateArrivalNotifications.findMany({
      where: and(
        eq(lateArrivalNotifications.salonId, salonId),
        eq(lateArrivalNotifications.salonAcknowledged, 0)
      ),
      with: {
        booking: true,
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: [desc(lateArrivalNotifications.createdAt)],
    });

    return notifications.filter(n => n.booking?.bookingDate === today);
  }

  async getLateNotificationHistory(
    salonId: string,
    limit: number = 50
  ): Promise<LateArrivalNotification[]> {
    return db.query.lateArrivalNotifications.findMany({
      where: eq(lateArrivalNotifications.salonId, salonId),
      with: {
        booking: true,
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [desc(lateArrivalNotifications.createdAt)],
      limit,
    });
  }

  async getCustomerLateNotificationHistory(userId: string): Promise<LateArrivalNotification[]> {
    return db.query.lateArrivalNotifications.findMany({
      where: eq(lateArrivalNotifications.userId, userId),
      with: {
        booking: true,
        salon: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(lateArrivalNotifications.createdAt)],
      limit: 20,
    });
  }

  async canSendLateNotification(userId: string, bookingId: string): Promise<{
    canSend: boolean;
    reason?: string;
    booking?: any;
  }> {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        salon: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!booking) {
      return { canSend: false, reason: 'Booking not found' };
    }

    if (booking.userId !== userId) {
      return { canSend: false, reason: 'Not your booking' };
    }

    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      return { canSend: false, reason: 'Booking is not active' };
    }

    const today = getISTDate();
    if (booking.bookingDate !== today) {
      return { canSend: false, reason: 'Late notifications can only be sent for today\'s appointments' };
    }

    if (hasBookingTimePassed(booking.bookingTime)) {
      return { canSend: false, reason: 'Your appointment time has already passed' };
    }

    return { canSend: true, booking };
  }
}

export const lateArrivalService = new LateArrivalService();
