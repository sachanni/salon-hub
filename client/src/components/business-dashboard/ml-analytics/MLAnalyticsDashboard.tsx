import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertCircle, Crown, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useOverviewKPIs, usePredictionAccuracy, useStaffPerformance, useTimingTrends } from "./hooks/useMLAnalytics";
import { OverviewKPICards } from "./OverviewKPICards";
import { PredictionAccuracyChart } from "./PredictionAccuracyChart";
import { StaffPerformancePanel } from "./StaffPerformancePanel";
import { ServiceTimingHeatmap } from "./ServiceTimingHeatmap";
import { DateRangeSelector } from "./DateRangeSelector";
import { DataFreshnessBadge } from "./DataFreshnessBadge";

interface MLAnalyticsDashboardProps {
  salonId: string;
}

export function MLAnalyticsDashboard({ salonId }: MLAnalyticsDashboardProps) {
  const [days, setDays] = useState(7);
  const queryClient = useQueryClient();

  const { data: overviewData, isLoading: loadingOverview, error: overviewError } = useOverviewKPIs(salonId, days);
  const { data: accuracyData, isLoading: loadingAccuracy } = usePredictionAccuracy(salonId, days);
  const { data: staffData, isLoading: loadingStaff } = useStaffPerformance(salonId, days);
  const { data: timingData, isLoading: loadingTiming } = useTimingTrends(salonId, days);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ 
      predicate: (query) => 
        query.queryKey[0] === 'ml-analytics' && query.queryKey[2] === salonId
    });
  };

  const isPremiumError = (overviewError as any)?.upgradeRequired;

  if (isPremiumError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">ML Analytics Dashboard</h2>
              <p className="text-sm text-gray-500">Prediction accuracy and performance insights</p>
            </div>
          </div>
        </div>

        <Alert className="border-amber-200 bg-amber-50">
          <Crown className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-800">Premium Feature</AlertTitle>
          <AlertDescription className="text-amber-700">
            The ML Analytics Dashboard is available on Professional, Premium, and Enterprise plans.
            Upgrade your subscription to access detailed prediction accuracy metrics, staff performance
            insights, and service timing analysis.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-50">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg border p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-8 w-24 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (overviewError && !isPremiumError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">ML Analytics Dashboard</h2>
            <p className="text-sm text-gray-500">Prediction accuracy and performance insights</p>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription>
            {(overviewError as any)?.error || 'Failed to load analytics data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">ML Analytics Dashboard</h2>
            <p className="text-sm text-gray-500">Prediction accuracy and performance insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DataFreshnessBadge dataFreshness={overviewData?.meta?.dataFreshness} />
          <DateRangeSelector value={days} onChange={setDays} />
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <OverviewKPICards 
        data={overviewData?.data} 
        isLoading={loadingOverview} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PredictionAccuracyChart 
          data={accuracyData?.data} 
          isLoading={loadingAccuracy} 
        />
        <StaffPerformancePanel 
          data={staffData?.data} 
          isLoading={loadingStaff} 
        />
      </div>

      <ServiceTimingHeatmap 
        data={timingData?.data} 
        isLoading={loadingTiming} 
      />
    </div>
  );
}
