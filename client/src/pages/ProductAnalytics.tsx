import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  Calendar,
  Download,
  Eye,
  Users,
  Percent,
  Crown,
  Lock
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface AnalyticsData {
  period: 'today' | '7days' | '30days' | '90days';
  revenue: {
    total: number;
    growth: number;
    previousPeriod: number;
  };
  orders: {
    total: number;
    growth: number;
    previousPeriod: number;
  };
  avgOrderValue: {
    value: number;
    growth: number;
  };
  conversion: {
    rate: number;
    growth: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    unitsSold: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  salesTrend: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export default function ProductAnalytics() {
  const [, navigate] = useLocation();
  const { userSalons, isLoading: authLoading, isAuthenticated } = useAuth();
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | '90days'>('30days');
  
  const salonId = userSalons?.[0]?.id;
  const featureAccess = useFeatureAccess(salonId || null);

  // Auth/salon loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // No salon access - redirect or show message
  if (!isAuthenticated || !salonId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Salon Access</CardTitle>
            <CardDescription>
              You need to be associated with a salon to view analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {!isAuthenticated 
                ? "Please log in to continue" 
                : "You don't have access to any salons. Please contact your administrator."}
            </p>
            <div className="flex gap-2">
              {!isAuthenticated ? (
                <Button onClick={() => navigate('/login')} data-testid="button-login">
                  Go to Login
                </Button>
              ) : (
                <Button onClick={() => navigate('/')} data-testid="button-home">
                  Go to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking subscription status
  if (featureAccess.isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Premium feature gating - show upgrade prompt for non-premium users
  if (!featureAccess.canAccessAdvancedAnalytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 w-fit">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Advanced Analytics</CardTitle>
            <CardDescription className="text-base">
              Unlock powerful insights to grow your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Deep revenue and booking insights</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Service performance tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Customer behavior analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-amber-600" />
                <span className="text-sm">Export reports to Excel & PDF</span>
              </div>
            </div>
            <div className="pt-4 space-y-3">
              <Link href={`/salon/${salonId}/settings?tab=subscription`}>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                  Upgrade to Growth Plan - ₹999/month
                </Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={() => navigate('/business/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/salons', salonId, 'product-analytics', period],
    enabled: !!salonId,
  });

  const formatPrice = (paisa: number) => `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const formatGrowth = (growth: number) => {
    const color = growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const icon = growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
    return (
      <span className={`flex items-center gap-1 text-sm font-medium ${color}`}>
        {icon}
        {Math.abs(growth).toFixed(1)}%
      </span>
    );
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      default: return period;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/business/products')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Product Analytics</h1>
              <p className="text-muted-foreground mt-1">
                Track your e-commerce performance and insights
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-40" data-testid="select-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today" data-testid="option-period-today">Today</SelectItem>
                <SelectItem value="7days" data-testid="option-period-7days">Last 7 Days</SelectItem>
                <SelectItem value="30days" data-testid="option-period-30days">Last 30 Days</SelectItem>
                <SelectItem value="90days" data-testid="option-period-90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-elevate" data-testid="card-metric-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-revenue">
                {formatPrice(analytics?.revenue.total || 0)}
              </div>
              <div className="flex items-center justify-between mt-2">
                {formatGrowth(analytics?.revenue.growth || 0)}
                <span className="text-xs text-muted-foreground">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-metric-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-orders">
                {analytics?.orders.total || 0}
              </div>
              <div className="flex items-center justify-between mt-2">
                {formatGrowth(analytics?.orders.growth || 0)}
                <span className="text-xs text-muted-foreground">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-metric-aov">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-aov">
                {formatPrice(analytics?.avgOrderValue.value || 0)}
              </div>
              <div className="flex items-center justify-between mt-2">
                {formatGrowth(analytics?.avgOrderValue.growth || 0)}
                <span className="text-xs text-muted-foreground">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-metric-conversion">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Percent className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-conversion">
                {analytics?.conversion.rate?.toFixed(2) || '0.00'}%
              </div>
              <div className="flex items-center justify-between mt-2">
                {formatGrowth(analytics?.conversion.growth || 0)}
                <span className="text-xs text-muted-foreground">vs previous period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>Revenue and orders over time for {getPeriodLabel(period).toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Interactive Chart</p>
                  <p className="text-sm mt-1">Revenue & Orders trend visualization</p>
                  <p className="text-xs mt-2">Implementation: Recharts/Chart.js</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0 ? (
                  analytics.categoryBreakdown.map((category, index) => (
                    <div key={index} className="space-y-1" data-testid={`category-item-${index}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium" data-testid={`category-name-${index}`}>{category.category}</span>
                        <span className="text-muted-foreground" data-testid={`category-percentage-${index}`}>{category.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`category-revenue-${index}`}>
                        {formatPrice(category.revenue)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                    <div className="text-center">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No category data</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products for {getPeriodLabel(period).toLowerCase()}</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.topProducts && analytics.topProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 rounded-lg hover-elevate cursor-pointer" data-testid={`top-product-${index}`}>
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold" data-testid={`product-rank-${index}`}>
                      {index + 1}
                    </div>
                    <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" data-testid={`product-name-${index}`}>{product.name}</p>
                      <p className="text-sm text-muted-foreground" data-testid={`product-units-${index}`}>
                        {product.unitsSold} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" data-testid={`product-revenue-${index}`}>{formatPrice(product.revenue)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/business/products/${product.id}`)} data-testid={`button-view-product-${index}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                <div className="text-center">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No sales data</p>
                  <p className="text-sm mt-1">Top products will appear here once you have orders</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-bold">156</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Active buyers this period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Product Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-bold">3,421</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total page views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">4.6</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Based on 84 reviews</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
