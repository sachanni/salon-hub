/**
 * Business Dashboard
 * Production-ready business management dashboard with clean architecture
 * Follows industry standards for state management and user experience
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSetup } from "@/hooks/useBusinessSetup";
import { BusinessSetupService } from "@/services/businessSetupService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Building, 
  Scissors, 
  Users, 
  Settings, 
  Camera,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  BarChart,
  Calendar,
  CreditCard,
  Mail,
  Shield
} from "lucide-react";
import { Link } from "wouter";

// Import step components
import ProfileStep from "@/components/business-setup/ProfileStep";
import ServicesStep from "@/components/business-setup/ServicesStep";
import StaffStep from "@/components/business-setup/StaffStep";
import BookingSettingsStep from "@/components/business-setup/BookingSettingsStep";
import MediaStep from "@/components/business-setup/MediaStep";

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  monthlyRevenue: number;
  activeStaff: number;
}

const STEP_COMPONENTS = {
  profile: ProfileStep,
  services: ServicesStep,
  staff: StaffStep,
  settings: BookingSettingsStep,
  media: MediaStep
} as const;

const STEP_ICONS = {
  profile: Building,
  services: Scissors,
  staff: Users,
  settings: Settings,
  media: Camera
} as const;

export default function BusinessDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [salonId, setSalonId] = useState<string | null>(null);

  // Fetch user's accessible salons
  const { data: accessibleSalons, isLoading: salonsLoading, error: salonsError } = useQuery({
    queryKey: ['/api/my/salons'],
    enabled: isAuthenticated,
    retry: 2,
    staleTime: 60000 // Cache for 1 minute
  });

  // Business setup state management
  const { setupState, isLoading: setupLoading, error: setupError, refreshSetupState } = useBusinessSetup(salonId || '');

  // Mock dashboard stats (replace with real API)
  const dashboardStats: DashboardStats = {
    totalBookings: 145,
    todayBookings: 8,
    monthlyRevenue: 12500,
    activeStaff: 5
  };

  // Set salon ID from accessible salons
  useEffect(() => {
    if (Array.isArray(accessibleSalons) && accessibleSalons.length > 0 && !salonId) {
      setSalonId(accessibleSalons[0].id);
    }
  }, [accessibleSalons, salonId]);

  // Handle step completion with clean auto-navigation
  const handleStepComplete = useCallback((stepId: string) => {
    if (!setupState) return;
    
    // Auto-navigate to next step with smooth UX
    const nextStep = BusinessSetupService.getNextStep(stepId, setupState);
    
    if (nextStep !== stepId) {
      // Provide user feedback
      const completedStep = setupState.steps.find(step => step.id === stepId);
      if (completedStep) {
        toast({
          title: `${completedStep.title} Completed`,
          description: "Great! Moving to the next step.",
        });
      }
      
      // Navigate after brief delay for better UX
      setTimeout(() => {
        setActiveTab(nextStep);
      }, 1500);
    }
  }, [setupState, toast]);

  // Handle manual tab changes
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Loading states
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please log in to access your business dashboard.</p>
          <Link href="/login/business">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (salonsLoading || setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (salonsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mb-4">We couldn't load your business information.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(accessibleSalons) || accessibleSalons.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">No Business Found</h1>
          <p className="text-muted-foreground mb-4">
            You don't have any business profiles yet. Let's create one!
          </p>
          <Link href="/business-setup">
            <Button>Create Business Profile</Button>
          </Link>
        </div>
      </div>
    );
  }

  const renderActiveTabContent = () => {
    if (activeTab === "overview") {
      return renderOverviewTab();
    } 
    
    if (activeTab === "calendar") {
      return <div className="p-6">Calendar management coming soon...</div>;
    }
    
    if (activeTab === "payments") {
      return <div className="p-6">Payment management coming soon...</div>;
    }

    // Render setup step component
    const StepComponent = STEP_COMPONENTS[activeTab as keyof typeof STEP_COMPONENTS];
    if (StepComponent && salonId) {
      return (
        <div className="p-6">
          <StepComponent
            salonId={salonId}
            onComplete={() => handleStepComplete(activeTab)}
            isCompleted={setupState?.steps.find(step => step.id === activeTab)?.completed || false}
          />
        </div>
      );
    }

    return <div className="p-6">Content not found</div>;
  };

  const renderOverviewTab = () => (
    <div className="p-6 space-y-6">
      {/* Setup Progress Section */}
      {setupState && !setupState.canPublish && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <CardTitle className="text-blue-900 dark:text-blue-100">Complete Your Business Setup</CardTitle>
                <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                  Finish setting up your business profile to start accepting bookings from customers.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Progress: {setupState.completionPercentage}% Complete
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {setupState.steps.filter(s => s.completed).length} of {setupState.steps.length} steps
              </span>
            </div>
            <Progress value={setupState.completionPercentage} className="h-2" />
            
            {/* Next Step Recommendation */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Next Step: {setupState.steps.find(s => s.id === setupState.currentStep)?.title}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {setupState.steps.find(s => s.id === setupState.currentStep)?.description}
                </p>
              </div>
              <Button 
                onClick={() => handleTabChange(setupState.currentStep)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue Setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Verification Alert */}
      {user && !(user as any).emailVerified && (
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <strong>Verify your email</strong> for enhanced security and to receive booking notifications.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{dashboardStats.todayBookings}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">appointments scheduled</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">₹{dashboardStats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400">this month</p>
              </div>
              <BarChart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{dashboardStats.activeStaff}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">team members</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Bookings</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{dashboardStats.totalBookings}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">all time</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTabChange("calendar")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Schedule Management</h3>
                <p className="text-sm text-muted-foreground">Manage staff availability and time slots</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTabChange("services")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Scissors className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Service Catalog</h3>
                <p className="text-sm text-muted-foreground">Add and manage your services and pricing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTabChange("payments")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Payment Processing</h3>
                <p className="text-sm text-muted-foreground">Configure payments and view transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Back to SalonHub Link */}
      <div className="pt-4">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← Back to SalonHub
        </Link>
      </div>
    </div>
  );

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
            
            {setupState?.canPublish && (
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Setup Complete
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {/* Overview Tab */}
            <button
              onClick={() => handleTabChange("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-overview"
            >
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Overview
              </div>
            </button>

            {/* Setup Steps Tabs */}
            {setupState?.steps.map((step) => {
              const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS];
              const isActive = activeTab === step.id;
              const isCompleted = step.completed;
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleTabChange(step.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive 
                      ? "border-blue-500 text-blue-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  data-testid={`tab-${step.id}`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {step.title}
                    {isCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {step.required && !isCompleted && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Additional Management Tabs */}
            <button
              onClick={() => handleTabChange("calendar")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "calendar" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-calendar"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </div>
            </button>

            <button
              onClick={() => handleTabChange("payments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payments" 
                  ? "border-blue-500 text-blue-600" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-payments"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {setupError && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Error loading setup state: {setupError}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {renderActiveTabContent()}
      </div>
    </div>
  );
}