import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Armchair, Plus, Trash2, Edit, Sparkles, 
  Sofa, Scissors, Lamp, Box, Users, Grid3x3,
  CheckCircle2, Info, Zap, Copy, Wand2
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResourcesStepProps {
  salonId: string;
  onNext?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

interface Resource {
  id?: string;
  name: string;
  type: string;
  description: string;
  capacity: number;
  isActive: boolean;
}

interface ResourceTemplate {
  name: string;
  type: string;
  description: string;
  capacity: number;
  icon: any;
}

const RESOURCE_TYPES = [
  { value: "chair", label: "Styling Chair", icon: Armchair, color: "from-purple-500 to-pink-500" },
  { value: "room", label: "Private Room", icon: Box, color: "from-violet-500 to-purple-500" },
  { value: "station", label: "Work Station", icon: Grid3x3, color: "from-pink-500 to-rose-500" },
  { value: "equipment", label: "Equipment", icon: Lamp, color: "from-fuchsia-500 to-pink-500" },
  { value: "bed", label: "Treatment Bed", icon: Sofa, color: "from-indigo-500 to-purple-500" }
];

// Service category to resource mapping for intelligent suggestions
const SERVICE_TO_RESOURCE_MAPPING: Record<string, ResourceTemplate[]> = {
  'hair': [
    { name: "Styling Chair 1", type: "chair", description: "Professional styling chair with hydraulic pump", capacity: 1, icon: Armchair },
    { name: "Hair Wash Station", type: "station", description: "Shampoo bowl and reclining chair", capacity: 1, icon: Grid3x3 },
    { name: "Color Processing Area", type: "station", description: "Dedicated space for hair coloring", capacity: 1, icon: Grid3x3 },
  ],
  'nails': [
    { name: "Manicure Station 1", type: "station", description: "Nail table with UV lamp and tools", capacity: 1, icon: Grid3x3 },
    { name: "Pedicure Chair 1", type: "chair", description: "Spa pedicure chair with massage", capacity: 1, icon: Armchair },
  ],
  'skincare': [
    { name: "Facial Room 1", type: "room", description: "Private room for facial treatments", capacity: 1, icon: Box },
    { name: "Treatment Bed", type: "equipment", description: "Adjustable treatment bed", capacity: 1, icon: Lamp },
  ],
  'massage': [
    { name: "Massage Room 1", type: "room", description: "Private room with massage table", capacity: 1, icon: Box },
    { name: "Couples Massage Suite", type: "room", description: "Large room for couples treatments", capacity: 2, icon: Box },
  ],
  'eyes': [
    { name: "Lash Station 1", type: "station", description: "Station for lash extensions and brow services", capacity: 1, icon: Grid3x3 },
  ],
  'makeup': [
    { name: "Makeup Station 1", type: "station", description: "Professional makeup station with ring light", capacity: 1, icon: Grid3x3 },
  ],
  'piercing': [
    { name: "Piercing Room", type: "room", description: "Sterile private room for piercing", capacity: 1, icon: Box },
  ],
  'tattoo': [
    { name: "Tattoo Station 1", type: "station", description: "Professional tattoo workstation", capacity: 1, icon: Grid3x3 },
    { name: "Tattoo Room 1", type: "room", description: "Private room for larger tattoo sessions", capacity: 1, icon: Box },
  ],
  'body': [
    { name: "Body Treatment Room", type: "room", description: "Room for body wraps and treatments", capacity: 1, icon: Box },
  ],
  'wellness': [
    { name: "Wellness Room", type: "room", description: "Multi-purpose wellness space", capacity: 1, icon: Box },
    { name: "Waiting Lounge", type: "bed", description: "Comfortable waiting area for clients", capacity: 6, icon: Sofa },
  ],
  'hair-removal': [
    { name: "Waxing Room", type: "room", description: "Private room for waxing services", capacity: 1, icon: Box },
    { name: "Treatment Station", type: "station", description: "Station for quick hair removal services", capacity: 1, icon: Grid3x3 },
  ],
  'mens': [
    { name: "Barber Chair 1", type: "chair", description: "Professional barber chair", capacity: 1, icon: Armchair },
    { name: "Shave Station", type: "station", description: "Hot towel and straight razor station", capacity: 1, icon: Grid3x3 },
  ]
};

// Quick setup templates for different business types
const BUSINESS_TEMPLATES: Record<string, ResourceTemplate[]> = {
  'hair_salon': [
    { name: "Styling Chair 1", type: "chair", description: "Premium styling chair", capacity: 1, icon: Armchair },
    { name: "Styling Chair 2", type: "chair", description: "Premium styling chair", capacity: 1, icon: Armchair },
    { name: "Hair Wash Station", type: "station", description: "Shampoo and conditioning station", capacity: 1, icon: Grid3x3 },
    { name: "Color Processing Area", type: "station", description: "Hair coloring workspace", capacity: 1, icon: Grid3x3 },
  ],
  'nail_salon': [
    { name: "Manicure Station 1", type: "station", description: "Professional manicure table", capacity: 1, icon: Grid3x3 },
    { name: "Manicure Station 2", type: "station", description: "Professional manicure table", capacity: 1, icon: Grid3x3 },
    { name: "Pedicure Chair 1", type: "chair", description: "Spa pedicure chair", capacity: 1, icon: Armchair },
    { name: "Pedicure Chair 2", type: "chair", description: "Spa pedicure chair", capacity: 1, icon: Armchair },
  ],
  'spa': [
    { name: "Massage Room 1", type: "room", description: "Private massage room", capacity: 1, icon: Box },
    { name: "Massage Room 2", type: "room", description: "Private massage room", capacity: 1, icon: Box },
    { name: "Facial Treatment Room", type: "room", description: "Private facial room", capacity: 1, icon: Box },
    { name: "Relaxation Lounge", type: "bed", description: "Post-treatment relaxation area", capacity: 4, icon: Sofa },
  ],
  'beauty_salon': [
    { name: "Styling Chair 1", type: "chair", description: "Multi-purpose styling chair", capacity: 1, icon: Armchair },
    { name: "Makeup Station", type: "station", description: "Professional makeup area", capacity: 1, icon: Grid3x3 },
    { name: "Nail Station", type: "station", description: "Manicure/pedicure station", capacity: 1, icon: Grid3x3 },
    { name: "Treatment Room", type: "room", description: "Private treatment room", capacity: 1, icon: Box },
  ]
};

export default function ResourcesStep({ 
  salonId, 
  onNext,
  onComplete,
  onBack,
  onSkip,
  isCompleted
}: ResourcesStepProps) {
  // Use onNext if provided (from SetupWizard), otherwise use onComplete (from Dashboard)
  const handleNext = onNext || onComplete || (() => {});
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [newResource, setNewResource] = useState<Resource>({
    name: "",
    type: "chair",
    description: "",
    capacity: 1,
    isActive: true
  });
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  const [suggestedResources, setSuggestedResources] = useState<ResourceTemplate[]>([]);
  const [autoSuggestionReason, setAutoSuggestionReason] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load salon details to get business type
  const { data: salonData } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  // Load salon services to create intelligent suggestions
  const { data: salonServices } = useQuery<any[]>({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
  });

  // Load existing resources
  const { data: existingResources } = useQuery({
    queryKey: ['/api/salons', salonId, 'resources'],
    enabled: !!salonId,
  });

  useEffect(() => {
    if (existingResources) {
      // Transform resourceType to type for frontend compatibility
      const transformedResources = (Array.isArray(existingResources) ? existingResources : []).map((r: any) => ({
        ...r,
        type: r.resourceType || r.type,
        isActive: Boolean(r.isActive)
      }));
      setResources(transformedResources);
    }
  }, [existingResources]);

  // Helper function to normalize category names to mapping keys
  const normalizeCategoryKey = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Hair & Styling': 'hair',
      'hair & styling': 'hair',
      'Nails': 'nails',
      'nails': 'nails',
      'Skincare & Facials': 'skincare',
      'skincare & facials': 'skincare',
      'Massage & Spa': 'massage',
      'massage & spa': 'massage',
      'Eyebrows & Lashes': 'eyes',
      'eyebrows & lashes': 'eyes',
      'Hair Removal': 'hair-removal',
      'hair removal': 'hair-removal',
      'Piercing': 'piercing',
      'piercing': 'piercing',
      'Tattoo': 'tattoo',
      'tattoo': 'tattoo',
      'Makeup': 'makeup',
      'makeup': 'makeup',
      'Body Treatments': 'body',
      'body treatments': 'body',
      "Men's Grooming": 'mens',
      "men's grooming": 'mens',
      'Wellness & Other': 'wellness',
      'wellness & other': 'wellness',
    };
    return categoryMap[category] || category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  // Intelligent resource suggestions based on salon services
  useEffect(() => {
    if (salonServices && salonServices.length > 0 && resources.length === 0) {
      const rawCategories = salonServices.map((s: any) => s.category).filter(Boolean);
      const normalizedCategories = Array.from(new Set(rawCategories.map(normalizeCategoryKey)));
      const suggested: ResourceTemplate[] = [];
      
      // Get resources for each service category
      normalizedCategories.forEach(category => {
        const categoryResources = SERVICE_TO_RESOURCE_MAPPING[category];
        if (categoryResources) {
          categoryResources.forEach(resource => {
            // Avoid duplicates by checking resource name
            if (!suggested.some(r => r.name === resource.name)) {
              suggested.push(resource);
            }
          });
        }
      });

      if (suggested.length > 0) {
        setSuggestedResources(suggested.slice(0, 6)); // Limit to 6 suggestions
        const categoryDisplayNames = normalizedCategories.map(c => {
          const categoryMap: Record<string, string> = {
            'hair': 'Hair & Styling',
            'nails': 'Nails',
            'skincare': 'Skincare & Facials',
            'massage': 'Massage & Spa',
            'eyes': 'Eyebrows & Lashes',
            'makeup': 'Makeup',
            'piercing': 'Piercing',
            'tattoo': 'Tattoo',
            'body': 'Body Treatments',
            'wellness': 'Wellness',
          };
          return categoryMap[c] || c;
        });
        setAutoSuggestionReason(`Based on your ${categoryDisplayNames.slice(0, 3).join(', ')} services`);
      }
    }
  }, [salonServices, resources.length]);

  // Add resource mutation
  const addResourceMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      // Convert 'type' to 'resourceType' for backend
      const payload = {
        name: resource.name,
        resourceType: resource.type,
        description: resource.description,
        capacity: resource.capacity,
        isActive: resource.isActive ? 1 : 0,
        salonId: salonId
      };
      const response = await apiRequest('POST', `/api/salons/${salonId}/resources`, payload);
      return response.json();
    },
    onSuccess: (data) => {
      // Transform resourceType to type for frontend
      const transformedData = { ...data, type: data.resourceType || data.type, isActive: Boolean(data.isActive) };
      setResources(prev => [...prev, transformedData]);
      setNewResource({ name: "", type: "chair", description: "", capacity: 1, isActive: true });
      setIsAddingResource(false);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'resources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'dashboard-completion'] });
      toast({
        title: "Resource Added! ✨",
        description: `${data.name} is now available for booking`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add resource",
        description: "Please try again",
        variant: "destructive",
      });
    }
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      if (!resource.id) throw new Error('Resource ID required for update');
      
      // Convert 'type' to 'resourceType' for backend
      const payload = {
        name: resource.name,
        resourceType: resource.type,
        description: resource.description,
        capacity: resource.capacity,
        isActive: resource.isActive ? 1 : 0
      };
      const response = await apiRequest('PUT', `/api/salons/${salonId}/resources/${resource.id}`, payload);
      return response.json();
    },
    onSuccess: (data) => {
      // Transform resourceType to type for frontend
      const transformedData = { ...data, type: data.resourceType || data.type, isActive: Boolean(data.isActive) };
      setResources(prev => prev.map(r => r.id === data.id ? transformedData : r));
      setEditingResource(null);
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'resources'] });
      toast({
        title: "Resource Updated! ✅",
        description: `${data.name} has been updated successfully`,
      });
    }
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const response = await apiRequest('DELETE', `/api/salons/${salonId}/resources/${resourceId}`);
      return response.json();
    },
    onSuccess: (_, resourceId) => {
      setResources(prev => prev.filter(r => r.id !== resourceId));
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'resources'] });
      toast({
        title: "Resource Deleted",
        description: "Resource has been removed",
      });
    }
  });

  const handleAddResource = async () => {
    if (!newResource.name.trim()) {
      toast({
        title: "Resource Name Required",
        description: "Please provide a name for the resource",
        variant: "destructive",
      });
      return;
    }

    await addResourceMutation.mutateAsync(newResource);
  };

  const handleUpdateResource = async () => {
    if (!editingResource) return;
    await updateResourceMutation.mutateAsync(editingResource);
  };

  const handleAddSuggestedResource = async (template: ResourceTemplate) => {
    const resource = {
      name: template.name,
      type: template.type,
      description: template.description,
      capacity: template.capacity,
      isActive: true
    };
    await addResourceMutation.mutateAsync(resource);
    setSuggestedResources(prev => prev.filter(r => r.name !== template.name));
  };

  const handleApplyTemplate = async (templateKey: string) => {
    const template = BUSINESS_TEMPLATES[templateKey];
    if (!template) return;

    try {
      for (const resource of template) {
        await addResourceMutation.mutateAsync({
          name: resource.name,
          type: resource.type,
          description: resource.description,
          capacity: resource.capacity,
          isActive: true
        });
      }
      toast({
        title: "Template Applied! 🎉",
        description: `Added ${template.length} resources to your salon`,
      });
    } catch (error) {
      toast({
        title: "Failed to apply template",
        description: "Some resources may not have been added",
        variant: "destructive",
      });
    }
  };

  const getResourceIcon = (type: string) => {
    const resourceType = RESOURCE_TYPES.find(t => t.value === type);
    return resourceType?.icon || Box;
  };

  const getResourceColor = (type: string) => {
    const resourceType = RESOURCE_TYPES.find(t => t.value === type);
    return resourceType?.color || "from-gray-500 to-slate-500";
  };

  const handleContinue = async () => {
    // Invalidate completion status cache
    await queryClient.invalidateQueries({ 
      queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
    });
    
    handleNext();
  };

  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 p-8 border border-purple-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl">
              <Armchair className="h-7 w-7 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Set Up Your Resources
              </h3>
              <p className="text-gray-600 mt-1">
                Add chairs, rooms, and equipment that customers can book
              </p>
            </div>
          </div>

          {/* Smart Tips */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg p-3">
              <Zap className="h-5 w-5 text-amber-500" />
              <span className="text-sm text-gray-700">Smart suggestions based on your services</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg p-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-700">Quick setup templates available</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg p-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700">Easily manage capacity & availability</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Suggestions Banner */}
      {suggestedResources.length > 0 && showSmartSuggestions && (
        <Alert className="border-green-200 bg-green-50">
          <Sparkles className="h-5 w-5 text-green-600" />
          <AlertDescription className="ml-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-green-900">✨ Smart Suggestions</p>
                <p className="text-sm text-green-700 mt-1">
                  {autoSuggestionReason}, we recommend these resources for your salon:
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSmartSuggestions(false);
                  setSuggestedResources([]); // Clear suggestions to show templates
                }}
                className="text-green-700 hover:text-green-900"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Smart Suggested Resources */}
      {suggestedResources.length > 0 && showSmartSuggestions && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Recommended Resources
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedResources.map((template, index) => {
              const IconComponent = template.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-purple-100 hover:border-purple-300">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${getResourceColor(template.type)} bg-opacity-10`}>
                        <IconComponent className="h-6 w-6 text-purple-600" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {RESOURCE_TYPES.find(t => t.value === template.type)?.label}
                      </Badge>
                    </div>
                    <h5 className="font-semibold text-gray-900 mb-1">{template.name}</h5>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Capacity: {template.capacity}</span>
                      <Button
                        size="sm"
                        onClick={() => handleAddSuggestedResource(template)}
                        disabled={addResourceMutation.isPending}
                        data-testid={`button-add-suggested-${index}`}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Setup Templates - always show when no resources exist */}
      {resources.length === 0 && suggestedResources.length === 0 && (
        <Card className="border-dashed border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Copy className="h-12 w-12 text-purple-400 mx-auto mb-3" />
              <h4 className="font-semibold text-lg text-gray-900">Quick Setup Templates</h4>
              <p className="text-sm text-gray-600 mt-1">Choose a template to add multiple resources at once</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(BUSINESS_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto py-4 px-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => handleApplyTemplate(key)}
                  data-testid={`button-template-${key}`}
                >
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-500">{template.length} resources</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Resources Grid */}
      {resources.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Your Resources ({resources.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const IconComponent = getResourceIcon(resource.type);
              return (
                <Card key={resource.id} className="group hover:shadow-xl transition-all duration-300 border-purple-100 hover:border-purple-300">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${getResourceColor(resource.type)}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingResource(resource)}
                          data-testid={`button-edit-resource-${resource.id}`}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resource.id && deleteResourceMutation.mutate(resource.id)}
                          disabled={deleteResourceMutation.isPending}
                          data-testid={`button-delete-resource-${resource.id}`}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h5 className="font-semibold text-gray-900 mb-2">{resource.name}</h5>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description || "No description"}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {RESOURCE_TYPES.find(t => t.value === resource.type)?.label || resource.type}
                        </Badge>
                        <span className="text-xs text-gray-500">Cap: {resource.capacity}</span>
                      </div>
                      <Badge variant={resource.isActive ? "default" : "secondary"} className="text-xs">
                        {resource.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Add New Resource Card */}
      <Card className="border-2 border-dashed border-purple-200 hover:border-purple-400 transition-colors">
        <CardContent className="p-6">
          {!isAddingResource && !editingResource ? (
            <Button
              onClick={() => setIsAddingResource(true)}
              className="w-full h-16 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-add-resource"
            >
              <Plus className="h-6 w-6 mr-2" />
              Add New Resource
            </Button>
          ) : editingResource ? (
            // Edit Resource Form
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Edit className="h-5 w-5 text-purple-600" />
                  Edit Resource
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingResource(null)}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-resource-name" className="text-sm font-medium">Resource Name *</Label>
                  <Input
                    id="edit-resource-name"
                    value={editingResource.name}
                    onChange={(e) => setEditingResource(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="e.g., Styling Chair 1"
                    className="mt-1.5"
                    data-testid="input-edit-resource-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-resource-type" className="text-sm font-medium">Type</Label>
                  <Select 
                    value={editingResource.type} 
                    onValueChange={(value) => setEditingResource(prev => prev ? { ...prev, type: value } : null)}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-edit-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-resource-description" className="text-sm font-medium">Description</Label>
                <Input
                  id="edit-resource-description"
                  value={editingResource.description}
                  onChange={(e) => setEditingResource(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Describe this resource..."
                  className="mt-1.5"
                  data-testid="input-edit-resource-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-resource-capacity" className="text-sm font-medium">Capacity</Label>
                  <Input
                    id="edit-resource-capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={editingResource.capacity}
                    onChange={(e) => setEditingResource(prev => prev ? { ...prev, capacity: parseInt(e.target.value) || 1 } : null)}
                    className="mt-1.5"
                    data-testid="input-edit-resource-capacity"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many people can use this simultaneously?</p>
                </div>
                
                <div className="flex items-end pb-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-resource-active"
                      checked={editingResource.isActive}
                      onCheckedChange={(checked) => setEditingResource(prev => prev ? { ...prev, isActive: checked as boolean } : null)}
                      data-testid="checkbox-edit-resource-active"
                    />
                    <Label htmlFor="edit-resource-active" className="text-sm font-medium cursor-pointer">
                      Available for booking
                    </Label>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleUpdateResource}
                disabled={updateResourceMutation.isPending}
                className="w-full"
                data-testid="button-update-resource"
              >
                {updateResourceMutation.isPending ? "Updating..." : "Update Resource"}
              </Button>
            </div>
          ) : (
            // Add Resource Form
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  Add New Resource
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingResource(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resource-name" className="text-sm font-medium">Resource Name *</Label>
                  <Input
                    id="resource-name"
                    value={newResource.name}
                    onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Styling Chair 1"
                    className="mt-1.5"
                    data-testid="input-resource-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="resource-type" className="text-sm font-medium">Type</Label>
                  <Select 
                    value={newResource.type} 
                    onValueChange={(value) => setNewResource(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="resource-description" className="text-sm font-medium">Description</Label>
                <Input
                  id="resource-description"
                  value={newResource.description}
                  onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this resource..."
                  className="mt-1.5"
                  data-testid="input-resource-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resource-capacity" className="text-sm font-medium">Capacity</Label>
                  <Input
                    id="resource-capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={newResource.capacity}
                    onChange={(e) => setNewResource(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                    className="mt-1.5"
                    data-testid="input-resource-capacity"
                  />
                  <p className="text-xs text-gray-500 mt-1">How many people can use this simultaneously?</p>
                </div>
                
                <div className="flex items-end pb-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="resource-active"
                      checked={newResource.isActive}
                      onCheckedChange={(checked) => setNewResource(prev => ({ ...prev, isActive: checked as boolean }))}
                      data-testid="checkbox-resource-active"
                    />
                    <Label htmlFor="resource-active" className="text-sm font-medium cursor-pointer">
                      Available for booking
                    </Label>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleAddResource}
                disabled={addResourceMutation.isPending}
                className="w-full"
                data-testid="button-save-resource"
              >
                {addResourceMutation.isPending ? "Adding..." : "Add Resource"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">💡 Pro Tip</p>
              <p className="text-sm text-blue-700 mt-1">
                Resources help you manage bookings efficiently. Set capacity limits to control how many clients can use each resource simultaneously.
                {resources.length === 0 && " You can always add resources later!"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm">
          {resources.length === 0 && (
            <span className="text-amber-600 flex items-center gap-2">
              <Info className="h-4 w-4" />
              You can add resources later if needed
            </span>
          )}
        </div>

        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          data-testid="button-continue-resources"
        >
          Continue {resources.length > 0 ? `with ${resources.length} Resource${resources.length !== 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}
