import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  BarChart3, 
  Camera,
  MapPin,
  Star,
  TrendingUp,
  Scissors,
  CreditCard,
  Mail,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";

// Import existing business setup components
import BusinessInfoStep from "@/components/business-setup/BusinessInfoStep";
import LocationContactStep from "@/components/business-setup/LocationContactStep";
import ServicesStep from "@/components/business-setup/ServicesStep";
import StaffStep from "@/components/business-setup/StaffStep";
import ResourcesStep from "@/components/business-setup/ResourcesStep";
import BookingSettingsStep from "@/components/business-setup/BookingSettingsStep";
import PaymentSetupStep from "@/components/business-setup/PaymentSetupStep";
import MediaStep from "@/components/business-setup/MediaStep";
import CalendarManagement from "@/pages/CalendarManagement";

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  monthlyRevenue: number;
  activeStaff: number;
}

export default function BusinessDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [salonId, setSalonId] = useState<string | null>(null);

  // Fetch user's salon information from auth user endpoint
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: isAuthenticated && !!user,
  });

  // Fallback: Fetch salons directly if orgMemberships doesn't have salon data
  const { data: salons, isLoading: salonsLoading } = useQuery({
    queryKey: ['/api/salons'],
    enabled: isAuthenticated && !salonId,
  });

  // Get salon ID from auth user or fallback to first available salon
  useEffect(() => {
    if (authUser?.orgMemberships?.length > 0) {
      // Try to get salon from org memberships first
      const orgSalonId = authUser.orgMemberships[0].salon?.id;
      if (orgSalonId) {
        setSalonId(orgSalonId);
        return;
      }
    }
    
    // Fallback: Use first salon if available
    if (salons?.length > 0) {
      setSalonId(salons[0].id);
    }
  }, [authUser, salons]);

  // Fetch salon details
  const { data: salon, isLoading: salonLoading } = useQuery({
    queryKey: [`/api/salons/${salonId}`],
    enabled: !!salonId,
  });

  // Fetch dashboard stats (mock for now - would connect to real analytics)
  const { data: stats = { totalBookings: 0, todayBookings: 0, monthlyRevenue: 0, activeStaff: 0 } } = useQuery({
    queryKey: ['/api/salons', salonId, 'stats'],
    enabled: !!salonId,
    queryFn: async () => {
      // This would be replaced with real API endpoint
      return {
        totalBookings: 145,
        todayBookings: 8,
        monthlyRevenue: 12500,
        activeStaff: 5
      } as DashboardStats;
    }
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Access Restricted
            </CardTitle>
            <CardDescription>
              Please log in to access your business dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login/business">
              <Button className="w-full" data-testid="button-login-business">
                Go to Business Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || salonsLoading || salonLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your business dashboard...</p>
        </div>
      </div>
    );
  }

  if (!salonId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Setup Required
            </CardTitle>
            <CardDescription>
              Complete your business setup to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/business/setup">
              <Button className="w-full" data-testid="button-business-setup">
                Complete Business Setup
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 rounded-lg p-2">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {salon?.name || "Business Dashboard"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Professional salon management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Email verification banner */}
              {user && !user.emailVerified && (
                <Alert className="w-auto border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700 dark:text-orange-300 text-sm">
                    Verify your email for enhanced security (optional)
                  </AlertDescription>
                </Alert>
              )}
              
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Back to SalonHub
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <TabsList className="grid grid-cols-8 w-full h-auto p-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-overview"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-profile"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="services" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-services"
            >
              <Scissors className="h-4 w-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger 
              value="staff" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-staff"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-calendar"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-payments"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-media"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              data-testid="tab-settings"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.todayBookings}</div>
                  <p className="text-blue-100 text-sm">appointments scheduled</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Monthly Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
                  <p className="text-green-100 text-sm">this month</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Active Staff
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activeStaff}</div>
                  <p className="text-purple-100 text-sm">team members</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Total Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalBookings}</div>
                  <p className="text-orange-100 text-sm">all time</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("calendar")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Calendar className="h-5 w-5" />
                    Schedule Management
                  </CardTitle>
                  <CardDescription>
                    Manage staff availability and time slots
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-testid="button-manage-calendar">
                    Manage Calendar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("services")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Scissors className="h-5 w-5" />
                    Service Catalog
                  </CardTitle>
                  <CardDescription>
                    Add and manage your services and pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-testid="button-manage-services">
                    Manage Services
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab("payments")}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <CreditCard className="h-5 w-5" />
                    Payment Processing
                  </CardTitle>
                  <CardDescription>
                    Configure payments and view transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" data-testid="button-manage-payments">
                    Manage Payments
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BusinessInfoStep 
                    salonId={salonId} 
                    onComplete={() => {}} 
                    isCompleted={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location & Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationContactStep 
                    salonId={salonId} 
                    onComplete={() => {}} 
                    isCompleted={false}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Service Management
                </CardTitle>
                <CardDescription>
                  Manage your salon services, pricing, and categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServicesStep 
                  salonId={salonId} 
                  onComplete={() => {}} 
                  isCompleted={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Management
                </CardTitle>
                <CardDescription>
                  Manage your team members, roles, and specialties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffStep 
                  salonId={salonId} 
                  onComplete={() => {}} 
                  isCompleted={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Advanced Calendar Management
                </CardTitle>
                <CardDescription>
                  Manage staff schedules, availability patterns, and time slots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salonId ? (
                  <CalendarManagement salonId={salonId} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading calendar management...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Processing
                </CardTitle>
                <CardDescription>
                  Configure payment methods and view transaction history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentSetupStep 
                  salonId={salonId} 
                  onComplete={() => {}} 
                  isCompleted={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Media Gallery
                </CardTitle>
                <CardDescription>
                  Manage your salon photos and showcase your work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaStep 
                  salonId={salonId} 
                  onComplete={() => {}} 
                  isCompleted={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Booking Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BookingSettingsStep 
                    salonId={salonId} 
                    onComplete={() => {}} 
                    isCompleted={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResourcesStep 
                    salonId={salonId} 
                    onComplete={() => {}} 
                    isCompleted={false}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}