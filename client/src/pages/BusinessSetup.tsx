import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import SetupWizard from "@/components/business-setup/SetupWizard";

export default function BusinessSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Get user's salons from API
  const { data: userSalons, isLoading: salonsLoading, refetch: refetchSalons } = useQuery({
    queryKey: ['/api/my/salons'],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Get the selected salon ID from localStorage or use first salon
  const selectedSalonId = typeof window !== 'undefined' ? localStorage.getItem('selectedSalonId') : null;
  
  const currentSalon = Array.isArray(userSalons) && userSalons.length > 0
    ? (selectedSalonId 
        ? userSalons.find((s: any) => s.id === selectedSalonId) || userSalons[0]
        : userSalons[0])
    : null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/join/business');
      return;
    }
  }, [isAuthenticated]);

  // Handle setup completion
  const handleSetupComplete = () => {
    toast({
      title: "🎉 Setup Complete!",
      description: "All required steps have been completed. Review your salon and publish when ready!",
    });
    setLocation('/business/dashboard');
  };

  // Show loading state while salons are loading
  if (salonsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading your salon...</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard directly with the salon
  if (currentSalon) {
    return (
      <SetupWizard
        salonId={currentSalon.id}
        initialStep={1}
        onComplete={handleSetupComplete}
      />
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
      </div>
    </div>
  );
}
