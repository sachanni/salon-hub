import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Users, 
  IndianRupee,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "recharts";

interface PackageAnalyticsProps {
  salonId: string;
  onBack: () => void;
}

function formatCurrency(paisa: number): string {
  const rupees = paisa / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

function formatCurrencyShort(paisa: number): string {
  const rupees = paisa / 100;
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(1)}L`;
  } else if (rupees >= 1000) {
    return `₹${(rupees / 1000).toFixed(1)}K`;
  }
  return `₹${rupees}`;
}

const COLORS = ['#f43f5e', '#ec4899', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6'];

export function PackageAnalytics({ salonId, onBack }: PackageAnalyticsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/service-bundles/salons", salonId, "packages/analytics"],
    queryFn: async () => {
      const res = await fetch(`/api/service-bundles/salons/${salonId}/packages/analytics`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold">Package Analytics</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { summary, byPackage } = data || { summary: {}, byPackage: [] };

  const chartData = byPackage.slice(0, 6).map((pkg: any) => ({
    name: pkg.name.length > 12 ? pkg.name.slice(0, 12) + '...' : pkg.name,
    bookings: pkg.bookings,
    revenue: pkg.revenue / 100,
  }));

  const pieData = byPackage
    .filter((pkg: any) => pkg.bookings > 0)
    .slice(0, 5)
    .map((pkg: any, index: number) => ({
      name: pkg.name,
      value: pkg.bookings,
      color: COLORS[index % COLORS.length],
    }));

  const totalBookings = byPackage.reduce((sum: number, pkg: any) => sum + pkg.bookings, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-rose-500" />
            Package Analytics
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Performance metrics for your service packages
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                <IndianRupee className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Package Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.totalPackageRevenueFormatted || formatCurrency(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Package Bookings</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.totalPackageBookings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Package Value</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(summary.averagePackageValue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Savings Provided</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {summary.savingsProvidedFormatted || formatCurrency(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {summary.topPackage && (
        <Card className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200 dark:border-rose-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-500">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Top Performing Package</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {summary.topPackage.name}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {summary.topPackage.bookings} completed bookings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Package</CardTitle>
            <CardDescription>Number of completed bookings per package</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    className="text-slate-600"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Bookings']}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  />
                  <Bar dataKey="bookings" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No booking data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package Distribution</CardTitle>
            <CardDescription>Share of total bookings by package</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value, 'Bookings']}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-500">
                No booking data yet
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {pieData.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Package Performance</CardTitle>
          <CardDescription>Detailed breakdown of each package</CardDescription>
        </CardHeader>
        <CardContent>
          {byPackage.length > 0 ? (
            <div className="space-y-4">
              {byPackage.map((pkg: any, index: number) => (
                <div 
                  key={pkg.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {pkg.name}
                        </span>
                        {pkg.isFeatured && (
                          <Sparkles className="w-4 h-4 text-amber-500" />
                        )}
                        {!pkg.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        {pkg.category && (
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {pkg.category}
                          </span>
                        )}
                        <span>{pkg.bookings} bookings</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {pkg.revenueFormatted}
                    </p>
                    {totalBookings > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={(pkg.bookings / totalBookings) * 100} 
                          className="w-20 h-1.5"
                        />
                        <span className="text-xs text-slate-500">
                          {Math.round((pkg.bookings / totalBookings) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No packages created yet</p>
              <p className="text-sm mt-1">Create your first service package to start tracking analytics</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
