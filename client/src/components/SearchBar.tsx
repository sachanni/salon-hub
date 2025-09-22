import { Search, MapPin, Calendar, Scissors, Paintbrush2, Sparkles, Dumbbell, Heart, Star, SlidersHorizontal, LayoutGrid, ChevronDown, Zap, Smile, User, Stethoscope, Brain, ArrowUpDown, Clock, CheckCircle, Home, Building2, Navigation, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback, useRef } from "react";

const serviceCategories = [
  // Popular categories (shown in top row)
  { id: "hair", label: "Hair", icon: Scissors, group: "Beauty", popular: true, color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  { id: "facials", label: "Facials & Skincare", icon: Sparkles, group: "Skin & Aesthetics", popular: true, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "nails", label: "Nails", icon: Paintbrush2, group: "Beauty", popular: true, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "massage", label: "Massage", icon: Heart, group: "Body & Wellness", popular: true, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
  { id: "hair-removal", label: "Hair Removal", icon: Zap, group: "Skin & Aesthetics", popular: true, color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, group: "Body & Wellness", popular: true, color: "bg-red-500/10 text-red-700 dark:text-red-300" },
  
  // Additional categories (shown in "More" section)
  { id: "makeup", label: "Makeup", icon: Smile, group: "Beauty", popular: false, color: "bg-pink-500/10 text-pink-700 dark:text-pink-300" },
  { id: "injectables", label: "Injectables & Fillers", icon: User, group: "Skin & Aesthetics", popular: false, color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { id: "body-treatments", label: "Body Treatments", icon: Heart, group: "Body & Wellness", popular: false, color: "bg-green-500/10 text-green-700 dark:text-green-300" },
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

export default function SearchBar() {
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
  
  // Location input modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'home' | 'work'>('home');
  const [locationModalValue, setLocationModalValue] = useState('');
  
  // Autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Location autocomplete state
  const [showLocationAutocomplete, setShowLocationAutocomplete] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [currentLocationStatus, setCurrentLocationStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');
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
          const services = await response.json();
          setAllServices(services);
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

    // Add "All treatments" option at top
    suggestions.push({
      type: 'all',
      id: 'all-treatments',
      title: 'All treatments',
      subtitle: 'Browse all available services',
      icon: LayoutGrid
    });

    // Add popular categories
    const topCategories = popularCategories.slice(0, 6).map(category => ({
      type: 'category',
      id: category.id,
      title: category.label,
      subtitle: `Top category • ${category.group}`,
      icon: category.icon,
      color: category.color
    }));
    suggestions.push(...topCategories);

    // Add some popular services from the most common categories
    const popularServiceCategories = ['hair', 'facials', 'nails', 'massage'];
    const popularServices = allServices
      .filter(service => 
        popularServiceCategories.some(cat => 
          service.category?.toLowerCase().includes(cat) || 
          service.name?.toLowerCase().includes(cat)
        )
      )
      .slice(0, 3)
      .map(service => ({
        type: 'service',
        id: service.id,
        title: service.name,
        subtitle: `Popular • ₹${Math.round(service.priceInPaisa / 100)} • ${service.durationMinutes}min`,
        category: service.category
      }));
    suggestions.push(...popularServices);

    setAutocompleteSuggestions(suggestions.slice(0, 10));
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
        const salons = await salonsResponse.json();
        const salonSuggestions = salons.results?.filter((salon: any) => salon).slice(0, 3).map((salon: any) => ({
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
      // Select the category and trigger search
      setService(suggestion.title);
      setSelectedCategories([suggestion.id]);
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
    setAutocompleteSuggestions([]);
  };

  // Handle input focus - show popular suggestions like Fresha
  const handleServiceInputFocus = () => {
    setShowAutocomplete(true);
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
    }, 200);
  };

  // Load saved locations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('salonhub_saved_locations');
    if (saved) {
      try {
        setSavedLocations(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved locations:', error);
      }
    }
  }, []);

  // Initialize popular suggestions when component mounts
  useEffect(() => {
    if (allServices.length > 0) {
      showPopularSuggestions();
    }
  }, [allServices, showPopularSuggestions]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setCurrentLocationStatus('detecting');
    
    if (!navigator.geolocation) {
      setCurrentLocationStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding to get readable location
          // For now, we'll use a placeholder until we integrate a geocoding service
          const { latitude, longitude } = position.coords;
          setLocation(`Current location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
          setCurrentLocationStatus('success');
          setShowLocationAutocomplete(false);
        } catch (error) {
          console.error('Error getting location name:', error);
          setCurrentLocationStatus('error');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setCurrentLocationStatus('error');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  // Save location (Home/Work)
  const saveLocation = useCallback((type: 'home' | 'work', address: string) => {
    const newLocation = {
      id: type,
      type,
      address,
      label: type === 'home' ? 'Home' : 'Work',
      icon: type === 'home' ? Home : Building2
    };
    
    const updatedLocations = savedLocations.filter(loc => loc.type !== type);
    updatedLocations.push(newLocation);
    
    setSavedLocations(updatedLocations);
    localStorage.setItem('salonhub_saved_locations', JSON.stringify(updatedLocations));
    setLocation(address);
    setShowLocationAutocomplete(false);
  }, [savedLocations]);

  // Location search function
  const performLocationSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setIsLocationSearching(false);
      return;
    }

    setIsLocationSearching(true);
    const suggestions = [];

    try {
      // For demo purposes, we'll use mock location data
      // In production, you'd integrate with Google Places API or similar
      const mockLocations = [
        { name: 'Mumbai, Maharashtra', type: 'city', region: 'Western India' },
        { name: 'Delhi, NCT', type: 'city', region: 'Northern India' },
        { name: 'Bangalore, Karnataka', type: 'city', region: 'Southern India' },
        { name: 'Pune, Maharashtra', type: 'city', region: 'Western India' },
        { name: 'Hyderabad, Telangana', type: 'city', region: 'Southern India' },
        { name: 'Chennai, Tamil Nadu', type: 'city', region: 'Southern India' },
        { name: 'Kolkata, West Bengal', type: 'city', region: 'Eastern India' },
        { name: 'Ahmedabad, Gujarat', type: 'city', region: 'Western India' },
        { name: 'Jaipur, Rajasthan', type: 'city', region: 'Northern India' },
        { name: 'Gurgaon, Haryana', type: 'city', region: 'Northern India' },
        { name: 'Noida, Uttar Pradesh', type: 'city', region: 'Northern India' },
        { name: 'Bandra West, Mumbai', type: 'area', region: 'Mumbai' },
        { name: 'Koramangala, Bangalore', type: 'area', region: 'Bangalore' },
        { name: 'CP, Delhi', type: 'area', region: 'Delhi' },
        { name: 'Hitech City, Hyderabad', type: 'area', region: 'Hyderabad' }
      ];

      const queryLower = query.toLowerCase();
      const matchingLocations = mockLocations
        .filter(loc => loc.name.toLowerCase().includes(queryLower))
        .slice(0, 6)
        .map(loc => ({
          type: 'location',
          id: loc.name.toLowerCase().replace(/\s+/g, '-'),
          title: loc.name,
          subtitle: `${loc.type === 'city' ? 'City' : 'Area'} • ${loc.region}`,
          address: loc.name
        }));

      suggestions.push(...matchingLocations);
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Error performing location search:', error);
    } finally {
      setIsLocationSearching(false);
    }
  }, []);

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
      
      // Add current location option
      suggestions.push({
        type: 'current',
        id: 'current-location',
        title: 'Current location',
        subtitle: 'Use my current location',
        icon: Navigation
      });
      
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
      
      setLocationSuggestions(suggestions);
    } else {
      performLocationSearch(location);
    }
  };

  // Handle location suggestion selection
  const handleLocationSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'current') {
      getCurrentLocation();
    } else if (suggestion.type === 'saved') {
      setLocation(suggestion.address);
      setShowLocationAutocomplete(false);
    } else if (suggestion.type === 'add-saved') {
      // Open professional modal instead of browser prompt
      setLocationModalType(suggestion.saveType as 'home' | 'work');
      setLocationModalValue('');
      setShowLocationModal(true);
      setShowLocationAutocomplete(false);
    } else if (suggestion.type === 'location') {
      setLocation(suggestion.address);
      setShowLocationAutocomplete(false);
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
    if (selectedDateType === 'any') return 'Any date';
    if (selectedDateType === 'today') return 'Today';
    if (selectedDateType === 'tomorrow') return 'Tomorrow';
    if (selectedDateType === 'specific' && selectedDate) {
      return selectedDate.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
    return 'Any date';
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
      // Build search parameters
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

      // Make the search API call
      const response = await fetch(`/api/salons?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json();
      
      // For now, log the results - you may want to navigate to a results page
      // or update the parent component to show results
      console.log('Search results:', results);
      
      // You can emit this data to parent component or navigate to results page
      // For example: onSearchResults?.(results);
      
    } catch (error) {
      console.error('Search error:', error);
      // You may want to show an error toast here
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
      saveLocation(locationModalType, locationModalValue.trim());
      setShowLocationModal(false);
      setLocationModalValue('');
    }
  };

  // Handle location modal cancel
  const handleLocationModalCancel = () => {
    setShowLocationModal(false);
    setLocationModalValue('');
  };

  const hasActiveFilters = service.trim().length > 0 || selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000 || minRating > 0 || (sortBy && sortBy !== "best-match") || availableToday || specificServices.length > 0;

  return (
    <div className="bg-white dark:bg-card p-6 rounded-xl shadow-lg max-w-6xl mx-auto">
      {/* Fresha-style Single Line Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 rounded-full h-11 p-1 gap-1">
          {/* Service Input Segment */}
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center h-9 px-4 rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm">
              <Search className="h-4 w-4 text-muted-foreground mr-2 group-focus-within:text-primary transition-colors" />
              <Input
                value={service}
                onChange={(e) => handleServiceInputChange(e.target.value)}
                onFocus={handleServiceInputFocus}
                onBlur={handleServiceInputBlur}
                placeholder="Search treatments, salons..."
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/70 text-sm"
                data-testid="input-service"
              />
            </div>
            
            {/* Service Autocomplete Dropdown */}
            {showAutocomplete && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto min-w-[400px]">
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
                      return (
                        <div
                          key={`${suggestion.type}-${suggestion.id}-${index}`}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleSuggestionSelect(suggestion)}
                          data-testid={`suggestion-${suggestion.type}-${suggestion.id}`}
                        >
                          {IconComponent && (
                            <div className={`p-1.5 rounded ${suggestion.color || 'bg-primary/10 text-primary'}`}>
                              <IconComponent className="h-3 w-3" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{suggestion.title}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
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

          {/* Separator */}
          <div className="w-px h-6 bg-border"></div>

          {/* Location Input Segment */}
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center h-9 px-4 rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm">
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
            
            {/* Location Autocomplete Dropdown */}
            {showLocationAutocomplete && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-80 overflow-y-auto min-w-[350px]">
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
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleLocationSuggestionSelect(suggestion)}
                          data-testid={`location-suggestion-${suggestion.type}-${suggestion.id}`}
                        >
                          {suggestion.type === 'current' && (
                            <div className="p-1.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300">
                              <Navigation className="h-3 w-3" />
                            </div>
                          )}
                          {suggestion.type === 'saved' && (
                            <div className="p-1.5 rounded bg-green-500/10 text-green-700 dark:text-green-300">
                              <IconComponent className="h-3 w-3" />
                            </div>
                          )}
                          {suggestion.type === 'add-saved' && (
                            <div className="p-1.5 rounded bg-gray-500/10 text-gray-700 dark:text-gray-300">
                              <IconComponent className="h-3 w-3" />
                            </div>
                          )}
                          {suggestion.type === 'location' && (
                            <div className="p-1.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300">
                              <MapPin className="h-3 w-3" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{suggestion.title}</div>
                            <div className="text-xs text-muted-foreground">{suggestion.subtitle}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {!isLocationSearching && locationSuggestions.length === 0 && (
                  <div className="py-3 px-3 text-muted-foreground text-sm text-center">
                    No locations found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border"></div>

          {/* Date Input Segment */}
          <div className="relative">
            <div className="flex items-center h-9 px-4 rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:shadow-sm">
              <Calendar className="h-4 w-4 text-muted-foreground mr-2 group-focus-within:text-primary transition-colors" />
              <Button
                variant="ghost"
                data-testid="button-date-picker"
                onClick={() => setShowDatePicker(!showDatePicker)}
                onBlur={handleDatePickerBlur}
                className="p-0 h-auto font-normal text-sm hover:bg-transparent focus-visible:ring-0 border-0"
              >
                {getDateDisplayText()}
              </Button>
            </div>
            
            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 p-4 min-w-[320px]">
                {/* Quick Date Options */}
                <div className="flex gap-2 mb-4">
                  <Button
                    size="sm"
                    variant={selectedDateType === 'any' ? 'default' : 'outline'}
                    onClick={() => handleDateTypeSelect('any')}
                    data-testid="button-any-date"
                    className="flex-1"
                  >
                    Any date
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDateType === 'today' ? 'default' : 'outline'}
                    onClick={() => handleDateTypeSelect('today')}
                    data-testid="button-today"
                    className="flex-1"
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedDateType === 'tomorrow' ? 'default' : 'outline'}
                    onClick={() => handleDateTypeSelect('tomorrow')}
                    data-testid="button-tomorrow"
                    className="flex-1"
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

          {/* Separator */}
          <div className="w-px h-6 bg-border"></div>

          {/* Time Segment - Placeholder for now */}
          <div className="flex items-center h-9 px-4 rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group">
            <Clock className="h-4 w-4 text-muted-foreground mr-2 group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground/70">Any time</span>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border"></div>

          {/* Filters Segment */}
          <div className="relative">
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <div className="flex items-center h-9 px-4 rounded-full bg-transparent hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group cursor-pointer">
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

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-border">
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
            <div className="grid flex-1 gap-2">
              <Input
                value={locationModalValue}
                onChange={(e) => setLocationModalValue(e.target.value)}
                placeholder={`Enter your ${locationModalType} address...`}
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLocationModalSave();
                  } else if (e.key === 'Escape') {
                    handleLocationModalCancel();
                  }
                }}
                autoFocus
                data-testid={`input-${locationModalType}-address`}
              />
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
    </div>
  );
}