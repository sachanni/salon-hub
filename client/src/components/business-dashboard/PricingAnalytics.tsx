import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  TrendingDown,
  TrendingUp,
  IndianRupee,
  Calendar,
  Sparkles,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";

interface PricingAnalyticsResponse {
  success: boolean;
  analytics?: {
    summary: {
      totalDiscountedBookings: number;
      totalDiscountGivenPaisa: number;
      incrementalBookings: number;
      estimatedRevenueGainPaisa: number;
    };
    byRule: Array<{
      rule: { id: string; name: string };
      bookings: number;
      totalDiscountPaisa: number;
      averageDiscountPaisa: number;
      utilizationChange: string;
    }>;
    demandImpact: {
      beforePricing: { offPeakUtilization: number; peakUtilization: number };
      afterPricing: { offPeakUtilization: number; peakUtilization: number };
    };
  };
  error?: string;
}

interface PricingAnalyticsProps {
  salonId: string;
}

function formatPrice(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString("en-IN")}`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning";
}) {
  const iconBg = variant === "success" ? "bg-emerald-100" : variant === "warning" ? "bg-amber-100" : "bg-muted";
  const iconColor = variant === "success" ? "text-emerald-600" : variant === "warning" ? "text-amber-600" : "text-muted-foreground";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`p-2 rounded-lg ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-600" : "text-gray-600"
              }`}>
                {trend === "up" && <ArrowUpRight className="h-3 w-3" />}
                {trend === "down" && <TrendingDown className="h-3 w-3" />}
                {trendValue}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PricingAnalytics({ salonId }: PricingAnalyticsProps) {
  const { data, isLoading, error } = useQuery<PricingAnalyticsResponse>({
    queryKey: ["pricing-analytics", salonId],
    queryFn: async () => {
      const res = await fetch(
        `/api/dynamic-pricing/salons/${salonId}/pricing-analytics`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data?.success || !data.analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="font-medium">No Pricing Analytics Available</p>
          <p className="text-sm text-muted-foreground">
            Start using dynamic pricing rules to see analytics here
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary, byRule, demandImpact } = data.analytics;
  const offPeakImprovement = demandImpact.afterPricing.offPeakUtilization - demandImpact.beforePricing.offPeakUtilization;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dynamic Pricing Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Performance of your pricing rules over the last 30 days
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Bookings with Discounts"
          value={summary.totalDiscountedBookings.toString()}
          subtitle="Customers who got discounts"
          icon={Calendar}
        />
        <StatCard
          title="Total Discounts Given"
          value={formatPrice(summary.totalDiscountGivenPaisa)}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Incremental Bookings"
          value={`+${summary.incrementalBookings}`}
          subtitle="Bookings gained from discounts"
          icon={Sparkles}
          trend="up"
          trendValue="From off-peak slots"
          variant="success"
        />
        <StatCard
          title="Estimated Revenue Gain"
          value={formatPrice(summary.estimatedRevenueGainPaisa)}
          subtitle="Net gain from pricing strategy"
          icon={IndianRupee}
          trend={summary.estimatedRevenueGainPaisa > 0 ? "up" : "neutral"}
          trendValue={summary.estimatedRevenueGainPaisa > 0 ? "Positive ROI" : undefined}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Utilization Impact
            </CardTitle>
            <CardDescription>
              How dynamic pricing affected slot utilization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Off-Peak Hours</span>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  +{offPeakImprovement}% improvement
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Before</div>
                  <Progress value={demandImpact.beforePricing.offPeakUtilization} className="h-3" />
                  <div className="text-xs text-right mt-1">{demandImpact.beforePricing.offPeakUtilization}%</div>
                </div>
                <div className="text-lg">→</div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">After</div>
                  <Progress value={demandImpact.afterPricing.offPeakUtilization} className="h-3 [&>div]:bg-emerald-500" />
                  <div className="text-xs text-right mt-1">{demandImpact.afterPricing.offPeakUtilization}%</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Peak Hours</span>
                <span className="text-sm text-muted-foreground">Steady demand</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Before</div>
                  <Progress value={demandImpact.beforePricing.peakUtilization} className="h-3" />
                  <div className="text-xs text-right mt-1">{demandImpact.beforePricing.peakUtilization}%</div>
                </div>
                <div className="text-lg">→</div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">After</div>
                  <Progress value={demandImpact.afterPricing.peakUtilization} className="h-3" />
                  <div className="text-xs text-right mt-1">{demandImpact.afterPricing.peakUtilization}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Rules Performance
            </CardTitle>
            <CardDescription>
              How each pricing rule is performing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byRule.length > 0 ? (
              <div className="space-y-4">
                {byRule.map((rule, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium">{rule.rule.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {rule.bookings} bookings • {formatPrice(rule.totalDiscountPaisa)} total discount
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-emerald-600">
                        {rule.utilizationChange}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {formatPrice(rule.averageDiscountPaisa)}/booking
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rule performance data yet</p>
                <p className="text-sm">Create and activate pricing rules to see their impact</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
