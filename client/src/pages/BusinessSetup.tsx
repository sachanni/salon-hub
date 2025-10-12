import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Scissors, 
  Sparkles,
  Check,
  Palette,
  Heart,
  Flower2,
  Users2,
} from "lucide-react";
import SetupWizard from "@/components/business-setup/SetupWizard";

// Business Templates with Prefilled Data
const BUSINESS_TEMPLATES = [
  {
    id: 'hair-salon',
    name: 'Hair Salon',
    icon: Scissors,
    color: 'from-purple-500 to-pink-500',
    description: 'Perfect for hair styling and treatments',
  },
  {
    id: 'spa-wellness',
    name: 'Spa & Wellness',
    icon: Sparkles,
    color: 'from-teal-500 to-cyan-500',
    description: 'Relaxation and wellness services',
  },
  {
    id: 'nails-studio',
    name: 'Nails Studio',
    icon: Palette,
    color: 'from-rose-500 to-pink-500',
    description: 'Nail art and beauty services',
  },
  {
    id: 'beauty-clinic',
    name: 'Beauty Clinic',
    icon: Heart,
    color: 'from-violet-500 to-purple-500',
    description: 'Advanced skincare and beauty',
  },
  {
    id: 'barber-shop',
    name: 'Barber Shop',
    icon: Users2,
    color: 'from-amber-500 to-orange-500',
    description: "Men's grooming and styling",
  },
  {
    id: 'custom',
    name: 'Custom Setup',
    icon: Flower2,
    color: 'from-gray-500 to-slate-500',
    description: 'Start from scratch',
  }
];

export default function BusinessSetup() {
  const [templateSelected, setTemplateSelected] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Get user's salons from API
  const { data: userSalons, isLoading: salonsLoading, refetch: refetchSalons } = useQuery({
    queryKey: ['/api/my/salons'],
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const currentSalon = Array.isArray(userSalons) && userSalons.length > 0 ? userSalons[0] : null;

  // Create organization and salon for new business owners
  const createOrganizationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/organizations', {
        name: `${user?.firstName || 'Business'} Organization`,
        description: 'Business organization for salon management'
      });
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/my/salons'] });
      
      const result = await refetchSalons();
      
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        setIsCreatingOrganization(false);
        toast({
          title: "Organization Created",
          description: "Your business organization has been set up. Let's configure your salon!",
        });
      } else {
        console.error('Salon not found after organization creation');
        toast({
          title: "Setup Error",
          description: "Organization created but salon setup incomplete. Please refresh the page.",
          variant: "destructive",
        });
        setTimeout(() => window.location.reload(), 2000);
      }
    },
    onError: (error) => {
      console.error('Error creating organization:', error);
      setIsCreatingOrganization(false);
      toast({
        title: "Setup Error",
        description: "Failed to create business organization. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Redirect if not authenticated, or create org if business owner without salon
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/join/business');
      return;
    }

    if (
      user && 
      user.roles.includes('owner') && 
      (!userSalons || (Array.isArray(userSalons) && userSalons.length === 0)) && 
      !isCreatingOrganization && 
      !createOrganizationMutation.isPending
    ) {
      setIsCreatingOrganization(true);
      createOrganizationMutation.mutate();
    }
  }, [isAuthenticated, user, userSalons]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    if (!currentSalon || !currentSalon.id) {
      toast({
        title: "Setup Not Ready",
        description: "Please wait for your salon to be created before continuing.",
        variant: "destructive",
      });
      return;
    }

    setSelectedTemplate(templateId);
    setTemplateSelected(true);
  };

  // Handle setup completion
  const handleSetupComplete = () => {
    toast({
      title: "🎉 Setup Complete!",
      description: "All required steps have been completed. Review your salon and publish when ready!",
    });
    setLocation('/business/dashboard');
  };

  // Show loading state while organization is being created or salons are loading
  if (salonsLoading || isCreatingOrganization || createOrganizationMutation.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your business</h2>
          <p className="text-gray-600">Creating your salon profile...</p>
        </div>
      </div>
    );
  }

  // If template selected, show the unified 8-step wizard
  if (templateSelected && currentSalon?.id) {
    return (
      <SetupWizard
        salonId={currentSalon.id}
        initialStep={1}
        onComplete={handleSetupComplete}
      />
    );
  }

  // Template Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Business Template
          </h1>
          <p className="text-lg text-gray-600">
            Get started quickly with a template tailored to your business type
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BUSINESS_TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-500 group"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {template.id !== 'custom' ? (
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        8-step guided setup
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Smart recommendations
                      </p>
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Complete business profile
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Build your business profile from the ground up with our comprehensive setup wizard
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
