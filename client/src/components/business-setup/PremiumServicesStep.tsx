/**
 * Premium Service Selection UI - Industry Standard UX
 * Inspired by: Fresha, Booksy, Vagaro, Billu Partner App
 * 
 * Features:
 * - Three-panel responsive layout with intelligent filtering
 * - Gender-based service discovery (Male/Female/Unisex)
 * - Smart grouping (Popular, Essentials, Full Library)
 * - Semantic search with live filters
 * - Progressive disclosure patterns
 * - Quick-start templates for rapid onboarding
 * - Premium service cards with visual hierarchy
 */

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, Plus, Check, X, ChevronRight, Clock, IndianRupee, 
  Sparkles, Filter, Star, Zap, Users, TrendingUp, Crown,
  User, UserCircle, Users2 as Unisex, ChevronDown
} from "lucide-react";
import { getServiceImage } from "@/lib/serviceImageMapping";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getRelevantServiceCategories } from "@/lib/serviceCategoryMapping";

interface PremiumServicesStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  subCategory: string | null;
  gender: 'male' | 'female' | 'unisex';
  suggestedDurationMinutes: number;
  suggestedPriceInPaisa: number;
  currency: string;
  isPopular: number;
  tags: string[];
  imageUrl: string | null;
}

interface Service {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

// Quick filter types for intelligent discovery
type QuickFilter = 'all' | 'popular' | 'essential' | 'quick' | 'premium';
type GenderFilter = 'all' | 'male' | 'female' | 'unisex';

// Category configuration with premium icons and gradients
const CATEGORY_CONFIG = {
  'Hair Cut & Style': { icon: '💇', gradient: 'from-purple-500 to-pink-500', color: 'purple' },
  'Hair Color': { icon: '🎨', gradient: 'from-pink-500 to-rose-500', color: 'pink' },
  'Hair Treatment': { icon: '✨', gradient: 'from-violet-500 to-purple-500', color: 'violet' },
  'Skin Care': { icon: '🧴', gradient: 'from-blue-500 to-cyan-500', color: 'blue' },
  'Makeup': { icon: '💄', gradient: 'from-pink-500 to-fuchsia-500', color: 'fuchsia' },
  'Mani-Pedi & Hygiene': { icon: '💅', gradient: 'from-rose-500 to-pink-500', color: 'rose' },
  'Massage & Spa': { icon: '💆', gradient: 'from-indigo-500 to-purple-500', color: 'indigo' },
  'Body Treatment': { icon: '🧖', gradient: 'from-emerald-500 to-teal-500', color: 'emerald' },
  'Waxing & Threading': { icon: '🪶', gradient: 'from-amber-500 to-orange-500', color: 'amber' },
  'Piercing & Tattoo': { icon: '💎', gradient: 'from-slate-600 to-gray-700', color: 'slate' },
};

export function PremiumServicesStep({
  salonId,
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: PremiumServicesStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const handleNext = onNext || onComplete || (() => {});

  // State Management
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['popular']));
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [customizedServices, setCustomizedServices] = useState<Map<string, Service>>(new Map());

  // Fetch salon data to get business categories
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
    staleTime: 0,
  });

  // Parse business categories from salon data
  const businessCategories = useMemo(() => {
    if (!salonData) return [];
    const salon = salonData as any;
    const category = salon.category;
    
    // Handle different category formats
    if (Array.isArray(category)) {
      return category;
    }
    
    if (typeof category === 'string') {
      // Try parsing as JSON array first (e.g., '["beauty_salon", "barber"]')
      if (category.startsWith('[')) {
        try {
          const parsed = JSON.parse(category);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse category JSON:', e);
        }
      }
      
      // Check if it's a comma-separated string
      if (category.includes(',')) {
        return category.split(',').map(c => c.trim()).filter(Boolean);
      }
      
      // Single category string
      return [category];
    }
    
    return [];
  }, [salonData]);

  // Get relevant service categories based on business categories
  const relevantServiceCategories = useMemo(() => {
    if (businessCategories.length === 0) return [];
    return getRelevantServiceCategories(businessCategories);
  }, [businessCategories]);

  // Fetch service templates from API
  const { data: serviceTemplates = [], isLoading: templatesLoading } = useQuery<ServiceTemplate[]>({
    queryKey: ['/api/service-templates'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch existing salon services
  const { data: existingServices = [] } = useQuery<Service[]>({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 0,
  });

  // Convert existing services to Set for quick lookup
  const existingServiceNames = useMemo(() => {
    return new Set((existingServices as Service[]).map(s => s.name));
  }, [existingServices]);

  // Intelligent filtering logic
  const filteredTemplates = useMemo(() => {
    let filtered = [...(serviceTemplates as ServiceTemplate[])];

    // INTELLIGENT FILTER: Only show services relevant to business categories (unless user wants all)
    if (relevantServiceCategories.length > 0 && !showAllCategories) {
      filtered = filtered.filter(t => relevantServiceCategories.includes(t.category));
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Apply gender filter
    if (genderFilter !== 'all') {
      filtered = filtered.filter(t => t.gender === genderFilter);
    }

    // Apply quick filters
    if (quickFilter === 'popular') {
      filtered = filtered.filter(t => t.isPopular === 1);
    } else if (quickFilter === 'essential') {
      // Essential services: non-popular services, limit to 20 most common
      const nonPopular = filtered.filter(t => t.isPopular === 0);
      filtered = nonPopular.slice(0, 20);
    } else if (quickFilter === 'quick') {
      filtered = filtered.filter(t => t.suggestedDurationMinutes <= 30);
    } else if (quickFilter === 'premium') {
      filtered = filtered.filter(t => t.suggestedPriceInPaisa >= 200000); // ₹2000+
    }

    // Apply search with semantic matching
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.subCategory?.toLowerCase().includes(query) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [serviceTemplates, selectedCategory, genderFilter, quickFilter, searchQuery]);

  // Smart grouping: Popular, Essentials, Rest
  const groupedServices = useMemo(() => {
    const popular = filteredTemplates.filter(t => t.isPopular === 1);
    const rest = filteredTemplates.filter(t => t.isPopular === 0);

    return {
      popular,
      essentials: rest.slice(0, 20), // First 20 non-popular
      full: rest.slice(20), // Remaining for progressive disclosure
    };
  }, [filteredTemplates]);

  // Get unique categories from templates (filtered by business categories)
  const availableCategories = useMemo(() => {
    let templates = serviceTemplates as ServiceTemplate[];
    
    // If we have relevant categories and not showing all, only show those
    if (relevantServiceCategories.length > 0 && !showAllCategories) {
      templates = templates.filter(t => relevantServiceCategories.includes(t.category));
    }
    
    const categories = new Set(templates.map(t => t.category));
    return Array.from(categories).sort();
  }, [serviceTemplates, relevantServiceCategories, showAllCategories]);

  // Gender distribution for smart insights
  const genderStats = useMemo(() => {
    const stats = { male: 0, female: 0, unisex: 0 };
    filteredTemplates.forEach(t => {
      if (t.gender in stats) {
        stats[t.gender as keyof typeof stats]++;
      }
    });
    return stats;
  }, [filteredTemplates]);

  // Toggle service selection
  const toggleServiceSelection = (templateId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  // Handle service customization
  const updateCustomService = (templateId: string, updates: Partial<Service>) => {
    setCustomizedServices(prev => {
      const newMap = new Map(prev);
      const template = (serviceTemplates as ServiceTemplate[]).find(t => t.id === templateId);
      if (!template) return prev;
      
      const existing = newMap.get(templateId) || {
        name: template.name,
        description: template.description || '',
        duration: template.suggestedDurationMinutes,
        price: template.suggestedPriceInPaisa / 100,
        category: template.category,
      };
      
      newMap.set(templateId, { ...existing, ...updates });
      return newMap;
    });
  };


  // Save individual service directly
  const saveServiceMutation = useMutation({
    mutationFn: async ({ templateId, service }: { templateId: string; service: Service }) => {
      return apiRequest('POST', `/api/salons/${salonId}/services`, {
        ...service,
        salonId,
        priceInPaisa: service.price * 100,
        durationMinutes: service.duration,
        isActive: 1,
      });
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'services'] });
      // Remove from selected services
      setSelectedServices(prev => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
      // Remove from customized services
      setCustomizedServices(prev => {
        const next = new Map(prev);
        next.delete(templateId);
        return next;
      });
      toast({
        title: "Service Saved! ✓",
        description: "Service has been added to your salon.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Saving Service",
        description: error.message || "Failed to save service. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle individual service save
  const handleSaveService = (templateId: string) => {
    const customized = customizedServices.get(templateId);
    if (customized) {
      saveServiceMutation.mutate({ templateId, service: customized });
      return;
    }
    
    const template = (serviceTemplates as ServiceTemplate[]).find(t => t.id === templateId);
    if (!template) return;
    
    const service: Service = {
      name: template.name,
      description: template.description || '',
      duration: template.suggestedDurationMinutes,
      price: template.suggestedPriceInPaisa / 100,
      category: template.category,
    };
    
    saveServiceMutation.mutate({ templateId, service });
  };

  return (
    <div className="space-y-6">
      {/* Header with Smart Insights */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Service Library
          </h2>
          {businessCategories.length > 0 ? (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  ✨ {showAllCategories ? 'Showing all services' : `Recommended for: `}
                  {!showAllCategories && <span className="font-medium text-purple-600">{businessCategories.join(', ')}</span>}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs hover:bg-transparent"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? '← Show Recommended' : '+ Show All Categories'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredTemplates.length} services from {availableCategories.length} categories
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-1">
              Choose from {(serviceTemplates as ServiceTemplate[]).length}+ professional services or create custom ones
            </p>
          )}
        </div>
        
        {(existingServices as Service[]).length > 0 && (
          <Badge variant="outline" className="text-sm">
            <Check className="h-3 w-3 mr-1" />
            {(existingServices as Service[]).length} Services Active
          </Badge>
        )}
      </div>

      {/* Three-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Search + Category Navigation */}
        <div className="lg:col-span-3 space-y-4">
          {/* Semantic Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm">Quick Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { id: 'all', label: 'All Services', icon: Sparkles },
                { id: 'popular', label: 'Popular', icon: Star },
                { id: 'essential', label: 'Essentials', icon: TrendingUp },
                { id: 'quick', label: 'Quick (≤30min)', icon: Zap },
                { id: 'premium', label: 'Premium', icon: Crown },
              ].map(filter => (
                <Button
                  key={filter.id}
                  variant={quickFilter === filter.id ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setQuickFilter(filter.id as QuickFilter)}
                >
                  <filter.icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Category Navigation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-1">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory('all')}
                  >
                    All Categories
                  </Button>
                  {availableCategories.map(category => {
                    const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                    const count = (serviceTemplates as ServiceTemplate[]).filter(t => t.category === category).length;
                    
                    return (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category)}
                      >
                        <span className="mr-2">{config?.icon || '✨'}</span>
                        <span className="flex-1 text-left truncate">{category}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {count}
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* MIDDLE PANEL: Gender Filter + Service Grid */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Gender Toggle with Smart Copy */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Service Type</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {[
                    { id: 'all', label: 'All', icon: Sparkles, count: filteredTemplates.length },
                    { id: 'male', label: 'Men', icon: User, count: genderStats.male },
                    { id: 'female', label: 'Women', icon: UserCircle, count: genderStats.female },
                    { id: 'unisex', label: 'Unisex', icon: Unisex, count: genderStats.unisex },
                  ].map(gender => (
                    <Button
                      key={gender.id}
                      variant={genderFilter === gender.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGenderFilter(gender.id as GenderFilter)}
                      className="gap-2"
                    >
                      <gender.icon className="h-4 w-4" />
                      {gender.label}
                      <Badge variant="secondary" className="ml-1">
                        {gender.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Grid with Progressive Disclosure */}
          <Card>
            <CardContent className="pt-6">
              {templatesLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading services...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No services found. Try adjusting your filters.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Popular Services */}
                  {groupedServices.popular.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <h3 className="font-semibold">Popular Services</h3>
                          <Badge variant="secondary">{groupedServices.popular.length}</Badge>
                        </div>
                      </div>
                      <ServiceGrid
                        services={groupedServices.popular}
                        selectedServices={selectedServices}
                        existingServiceNames={existingServiceNames}
                        customizedServices={customizedServices}
                        onToggle={toggleServiceSelection}
                        onUpdateService={updateCustomService}
                        onSaveService={handleSaveService}
                        isSaving={saveServiceMutation.isPending}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Essential Services */}
                  {groupedServices.essentials.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <h3 className="font-semibold">Essential Services</h3>
                          <Badge variant="secondary">{groupedServices.essentials.length}</Badge>
                        </div>
                      </div>
                      <ServiceGrid
                        services={groupedServices.essentials}
                        selectedServices={selectedServices}
                        existingServiceNames={existingServiceNames}
                        customizedServices={customizedServices}
                        onToggle={toggleServiceSelection}
                        onUpdateService={updateCustomService}
                        onSaveService={handleSaveService}
                        isSaving={saveServiceMutation.isPending}
                      />
                    </div>
                  )}

                  {/* Full Library (Progressive Disclosure) */}
                  {groupedServices.full.length > 0 && (
                    <div>
                      {expandedGroups.has('full') ? (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">More Services</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedGroups(prev => {
                                const next = new Set(prev);
                                next.delete('full');
                                return next;
                              })}
                            >
                              <ChevronDown className="h-4 w-4 mr-1 rotate-180" />
                              Show Less
                            </Button>
                          </div>
                          <ServiceGrid
                            services={groupedServices.full}
                            selectedServices={selectedServices}
                            existingServiceNames={existingServiceNames}
                            customizedServices={customizedServices}
                            onToggle={toggleServiceSelection}
                            onUpdateService={updateCustomService}
                            onSaveService={handleSaveService}
                            isSaving={saveServiceMutation.isPending}
                          />
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setExpandedGroups(prev => new Set(prev).add('full'))}
                        >
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Show {groupedServices.full.length} More Services
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <div className="ml-auto flex gap-3">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip for Now
            </Button>
          )}
          <Button onClick={handleNext} className="bg-gradient-to-r from-purple-600 to-pink-600">
            {(existingServices as Service[]).length > 0 ? 'Continue' : 'Add Services Later'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Fresha-Style List View Component with Inline Editing
function ServiceGrid({
  services,
  selectedServices,
  existingServiceNames,
  customizedServices,
  onToggle,
  onUpdateService,
  onSaveService,
  isSaving
}: {
  services: ServiceTemplate[];
  selectedServices: Set<string>;
  existingServiceNames: Set<string>;
  customizedServices: Map<string, Service>;
  onToggle: (id: string) => void;
  onUpdateService: (id: string, updates: Partial<Service>) => void;
  onSaveService: (id: string) => void;
  isSaving: boolean;
}) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const toggleDescription = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {services.map((service) => {
        const isSelected = selectedServices.has(service.id);
        const isAdded = existingServiceNames.has(service.name);
        const serviceImage = getServiceImage(service.name, service.category);
        const customized = customizedServices.get(service.id);
        const showDescription = expandedDescriptions.has(service.id);
        
        // Use customized or default values
        const displayName = customized?.name || service.name;
        const displayDuration = customized?.duration || service.suggestedDurationMinutes;
        const displayPrice = customized?.price || (service.suggestedPriceInPaisa / 100);
        const displayDescription = customized?.description || service.description || '';
        
        return (
          <div key={service.id} className="space-y-0">
            {/* Main Service Row */}
            <div
              onClick={() => !isAdded && onToggle(service.id)}
              className={cn(
                "group flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer",
                isAdded
                  ? "border-gray-200 bg-gray-50/50 opacity-60 cursor-not-allowed"
                  : isSelected
                  ? "border-purple-400 bg-purple-50/50 shadow-sm"
                  : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30 hover:shadow-sm"
              )}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0">
                {isAdded ? (
                  <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-100 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                ) : (
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    isSelected 
                      ? "border-purple-600 bg-purple-600" 
                      : "border-gray-300 group-hover:border-purple-400"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                )}
              </div>

              {/* Service Image */}
              <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                <img 
                  src={serviceImage} 
                  alt={service.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Service Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm text-gray-900 leading-snug">{displayName}</h5>
                    {service.subCategory && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{service.subCategory}</p>
                    )}
                    {/* Description Preview */}
                    {displayDescription && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                        {displayDescription}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Metadata + Badges Row */}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    {displayDuration}min
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {displayPrice}
                  </span>
                  
                  {/* Compact Badges */}
                  {service.isPopular === 1 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                      <Star className="h-2.5 w-2.5 mr-0.5 text-yellow-500 fill-yellow-500" />
                      Popular
                    </Badge>
                  )}
                  {service.gender === 'male' && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                      <User className="h-2.5 w-2.5 mr-0.5 text-blue-500" />
                      Men
                    </Badge>
                  )}
                  {service.gender === 'female' && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                      <UserCircle className="h-2.5 w-2.5 mr-0.5 text-pink-500" />
                      Women
                    </Badge>
                  )}
                  {service.gender === 'unisex' && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                      <Unisex className="h-2.5 w-2.5 mr-0.5" />
                      Unisex
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Inline Edit Panel (when selected) */}
            {isSelected && !isAdded && (
              <div className="ml-24 mr-4 mb-2 p-4 bg-white border border-purple-200 rounded-lg shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Service Name</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => onUpdateService(service.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">Duration (min)</Label>
                      <Input
                        type="number"
                        value={displayDuration}
                        onChange={(e) => onUpdateService(service.id, { duration: parseInt(e.target.value) || 0 })}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Price (₹)</Label>
                      <Input
                        type="number"
                        value={displayPrice}
                        onChange={(e) => onUpdateService(service.id, { price: parseInt(e.target.value) || 0 })}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600">Description (Optional)</Label>
                    <Input
                      value={displayDescription}
                      onChange={(e) => onUpdateService(service.id, { description: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Add a custom description for this service..."
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">✏️ Customize this service before saving</p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveService(service.id);
                    }}
                    disabled={isSaving}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isSaving ? (
                      <>
                        <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Save Service
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
