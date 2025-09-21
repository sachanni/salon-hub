import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  ArrowRight,
  BarChart,
  Calendar,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";

// Import step components
import ProfileStep from "@/components/business-setup/ProfileStep";
import ServicesStep from "@/components/business-setup/ServicesStep";
import StaffStep from "@/components/business-setup/StaffStep";
import BookingSettingsStep from "@/components/business-setup/BookingSettingsStep";
import MediaStep from "@/components/business-setup/MediaStep";

export default function BusinessDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [salonId, setSalonId] = useState<string | null>(null);

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

  // Simple completion check
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: services } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Simple completion logic
  const isProfileComplete = salonData?.name && salonData?.address && salonData?.phone;
  const hasServices = Array.isArray(services) && services.length > 0;
  const completionPercentage = Math.round(((isProfileComplete ? 1 : 0) + (hasServices ? 1 : 0)) / 2 * 100);

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
    toast({
      title: "Step Completed",
      description: "Great progress! Keep going.",
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
                      Next: {!isProfileComplete ? 'Complete Profile' : 'Add Services'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setActiveTab(!isProfileComplete ? 'profile' : 'services')}
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

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">8</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">₹12,500</p>
                  </div>
                  <BarChart className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">5</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Bookings</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">145</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-orange-600" />
                </div>
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
      media: MediaStep
    };

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
                Settings
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