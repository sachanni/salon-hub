import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Scissors, Plus, Trash2, Edit, Sparkles, Clock, IndianRupee, Check, X, ChevronRight, Package, Brain } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getRelevantServiceCategories, getSmartServiceSuggestions } from "@/lib/serviceCategoryMapping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface ServicesStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

interface Service {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  imageUrl?: string;
}

// Service category definitions with target audience metadata
const mainCategories = [
  { id: 'hair', name: 'Hair & Styling', icon: '💇', gradient: 'from-purple-500 to-pink-500', targetAudiences: ['men', 'women'] },
  { id: 'nails', name: 'Nails', icon: '💅', gradient: 'from-pink-500 to-rose-500', targetAudiences: ['women'] },
  { id: 'skincare', name: 'Skincare & Facials', icon: '✨', gradient: 'from-violet-500 to-purple-500', targetAudiences: ['women'] },
  { id: 'massage', name: 'Massage & Spa', icon: '💆', gradient: 'from-indigo-500 to-purple-500', targetAudiences: ['men', 'women'] },
  { id: 'eyes', name: 'Eyebrows & Lashes', icon: '👁️', gradient: 'from-fuchsia-500 to-pink-500', targetAudiences: ['women'] },
  { id: 'hair-removal', name: 'Hair Removal', icon: '🪶', gradient: 'from-rose-500 to-pink-500', targetAudiences: ['women'] },
  { id: 'piercing', name: 'Piercing', icon: '💎', gradient: 'from-amber-500 to-orange-500', targetAudiences: ['men', 'women'] },
  { id: 'tattoo', name: 'Tattoo', icon: '🎨', gradient: 'from-slate-700 to-gray-800', targetAudiences: ['men', 'women'] },
  { id: 'makeup', name: 'Makeup', icon: '💄', gradient: 'from-pink-500 to-fuchsia-500', targetAudiences: ['women'] },
  { id: 'body', name: 'Body Treatments', icon: '🧖', gradient: 'from-purple-500 to-violet-500', targetAudiences: ['men', 'women'] },
  { id: 'mens', name: "Men's Grooming", icon: '💈', gradient: 'from-slate-600 to-gray-600', targetAudiences: ['men'] },
  { id: 'wellness', name: 'Wellness & Other', icon: '🧘‍♀️', gradient: 'from-emerald-500 to-teal-500', targetAudiences: ['men', 'women'] },
];

const subServices: Record<string, { name: string; icon: string }[]> = {
  hair: [
    { name: 'Haircut & Styling', icon: '✂️' },
    { name: 'Hair Coloring', icon: '🎨' },
    { name: 'Hair Treatment & Spa', icon: '💆' },
    { name: 'Balayage & Highlights', icon: '🌈' },
    { name: 'Keratin Treatment', icon: '✨' },
    { name: 'Hair Extensions', icon: '💁' },
    { name: 'Hair Patch', icon: '🩹' },
    { name: 'Hair Weaving', icon: '🧵' },
    { name: 'Hair Bonding', icon: '🔗' },
  ],
  nails: [
    { name: 'Manicure', icon: '🤲' },
    { name: 'Pedicure', icon: '🦶' },
    { name: 'Nail Art & Design', icon: '💎' },
    { name: 'Gel Nails', icon: '💅' },
    { name: 'Acrylic Nails', icon: '✨' },
    { name: 'Nail Extensions', icon: '💎' },
  ],
  skincare: [
    { name: 'Classic Facial', icon: '✨' },
    { name: 'Anti-Aging Treatment', icon: '🌟' },
    { name: 'Acne Treatment', icon: '🧴' },
    { name: 'HydraFacial', icon: '💧' },
    { name: 'Cleanup & Bleach', icon: '🧼' },
    { name: 'Chemical Peel', icon: '🍋' },
  ],
  massage: [
    { name: 'Full Body Massage', icon: '🧘' },
    { name: 'Aromatherapy', icon: '🌸' },
    { name: 'Deep Tissue Massage', icon: '💪' },
    { name: 'Thai Massage', icon: '🙏' },
    { name: 'Hot Stone Massage', icon: '🔥' },
    { name: 'Spa Packages', icon: '🛁' },
  ],
  eyes: [
    { name: 'Eyebrow Shaping', icon: '👁️' },
    { name: 'Threading', icon: '🧵' },
    { name: 'Eyelash Extensions', icon: '👀' },
    { name: 'Lash Lift & Tint', icon: '🌙' },
    { name: 'Eyebrow Tinting', icon: '🎨' },
    { name: 'Microblading', icon: '✏️' },
  ],
  'hair-removal': [
    { name: 'Waxing', icon: '🪶' },
    { name: 'Laser Hair Removal', icon: '⚡' },
    { name: 'Full Body Waxing', icon: '✨' },
    { name: 'Bikini Wax', icon: '👙' },
    { name: 'Brazilian Wax', icon: '💫' },
  ],
  piercing: [
    { name: 'Ear Piercing', icon: '👂' },
    { name: 'Nose Piercing', icon: '👃' },
    { name: 'Belly Piercing', icon: '💫' },
    { name: 'Lip Piercing', icon: '💋' },
    { name: 'Eyebrow Piercing', icon: '👁️' },
    { name: 'Cartilage Piercing', icon: '✨' },
  ],
  tattoo: [
    { name: 'Small Tattoo', icon: '✨' },
    { name: 'Medium Tattoo', icon: '🎨' },
    { name: 'Large Tattoo', icon: '🖼️' },
    { name: 'Cover-up Tattoo', icon: '🔄' },
    { name: 'Tattoo Removal', icon: '🔥' },
    { name: 'Permanent Makeup Tattoo', icon: '💄' },
    { name: 'Henna/Mehndi Tattoo', icon: '🌿' },
  ],
  makeup: [
    { name: 'Bridal Makeup', icon: '👰' },
    { name: 'Party Makeup', icon: '🎉' },
    { name: 'HD Makeup', icon: '📸' },
    { name: 'Airbrush Makeup', icon: '💨' },
    { name: 'Natural Makeup', icon: '🌸' },
    { name: 'Daily Light Makeup', icon: '☀️' },
  ],
  body: [
    { name: 'Body Scrub & Polishing', icon: '🧖' },
    { name: 'Body Wrap', icon: '🌿' },
    { name: 'Tan Removal', icon: '☀️' },
    { name: 'Body Polishing', icon: '✨' },
  ],
  mens: [
    { name: "Men's Haircut", icon: '💈' },
    { name: 'Beard Trim & Styling', icon: '🧔' },
    { name: "Men's Facial", icon: '👨' },
    { name: "Men's Grooming Package", icon: '🎩' },
  ],
  wellness: [
    { name: 'Reflexology', icon: '🦶' },
    { name: 'Wellness Therapy', icon: '🧘‍♀️' },
    { name: 'Beauty Consultation', icon: '💬' },
  ],
};

// Smart price and duration suggestions by service type
const serviceSuggestions: Record<string, { duration: number; price: number; description: string }> = {
  // Hair & styling
  'Haircut & Styling': { duration: 45, price: 500, description: 'Professional haircut with styling' },
  'Hair Coloring': { duration: 120, price: 2500, description: 'Full hair coloring service' },
  'Hair Treatment & Spa': { duration: 60, price: 1500, description: 'Deep conditioning hair treatment' },
  'Balayage & Highlights': { duration: 150, price: 4000, description: 'Balayage or highlights color treatment' },
  'Keratin Treatment': { duration: 120, price: 3500, description: 'Keratin smoothing treatment' },
  'Hair Extensions': { duration: 120, price: 5000, description: 'Hair extension application' },
  'Hair Patch': { duration: 90, price: 3000, description: 'Hair patch application for baldness' },
  'Hair Weaving': { duration: 120, price: 4500, description: 'Hair weaving for volume and coverage' },
  'Hair Bonding': { duration: 90, price: 4000, description: 'Hair bonding with adhesive' },
  
  // Nails
  'Manicure': { duration: 30, price: 400, description: 'Classic manicure with polish' },
  'Pedicure': { duration: 45, price: 600, description: 'Relaxing pedicure with foot massage' },
  'Nail Art & Design': { duration: 45, price: 800, description: 'Custom nail art and design' },
  'Gel Nails': { duration: 60, price: 1000, description: 'Gel nail application' },
  'Acrylic Nails': { duration: 90, price: 1500, description: 'Acrylic nail extensions' },
  'Nail Extensions': { duration: 90, price: 1200, description: 'Professional nail extensions' },
  
  // Skincare & Facials
  'Classic Facial': { duration: 60, price: 1200, description: 'Deep cleansing facial treatment' },
  'Anti-Aging Treatment': { duration: 75, price: 2500, description: 'Anti-aging facial therapy' },
  'Acne Treatment': { duration: 60, price: 1500, description: 'Specialized acne treatment' },
  'HydraFacial': { duration: 60, price: 3000, description: 'HydraFacial deep cleansing' },
  'Cleanup & Bleach': { duration: 45, price: 800, description: 'Facial cleanup and bleach' },
  'Chemical Peel': { duration: 60, price: 2000, description: 'Chemical peel treatment' },
  
  // Massage & Spa
  'Full Body Massage': { duration: 60, price: 1800, description: 'Relaxing full body massage' },
  'Aromatherapy': { duration: 60, price: 2000, description: 'Aromatherapy massage session' },
  'Deep Tissue Massage': { duration: 75, price: 2200, description: 'Deep tissue therapeutic massage' },
  'Thai Massage': { duration: 90, price: 2500, description: 'Traditional Thai massage' },
  'Hot Stone Massage': { duration: 90, price: 2800, description: 'Hot stone therapy massage' },
  'Spa Packages': { duration: 120, price: 4000, description: 'Complete spa package' },
  
  // Eyebrows & Lashes
  'Eyebrow Shaping': { duration: 20, price: 200, description: 'Eyebrow shaping and grooming' },
  'Threading': { duration: 15, price: 150, description: 'Eyebrow threading and shaping' },
  'Eyelash Extensions': { duration: 90, price: 2500, description: 'Eyelash extension application' },
  'Lash Lift & Tint': { duration: 45, price: 1200, description: 'Lash lift and tinting' },
  'Eyebrow Tinting': { duration: 20, price: 300, description: 'Eyebrow tinting service' },
  'Microblading': { duration: 120, price: 8000, description: 'Microblading eyebrow treatment' },
  
  // Hair Removal
  'Waxing': { duration: 30, price: 400, description: 'Professional waxing service' },
  'Laser Hair Removal': { duration: 30, price: 1500, description: 'Laser hair removal session' },
  'Full Body Waxing': { duration: 90, price: 2500, description: 'Full body waxing service' },
  'Bikini Wax': { duration: 30, price: 800, description: 'Bikini waxing service' },
  'Brazilian Wax': { duration: 45, price: 1200, description: 'Brazilian wax service' },
  
  // Piercing
  'Ear Piercing': { duration: 15, price: 500, description: 'Professional ear piercing with sterile equipment' },
  'Nose Piercing': { duration: 15, price: 800, description: 'Nose piercing with quality jewelry' },
  'Belly Piercing': { duration: 20, price: 1200, description: 'Belly button piercing service' },
  'Lip Piercing': { duration: 20, price: 1000, description: 'Lip piercing with aftercare guidance' },
  'Eyebrow Piercing': { duration: 15, price: 900, description: 'Eyebrow piercing service' },
  'Cartilage Piercing': { duration: 20, price: 1000, description: 'Cartilage piercing with premium jewelry' },
  
  // Tattoo
  'Small Tattoo': { duration: 60, price: 2500, description: 'Small custom tattoo design (up to 2 inches)' },
  'Medium Tattoo': { duration: 120, price: 5000, description: 'Medium sized tattoo design (2-5 inches)' },
  'Large Tattoo': { duration: 180, price: 10000, description: 'Large tattoo design (5+ inches)' },
  'Cover-up Tattoo': { duration: 150, price: 7500, description: 'Cover existing tattoo with new design' },
  'Tattoo Removal': { duration: 45, price: 3500, description: 'Laser tattoo removal session' },
  'Permanent Makeup Tattoo': { duration: 120, price: 8000, description: 'Permanent makeup (eyebrows, eyeliner, lips)' },
  'Henna/Mehndi Tattoo': { duration: 60, price: 800, description: 'Traditional henna/mehndi art' },
  
  // Makeup
  'Bridal Makeup': { duration: 120, price: 8000, description: 'Complete bridal makeup package' },
  'Party Makeup': { duration: 60, price: 3000, description: 'Party and event makeup' },
  'HD Makeup': { duration: 75, price: 4000, description: 'HD makeup for photography' },
  'Airbrush Makeup': { duration: 60, price: 4500, description: 'Airbrush makeup application' },
  'Natural Makeup': { duration: 45, price: 2000, description: 'Natural everyday makeup' },
  'Daily Light Makeup': { duration: 30, price: 1200, description: 'Light makeup for office or casual events' },
  
  // Body Treatments
  'Body Scrub & Polishing': { duration: 60, price: 1500, description: 'Full body scrub and polishing' },
  'Body Wrap': { duration: 75, price: 2000, description: 'Therapeutic body wrap' },
  'Tan Removal': { duration: 60, price: 1800, description: 'Tan removal treatment' },
  'Body Polishing': { duration: 60, price: 1500, description: 'Body polishing service' },
  
  // Men's Grooming
  "Men's Haircut": { duration: 30, price: 300, description: 'Professional men\'s haircut' },
  'Beard Trim & Styling': { duration: 20, price: 250, description: 'Beard trimming and styling' },
  "Men's Facial": { duration: 45, price: 1000, description: 'Men\'s facial treatment' },
  "Men's Grooming Package": { duration: 60, price: 1500, description: 'Complete men\'s grooming package' },
  
  // Wellness & Other
  'Reflexology': { duration: 45, price: 1200, description: 'Reflexology therapy session' },
  'Wellness Therapy': { duration: 60, price: 1500, description: 'Wellness therapy treatment' },
  'Beauty Consultation': { duration: 30, price: 500, description: 'Professional beauty consultation' },
};

// Business type templates for quick setup
const businessTemplates = {
  'hair-salon': ['Haircut & Styling', 'Hair Coloring', 'Balayage & Highlights', 'Keratin Treatment'],
  'spa': ['Full Body Massage', 'Aromatherapy', 'Classic Facial', 'Body Scrub & Polishing'],
  'nail-studio': ['Manicure', 'Pedicure', 'Gel Nails', 'Nail Art & Design'],
  'beauty-parlour': ['Threading', 'Waxing', 'Cleanup & Bleach', 'Bridal Makeup'],
};

export default function ServicesStep({ 
  salonId, 
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: ServicesStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('hair');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showBulkReview, setShowBulkReview] = useState(false);
  const [bulkServices, setBulkServices] = useState<Service[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get business category from authenticated user (fallback to 'unisex' if not set)
  const businessCategory = user?.businessCategory || 'unisex';
  
  // Determine which target audiences to show based on business category
  const getVisibleAudiences = (category: string): string[] => {
    switch (category) {
      case 'beauty_parlour':
        return ['women'];
      case 'mens_parlour':
        return ['men'];
      case 'unisex':
      default:
        return ['men', 'women'];
    }
  };
  
  const visibleAudiences = getVisibleAudiences(businessCategory);
  
  // Filter categories based on target audience
  const filterCategoriesByAudience = (categories: typeof mainCategories) => {
    return categories.filter(cat => 
      cat.targetAudiences.some(audience => visibleAudiences.includes(audience))
    );
  };
  
  // Get filtered categories
  const audienceFilteredCategories = filterCategoriesByAudience(mainCategories);
  
  // Ref for bulk review section to enable auto-scroll
  const bulkReviewRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bulk review when it opens
  useEffect(() => {
    if (showBulkReview && bulkReviewRef.current) {
      bulkReviewRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [showBulkReview]);

  // Load salon data to get business categories
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  // Parse business categories and get relevant service categories
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

  const businessCategories = parseCategories((salonData as any)?.category);
  const relevantServiceCategories = getRelevantServiceCategories(businessCategories);
  const smartSuggestions = getSmartServiceSuggestions(businessCategories);

  // Helper to get human-readable business category names
  const getBusinessCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'hair_salon': 'Hair Salon',
      'nail_salon': 'Nail Salon',
      'spa': 'Spa & Wellness',
      'beauty_salon': 'Beauty Salon',
      'barber': 'Barber Shop',
      'massage': 'Massage Therapy',
      'medical_spa': 'Medical Spa',
      'fitness': 'Fitness',
      'makeup_studio': 'Makeup Studio',
      'tattoo_studio': 'Tattoo Studio'
    };
    return labels[category] || category;
  };

  const businessCategoryLabels = businessCategories.map(cat => getBusinessCategoryLabel(cat));

  // Apply audience filtering first, then relevance filtering
  // If user wants to see all categories, show all audience-filtered categories
  const displayedCategories = showAllCategories 
    ? audienceFilteredCategories 
    : audienceFilteredCategories.filter(cat => relevantServiceCategories.includes(cat.id));
  
  // Count how many categories were filtered out
  const filteredOutCount = mainCategories.length - audienceFilteredCategories.length;
  
  // Get category label for banner
  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'beauty_parlour':
        return "Beauty Parlour (Women's Services)";
      case 'mens_parlour':
        return "Men's Parlour (Men's Services)";
      case 'unisex':
      default:
        return 'Unisex Salon (All Services)';
    }
  };

  // Load existing services
  const { data: existingServices } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 0,
  });

  // Update local services state when query data changes
  useEffect(() => {
    if (existingServices && Array.isArray(existingServices)) {
      const convertedServices = existingServices.map((service: any) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        duration: service.durationMinutes,
        price: service.priceInPaisa / 100,
        category: service.category
      }));
      setServices(convertedServices);
    }
  }, [existingServices]);

  // Add service mutation
  const addServiceMutation = useMutation({
    mutationFn: async (service: Service) => {
      const serviceData = {
        name: service.name,
        description: service.description,
        durationMinutes: service.duration,
        priceInPaisa: Math.round(service.price * 100),
        currency: 'INR',
        category: service.category,
        isActive: 1
      };
      const response = await apiRequest('POST', `/api/salons/${salonId}/services`, serviceData);
      return response.json();
    },
    onSuccess: (data) => {
      const frontendService = {
        id: data.id,
        name: data.name,
        description: data.description,
        duration: data.durationMinutes,
        price: data.priceInPaisa / 100,
        category: data.category
      };
      setServices(prev => [...prev, frontendService]);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (service: Service) => {
      if (!service.id) throw new Error('Service ID required for update');
      
      const serviceData = {
        name: service.name,
        description: service.description,
        durationMinutes: service.duration,
        priceInPaisa: Math.round(service.price * 100),
        currency: 'INR',
        category: service.category,
        isActive: 1
      };
      const response = await apiRequest('PUT', `/api/salons/${salonId}/services/${service.id}`, serviceData);
      return response.json();
    },
    onSuccess: (data) => {
      const frontendService = {
        id: data.id,
        name: data.name,
        description: data.description,
        duration: data.durationMinutes,
        price: data.priceInPaisa / 100,
        category: data.category
      };
      setServices(prev => prev.map(s => s.id === data.id ? frontendService : s));
      setEditingService(null);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Service Updated!",
        description: `${data.name} has been updated successfully.`,
      });
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const response = await apiRequest('DELETE', `/api/salons/${salonId}/services/${serviceId}`);
      return response.json();
    },
    onSuccess: (_, serviceId) => {
      const removedService = services.find(s => s.id === serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Service Removed",
        description: `${removedService?.name || 'Service'} has been removed.`,
      });
    }
  });

  // Toggle service selection
  const toggleServiceSelection = (serviceName: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceName)) {
        newSet.delete(serviceName);
      } else {
        newSet.add(serviceName);
      }
      return newSet;
    });
  };

  // Handle bulk add services
  const handleBulkAdd = () => {
    const newServices: Service[] = Array.from(selectedServices).map(serviceName => {
      const suggestion = serviceSuggestions[serviceName];
      return {
        name: serviceName,
        description: suggestion?.description || `Professional ${serviceName.toLowerCase()} service`,
        duration: suggestion?.duration || 60,
        price: suggestion?.price || 0,
        category: serviceName
      };
    });
    
    setBulkServices(newServices);
    setShowBulkReview(true);
  };

  // Save all bulk services (using bulk endpoint for maximum performance)
  const handleSaveBulkServices = async () => {
    try {
      // Transform frontend format to API format
      const servicesForApi = bulkServices.map(service => ({
        name: service.name,
        description: service.description,
        durationMinutes: service.duration,
        priceInPaisa: Math.round(service.price * 100),
        currency: 'INR',
        category: service.category,
        isActive: 1
      }));
      
      // Use bulk endpoint to create all services in a single request
      await apiRequest('POST', `/api/salons/${salonId}/services/bulk`, servicesForApi);
      
      // Invalidate query cache to refresh the services list
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      
      toast({
        title: "Services Added Successfully!",
        description: `${bulkServices.length} services have been added to your salon.`,
      });
      
      setSelectedServices(new Set());
      setBulkServices([]);
      setShowBulkReview(false);
    } catch (error) {
      toast({
        title: "Error Adding Services",
        description: "Some services failed to add. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Quick add template
  const handleQuickTemplate = (template: string) => {
    const serviceNames = businessTemplates[template as keyof typeof businessTemplates] || [];
    setSelectedServices(new Set(serviceNames));
    toast({
      title: "Template Applied!",
      description: `${serviceNames.length} services selected. Review and add them.`,
    });
  };

  const handleContinue = async () => {
    if (services.length === 0) {
      toast({
        title: "No Services Added",
        description: "Please add at least one service to continue.",
        variant: "destructive",
      });
      return;
    }

    // Invalidate completion status cache
    await queryClient.invalidateQueries({ 
      queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
    });
    
    handleNext();
  };

  const currentSubServices = subServices[selectedCategory] || [];
  const categoryInfo = mainCategories.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      {!showBulkReview && (
        <div className="flex items-center gap-3">
          <Scissors className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold">What services do you offer?</h3>
            <p className="text-sm text-muted-foreground">
              Select multiple services quickly, then customize prices & durations
            </p>
          </div>
        </div>
      )}

      {/* Intelligent Filtering Banner */}
      {!showBulkReview && filteredOutCount > 0 && (
        <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <Info className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-sm">
            <span className="font-medium text-purple-900">Smart Service Filtering Active:</span>{' '}
            Showing services tailored for <strong>{getCategoryLabel(businessCategory)}</strong>.
            {businessCategory === 'unisex' && filteredOutCount === 0 && (
              <span className="ml-1">All services are available for your salon type.</span>
            )}
            {businessCategory !== 'unisex' && (
              <span className="ml-1">
                {filteredOutCount} category{filteredOutCount > 1 ? 'ies' : 'y'} filtered out to match your business type.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Intelligent Suggestions Based on Business Category */}
      {!showBulkReview && services.length === 0 && smartSuggestions.length > 0 && (
        <Card className="bg-gradient-to-br from-violet-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Smart Suggestions for Your Business</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Based on your business categories, we recommend these popular services
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {smartSuggestions.slice(0, 8).map((serviceName) => {
                const suggestion = serviceSuggestions[serviceName];
                if (!suggestion) return null;
                
                return (
                  <Button
                    key={serviceName}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSet = new Set(selectedServices);
                      newSet.add(serviceName);
                      setSelectedServices(newSet);
                    }}
                    className="h-auto py-2 px-3 flex flex-col items-start bg-white hover:bg-purple-50 text-left"
                  >
                    <div className="font-medium text-xs">{serviceName}</div>
                    <div className="text-xs text-gray-500">
                      ₹{suggestion.price} • {suggestion.duration}min
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-Select Service Browser */}
      {!showBulkReview && (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Browse & Select Services</CardTitle>
            {selectedServices.size > 0 && (
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                {selectedServices.size} Selected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Pills with Intelligent Filtering */}
          <div className="space-y-3">
            {businessCategories.length > 0 && !showAllCategories && (
              <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1">
                    <Brain className="h-4 w-4 mr-1.5" />
                    Recommended for your business
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Based on your selection of {businessCategoryLabels.length > 0 && (
                    <>
                      {businessCategoryLabels.map((label, index) => (
                        <span key={index}>
                          {index > 0 && (index === businessCategoryLabels.length - 1 ? ' and ' : ', ')}
                          <strong>{label}</strong>
                        </span>
                      ))}
                    </>
                  )}, 
                  we're showing {displayedCategories.length} relevant service categories. 
                  {audienceFilteredCategories.length - displayedCategories.length > 0 && (
                    <span> {audienceFilteredCategories.length - displayedCategories.length} other category{audienceFilteredCategories.length - displayedCategories.length > 1 ? 'ies are' : 'y is'} available under "+ Show All Categories".</span>
                  )}
                </p>
              </div>
            )}

            {showAllCategories && businessCategories.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Showing All Categories
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      You're viewing all {displayedCategories.length} service categories
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllCategories(false)}
                    className="text-xs border-blue-300 hover:bg-blue-100"
                  >
                    Show Recommended Only
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {displayedCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`category-pill-${category.id}`}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </button>
              ))}
              
              {!showAllCategories && businessCategories.length > 0 && (
                <button
                  onClick={() => setShowAllCategories(true)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white border-2 border-dashed border-purple-300 text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition-all"
                  data-testid="button-show-all-categories"
                >
                  <Plus className="h-4 w-4 inline-block mr-1" />
                  Show All Categories
                </button>
              )}
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-gray-700">
                {categoryInfo?.icon} {categoryInfo?.name}
              </h4>
              <span className="text-xs text-gray-500">
                ({currentSubServices.length} services)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-full">
              {currentSubServices.map((service) => {
                const isSelected = selectedServices.has(service.name);
                const suggestion = serviceSuggestions[service.name];
                const isAlreadyAdded = services.some(s => s.name === service.name);

                return (
                  <div
                    key={service.name}
                    onClick={() => !isAlreadyAdded && toggleServiceSelection(service.name)}
                    className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all hover:scale-[1.02] ${
                      isAlreadyAdded
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                    data-testid={`service-card-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {/* Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      {isAlreadyAdded ? (
                        <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                      ) : (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleServiceSelection(service.name)}
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                      )}
                    </div>

                    <div className="pr-7">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{service.icon}</span>
                        <h5 className="font-medium text-sm leading-tight">{service.name}</h5>
                      </div>
                      
                      {suggestion && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {suggestion.duration}min
                            </span>
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              {suggestion.price}
                            </span>
                          </div>
                        </div>
                      )}

                      {isAlreadyAdded && (
                        <Badge variant="outline" className="mt-2 text-xs bg-green-50 text-green-700 border-green-200">
                          Added
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bulk Add Button */}
          {selectedServices.size > 0 && (
            <div className="pt-4 border-t">
              <Button
                onClick={handleBulkAdd}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add {selectedServices.size} Selected Service{selectedServices.size > 1 ? 's' : ''}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Existing Services List */}
      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => (
                editingService?.id === service.id ? (
                  // Inline Edit Mode
                  <Card key={service.id} className="p-4 bg-gradient-to-br from-violet-50 to-pink-50 border-purple-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">Edit Service</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingService(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-sm">Service Name</Label>
                        <Input
                          value={editingService?.name || ''}
                          onChange={(e) => editingService && setEditingService({ ...editingService, name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={editingService?.duration || 0}
                            onChange={(e) => editingService && setEditingService({ ...editingService, duration: parseInt(e.target.value) || 0 })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Price (₹)</Label>
                          <Input
                            type="number"
                            value={editingService?.price || 0}
                            onChange={(e) => editingService && setEditingService({ ...editingService, price: parseInt(e.target.value) || 0 })}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">Description</Label>
                        <Textarea
                          value={editingService?.description || ''}
                          onChange={(e) => editingService && setEditingService({ ...editingService, description: e.target.value })}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setEditingService(null)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={() => editingService && updateServiceMutation.mutate(editingService)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  // Normal Service Card
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-br from-violet-50/50 to-pink-50/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Service Image */}
                      {service.imageUrl && (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                          data-testid={`img-service-setup-${service.id}`}
                        />
                      )}
                      
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{service.name}</h5>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration} min
                          </span>
                          <span className="text-xs font-medium text-purple-600 flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {service.price}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingService(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => service.id && deleteServiceMutation.mutate(service.id)}
                        disabled={deleteServiceMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Continue Button - Only show when not reviewing */}
      {!showBulkReview && (
        <div className="flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={services.length === 0}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Continue
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Bulk Review Inline Section */}
      {showBulkReview && (
        <Card ref={bulkReviewRef} className="mb-6 scroll-mt-20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Review & Customize Services</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Customize prices and durations before adding these services
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowBulkReview(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bulkServices.map((service, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Service Name</Label>
                    <Input
                      value={service.name}
                      onChange={(e) => {
                        const updated = [...bulkServices];
                        updated[index].name = e.target.value;
                        setBulkServices(updated);
                      }}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm">Duration (min)</Label>
                      <Input
                        type="number"
                        value={service.duration}
                        onChange={(e) => {
                          const updated = [...bulkServices];
                          updated[index].duration = parseInt(e.target.value) || 0;
                          setBulkServices(updated);
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Price (₹)</Label>
                      <Input
                        type="number"
                        value={service.price}
                        onChange={(e) => {
                          const updated = [...bulkServices];
                          updated[index].price = parseInt(e.target.value) || 0;
                          setBulkServices(updated);
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm">Description</Label>
                    <Textarea
                      value={service.description}
                      onChange={(e) => {
                        const updated = [...bulkServices];
                        updated[index].description = e.target.value;
                        setBulkServices(updated);
                      }}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleSaveBulkServices}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Add All Services
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
