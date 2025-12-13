import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Target, Users, Clock, BarChart3 } from "lucide-react";
import type { OverviewKPIs } from "./hooks/useMLAnalytics";

interface OverviewKPICardsProps {
  data?: OverviewKPIs;
  isLoading: boolean;
}

function TrendIndicator({ value, unit = "", inverse = false }: { value: number; unit?: string; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNegative = inverse ? value > 0 : value < 0;
  
  if (Math.abs(value) < 0.1) {
    return (
      <span className="flex items-center gap-1 text-sm text-gray-500">
        <Minus className="h-3 w-3" />
        No change
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-600' : 'text-orange-600'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value > 0 ? '+' : ''}{value.toFixed(1)}{unit}
    </span>
  );
}

function KPICard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  trend, 
  trendUnit,
  trendInverse = false,
  color,
  isLoading 
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: number;
  trendUnit?: string;
  trendInverse?: boolean;
  color: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-24 mt-4" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend !== undefined && (
            <TrendIndicator value={trend} unit={trendUnit} inverse={trendInverse} />
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">
            {value}{unit && <span className="text-lg font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          <p className="text-sm text-gray-600 mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewKPICards({ data, isLoading }: OverviewKPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Prediction Accuracy"
        value={data?.predictionAccuracy ?? 0}
        unit="%"
        icon={Target}
        trend={data?.trendsVsLastPeriod.accuracy}
        trendUnit="%"
        color="bg-blue-500"
        isLoading={isLoading}
      />
      <KPICard
        title="Total Predictions"
        value={data?.totalPredictions ?? 0}
        icon={BarChart3}
        trend={data?.trendsVsLastPeriod.predictions}
        color="bg-purple-500"
        isLoading={isLoading}
      />
      <KPICard
        title="Staff Tracked"
        value={data?.activeStaffTracked ?? 0}
        icon={Users}
        color="bg-emerald-500"
        isLoading={isLoading}
      />
      <KPICard
        title="Avg Service Overrun"
        value={data?.avgServiceOverrun ?? 0}
        unit=" min"
        icon={Clock}
        trend={data?.trendsVsLastPeriod.overrun}
        trendUnit=" min"
        trendInverse={true}
        color="bg-amber-500"
        isLoading={isLoading}
      />
    </div>
  );
}
