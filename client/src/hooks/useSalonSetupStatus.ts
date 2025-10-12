import { useQuery } from '@tanstack/react-query';

export interface SetupStepStatus {
  completed: boolean;
  requiredFields?: string[];
  missingFields?: string[];
  count?: number;
  message?: string;
  optional?: boolean;
}

export interface SalonSetupStatus {
  salonId: string;
  isSetupComplete: boolean;
  completedSteps: number;
  totalSteps: number;
  progress: number;
  steps: {
    businessInfo: SetupStepStatus;
    locationContact: SetupStepStatus;
    services: SetupStepStatus;
    staff: SetupStepStatus;
    resources: SetupStepStatus;
    bookingSettings: SetupStepStatus;
    paymentSetup: SetupStepStatus;
    media: SetupStepStatus;
  };
}

export function useSalonSetupStatus(salonId: string | undefined | null) {
  return useQuery<SalonSetupStatus>({
    queryKey: ['salon-setup-status', salonId],
    queryFn: async () => {
      if (!salonId) {
        throw new Error('Salon ID is required');
      }

      const response = await fetch(`/api/salons/${salonId}/setup-status`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch setup status');
      }

      return response.json();
    },
    enabled: !!salonId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });
}
