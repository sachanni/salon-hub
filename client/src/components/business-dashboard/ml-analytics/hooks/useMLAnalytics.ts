import { useQuery } from "@tanstack/react-query";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface TrendsVsLastPeriod {
  accuracy: number;
  predictions: number;
  overrun: number;
}

export interface OverviewKPIs {
  predictionAccuracy: number;
  totalPredictions: number;
  activeStaffTracked: number;
  avgServiceOverrun: number;
  trendsVsLastPeriod: TrendsVsLastPeriod;
}

export interface AccuracyDataPoint {
  date: string;
  accuracy: number;
  confidence: number;
  samples: number;
}

export interface AccuracyTrend {
  trend: AccuracyDataPoint[];
  summary: {
    avgAccuracy: number;
    minAccuracy: number;
    maxAccuracy: number;
    targetAccuracy: number;
  };
}

export interface StaffPerformanceData {
  staffId: string;
  name: string;
  speedFactor: number;
  consistencyScore: number;
  totalServices: number;
  trend: 'improving' | 'declining' | 'stable';
  history: { date: string; speedFactor: number }[];
}

export interface HeatmapCell {
  dayOfWeek: number;
  hourOfDay: number;
  avgOverrun: number;
  samples: number;
}

export interface ServiceTrendItem {
  serviceId: string;
  serviceName: string;
  avgOverrun: number;
  sampleCount: number;
  trend: 'over' | 'under' | 'ontime';
}

export interface TimingTrendsData {
  heatmap: HeatmapCell[];
  summary: {
    busiestDay: number;
    busiestHour: number;
    calmestDay: number;
    calmestHour: number;
  };
  services: ServiceTrendItem[];
}

interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  meta: {
    salonId: string;
    dateRange?: DateRange;
    dataFreshness: string;
  };
  error?: string;
  upgradeRequired?: boolean;
}

async function fetchWithAuth<T>(url: string): Promise<AnalyticsResponse<T>> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw error;
  }

  return res.json();
}

export function useOverviewKPIs(salonId: string, days: number = 7) {
  return useQuery({
    queryKey: ['ml-analytics', 'overview', salonId, days],
    queryFn: () => fetchWithAuth<OverviewKPIs>(
      `/api/premium-analytics/dashboard/overview?salonId=${salonId}&days=${days}`
    ),
    enabled: !!salonId,
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function usePredictionAccuracy(salonId: string, days: number = 7) {
  return useQuery({
    queryKey: ['ml-analytics', 'accuracy', salonId, days],
    queryFn: () => fetchWithAuth<AccuracyTrend>(
      `/api/premium-analytics/predictions/accuracy?salonId=${salonId}&days=${days}`
    ),
    enabled: !!salonId,
    staleTime: 60000,
  });
}

export function useStaffPerformance(salonId: string, days: number = 7) {
  return useQuery({
    queryKey: ['ml-analytics', 'staff', salonId, days],
    queryFn: () => fetchWithAuth<{ staff: StaffPerformanceData[] }>(
      `/api/premium-analytics/staff/performance?salonId=${salonId}&days=${days}`
    ),
    enabled: !!salonId,
    staleTime: 60000,
  });
}

export function useTimingTrends(salonId: string, days: number = 7) {
  return useQuery({
    queryKey: ['ml-analytics', 'timing', salonId, days],
    queryFn: () => fetchWithAuth<TimingTrendsData>(
      `/api/premium-analytics/services/timing-trends?salonId=${salonId}&days=${days}`
    ),
    enabled: !!salonId,
    staleTime: 60000,
  });
}
