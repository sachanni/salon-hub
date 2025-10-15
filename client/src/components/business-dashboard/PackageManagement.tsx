import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Gift,
  Plus,
  Trash2,
  Edit,
  Clock,
  IndianRupee,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Package as PackageIcon,
  Users,
  CheckCircle2,
  Scissors,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface PackageManagementProps {
  salonId: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceInPaisa: number;
  category: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  totalDurationMinutes: number;
  regularPriceInPaisa: number;
  packagePriceInPaisa: number;
  discountPercentage: number;
  services: Service[];
}

// Category icons for visual grouping
const categoryIcons: Record<string, string> = {
  hair: '💇',
  nails: '💅',
  massage: '💆',
  skincare: '✨',
  eyes: '👁️',
  makeup: '💄',
  body: '🧖',
  mens: '💈',
  'hair-removal': '🪶',
  wellness: '🧘',
};

export default function PackageManagement({ salonId }: PackageManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // View state: 'list' or 'create'  
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [packageName, setPackageName] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');

  // Fetch packages
  const { data: packages, isLoading: packagesLoading } = useQuery<ServicePackage[]>({
    queryKey: [`/api/salons/${salonId}/packages`],
    enabled: !!salonId,
  });

  // Fetch services
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salonId}/services`],
    enabled: !!salonId,
  });

  // Group services by category for visual organization
  const groupedServices = services?.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>) || {};

  // Calculate package summary
  const selectedServices = services?.filter(s => selectedServiceIds.includes(s.id)) || [];
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const regularPrice = selectedServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
  const discountedPricePaisa = parseInt(discountedPrice) * 100 || 0;
  const savingsAmount = regularPrice - discountedPricePaisa;
  const discountPercentage = regularPrice > 0 ? Math.round((savingsAmount / regularPrice) * 100) : 0;

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/salons/${salonId}/packages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/packages`] });
      toast({
        title: "Package Created! 🎉",
        description: "Your combo package is now available for booking",
      });
      resetWizard();
      setView('list');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create package",
        variant: "destructive",
      });
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/salons/${salonId}/packages/${editingPackageId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/packages`] });
      toast({
        title: "Package Updated! ✨",
        description: "Your changes have been saved successfully",
      });
      resetWizard();
      setView('list');
      setEditingPackageId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package",
        variant: "destructive",
      });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      return apiRequest('DELETE', `/api/salons/${salonId}/packages/${packageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/packages`] });
      toast({
        title: "Package Deleted",
        description: "Package removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
    },
  });

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedServiceIds([]);
    setPackageName('');
    setPackageDescription('');
    setDiscountedPrice('');
    setEditingPackageId(null);
  };

  const handleEditPackage = async (pkg: ServicePackage) => {
    try {
      // Fetch full package details with services
      const response = await apiRequest('GET', `/api/salons/${salonId}/packages/${pkg.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load package details');
      }
      
      const packageWithServices = await response.json();
      
      setEditingPackageId(pkg.id);
      setPackageName(packageWithServices.name || '');
      setPackageDescription(packageWithServices.description || '');
      setSelectedServiceIds(packageWithServices.services?.map((s: Service) => s.id) || []);
      setDiscountedPrice(String((packageWithServices.packagePriceInPaisa || 0) / 100));
      setCurrentStep(1);
      setView('edit');
    } catch (error) {
      console.error('Error loading package for edit:', error);
      toast({
        title: "Error",
        description: "Failed to load package details",
        variant: "destructive",
      });
    }
  };

  const handleSavePackage = () => {
    const data = {
      name: packageName,
      description: packageDescription,
      serviceIds: selectedServiceIds,
      discountedPricePaisa,
    };

    if (view === 'edit' && editingPackageId) {
      updatePackageMutation.mutate(data);
    } else {
      createPackageMutation.mutate(data);
    }
  };

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(paisa / 100);
  };

  const canProceedToStep2 = packageName.trim() !== '' && packageDescription.trim() !== '';
  const canProceedToStep3 = selectedServiceIds.length >= 2;
  const canCreatePackage = discountedPricePaisa > 0 && discountedPricePaisa < regularPrice;

  // Step 1: Package Details
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Package Details</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Give your combo package an attractive name and description
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="package-name">Package Name *</Label>
          <Input
            id="package-name"
            placeholder="e.g., Ultimate Pampering Package, Men's Grooming Special"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Choose a catchy name that highlights the value
          </p>
        </div>

        <div>
          <Label htmlFor="package-description">Description *</Label>
          <Textarea
            id="package-description"
            placeholder="Describe what makes this package special and what's included..."
            value={packageDescription}
            onChange={(e) => setPackageDescription(e.target.value)}
            className="mt-1"
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Explain the benefits customers get with this combo
          </p>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">💡 Pro Tip</p>
              <p className="text-xs text-blue-700">
                Great packages mix different service types! Try: "Haircut + Beard Trim + Face Massage" or "Spa Day: Full Body Massage + Manicure + Facial"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 2: Smart Service Selection (ALL services, grouped by category)
  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Services (Min. 2)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Mix and match services from different categories to create the perfect combo
        </p>
      </div>

      {Object.keys(groupedServices).length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No services available</p>
          <p className="text-xs text-muted-foreground mt-1">Add services first to create packages</p>
        </div>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white/95 backdrop-blur-sm py-1 z-10">
                  <span className="text-xl">{categoryIcons[category.toLowerCase()] || '📌'}</span>
                  <h4 className="font-semibold text-sm text-gray-700">{category}</h4>
                  <div className="flex-1 border-b border-gray-200"></div>
                </div>
                <div className="space-y-2 ml-7">
                  {categoryServices.map((service) => (
                    <div
                      key={service.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedServiceIds.includes(service.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => {
                        if (selectedServiceIds.includes(service.id)) {
                          setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                        } else {
                          setSelectedServiceIds([...selectedServiceIds, service.id]);
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedServiceIds.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServiceIds([...selectedServiceIds, service.id]);
                          } else {
                            setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{service.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.durationMinutes} min
                          </span>
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {formatCurrency(service.priceInPaisa)}
                          </span>
                        </div>
                      </div>
                      {selectedServiceIds.includes(service.id) && (
                        <Check className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {selectedServices.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Selected Services:</span>
              <span className="font-semibold">{selectedServices.length}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Total Duration:</span>
              <span className="font-semibold">{totalDuration} min</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Regular Price:</span>
              <span className="font-semibold">{formatCurrency(regularPrice)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Step 3: Pricing
  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Set Package Pricing</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Offer an attractive discount to encourage customers to book this combo
        </p>
      </div>

      <div>
        <Label htmlFor="package-price">Package Price (₹) *</Label>
        <div className="relative mt-1">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="package-price"
            type="number"
            placeholder="Enter discounted price"
            value={discountedPrice}
            onChange={(e) => setDiscountedPrice(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Regular total: {formatCurrency(regularPrice)}
        </p>
      </div>

      {discountedPricePaisa > 0 && discountedPricePaisa < regularPrice && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">🎉 Great Deal!</span>
              <Badge className="bg-green-600 text-white">
                {discountPercentage}% OFF
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Regular Price:</span>
                <span className="line-through">{formatCurrency(regularPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package Price:</span>
                <span className="font-bold text-green-700">{formatCurrency(discountedPricePaisa)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Saves:</span>
                <span className="font-bold text-green-700">{formatCurrency(savingsAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {discountedPricePaisa >= regularPrice && discountedPricePaisa > 0 && (
        <p className="text-sm text-red-600">
          Package price must be less than regular price ({formatCurrency(regularPrice)}) to offer a discount
        </p>
      )}
    </div>
  );

  // Step 4: Review
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-3">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold mb-1">Review Your Package</h3>
        <p className="text-sm text-muted-foreground">
          Confirm the details before creating
        </p>
      </div>

      <Card className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg">{packageName}</CardTitle>
              <CardDescription className="mt-1">{packageDescription}</CardDescription>
            </div>
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              {discountPercentage}% OFF
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Included Services:</p>
            <div className="space-y-2">
              {selectedServices.map((service, idx) => (
                <div key={service.id} className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </div>
                  <span className="flex-1">{service.name}</span>
                  <span className="text-muted-foreground">{service.durationMinutes} min</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Total Duration</p>
              <p className="font-semibold">{totalDuration} minutes</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Number of Services</p>
              <p className="font-semibold">{selectedServices.length} services</p>
            </div>
          </div>

          <Separator />

          <div className="bg-white/60 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Regular Price:</span>
              <span className="line-through">{formatCurrency(regularPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Package Price:</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {formatCurrency(discountedPricePaisa)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Customer Saves:</span>
              <span className="font-semibold">{formatCurrency(savingsAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const steps = [
    { number: 1, label: 'Details', component: renderStep1 },
    { number: 2, label: 'Services', component: renderStep2 },
    { number: 3, label: 'Pricing', component: renderStep3 },
    { number: 4, label: 'Review', component: renderStep4 },
  ];

  if (packagesLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // CREATE/EDIT VIEW
  if (view === 'create' || view === 'edit') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-purple-600" />
              {view === 'edit' ? 'Edit Package Deal' : 'Create Package Deal'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {view === 'edit' 
                ? 'Update your package details, services, and pricing' 
                : 'Mix different services to create an irresistible combo offer'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setView('list');
              resetWizard();
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 ${
                    currentStep === step.number ? 'text-purple-600' :
                    currentStep > step.number ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      currentStep === step.number ? 'bg-purple-600 text-white' :
                      currentStep > step.number ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}>
                      {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                    </div>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {steps[currentStep - 1].component()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 1) {
                setView('list');
                resetWizard();
              } else {
                setCurrentStep(currentStep - 1);
              }
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !canProceedToStep2) ||
                  (currentStep === 2 && !canProceedToStep3) ||
                  (currentStep === 3 && !canCreatePackage)
                }
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Next Step
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSavePackage}
                disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {createPackageMutation.isPending || updatePackageMutation.isPending ? (
                  <>{view === 'edit' ? 'Updating...' : 'Creating...'}</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {view === 'edit' ? 'Update Package' : 'Create Package'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-purple-600" />
            Package & Combo Deals
          </h2>
          <p className="text-muted-foreground mt-1">
            Create attractive package deals by mixing different services together
          </p>
        </div>
        <Button
          onClick={() => {
            resetWizard();
            setView('create');
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {!packages || packages.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
              <Gift className="h-10 w-10 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Packages Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create combo packages by mixing different services (e.g., Haircut + Massage + Manicure) to increase bookings
            </p>
            <Button
              onClick={() => {
                resetWizard();
                setView('create');
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PackageIcon className="h-5 w-5 text-purple-600" />
                      {pkg.name}
                    </CardTitle>
                    {pkg.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {pkg.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge className="bg-green-600 text-white shrink-0">
                    {pkg.discountPercentage}% OFF
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Service Names List */}
                {pkg.services && pkg.services.length > 0 && (
                  <div className="space-y-1">
                    {pkg.services.map((service: any, index: number) => (
                      <div key={service.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="text-gray-700">{service.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {pkg.totalDurationMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {pkg.services?.length || 0} services
                  </span>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-purple-600">
                    {formatCurrency(pkg.packagePriceInPaisa)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(pkg.regularPriceInPaisa)}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditPackage(pkg)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePackageMutation.mutate(pkg.id)}
                    disabled={deletePackageMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
