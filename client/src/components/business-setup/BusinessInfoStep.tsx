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
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

const BUSINESS_CATEGORIES = [
  { 
    value: "hair_salon", 
    label: "Hair Salon", 
    description: "Cuts, styling, coloring & treatments",
    image: "/assets/categories/Hair_Salon_interior_design_7ee2ce15.png",
    gradient: "from-purple-500 to-pink-500",
    autoDescription: "Welcome to our professional hair salon! We specialize in expert haircuts, creative styling, vibrant coloring, and transformative hair treatments. Our skilled stylists stay current with the latest trends and techniques to help you achieve your perfect look. Whether you're looking for a bold new style or a classic refresh, we're here to bring your hair goals to life."
  },
  { 
    value: "nail_salon", 
    label: "Nail Salon", 
    description: "Manicures, pedicures & nail art",
    image: "/assets/categories/Nail_Salon_workspace_70f03ece.png",
    gradient: "from-pink-500 to-rose-500",
    autoDescription: "Discover premium nail care at our salon! We offer luxurious manicures, relaxing pedicures, and stunning nail art designs. Using high-quality products and the latest techniques, our nail technicians create beautiful, long-lasting results. From classic elegance to creative designs, we'll pamper your hands and feet to perfection."
  },
  { 
    value: "spa", 
    label: "Spa & Wellness", 
    description: "Relaxation, body treatments & spa",
    image: "/assets/categories/Spa_and_Wellness_center_0507eeab.png",
    gradient: "from-indigo-500 to-purple-500",
    autoDescription: "Experience ultimate relaxation at our spa & wellness center. We provide rejuvenating body treatments, therapeutic massages, and holistic wellness services in a tranquil environment. Our expert therapists use premium products and time-tested techniques to restore your mind, body, and spirit. Escape the stress of daily life and indulge in pure relaxation."
  },
  { 
    value: "beauty_salon", 
    label: "Beauty Salon", 
    description: "Full-service beauty treatments",
    image: "/assets/categories/Beauty_Salon_interior_c34027b1.png",
    gradient: "from-violet-500 to-purple-500",
    autoDescription: "Your one-stop destination for complete beauty care! We offer a comprehensive range of beauty services including skincare, makeup, hair styling, and grooming. Our talented beauty professionals are dedicated to enhancing your natural beauty and helping you look and feel your absolute best for any occasion."
  },
  { 
    value: "barber", 
    label: "Barber Shop", 
    description: "Men's haircuts, shaves & grooming",
    image: "/assets/categories/Barber_Shop_interior_ab1e8eed.png",
    gradient: "from-slate-600 to-gray-600",
    autoDescription: "Experience traditional barbering excellence! We specialize in precision haircuts, classic straight-razor shaves, beard trimming, and complete men's grooming services. Our skilled barbers combine timeless techniques with modern styles to deliver the sharp, confident look you deserve."
  },
  { 
    value: "massage", 
    label: "Massage Therapy", 
    description: "Therapeutic massage & bodywork",
    image: "/assets/categories/Massage_Therapy_room_f456670d.png",
    gradient: "from-teal-500 to-cyan-500",
    autoDescription: "Find relief and relaxation through our professional massage therapy services. We offer a variety of therapeutic massage techniques and bodywork treatments designed to reduce stress, ease muscle tension, and promote overall wellness. Our certified massage therapists customize each session to address your specific needs and help you achieve optimal well-being."
  },
  { 
    value: "medical_spa", 
    label: "Medical Spa", 
    description: "Advanced aesthetic treatments",
    image: "/assets/categories/Medical_Spa_treatment_room_20b662eb.png",
    gradient: "from-blue-500 to-indigo-500",
    autoDescription: "Advanced aesthetic treatments in a clinical setting. Our medical spa combines medical expertise with spa luxury to deliver cutting-edge skincare treatments, anti-aging procedures, and non-invasive cosmetic enhancements. Led by licensed medical professionals, we use state-of-the-art technology to help you achieve your aesthetic goals safely and effectively."
  },
  { 
    value: "fitness", 
    label: "Fitness & Wellness", 
    description: "Yoga, fitness classes & wellness",
    image: "/assets/categories/Fitness_and_Wellness_studio_55aa1c7c.png",
    gradient: "from-emerald-500 to-teal-500",
    autoDescription: "Transform your health at our fitness & wellness studio! We offer dynamic fitness classes, rejuvenating yoga sessions, and personalized wellness programs designed to strengthen your body and energize your mind. Our expert instructors create an encouraging environment where everyone can achieve their fitness goals."
  },
  { 
    value: "makeup_studio", 
    label: "Makeup Studio", 
    description: "Professional makeup & styling",
    image: "/assets/categories/Makeup_Studio_workspace_d6349cde.png",
    gradient: "from-fuchsia-500 to-pink-500",
    autoDescription: "Professional makeup artistry for every occasion! Whether you need bridal makeup, special event styling, or everyday beauty looks, our talented makeup artists bring creativity and precision to every application. We use premium cosmetics and the latest techniques to create flawless, camera-ready results that enhance your natural beauty."
  },
  { 
    value: "piercing_studio", 
    label: "Piercing Studio", 
    description: "Professional body piercing",
    image: "/assets/categories/Piercing_Studio_interior_36cf6e8d.png",
    gradient: "from-amber-500 to-orange-500",
    autoDescription: "Safe, professional body piercing services in a clean, sterile environment. Our experienced piercers use only the highest quality jewelry and follow strict health and safety protocols. From classic ear piercings to more unique placements, we provide expert guidance and meticulous care throughout your piercing experience."
  },
  { 
    value: "tattoo_studio", 
    label: "Tattoo Studio", 
    description: "Custom tattoo art & designs",
    image: "/assets/categories/Tattoo_Studio_interior_77107fd7.png",
    gradient: "from-slate-700 to-zinc-700",
    autoDescription: "Custom tattoo artistry and designs created by talented artists. We specialize in bringing your vision to life with unique, high-quality tattoos in various styles. Our artists work closely with you to create meaningful, beautifully executed body art in a clean, professional studio environment. From intricate details to bold statements, we deliver exceptional results."
  }
];

// Smart description generator based on selected categories
const generateAutoDescription = (selectedCategories: string[]): string => {
  if (selectedCategories.length === 0) return "";
  
  if (selectedCategories.length === 1) {
    const category = BUSINESS_CATEGORIES.find(c => c.value === selectedCategories[0]);
    return category?.autoDescription || "";
  }
  
  // Multi-category descriptions
  const categoryLabels = selectedCategories
    .map(value => BUSINESS_CATEGORIES.find(c => c.value === value)?.label)
    .filter(Boolean);
  
  const services = selectedCategories.map(value => {
    const cat = BUSINESS_CATEGORIES.find(c => c.value === value);
    return cat?.description;
  }).filter(Boolean);
  
  // Create cohesive multi-service description
  return `Welcome to our full-service beauty and wellness destination! We specialize in ${categoryLabels.join(', ')}, offering ${services.join(', ')} all under one roof. Our talented team of professionals is dedicated to providing exceptional service and helping you look and feel your absolute best. Whether you're visiting for a single service or a complete transformation, we're here to exceed your expectations with quality care and attention to detail.`;
};

export default function BusinessInfoStep({ 
  salonId, 
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: BusinessInfoStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    website: ""
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

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasManuallyEditedDescription, setHasManuallyEditedDescription] = useState(false);
  
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
      
      // If salon already has a description, mark as manually edited to preserve it
      if (salon.description && salon.description.trim()) {
        setHasManuallyEditedDescription(true);
      }
    }
  }, [salonData]);

  // Auto-fill description when categories change (only if not manually edited)
  useEffect(() => {
    if (selectedCategories.length > 0 && !hasManuallyEditedDescription) {
      const autoDescription = generateAutoDescription(selectedCategories);
      setFormData((prev: typeof formData) => ({
        ...prev,
        description: autoDescription
      }));
    }
  }, [selectedCategories, hasManuallyEditedDescription]);

  // Update salon mutation
  const updateSalonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/salons/${salonId}`, data);
      return response.json();
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
    try {
      await updateSalonMutation.mutateAsync(dataToSend);
      
      // Invalidate both salon data and completion status
      await queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
      });
      
      toast({
        title: "Business Information Saved",
        description: "Your business details have been updated successfully.",
      });
      
      // Call handleNext after successful save
      handleNext();
    } catch (error) {
      console.error('Error saving business info:', error);
      toast({
        title: "Error",
        description: `Failed to save business information: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
    
    // Track manual edits to description
    if (field === 'description') {
      setHasManuallyEditedDescription(true);
    }
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
            <Label className="text-sm font-medium mb-4 block">
              Business Categories * 
              <span className="text-muted-foreground font-normal ml-2">
                (Select all that apply)
              </span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
              {BUSINESS_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.value);
                
                return (
                  <Card
                    key={category.value}
                    onClick={() => toggleCategory(category.value)}
                    className={`group relative overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                      isSelected
                        ? 'border-purple-500 shadow-xl ring-2 ring-purple-300 ring-opacity-50'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
                    }`}
                    data-testid={`card-category-${category.value}`}
                  >
                    {/* Background Image with Overlay */}
                    <div className="relative h-40">
                      <img 
                        src={category.image} 
                        alt={category.label}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient} opacity-40 group-hover:opacity-50 transition-opacity duration-300`}></div>
                      
                      {/* Checkmark */}
                      <div className="absolute top-3 right-3 z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? 'bg-white shadow-lg scale-110' 
                            : 'bg-white/80 backdrop-blur-sm'
                        }`}>
                          {isSelected ? (
                            <Check className="h-5 w-5 text-purple-600 stroke-[3]" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                          )}
                        </div>
                      </div>

                      {/* Category Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                        <h4 className="font-semibold text-white text-base mb-1 drop-shadow-lg">
                          {category.label}
                        </h4>
                        <p className="text-white/90 text-xs leading-relaxed drop-shadow-md">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {selectedCategories.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700 flex items-center gap-2">
                  <Check className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">
                    {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'} selected
                  </span>
                  <span className="text-purple-600">•</span>
                  <span className="text-purple-600">Services will be automatically suggested based on your selection</span>
                </p>
              </div>
            )}
          </div>

          {/* Business Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Business Description
              {selectedCategories.length > 0 && !hasManuallyEditedDescription && (
                <span className="ml-2 text-xs text-purple-600 font-normal">
                  ✨ Auto-generated (you can edit this)
                </span>
              )}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell customers about your business, specialties, and what makes you unique..."
              className="mt-1 min-h-[120px]"
              data-testid="textarea-description"
            />
            {selectedCategories.length > 0 && !hasManuallyEditedDescription && (
              <p className="mt-2 text-xs text-muted-foreground">
                💡 We've created a professional description based on your selected categories. Feel free to customize it to match your unique style!
              </p>
            )}
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
