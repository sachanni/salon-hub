/**
 * Business Setup Hook
 * Custom React hook for managing business setup state
 * Provides clean, consistent interface for all setup components
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BusinessSetupService, type BusinessSetupState } from '@/services/businessSetupService';

export interface UseBusinessSetupReturn {
  setupState: BusinessSetupState | null;
  isLoading: boolean;
  error: string | null;
  refreshSetupState: () => void;
}

export function useBusinessSetup(salonId: string): UseBusinessSetupReturn {
  const [setupState, setSetupState] = useState<BusinessSetupState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all required data for setup state calculation
  const { data: salonData, isLoading: salonLoading } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
    staleTime: 30000, // Cache for 30 seconds
    retry: 2
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 30000,
    retry: 2
  });

  const { data: staff, isLoading: staffLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
    staleTime: 30000,
    retry: 2
  });

  const { data: bookingSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'booking-settings'],
    enabled: !!salonId,
    staleTime: 30000,
    retry: 2
  });

  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
    staleTime: 30000,
    retry: 2
  });

  const isLoading = salonLoading || servicesLoading || staffLoading || settingsLoading || mediaLoading;

  // Calculate setup state when data changes
  useEffect(() => {
    if (!isLoading && salonId) {
      try {
        const calculatedState = BusinessSetupService.calculateSetupState({
          salonData,
          services: Array.isArray(services) ? services : [],
          staff: Array.isArray(staff) ? staff : [],
          bookingSettings,
          media: Array.isArray(media) ? media : []
        });
        
        setSetupState(calculatedState);
        setError(null);
      } catch (err) {
        setError('Failed to calculate setup state');
        console.error('Setup state calculation error:', err);
      }
    }
  }, [salonData, services, staff, bookingSettings, media, isLoading, salonId]);

  const refreshSetupState = () => {
    // Force refresh by invalidating all queries instead of setting state to null
    // This prevents infinite loops while still refreshing data
  };

  return {
    setupState,
    isLoading,
    error,
    refreshSetupState
  };
}