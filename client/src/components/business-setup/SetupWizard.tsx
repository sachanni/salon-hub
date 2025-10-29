import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, MapPin, Scissors, Users, Calendar, Settings, CreditCard, Camera, CheckCircle } from 'lucide-react';
import { useSalonSetupStatus } from '@/hooks/useSalonSetupStatus';
import BusinessInfoStep from './BusinessInfoStep';
import LocationContactStep from './LocationContactStep';
import { PremiumServicesStep } from './PremiumServicesStep';
import StaffStep from './StaffStep';
import ResourcesStep from './ResourcesStep';
import BookingSettingsStep from './BookingSettingsStep';
import PaymentSetupStep from './PaymentSetupStep';
import MediaStep from './MediaStep';

interface SetupWizardProps {
  salonId: string;
  initialStep?: number;
  onComplete?: () => void;
}

const SETUP_STEPS = [
  {
    id: 1,
    key: 'businessInfo',
    name: 'Business Info',
    icon: Building2,
    component: BusinessInfoStep,
  },
  {
    id: 2,
    key: 'locationContact',
    name: 'Location & Contact',
    icon: MapPin,
    component: LocationContactStep,
  },
  {
    id: 3,
    key: 'services',
    name: 'Services & Pricing',
    icon: Scissors,
    component: PremiumServicesStep,
  },
  {
    id: 4,
    key: 'staff',
    name: 'Team Members',
    icon: Users,
    component: StaffStep,
  },
  {
    id: 5,
    key: 'resources',
    name: 'Resources',
    icon: Calendar,
    component: ResourcesStep,
  },
  {
    id: 6,
    key: 'bookingSettings',
    name: 'Booking Settings',
    icon: Settings,
    component: BookingSettingsStep,
  },
  {
    id: 7,
    key: 'paymentSetup',
    name: 'Payment Setup',
    icon: CreditCard,
    component: PaymentSetupStep,
  },
  {
    id: 8,
    key: 'media',
    name: 'Photos & Gallery',
    icon: Camera,
    component: MediaStep,
  },
];

export default function SetupWizard({ salonId, initialStep = 1, onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch real setup status from API
  const { data: setupStatus, isLoading: setupStatusLoading, refetch: refetchSetupStatus } = useSalonSetupStatus(salonId);

  // Initialize current step based on API response (first incomplete step) - only on initial load
  useEffect(() => {
    if (setupStatus && !setupStatusLoading && !hasInitialized) {
      // Find the first incomplete step
      const stepKeys = ['businessInfo', 'locationContact', 'services', 'staff', 'resources', 'bookingSettings', 'paymentSetup', 'media'] as const;
      const firstIncompleteIndex = stepKeys.findIndex(key => !setupStatus.steps[key].completed);
      
      // Build completed steps set
      const completed = new Set<number>();
      stepKeys.forEach((key, index) => {
        if (setupStatus.steps[key].completed) {
          completed.add(index + 1);
        }
      });
      
      setCompletedSteps(completed);
      
      // Set current step to first incomplete, or last step if all complete
      if (firstIncompleteIndex >= 0) {
        setCurrentStep(firstIncompleteIndex + 1);
      } else if (setupStatus.isSetupComplete) {
        setCurrentStep(SETUP_STEPS.length);
        onComplete?.(); // Trigger completion callback
      }
      
      setHasInitialized(true);
    }
  }, [setupStatus, setupStatusLoading, hasInitialized, onComplete]);

  // Update completed steps when setup status changes (but don't change current step)
  useEffect(() => {
    if (setupStatus && hasInitialized) {
      const stepKeys = ['businessInfo', 'locationContact', 'services', 'staff', 'resources', 'bookingSettings', 'paymentSetup', 'media'] as const;
      const completed = new Set<number>();
      stepKeys.forEach((key, index) => {
        if (setupStatus.steps[key].completed) {
          completed.add(index + 1);
        }
      });
      setCompletedSteps(completed);
    }
  }, [setupStatus, hasInitialized]);

  const currentStepData = SETUP_STEPS[currentStep - 1];
  const CurrentStepComponent = currentStepData.component;
  const progress = setupStatus?.progress || Math.round((currentStep / SETUP_STEPS.length) * 100);

  const handleNext = async () => {
    // Refetch setup status to get latest completion state
    await refetchSetupStatus();
    
    // Mark current step as completed locally
    setCompletedSteps(prev => new Set(Array.from(prev).concat(currentStep)));
    
    if (currentStep < SETUP_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed
      onComplete?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId: number) => {
    // Only allow navigation to current step or earlier
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Setup</h1>
            <p className="text-gray-600">
              Step {currentStep} of {SETUP_STEPS.length}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 text-center mt-2">{progress}% complete</p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {SETUP_STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => isAccessible && goToStep(step.id)}
                  disabled={!isAccessible}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                    ${isCurrent ? 'bg-violet-600 text-white shadow-lg scale-105' : ''}
                    ${isCompleted && !isCurrent ? 'bg-green-100 text-green-700' : ''}
                    ${!isCurrent && !isCompleted && isAccessible ? 'bg-white text-gray-600 hover:bg-gray-100' : ''}
                    ${!isAccessible ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-6 shadow-xl bg-white">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-violet-100 rounded-lg">
                <currentStepData.icon className="h-6 w-6 text-violet-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{currentStepData.name}</h2>
            </div>
          </div>

          <CurrentStepComponent
            salonId={salonId}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleNext}
          />
        </Card>
      </div>
    </div>
  );
}
