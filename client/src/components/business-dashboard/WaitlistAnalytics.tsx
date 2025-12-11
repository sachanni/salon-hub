import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Calendar, Clock, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WaitlistAnalyticsProps {
  salonId: string;
}

interface WaitlistEntry {
  id: string;
  service?: { id: string; name: string; priceInPaisa: number | null };
  requestedDate: string;
  status: string;
  position: number;
  createdAt: string;
}

interface WaitlistData {
  totalWaiting: number;
  byDate: Record<string, number>;
  byService: Array<{ serviceId: string; serviceName: string; count: number }>;
  recentEntries: WaitlistEntry[];
}

export function WaitlistAnalytics({ salonId }: WaitlistAnalyticsProps) {
  const { data, isLoading, error } = useQuery<WaitlistData>({
    queryKey: ["salon-waitlist", salonId],
    queryFn: async () => {
      const res = await fetch(`/api/waitlist/salons/${salonId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch waitlist data");
      }
      return res.json();
    },
    enabled: !!salonId,
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString("en-IN")}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Demand
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Waitlist Demand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const dateChartData = Object.entries(data.byDate)
    .map(([date, count]) => ({
      date: formatDate(date),
      fullDate: date,
      count,
    }))
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
    .slice(0, 7);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Waiting</p>
                <p className="text-3xl font-bold">{data.totalWaiting}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Peak Day</p>
                <p className="text-3xl font-bold">
                  {dateChartData.length > 0
                    ? dateChartData.reduce((max, d) => (d.count > max.count ? d : max)).date
                    : "N/A"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Service</p>
                <p className="text-lg font-bold truncate">
                  {data.byService.length > 0
                    ? data.byService.reduce((max, s) => (s.count > max.count ? s : max)).serviceName
                    : "N/A"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {dateChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Demand by Date</CardTitle>
            <CardDescription>
              Number of customers waiting for slots on each date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dateChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.byService.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Demand by Service</CardTitle>
            <CardDescription>
              Most requested services on the waitlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byService
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((service, index) => (
                  <div key={service.serviceId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{service.serviceName}</span>
                    </div>
                    <Badge variant="secondary">{service.count} waiting</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Waitlist Entries</CardTitle>
            <CardDescription>
              Latest customers waiting for appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{entry.service?.name || "Unknown Service"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.requestedDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={entry.status === "notified" ? "default" : "outline"}
                      className={entry.status === "notified" ? "bg-green-600" : ""}
                    >
                      {entry.status === "waiting" ? `#${entry.position} in queue` : entry.status}
                    </Badge>
                    {entry.service?.priceInPaisa && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(entry.service.priceInPaisa)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.totalWaiting === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No customers on the waitlist</p>
            <p className="text-sm mt-1">
              Customers can join the waitlist when their preferred time slots are fully booked.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
