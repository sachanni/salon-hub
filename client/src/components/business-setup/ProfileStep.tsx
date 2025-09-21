import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building, MapPin, Phone, Clock, Mail } from "lucide-react";

interface ProfileStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

const BUSINESS_CATEGORIES = [
  { value: "hair_salon", label: "Hair Salon" },
  { value: "nail_salon", label: "Nail Salon" },
  { value: "spa", label: "Spa & Wellness" },
  { value: "beauty_salon", label: "Beauty Salon" },
  { value: "barber", label: "Barber Shop" },
  { value: "massage", label: "Massage Therapy" },
  { value: "medical_spa", label: "Medical Spa" },
  { value: "fitness", label: "Fitness & Wellness" },
  { value: "other", label: "Other" }
];

export default function ProfileStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: ProfileStepProps) {
  const [formData, setFormData] = useState({
    // Business Information
    name: "",
    description: "",
    category: "",
    website: "",
    // Location & Contact
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    businessHours: "",
    ...initialData
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing salon data - Use same query key as dashboard with proper caching
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId], // Match dashboard query key
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache - prevent excessive refetching
    refetchOnWindowFocus: false, // Prevent refetch on focus
    refetchOnMount: false, // Don't refetch if we already have data
  });

  // Populate form with existing data - only once when data first loads
  useEffect(() => {
    if (salonData && !formData.name) { // Only populate if form is empty
      const salon = salonData as any;
      setFormData({
        name: salon.name || "",
        description: salon.description || "",
        category: salon.category || "",
        website: salon.website || "",
        address: salon.address || "",
        city: salon.city || "",
        state: salon.state || "",
        zipCode: salon.zipCode || "", // Drizzle handles mapping from zip_code to zipCode automatically
        phone: salon.phone || "",
        email: salon.email || "",
        businessHours: "" // For now, businessHours field is not in database - keep form field but don't load from DB
      });
    }
  }, [salonData]); // Remove formData from dependencies to prevent loops

  // Update salon mutation
  const updateSalonMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      onComplete(formData);
      toast({
        title: "Profile Saved Successfully",
        description: "Your business profile has been updated and you can now proceed to the next step.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      { field: 'name', label: 'Business Name' },
      { field: 'category', label: 'Business Category' },
      { field: 'address', label: 'Street Address' },
      { field: 'city', label: 'City' },
      { field: 'phone', label: 'Business Phone' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !formData[field as keyof typeof formData]?.trim());
    
    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await updateSalonMutation.mutateAsync(formData);
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Information Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Building className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Business Information</h3>
              <p className="text-muted-foreground">
                Help customers discover what makes your business special
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div className="md:col-span-2">
              <Label htmlFor="business-name" className="text-sm font-medium">
                Business Name *
              </Label>
              <Input
                id="business-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your business name"
                className="mt-1"
                data-testid="input-business-name"
                required
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Business Category *
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="mt-1" data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website" className="text-sm font-medium">
                Website (Optional)
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.yourbusiness.com"
                className="mt-1"
                data-testid="input-website"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Business Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your business, services, and what makes you unique..."
                className="mt-1 min-h-[120px]"
                data-testid="textarea-description"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Tell potential customers about your business, specialties, and unique offerings.
              </p>
            </div>
          </div>
        </div>

        {/* Location & Contact Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <MapPin className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Location & Contact</h3>
              <p className="text-muted-foreground">
                Where can customers find you and get in touch?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="md:col-span-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Street Address *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street"
                className="mt-1"
                data-testid="input-address"
                required
              />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city" className="text-sm font-medium">
                City *
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Your city"
                className="mt-1"
                data-testid="input-city"
                required
              />
            </div>

            {/* State */}
            <div>
              <Label htmlFor="state" className="text-sm font-medium">
                State/Province
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Your state"
                className="mt-1"
                data-testid="input-state"
              />
            </div>

            {/* ZIP Code */}
            <div>
              <Label htmlFor="zipCode" className="text-sm font-medium">
                ZIP/Postal Code
              </Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="12345"
                className="mt-1"
                data-testid="input-zip"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Business Phone *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-1"
                data-testid="input-phone"
                required
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Business Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="info@yourbusiness.com"
                className="mt-1"
                data-testid="input-email"
              />
            </div>

            {/* Business Hours */}
            <div className="md:col-span-2">
              <Label htmlFor="businessHours" className="text-sm font-medium">
                Business Hours
              </Label>
              <Textarea
                id="businessHours"
                value={formData.businessHours}
                onChange={(e) => handleInputChange('businessHours', e.target.value)}
                placeholder="Mon-Fri: 9:00 AM - 7:00 PM&#10;Saturday: 9:00 AM - 5:00 PM&#10;Sunday: Closed"
                className="mt-1 min-h-[100px]"
                data-testid="textarea-hours"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Let customers know when you're open for business.
              </p>
            </div>
          </div>
        </div>

        {/* Single Submit Button */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {isCompleted && (
              <span className="text-green-600 font-medium">✓ Profile Completed</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || updateSalonMutation.isPending}
            data-testid="button-save-profile"
            size="lg"
          >
            {isLoading || updateSalonMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}