import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend 
} from "recharts";
import { TrendingUp, TrendingDown, Minus, User, BarChart3, LineChartIcon, TableIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { StaffPerformanceData } from "./hooks/useMLAnalytics";

interface StaffPerformancePanelProps {
  data?: { staff: StaffPerformanceData[] };
  isLoading: boolean;
}

const STAFF_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', 
  '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
];

const SPEED_COLORS = {
  fast: '#10B981',
  average: '#3B82F6',
  slow: '#F97316',
};

function getTrendIcon(trend: 'improving' | 'declining' | 'stable') {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-orange-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
}

function getSpeedBadge(speedFactor: number) {
  if (speedFactor < 0.9) {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Fast</Badge>;
  } else if (speedFactor > 1.1) {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Slow</Badge>;
  }
  return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Average</Badge>;
}

function getSpeedColor(speedFactor: number) {
  if (speedFactor < 0.9) return SPEED_COLORS.fast;
  if (speedFactor > 1.1) return SPEED_COLORS.slow;
  return SPEED_COLORS.average;
}

function getConsistencyBadge(score: number) {
  if (score < 0.15) {
    return <Badge variant="outline" className="border-emerald-300 text-emerald-600">Very Consistent</Badge>;
  } else if (score < 0.25) {
    return <Badge variant="outline" className="border-blue-300 text-blue-600">Consistent</Badge>;
  }
  return <Badge variant="outline" className="border-amber-300 text-amber-600">Variable</Badge>;
}

function BarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-medium text-sm">{data.fullName}</p>
      <p className="text-sm mt-1">
        Speed Factor: <span className="font-semibold">{data.speedFactor.toFixed(2)}x</span>
      </p>
      <p className="text-sm text-gray-500">
        {data.speedFactor < 0.9 ? 'Faster than average' : 
         data.speedFactor > 1.1 ? 'Slower than average' : 'Average speed'}
      </p>
    </div>
  );
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg max-w-xs">
      <p className="font-medium text-sm mb-2">{format(parseISO(label), "MMM d, yyyy")}</p>
      {payload.map((entry: any, idx: number) => (
        <p key={idx} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value?.toFixed(2)}x</span>
        </p>
      ))}
    </div>
  );
}

export function StaffPerformancePanel({ data, isLoading }: StaffPerformancePanelProps) {
  const [activeTab, setActiveTab] = useState<'trend' | 'bar' | 'table'>('trend');
  const [sortBy, setSortBy] = useState<'name' | 'speedFactor' | 'totalServices'>('speedFactor');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const staffList = data?.staff ?? [];

  const hasHistoryData = useMemo(() => {
    return staffList.some(s => s.history && s.history.length > 0);
  }, [staffList]);

  const trendChartData = useMemo(() => {
    if (!hasHistoryData) return [];
    
    const allDates = new Set<string>();
    staffList.forEach(staff => {
      staff.history?.forEach(h => allDates.add(h.date));
    });

    const sortedDates = Array.from(allDates).sort();
    
    return sortedDates.map(date => {
      const point: Record<string, any> = { date };
      staffList.forEach(staff => {
        const historyPoint = staff.history?.find(h => h.date === date);
        if (historyPoint) {
          point[staff.name] = historyPoint.speedFactor;
        }
      });
      return point;
    });
  }, [staffList, hasHistoryData]);

  const barChartData = useMemo(() => {
    return [...staffList]
      .sort((a, b) => a.speedFactor - b.speedFactor)
      .map(staff => ({
        name: staff.name.length > 12 ? staff.name.slice(0, 12) + '...' : staff.name,
        fullName: staff.name,
        speedFactor: staff.speedFactor,
        totalServices: staff.totalServices,
      }));
  }, [staffList]);

  const sortedStaff = useMemo(() => {
    return [...staffList].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'speedFactor':
          cmp = a.speedFactor - b.speedFactor;
          break;
        case 'totalServices':
          cmp = a.totalServices - b.totalServices;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [staffList, sortBy, sortDir]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Staff Performance</CardTitle>
            <CardDescription>Speed factors and trends over time</CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-[180px] grid-cols-3">
              <TabsTrigger value="trend" title="Trend">
                <LineChartIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="bar" title="Compare">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table" title="Details">
                <TableIcon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {staffList.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-gray-500">
            <User className="h-12 w-12 mb-2 opacity-30" />
            <p>No staff performance data available</p>
            <p className="text-sm mt-1">Data will appear as services are completed</p>
          </div>
        ) : activeTab === 'trend' ? (
          <div>
            {!hasHistoryData ? (
              <div className="h-[260px] flex flex-col items-center justify-center text-gray-500">
                <LineChartIcon className="h-10 w-10 mb-2 opacity-30" />
                <p>No historical trend data yet</p>
                <p className="text-sm mt-1">Trends will appear after a few days of data collection</p>
                <button 
                  onClick={() => setActiveTab('bar')} 
                  className="text-blue-600 text-sm mt-3 hover:underline"
                >
                  View current speed factors instead
                </button>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendChartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => format(parseISO(v), "MMM d")}
                    />
                    <YAxis 
                      domain={[0.7, 1.3]} 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}x`}
                    />
                    <Tooltip content={<TrendTooltip />} />
                    <ReferenceLine y={1} stroke="#6B7280" strokeDasharray="5 5" />
                    {staffList.slice(0, 10).map((staff, idx) => (
                      <Line
                        key={staff.staffId}
                        type="monotone"
                        dataKey={staff.name}
                        stroke={STAFF_COLORS[idx % STAFF_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {staffList.slice(0, 10).map((staff, idx) => (
                    <div key={staff.staffId} className="flex items-center gap-1.5 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: STAFF_COLORS[idx % STAFF_COLORS.length] }} 
                      />
                      <span>{staff.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : activeTab === 'bar' ? (
          <div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  domain={[0.6, 1.4]} 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}x`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  width={80}
                />
                <Tooltip content={<BarTooltip />} />
                <ReferenceLine x={1} stroke="#6B7280" strokeDasharray="5 5" />
                <Bar dataKey="speedFactor" radius={[0, 4, 4, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSpeedColor(entry.speedFactor)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: SPEED_COLORS.fast }} />
                <span>Fast (&lt;0.9x)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: SPEED_COLORS.average }} />
                <span>Average</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: SPEED_COLORS.slow }} />
                <span>Slow (&gt;1.1x)</span>
              </div>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('name')}
                >
                  Staff Name
                  {sortBy === 'name' && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('speedFactor')}
                >
                  Speed Factor
                  {sortBy === 'speedFactor' && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </TableHead>
                <TableHead>Consistency</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 text-right"
                  onClick={() => handleSort('totalServices')}
                >
                  Services
                  {sortBy === 'totalServices' && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStaff.map((staff) => (
                <TableRow key={staff.staffId}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{staff.speedFactor.toFixed(2)}x</span>
                      {getSpeedBadge(staff.speedFactor)}
                    </div>
                  </TableCell>
                  <TableCell>{getConsistencyBadge(staff.consistencyScore)}</TableCell>
                  <TableCell className="text-right">{staff.totalServices}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">{getTrendIcon(staff.trend)}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
