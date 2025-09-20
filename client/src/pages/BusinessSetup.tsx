import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building, 
  MapPin, 
  Scissors, 
  Users, 
  Settings, 
  CreditCard, 
  Camera, 
  CheckCircle,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

// Import individual step components
import BusinessInfoStep from "@/components/business-setup/BusinessInfoStep";
import LocationContactStep from "@/components/business-setup/LocationContactStep";
import ServicesStep from "@/components/business-setup/ServicesStep";
import StaffStep from "@/components/business-setup/StaffStep";
import ResourcesStep from "@/components/business-setup/ResourcesStep";
import BookingSettingsStep from "@/components/business-setup/BookingSettingsStep";
import PaymentSetupStep from "@/components/business-setup/PaymentSetupStep";
import MediaStep from "@/components/business-setup/MediaStep";
import ReviewPublishStep from "@/components/business-setup/ReviewPublishStep";

const SETUP_STEPS = [
  {
    id: 1,
    title: "Business Information",
    description: "Tell us about your business",
    icon: Building,
    component: BusinessInfoStep
  },
  {
    id: 2,
    title: "Location & Contact",
    description: "Where can customers find you?",
    icon: MapPin,
    component: LocationContactStep
  },
  {
    id: 3,
    title: "Services & Pricing",
    description: "What services do you offer?",
    icon: Scissors,
    component: ServicesStep
  },
  {
    id: 4,
    title: "Staff Management",
    description: "Add your team members",
    icon: Users,
    component: StaffStep
  },
  {
    id: 5,
    title: "Resources Setup",
    description: "Chairs, rooms, and equipment",
    icon: Settings,
    component: ResourcesStep
  },
  {
    id: 6,
    title: "Booking Settings",
    description: "Set your booking policies",
    icon: Settings,
    component: BookingSettingsStep
  },
  {
    id: 7,
    title: "Payment Setup",
    description: "Configure payment processing",
    icon: CreditCard,
    component: PaymentSetupStep
  },
  {
    id: 8,
    title: "Photos & Media",
    description: "Showcase your business",
    icon: Camera,
    component: MediaStep
  },
  {
    id: 9,
    title: "Review & Publish",
    description: "Launch your business",
    icon: CheckCircle,
    component: ReviewPublishStep
  }
];

export default function BusinessSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Get user's salon from org memberships
  const userSalons = user?.orgMemberships
    ?.filter(membership => ['owner', 'manager', 'staff'].includes(membership.orgRole))
    .map(membership => ({
      id: membership.organization.id,
      name: membership.organization.name,
      orgRole: membership.orgRole,
    })) ?? [];

  const currentSalon = userSalons[0]; // Use first salon for now

  // Redirect if not authenticated or no salon
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/join/business');
    }
  }, [isAuthenticated, setLocation]);

  // Load existing progress from API
  const { data: publishState } = useQuery({
    queryKey: ['/api/salons', currentSalon?.id, 'publish-state'],
    enabled: !!currentSalon?.id,
  });

  // Load saved progress on mount
  useEffect(() => {
    if (publishState) {
      const step = publishState.onboardingStep || 1;
      const completed = publishState.completedSteps || [];
      setCurrentStep(step);
      setCompletedSteps(completed);
    }
  }, [publishState]);

  // Auto-save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (data: { step: number; completed: number[]; stepData: any }) => {
      if (!currentSalon?.id) throw new Error('No salon ID');
      
      const response = await apiRequest('PUT', `/api/salons/${currentSalon.id}/publish-state`, {
        onboardingStep: data.step,
        completedSteps: data.completed,
        checklist: data.stepData
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/salons', currentSalon?.id, 'publish-state']
      });
    },
  });

  // Auto-save when step changes (debounced)
  useEffect(() => {
    if (currentSalon?.id && currentStep > 1) {
      const timer = setTimeout(() => {
        saveProgressMutation.mutate({
          step: currentStep,
          completed: completedSteps,
          stepData
        });
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [currentStep, completedSteps, stepData, currentSalon?.id]);

  const handleStepComplete = (stepId: number, data: any) => {
    // Save step data
    setStepData(prev => ({ ...prev, [stepId]: data }));
    
    // Mark step as completed
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }

    // Auto-advance to next step
    if (stepId < SETUP_STEPS.length) {
      setCurrentStep(stepId + 1);
    }

    toast({
      title: "Progress Saved",
      description: `${SETUP_STEPS[stepId - 1].title} completed successfully.`,
    });
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepForward = () => {
    if (currentStep < SETUP_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const progress = (completedSteps.length / SETUP_STEPS.length) * 100;
  const currentStepConfig = SETUP_STEPS[currentStep - 1];
  const CurrentStepComponent = currentStepConfig.component;

  if (!isAuthenticated || !currentSalon?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p>Loading salon information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold" data-testid="heading-setup-title">
              Business Setup
            </h1>
            <Badge variant="outline" data-testid="badge-progress">
              Step {currentStep} of {SETUP_STEPS.length}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{completedSteps.length} of {SETUP_STEPS.length} steps completed</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-bar" />
          </div>
        </div>

        {/* Step Navigation */}
        <div className="hidden lg:flex items-center justify-center mb-8 overflow-x-auto">
          <div className="flex items-center space-x-4">
            {SETUP_STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep || isCompleted;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    disabled={!isAccessible}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                      ${isCurrent 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-500 text-white' 
                          : 'border-muted-foreground bg-background'
                      }
                      ${isAccessible ? 'hover:border-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                    `}
                    data-testid={`button-step-${step.id}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </button>
                  
                  {index < SETUP_STEPS.length - 1 && (
                    <div className={`
                      w-12 h-0.5 mx-2
                      ${completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-muted'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full
                  ${completedSteps.includes(currentStep) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                  }
                `}>
                  {completedSteps.includes(currentStep) ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <currentStepConfig.icon className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl" data-testid={`title-step-${currentStep}`}>
                    {currentStepConfig.title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {currentStepConfig.description}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Render current step component */}
              <CurrentStepComponent
                salonId={currentSalon.id}
                initialData={stepData[currentStep]}
                onComplete={(data: any) => handleStepComplete(currentStep, data)}
                isCompleted={completedSteps.includes(currentStep)}
              />

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleStepBack}
                  disabled={currentStep === 1}
                  data-testid="button-step-back"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleStepForward}
                    disabled={currentStep === SETUP_STEPS.length}
                    data-testid="button-step-forward"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  {currentStep === SETUP_STEPS.length && (
                    <Button
                      onClick={() => setLocation('/dashboard')}
                      data-testid="button-complete-setup"
                    >
                      Complete Setup
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}