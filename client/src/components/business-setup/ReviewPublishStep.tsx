import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  CheckCircle, 
  AlertCircle, 
  Building, 
  MapPin, 
  Scissors, 
  Users, 
  Settings, 
  Camera,
  Globe
} from "lucide-react";

interface ReviewPublishStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

const SETUP_SECTIONS = [
  {
    id: 'business_info',
    title: 'Business Information',
    icon: Building,
    requiredFields: ['name', 'category'],
    endpoint: '/api/salons'
  },
  {
    id: 'location_contact',
    title: 'Location & Contact',
    icon: MapPin,
    requiredFields: ['address', 'city', 'phone'],
    endpoint: '/api/salons'
  },
  {
    id: 'services',
    title: 'Services & Pricing',
    icon: Scissors,
    requiredFields: [],
    endpoint: '/api/salons/{salonId}/services'
  },
  {
    id: 'staff',
    title: 'Staff Management',
    icon: Users,
    requiredFields: [],
    endpoint: '/api/salons/{salonId}/staff'
  },
  {
    id: 'booking_settings',
    title: 'Booking Settings',
    icon: Settings,
    requiredFields: ['advanceBookingDays', 'cancellationHours'],
    endpoint: '/api/salons/{salonId}/booking-settings'
  },
  {
    id: 'media',
    title: 'Photos & Media',
    icon: Camera,
    requiredFields: [],
    endpoint: '/api/salons/{salonId}/media-assets'
  }
];

export default function ReviewPublishStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: ReviewPublishStepProps) {
  const [publishStatus, setPublishStatus] = useState({
    canPublish: false,
    completedSections: 0,
    totalSections: SETUP_SECTIONS.length,
    issues: [] as string[]
  });

  // Use dashboard completion data instead of custom logic
  const { data: dashboardCompletion } = useQuery({
    queryKey: ['/api/salons', salonId, 'dashboard-completion'],
    enabled: !!salonId,
    staleTime: 30000
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load salon data and all setup sections
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  const { data: bookingSettings } = useQuery({
    queryKey: ['/api/salons', salonId, 'booking-settings'],
    enabled: !!salonId,
  });

  const { data: services } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
  });

  const { data: staff } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
  });

  const { data: resources } = useQuery({
    queryKey: ['/api/salons', salonId, 'resources'],
    enabled: !!salonId,
  });

  const { data: payoutAccounts } = useQuery({
    queryKey: ['/api/salons', salonId, 'payout-accounts'],
    enabled: !!salonId,
  });

  const { data: mediaAssets } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
  });

  const { data: publishState } = useQuery({
    queryKey: ['/api/salons', salonId, 'publish-state'],
    enabled: !!salonId,
  });

  // Publish salon mutation
  const publishSalonMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}/publish-state`, {
        isPublished: 1,
        canAcceptBookings: 1,
        publishedAt: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'publish-state'] 
      });
      onComplete({ published: true });
      toast({
        title: "🎉 Salon Published Successfully!",
        description: "Your salon is now live and accepting bookings.",
      });
    },
    onError: () => {
      toast({
        title: "Publishing Failed",
        description: "Failed to publish your salon. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check completion status
  useEffect(() => {
    const completionData = {
      business_info: salonData,
      location_contact: salonData,
      services: services,
      staff: staff,
      resources: resources,
      booking_settings: bookingSettings,
      payment_setup: payoutAccounts,
      media: mediaAssets
    };

    let completed = 0;
    const issues: string[] = [];

    SETUP_SECTIONS.forEach(section => {
      const data = completionData[section.id as keyof typeof completionData];
      
      if (section.id === 'services' && (!services || services.length === 0)) {
        issues.push('Add at least one service to your catalog');
        return;
      }
      
      if (section.id === 'staff' && (!staff || staff.length === 0)) {
        issues.push('Add at least one staff member');
        return;
      }


      if (data && typeof data === 'object') {
        const hasRequiredFields = section.requiredFields.every(field => {
          const value = (data as any)[field];
          return value !== null && value !== undefined && value !== '';
        });

        if (hasRequiredFields) {
          completed++;
        } else {
          issues.push(`Complete ${section.title} with required information`);
        }
      } else if (section.requiredFields.length === 0 && data) {
        completed++;
      } else {
        issues.push(`Complete ${section.title} setup`);
      }
    });

    setPublishStatus({
      canPublish: completed >= 6, // All 6 core sections required
      completedSections: completed,
      totalSections: SETUP_SECTIONS.length,
      issues
    });
  }, [salonData, bookingSettings, services, staff, resources, payoutAccounts, mediaAssets]);

  const handlePublish = async () => {
    if (!publishStatus.canPublish) {
      toast({
        title: "Setup Incomplete",
        description: "Please complete the required sections before publishing.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    await publishSalonMutation.mutateAsync();
    setIsPublishing(false);
  };

  // Use dashboard completion data if available, otherwise fallback to old logic
  const completionPercentage = (dashboardCompletion && typeof dashboardCompletion === 'object' && 'overallProgress' in dashboardCompletion) 
    ? (dashboardCompletion as any).overallProgress 
    : ((publishStatus.completedSections / publishStatus.totalSections) * 100);

  // Calculate correct completion count using dashboard data when available
  const actualCompletedSections = useMemo(() => {
    if (dashboardCompletion && typeof dashboardCompletion === 'object') {
      let completed = 0;
      // Count each section using same logic as individual section display
      SETUP_SECTIONS.forEach(section => {
        let isCompleted = false;
        switch (section.id) {
          case 'business_info':
          case 'location_contact':
            isCompleted = (dashboardCompletion as any).profile?.isComplete ?? false;
            break;
          case 'services':
            isCompleted = (dashboardCompletion as any).services?.isComplete ?? false;
            break;
          case 'staff':
            isCompleted = (dashboardCompletion as any).staff?.isComplete ?? false;
            break;
          case 'booking_settings':
            isCompleted = (dashboardCompletion as any).settings?.isComplete ?? false;
            break;
          case 'media':
            isCompleted = (dashboardCompletion as any).media?.isComplete ?? false;
            break;
          default:
            isCompleted = false;
        }
        if (isCompleted) completed++;
      });
      return completed;
    }
    return publishStatus.completedSections;
  }, [dashboardCompletion, publishStatus.completedSections]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Review & Publish Your Salon</h3>
          <p className="text-muted-foreground">
            Review your setup and launch your business on SalonHub
          </p>
        </div>
      </div>

      {/* Completion Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Setup Progress
            <Badge variant={actualCompletedSections >= SETUP_SECTIONS.length ? "default" : "secondary"}>
              {actualCompletedSections}/{SETUP_SECTIONS.length} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            {completionPercentage >= 100 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Ready to publish!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Complete {Math.round(100 - completionPercentage)}% more to publish
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Status */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SETUP_SECTIONS.map((section) => {
              // Use dashboard completion data instead of old sequential logic
              let isCompleted = false;
              if (dashboardCompletion && typeof dashboardCompletion === 'object') {
                switch (section.id) {
                  case 'business_info':
                  case 'location_contact':
                    isCompleted = (dashboardCompletion as any).profile?.isComplete ?? false;
                    break;
                  case 'services':
                    isCompleted = (dashboardCompletion as any).services?.isComplete ?? false;
                    break;
                  case 'staff':
                    isCompleted = (dashboardCompletion as any).staff?.isComplete ?? false;
                    break;
                  case 'booking_settings':
                    isCompleted = (dashboardCompletion as any).settings?.isComplete ?? false;
                    break;
                  case 'media':
                    isCompleted = (dashboardCompletion as any).media?.isComplete ?? false;
                    break;
                  default:
                    isCompleted = false;
                }
              } else {
                // Fallback to old logic if dashboard data not available
                isCompleted = publishStatus.completedSections >= SETUP_SECTIONS.indexOf(section) + 1;
              }
              
              return (
                <div
                  key={section.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border
                    ${isCompleted 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                      : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    ${isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <section.icon className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{section.title}</h4>
                    <p className={`text-xs ${
                      isCompleted ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {isCompleted ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Issues */}
      {publishStatus.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Items to Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {publishStatus.issues.map((issue, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Publish Action */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {publishState?.isPublished ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-lg font-semibold">Your salon is live!</span>
                </div>
                <p className="text-muted-foreground">
                  Customers can now discover and book appointments with your business.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Ready to Launch?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Publishing your salon will make it visible to customers on SalonHub. 
                  They'll be able to discover your services and book appointments online.
                </p>
                
                <Button
                  onClick={handlePublish}
                  disabled={actualCompletedSections < SETUP_SECTIONS.length || isPublishing || publishSalonMutation.isPending}
                  size="lg"
                  className="w-full md:w-auto"
                  data-testid="button-publish-salon"
                >
                  {isPublishing || publishSalonMutation.isPending ? "Publishing..." : "🚀 Publish My Salon"}
                </Button>

                {actualCompletedSections < SETUP_SECTIONS.length && (
                  <p className="text-sm text-amber-600">
                    Complete the core sections to publish your salon
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {isCompleted && (
            <span className="text-green-600 font-medium">✓ Setup Complete</span>
          )}
        </div>

        {publishState?.isPublished && (
          <Button
            variant="outline"
            onClick={() => window.open('/', '_blank')}
            data-testid="button-view-salon"
          >
            View Your Salon
          </Button>
        )}
      </div>
    </div>
  );
}