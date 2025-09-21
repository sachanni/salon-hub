import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Building, 
  Scissors, 
  Users, 
  Settings, 
  Camera,
  CheckCircle,
  ArrowRight,
  BarChart,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { Link } from "wouter";
import type { Salon } from "@/../../shared/schema";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import FinancialReportingDashboard from "@/components/FinancialReportingDashboard";

// Type definitions for completion data
interface CompletionData {
  profile: { isComplete: boolean; missingFields?: string[] };
  services: { isComplete: boolean; count: number };
  staff: { isComplete: boolean; count: number };
  settings: { isComplete: boolean; missingFields?: string[] };
  media: { isComplete: boolean; count: number };
  overallProgress: number;
  nextStep?: string;
}

// Type definitions for analytics data
interface TrendData {
  percentage: string;
  direction: 'up' | 'down' | 'neutral';
}

interface AnalyticsOverview {
  todayBookings: number;
  todayRevenuePaisa: number;
  totalRevenuePaisa: number;
  activeStaffCount: number;
  totalBookings: number;
  averageBookingValuePaisa: number;
  bookingsTrend: TrendData;
  revenueTrend: TrendData;
  averageValueTrend: TrendData;
  cancellationRate?: string;
  cancelledBookings?: number;
  completedBookings?: number;
  confirmedBookings?: number;
}

interface PopularService {
  id: string;
  name: string;
  bookingCount: number;
  revenuePaisa: number;
}

interface StaffPerformance {
  id: string;
  name: string;
  bookingCount: number;
  revenuePaisa: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  popularServices?: PopularService[];
  staffPerformance?: StaffPerformance[];
  bookingTrends?: BookingTrend[];
}

// Import step components
import ProfileStep from "@/components/business-setup/ProfileStep";
import ServicesStep from "@/components/business-setup/ServicesStep";
import StaffStep from "@/components/business-setup/StaffStep";
import BookingSettingsStep from "@/components/business-setup/BookingSettingsStep";
import MediaStep from "@/components/business-setup/MediaStep";
import ReviewPublishStep from "@/components/business-setup/ReviewPublishStep";

export default function BusinessDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  // Fetch user's salons
  const { data: salons, isLoading: salonsLoading } = useQuery({
    queryKey: ['/api/my/salons'],
    enabled: isAuthenticated,
    staleTime: 60000
  });

  // Set salon ID
  useEffect(() => {
    if (Array.isArray(salons) && salons.length > 0 && !salonId) {
      setSalonId(salons[0].id);
    }
  }, [salons, salonId]);

  // Use centralized completion service
  const { data: completionData } = useQuery<CompletionData>({
    queryKey: ['/api/salons', salonId, 'dashboard-completion'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Keep individual data queries for components that still need them
  const { data: salonData } = useQuery<Salon>({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: services } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: staff } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: bookingSettings } = useQuery({
    queryKey: ['/api/salons', salonId, 'booking-settings'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: mediaAssets } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch real analytics data with proper query key invalidation
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    isError: isAnalyticsError 
  } = useQuery<AnalyticsData>({
    queryKey: ['/api/salons', salonId, 'analytics', selectedPeriod],
    queryFn: async () => {
      const params = new URLSearchParams({ period: selectedPeriod });
      const response = await fetch(`/api/salons/${salonId}/analytics?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!salonId && !!selectedPeriod,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000
  });

  // Use centralized completion logic instead of ad-hoc checks
  const isProfileComplete = completionData?.profile?.isComplete ?? false;
  const hasServices = completionData?.services?.isComplete ?? false;
  const hasStaff = completionData?.staff?.isComplete ?? false;
  const hasSettings = completionData?.settings?.isComplete ?? false;
  const hasMedia = completionData?.media?.isComplete ?? false;
  const completionPercentage = completionData?.overallProgress ?? 0;
  const nextStep = completionData?.nextStep;

  // Helper functions for formatting and trends
  const formatCurrency = (paisa: number) => {
    const rupees = paisa / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rupees);
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Extract analytics data with fallbacks
  const overview: Partial<AnalyticsOverview> = analyticsData?.overview || {};
  const todayBookings = overview.todayBookings || 0;
  const todayRevenue = overview.todayRevenuePaisa || 0;
  const totalRevenue = overview.totalRevenuePaisa || 0;
  const activeStaff = overview.activeStaffCount || 0;
  const totalBookings = overview.totalBookings || 0;
  const averageBookingValue = overview.averageBookingValuePaisa || 0;
  
  const bookingsTrend = overview.bookingsTrend || { percentage: '0.0', direction: 'neutral' };
  const revenueTrend = overview.revenueTrend || { percentage: '0.0', direction: 'neutral' };
  const averageValueTrend = overview.averageValueTrend || { percentage: '0.0', direction: 'neutral' };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Link href="/login/business"><Button>Log In</Button></Link>
        </div>
      </div>
    );
  }

  if (salonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!Array.isArray(salons) || salons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No Business Found</h1>
          <Link href="/business-setup"><Button>Create Business Profile</Button></Link>
        </div>
      </div>
    );
  }

  const handleStepComplete = () => {
    // No automatic redirect - let user control navigation
    toast({
      title: "Step Completed",
      description: "Great progress! You can now move to the next step.",
    });
  };

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <div className="p-6 space-y-6">
          {/* Setup Progress */}
          {completionPercentage < 100 && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">Complete Setup</CardTitle>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Finish your profile to start accepting bookings
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Progress: {completionPercentage}% Complete
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Next: {
                        nextStep ? (
                          nextStep === 'profile' ? 'Complete Profile' :
                          nextStep === 'services' ? 'Add Services' :
                          nextStep === 'staff' ? 'Add Staff' :
                          nextStep === 'settings' ? 'Configure Settings' :
                          nextStep === 'media' ? 'Add Media' :
                          'Continue Setup'
                        ) : 'Setup Complete'
                      }
                    </p>
                  </div>
                  {nextStep && (
                    <Button 
                      onClick={() => setActiveTab(nextStep)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continue Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Period Filter and Export */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Business insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!analyticsData) return;
                      const exportData = {
                        period: selectedPeriod,
                        salon: salonData?.name || 'Salon',
                        exportDate: new Date().toISOString(),
                        overview: analyticsData.overview,
                        popularServices: analyticsData.popularServices,
                        staffPerformance: analyticsData.staffPerformance,
                        bookingTrends: analyticsData.bookingTrends
                      };
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                        type: 'application/json'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `salon-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast({
                        title: "Analytics Exported",
                        description: "Analytics data has been downloaded as JSON file for accounting/reporting."
                      });
                    }}
                    disabled={!analyticsData || analyticsLoading || isAnalyticsError}
                    data-testid="button-export-analytics"
                  >
                    Export Data
                  </Button>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={analyticsLoading}>
                    <SelectTrigger className="w-40" data-testid="select-period">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Error Handling */}
          {isAnalyticsError && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950" data-testid="alert-analytics-error">
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="flex items-center gap-2">
                  <span>⚠️ Failed to load analytics data</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-red-700 dark:text-red-300 underline"
                    onClick={() => window.location.reload()}
                    data-testid="button-retry-analytics"
                  >
                    Retry
                  </Button>
                </div>
                {analyticsError && (
                  <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                    {analyticsError instanceof Error ? analyticsError.message : 'Unknown error occurred'}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-950" data-testid="card-today-bookings">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">--</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Data unavailable</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-today-bookings">
                          {todayBookings}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(bookingsTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(bookingsTrend.direction)}`}>
                            {bookingsTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Period total: {totalBookings}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950" data-testid="card-revenue">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-green-300 dark:bg-green-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-green-300 dark:bg-green-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Revenue
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">--</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Data unavailable</p>
                    </div>
                    <BarChart className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Revenue
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="text-revenue">
                          {formatCurrency(totalRevenue)}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(revenueTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(revenueTrend.direction)}`}>
                            {revenueTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Today: {formatCurrency(todayRevenue)}
                      </p>
                    </div>
                    <BarChart className="h-8 w-8 text-green-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950" data-testid="card-staff">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                      <div className="h-8 w-12 bg-purple-300 dark:bg-purple-700 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-purple-300 dark:bg-purple-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">--</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Data unavailable</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-active-staff">
                        {activeStaff}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Available for bookings
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950" data-testid="card-avg-value">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-orange-200 dark:bg-orange-800 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-orange-300 dark:bg-orange-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-orange-200 dark:bg-orange-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-orange-300 dark:bg-orange-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Average Booking Value</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">--</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Data unavailable</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Average Booking Value</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100" data-testid="text-avg-value">
                          {formatCurrency(averageBookingValue)}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(averageValueTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(averageValueTrend.direction)}`}>
                            {averageValueTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        From {totalBookings} bookings
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-cancellation-rate">
              <CardHeader>
                <CardTitle className="text-base">Cancellation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-cancellation-rate">
                      {overview.cancellationRate || '0.00'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overview.cancelledBookings || 0} of {totalBookings} cancelled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-completion-rate">
              <CardHeader>
                <CardTitle className="text-base">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-completion-rate">
                      {totalBookings > 0 ? ((overview.completedBookings || 0) / totalBookings * 100).toFixed(1) : '0.0'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overview.completedBookings || 0} completed bookings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-confirmed-bookings">
              <CardHeader>
                <CardTitle className="text-base">Confirmed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-confirmed-bookings">
                      {overview.confirmedBookings || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ready for service delivery
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Popular Services and Staff Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-popular-services">
              <CardHeader>
                <CardTitle className="text-base">Popular Services</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : isAnalyticsError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Unable to load popular services</p>
                  </div>
                ) : analyticsData?.popularServices && analyticsData.popularServices.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.popularServices.slice(0, 5).map((service: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{service.serviceName}</p>
                          <p className="text-sm text-muted-foreground">{service.bookingCount} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(service.totalRevenuePaisa)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No popular services data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-staff-performance">
              <CardHeader>
                <CardTitle className="text-base">Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isAnalyticsError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Unable to load staff performance</p>
                  </div>
                ) : analyticsData?.staffPerformance && analyticsData.staffPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.staffPerformance.slice(0, 5).map((staff: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{staff.staffName}</p>
                          <p className="text-sm text-muted-foreground">{staff.bookingCount} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(staff.totalRevenuePaisa)}</p>
                          <p className="text-sm text-muted-foreground">{staff.utilization}% utilization</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No staff performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="pt-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Back to SalonHub
            </Link>
          </div>
        </div>
      );
    }

    // Render step components
    const components = {
      profile: ProfileStep,
      services: ServicesStep,
      staff: StaffStep,
      settings: BookingSettingsStep,
      media: MediaStep,
      publish: ReviewPublishStep
    };

    // Handle analytics tab
    if (activeTab === "analytics") {
      return (
        <div className="p-6">
          <AdvancedAnalyticsDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle financials tab
    if (activeTab === "financials") {
      return (
        <div className="p-6">
          <FinancialReportingDashboard 
            salonId={salonId || ''} 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>
      );
    }

    const Component = components[activeTab as keyof typeof components];
    if (Component && salonId) {
      return (
        <div className="p-6">
          <Component
            salonId={salonId}
            onComplete={handleStepComplete}
            isCompleted={false}
          />
        </div>
      );
    }

    return <div className="p-6">Content not found</div>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Business Dashboard</h1>
                <p className="text-sm text-muted-foreground">Professional salon management</p>
              </div>
            </div>
            
            {completionPercentage === 100 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Setup Complete
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Overview
              </div>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Profile
                {isProfileComplete && <CheckCircle className="h-3 w-3 text-green-500" />}
                {!isProfileComplete && <span className="text-xs text-red-500">*</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("services")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "services" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Services
                {hasServices && <CheckCircle className="h-3 w-3 text-green-500" />}
                {!hasServices && <span className="text-xs text-red-500">*</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("staff")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "staff" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Staff
                {hasStaff && <CheckCircle className="h-3 w-3 text-green-500" />}
                {!hasStaff && <span className="text-xs text-red-500">*</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Booking Settings
                {hasSettings && <CheckCircle className="h-3 w-3 text-green-500" />}
                {!hasSettings && <span className="text-xs text-red-500">*</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "media" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Media
                {hasMedia && <CheckCircle className="h-3 w-3 text-green-500" />}
                {!hasMedia && <span className="text-xs text-red-500">*</span>}
              </div>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "analytics" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Advanced Analytics
              </div>
            </button>

            <button
              onClick={() => setActiveTab("financials")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "financials" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              data-testid="tab-financials"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Financial Reports
              </div>
            </button>

            <button
              onClick={() => setActiveTab("publish")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "publish" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Publish
                {completionPercentage === 100 && <CheckCircle className="h-3 w-3 text-green-500" />}
                {completionPercentage < 100 && <span className="text-xs text-amber-500">({Math.round(completionPercentage)}%)</span>}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}