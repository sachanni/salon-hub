import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchParams {
  service: string;
  coords?: { lat: number; lng: number };
  radius: number;
  date?: string;
  time?: string;
  locationName?: string;
}

interface FreshaSearchBarProps {
  onSearch: (params: SearchParams) => void;
  currentLocationCoords?: { lat: number; lng: number };
  locationAccuracy?: number;
  savedLocations?: Array<{
    id: string;
    name: string;
    address: string;
    coords: { lat: number; lng: number };
    type: 'home' | 'work' | 'custom';
  }>;
}

const serviceCategories = [
  { id: 'hair', name: 'Hair', icon: '💇' },
  { id: 'nails', name: 'Nails', icon: '💅' },
  { id: 'skincare', name: 'Skincare', icon: '✨' },
  { id: 'massage', name: 'Massage', icon: '💆' },
  { id: 'eyebrows', name: 'Eyebrows', icon: '👁️' },
  { id: 'lashes', name: 'Lashes', icon: '👀' },
  { id: 'waxing', name: 'Waxing', icon: '🪶' },
  { id: 'makeup', name: 'Makeup', icon: '💄' }
];

const radiusOptions = [
  { value: 0.3, label: '300m' },
  { value: 0.5, label: '500m' },
  { value: 1, label: '1km' },
  { value: 2, label: '2km' },
  { value: 5, label: '5km' }
];

export default function FreshaSearchBar({
  onSearch,
  currentLocationCoords,
  locationAccuracy,
  savedLocations = []
}: FreshaSearchBarProps) {
  const [selectedService, setSelectedService] = useState('hair');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ name: string; coords: { lat: number; lng: number } } | null>(null);
  const [selectedRadius, setSelectedRadius] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDateType, setSelectedDateType] = useState<'any' | 'today' | 'tomorrow'>('any');
  const [selectedTimeType, setSelectedTimeType] = useState<'any' | 'morning' | 'afternoon' | 'evening'>('any');
  const [customTimeRange, setCustomTimeRange] = useState({ start: '', end: '' });
  
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Advanced caching and performance optimization
  const [searchCache, setSearchCache] = useState<Map<string, any[]>>(new Map());
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [popularSearches, setPopularSearches] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const serviceRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize popular searches and load from localStorage
  useEffect(() => {
    // Load recent searches from localStorage
    const savedRecentSearches = localStorage.getItem('fresha-recent-searches');
    if (savedRecentSearches) {
      try {
        setRecentSearches(JSON.parse(savedRecentSearches));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }

    // Initialize popular Delhi NCR searches
    const popularDelhiNCRSearches = [
      { id: 'cp', title: 'Connaught Place, New Delhi', subtitle: 'Delhi, India', coords: { lat: 28.6315, lng: 77.2167 } },
      { id: 'cyber-city', title: 'Cyber City, Gurugram', subtitle: 'Haryana, India', coords: { lat: 28.4960, lng: 77.0900 } },
      { id: 'sector-18-noida', title: 'Sector 18, Noida', subtitle: 'Uttar Pradesh, India', coords: { lat: 28.5900, lng: 77.3200 } },
      { id: 'nirala-estate', title: 'Nirala Estate, Greater Noida', subtitle: 'Uttar Pradesh, India', coords: { lat: 28.5355, lng: 77.3910 } },
      { id: 'trident-embassy', title: 'Trident Embassy, Gurugram', subtitle: 'Haryana, India', coords: { lat: 28.4960, lng: 77.0900 } }
    ];
    setPopularSearches(popularDelhiNCRSearches);
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem('fresha-recent-searches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceRef.current && !serviceRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
        setShowSuggestions(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Advanced search with caching and performance optimization
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Check cache first
    if (searchCache.has(normalizedQuery)) {
      console.log('🚀 Cache hit for:', normalizedQuery);
      const cachedResults = searchCache.get(normalizedQuery)!;
      setLocationSuggestions(cachedResults);
      setShowSuggestions(true);
      return;
    }

    // Check if we have recent searches that match
    const recentMatch = recentSearches.find(item => 
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.subtitle.toLowerCase().includes(normalizedQuery)
    );
    
    if (recentMatch && normalizedQuery.length >= 2) {
      console.log('🔄 Using recent search match:', recentMatch);
      setLocationSuggestions([recentMatch]);
      setShowSuggestions(true);
      return;
    }

    setIsSearchingLocation(true);
    setShowSuggestions(true);
    
    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        const results = data.results || [];
        
        // Cache the results
        setSearchCache(prev => {
          const newCache = new Map(prev);
          newCache.set(normalizedQuery, results);
          // Limit cache size to 100 entries
          if (newCache.size > 100) {
            const firstKey = newCache.keys().next().value;
            if (firstKey) {
              newCache.delete(firstKey);
            }
          }
          return newCache;
        });
        
        // Add to recent searches
        if (results.length > 0) {
          setRecentSearches(prev => {
            const newRecent = [results[0], ...prev.filter(item => item.id !== results[0].id)];
            return newRecent.slice(0, 5); // Keep only 5 recent searches
          });
        }
        
        setLocationSuggestions(results);
        console.log(`✅ Found ${results.length} results for "${query}"`);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  }, [searchCache, recentSearches]);

  // Advanced debounced location search with Fresha-style optimization
  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!locationQuery.trim()) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Immediate search for cached results
    const normalizedQuery = locationQuery.toLowerCase().trim();
    if (searchCache.has(normalizedQuery)) {
      console.log('🚀 Immediate cache hit for:', normalizedQuery);
      const cachedResults = searchCache.get(normalizedQuery)!;
      setLocationSuggestions(cachedResults);
      setShowSuggestions(true);
      return;
    }

    // Debounced search for new queries (reduced from 300ms to 200ms for faster response)
    debounceTimeoutRef.current = setTimeout(() => {
      searchLocations(locationQuery);
    }, 200);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [locationQuery, searchLocations, searchCache]);

  // Handle location selection
  const handleLocationSelect = (location: any) => {
    console.log('FreshaSearchBar: Location selected:', location);
    const coords = location.coords || { lat: 0, lng: 0 };
    console.log('FreshaSearchBar: Setting coordinates:', coords);
    setSelectedLocation({
      name: location.title || location.address,
      coords: coords
    });
    setLocationQuery(location.title || location.address);
    setShowLocationDropdown(false);
    setShowSuggestions(false);
  };

  // Handle location input focus
  const handleLocationFocus = () => {
    setShowLocationDropdown(true);
    if (locationQuery.trim()) {
      setShowSuggestions(true);
    } else {
      // Show popular searches when no query
      setLocationSuggestions(popularSearches);
      setShowSuggestions(true);
    }
  };

  // Handle location input change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocationQuery(value);
    if (value.trim()) {
      setShowSuggestions(true);
    }
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (currentLocationCoords) {
      setSelectedLocation({
        name: 'Current location',
        coords: currentLocationCoords
      });
      setLocationQuery('Current location');
      setShowLocationDropdown(false);
    } else {
      // Request geolocation with better error handling
      if (navigator.geolocation) {
        // Show loading state
        setIsGettingLocation(true);
        setLocationQuery('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setSelectedLocation({
              name: 'Current location',
              coords
            });
            setLocationQuery('Current location');
            setShowLocationDropdown(false);
            setIsGettingLocation(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationQuery('');
            setIsGettingLocation(false);
            
            // Handle different error types
            let errorMessage = 'Unable to get your current location. ';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Please allow location access and try again.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Location request timed out.';
                break;
              default:
                errorMessage += 'Please search for a location instead.';
                break;
            }
            
            alert(errorMessage);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      } else {
        alert('Geolocation is not supported by this browser. Please search for a location instead.');
      }
    }
  };

  // Handle search
  const handleSearch = () => {
    if (!selectedLocation) {
      alert('Please select a location');
      return;
    }

    console.log('FreshaSearchBar: Search triggered with location:', selectedLocation);
    console.log('FreshaSearchBar: Coordinates being sent:', selectedLocation.coords);
    
    // Format time based on selection
    let formattedTime = '';
    if (selectedTimeType !== 'any') {
      if (customTimeRange.start && customTimeRange.end) {
        formattedTime = `${formatTime(customTimeRange.start)} - ${formatTime(customTimeRange.end)}`;
      } else {
        switch (selectedTimeType) {
          case 'morning':
            formattedTime = '6:00 AM - 12:00 PM';
            break;
          case 'afternoon':
            formattedTime = '12:00 PM - 6:00 PM';
            break;
          case 'evening':
            formattedTime = '6:00 PM - 11:00 PM';
            break;
        }
      }
    }
    
    onSearch({
      service: selectedService,
      coords: selectedLocation.coords,
      radius: selectedRadius,
      date: selectedDate,
      time: formattedTime,
      locationName: selectedLocation.name
    });
  };

  // Get current date and time
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Helper functions for date handling
  const getDateDisplayText = () => {
    switch (selectedDateType) {
      case 'today':
        return 'Today';
      case 'tomorrow':
        return 'Tomorrow';
      case 'any':
      default:
        return 'Any date';
    }
  };

  const getTimeDisplayText = () => {
    // Check if custom time range is set first
    if (customTimeRange.start && customTimeRange.end) {
      return `${formatTime(customTimeRange.start)} - ${formatTime(customTimeRange.end)}`;
    }
    
    if (selectedTimeType === 'any') {
      return 'Any time';
    }
    
    switch (selectedTimeType) {
      case 'morning':
        return 'Morning (6:00 AM - 12:00 PM)';
      case 'afternoon':
        return 'Afternoon (12:00 PM - 6:00 PM)';
      case 'evening':
        return 'Evening (6:00 PM - 11:00 PM)';
      default:
        return 'Any time';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleDateTypeChange = (type: 'any' | 'today' | 'tomorrow') => {
    setSelectedDateType(type);
    if (type === 'today') {
      setSelectedDate(today);
    } else if (type === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } else {
      setSelectedDate('');
    }
  };

  const handleTimeTypeChange = (type: 'any' | 'morning' | 'afternoon' | 'evening') => {
    setSelectedTimeType(type);
    if (type === 'morning') {
      setCustomTimeRange({ start: '06:00', end: '12:00' });
    } else if (type === 'afternoon') {
      setCustomTimeRange({ start: '12:00', end: '18:00' });
    } else if (type === 'evening') {
      setCustomTimeRange({ start: '18:00', end: '23:00' });
    } else if (type === 'any') {
      setCustomTimeRange({ start: '', end: '' });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-1">
        <div className="flex items-center gap-1">
          {/* Service Selection */}
          <div className="relative flex-1" ref={serviceRef}>
            <button
              onClick={() => setShowServiceDropdown(!showServiceDropdown)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {serviceCategories.find(s => s.id === selectedService)?.name || 'All treatments'}
              </span>
            </button>
            
            {showServiceDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {serviceCategories.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service.id);
                      setShowServiceDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50",
                      selectedService === service.id && "bg-gray-50"
                    )}
                  >
                    <span className="text-lg">{service.icon}</span>
                    <span className="font-medium">{service.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Location Selection */}
          <div className="relative flex-1" ref={locationRef}>
            <div className="flex items-center gap-2 px-4 py-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={locationQuery}
                onChange={handleLocationChange}
                onFocus={handleLocationFocus}
                placeholder="Where are you located?"
                className="flex-1 outline-none text-gray-900 placeholder-gray-500"
              />
              {locationQuery && (
                <button
                  onClick={() => {
                    setLocationQuery('');
                    setSelectedLocation(null);
                    setLocationSuggestions([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {/* Current Location */}
                <button
                  onClick={handleCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0">
                    {isGettingLocation ? (
                      <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-purple-500"></div>
                    ) : (
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">
                      {isGettingLocation ? 'Getting your location...' : 'Current location'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isGettingLocation ? 'Please wait...' : 'Use your current location'}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isGettingLocation ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-500"></div>
                    ) : (
                      <Navigation className="h-3 w-3 text-purple-500" />
                    )}
                  </div>
                </button>

                {/* Saved Locations */}
                {savedLocations.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Saved
                    </div>
                    {savedLocations.map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{location.name}</div>
                          <div className="text-sm text-gray-500">{location.address}</div>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Search Results */}
                {locationSuggestions.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      Search Results
                    </div>
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id || index}
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm leading-tight">
                            {suggestion.title}
                          </div>
                          {suggestion.subtitle && (
                            <div className="text-xs text-gray-500 mt-0.5 leading-tight">
                              {suggestion.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {/* Recent Searches */}
                {!locationQuery && recentSearches.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="text-xs font-medium text-gray-500 mb-2">Recent searches</div>
                    {recentSearches.slice(0, 3).map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                      >
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.title}</div>
                          <div className="text-xs text-gray-500">{location.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Searches */}
                {!locationQuery && popularSearches.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="text-xs font-medium text-gray-500 mb-2">Popular in Delhi NCR</div>
                    {popularSearches.slice(0, 3).map((location) => (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location)}
                        className="w-full text-left px-2 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{location.title}</div>
                          <div className="text-xs text-gray-500">{location.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {locationQuery && locationSuggestions.length === 0 && !isSearchingLocation && (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No locations found</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching for a different location</p>
                  </div>
                )}

                {/* Loading */}
                {isSearchingLocation && (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-sm">Searching...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Date Selection */}
          <div className="relative" ref={dateRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {getDateDisplayText()}
              </span>
            </button>
            
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80">
                {/* Date Type Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => handleDateTypeChange('any')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                      selectedDateType === 'any'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Any date
                  </button>
                  <button
                    onClick={() => handleDateTypeChange('today')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                      selectedDateType === 'today'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleDateTypeChange('tomorrow')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                      selectedDateType === 'tomorrow'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
                
                {/* Custom Date Picker */}
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or choose a specific date:
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      if (e.target.value) {
                        setSelectedDateType('any');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Time Selection */}
          <div className="relative" ref={timeRef}>
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {getTimeDisplayText()}
              </span>
            </button>
            
            {showTimePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80">
                {/* Time Type Tabs */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => handleTimeTypeChange('any')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                      selectedTimeType === 'any'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Any time
                  </button>
                  <button
                    onClick={() => handleTimeTypeChange('morning')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                      selectedTimeType === 'morning'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Morning
                  </button>
                  <button
                    onClick={() => handleTimeTypeChange('afternoon')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                      selectedTimeType === 'afternoon'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Afternoon
                  </button>
                  <button
                    onClick={() => handleTimeTypeChange('evening')}
                    className={`flex-1 px-4 py-3 text-sm font-medium text-center transition-colors ${
                      selectedTimeType === 'evening'
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Evening
                  </button>
                </div>
                
                {/* Custom Time Range */}
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Or choose a specific time range:
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input
                        type="time"
                        value={customTimeRange.start}
                        onChange={(e) => {
                          setCustomTimeRange(prev => ({ ...prev, start: e.target.value }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input
                        type="time"
                        value={customTimeRange.end}
                        onChange={(e) => {
                          setCustomTimeRange(prev => ({ ...prev, end: e.target.value }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Radius Selector */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-sm text-gray-600">Search radius:</span>
        <div className="flex gap-1">
          {radiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRadius(option.value)}
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors",
                selectedRadius === option.value
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}