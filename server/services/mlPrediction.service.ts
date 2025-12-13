import { db } from "../db";
import { eq, and, sql, desc, gte, isNull, or } from "drizzle-orm";
import {
  serviceTimingAnalytics,
  staffPerformancePatterns,
  predictionAccuracyLogs,
  customerTimingPreferences,
  jobCards,
  jobCardServices,
  bookings,
  staff,
  services,
  salons,
} from "@shared/schema";

interface MLPrediction {
  predictedDelayMinutes: number;
  predictedDurationMinutes: number;
  confidence: number;
  factors: {
    staffSpeedFactor: number;
    dayOfWeekAdjustment: number;
    timeOfDayAdjustment: number;
    historicalOverrunMinutes: number;
    queuePositionFactor: number;
  };
  predictionType: 'basic' | 'ml_enhanced' | 'staff_adjusted';
}

interface PersonalizedBuffer {
  recommendedBufferMinutes: number;
  confidence: number;
  reason: string;
}

export class MLPredictionService {
  private static readonly MIN_SAMPLES_FOR_CONFIDENCE = 10;
  private static readonly HIGH_CONFIDENCE_SAMPLES = 50;

  async getEnhancedPrediction(params: {
    bookingId: string;
    staffId: string;
    serviceId: string;
    salonId: string;
    bookingTime: string;
    bookingDate: string;
    queuePosition: number;
    baseDurationMinutes: number;
  }): Promise<MLPrediction> {
    const date = new Date(params.bookingDate);
    const dayOfWeek = date.getDay();
    const hour = parseInt(params.bookingTime.split(':')[0], 10);

    const [staffPattern, servicePattern] = await Promise.all([
      this.getStaffPerformancePattern(params.staffId, params.serviceId, dayOfWeek),
      this.getServiceTimingPattern(params.salonId, params.serviceId, dayOfWeek, hour),
    ]);

    const staffSpeedFactor = staffPattern?.speedFactor || 1.0;
    const timeOfDayFactor = this.getTimeOfDaySpeedFactor(staffPattern, hour);
    const historicalOverrun = servicePattern?.avgOverrunMinutes || 0;
    const dayAdjustment = this.getDayOfWeekAdjustment(dayOfWeek);
    const queueFactor = 1 + (params.queuePosition * 0.02);

    const adjustedDuration = Math.round(
      params.baseDurationMinutes * 
      staffSpeedFactor * 
      timeOfDayFactor * 
      dayAdjustment * 
      queueFactor
    );

    const predictedDelay = Math.round(
      historicalOverrun * params.queuePosition * (1 / Math.max(staffPattern?.consistencyScore || 0.5, 0.3))
    );

    const confidence = this.calculateConfidence(staffPattern, servicePattern);

    return {
      predictedDelayMinutes: Math.max(0, predictedDelay),
      predictedDurationMinutes: adjustedDuration,
      confidence,
      factors: {
        staffSpeedFactor,
        dayOfWeekAdjustment: dayAdjustment,
        timeOfDayAdjustment: timeOfDayFactor,
        historicalOverrunMinutes: historicalOverrun,
        queuePositionFactor: queueFactor,
      },
      predictionType: confidence > 0.6 ? 'ml_enhanced' : 'staff_adjusted',
    };
  }

  async getPersonalizedBuffer(userId: string): Promise<PersonalizedBuffer> {
    const [customerPref] = await db
      .select()
      .from(customerTimingPreferences)
      .where(eq(customerTimingPreferences.userId, userId))
      .limit(1);

    if (!customerPref || customerPref.visitCount < 3) {
      return {
        recommendedBufferMinutes: 15,
        confidence: 0.3,
        reason: 'Default buffer (insufficient visit history)',
      };
    }

    const lateRate = parseFloat(customerPref.lateArrivalRate?.toString() || '0');
    const avgLate = parseFloat(customerPref.avgLateMinutes?.toString() || '0');
    const avgArrival = parseFloat(customerPref.avgArrivalMinutesBeforeAppt?.toString() || '0');

    let buffer = 15;
    let reason = 'Based on your arrival patterns';

    if (lateRate > 0.3) {
      buffer = Math.min(30, Math.round(avgLate + 10));
      reason = 'Extra buffer recommended based on your history';
    } else if (avgArrival > 20) {
      buffer = Math.max(10, Math.round(avgArrival - 5));
      reason = 'You typically arrive early - adjusted buffer';
    } else if (avgArrival < 5 && lateRate < 0.1) {
      buffer = 12;
      reason = 'You arrive on time - minimal buffer needed';
    }

    return {
      recommendedBufferMinutes: buffer,
      confidence: parseFloat(customerPref.bufferConfidenceScore?.toString() || '0.5'),
      reason,
    };
  }

  async aggregateServiceTimingAnalytics(salonId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedServices = await db
      .select({
        serviceId: jobCardServices.serviceId,
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${jobCards.serviceStartAt})`.as('dow'),
        hourBlock: sql<number>`EXTRACT(HOUR FROM ${jobCards.serviceStartAt})`.as('hour'),
        estimatedDuration: jobCardServices.estimatedDurationMinutes,
        actualDuration: jobCardServices.actualDurationMinutes,
      })
      .from(jobCardServices)
      .innerJoin(jobCards, eq(jobCardServices.jobCardId, jobCards.id))
      .where(
        and(
          eq(jobCards.salonId, salonId),
          eq(jobCardServices.status, 'completed'),
          gte(jobCards.serviceStartAt, thirtyDaysAgo)
        )
      );

    const grouped = new Map<string, {
      samples: number[];
      estimated: number[];
      overruns: number[];
    }>();

    for (const svc of completedServices) {
      if (!svc.serviceId || svc.dayOfWeek === null || svc.hourBlock === null) continue;
      
      const key = `${svc.serviceId}:${svc.dayOfWeek}:${svc.hourBlock}`;
      if (!grouped.has(key)) {
        grouped.set(key, { samples: [], estimated: [], overruns: [] });
      }
      
      const data = grouped.get(key)!;
      if (svc.actualDuration) {
        data.samples.push(svc.actualDuration);
        if (svc.estimatedDuration) {
          data.overruns.push(Math.max(0, svc.actualDuration - svc.estimatedDuration));
          data.estimated.push(svc.estimatedDuration);
        }
      }
    }

    for (const [key, data] of Array.from(grouped.entries())) {
      const [serviceId, dayOfWeek, hourBlock] = key.split(':');
      if (data.samples.length < 3) continue;

      const avg = data.samples.reduce((a: number, b: number) => a + b, 0) / data.samples.length;
      const variance = data.samples.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / data.samples.length;
      const stdDev = Math.sqrt(variance);
      const avgOverrun = data.overruns.length > 0 
        ? data.overruns.reduce((a: number, b: number) => a + b, 0) / data.overruns.length 
        : 0;
      const overrunRate = data.overruns.length > 0 
        ? data.overruns.filter((o: number) => o > 0).length / data.overruns.length 
        : 0;
      const confidence = Math.min(1, data.samples.length / MLPredictionService.HIGH_CONFIDENCE_SAMPLES);

      await db
        .insert(serviceTimingAnalytics)
        .values({
          salonId,
          serviceId,
          dayOfWeek: parseInt(dayOfWeek),
          hourBlock: parseInt(hourBlock),
          sampleCount: data.samples.length,
          avgDurationMinutes: avg.toFixed(2),
          stdDevMinutes: stdDev.toFixed(2),
          minDurationMinutes: Math.min(...data.samples),
          maxDurationMinutes: Math.max(...data.samples),
          avgOverrunMinutes: avgOverrun.toFixed(2),
          overrunRate: overrunRate.toFixed(4),
          confidenceScore: confidence.toFixed(2),
          lastCalculatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [serviceTimingAnalytics.salonId, serviceTimingAnalytics.serviceId, serviceTimingAnalytics.dayOfWeek, serviceTimingAnalytics.hourBlock],
          set: {
            sampleCount: data.samples.length,
            avgDurationMinutes: avg.toFixed(2),
            stdDevMinutes: stdDev.toFixed(2),
            minDurationMinutes: Math.min(...data.samples),
            maxDurationMinutes: Math.max(...data.samples),
            avgOverrunMinutes: avgOverrun.toFixed(2),
            overrunRate: overrunRate.toFixed(4),
            confidenceScore: confidence.toFixed(2),
            lastCalculatedAt: new Date(),
            updatedAt: new Date(),
          },
        });
    }

    console.log(`[ML] Aggregated service timing analytics for salon ${salonId}: ${grouped.size} time slots`);
  }

  async aggregateStaffPerformancePatterns(salonId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedServices = await db
      .select({
        staffId: jobCardServices.staffId,
        serviceId: jobCardServices.serviceId,
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${jobCards.serviceStartAt})`.as('dow'),
        hour: sql<number>`EXTRACT(HOUR FROM ${jobCards.serviceStartAt})`.as('hour'),
        estimatedDuration: jobCardServices.estimatedDurationMinutes,
        actualDuration: jobCardServices.actualDurationMinutes,
        checkInAt: jobCards.checkInAt,
        actualStart: jobCards.serviceStartAt,
      })
      .from(jobCardServices)
      .innerJoin(jobCards, eq(jobCardServices.jobCardId, jobCards.id))
      .where(
        and(
          eq(jobCards.salonId, salonId),
          eq(jobCardServices.status, 'completed'),
          gte(jobCards.serviceStartAt, thirtyDaysAgo)
        )
      );

    const staffData = new Map<string, {
      services: { duration: number; estimated: number; hour: number; lateStart: number }[];
      byDayOfWeek: Map<number, number[]>;
    }>();

    for (const svc of completedServices) {
      if (!svc.staffId || !svc.actualDuration || !svc.estimatedDuration) continue;

      const key = `${svc.staffId}:${svc.serviceId || 'all'}`;
      if (!staffData.has(key)) {
        staffData.set(key, { services: [], byDayOfWeek: new Map() });
      }

      const data = staffData.get(key)!;
      const lateStart = svc.checkInAt && svc.actualStart 
        ? Math.max(0, (new Date(svc.actualStart).getTime() - new Date(svc.checkInAt).getTime()) / 60000)
        : 0;

      data.services.push({
        duration: svc.actualDuration,
        estimated: svc.estimatedDuration,
        hour: svc.hour || 12,
        lateStart,
      });

      if (svc.dayOfWeek !== null) {
        if (!data.byDayOfWeek.has(svc.dayOfWeek)) {
          data.byDayOfWeek.set(svc.dayOfWeek, []);
        }
        data.byDayOfWeek.get(svc.dayOfWeek)!.push(svc.actualDuration / svc.estimatedDuration);
      }
    }

    for (const [key, data] of Array.from(staffData.entries())) {
      const [staffId, serviceId] = key.split(':');
      if (data.services.length < 5) continue;

      const avgDuration = data.services.reduce((a: number, b: { duration: number }) => a + b.duration, 0) / data.services.length;
      const avgEstimated = data.services.reduce((a: number, b: { estimated: number }) => a + b.estimated, 0) / data.services.length;
      const speedFactor = avgDuration / avgEstimated;

      type ServiceData = { duration: number; estimated: number; hour: number; lateStart: number };
      const lateStarts = data.services.filter((s: ServiceData) => s.lateStart > 5);
      const lateStartRate = lateStarts.length / data.services.length;
      const avgLateStart = lateStarts.length > 0 
        ? lateStarts.reduce((a: number, b: ServiceData) => a + b.lateStart, 0) / lateStarts.length 
        : 0;

      const ratios = data.services.map((s: ServiceData) => s.duration / s.estimated);
      const avgRatio = ratios.reduce((a: number, b: number) => a + b, 0) / ratios.length;
      const variance = ratios.reduce((sum: number, val: number) => sum + Math.pow(val - avgRatio, 2), 0) / ratios.length;
      const consistencyScore = Math.max(0, 1 - Math.sqrt(variance));

      const morning = data.services.filter((s: ServiceData) => s.hour < 12);
      const afternoon = data.services.filter((s: ServiceData) => s.hour >= 12 && s.hour < 17);
      const evening = data.services.filter((s: ServiceData) => s.hour >= 17);

      const morningFactor = morning.length > 2 
        ? morning.reduce((a: number, b: ServiceData) => a + b.duration / b.estimated, 0) / morning.length 
        : 1;
      const afternoonFactor = afternoon.length > 2 
        ? afternoon.reduce((a: number, b: ServiceData) => a + b.duration / b.estimated, 0) / afternoon.length 
        : 1;
      const eveningFactor = evening.length > 2 
        ? evening.reduce((a: number, b: ServiceData) => a + b.duration / b.estimated, 0) / evening.length 
        : 1;

      const confidence = Math.min(1, data.services.length / MLPredictionService.HIGH_CONFIDENCE_SAMPLES);

      await db
        .insert(staffPerformancePatterns)
        .values({
          salonId,
          staffId,
          serviceId: serviceId === 'all' ? null : serviceId,
          dayOfWeek: null,
          sampleCount: data.services.length,
          avgDurationMinutes: avgDuration.toFixed(2),
          speedFactor: speedFactor.toFixed(2),
          consistencyScore: consistencyScore.toFixed(2),
          lateStartRate: lateStartRate.toFixed(4),
          avgLateStartMinutes: avgLateStart.toFixed(2),
          morningSpeedFactor: morningFactor.toFixed(2),
          afternoonSpeedFactor: afternoonFactor.toFixed(2),
          eveningSpeedFactor: eveningFactor.toFixed(2),
          confidenceScore: confidence.toFixed(2),
          lastCalculatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [staffPerformancePatterns.staffId, staffPerformancePatterns.serviceId, staffPerformancePatterns.dayOfWeek],
          set: {
            sampleCount: data.services.length,
            avgDurationMinutes: avgDuration.toFixed(2),
            speedFactor: speedFactor.toFixed(2),
            consistencyScore: consistencyScore.toFixed(2),
            lateStartRate: lateStartRate.toFixed(4),
            avgLateStartMinutes: avgLateStart.toFixed(2),
            morningSpeedFactor: morningFactor.toFixed(2),
            afternoonSpeedFactor: afternoonFactor.toFixed(2),
            eveningSpeedFactor: eveningFactor.toFixed(2),
            confidenceScore: confidence.toFixed(2),
            lastCalculatedAt: new Date(),
            updatedAt: new Date(),
          },
        });
    }

    console.log(`[ML] Aggregated staff performance patterns for salon ${salonId}: ${staffData.size} staff/service combinations`);
  }

  async updateCustomerTimingPreferences(userId: string): Promise<void> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const customerBookings = await db
      .select({
        bookingTime: bookings.bookingTime,
        checkInAt: jobCards.checkInAt,
        serviceStartAt: jobCards.serviceStartAt,
      })
      .from(bookings)
      .leftJoin(jobCards, eq(jobCards.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.userId, userId),
          eq(bookings.status, 'completed'),
          gte(bookings.createdAt, sixMonthsAgo)
        )
      );

    if (customerBookings.length < 3) return;

    const arrivals: number[] = [];
    const lateArrivals: number[] = [];

    for (const booking of customerBookings) {
      if (!booking.checkInAt || !booking.bookingTime) continue;

      const [hours, minutes] = booking.bookingTime.split(':').map(Number);
      const scheduledTime = new Date(booking.checkInAt);
      scheduledTime.setHours(hours, minutes, 0, 0);

      const arrivalDiff = (scheduledTime.getTime() - new Date(booking.checkInAt).getTime()) / 60000;
      arrivals.push(arrivalDiff);

      if (arrivalDiff < 0) {
        lateArrivals.push(Math.abs(arrivalDiff));
      }
    }

    const avgArrival = arrivals.length > 0 
      ? arrivals.reduce((a, b) => a + b, 0) / arrivals.length 
      : 0;
    const lateRate = lateArrivals.length / arrivals.length;
    const avgLate = lateArrivals.length > 0 
      ? lateArrivals.reduce((a, b) => a + b, 0) / lateArrivals.length 
      : 0;

    let recommendedBuffer = 15;
    if (lateRate > 0.3) {
      recommendedBuffer = Math.min(30, Math.round(avgLate + 10));
    } else if (avgArrival > 15) {
      recommendedBuffer = Math.max(10, Math.round(avgArrival - 5));
    } else if (avgArrival < 5 && lateRate < 0.1) {
      recommendedBuffer = 12;
    }

    const confidence = Math.min(1, arrivals.length / 20);

    await db
      .insert(customerTimingPreferences)
      .values({
        userId,
        visitCount: arrivals.length,
        avgArrivalMinutesBeforeAppt: avgArrival.toFixed(2),
        lateArrivalRate: lateRate.toFixed(4),
        avgLateMinutes: avgLate.toFixed(2),
        recommendedBufferMinutes: recommendedBuffer,
        bufferConfidenceScore: confidence.toFixed(2),
        lastCalculatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: customerTimingPreferences.userId,
        set: {
          visitCount: arrivals.length,
          avgArrivalMinutesBeforeAppt: avgArrival.toFixed(2),
          lateArrivalRate: lateRate.toFixed(4),
          avgLateMinutes: avgLate.toFixed(2),
          recommendedBufferMinutes: recommendedBuffer,
          bufferConfidenceScore: confidence.toFixed(2),
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    console.log(`[ML] Updated customer timing preferences for user ${userId}`);
  }

  async logPredictionAccuracy(params: {
    bookingId: string;
    departureAlertId?: string;
    salonId: string;
    staffId?: string;
    predictionType: 'basic' | 'ml_enhanced' | 'staff_adjusted';
    predictedStartTime: string;
    predictedDelayMinutes: number;
    predictedDurationMinutes?: number;
    actualStartTime?: string;
    actualDelayMinutes?: number;
    actualDurationMinutes?: number;
    factorsUsed: Record<string, any>;
  }): Promise<void> {
    const startTimeError = params.actualStartTime && params.predictedStartTime
      ? this.calculateTimeError(params.predictedStartTime, params.actualStartTime)
      : null;

    const delayError = params.actualDelayMinutes !== undefined
      ? params.predictedDelayMinutes - params.actualDelayMinutes
      : null;

    const durationError = params.actualDurationMinutes && params.predictedDurationMinutes
      ? params.predictedDurationMinutes - params.actualDurationMinutes
      : null;

    await db.insert(predictionAccuracyLogs).values({
      bookingId: params.bookingId,
      departureAlertId: params.departureAlertId,
      salonId: params.salonId,
      staffId: params.staffId,
      predictionType: params.predictionType,
      predictedStartTime: params.predictedStartTime,
      predictedDelayMinutes: params.predictedDelayMinutes,
      predictedDurationMinutes: params.predictedDurationMinutes,
      actualStartTime: params.actualStartTime,
      actualDelayMinutes: params.actualDelayMinutes,
      actualDurationMinutes: params.actualDurationMinutes,
      startTimeErrorMinutes: startTimeError,
      delayErrorMinutes: delayError,
      durationErrorMinutes: durationError,
      factorsUsed: params.factorsUsed,
    });
  }

  private async getStaffPerformancePattern(staffId: string, serviceId: string, dayOfWeek: number) {
    const [pattern] = await db
      .select()
      .from(staffPerformancePatterns)
      .where(
        and(
          eq(staffPerformancePatterns.staffId, staffId),
          or(
            eq(staffPerformancePatterns.serviceId, serviceId),
            isNull(staffPerformancePatterns.serviceId)
          )
        )
      )
      .orderBy(desc(staffPerformancePatterns.sampleCount))
      .limit(1);

    return pattern ? {
      speedFactor: parseFloat(pattern.speedFactor?.toString() || '1'),
      consistencyScore: parseFloat(pattern.consistencyScore?.toString() || '0.5'),
      morningSpeedFactor: parseFloat(pattern.morningSpeedFactor?.toString() || '1'),
      afternoonSpeedFactor: parseFloat(pattern.afternoonSpeedFactor?.toString() || '1'),
      eveningSpeedFactor: parseFloat(pattern.eveningSpeedFactor?.toString() || '1'),
      sampleCount: pattern.sampleCount,
    } : null;
  }

  private async getServiceTimingPattern(salonId: string, serviceId: string, dayOfWeek: number, hour: number) {
    const [pattern] = await db
      .select()
      .from(serviceTimingAnalytics)
      .where(
        and(
          eq(serviceTimingAnalytics.salonId, salonId),
          eq(serviceTimingAnalytics.serviceId, serviceId),
          eq(serviceTimingAnalytics.dayOfWeek, dayOfWeek),
          eq(serviceTimingAnalytics.hourBlock, hour)
        )
      )
      .limit(1);

    return pattern ? {
      avgOverrunMinutes: parseFloat(pattern.avgOverrunMinutes?.toString() || '0'),
      overrunRate: parseFloat(pattern.overrunRate?.toString() || '0'),
      sampleCount: pattern.sampleCount,
    } : null;
  }

  private getTimeOfDaySpeedFactor(pattern: { morningSpeedFactor: number; afternoonSpeedFactor: number; eveningSpeedFactor: number } | null, hour: number): number {
    if (!pattern) return 1.0;
    if (hour < 12) return pattern.morningSpeedFactor;
    if (hour < 17) return pattern.afternoonSpeedFactor;
    return pattern.eveningSpeedFactor;
  }

  private getDayOfWeekAdjustment(dayOfWeek: number): number {
    const adjustments: Record<number, number> = {
      0: 1.05, // Sunday - slightly slower
      1: 0.98, // Monday
      2: 0.97, // Tuesday
      3: 0.98, // Wednesday
      4: 1.00, // Thursday
      5: 1.03, // Friday - busier
      6: 1.05, // Saturday - busier
    };
    return adjustments[dayOfWeek] || 1.0;
  }

  private calculateConfidence(
    staffPattern: { sampleCount: number } | null,
    servicePattern: { sampleCount: number } | null
  ): number {
    const staffSamples = staffPattern?.sampleCount || 0;
    const serviceSamples = servicePattern?.sampleCount || 0;

    const staffConfidence = Math.min(1, staffSamples / MLPredictionService.HIGH_CONFIDENCE_SAMPLES);
    const serviceConfidence = Math.min(1, serviceSamples / MLPredictionService.HIGH_CONFIDENCE_SAMPLES);

    return (staffConfidence * 0.6 + serviceConfidence * 0.4);
  }

  private calculateTimeError(predicted: string, actual: string): number {
    const [predH, predM] = predicted.split(':').map(Number);
    const [actH, actM] = actual.split(':').map(Number);
    return (predH * 60 + predM) - (actH * 60 + actM);
  }
}

export const mlPredictionService = new MLPredictionService();
