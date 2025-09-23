import { Search, MapPin, Calendar, Scissors, Paintbrush2, Sparkles, Dumbbell, Heart, Star, SlidersHorizontal, LayoutGrid, ChevronDown, Zap, Smile, User, Stethoscope, Brain, ArrowUpDown, Clock, CheckCircle, Home, Building2, Navigation, Settings, Flower2, Eye, Footprints, Hand, CircleDot, Crown, Baby, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback, useRef } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Haversine formula for accurate distance calculations (industry standard)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Helper function to format distance for display (meters for nearby, km for far)
const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
};

// Helper function to safely parse JSON responses
const safeParseJSON = async (response: Response) => {
  try {
    // Check if response has content and is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response.status === 204 ? null : {};
    }
    
    const text = await response.text();
    if (!text) {
      return null;
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parsing error:', error);
    return null;
  }
};

const serviceCategories = [
  // Popular categories (shown in top row)
  { id: "hair", label: "Hair", icon: Scissors, group: "Beauty", popular: true, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "facials", label: "Facials & Skincare", icon: Sparkles, group: "Skin & Aesthetics", popular: true, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "nails", label: "Nails", icon: Paintbrush2, group: "Beauty", popular: true, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "massage", label: "Massage", icon: Heart, group: "Body & Wellness", popular: true, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "hair-removal", label: "Hair Removal & Waxing", icon: Zap, group: "Skin & Aesthetics", popular: true, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "makeup", label: "Makeup", icon: Smile, group: "Beauty", popular: true, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  
  // Beauty Services
  { id: "hair-cut-styling", label: "Hair Cut & Styling", icon: Scissors, group: "Beauty", popular: false, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "hair-coloring", label: "Hair Coloring", icon: Paintbrush2, group: "Beauty", popular: false, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "hair-treatment", label: "Hair Treatment", icon: Sparkles, group: "Beauty", popular: false, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "bridal-makeup", label: "Bridal Makeup", icon: Crown, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "party-makeup", label: "Party Makeup", icon: Star, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "everyday-makeup", label: "Everyday Makeup", icon: Smile, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  
  // Nail Services
  { id: "manicure", label: "Manicure", icon: Hand, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "pedicure", label: "Pedicure", icon: Footprints, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "nail-art", label: "Nail Art", icon: Paintbrush2, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "gel-polish", label: "Gel Polish", icon: CircleDot, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "nail-extension", label: "Nail Extension", icon: Hand, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  
  // Waxing Services
  { id: "half-hand-wax", label: "Half Hand Wax", icon: Hand, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "full-hand-wax", label: "Full Hand Wax", icon: Hand, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "half-leg-wax", label: "Half Leg Wax", icon: Footprints, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "full-leg-wax", label: "Full Leg Wax", icon: Footprints, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "full-body-wax", label: "Full Body Wax", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "underarm-wax", label: "Underarm Wax", icon: Shirt, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "bikini-wax", label: "Bikini Wax", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "brazilian-wax", label: "Brazilian Wax", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "eyebrow-wax", label: "Eyebrow Wax", icon: Eye, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "upper-lip-wax", label: "Upper Lip Wax", icon: Smile, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  
  // Facial & Skincare Services
  { id: "facial-massage", label: "Facial Massage", icon: Sparkles, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "deep-cleansing-facial", label: "Deep Cleansing Facial", icon: Sparkles, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "anti-aging-facial", label: "Anti-Aging Facial", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "acne-treatment", label: "Acne Treatment", icon: CircleDot, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "hydrafacial", label: "HydraFacial", icon: Sparkles, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "chemical-peel", label: "Chemical Peel", icon: Zap, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "microdermabrasion", label: "Microdermabrasion", icon: CircleDot, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  
  // Massage & Body Treatments
  { id: "full-body-massage", label: "Full Body Massage", icon: Heart, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "deep-tissue-massage", label: "Deep Tissue Massage", icon: Heart, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "swedish-massage", label: "Swedish Massage", icon: Heart, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "hot-stone-massage", label: "Hot Stone Massage", icon: CircleDot, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "aromatherapy-massage", label: "Aromatherapy Massage", icon: Flower2, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "head-massage", label: "Head Massage", icon: Brain, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "foot-massage", label: "Foot Massage", icon: Footprints, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  
  // Specialty Services
  { id: "body-scrub", label: "Body Scrub", icon: Sparkles, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "body-wrap", label: "Body Wrap", icon: User, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "spray-tan", label: "Spray Tan", icon: Zap, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "lash-extension", label: "Lash Extension", icon: Eye, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "eyebrow-threading", label: "Eyebrow Threading", icon: Eye, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "eyebrow-tinting", label: "Eyebrow Tinting", icon: Eye, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  
  // Advanced Treatments
  { id: "injectables", label: "Injectables & Fillers", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "laser-treatment", label: "Laser Treatment", icon: Zap, group: "Skin & Aesthetics", popular: false, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "botox", label: "Botox", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  
  // Fitness & Wellness
  { id: "fitness", label: "Fitness", icon: Dumbbell, group: "Body & Wellness", popular: false, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
  { id: "yoga", label: "Yoga", icon: Heart, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "pilates", label: "Pilates", icon: Dumbbell, group: "Body & Wellness", popular: false, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
  
  // Other Services
  { id: "tattoo-piercing", label: "Tattoo & Piercing", icon: Zap, group: "Specialty", popular: false, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "medical-dental", label: "Medical & Dental", icon: Stethoscope, group: "Clinical", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "counseling", label: "Counseling & Holistic", icon: Brain, group: "Mind & Holistic", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
];

const categoryGroups = [
  "Beauty",
  "Skin & Aesthetics", 
  "Body & Wellness",
  "Specialty",
  "Clinical",
  "Mind & Holistic"
];

interface SearchParams {
  coordinates?: { lat: number; lng: number };
  radius?: number;
  service?: string;
  category?: string;
  sortBy?: string;
  filters?: {
    priceRange?: [number, number];
    minRating?: number;
    availableToday?: boolean;
    specificServices?: string[];
  };
}

interface SearchBarProps {
  onSearch?: (params: SearchParams) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [sortBy, setSortBy] = useState("best-match");
  const [availableToday, setAvailableToday] = useState(false);
  const [specificServices, setSpecificServices] = useState<string[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [showServicesFilter, setShowServicesFilter] = useState(false);
  
  // Authentication and notification hooks
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Location tracking state for industry-standard detection
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [locationRetryCount, setLocationRetryCount] = useState(0);
  const [lastKnownLocation, setLastKnownLocation] = useState<{lat: number, lng: number, timestamp: number, accuracy: number} | null>(null);
  const [isUsingCachedLocation, setIsUsingCachedLocation] = useState(false);
  
  // Location input modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'home' | 'work'>('home');
  const [locationModalValue, setLocationModalValue] = useState('');
  const [modalLocationSuggestions, setModalLocationSuggestions] = useState<any[]>([]);
  const [isModalLocationSearching, setIsModalLocationSearching] = useState(false);
  const [showModalLocationSuggestions, setShowModalLocationSuggestions] = useState(false);
  
  // Location permission modal state
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'idle' | 'checking' | 'granted' | 'denied' | 'blocked'>('idle');
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showMobileAutocomplete, setShowMobileAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalLocationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Location autocomplete state
  const [showLocationAutocomplete, setShowLocationAutocomplete] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [currentLocationStatus, setCurrentLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [selectedLocationCoords, setSelectedLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  // Search radius state with localStorage persistence and preset options
  const [searchRadius, setSearchRadius] = useState(() => {
    const saved = localStorage.getItem('searchRadius');
    return saved ? parseFloat(saved) : 0.5; // Default: 500m
  });

  // Radius preset options with labels and transport modes
  const radiusPresets = [
    { value: 0.2, label: '200m', description: 'Walking', icon: '🚶' },
    { value: 0.5, label: '500m', description: 'Short trip', icon: '🏃' },
    { value: 1, label: '1km', description: 'Bike', icon: '🚲' },
    { value: 2, label: '2km', description: 'Car/Bus', icon: '🚗' }
  ];

  // Update localStorage when radius changes
  useEffect(() => {
    localStorage.setItem('searchRadius', searchRadius.toString());
  }, [searchRadius]);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateType, setSelectedDateType] = useState<'any' | 'today' | 'tomorrow' | 'specific'>('any');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const popularCategories = serviceCategories.filter(cat => cat.popular);
  const hiddenCategoriesCount = serviceCategories.filter(cat => !cat.popular).length;

  // Fetch all services for specific services filter
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const services = await safeParseJSON(response);
          setAllServices(Array.isArray(services) ? services : []);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };
    fetchServices();
  }, []);

  // Show popular suggestions when focused without query (Fresha-style)
  const showPopularSuggestions = useCallback(() => {
    setIsSearching(false);
    const suggestions = [];

    // Add "All treatments" option at top (Fresha style)
    suggestions.push({
      type: 'all',
      id: 'all-treatments',
      title: 'All treatments',
      subtitle: '',
      icon: LayoutGrid,
      isHeader: false
    });

    // Add "Top categories" header (Fresha style)
    suggestions.push({
      type: 'header',
      id: 'top-categories-header',
      title: 'Top categories',
      subtitle: '',
      isHeader: true
    });

    // Add all categories organized by groups (Fresha style - clean names only)
    // First show popular categories
    const topCategories = popularCategories.map(category => ({
      type: 'category',
      id: category.id,
      title: category.label,
      subtitle: '',
      icon: category.icon,
      color: category.color,
      isHeader: false
    }));
    suggestions.push(...topCategories);

    // Add a "More services" header for non-popular categories
    const nonPopularCategories = serviceCategories.filter(cat => !cat.popular);
    if (nonPopularCategories.length > 0) {
      suggestions.push({
        type: 'header',
        id: 'more-services-header',
        title: 'More services',
        subtitle: '',
        isHeader: true
      });
      
      // Add all non-popular categories
      const moreCategories = nonPopularCategories.map(category => ({
        type: 'category',
        id: category.id,
        title: category.label,
        subtitle: '',
        icon: category.icon,
        color: category.color,
        isHeader: false
      }));
      suggestions.push(...moreCategories);
    }

    setAutocompleteSuggestions(suggestions);
  }, [allServices]);

  // Debounced search function for autocomplete with improved relevance
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      showPopularSuggestions();
      return;
    }

    setIsSearching(true);
    const suggestions = [];
    const queryLower = query.toLowerCase();

    try {
      // 1. Exact category matches first (highest priority)
      const exactCategoryMatches = serviceCategories.filter(category => 
        category.label.toLowerCase().includes(queryLower) || 
        category.id.toLowerCase().includes(queryLower)
      ).map(category => ({
        type: 'category',
        id: category.id,
        title: category.label,
        subtitle: `Category • ${category.group}`,
        icon: category.icon,
        color: category.color,
        relevance: category.label.toLowerCase() === queryLower ? 100 : 
                  category.label.toLowerCase().startsWith(queryLower) ? 90 : 70
      }));
      suggestions.push(...exactCategoryMatches);

      // 2. Services matching query (name or category)
      const matchingServices = allServices.filter(service => {
        const serviceName = service.name?.toLowerCase() || '';
        const serviceCategory = service.category?.toLowerCase() || '';
        const serviceDescription = service.description?.toLowerCase() || '';
        
        return serviceName.includes(queryLower) || 
               serviceCategory.includes(queryLower) ||
               serviceDescription.includes(queryLower);
      }).map(service => {
        const serviceName = service.name?.toLowerCase() || '';
        const serviceCategory = service.category?.toLowerCase() || '';
        
        // Calculate relevance score
        let relevance = 0;
        if (serviceName.startsWith(queryLower)) relevance = 95;
        else if (serviceName.includes(queryLower)) relevance = 85;
        else if (serviceCategory.includes(queryLower)) relevance = 75;
        else relevance = 60;
        
        return {
          type: 'service',
          id: service.id,
          title: service.name,
          subtitle: `Service • ₹${Math.round(service.priceInPaisa / 100)} • ${service.durationMinutes}min${service.category ? ` • ${service.category}` : ''}`,
          category: service.category,
          relevance
        };
      });
      
      // Sort services by relevance
      matchingServices.sort((a, b) => b.relevance - a.relevance);
      suggestions.push(...matchingServices.slice(0, 5));

      // 3. Salons with matching services or names
      const salonsResponse = await fetch(`/api/salons?service=${encodeURIComponent(query)}&limit=3`);
      if (salonsResponse.ok) {
        const salons = await safeParseJSON(salonsResponse);
        const salonSuggestions = (Array.isArray(salons?.results) ? salons.results.filter((salon: any) => salon && salon.id && salon.name) : []).slice(0, 3).map((salon: any) => ({
          type: 'salon',
          id: salon.id,
          title: salon.name,
          subtitle: `Salon • ${salon.address?.split(',')[0] || 'Location'} • ${salon.rating ? `${salon.rating}★` : 'New'}`,
          image: salon.image,
          relevance: salon.name?.toLowerCase().includes(queryLower) ? 80 : 60
        })) || [];
        suggestions.push(...salonSuggestions);
      }

      // Sort all suggestions by relevance and limit
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
        .slice(0, 8);
      
      setAutocompleteSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsSearching(false);
    }
  }, [allServices, showPopularSuggestions]);

  // Debounced search with cleanup
  const handleServiceInputChange = useCallback((value: string) => {
    setService(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Show autocomplete if there's input
    setShowAutocomplete(value.length > 0);
    
    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300); // 300ms delay
  }, [performSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'all') {
      // Clear search and show all results
      setService('');
      setSelectedCategories([]);
      setSpecificServices([]);
      handleSearch(); // Trigger search with no filters
    } else if (suggestion.type === 'category') {
      // Add the category to existing selections (don't override)
      setService(''); // Clear the input to show placeholder
      setSelectedCategories(prev => 
        prev.includes(suggestion.id) 
          ? prev // Don't add if already selected
          : [...prev, suggestion.id] // Add to existing selections
      );
      handleSearch(); // Auto-trigger search
    } else if (suggestion.type === 'service') {
      // Set the service name and trigger search
      setService(suggestion.title);
      setSpecificServices([suggestion.id]);
      handleSearch(); // Auto-trigger search
    } else if (suggestion.type === 'salon') {
      // Set salon name and trigger search
      setService(suggestion.title);
      handleSearch(); // Auto-trigger search
    }
    
    setShowAutocomplete(false);
    setShowMobileAutocomplete(false);
    setAutocompleteSuggestions([]);
  };

  // Handle input focus - show popular suggestions like Fresha
  const handleServiceInputFocus = () => {
    // Check if mobile view (window width < 640px)
    const isMobile = window.innerWidth < 640;
    
    if (isMobile) {
      setShowMobileAutocomplete(true);
    } else {
      setShowAutocomplete(true);
    }
    
    if (service.length === 0) {
      // Show popular suggestions when clicking empty input (Fresha-style)
      showPopularSuggestions();
    } else {
      // If there's text, perform search
      if (autocompleteSuggestions.length === 0) {
        performSearch(service);
      }
    }
  };

  // Handle input blur (with slight delay to allow clicking suggestions)
  const handleServiceInputBlur = () => {
    setTimeout(() => {
      setShowAutocomplete(false);
      // Keep mobile autocomplete open as it's controlled by the sheet
    }, 200);
  };

  // Load saved locations from API
  useEffect(() => {
    const loadSavedLocations = async () => {
      try {
        const response = await fetch('/api/user/saved-locations', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await safeParseJSON(response);
          setSavedLocations(Array.isArray(data?.savedLocations) ? data.savedLocations : []);
        } else if (response.status === 401) {
          // 401 means user not logged in - set empty array, don't log error
          setSavedLocations([]);
        } else {
          // Other errors can be logged
          console.error('Error loading saved locations:', response.status);
          setSavedLocations([]);
        }
      } catch (error) {
        console.error('Error loading saved locations:', error);
      }
    };
    
    loadSavedLocations();
  }, []);

  // Initialize popular suggestions when component mounts
  useEffect(() => {
    if (allServices.length > 0) {
      showPopularSuggestions();
    }
  }, [allServices, showPopularSuggestions]);

  // CRITICAL FIX: More flexible GPS options for better success rate
  const getGeolocationOptions = useCallback((isHighAccuracy = true) => {
    return {
      enableHighAccuracy: isHighAccuracy, // Try high accuracy first, can fallback to lower
      timeout: 30000, // 30 seconds to get GPS fix (more time for indoor/weak signal)
      maximumAge: 60000 // Allow 1 minute old cache for faster response when available
    };
  }, []);

  // Load cached location on component mount and auto-detect location for first-time users
  useEffect(() => {
    const loadCachedLocation = async () => {
      try {
        const cached = localStorage.getItem('user_location');
        if (cached) {
          const locationData = JSON.parse(cached);
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;
          
          // Use cached location if it's less than 5 minutes old and has good accuracy
          if (locationData.timestamp && (now - locationData.timestamp) < fiveMinutes && locationData.accuracy <= 50) {
            console.log('SearchBar: Loading cached location - lat:', locationData.lat, 'lng:', locationData.lng);
            setLastKnownLocation({
              lat: locationData.lat,
              lng: locationData.lng,
              timestamp: locationData.timestamp,
              accuracy: locationData.accuracy || 50
            });
            
            // CRITICAL FIX: Set coordinates from cache to trigger proximity search
            setCurrentLocationCoords({ lat: locationData.lat, lng: locationData.lng });
            setSelectedLocationCoords({ lat: locationData.lat, lng: locationData.lng });
            setLocation(locationData.address || `Current Location (±${Math.round(locationData.accuracy || 50)}m)`);
            setIsUsingCachedLocation(true);
            setCurrentLocationStatus('success');
            
            // CRITICAL FIX: Auto-trigger proximity search with cached coordinates
            console.log('SearchBar: Cached coordinates loaded, auto-triggering proximity search');
            setTimeout(() => {
              if (onSearch) {
                onSearch({
                  coordinates: { lat: locationData.lat, lng: locationData.lng },
                  radius: searchRadius,
                  service: service.trim() || undefined,
                  category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
                  sortBy: 'distance'
                });
              }
            }, 100);
            
            return; // Don't auto-detect if we have recent cached location
          }
        }
        
        // CRITICAL FIX: Auto-detect location for first-time users (with permission check)
        // Only auto-detect if permission was previously granted to avoid annoying users
        const permissionGranted = localStorage.getItem('location_permission_granted') === 'true';
        if (permissionGranted && navigator.geolocation) {
          console.log('SearchBar: Auto-detecting location on mount (permission previously granted)');
          setTimeout(() => {
            getCurrentLocation(); // Direct GPS request without modal
          }, 1000); // Small delay to let UI settle
        } else {
          console.log('SearchBar: No location permission granted yet, waiting for user interaction');
        }
        
      } catch (error) {
        console.error('Error loading cached location:', error);
      }
    };
    loadCachedLocation();
  }, [onSearch, searchRadius, service, selectedCategories]);

  // CRITICAL FIX: GPS-only detection - NO IP fallback, NO bad accuracy accepted
  const detectLocationWithFallback = useCallback(async (retryCount = 0): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      const maxRetries = 2; // Only 2 retries for GPS
      
      // ALWAYS force high accuracy GPS
      const options = getGeolocationOptions(true);
      
      console.log(`GPS attempt ${retryCount + 1} - requesting high accuracy GPS...`);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy;
          console.log(`GPS response - Accuracy: ${accuracy}m`);
          
          // More flexible accuracy requirements for better user experience
          if (accuracy <= 100) {
            // Good GPS fix (up to 100m is acceptable for salon search)
            const accuracyLevel = accuracy <= 20 ? 'Excellent' : accuracy <= 50 ? 'Good' : 'Acceptable';
            console.log(`✅ GPS success: ${accuracyLevel} accuracy`, accuracy + 'm');
            resolve(position);
          } else if (accuracy <= 500) {
            // Moderate accuracy - try once more for better, but use if needed
            if (retryCount < 1) {
              console.warn(`⚠️ Moderate accuracy ${accuracy}m - trying once more for better GPS...`);
              setTimeout(() => {
                detectLocationWithFallback(retryCount + 1).then(resolve);
              }, 3000); // Wait 3 seconds before retry
            } else {
              // Accept moderate accuracy after retry (still useful for salon search)
              console.warn('⚠️ Using moderate GPS accuracy:', accuracy + 'm');
              resolve(position);
            }
          } else {
            // Poor accuracy (likely IP geolocation)
            if (retryCount < maxRetries) {
              console.warn(`⚠️ Poor accuracy ${accuracy}m - retrying...`);
              setTimeout(() => {
                detectLocationWithFallback(retryCount + 1).then(resolve);
              }, 2000);
            } else {
              console.error('❌ GPS accuracy insufficient:', accuracy + 'm');
              resolve(null); // Fail and show manual entry
            }
          }
        },
        (error) => {
          console.error(`GPS error (attempt ${retryCount + 1}):`, error.code, error.message);
          
          // Handle specific error codes
          if (error.code === 1) {
            // Permission denied - don't retry
            console.error('❌ GPS permission denied');
            resolve(null);
          } else if (error.code === 2) {
            // Position unavailable - might be indoors
            if (retryCount < maxRetries) {
              console.log('GPS unavailable, retrying...');
              setTimeout(() => {
                detectLocationWithFallback(retryCount + 1).then(resolve);
              }, 2000);
            } else {
              console.error('❌ GPS unavailable after retries');
              resolve(null);
            }
          } else if (error.code === 3) {
            // Timeout - with 30 second timeout, don't retry
            console.error('❌ GPS timeout after 30 seconds');
            resolve(null);
          } else {
            resolve(null);
          }
        },
        options
      );
    });
  }, [getGeolocationOptions]);

  // Process location with enhanced error handling and caching
  const processLocationResult = useCallback(async (position: GeolocationPosition) => {
    try {
      const { latitude, longitude, accuracy } = position.coords;
      
      console.log('SearchBar: Setting coordinates from GPS - lat:', latitude, 'lng:', longitude);
      setCurrentLocationCoords({ lat: latitude, lng: longitude });
      setSelectedLocationCoords({ lat: latitude, lng: longitude });
      setLocationAccuracy(accuracy);
      setIsUsingCachedLocation(false);
      
      // Cache this location for future use
      const locationCache = {
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: Date.now()
      };
      setLastKnownLocation(locationCache);
      
      // Use reverse geocoding API with enhanced error handling
      try {
        const response = await fetch(`/api/places/geocode?lat=${latitude}&lng=${longitude}`);
        if (response.ok) {
          const data = await safeParseJSON(response);
          const address = (data && typeof data.address === 'string') ? data.address : `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setLocation(address);
          setCurrentLocationStatus('success');
          setShowLocationAutocomplete(false);
          
          // Save successful location to localStorage with accuracy info
          localStorage.setItem('user_location', JSON.stringify({
            address,
            lat: latitude,
            lng: longitude,
            accuracy,
            timestamp: Date.now()
          }));
          
          // Show success feedback with GPS accuracy indicator
          const accuracyLevel = accuracy <= 20 ? 'Excellent' : 
                               accuracy <= 50 ? 'Good' : 
                               accuracy <= 100 ? 'Fair' : 'Approximate';
          toast({
            title: "Location found",
            description: `Accuracy: ${accuracyLevel} (±${Math.round(accuracy)}m)`,
            duration: 2000,
          });
          
          // CRITICAL FIX: Auto-trigger proximity search after GPS coordinates are detected
          console.log('SearchBar: GPS coordinates detected, auto-triggering proximity search');
          setTimeout(() => {
            if (onSearch) {
              onSearch({
                coordinates: { lat: latitude, lng: longitude },
                radius: searchRadius,
                service: service.trim() || undefined,
                category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
                sortBy: 'distance'
              });
            }
          }, 100); // Small delay to ensure state is updated
        } else if (response.status === 503) {
          console.warn('Places API geocoding unavailable (503) - using coordinates fallback');
          const fallbackAddress = `Current Location (±${Math.round(accuracy)}m)`;
          setLocation(fallbackAddress);
          setCurrentLocationStatus('success');
          setShowLocationAutocomplete(false);
          
          // Cache with fallback address
          localStorage.setItem('user_location', JSON.stringify({
            address: fallbackAddress,
            lat: latitude,
            lng: longitude,
            accuracy,
            timestamp: Date.now()
          }));
          
          // CRITICAL FIX: Auto-trigger proximity search for fallback case too
          console.log('SearchBar: GPS coordinates detected (fallback), auto-triggering proximity search');
          setTimeout(() => {
            if (onSearch) {
              onSearch({
                coordinates: { lat: latitude, lng: longitude },
                radius: searchRadius,
                service: service.trim() || undefined,
                category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
                sortBy: 'distance'
              });
            }
          }, 100);
        } else {
          // Fallback if reverse geocoding fails
          const fallbackAddress = `Current Location (±${Math.round(accuracy)}m)`;
          setLocation(fallbackAddress);
          setCurrentLocationStatus('success');
          setShowLocationAutocomplete(false);
          
          // CRITICAL FIX: Auto-trigger proximity search for error fallback case too
          console.log('SearchBar: GPS coordinates detected (error fallback), auto-triggering proximity search');
          setTimeout(() => {
            if (onSearch) {
              onSearch({
                coordinates: { lat: latitude, lng: longitude },
                radius: searchRadius,
                service: service.trim() || undefined,
                category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
                sortBy: 'distance'
              });
            }
          }, 100);
        }
      } catch (reverseGeoError) {
        console.error('Error reverse geocoding:', reverseGeoError);
        const fallbackAddress = `Current Location (±${Math.round(accuracy)}m)`;
        setLocation(fallbackAddress);
        setCurrentLocationStatus('success');
        setShowLocationAutocomplete(false);
        
        // CRITICAL FIX: Auto-trigger proximity search for catch error case too
        console.log('SearchBar: GPS coordinates detected (catch error), auto-triggering proximity search');
        setTimeout(() => {
          if (onSearch) {
            onSearch({
              coordinates: { lat: latitude, lng: longitude },
              radius: searchRadius,
              service: service.trim() || undefined,
              category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
              sortBy: 'distance'
            });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error processing location:', error);
      setCurrentLocationStatus('error');
      setLocation('Unable to process location');
    }
  }, [toast]);

  // Clean up location watch when component unmounts
  useEffect(() => {
    return () => {
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  // CRITICAL FIX: Improved GPS detection with permission check and better UX
  const getCurrentLocation = useCallback(async () => {
    console.log('🎯 Starting GPS location detection...');
    setCurrentLocationStatus('detecting');
    setLocationRetryCount(0);
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setCurrentLocationStatus('error');
      setLocation('');
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services. Please enter your address manually.",
        variant: "default",
        duration: 5000,
      });
      setShowLocationAutocomplete(true);
      return;
    }
    
    // Check permission status first if available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('Permission status:', permission.state);
        
        if (permission.state === 'denied') {
          setCurrentLocationStatus('error');
          setLocation('');
          toast({
            title: "Location access blocked",
            description: "Please enable location access in your browser settings to use GPS, or enter your address manually.",
            variant: "default",
            duration: 6000,
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowLocationAutocomplete(true)}
              >
                Enter Address
              </Button>
            )
          });
          setShowLocationAutocomplete(true);
          return;
        }
      } catch (permError) {
        console.warn('Permission API not fully supported:', permError);
      }
    }
    
    // Show user we're getting GPS with longer timeout info
    toast({
      title: "📍 Getting your location...",
      description: "This may take up to 30 seconds, especially indoors.",
      duration: 5000,
    });
    
    try {
      // Attempt GPS location detection with flexible settings
      const position = await detectLocationWithFallback(0);
      
      if (position) {
        // GPS succeeded!
        await processLocationResult(position);
        setLocationRetryCount(0);
      } else {
        // GPS failed - show helpful message
        console.error('❌ GPS detection failed');
        throw new Error('GPS not available');
      }
    } catch (error: any) {
      console.error('❌ Location failed:', error);
      setCurrentLocationStatus('error');
      setLocation('');
      
      // Clear any bad coordinates
      setCurrentLocationCoords(null);
      setSelectedLocationCoords(null);
      setLocationAccuracy(null);
      
      // Determine specific error message
      let errorTitle = "Unable to get GPS signal";
      let errorDescription = "Please enter your address manually to find nearby salons.";
      
      if (error.message?.includes('timeout')) {
        errorTitle = "GPS is taking longer than expected";
        errorDescription = "The GPS signal is weak. Please try again or enter your address manually.";
      } else if (error.message?.includes('permission')) {
        errorTitle = "Location permission required";
        errorDescription = "Please allow location access when prompted, or enter your address manually.";
      }
      
      // Show clear, non-blocking error message
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "default",
        duration: 6000,
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowLocationAutocomplete(true)}
          >
            Enter Address Instead
          </Button>
        )
      });
      
      // Automatically open location input for manual entry
      setShowLocationAutocomplete(true);
    }
  }, [detectLocationWithFallback, processLocationResult, toast]);

  // CRITICAL FIX: Direct GPS request without blocking modal
  const handleLocationPermissionAllow = useCallback(() => {
    console.log('✅ User clicked Allow - requesting GPS from browser...');
    setLocationPermissionStatus('checking');
    setShowLocationPermissionModal(false);
    
    // Mark permission as potentially granted
    localStorage.setItem('location_permission_granted', 'true');
    
    // Request GPS directly
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Handle location permission modal - Deny access
  const handleLocationPermissionDeny = useCallback(() => {
    setShowLocationPermissionModal(false);
    setLocationPermissionStatus('idle');
    
    // Show helpful message about manual entry
    toast({
      title: "No problem!",
      description: "You can manually enter your address to find nearby salons and spas.",
      duration: 4000,
    });
    
    // Open location input for manual entry
    setShowLocationAutocomplete(true);
  }, [toast]);

  // CRITICAL FIX: Direct GPS request without modal
  const requestLocationPermission = useCallback(() => {
    console.log('🎯 Requesting GPS location directly...');
    
    // Store that user attempted to get location
    localStorage.setItem('location_attempt_timestamp', Date.now().toString());
    
    // Request GPS directly without showing modal first
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Save location using backend API
  const saveLocation = useCallback(async (type: 'home' | 'work', address: string, coords?: {lat: number, lng: number}) => {
    try {
      // Use current location coordinates if available, otherwise try to geocode
      let locationCoords = coords || currentLocationCoords;
      
      if (!locationCoords) {
        // Try to geocode the address to get coordinates
        try {
          const geocodeResponse = await fetch(`/api/places/geocode?address=${encodeURIComponent(address)}`);
          if (geocodeResponse.ok) {
            const geocodeData = await safeParseJSON(geocodeResponse);
            locationCoords = (geocodeData && typeof geocodeData.lat === 'number' && typeof geocodeData.lng === 'number') 
              ? { lat: geocodeData.lat, lng: geocodeData.lng } 
              : null;
          } else if (geocodeResponse.status === 503) {
            console.warn('Places API geocoding unavailable (503) - proceeding without coordinates');
            // Proceed without coordinates when Places API unavailable
          }
        } catch (error) {
          console.error('Error geocoding address:', error);
        }
      }
      
      const locationData = {
        label: type,
        name: type === 'home' ? 'Home' : 'Office',
        address,
        latitude: locationCoords?.lat?.toString() || '0',
        longitude: locationCoords?.lng?.toString() || '0'
      };

      const response = await fetch('/api/user/saved-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(locationData)
      });

      if (response.ok) {
        const data = await safeParseJSON(response);
        // Refresh saved locations
        const refreshResponse = await fetch('/api/user/saved-locations', {
          credentials: 'include'
        });
        if (refreshResponse.ok) {
          const refreshData = await safeParseJSON(refreshResponse);
          setSavedLocations(Array.isArray(refreshData?.savedLocations) ? refreshData.savedLocations : []);
        }
        
        setLocation(address);
        setSelectedLocationCoords(locationCoords);
        setShowLocationAutocomplete(false);
        
        // Show success feedback
        toast({
          title: "Location saved",
          description: `Your ${type === 'home' ? 'home' : 'work'} address has been saved.`,
        });
      } else if (response.status === 401) {
        // User not logged in, fall back to localStorage and show helpful message
        const newLocation = {
          id: type,
          type,
          label: type === 'home' ? 'Home' : 'Office',
          address,
          icon: type === 'home' ? Home : Building2
        };
        
        const updatedLocations = savedLocations.filter((loc: any) => loc.type !== type);
        updatedLocations.push(newLocation);
        setSavedLocations(updatedLocations);
        localStorage.setItem('salonhub_saved_locations', JSON.stringify(updatedLocations));
        setLocation(address);
        setShowLocationAutocomplete(false);
        
        // Show user-friendly message for authentication issue
        toast({
          title: "Please log in to save addresses",
          description: "Your address is still saved locally and can be used for searching. Sign in to save it permanently.",
          variant: "default",
        });
      } else {
        // CRITICAL FIX: Preserve the location field on other errors
        console.error('Error saving location:', response.status);
        setLocation(address); // Keep the address in the field
        setShowLocationAutocomplete(false);
        
        // Show error feedback but keep the address
        toast({
          title: "Failed to save location",
          description: "There was an error saving your address, but you can still use it for searching.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving location:', error);
      // CRITICAL FIX: Always preserve the location field in error scenarios
      setLocation(address);
      setShowLocationAutocomplete(false);
      
      // Fallback to localStorage
      const newLocation = {
        id: type,
        type,
        label: type === 'home' ? 'Home' : 'Office',
        address,
        icon: type === 'home' ? Home : Building2
      };
      
      const updatedLocations = savedLocations.filter((loc: any) => loc.type !== type);
      updatedLocations.push(newLocation);
      setSavedLocations(updatedLocations);
      localStorage.setItem('salonhub_saved_locations', JSON.stringify(updatedLocations));
      
      // Show user-friendly error message
      toast({
        title: "Connection error",
        description: "Your address is saved locally and can be used for searching. Please try again later to save it permanently.",
        variant: "default",
      });
    }
  }, [savedLocations, currentLocationCoords]);

  // Location search function using real Places API
  const performLocationSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setIsLocationSearching(false);
      return;
    }

    setIsLocationSearching(true);

    try {
      // Build API request with bias if current location is available
      let apiUrl = `/api/places/autocomplete?q=${encodeURIComponent(query)}&limit=8`;
      
      if (currentLocationCoords) {
        apiUrl += `&lat=${currentLocationCoords.lat}&lng=${currentLocationCoords.lng}`;
      }

      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await safeParseJSON(response);
        const suggestions = (Array.isArray(data?.suggestions) ? data.suggestions : []).map((suggestion: any) => ({
          type: 'location',
          id: suggestion.id,
          title: suggestion.title,
          subtitle: suggestion.subtitle || 'Address',
          address: suggestion.title,
          lat: suggestion.lat,
          lng: suggestion.lng
        })) || [];
        
        setLocationSuggestions(suggestions);
      } else if (response.status === 503) {
        console.warn('Places API service unavailable (503) - showing fallback');
        // Places API unavailable, show fallback message with better UX
        setLocationSuggestions([{
          type: 'service_unavailable',
          id: 'places-unavailable',
          title: 'Location search temporarily unavailable',
          subtitle: 'Please type your full address manually',
          fallback: true
        }]);
      } else {
        console.error('Places API error:', response.status);
        setLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Error performing location search:', error);
      // Show fallback option
      setLocationSuggestions([{
        type: 'error',
        id: 'search-error',
        title: 'Unable to search addresses',
        subtitle: 'Please check your connection and try again',
        address: ''
      }]);
    } finally {
      setIsLocationSearching(false);
    }
  }, [currentLocationCoords]);

  // Debounced location search
  const handleLocationInputChange = useCallback((value: string) => {
    setLocation(value);
    
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }
    
    setShowLocationAutocomplete(value.length > 0 || true); // Always show for empty too
    
    locationTimeoutRef.current = setTimeout(() => {
      performLocationSearch(value);
    }, 300);
  }, [performLocationSearch]);

  // Show location suggestions on focus
  const handleLocationInputFocus = () => {
    setShowLocationAutocomplete(true);
    if (location.length === 0) {
      // Show saved locations and current location option
      const suggestions = [];
      
      // Only show current location if permission was previously granted
      if (localStorage.getItem('location_permission_granted') === 'true') {
        suggestions.push({
          type: 'current',
          id: 'current-location', 
          title: 'Use current location',
          subtitle: 'Find salons near you',
          icon: Navigation
        });
      }
      
      // Add saved locations
      savedLocations.forEach(savedLoc => {
        suggestions.push({
          type: 'saved',
          id: savedLoc.id,
          title: savedLoc.label,
          subtitle: savedLoc.address,
          icon: savedLoc.icon,
          address: savedLoc.address
        });
      });
      
      // Add "Add Home" and "Add Work" if not already saved
      if (!savedLocations.find(loc => loc.type === 'home')) {
        suggestions.push({
          type: 'add-saved',
          id: 'add-home',
          title: 'Add Home',
          subtitle: 'Save your home address',
          icon: Home,
          saveType: 'home'
        });
      }
      
      if (!savedLocations.find(loc => loc.type === 'work')) {
        suggestions.push({
          type: 'add-saved',
          id: 'add-work',
          title: 'Add Work',
          subtitle: 'Save your work address',
          icon: Building2,
          saveType: 'work'
        });
      }
      
      // Always show current location option
      suggestions.push({
        type: 'current',
        id: 'current-location',
        title: 'Use current location',
        subtitle: 'Find salons near you',
        icon: Navigation
      });
      
      // Add options to save new locations if no saved locations exist
      if (savedLocations.length === 0) {
        suggestions.push({
          type: 'add-saved',
          id: 'add-home',
          title: 'Add home address',
          subtitle: 'Save your home location for easy access',
          icon: Home,
          saveType: 'home'
        });
        
        suggestions.push({
          type: 'add-saved',
          id: 'add-work',
          title: 'Add work address',
          subtitle: 'Save your work location for easy access',
          icon: Building2,
          saveType: 'work'
        });
      }
      
      setLocationSuggestions(suggestions);
    } else {
      performLocationSearch(location);
    }
  };

  // Handle location suggestion selection
  const handleLocationSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'current') {
      requestLocationPermission();
    } else if (suggestion.type === 'saved') {
      setLocation(suggestion.address);
      // Set coordinates if available from saved location
      if (suggestion.latitude && suggestion.longitude) {
        setSelectedLocationCoords({
          lat: parseFloat(suggestion.latitude),
          lng: parseFloat(suggestion.longitude)
        });
      }
      setShowLocationAutocomplete(false);
    } else if (suggestion.type === 'add-saved') {
      // Open professional modal instead of browser prompt
      setLocationModalType(suggestion.saveType as 'home' | 'work');
      setLocationModalValue('');
      setShowLocationModal(true);
      setShowLocationAutocomplete(false);
    } else if (suggestion.type === 'location') {
      setLocation(suggestion.address);
      // Store coordinates from the Places API response
      if (suggestion.lat && suggestion.lng) {
        console.log('SearchBar: Setting coordinates from Places API - lat:', suggestion.lat, 'lng:', suggestion.lng);
        setSelectedLocationCoords({
          lat: suggestion.lat,
          lng: suggestion.lng
        });
      }
      setShowLocationAutocomplete(false);
    } else if (suggestion.type === 'error') {
      // Don't do anything for error suggestions, they're just informational
      return;
    }
  };

  // Handle location input blur
  const handleLocationInputBlur = () => {
    setTimeout(() => {
      setShowLocationAutocomplete(false);
    }, 200);
  };

  // Date picker functions
  const getDateDisplayText = () => {
    if (selectedDateType === 'any') return 'Any Date';
    if (selectedDateType === 'today') return 'Today';
    if (selectedDateType === 'tomorrow') return 'Tomorrow';
    if (selectedDateType === 'specific' && selectedDate) {
      return selectedDate.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    return 'Any Date';
  };

  const handleDateTypeSelect = (type: 'any' | 'today' | 'tomorrow') => {
    setSelectedDateType(type);
    if (type === 'today') {
      setSelectedDate(new Date());
      setDate(new Date().toISOString().split('T')[0]);
    } else if (type === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
      setDate(tomorrow.toISOString().split('T')[0]);
    } else {
      setSelectedDate(null);
      setDate('');
    }
    setShowDatePicker(false);
  };

  const handleSpecificDateSelect = (date: Date) => {
    setSelectedDateType('specific');
    setSelectedDate(date);
    setDate(date.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push(currentDate);
    }
    return days;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDateInCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  const isDateToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDatePickerBlur = () => {
    setTimeout(() => {
      setShowDatePicker(false);
    }, 200);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSearch = async () => {
    try {
      console.log('SearchBar: handleSearch called with selectedLocationCoords:', selectedLocationCoords);
      console.log('SearchBar: currentLocationCoords:', currentLocationCoords);
      console.log('SearchBar: location string:', location);
      
      // Use proximity search if location coordinates are available
      if (selectedLocationCoords) {
        console.log('SearchBar: Using proximity search with coordinates:', selectedLocationCoords, 'radius:', searchRadius);
        // Build proximity search parameters
        const searchParams = new URLSearchParams();
        searchParams.append('lat', selectedLocationCoords.lat.toString());
        searchParams.append('lng', selectedLocationCoords.lng.toString());
        searchParams.append('radiusKm', searchRadius.toString());
        
        if (service.trim()) {
          searchParams.append('q', service.trim());
        }
        
        if (selectedCategories.length > 0) {
          // Map category IDs to readable category names for search
          const categoryNames = selectedCategories.map(id => {
            const category = serviceCategories.find(cat => cat.id === id);
            return category?.label || id;
          });
          searchParams.append('category', categoryNames[0]); // API takes single category
        }
        
        if (sortBy && sortBy !== "best-match") {
          const sortMapping: Record<string, string> = {
            'distance': 'distance',
            'rating': 'rating', 
            'name': 'name',
            'price-low': 'distance', // Default to distance for now
            'price-high': 'distance'
          };
          searchParams.append('sort', sortMapping[sortBy] || 'distance');
        } else {
          searchParams.append('sort', 'distance');
        }

        // Trigger onSearch callback with proximity search parameters
        console.log('SearchBar: Calling onSearch with proximity search params:', {
          coordinates: selectedLocationCoords,
          radius: searchRadius,
          service: service.trim() || undefined,
          category: selectedCategories.length > 0 ? selectedCategories[0] : undefined
        });
        if (onSearch) {
          onSearch({
            coordinates: selectedLocationCoords,
            radius: searchRadius,
            service: service.trim() || undefined,
            category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
            sortBy: sortBy !== "best-match" ? sortBy : undefined,
            filters: {
              priceRange: (priceRange[0] > 0 || priceRange[1] < 5000) ? priceRange as [number, number] : undefined,
              minRating: minRating > 0 ? minRating : undefined,
              availableToday: availableToday || undefined,
              specificServices: specificServices.length > 0 ? specificServices : undefined
            }
          });
        }
      } else {
        // Fall back to regular search without proximity
        const searchParams = new URLSearchParams();
        
        if (service.trim()) {
          searchParams.append('service', service.trim());
        }
        
        if (location.trim()) {
          searchParams.append('location', location.trim());
        }
        
        if (selectedCategories.length > 0) {
          // Map category IDs to readable category names for search
          const categoryNames = selectedCategories.map(id => {
            const category = serviceCategories.find(cat => cat.id === id);
            return category?.label || id;
          });
          searchParams.append('categories', categoryNames.join(','));
        }
        
        if (priceRange[0] > 0) {
          searchParams.append('minPrice', priceRange[0].toString());
        }
        
        if (priceRange[1] < 5000) {
          searchParams.append('maxPrice', priceRange[1].toString());
        }
        
        if (minRating > 0) {
          searchParams.append('minRating', minRating.toString());
        }

        if (sortBy && sortBy !== "best-match") {
          searchParams.append('sortBy', sortBy);
        }

        if (availableToday) {
          searchParams.append('availableToday', 'true');
        }

        if (specificServices.length > 0) {
          searchParams.append('services', specificServices.join(','));
        }

        // Trigger onSearch callback with regular search parameters
        console.log('SearchBar: Calling onSearch with regular search params (no coordinates)');
        if (onSearch) {
          onSearch({
            service: service.trim() || undefined,
            category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
            sortBy: sortBy !== "best-match" ? sortBy : undefined,
            filters: {
              priceRange: (priceRange[0] > 0 || priceRange[1] < 5000) ? priceRange as [number, number] : undefined,
              minRating: minRating > 0 ? minRating : undefined,
              availableToday: availableToday || undefined,
              specificServices: specificServices.length > 0 ? specificServices : undefined
            }
          });
        }
      }
      
    } catch (error) {
      console.error('Search error:', error);
      // You may want to show an error toast here
      throw error;
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 5000]);
    setMinRating(0);
    setSortBy("best-match");
    setAvailableToday(false);
    setSpecificServices([]);
  };

  // Handle location modal save
  const handleLocationModalSave = () => {
    if (locationModalValue.trim()) {
      const address = locationModalValue.trim();
      
      // AUTHENTICATION CHECK: Provide proactive feedback for unauthenticated users
      if (!authLoading && !isAuthenticated) {
        // Still set the location in the field so user can use it for searching
        setLocation(address);
        setShowLocationModal(false);
        setLocationModalValue('');
        
        // Show helpful message without attempting API call
        toast({
          title: "Please log in to save addresses",
          description: "Your address is ready to use for searching. Sign in to save it permanently to your account.",
          variant: "default",
        });
        return;
      }
      
      // User is authenticated, proceed with normal save
      saveLocation(locationModalType, address);
      setShowLocationModal(false);
      setLocationModalValue('');
    }
  };

  // Handle location modal cancel
  const handleLocationModalCancel = () => {
    setShowLocationModal(false);
    setLocationModalValue('');
    setModalLocationSuggestions([]);
    setShowModalLocationSuggestions(false);
  };

  // Modal location search function
  const performModalLocationSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setModalLocationSuggestions([]);
      setShowModalLocationSuggestions(false);
      return;
    }

    setIsModalLocationSearching(true);
    setShowModalLocationSuggestions(true);

    try {
      // Use the real Places API for address autocomplete
      let apiUrl = `/api/places/autocomplete?q=${encodeURIComponent(query)}&limit=8`;
      
      // Add location bias if current location is available
      if (currentLocationCoords) {
        apiUrl += `&lat=${currentLocationCoords.lat}&lng=${currentLocationCoords.lng}`;
      }

      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await safeParseJSON(response);
        const suggestions = data?.suggestions?.map((suggestion: any) => ({
          id: suggestion.id,
          title: suggestion.title,
          subtitle: suggestion.subtitle || 'Address',
          address: suggestion.title,
          lat: suggestion.lat,
          lng: suggestion.lng
        })) || [];
        
        setModalLocationSuggestions(suggestions);
      } else if (response.status === 503) {
        // Places API unavailable - show helpful message
        setModalLocationSuggestions([{
          id: 'error-service-unavailable',
          title: 'Address search temporarily unavailable',
          subtitle: 'Please try typing a complete address',
          address: '',
          isError: true
        }]);
      } else {
        // Other API error
        console.error('Places API error:', response.status);
        setModalLocationSuggestions([]);
      }
    } catch (error) {
      console.error('Error performing modal location search:', error);
      setModalLocationSuggestions([{
        id: 'error-network',
        title: 'Unable to search addresses',
        subtitle: 'Please check your connection and try again',
        address: '',
        isError: true
      }]);
    } finally {
      setIsModalLocationSearching(false);
    }
  }, [currentLocationCoords]);

  // Handle modal location input change
  const handleModalLocationInputChange = (value: string) => {
    setLocationModalValue(value);
    
    if (modalLocationTimeoutRef.current) {
      clearTimeout(modalLocationTimeoutRef.current);
    }
    
    modalLocationTimeoutRef.current = setTimeout(() => {
      performModalLocationSearch(value);
    }, 300);
  };

  // Handle modal location suggestion select
  const handleModalLocationSuggestionSelect = (suggestion: any) => {
    setLocationModalValue(suggestion.address);
    setShowModalLocationSuggestions(false);
    setModalLocationSuggestions([]);
  };

  const hasActiveFilters = service.trim().length > 0 || selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000 || minRating > 0 || (sortBy && sortBy !== "best-match") || availableToday || specificServices.length > 0;

  return (
    <div className="bg-white dark:bg-card p-3 sm:p-6 rounded-xl shadow-lg max-w-6xl mx-auto">
      {/* Mobile-first Responsive Search Bar */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl sm:rounded-full min-h-11 p-2 sm:p-1 gap-2 sm:gap-1">
          {/* Service Input Segment */}
          <div className="relative flex-1 w-full sm:min-w-0">
            <div className="flex items-center h-12 sm:h-9 px-4 rounded-xl sm:rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground mr-2 group-focus-within:text-primary transition-colors" />
              <Input
                value={service}
                onChange={(e) => handleServiceInputChange(e.target.value)}
                onFocus={handleServiceInputFocus}
                onBlur={handleServiceInputBlur}
                placeholder={selectedCategories.length > 0 ? "Search more..." : "Search treatments, salons..."}
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/70 text-sm"
                data-testid="input-service"
              />
            </div>
            
            {/* Service Autocomplete Dropdown - Desktop only */}
            {showAutocomplete && !window.matchMedia('(max-width: 640px)').matches && (
              <div className="absolute top-full left-0 right-0 sm:right-auto mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto w-full sm:w-80">
                {isSearching && (
                  <div className="py-3 px-3 text-muted-foreground text-sm flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </div>
                )}
                
                {!isSearching && autocompleteSuggestions.length > 0 && (
                  <div className="py-1">
                    {autocompleteSuggestions.map((suggestion, index) => {
                      const IconComponent = suggestion.icon;
                      
                      // Render header differently (Fresha style)
                      if (suggestion.isHeader) {
                        return (
                          <div key={`${suggestion.type}-${suggestion.id}-${index}`} className="px-3 py-2 text-sm font-medium text-muted-foreground text-left">
                            {suggestion.title}
                          </div>
                        );
                      }
                      
                      return (
                        <div
                          key={`${suggestion.type}-${suggestion.id}-${index}`}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors text-left"
                          onClick={() => handleSuggestionSelect(suggestion)}
                          data-testid={`suggestion-${suggestion.type}-${suggestion.id}`}
                        >
                          {IconComponent && (
                            <div className={`p-1.5 rounded flex items-center justify-center w-8 h-8 ${suggestion.color || 'bg-primary/10 text-primary'}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm leading-tight text-foreground text-left">{suggestion.title}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {!isSearching && autocompleteSuggestions.length === 0 && (
                  <div className="py-3 px-3 text-muted-foreground text-sm text-center">
                    No suggestions found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Separator - Hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-border"></div>

          {/* Location Input Segment */}
          <div className="relative flex-1 w-full sm:min-w-0">
            <div className="flex items-center h-12 sm:h-9 px-4 rounded-xl sm:rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mr-2 group-focus-within:text-primary transition-colors" />
              <Input
                value={location}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onFocus={handleLocationInputFocus}
                onBlur={handleLocationInputBlur}
                placeholder="Current location"
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/70 text-sm"
                data-testid="input-location"
              />
              {currentLocationStatus === 'detecting' && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2"></div>
              )}
            </div>
            
            {/* Location Autocomplete Dropdown - Mobile-first design */}
            {showLocationAutocomplete && (
              <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto w-full sm:w-72 sm:max-w-[280px]">
                {isLocationSearching && (
                  <div className="py-3 px-3 text-muted-foreground text-sm flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Searching locations...
                  </div>
                )}
                
                {!isLocationSearching && locationSuggestions.length > 0 && (
                  <div className="py-1">
                    {locationSuggestions.map((suggestion, index) => {
                      const IconComponent = suggestion.icon || MapPin;
                      return (
                        <div
                          key={`${suggestion.type}-${suggestion.id}-${index}`}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleLocationSuggestionSelect(suggestion)}
                          data-testid={`location-suggestion-${suggestion.type}-${suggestion.id}`}
                        >
                          {suggestion.type === 'current' && (
                            <div className="p-1 rounded flex items-center justify-center w-6 h-6 bg-blue-500/10 text-blue-700 dark:text-blue-300">
                              <Navigation className="h-3 w-3" />
                            </div>
                          )}
                          {suggestion.type === 'saved' && (
                            <div className="p-1 rounded flex items-center justify-center w-6 h-6 bg-green-500/10 text-green-700 dark:text-green-300">
                              <IconComponent className="h-3 w-3" />
                            </div>
                          )}
                          {suggestion.type === 'add-saved' && (
                            <div className="p-1 rounded flex items-center justify-center w-6 h-6 bg-gray-500/10 text-gray-700 dark:text-gray-300">
                              <IconComponent className="h-3 w-3" />
                            </div>
                          )}
                          {suggestion.type === 'location' && (
                            <div className="p-1 rounded flex items-center justify-center w-6 h-6 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                              <MapPin className="h-3 w-3" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium text-sm leading-tight text-left">{suggestion.title}</div>
                            <div className="text-xs text-muted-foreground leading-tight text-left">{suggestion.subtitle}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {!isLocationSearching && locationSuggestions.length === 0 && (
                  <div className="py-3 px-3 text-muted-foreground text-sm text-left">
                    No locations found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Separator - Hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-border"></div>

          {/* Date Input Segment */}
          <div className="relative w-full sm:w-auto">
            <div className="flex items-center h-12 sm:h-9 px-4 rounded-xl sm:rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm">
              <Calendar className="h-4 w-4 text-muted-foreground mr-2 group-focus-within:text-primary transition-colors" />
              <Button
                variant="ghost"
                data-testid="button-date-picker"
                onClick={() => setShowDatePicker(!showDatePicker)}
                onBlur={handleDatePickerBlur}
                className="p-0 h-auto font-normal text-sm text-muted-foreground/70 hover:bg-transparent focus-visible:ring-0 border-0"
              >
                {getDateDisplayText()}
              </Button>
            </div>
            
            {/* Date Picker Dropdown - Mobile-first design */}
            {showDatePicker && (
              <div className="absolute top-full left-0 right-0 sm:right-auto mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 w-full sm:min-w-[320px]">
                {/* Quick Date Options */}
                <div className="flex gap-2 mb-4">
                  <Button
                    size="sm"
                    variant={selectedDateType === 'any' ? 'default' : 'outline'}
                    onClick={() => handleDateTypeSelect('any')}
                    data-testid="button-any-date"
                    className="flex-1 text-foreground border-border hover:bg-muted"
                  >
                    Any date
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDateType === 'today' ? 'default' : 'outline'}
                    onClick={() => handleDateTypeSelect('today')}
                    data-testid="button-today"
                    className="flex-1 text-foreground border-border hover:bg-muted"
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDateType === 'tomorrow' ? 'default' : 'outline'}
                    onClick={() => handleDateTypeSelect('tomorrow')}
                    data-testid="button-tomorrow"
                    className="flex-1 text-foreground border-border hover:bg-muted"
                  >
                    Tomorrow
                  </Button>
                </div>
                
                {/* Calendar Widget */}
                <div className="space-y-3">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      data-testid="button-prev-month"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </Button>
                    <h3 className="font-medium">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      data-testid="button-next-month"
                    >
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Button>
                  </div>
                  
                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {/* Day Headers */}
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="text-xs font-medium text-muted-foreground p-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar Days */}
                    {getDaysInMonth(currentMonth).map((date, index) => {
                      const isToday = isDateToday(date);
                      const isSelected = isDateSelected(date);
                      const isCurrentMonth = isDateInCurrentMonth(date);
                      const isPast = date < new Date() && !isToday;
                      
                      return (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          disabled={isPast}
                          onClick={() => !isPast && handleSpecificDateSelect(date)}
                          data-testid={`button-date-${date.getDate()}`}
                          className={`
                            h-8 w-8 p-0 text-sm transition-colors
                            ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                            ${isToday ? 'bg-primary/10 text-primary font-semibold' : ''}
                            ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                            ${isPast ? 'text-muted-foreground/30 cursor-not-allowed' : ''}
                            ${!isPast && !isSelected ? 'hover:bg-muted' : ''}
                          `}
                        >
                          {date.getDate()}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Time Segment - Hidden on small mobile, shown from sm up */}
          <div className="hidden sm:flex items-center h-9 px-4 rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group">
            <Clock className="h-4 w-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground/70">Any time</span>
          </div>

          {/* Separator - Hidden on mobile */}
          <div className="hidden sm:block w-px h-6 bg-border"></div>

          {/* Filters Segment */}
          <div className="relative w-full sm:w-auto">
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <div className="flex items-center justify-center h-12 sm:h-9 px-4 rounded-xl sm:rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group cursor-pointer">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground/70">Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground">
                      {(service.trim().length > 0 && specificServices.length === 0 && !selectedCategories.some(id => {
                         const category = serviceCategories.find(c => c.id === id);
                         return category && service.toLowerCase() === category.label.toLowerCase();
                       }) ? 1 : 0) +
                       selectedCategories.length + 
                       (priceRange[0] > 0 || priceRange[1] < 5000 ? 1 : 0) + 
                       (minRating > 0 ? 1 : 0) + 
                       (sortBy && sortBy !== "best-match" ? 1 : 0) + 
                       (availableToday ? 1 : 0) + 
                       specificServices.length}
                    </Badge>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        data-testid="button-clear-filters"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Categories Filter - Moved from popular categories */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Categories</label>
                    <div className="grid grid-cols-2 gap-2">
                      {serviceCategories.map((category) => {
                        const Icon = category.icon;
                        const isSelected = selectedCategories.includes(category.id);
                        return (
                          <Button
                            key={category.id}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCategoryToggle(category.id)}
                            data-testid={`button-category-${category.id}`}
                            className="h-auto p-2 justify-start gap-2"
                          >
                            <Icon className="h-3 w-3" />
                            <span className="text-xs truncate">{category.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Price range</label>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={5000}
                        step={50}
                        className="w-full"
                        data-testid="slider-price-range"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}{priceRange[1] === 5000 ? '+' : ''}</span>
                    </div>
                  </div>

                  {/* Search Radius - Only show when location coordinates are available */}
                  {selectedLocationCoords && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        Search radius
                        <span className="text-xs text-muted-foreground">
                          ({formatDistance(searchRadius)})
                        </span>
                      </label>
                      
                      {/* Radius Preset Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {radiusPresets.map((preset) => (
                          <Button
                            key={preset.value}
                            variant={searchRadius === preset.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSearchRadius(preset.value)}
                            className="h-auto py-2 px-3 flex flex-col items-center gap-1 text-xs"
                            data-testid={`button-radius-${preset.label}`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-base">{preset.icon}</span>
                              <span className="font-medium">{preset.label}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground leading-none">
                              {preset.description}
                            </span>
                          </Button>
                        ))}
                      </div>
                      
                      {/* Current Selection Display */}
                      <div className="text-center p-2 bg-muted/50 rounded-md">
                        <span className="text-xs text-muted-foreground">
                          Finding salons within <span className="font-medium text-primary">{formatDistance(searchRadius)}</span> of your location
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Rating Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Minimum rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant={minRating >= rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                          className="flex-1 gap-1"
                          data-testid={`button-rating-${rating}`}
                        >
                          <Star className={`h-3 w-3 ${minRating >= rating ? 'fill-current' : ''}`} />
                          {rating}
                        </Button>
                      ))}
                    </div>
                    {minRating > 0 && (
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-3 w-3 ${star <= minRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span>and above</span>
                      </div>
                    )}
                  </div>

                  {/* Sorting Options */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Sort by</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger data-testid="select-sort-by">
                        <SelectValue placeholder="Choose sorting..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best-match">Best match</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="distance">Nearest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="available-today" 
                        checked={availableToday}
                        onCheckedChange={(checked) => setAvailableToday(!!checked)}
                        data-testid="checkbox-available-today"
                      />
                      <label htmlFor="available-today" className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Available today
                      </label>
                    </div>
                  </div>

                  {/* Specific Services Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Specific services</label>
                    <Popover open={showServicesFilter} onOpenChange={setShowServicesFilter}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between" data-testid="button-specific-services">
                          <span>
                            {specificServices.length > 0 
                              ? `${specificServices.length} service${specificServices.length > 1 ? 's' : ''} selected`
                              : 'Select services...'
                            }
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search services..." data-testid="input-service-search" />
                          <CommandList>
                            <CommandEmpty>No services found.</CommandEmpty>
                            <ScrollArea className="max-h-60">
                              <CommandGroup>
                                {allServices.map((service) => {
                                  const isSelected = specificServices.includes(service.id);
                                  return (
                                    <CommandItem
                                      key={service.id}
                                      onSelect={() => {
                                        setSpecificServices(prev => 
                                          isSelected 
                                            ? prev.filter(id => id !== service.id)
                                            : [...prev, service.id]
                                        );
                                      }}
                                      data-testid={`command-item-service-${service.id}`}
                                      className="flex items-center gap-2"
                                    >
                                      <div className={`flex items-center justify-center w-4 h-4 rounded border ${
                                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                      }`}>
                                        {isSelected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-medium">{service.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          ₹{Math.round(service.priceInPaisa / 100)} • {service.durationMinutes}min
                                          {service.category && ` • ${service.category}`}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </ScrollArea>
                          </CommandList>
                          <div className="p-3 border-t">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSpecificServices([])}
                                className="flex-1"
                                data-testid="button-clear-services"
                              >
                                Clear all
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setShowServicesFilter(false)}
                                className="flex-1"
                                data-testid="button-apply-services"
                              >
                                Done ({specificServices.length})
                              </Button>
                            </div>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border"></div>

          {/* Search Button */}
          <Button 
            data-testid="button-search"
            onClick={handleSearch}
            className="h-9 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-full transition-colors"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Active Filters Display - Mobile-first with horizontal scrolling */}
      {hasActiveFilters && (
        <div className="flex gap-2 pt-4 mt-4 border-t border-border overflow-x-auto sm:flex-wrap sm:overflow-x-visible scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {/* Service Search Term */}
          {service.trim().length > 0 && 
           specificServices.length === 0 && 
           !selectedCategories.some(id => {
             const category = serviceCategories.find(c => c.id === id);
             return category && service.toLowerCase() === category.label.toLowerCase();
           }) && (
            <Badge
              variant="secondary"
              className="gap-1"
              data-testid="badge-active-query"
            >
              <Search className="h-3 w-3" />
              Search: {service}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  setService("");
                  // Focus the service input after clearing
                  setTimeout(() => {
                    const serviceInput = document.querySelector('[data-testid="input-service"]') as HTMLInputElement;
                    serviceInput?.focus();
                  }, 100);
                }}
                data-testid="button-remove-query"
                aria-label="Remove search term"
              >
                ×
              </Button>
            </Badge>
          )}
          {selectedCategories.map((categoryId) => {
            const category = serviceCategories.find(c => c.id === categoryId);
            return (
              <Badge
                key={categoryId}
                variant="secondary"
                className="gap-1"
                data-testid={`badge-active-category-${categoryId}`}
              >
                {category?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleCategoryToggle(categoryId)}
                  data-testid={`button-remove-category-${categoryId}`}
                  aria-label={`Remove ${category?.label} filter`}
                >
                  ×
                </Button>
              </Badge>
            );
          })}
          {(priceRange[0] > 0 || priceRange[1] < 5000) && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-price">
              ₹{priceRange[0]} - ₹{priceRange[1]}{priceRange[1] === 5000 ? '+' : ''}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setPriceRange([0, 5000])}
                data-testid="button-remove-price"
                aria-label="Remove price filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {sortBy && sortBy !== "best-match" && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-sort">
              <ArrowUpDown className="h-3 w-3" />
              Sort: {sortBy === 'price-low' ? 'Price Low' : 
                     sortBy === 'price-high' ? 'Price High' : 
                     sortBy === 'rating' ? 'Rating' : 
                     sortBy === 'newest' ? 'Newest' : 
                     sortBy === 'distance' ? 'Distance' : sortBy}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setSortBy("best-match")}
                data-testid="button-remove-sort"
                aria-label="Remove sort filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {availableToday && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-availability">
              <Clock className="h-3 w-3" />
              Available today
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setAvailableToday(false)}
                data-testid="button-remove-availability"
                aria-label="Remove availability filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {specificServices.length > 0 && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-services">
              <CheckCircle className="h-3 w-3" />
              {specificServices.length} service{specificServices.length > 1 ? 's' : ''}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setSpecificServices([])}
                data-testid="button-remove-services"
                aria-label="Remove services filter"
              >
                ×
              </Button>
            </Badge>
          )}
          {minRating > 0 && (
            <Badge variant="secondary" className="gap-1" data-testid="badge-active-rating">
              <Star className="h-3 w-3" />
              {minRating}+ stars
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setMinRating(0)}
                data-testid="button-remove-rating"
                aria-label="Remove rating filter"
              >
                ×
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Mobile Autocomplete Sheet */}
      <Sheet open={showMobileAutocomplete} onOpenChange={setShowMobileAutocomplete}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle>Search for treatments</SheetTitle>
            <SheetDescription>
              Find the perfect treatment or salon for you
            </SheetDescription>
          </SheetHeader>
          
          {/* Mobile Search Input */}
          <div className="px-4 pb-4">
            <div className="flex items-center h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <Input
                value={service}
                onChange={(e) => handleServiceInputChange(e.target.value)}
                placeholder="Search treatments, salons..."
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/70"
                data-testid="input-service-mobile"
                autoFocus
              />
            </div>
          </div>

          {/* Mobile Suggestions List */}
          <div className="flex-1 overflow-y-auto px-4">
            {isSearching && (
              <div className="py-8 text-center text-muted-foreground">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p>Searching...</p>
              </div>
            )}
            
            {!isSearching && autocompleteSuggestions.length > 0 && (
              <div className="space-y-1 pb-4">
                {autocompleteSuggestions.map((suggestion, index) => {
                  const IconComponent = suggestion.icon;
                  
                  // Render header differently
                  if (suggestion.isHeader) {
                    return (
                      <div key={`${suggestion.type}-${suggestion.id}-${index}`} className="px-3 py-3 text-sm font-semibold text-muted-foreground bg-gray-50 dark:bg-gray-800/30 rounded-lg mb-2 mt-4 first:mt-0">
                        {suggestion.title}
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors rounded-lg active:bg-muted"
                      onClick={() => handleSuggestionSelect(suggestion)}
                      data-testid={`mobile-suggestion-${suggestion.type}-${suggestion.id}`}
                    >
                      {IconComponent && (
                        <div className={`p-2 rounded-lg flex items-center justify-center w-10 h-10 ${suggestion.color || 'bg-primary/10 text-primary'}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base leading-tight">{suggestion.title}</div>
                        {suggestion.subtitle && (
                          <div className="text-sm text-muted-foreground leading-tight mt-1">{suggestion.subtitle}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {!isSearching && autocompleteSuggestions.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <p>No suggestions found</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Professional Location Input Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {locationModalType === 'home' ? 'Home' : 'Work'} Address
            </DialogTitle>
            <DialogDescription>
              Enter your {locationModalType} address to save it for quick access.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2 relative">
              <Input
                value={locationModalValue}
                onChange={(e) => handleModalLocationInputChange(e.target.value)}
                onFocus={() => setShowModalLocationSuggestions(true)}
                onBlur={() => {
                  // Delay hiding suggestions to allow clicks
                  setTimeout(() => setShowModalLocationSuggestions(false), 150);
                }}
                placeholder={`Enter your ${locationModalType} address...`}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (modalLocationSuggestions.length > 0 && showModalLocationSuggestions) {
                      handleModalLocationSuggestionSelect(modalLocationSuggestions[0]);
                    } else {
                      handleLocationModalSave();
                    }
                  } else if (e.key === 'Escape') {
                    handleLocationModalCancel();
                  }
                }}
                autoFocus
                data-testid={`input-${locationModalType}-address`}
              />
              
              {/* Modal Location Autocomplete Dropdown */}
              {showModalLocationSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {isModalLocationSearching && (
                    <div className="py-3 px-3 text-muted-foreground text-sm flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Searching locations...
                    </div>
                  )}
                  
                  {!isModalLocationSearching && modalLocationSuggestions.length > 0 && (
                    <div className="py-1">
                      {modalLocationSuggestions.map((suggestion, index) => (
                        <div
                          key={`modal-${suggestion.id}-${index}`}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleModalLocationSuggestionSelect(suggestion)}
                          data-testid={`modal-location-suggestion-${suggestion.id}`}
                        >
                          <div className="p-1 rounded flex items-center justify-center w-6 h-6 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                            <MapPin className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm leading-tight">{suggestion.title}</div>
                            <div className="text-xs text-muted-foreground leading-tight">{suggestion.subtitle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!isModalLocationSearching && modalLocationSuggestions.length === 0 && locationModalValue.trim().length > 0 && (
                    <div className="py-3 px-3 text-muted-foreground text-sm text-center">
                      No locations found for "{locationModalValue}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={handleLocationModalCancel}
              data-testid="button-cancel-location"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleLocationModalSave}
              disabled={!locationModalValue.trim()}
              data-testid="button-save-location"
            >
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Location Permission Modal */}
      <Dialog open={showLocationPermissionModal} onOpenChange={setShowLocationPermissionModal}>
        <DialogContent className="sm:max-w-md" data-testid="location-permission-modal">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              📡 Enable GPS Location
            </DialogTitle>
            <DialogDescription className="text-center space-y-3">
              <p className="text-muted-foreground font-medium">
                We need your <strong>precise GPS location</strong> to find salons near you.
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                  ⚠️ Important: When prompted by your browser
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Please click <strong>"Allow"</strong> to enable GPS location.
                  This gives you accurate results within <strong>50 meters</strong>.
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>🎯 <strong>Precise GPS accuracy</strong> (±50m)</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>🚗 Accurate walking/driving distances</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <CheckCircle className="h-4 w-4" />
                  <span>✨ Find salons within 500m of you</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                We use real GPS (not IP location) for accurate results.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex-col space-y-2 sm:space-y-2 sm:space-x-0">
            <Button
              onClick={handleLocationPermissionAllow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={locationPermissionStatus === 'checking'}
              data-testid="button-allow-location"
            >
              {locationPermissionStatus === 'checking' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Detecting location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Enable GPS Location
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleLocationPermissionDeny}
              className="w-full"
              disabled={locationPermissionStatus === 'checking'}
              data-testid="button-deny-location"
            >
              Not now, I'll enter manually
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}