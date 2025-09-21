import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Clock, Mail } from "lucide-react";

interface LocationContactStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

export default function LocationContactStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: LocationContactStepProps) {
  const [formData, setFormData] = useState({
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

  // Load existing salon data
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  // Populate form with existing data
  useEffect(() => {
    if (salonData && !formData.address) { // Only populate if form is empty
      setFormData({
        address: salonData.address || "",
        city: salonData.city || "",
        state: salonData.state || "",
        zipCode: salonData.zipCode || "", // Drizzle handles mapping from zip_code to zipCode automatically
        phone: salonData.phone || "",
        email: salonData.email || "",
        businessHours: "" // For now, businessHours field is not in database - keep form field but don't load from DB
      });
    }
  }, [salonData]);

  // Update salon mutation
  const updateSalonMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      onComplete(formData);
      toast({
        title: "Location & Contact Saved",
        description: "Your location and contact details have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save location and contact information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address.trim() || !formData.city.trim() || !formData.phone.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the address, city, and phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    await updateSalonMutation.mutateAsync(formData);
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Where can customers find you?</h3>
          <p className="text-muted-foreground">
            Provide your business location and contact information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {isCompleted && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || updateSalonMutation.isPending}
            data-testid="button-save-location"
          >
            {isLoading || updateSalonMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}