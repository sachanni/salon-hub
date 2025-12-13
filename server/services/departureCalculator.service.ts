import { db } from "../db";
import {
  bookings,
  salons,
  users,
  userSavedLocations,
  departureAlerts,
  departureAlertSettings,
  customerDeparturePreferences,
  salonSubscriptions,
  type DepartureAlert,
  type InsertDepartureAlert,
} from "@shared/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { queueCalculatorService } from "./queueCalculator.service";
import { mlPredictionService } from "./mlPrediction.service";
import { PREMIUM_TIER_IDS } from "../constants/subscription";

const IST_OFFSET_MINUTES = 330;
const DEFAULT_BUFFER_MINUTES = 10;
const DEFAULT_TRAVEL_MINUTES = 20;

interface DepartureRecommendation {
  bookingId: string;
  userId: string;
  salonId: string;
  staffId: string | null;
  originalBookingTime: string;
  bookingDate: string;
  predictedStartTime: string;
  delayMinutes: number;
  delayReason: string | null;
  suggestedDepartureTime: string;
  estimatedTravelMinutes: number;
  bufferMinutes: number;
  departureLocation: {
    label: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  alertType: 'initial_reminder' | 'delay_update' | 'earlier_available' | 'staff_change' | 'on_time';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  calculationDetails: Record<string, any>;
}

export class DepartureCalculatorService {

  private getISTTimeString(): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date());
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

  private minutesToTime(minutes: number): string {
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalizedMinutes / 60);
    const mins = normalizedMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private subtractMinutesFromTime(time: string, minutes: number): string {
    const timeMinutes = this.timeToMinutes(time);
    return this.minutesToTime(timeMinutes - minutes);
  }

  async isSalonPremium(salonId: string): Promise<boolean> {
    try {
      const subscription = await db.query.salonSubscriptions.findFirst({
        where: and(
          eq(salonSubscriptions.salonId, salonId),
          eq(salonSubscriptions.status, 'active'),
          inArray(salonSubscriptions.tierId, PREMIUM_TIER_IDS)
        ),
      });
      return !!subscription;
    } catch (error) {
      console.error('Error checking salon premium status:', error);
      return false;
    }
  }

  async getCustomerDepartureLocation(userId: string, preferredLabel?: string): Promise<{
    label: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null> {
    try {
      const prefs = await db.query.customerDeparturePreferences.findFirst({
        where: eq(customerDeparturePreferences.userId, userId),
      });

      const locationLabel = preferredLabel || prefs?.defaultLocationLabel || 'home';
      
      if (locationLabel === 'ask_each_time') {
        return null;
      }

      const savedLocation = await db.query.userSavedLocations.findFirst({
        where: and(
          eq(userSavedLocations.userId, userId),
          eq(userSavedLocations.label, locationLabel)
        ),
      });

      if (savedLocation) {
        return {
          label: savedLocation.label,
          latitude: parseFloat(savedLocation.latitude),
          longitude: parseFloat(savedLocation.longitude),
        };
      }

      const anyLocation = await db.query.userSavedLocations.findFirst({
        where: eq(userSavedLocations.userId, userId),
      });

      if (anyLocation) {
        return {
          label: anyLocation.label,
          latitude: parseFloat(anyLocation.latitude),
          longitude: parseFloat(anyLocation.longitude),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting customer departure location:', error);
      return null;
    }
  }

  async estimateTravelTime(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<number> {
    const R = 6371;
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lng - origin.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;

    const avgSpeedKmH = distanceKm < 5 ? 20 : distanceKm < 15 ? 25 : 30;
    const travelMinutes = Math.ceil((distanceKm / avgSpeedKmH) * 60);

    return Math.max(10, Math.min(120, travelMinutes));
  }

  async getSalonDepartureSettings(salonId: string): Promise<{
    isEnabled: boolean;
    firstAlertMinutesBefore: number;
    updateIntervalMinutes: number;
    minDelayToNotify: number;
    defaultBufferMinutes: number;
    useTrafficData: boolean;
    considerHistoricalOverrun: boolean;
  }> {
    try {
      const settings = await db.query.departureAlertSettings.findFirst({
        where: eq(departureAlertSettings.salonId, salonId),
      });

      if (settings) {
        return {
          isEnabled: settings.isEnabled === 1,
          firstAlertMinutesBefore: settings.firstAlertMinutesBefore,
          updateIntervalMinutes: settings.updateIntervalMinutes,
          minDelayToNotify: settings.minDelayToNotify,
          defaultBufferMinutes: settings.defaultBufferMinutes,
          useTrafficData: settings.useTrafficData === 1,
          considerHistoricalOverrun: settings.considerHistoricalOverrun === 1,
        };
      }

      return {
        isEnabled: true,
        firstAlertMinutesBefore: 60,
        updateIntervalMinutes: 15,
        minDelayToNotify: 10,
        defaultBufferMinutes: 10,
        useTrafficData: false,
        considerHistoricalOverrun: true,
      };
    } catch (error) {
      console.error('Error getting salon departure settings:', error);
      return {
        isEnabled: true,
        firstAlertMinutesBefore: 60,
        updateIntervalMinutes: 15,
        minDelayToNotify: 10,
        defaultBufferMinutes: 10,
        useTrafficData: false,
        considerHistoricalOverrun: true,
      };
    }
  }

  async getCustomerPreferences(userId: string): Promise<{
    receiveAlerts: boolean;
    preferredBufferMinutes: number;
    preferredChannel: string;
  }> {
    try {
      const prefs = await db.query.customerDeparturePreferences.findFirst({
        where: eq(customerDeparturePreferences.userId, userId),
      });

      if (prefs) {
        return {
          receiveAlerts: prefs.receiveAlerts === 1,
          preferredBufferMinutes: prefs.preferredBufferMinutes || 15,
          preferredChannel: prefs.preferredChannel || 'push',
        };
      }

      return {
        receiveAlerts: true,
        preferredBufferMinutes: 15,
        preferredChannel: 'push',
      };
    } catch (error) {
      console.error('Error getting customer preferences:', error);
      return {
        receiveAlerts: true,
        preferredBufferMinutes: 15,
        preferredChannel: 'push',
      };
    }
  }

  async calculateDepartureTime(bookingId: string): Promise<DepartureRecommendation | null> {
    try {
      const booking = await db.query.bookings.findFirst({
        where: eq(bookings.id, bookingId),
        with: {
          salon: true,
          staff: true,
        },
      });

      if (!booking || !booking.userId) {
        return null;
      }

      const salonSettings = await this.getSalonDepartureSettings(booking.salonId);
      if (!salonSettings.isEnabled) {
        return null;
      }

      const customerPrefs = await this.getCustomerPreferences(booking.userId);
      if (!customerPrefs.receiveAlerts) {
        return null;
      }

      const prediction = await queueCalculatorService.getPredictedStartTime(bookingId);
      if (!prediction) {
        return null;
      }

      const departureLocation = await this.getCustomerDepartureLocation(booking.userId);
      
      let estimatedTravelMinutes = DEFAULT_TRAVEL_MINUTES;
      
      if (departureLocation?.latitude && departureLocation?.longitude && booking.salon) {
        const salonLat = booking.salon.latitude ? parseFloat(booking.salon.latitude) : null;
        const salonLng = booking.salon.longitude ? parseFloat(booking.salon.longitude) : null;
        
        if (salonLat && salonLng) {
          estimatedTravelMinutes = await this.estimateTravelTime(
            { lat: departureLocation.latitude, lng: departureLocation.longitude },
            { lat: salonLat, lng: salonLng }
          );
        }
      }

      // ML Enhancement for premium salons
      let mlEnhancement: {
        predictedDelayMinutes?: number;
        predictedDurationMinutes?: number;
        confidence?: number;
        factors?: Record<string, number>;
        predictionType?: string;
        personalizedBuffer?: number;
      } = {};

      const isPremium = await this.isSalonPremium(booking.salonId);
      if (isPremium && prediction.staffId) {
        try {
          // Get ML-enhanced prediction with staff-specific patterns
          const mlPrediction = await mlPredictionService.getEnhancedPrediction({
            bookingId,
            staffId: prediction.staffId,
            serviceId: booking.serviceId || '',
            salonId: booking.salonId,
            bookingTime: booking.bookingTime,
            bookingDate: booking.bookingDate,
            queuePosition: prediction.appointmentsAhead,
            baseDurationMinutes: 30, // Default, will be refined by ML
          });

          if (mlPrediction.confidence > 0.4) {
            mlEnhancement = {
              predictedDelayMinutes: mlPrediction.predictedDelayMinutes,
              predictedDurationMinutes: mlPrediction.predictedDurationMinutes,
              confidence: mlPrediction.confidence,
              factors: mlPrediction.factors,
              predictionType: mlPrediction.predictionType,
            };

            // Apply ML-enhanced delay and recalculate predicted start time
            if (mlPrediction.confidence > prediction.confidence) {
              const mlDelay = Math.max(prediction.delayMinutes, mlPrediction.predictedDelayMinutes);
              prediction.delayMinutes = mlDelay;
              
              // Recalculate predicted start time with ML-enhanced delay
              const originalTimeMinutes = this.timeToMinutes(booking.bookingTime);
              const newPredictedTimeMinutes = originalTimeMinutes + mlDelay;
              prediction.predictedStartTime = this.minutesToTime(newPredictedTimeMinutes);
            }
          }

          // Get personalized buffer recommendation
          const personalizedBuffer = await mlPredictionService.getPersonalizedBuffer(booking.userId);
          if (personalizedBuffer.confidence > 0.5) {
            mlEnhancement.personalizedBuffer = personalizedBuffer.recommendedBufferMinutes;
          }
        } catch (error) {
          console.error('[ML] Error getting ML predictions for premium salon:', error);
        }
      }

      // Use personalized buffer if available, otherwise default
      const bufferMinutes = Math.max(
        salonSettings.defaultBufferMinutes,
        mlEnhancement.personalizedBuffer || customerPrefs.preferredBufferMinutes
      );

      const totalLeadTime = estimatedTravelMinutes + bufferMinutes;
      const suggestedDepartureTime = this.subtractMinutesFromTime(
        prediction.predictedStartTime,
        totalLeadTime
      );

      let alertType: DepartureRecommendation['alertType'] = 'on_time';
      let priority: DepartureRecommendation['priority'] = 'normal';

      if (prediction.delayMinutes === 0) {
        alertType = 'on_time';
        priority = 'normal';
      } else if (prediction.delayMinutes < salonSettings.minDelayToNotify) {
        alertType = 'on_time';
        priority = 'low';
      } else if (prediction.delayMinutes < 20) {
        alertType = 'delay_update';
        priority = 'normal';
      } else if (prediction.delayMinutes < 40) {
        alertType = 'delay_update';
        priority = 'high';
      } else {
        alertType = 'delay_update';
        priority = 'urgent';
      }

      return {
        bookingId,
        userId: booking.userId,
        salonId: booking.salonId,
        staffId: prediction.staffId,
        originalBookingTime: booking.bookingTime,
        bookingDate: booking.bookingDate,
        predictedStartTime: prediction.predictedStartTime,
        delayMinutes: prediction.delayMinutes,
        delayReason: prediction.delayReason,
        suggestedDepartureTime,
        estimatedTravelMinutes,
        bufferMinutes,
        departureLocation: departureLocation ? {
          label: departureLocation.label,
          latitude: departureLocation.latitude,
          longitude: departureLocation.longitude,
        } : null,
        alertType,
        priority,
        calculationDetails: {
          appointmentsAhead: prediction.appointmentsAhead,
          confidence: prediction.confidence,
          salonSettings,
          customerPrefs,
          isPremium,
          mlEnhancement: Object.keys(mlEnhancement).length > 0 ? mlEnhancement : undefined,
        },
      };
    } catch (error) {
      console.error('Error calculating departure time:', error);
      return null;
    }
  }

  async createOrUpdateDepartureAlert(recommendation: DepartureRecommendation): Promise<DepartureAlert | null> {
    try {
      const existingAlert = await db.query.departureAlerts.findFirst({
        where: and(
          eq(departureAlerts.bookingId, recommendation.bookingId),
          eq(departureAlerts.bookingDate, recommendation.bookingDate)
        ),
      });

      const alertData: InsertDepartureAlert = {
        bookingId: recommendation.bookingId,
        userId: recommendation.userId,
        salonId: recommendation.salonId,
        staffId: recommendation.staffId,
        originalBookingTime: recommendation.originalBookingTime,
        bookingDate: recommendation.bookingDate,
        predictedStartTime: recommendation.predictedStartTime,
        delayMinutes: recommendation.delayMinutes,
        delayReason: recommendation.delayReason,
        suggestedDepartureTime: recommendation.suggestedDepartureTime,
        estimatedTravelMinutes: recommendation.estimatedTravelMinutes,
        bufferMinutes: recommendation.bufferMinutes,
        departureLocationLabel: recommendation.departureLocation?.label || null,
        departureLatitude: recommendation.departureLocation?.latitude?.toString() || null,
        departureLongitude: recommendation.departureLocation?.longitude?.toString() || null,
        alertType: recommendation.alertType,
        priority: recommendation.priority,
        calculationDetails: recommendation.calculationDetails,
        notificationSent: 0,
      };

      if (existingAlert) {
        const hasSignificantChange = 
          Math.abs(existingAlert.delayMinutes - recommendation.delayMinutes) >= 5 ||
          existingAlert.alertType !== recommendation.alertType;

        if (hasSignificantChange) {
          await db.update(departureAlerts)
            .set({
              ...alertData,
              alertType: existingAlert.notificationSent === 1 ? 'delay_update' : alertData.alertType,
              notificationSent: 0,
              updatedAt: new Date(),
            })
            .where(eq(departureAlerts.id, existingAlert.id));

          return db.query.departureAlerts.findFirst({
            where: eq(departureAlerts.id, existingAlert.id),
          }) as Promise<DepartureAlert>;
        }
        return existingAlert;
      } else {
        const [newAlert] = await db.insert(departureAlerts)
          .values(alertData)
          .returning();
        return newAlert;
      }
    } catch (error) {
      console.error('Error creating/updating departure alert:', error);
      return null;
    }
  }

  async getDepartureStatusForBooking(bookingId: string): Promise<{
    bookingId: string;
    originalTime: string;
    predictedStartTime: string;
    delayMinutes: number;
    delayReason: string | null;
    suggestedDeparture: {
      time: string;
      fromLocation: string | null;
      estimatedTravelMinutes: number;
      bufferMinutes: number;
    };
    staffStatus: {
      name: string | null;
      currentStatus: string;
      appointmentsAhead: number;
    } | null;
    lastUpdated: Date;
  } | null> {
    try {
      const recommendation = await this.calculateDepartureTime(bookingId);
      if (!recommendation) {
        return null;
      }

      let staffStatus = null;
      if (recommendation.staffId) {
        const queueStatus = await queueCalculatorService.getStaffQueueStatus(recommendation.staffId);
        if (queueStatus) {
          staffStatus = {
            name: queueStatus.staffName,
            currentStatus: queueStatus.currentStatus,
            appointmentsAhead: queueStatus.appointmentsAhead,
          };
        }
      }

      return {
        bookingId,
        originalTime: recommendation.originalBookingTime,
        predictedStartTime: recommendation.predictedStartTime,
        delayMinutes: recommendation.delayMinutes,
        delayReason: recommendation.delayReason,
        suggestedDeparture: {
          time: recommendation.suggestedDepartureTime,
          fromLocation: recommendation.departureLocation?.label || null,
          estimatedTravelMinutes: recommendation.estimatedTravelMinutes,
          bufferMinutes: recommendation.bufferMinutes,
        },
        staffStatus,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting departure status:', error);
      return null;
    }
  }
}

export const departureCalculatorService = new DepartureCalculatorService();
