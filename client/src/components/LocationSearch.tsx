import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Home, 
  Building2, 
  Navigation, 
  Clock,
  Search,
  X,
  Check,
  Loader2,
  Star,
  History,
  TrendingUp,
  Crosshair,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LocationSearchProps {
  value: string;
  onChange: (location: string, coords?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
  showRadius?: boolean;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  currentLocationCoords?: { lat: number; lng: number } | null;
  locationAccuracy?: number;
  savedLocations?: any[];
  onLocationSave?: (location: any) => void;
}

interface LocationSuggestion {
  id: string;
  title: string;
  subtitle: string;
  address: string;
  coords?: { lat: number; lng: number };
  type: 'current' | 'saved' | 'recent' | 'popular' | 'search' | 'error';
  distance?: number;
  isError?: boolean;
  icon?: React.ReactNode;
}

const LocationSearch: React.FC<LocationSearchProps> = ({
  value,
  onChange,
  placeholder = "Search for an address or place...",
  className,
  showRadius = true,
  radius = 1,
  onRadiusChange,
  currentLocationCoords,
  locationAccuracy,
  savedLocations = [],
  onLocationSave
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationSuggestion[]>([]);
  const [popularLocations, setPopularLocations] = useState<LocationSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent locations from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentLocations') || '[]');
    setRecentLocations(recent);
  }, []);

  // Load popular locations (mock data - in real app, this would come from analytics)
  useEffect(() => {
    // Don't show mock popular locations - let real search results show
    setPopularLocations([]);
  }, []);

  // Generate initial suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      generateInitialSuggestions();
    }
  }, [isOpen, currentLocationCoords, savedLocations, recentLocations, popularLocations]);

  const generateInitialSuggestions = () => {
    const initialSuggestions: LocationSuggestion[] = [];

    // Current location (always show, like Fresha)
    initialSuggestions.push({
      id: 'current-location',
      title: 'Current location',
      subtitle: currentLocationCoords ? 'Use your current location' : 'Find salons near you',
      address: 'Current Location',
      coords: currentLocationCoords,
      type: 'current',
      icon: <Navigation className="h-4 w-4" />
    });

    // Saved locations (if any)
    if (savedLocations.length > 0) {
      savedLocations.forEach((location, index) => {
        initialSuggestions.push({
          id: `saved-${location.id || index}`,
          title: location.label || location.name,
          subtitle: location.address,
          address: location.address,
          coords: location.coords,
          type: 'saved',
          icon: location.type === 'home' ? <Home className="h-4 w-4" /> : 
                location.type === 'work' ? <Building2 className="h-4 w-4" /> : 
                <MapPin className="h-4 w-4" />
        });
      });
    }

    // Recent locations (limit to 3)
    recentLocations.slice(0, 3).forEach((location) => {
      initialSuggestions.push({
        ...location,
        icon: <History className="h-4 w-4" />
      });
    });

    setSuggestions(initialSuggestions);
  };

  // Search for locations
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      generateInitialSuggestions();
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=8`);
      
      if (response.ok) {
        const data = await response.json();
        const searchSuggestions: LocationSuggestion[] = data.results?.map((result: any, index: number) => ({
          id: result.id || `search-${index}`,
          title: result.title || 'Unknown location',
          subtitle: result.subtitle || '',
          address: result.address || result.title || '',
          coords: result.coords,
          type: 'search',
          icon: <Search className="h-4 w-4" />
        })) || [];

        setSuggestions(searchSuggestions);
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([{
        id: 'error',
        title: 'Search unavailable',
        subtitle: 'Please check your connection and try again',
        address: '',
        type: 'error',
        isError: true,
        icon: <AlertCircle className="h-4 w-4" />
      }]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(query);
    }, 300);
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    if (suggestion.isError) return;

    // Update the input value
    onChange(suggestion.address, suggestion.coords);
    setIsOpen(false);
    setSelectedIndex(-1);

    // Save to recent locations (if not current location)
    if (suggestion.type !== 'current') {
      const recent = [
        {
          ...suggestion,
          timestamp: Date.now()
        },
        ...recentLocations.filter(loc => loc.id !== suggestion.id)
      ].slice(0, 10); // Keep only 10 recent locations

      setRecentLocations(recent);
      localStorage.setItem('recentLocations', JSON.stringify(recent));
    }

    // Handle current location
    if (suggestion.type === 'current' && suggestion.coords) {
      handleCurrentLocation();
    }
  };

  // Handle current location detection
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          // Reverse geocode to get address
          const response = await fetch(`/api/locations/geocode?lat=${coords.lat}&lng=${coords.lng}`);
          if (response.ok) {
            const data = await response.json();
            const address = data.address || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
            onChange(address, coords);
            setIsOpen(false);
          } else {
            throw new Error('Reverse geocoding failed');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          const address = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
          onChange(address, coords);
          setIsOpen(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location access denied",
          description: "Please allow location access or search manually.",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleLocationSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Radius presets
  const radiusPresets = [
    { value: 0.3, label: '300m', description: 'Nearby' },
    { value: 0.5, label: '500m', description: 'Short walk' },
    { value: 1, label: '1km', description: 'Walk/Bike' },
    { value: 2, label: '2km', description: 'Car/Bus' },
    { value: 5, label: '5km', description: 'Drive' }
  ];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center h-12 px-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <MapPin className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground text-sm flex-1"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
          )}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="h-6 w-6 p-0 ml-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Suggestions Dropdown - Fresha Style */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
            <div className="py-2">
              {/* Suggestions List */}
              <div className="space-y-0">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleLocationSelect(suggestion)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                      selectedIndex === index && "bg-gray-50",
                      suggestion.isError && "text-red-500 cursor-not-allowed"
                    )}
                  >
                    <div className="flex-shrink-0 text-gray-400">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {suggestion.title}
                      </div>
                      {suggestion.subtitle && (
                        <div className="text-xs text-gray-500 truncate">
                          {suggestion.subtitle}
                        </div>
                      )}
                    </div>
                    {suggestion.type === 'current' && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* No results */}
              {suggestions.length === 0 && !isSearching && (
                <div className="text-center py-6 text-gray-500">
                  <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No locations found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Radius Selector */}
      {showRadius && onRadiusChange && (
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Search radius:</span>
            {radiusPresets.map((preset) => (
              <Button
                key={preset.value}
                variant={radius === preset.value ? "default" : "outline"}
                size="sm"
                onClick={() => onRadiusChange(preset.value)}
                className="h-7 px-2 text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
