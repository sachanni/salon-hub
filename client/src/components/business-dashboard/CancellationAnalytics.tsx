import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
  RefreshCw,
  IndianRupee,
  Users,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface CancellationAnalyticsProps {
  salonId: string;
}

const CHART_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const CATEGORY_COLORS: Record<string, string> = {
  scheduling: "#3b82f6",
  pricing: "#f97316",
  changed_mind: "#8b5cf6",
  emergency: "#ef4444",
  salon_issue: "#eab308",
  trust: "#ec4899",
  user_error: "#22c55e",
  external: "#06b6d4",
  other: "#6b7280",
};

export function CancellationAnalytics({ salonId }: CancellationAnalyticsProps) {
  const [dateRange, setDateRange] = useState("30");

  const startDate = format(subDays(new Date(), parseInt(dateRange)), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ["cancellation-analytics", salonId, dateRange],
    queryFn: async () => {
      const res = await fetch(
        `/api/salons/${salonId}/cancellation-analytics?startDate=${startDate}&endDate=${endDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: cancellationsData, isLoading: loadingList } = useQuery({
    queryKey: ["cancellations-list", salonId],
    queryFn: async () => {
      const res = await fetch(`/api/salons/${salonId}/cancellations?limit=10`);
      if (!res.ok) throw new Error("Failed to fetch cancellations");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });

  const analytics = analyticsData?.analytics;
  const cancellations = cancellationsData?.cancellations || [];

  const pieData = analytics?.topReasons?.map((r: { code: string; count: number; percentage: number }, i: number) => ({
    name: r.code.replace(/_/g, " "),
    value: r.count,
    percentage: r.percentage,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

  const categoryData = Object.entries(analytics?.byCategory || {}).map(([category, count]) => ({
    category: category.replace(/_/g, " "),
    count: count as number,
    fill: CATEGORY_COLORS[category] || "#6b7280",
  }));

  const trendData = analytics?.trend || [];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load cancellation analytics.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cancellation Analytics</h2>
          <p className="text-muted-foreground">
            Understand why customers cancel and identify improvement opportunities
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalCancellations || 0}</div>
            <p className="text-xs text-muted-foreground">
              In the last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.cancellationRate || 0}%</div>
            <Progress
              value={Math.min(analytics?.cancellationRate || 0, 100)}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Hours Before</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.averageHoursBeforeCancellation || 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Before appointment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rescheduled</CardTitle>
            <RefreshCw className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.rescheduledPercentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Converted to new bookings
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Cancellation Reasons</CardTitle>
            <CardDescription>Most common reasons customers cancel</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry: { fill: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No cancellation data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Cancellations grouped by reason category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cancellation Trend</CardTitle>
          <CardDescription>Daily cancellation count over time</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), "MMM d")}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), "MMMM d, yyyy")}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Cancellations</CardTitle>
          <CardDescription>Latest booking cancellations with details</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : cancellations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Cancelled By</TableHead>
                  <TableHead>Hours Before</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancellations.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{c.booking?.customerName || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.booking?.customerPhone || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.booking ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(c.booking.bookingDate), "MMM d")} at{" "}
                          {c.booking.bookingTime}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {c.reasonLabel || c.reasonCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={c.cancelledBy === "customer" ? "secondary" : "destructive"}
                      >
                        {c.cancelledBy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {c.hoursBeforeAppointment}h
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {c.cancellationFeePaisa ? (
                        <span className="flex items-center justify-end">
                          <IndianRupee className="h-3 w-3" />
                          {(c.cancellationFeePaisa / 100).toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Free</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No cancellations found in this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CancellationAnalytics;
