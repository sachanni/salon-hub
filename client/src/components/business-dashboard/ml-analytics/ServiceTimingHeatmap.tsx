import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { HeatmapCell } from "./hooks/useMLAnalytics";

interface ServiceTimingHeatmapProps {
  data?: {
    heatmap: HeatmapCell[];
    summary: {
      busiestDay: number;
      busiestHour: number;
      calmestDay: number;
      calmestHour: number;
    };
  };
  isLoading: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 9);

function getColor(overrun: number, maxAbs: number): string {
  if (maxAbs === 0) return 'bg-gray-100';
  
  const normalized = overrun / maxAbs;
  
  if (normalized > 0.6) return 'bg-red-400';
  if (normalized > 0.3) return 'bg-orange-300';
  if (normalized > 0.1) return 'bg-amber-200';
  if (normalized > -0.1) return 'bg-gray-100';
  if (normalized > -0.3) return 'bg-blue-100';
  if (normalized > -0.6) return 'bg-blue-200';
  return 'bg-blue-300';
}

function formatHour(hour: number): string {
  if (hour === 12) return '12pm';
  if (hour > 12) return `${hour - 12}pm`;
  return `${hour}am`;
}

export function ServiceTimingHeatmap({ data, isLoading }: ServiceTimingHeatmapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const heatmapData = data?.heatmap ?? [];
  
  const cellMap = new Map<string, HeatmapCell>();
  heatmapData.forEach(cell => {
    cellMap.set(`${cell.dayOfWeek}-${cell.hourOfDay}`, cell);
  });

  const allOverruns = heatmapData.map(c => Math.abs(c.avgOverrun));
  const maxAbsOverrun = allOverruns.length > 0 ? Math.max(...allOverruns) : 5;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Service Timing Heatmap</CardTitle>
            <CardDescription>Average overrun by day and hour</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-300 rounded" />
              <span>Under</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-100 rounded border" />
              <span>On time</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-300 rounded" />
              <span>Over</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {heatmapData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            No timing data available yet
          </div>
        ) : (
          <TooltipProvider>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-[60px_repeat(12,1fr)] gap-1">
                  <div />
                  {HOURS.map(hour => (
                    <div key={hour} className="text-center text-xs text-gray-500 py-1">
                      {formatHour(hour)}
                    </div>
                  ))}
                  
                  {DAYS.map((day, dayIndex) => (
                    <>
                      <div key={`day-${dayIndex}`} className="text-sm font-medium text-gray-600 flex items-center">
                        {day}
                      </div>
                      {HOURS.map(hour => {
                        const cell = cellMap.get(`${dayIndex + 1}-${hour}`);
                        const overrun = cell?.avgOverrun ?? 0;
                        const samples = cell?.samples ?? 0;
                        
                        return (
                          <Tooltip key={`${dayIndex}-${hour}`}>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-8 rounded cursor-pointer transition-all hover:ring-2 hover:ring-gray-400 ${
                                  samples > 0 ? getColor(overrun, maxAbsOverrun) : 'bg-gray-50'
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">{day} at {formatHour(hour)}</p>
                                {samples > 0 ? (
                                  <>
                                    <p className={overrun > 0 ? 'text-orange-600' : overrun < 0 ? 'text-blue-600' : ''}>
                                      {overrun > 0 ? '+' : ''}{overrun.toFixed(1)} min
                                    </p>
                                    <p className="text-gray-500">{samples} services</p>
                                  </>
                                ) : (
                                  <p className="text-gray-500">No data</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          </TooltipProvider>
        )}
        
        {data?.summary && heatmapData.length > 0 && (
          <div className="mt-4 flex gap-6 text-sm border-t pt-4">
            <div>
              <span className="text-gray-500">Busiest: </span>
              <span className="font-medium">
                {DAYS[data.summary.busiestDay - 1]} at {formatHour(data.summary.busiestHour)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Calmest: </span>
              <span className="font-medium">
                {DAYS[data.summary.calmestDay - 1]} at {formatHour(data.summary.calmestHour)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
