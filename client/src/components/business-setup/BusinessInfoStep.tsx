import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building } from "lucide-react";

interface BusinessInfoStepProps {
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

export default function BusinessInfoStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: BusinessInfoStepProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    website: "",
    ...initialData
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing salon data
  const { data: salonData } = useQuery({
    queryKey: ['business-info-salon-data', salonId],
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Populate form with existing data
  useEffect(() => {
    if (salonData) {
      setFormData(prev => ({
        ...prev,
        name: salonData.name || "",
        description: salonData.description || "",
        category: salonData.category || "",
        website: salonData.website || ""
      }));
    }
  }, [salonData]);

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
        title: "Business Information Saved",
        description: "Your business details have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save business information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the business name and category.",
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
        <Building className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Tell us about your business</h3>
          <p className="text-muted-foreground">
            Help customers discover what makes your business special
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            data-testid="button-save-business-info"
          >
            {isLoading || updateSalonMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}