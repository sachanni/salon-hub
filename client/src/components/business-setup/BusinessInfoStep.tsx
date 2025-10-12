import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BusinessInfoStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

const BUSINESS_CATEGORIES = [
  { value: "hair_salon", label: "Hair Salon", icon: "💇", gradient: "from-purple-500 to-pink-500" },
  { value: "nail_salon", label: "Nail Salon", icon: "💅", gradient: "from-pink-500 to-rose-500" },
  { value: "spa", label: "Spa & Wellness", icon: "🧘", gradient: "from-indigo-500 to-purple-500" },
  { value: "beauty_salon", label: "Beauty Salon", icon: "✨", gradient: "from-violet-500 to-purple-500" },
  { value: "barber", label: "Barber Shop", icon: "💈", gradient: "from-slate-600 to-gray-600" },
  { value: "massage", label: "Massage Therapy", icon: "💆", gradient: "from-teal-500 to-cyan-500" },
  { value: "medical_spa", label: "Medical Spa", icon: "🏥", gradient: "from-blue-500 to-indigo-500" },
  { value: "fitness", label: "Fitness & Wellness", icon: "💪", gradient: "from-emerald-500 to-teal-500" },
  { value: "makeup_studio", label: "Makeup Studio", icon: "💄", gradient: "from-fuchsia-500 to-pink-500" }
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
  
  // Parse categories - support both single string and array
  const parseCategories = (categoryData: any): string[] => {
    if (!categoryData) return [];
    if (Array.isArray(categoryData)) return categoryData;
    if (typeof categoryData === 'string') {
      try {
        const parsed = JSON.parse(categoryData);
        return Array.isArray(parsed) ? parsed : [categoryData];
      } catch {
        return [categoryData];
      }
    }
    return [];
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    parseCategories(initialData?.category)
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing salon data
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
    staleTime: 0,
  });

  // Populate form with existing data
  useEffect(() => {
    if (salonData) {
      const salon = salonData as any;
      setFormData((prev: typeof formData) => ({
        ...prev,
        name: salon.name || "",
        description: salon.description || "",
        category: salon.category || "",
        website: salon.website || ""
      }));
      
      // Parse and set categories
      const categories = parseCategories(salon.category);
      setSelectedCategories(categories);
    }
  }, [salonData]);

  // Update salon mutation
  const updateSalonMutation = useMutation({
    mutationFn: async (data: any) => {
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
    
    if (!formData.name.trim() || selectedCategories.length === 0) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in the business name and select at least one category.",
        variant: "destructive",
      });
      return;
    }

    // Store categories as JSON array
    const dataToSend = {
      ...formData,
      category: JSON.stringify(selectedCategories)
    };

    setIsLoading(true);
    await updateSalonMutation.mutateAsync(dataToSend);
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryValue: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryValue)) {
        return prev.filter(c => c !== categoryValue);
      } else {
        return [...prev, categoryValue];
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Building className="h-6 w-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-semibold">Tell us about your business</h3>
          <p className="text-sm text-muted-foreground">
            Help customers discover what makes your business special
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* Business Name */}
          <div>
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

          {/* Business Categories - Multi-Select */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Business Categories * 
              <span className="text-muted-foreground font-normal ml-2">
                (Select all that apply)
              </span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BUSINESS_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.value);
                
                return (
                  <Card
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    className={`relative p-4 cursor-pointer transition-all border-2 ${
                      isSelected
                        ? `border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md`
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Checkmark */}
                    <div className="absolute top-2 right-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                          : 'bg-gray-200'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>

                    <div className="pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                      <h4 className="font-medium text-sm">{category.label}</h4>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {selectedCategories.length > 0 && (
              <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                ✨ {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected - Services will be automatically suggested based on your selection
              </p>
            )}
          </div>

          {/* Business Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Business Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell customers about your business, specialties, and what makes you unique..."
              className="mt-1 min-h-[100px]"
              data-testid="textarea-description"
            />
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
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isLoading || selectedCategories.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="button-save-business-info"
          >
            {isLoading ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
