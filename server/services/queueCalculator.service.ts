import { db } from "../db";
import {
  staffQueueStatus,
  jobCards,
  jobCardServices,
  bookings,
  staff,
  salons,
  services,
  type StaffQueueStatus,
  type InsertStaffQueueStatus,
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc, inArray, sql, isNull, ne } from "drizzle-orm";
import { format, addMinutes, parseISO, differenceInMinutes, isAfter, isBefore } from "date-fns";
import { queueSocketService } from "./queueSocket.service";

const IST_OFFSET_MINUTES = 330;

interface StaffQueueInfo {
  staffId: string;
  staffName: string;
  currentStatus: 'available' | 'busy' | 'break' | 'offline';
  currentJobCardId: string | null;
  currentCustomerName: string | null;
  appointmentsAhead: number;
  estimatedDelayMinutes: number;
  nextAvailableAt: Date | null;
  lastServiceEndAt: Date | null;
  avgServiceOverrunPercent: number;
}

interface BookingQueuePrediction {
  bookingId: string;
  staffId: string | null;
  staffName: string | null;
  originalBookingTime: string;
  predictedStartTime: string;
  delayMinutes: number;
  delayReason: string | null;
  appointmentsAhead: number;
  confidence: number;
}

export class QueueCalculatorService {
  
  private getNowIST(): Date {
    const now = new Date();
    return new Date(now.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  }

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

  private addMinutesToTime(time: string, minutes: number): string {
    const parsed = this.parseTimeString(time);
    if (!parsed) return time;
    const totalMinutes = parsed.hours * 60 + parsed.minutes + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }

  private timeToMinutes(time: string): number {
    const parsed = this.parseTimeString(time);
    if (!parsed) return 0;
    return parsed.hours * 60 + parsed.minutes;
  }

  async getStaffQueueStatus(staffId: string, date?: string): Promise<StaffQueueInfo | null> {
    try {
      const targetDate = date || this.getISTDate();
      
      const staffData = await db.query.staff.findFirst({
        where: eq(staff.id, staffId),
      });

      if (!staffData) {
        return null;
      }

      const currentJobCard = await db.query.jobCards.findFirst({
        where: and(
          eq(jobCards.assignedStaffId, staffId),
          eq(jobCards.status, 'in_service')
        ),
        orderBy: [desc(jobCards.serviceStartAt)],
      });

      const currentTime = this.getISTTimeString();

      const upcomingBookings = await db.select({
        id: bookings.id,
        bookingTime: bookings.bookingTime,
        status: bookings.status,
        serviceDuration: services.durationMinutes,
      })
        .from(bookings)
        .leftJoin(services, eq(bookings.serviceId, services.id))
        .where(and(
          eq(bookings.staffId, staffId),
          eq(bookings.bookingDate, targetDate),
          inArray(bookings.status, ['confirmed', 'pending']),
          gte(bookings.bookingTime, currentTime)
        ))
        .orderBy(asc(bookings.bookingTime));

      const completedToday = await db.select({
        estimatedDuration: jobCardServices.estimatedDurationMinutes,
        actualDuration: jobCardServices.actualDurationMinutes,
      })
        .from(jobCardServices)
        .innerJoin(jobCards, eq(jobCardServices.jobCardId, jobCards.id))
        .where(and(
          eq(jobCardServices.staffId, staffId),
          eq(jobCardServices.status, 'completed'),
          sql`DATE(${jobCards.checkInAt}) = ${targetDate}`
        ));

      let totalOverrunPercent = 0;
      let completedCount = 0;
      for (const service of completedToday) {
        if (service.estimatedDuration && service.actualDuration && service.estimatedDuration > 0) {
          const overrun = ((service.actualDuration - service.estimatedDuration) / service.estimatedDuration) * 100;
          totalOverrunPercent += overrun;
          completedCount++;
        }
      }
      const avgOverrunPercent = completedCount > 0 ? totalOverrunPercent / completedCount : 0;

      let estimatedDelayMinutes = 0;
      let nextAvailableAt: Date | null = null;

      if (currentJobCard && currentJobCard.serviceStartAt) {
        const expectedEndMinutes = currentJobCard.estimatedDurationMinutes || 30;
        const adjustedEnd = Math.ceil(expectedEndMinutes * (1 + avgOverrunPercent / 100));
        const expectedEndTime = addMinutes(currentJobCard.serviceStartAt, adjustedEnd);
        
        const now = this.getNowIST();
        if (isAfter(expectedEndTime, now)) {
          estimatedDelayMinutes = differenceInMinutes(expectedEndTime, now);
          nextAvailableAt = expectedEndTime;
        }
      }

      let accumulatedDelay = estimatedDelayMinutes;
      for (const booking of upcomingBookings) {
        const duration = booking.serviceDuration || 30;
        const adjustedDuration = Math.ceil(duration * (1 + avgOverrunPercent / 100));
        accumulatedDelay += adjustedDuration - duration;
      }

      return {
        staffId,
        staffName: staffData.name,
        currentStatus: currentJobCard ? 'busy' : 'available',
        currentJobCardId: currentJobCard?.id || null,
        currentCustomerName: currentJobCard?.customerName || null,
        appointmentsAhead: upcomingBookings.length,
        estimatedDelayMinutes: Math.max(0, Math.round(accumulatedDelay)),
        nextAvailableAt,
        lastServiceEndAt: null,
        avgServiceOverrunPercent: Math.round(avgOverrunPercent * 100) / 100,
      };
    } catch (error) {
      console.error('Error calculating staff queue status:', error);
      return null;
    }
  }

  async getSalonQueueStatus(salonId: string, date?: string): Promise<{
    salonId: string;
    date: string;
    staff: StaffQueueInfo[];
    overallStatus: 'on_time' | 'slight_delay' | 'running_behind';
    avgDelayMinutes: number;
  } | null> {
    try {
      const targetDate = date || this.getISTDate();
      
      const salonStaff = await db.select({ id: staff.id, name: staff.name })
        .from(staff)
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ));

      if (salonStaff.length === 0) {
        return null;
      }

      const staffStatuses: StaffQueueInfo[] = [];
      for (const s of salonStaff) {
        const status = await this.getStaffQueueStatus(s.id, targetDate);
        if (status) {
          staffStatuses.push(status);
        }
      }

      const avgDelay = staffStatuses.length > 0
        ? staffStatuses.reduce((sum, s) => sum + s.estimatedDelayMinutes, 0) / staffStatuses.length
        : 0;

      let overallStatus: 'on_time' | 'slight_delay' | 'running_behind' = 'on_time';
      if (avgDelay >= 20) {
        overallStatus = 'running_behind';
      } else if (avgDelay >= 10) {
        overallStatus = 'slight_delay';
      }

      return {
        salonId,
        date: targetDate,
        staff: staffStatuses,
        overallStatus,
        avgDelayMinutes: Math.round(avgDelay),
      };
    } catch (error) {
      console.error('Error getting salon queue status:', error);
      return null;
    }
  }

  async getPredictedStartTime(bookingId: string): Promise<BookingQueuePrediction | null> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
          staff: true,
          service: true,
          salon: true,
        },
      });

      if (!booking) {
        return null;
      }

      const today = this.getISTDate();
      if (booking.bookingDate !== today) {
        return {
          bookingId,
          staffId: booking.staffId,
          staffName: booking.staff?.name || null,
          originalBookingTime: booking.bookingTime,
          predictedStartTime: booking.bookingTime,
          delayMinutes: 0,
          delayReason: null,
          appointmentsAhead: 0,
          confidence: 0.5,
        };
      }

      if (booking.staffId) {
        const staffStatus = await this.getStaffQueueStatus(booking.staffId, booking.bookingDate);
        if (!staffStatus) {
          return {
            bookingId,
            staffId: booking.staffId,
            staffName: booking.staff?.name || null,
            originalBookingTime: booking.bookingTime,
            predictedStartTime: booking.bookingTime,
            delayMinutes: 0,
            delayReason: null,
            appointmentsAhead: 0,
            confidence: 0.3,
          };
        }

        const bookingsBeforeThis = await db.select({ count: sql<number>`count(*)` })
          .from(bookings)
          .where(and(
            eq(bookings.staffId, booking.staffId),
            eq(bookings.bookingDate, booking.bookingDate),
            inArray(bookings.status, ['confirmed', 'pending']),
            sql`${bookings.bookingTime} < ${booking.bookingTime}`
          ));

        const appointmentsAhead = Number(bookingsBeforeThis[0]?.count || 0);
        const currentTimeMinutes = this.timeToMinutes(this.getISTTimeString());
        const bookingTimeMinutes = this.timeToMinutes(booking.bookingTime);

        let cumulativeDelay = staffStatus.estimatedDelayMinutes;
        const adjustedOverrun = Math.max(0, staffStatus.avgServiceOverrunPercent);
        cumulativeDelay += Math.ceil(appointmentsAhead * (booking.service?.durationMinutes || 30) * adjustedOverrun / 100);

        const predictedStartTime = this.addMinutesToTime(booking.bookingTime, cumulativeDelay);
        
        let delayReason: string | null = null;
        if (cumulativeDelay > 0) {
          if (staffStatus.currentStatus === 'busy') {
            delayReason = 'service_overrun';
          } else if (appointmentsAhead > 0) {
            delayReason = 'queue_behind';
          }
        }

        return {
          bookingId,
          staffId: booking.staffId,
          staffName: staffStatus.staffName,
          originalBookingTime: booking.bookingTime,
          predictedStartTime,
          delayMinutes: Math.max(0, cumulativeDelay),
          delayReason,
          appointmentsAhead,
          confidence: cumulativeDelay <= 5 ? 0.9 : cumulativeDelay <= 15 ? 0.7 : 0.5,
        };
      } else {
        const salonStatus = await this.getSalonQueueStatus(booking.salonId, booking.bookingDate);
        if (!salonStatus || salonStatus.staff.length === 0) {
          return {
            bookingId,
            staffId: null,
            staffName: null,
            originalBookingTime: booking.bookingTime,
            predictedStartTime: booking.bookingTime,
            delayMinutes: 0,
            delayReason: null,
            appointmentsAhead: 0,
            confidence: 0.3,
          };
        }

        const bestStaff = salonStatus.staff.reduce((best, current) => 
          current.estimatedDelayMinutes < best.estimatedDelayMinutes ? current : best
        );

        const predictedStartTime = this.addMinutesToTime(
          booking.bookingTime,
          bestStaff.estimatedDelayMinutes
        );

        return {
          bookingId,
          staffId: bestStaff.staffId,
          staffName: bestStaff.staffName,
          originalBookingTime: booking.bookingTime,
          predictedStartTime,
          delayMinutes: bestStaff.estimatedDelayMinutes,
          delayReason: bestStaff.estimatedDelayMinutes > 0 ? 'queue_behind' : null,
          appointmentsAhead: bestStaff.appointmentsAhead,
          confidence: 0.6,
        };
      }
    } catch (error) {
      console.error('Error predicting start time:', error);
      return null;
    }
  }

  async updateStaffQueueStatusRecord(staffId: string, date?: string): Promise<void> {
    try {
      const targetDate = date || this.getISTDate();
      const status = await this.getStaffQueueStatus(staffId, targetDate);
      
      if (!status) return;

      const staffData = await db.query.staff.findFirst({
        where: eq(staff.id, staffId),
        columns: { salonId: true },
      });

      if (!staffData) return;

      const existing = await db.select({ id: staffQueueStatus.id })
        .from(staffQueueStatus)
        .where(and(
          eq(staffQueueStatus.staffId, staffId),
          eq(staffQueueStatus.currentDate, targetDate)
        ))
        .limit(1);

      const data: InsertStaffQueueStatus = {
        salonId: staffData.salonId,
        staffId,
        currentDate: targetDate,
        currentJobCardId: status.currentJobCardId,
        currentStatus: status.currentStatus,
        appointmentsAhead: status.appointmentsAhead,
        estimatedDelayMinutes: status.estimatedDelayMinutes,
        lastServiceEndAt: status.lastServiceEndAt,
        nextAvailableAt: status.nextAvailableAt,
        avgServiceOverrunPercent: status.avgServiceOverrunPercent.toString(),
      };

      if (existing.length > 0) {
        await db.update(staffQueueStatus)
          .set({
            ...data,
            updatedAt: new Date(),
            calculatedAt: new Date(),
          })
          .where(eq(staffQueueStatus.id, existing[0].id));
      } else {
        await db.insert(staffQueueStatus).values(data);
      }
    } catch (error) {
      console.error('Error updating staff queue status record:', error);
    }
  }

  async recalculateAllQueuesForSalon(salonId: string, date?: string): Promise<void> {
    try {
      const targetDate = date || this.getISTDate();
      
      const salonStaff = await db.select({ id: staff.id })
        .from(staff)
        .where(and(
          eq(staff.salonId, salonId),
          eq(staff.isActive, 1)
        ));

      for (const s of salonStaff) {
        await this.updateStaffQueueStatusRecord(s.id, targetDate);
      }

      const salonQueueStatus = await this.getSalonQueueStatus(salonId, targetDate);
      if (salonQueueStatus) {
        queueSocketService.emitSalonQueueUpdate(salonId, {
          salonId: salonQueueStatus.salonId,
          date: salonQueueStatus.date,
          staff: salonQueueStatus.staff.map(s => ({
            staffId: s.staffId,
            staffName: s.staffName,
            currentStatus: s.currentStatus,
            appointmentsAhead: s.appointmentsAhead,
            estimatedDelayMinutes: s.estimatedDelayMinutes,
            nextAvailableAt: s.nextAvailableAt?.toISOString() || null,
            currentCustomer: s.currentCustomerName || undefined,
          })),
          overallStatus: salonQueueStatus.overallStatus,
          avgDelayMinutes: salonQueueStatus.avgDelayMinutes,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error recalculating salon queues:', error);
    }
  }
}

export const queueCalculatorService = new QueueCalculatorService();
