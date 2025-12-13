import { db } from "../db";
import { eq, and, sql, desc, gte, lte, between, asc, count, avg } from "drizzle-orm";
import {
  serviceTimingAnalytics,
  staffPerformancePatterns,
  predictionAccuracyLogs,
  staff,
  services,
  salonSubscriptions,
} from "@shared/schema";
import { PREMIUM_TIER_IDS } from "../constants/subscription";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface OverviewKPIs {
  predictionAccuracy: number;
  totalPredictions: number;
  activeStaffTracked: number;
  avgServiceOverrun: number;
  trendsVsLastPeriod: {
    accuracy: number;
    predictions: number;
    overrun: number;
  };
}

interface AccuracyDataPoint {
  date: string;
  accuracy: number;
  confidence: number;
  samples: number;
}

interface AccuracyTrend {
  trend: AccuracyDataPoint[];
  summary: {
    avgAccuracy: number;
    minAccuracy: number;
    maxAccuracy: number;
    targetAccuracy: number;
  };
}

interface StaffPerformanceData {
  staffId: string;
  name: string;
  speedFactor: number;
  consistencyScore: number;
  totalServices: number;
  trend: 'improving' | 'declining' | 'stable';
  history: { date: string; speedFactor: number }[];
}

interface HeatmapCell {
  dayOfWeek: number;
  hourOfDay: number;
  avgOverrun: number;
  samples: number;
}

interface ServiceTimingData {
  heatmap: HeatmapCell[];
  summary: {
    busiestDay: number;
    busiestHour: number;
    calmestDay: number;
    calmestHour: number;
  };
}

interface ServiceTrendItem {
  serviceId: string;
  serviceName: string;
  avgOverrun: number;
  sampleCount: number;
  trend: 'over' | 'under' | 'ontime';
}

export class MLAnalyticsService {
  async isSalonPremium(salonId: string): Promise<boolean> {
    const [subscription] = await db
      .select()
      .from(salonSubscriptions)
      .where(
        and(
          eq(salonSubscriptions.salonId, salonId),
          eq(salonSubscriptions.status, 'active')
        )
      )
      .limit(1);

    if (!subscription) return false;
    return PREMIUM_TIER_IDS.includes(subscription.tierId);
  }

  async getOverviewKPIs(salonId: string, dateRange: DateRange): Promise<OverviewKPIs> {
    const currentPeriodData = await db
      .select({
        totalPredictions: count(predictionAccuracyLogs.id),
        avgAccuracy: sql<number>`AVG(CASE 
          WHEN ${predictionAccuracyLogs.startTimeErrorMinutes} IS NOT NULL 
          THEN GREATEST(0, 1 - ABS(${predictionAccuracyLogs.startTimeErrorMinutes}::numeric) / 30)
          ELSE 0.85 
        END)`,
      })
      .from(predictionAccuracyLogs)
      .where(
        and(
          eq(predictionAccuracyLogs.salonId, salonId),
          gte(predictionAccuracyLogs.createdAt, new Date(dateRange.startDate)),
          lte(predictionAccuracyLogs.createdAt, new Date(dateRange.endDate))
        )
      );

    const previousPeriodStart = new Date(dateRange.startDate);
    const daysDiff = Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24));
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff);

    const previousPeriodData = await db
      .select({
        totalPredictions: count(predictionAccuracyLogs.id),
        avgAccuracy: sql<number>`AVG(CASE 
          WHEN ${predictionAccuracyLogs.startTimeErrorMinutes} IS NOT NULL 
          THEN GREATEST(0, 1 - ABS(${predictionAccuracyLogs.startTimeErrorMinutes}::numeric) / 30)
          ELSE 0.85 
        END)`,
      })
      .from(predictionAccuracyLogs)
      .where(
        and(
          eq(predictionAccuracyLogs.salonId, salonId),
          gte(predictionAccuracyLogs.createdAt, previousPeriodStart),
          lte(predictionAccuracyLogs.createdAt, new Date(dateRange.startDate))
        )
      );

    const activeStaff = await db
      .select({ count: count(staffPerformancePatterns.staffId) })
      .from(staffPerformancePatterns)
      .where(
        and(
          eq(staffPerformancePatterns.salonId, salonId),
          gte(staffPerformancePatterns.updatedAt, new Date(dateRange.startDate)),
          lte(staffPerformancePatterns.updatedAt, new Date(dateRange.endDate))
        )
      )
      .groupBy(staffPerformancePatterns.staffId);

    const overrunData = await db
      .select({
        avgOverrun: sql<number>`AVG(${serviceTimingAnalytics.avgOverrunMinutes}::numeric)`,
      })
      .from(serviceTimingAnalytics)
      .where(
        and(
          eq(serviceTimingAnalytics.salonId, salonId),
          gte(serviceTimingAnalytics.updatedAt, new Date(dateRange.startDate)),
          lte(serviceTimingAnalytics.updatedAt, new Date(dateRange.endDate))
        )
      );

    const prevOverrunData = await db
      .select({
        avgOverrun: sql<number>`AVG(${serviceTimingAnalytics.avgOverrunMinutes}::numeric)`,
      })
      .from(serviceTimingAnalytics)
      .where(
        and(
          eq(serviceTimingAnalytics.salonId, salonId),
          gte(serviceTimingAnalytics.updatedAt, previousPeriodStart),
          lte(serviceTimingAnalytics.updatedAt, new Date(dateRange.startDate))
        )
      );

    const currentAccuracy = currentPeriodData[0]?.avgAccuracy || 0;
    const previousAccuracy = previousPeriodData[0]?.avgAccuracy || 0;
    const currentPredictions = currentPeriodData[0]?.totalPredictions || 0;
    const previousPredictions = previousPeriodData[0]?.totalPredictions || 0;
    const currentOverrun = overrunData[0]?.avgOverrun || 0;
    const previousOverrun = prevOverrunData[0]?.avgOverrun || 0;

    return {
      predictionAccuracy: parseFloat((currentAccuracy * 100).toFixed(1)),
      totalPredictions: currentPredictions,
      activeStaffTracked: activeStaff.length,
      avgServiceOverrun: parseFloat(currentOverrun.toFixed(1)),
      trendsVsLastPeriod: {
        accuracy: parseFloat(((currentAccuracy - previousAccuracy) * 100).toFixed(1)),
        predictions: currentPredictions - previousPredictions,
        overrun: parseFloat((currentOverrun - previousOverrun).toFixed(1)),
      },
    };
  }

  async getPredictionAccuracyTrend(salonId: string, dateRange: DateRange): Promise<AccuracyTrend> {
    const dailyAccuracy = await db
      .select({
        date: sql<string>`DATE(${predictionAccuracyLogs.createdAt})::text`,
        avgAccuracy: sql<number>`AVG(CASE 
          WHEN ${predictionAccuracyLogs.startTimeErrorMinutes} IS NOT NULL 
          THEN GREATEST(0, 1 - ABS(${predictionAccuracyLogs.startTimeErrorMinutes}::numeric) / 30)
          ELSE 0.85 
        END)`,
        avgConfidence: sql<number>`AVG(CASE 
          WHEN ${predictionAccuracyLogs.predictionType} = 'ml_enhanced' THEN 0.8
          WHEN ${predictionAccuracyLogs.predictionType} = 'staff_adjusted' THEN 0.6
          ELSE 0.5
        END)`,
        samples: count(predictionAccuracyLogs.id),
      })
      .from(predictionAccuracyLogs)
      .where(
        and(
          eq(predictionAccuracyLogs.salonId, salonId),
          gte(predictionAccuracyLogs.createdAt, new Date(dateRange.startDate)),
          lte(predictionAccuracyLogs.createdAt, new Date(dateRange.endDate))
        )
      )
      .groupBy(sql`DATE(${predictionAccuracyLogs.createdAt})`)
      .orderBy(sql`DATE(${predictionAccuracyLogs.createdAt})`);

    const trend: AccuracyDataPoint[] = dailyAccuracy.map(row => ({
      date: row.date,
      accuracy: parseFloat((row.avgAccuracy * 100).toFixed(1)),
      confidence: parseFloat(row.avgConfidence.toFixed(2)),
      samples: row.samples,
    }));

    const allAccuracies = trend.map(t => t.accuracy);
    const avgAccuracy = allAccuracies.length > 0 
      ? allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length 
      : 85;

    return {
      trend,
      summary: {
        avgAccuracy: parseFloat(avgAccuracy.toFixed(1)),
        minAccuracy: allAccuracies.length > 0 ? Math.min(...allAccuracies) : 80,
        maxAccuracy: allAccuracies.length > 0 ? Math.max(...allAccuracies) : 90,
        targetAccuracy: 85.0,
      },
    };
  }

  async getStaffPerformance(salonId: string, dateRange: DateRange): Promise<{ staff: StaffPerformanceData[] }> {
    const staffData = await db
      .select({
        staffId: staffPerformancePatterns.staffId,
        staffName: staff.name,
        speedFactor: sql<number>`AVG(${staffPerformancePatterns.speedFactor}::numeric)`,
        consistencyScore: sql<number>`AVG(${staffPerformancePatterns.consistencyScore}::numeric)`,
        totalServices: sql<number>`SUM(${staffPerformancePatterns.sampleCount})`,
      })
      .from(staffPerformancePatterns)
      .leftJoin(staff, eq(staffPerformancePatterns.staffId, staff.id))
      .where(
        and(
          eq(staffPerformancePatterns.salonId, salonId),
          gte(staffPerformancePatterns.updatedAt, new Date(dateRange.startDate)),
          lte(staffPerformancePatterns.updatedAt, new Date(dateRange.endDate))
        )
      )
      .groupBy(staffPerformancePatterns.staffId, staff.name);

    const historyData = await db
      .select({
        staffId: staffPerformancePatterns.staffId,
        date: sql<string>`DATE(${staffPerformancePatterns.updatedAt})::text`,
        speedFactor: sql<number>`AVG(${staffPerformancePatterns.speedFactor}::numeric)`,
      })
      .from(staffPerformancePatterns)
      .where(
        and(
          eq(staffPerformancePatterns.salonId, salonId),
          gte(staffPerformancePatterns.updatedAt, new Date(dateRange.startDate)),
          lte(staffPerformancePatterns.updatedAt, new Date(dateRange.endDate))
        )
      )
      .groupBy(staffPerformancePatterns.staffId, sql`DATE(${staffPerformancePatterns.updatedAt})`)
      .orderBy(sql`DATE(${staffPerformancePatterns.updatedAt})`);

    const historyByStaff = new Map<string, { date: string; speedFactor: number }[]>();
    historyData.forEach(row => {
      const staffHistory = historyByStaff.get(row.staffId) || [];
      staffHistory.push({
        date: row.date,
        speedFactor: parseFloat((row.speedFactor || 1.0).toFixed(2)),
      });
      historyByStaff.set(row.staffId, staffHistory);
    });

    const staffPerformance: StaffPerformanceData[] = staffData.map(row => {
      const speedFactor = parseFloat(row.speedFactor?.toString() || '1.0');
      const history = historyByStaff.get(row.staffId) || [];
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (history.length >= 2) {
        const recent = history.slice(-3);
        const first = recent[0].speedFactor;
        const last = recent[recent.length - 1].speedFactor;
        if (last < first - 0.05) trend = 'improving';
        else if (last > first + 0.05) trend = 'declining';
      } else {
        trend = speedFactor < 0.95 ? 'improving' : speedFactor > 1.05 ? 'declining' : 'stable';
      }

      return {
        staffId: row.staffId,
        name: row.staffName || 'Unknown Staff',
        speedFactor: parseFloat(speedFactor.toFixed(2)),
        consistencyScore: parseFloat((row.consistencyScore || 0).toFixed(2)),
        totalServices: row.totalServices || 0,
        trend,
        history,
      };
    });

    return { staff: staffPerformance };
  }

  async getServiceTimingHeatmap(salonId: string, dateRange: DateRange): Promise<ServiceTimingData> {
    const heatmapData = await db
      .select({
        dayOfWeek: serviceTimingAnalytics.dayOfWeek,
        hourOfDay: serviceTimingAnalytics.hourBlock,
        avgOverrun: sql<number>`AVG(${serviceTimingAnalytics.avgOverrunMinutes}::numeric)`,
        samples: sql<number>`SUM(${serviceTimingAnalytics.sampleCount})`,
      })
      .from(serviceTimingAnalytics)
      .where(
        and(
          eq(serviceTimingAnalytics.salonId, salonId),
          gte(serviceTimingAnalytics.updatedAt, new Date(dateRange.startDate)),
          lte(serviceTimingAnalytics.updatedAt, new Date(dateRange.endDate))
        )
      )
      .groupBy(serviceTimingAnalytics.dayOfWeek, serviceTimingAnalytics.hourBlock)
      .orderBy(serviceTimingAnalytics.dayOfWeek, serviceTimingAnalytics.hourBlock);

    const heatmap: HeatmapCell[] = heatmapData.map(row => ({
      dayOfWeek: row.dayOfWeek,
      hourOfDay: row.hourOfDay,
      avgOverrun: parseFloat((row.avgOverrun || 0).toFixed(1)),
      samples: row.samples || 0,
    }));

    let busiestDay = 0, busiestHour = 0, calmestDay = 0, calmestHour = 0;
    let maxSamples = 0, minSamples = Infinity;

    heatmap.forEach(cell => {
      if (cell.samples > maxSamples) {
        maxSamples = cell.samples;
        busiestDay = cell.dayOfWeek;
        busiestHour = cell.hourOfDay;
      }
      if (cell.samples < minSamples && cell.samples > 0) {
        minSamples = cell.samples;
        calmestDay = cell.dayOfWeek;
        calmestHour = cell.hourOfDay;
      }
    });

    return {
      heatmap,
      summary: { busiestDay, busiestHour, calmestDay, calmestHour },
    };
  }

  async getServiceTypeTrends(salonId: string): Promise<{ services: ServiceTrendItem[] }> {
    const serviceData = await db
      .select({
        serviceId: serviceTimingAnalytics.serviceId,
        serviceName: services.name,
        avgOverrun: sql<number>`AVG(${serviceTimingAnalytics.avgOverrunMinutes}::numeric)`,
        sampleCount: sql<number>`SUM(${serviceTimingAnalytics.sampleCount})`,
      })
      .from(serviceTimingAnalytics)
      .leftJoin(services, eq(serviceTimingAnalytics.serviceId, services.id))
      .where(eq(serviceTimingAnalytics.salonId, salonId))
      .groupBy(serviceTimingAnalytics.serviceId, services.name)
      .orderBy(sql`AVG(${serviceTimingAnalytics.avgOverrunMinutes}::numeric) DESC`);

    const serviceTrends: ServiceTrendItem[] = serviceData.map(row => {
      const avgOverrun = parseFloat((row.avgOverrun || 0).toFixed(1));
      return {
        serviceId: row.serviceId,
        serviceName: row.serviceName || 'Unknown Service',
        avgOverrun,
        sampleCount: row.sampleCount || 0,
        trend: avgOverrun > 3 ? 'over' : avgOverrun < -3 ? 'under' : 'ontime',
      };
    });

    return { services: serviceTrends };
  }

  getDataFreshness(): string {
    const now = new Date();
    now.setHours(3, 0, 0, 0);
    if (new Date() < now) {
      now.setDate(now.getDate() - 1);
    }
    return now.toISOString();
  }
}

export const mlAnalyticsService = new MLAnalyticsService();
