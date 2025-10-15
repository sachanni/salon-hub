import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building, CheckCircle } from "lucide-react";

interface ProfileStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

const CATEGORIES = [
  { value: "hair_salon", label: "Hair Salon" },
  { value: "nail_salon", label: "Nail Salon" },
  { value: "spa", label: "Spa & Wellness" },
  { value: "beauty_salon", label: "Beauty Salon" },
  { value: "barber", label: "Barber Shop" },
  { value: "massage", label: "Massage Therapy" }
];

export default function ProfileStep({ salonId, onNext, onComplete, onBack, onSkip, isCompleted }: ProfileStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load salon data
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId
  });

  // Populate form with salon data
  useEffect(() => {
    if (salonData) {
      const salon = salonData as any;
      setFormData({
        name: salon.name || "",
        description: salon.description || "",
        category: salon.category || "",
        website: salon.website || "",
        address: salon.address || "",
        city: salon.city || "",
        state: salon.state || "",
        zipCode: salon.zipCode || salon.zip_code || "",
        phone: salon.phone || "",
        email: salon.email || ""
      });
    }
  }, [salonData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
      });
      handleNext();
      toast({
        title: "Profile Saved",
        description: "Your business profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.phone) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in business name, address, and phone number.",
        variant: "destructive",
      });
      return;
    }

    await saveMutation.mutateAsync(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isComplete = formData.name && formData.address && formData.phone;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Building className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Business Profile</h3>
          <p className="text-muted-foreground">
            Tell customers about your business
          </p>
        </div>
        {isComplete && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Complete</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div className="md:col-span-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your business name"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your business and services..."
              className="min-h-[100px]"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>

          {/* City */}
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Your city"
            />
          </div>

          {/* State */}
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="Your state"
            />
          </div>

          {/* Zip Code */}
          <div>
            <Label htmlFor="zipCode">Zip Code</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="12345"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <Label htmlFor="email">Business Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@yourbusiness.com"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}