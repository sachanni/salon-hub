import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

type DemandLevel = 'low' | 'medium' | 'high' | 'peak';

interface DemandHeatmapEntry {
  hour: number;
  demand: DemandLevel;
  discount: { type: 'percentage' | 'fixed'; value: number; label: string } | null;
}

interface BestTimeSlot {
  day: string;
  time: string;
  discount: string;
}

interface HeatmapResponse {
  heatmap: Record<string, DemandHeatmapEntry[]>;
  legend: Record<DemandLevel, { label: string; color: string }>;
  bestTimes: BestTimeSlot[];
}

const DEMAND_COLORS: Record<DemandLevel, string> = {
  low: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700',
  medium: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
  high: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
  peak: 'bg-red-100 hover:bg-red-200 text-red-700',
};

const DAY_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_SHORT_NAMES: Record<string, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};

function formatHour(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

interface DemandHeatmapProps {
  salonId: string;
  onSlotSelect?: (day: string, hour: number) => void;
  compact?: boolean;
}

export function DemandHeatmap({ salonId, onSlotSelect, compact = false }: DemandHeatmapProps) {
  const { data, isLoading, error, refetch, isRefetching } = useQuery<HeatmapResponse>({
    queryKey: ['demand-heatmap', salonId],
    queryFn: async () => {
      const response = await fetch(`/api/dynamic-pricing/salons/${salonId}/demand-heatmap`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch demand data');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-3">Unable to load demand data</p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            {isRefetching ? 'Retrying...' : 'Try again'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.heatmap || Object.keys(data.heatmap).length === 0) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No demand data available</p>
          <p className="text-xs text-muted-foreground">Demand patterns will appear after bookings</p>
        </CardContent>
      </Card>
    );
  }

  const firstAvailableDay = DAY_ORDER.find(day => data.heatmap[day]?.length > 0);
  const hours = firstAvailableDay ? data.heatmap[firstAvailableDay].map(e => e.hour) : [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  return (
    <Card className={compact ? 'border-0 shadow-none' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Best Times to Book
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-100" />
              <span>Save</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100" />
              <span>Busy</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.bestTimes && data.bestTimes.length > 0 && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Best Deals</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.bestTimes.slice(0, 3).map((slot, i) => (
                <Badge key={i} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {slot.day} {slot.time} - {slot.discount}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `80px repeat(${hours.length}, 1fr)` }}>
              <div className="text-xs text-muted-foreground font-medium" />
              {hours.map((hour) => (
                <div key={hour} className="text-xs text-muted-foreground text-center font-medium">
                  {formatHour(hour)}
                </div>
              ))}
            </div>
            {DAY_ORDER.map((dayKey) => {
              const dayData = data.heatmap[dayKey];
              if (!dayData) return null;

              return (
                <div key={dayKey} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `80px repeat(${hours.length}, 1fr)` }}>
                  <div className="text-sm font-medium text-muted-foreground flex items-center">
                    {DAY_SHORT_NAMES[dayKey]}
                  </div>
                  {hours.map((hour) => {
                    const entry = dayData.find(e => e.hour === hour);
                    if (!entry) {
                      return (
                        <div key={hour} className="h-8 rounded bg-gray-100 flex items-center justify-center">
                          <span className="text-[10px] text-gray-400">-</span>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={entry.hour}
                        onClick={() => onSlotSelect?.(dayKey, entry.hour)}
                        className={`h-8 rounded transition-colors flex flex-col items-center justify-center ${DEMAND_COLORS[entry.demand]}`}
                        title={entry.discount?.label || undefined}
                      >
                        {entry.discount && (
                          <span className="text-[10px] font-medium">
                            {entry.discount.type === 'percentage' ? `-${entry.discount.value}%` : `₹${entry.discount.value / 100}`}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        
        {data.legend && Object.keys(data.legend).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-3">
              {Object.entries(data.legend).map(([level, info]) => (
                info && (
                  <div key={level} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded" 
                      style={{ backgroundColor: info.color || '#6b7280' }}
                    />
                    <span className="text-xs text-muted-foreground">{info.label || level}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
