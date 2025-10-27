import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, Navigation, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Two-level service structure (Fresha-style)
interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  isCategory: boolean;
  subServices?: string[];
}

interface Service {
  id: string;
  name: string;
  icon: string;
  categoryId: string;
  isCategory: false;
}

// Main categories (Level 1)
const mainCategories: ServiceCategory[] = [
  { id: 'hair', name: 'Hair & styling', icon: '💇', isCategory: true, subServices: [] },
  { id: 'nails', name: 'Nails', icon: '💅', isCategory: true, subServices: [] },
  { id: 'skincare', name: 'Skincare & Facials', icon: '✨', isCategory: true, subServices: [] },
  { id: 'massage', name: 'Massage & Spa', icon: '💆', isCategory: true, subServices: [] },
  { id: 'eyes', name: 'Eyebrows & Lashes', icon: '👁️', isCategory: true, subServices: [] },
  { id: 'hair-removal', name: 'Hair Removal', icon: '🪶', isCategory: true, subServices: [] },
  { id: 'piercing', name: 'Piercing', icon: '💎', isCategory: true, subServices: [] },
  { id: 'tattoo', name: 'Tattoo', icon: '🎨', isCategory: true, subServices: [] },
  { id: 'makeup', name: 'Makeup', icon: '💄', isCategory: true, subServices: [] },
  { id: 'body', name: 'Body Treatments', icon: '🧖', isCategory: true, subServices: [] },
  { id: 'mens', name: "Men's Grooming", icon: '💈', isCategory: true, subServices: [] },
  { id: 'wellness', name: 'Wellness & Other', icon: '🧘‍♀️', isCategory: true, subServices: [] },
];

// Sub-services (Level 2) organized by category
const subServices: Service[] = [
  // Hair & styling sub-services
  { id: 'haircut', name: 'Haircut & Styling', icon: '✂️', categoryId: 'hair', isCategory: false },
  { id: 'hair-color', name: 'Hair Coloring', icon: '🎨', categoryId: 'hair', isCategory: false },
  { id: 'hair-treatment', name: 'Hair Treatment & Spa', icon: '💆', categoryId: 'hair', isCategory: false },
  { id: 'balayage', name: 'Balayage & Highlights', icon: '🌈', categoryId: 'hair', isCategory: false },
  { id: 'keratin', name: 'Keratin Treatment', icon: '✨', categoryId: 'hair', isCategory: false },
  { id: 'hair-extensions', name: 'Hair Extensions', icon: '💁', categoryId: 'hair', isCategory: false },
  { id: 'hair-patch', name: 'Hair Patch', icon: '🩹', categoryId: 'hair', isCategory: false },
  { id: 'hair-weaving', name: 'Hair Weaving', icon: '🧵', categoryId: 'hair', isCategory: false },
  { id: 'hair-bonding', name: 'Hair Bonding', icon: '🔗', categoryId: 'hair', isCategory: false },
  
  // Nails sub-services
  { id: 'manicure', name: 'Manicure', icon: '🤲', categoryId: 'nails', isCategory: false },
  { id: 'pedicure', name: 'Pedicure', icon: '🦶', categoryId: 'nails', isCategory: false },
  { id: 'nail-art', name: 'Nail Art & Design', icon: '💎', categoryId: 'nails', isCategory: false },
  { id: 'gel-nails', name: 'Gel Nails', icon: '💅', categoryId: 'nails', isCategory: false },
  { id: 'acrylic-nails', name: 'Acrylic Nails', icon: '✨', categoryId: 'nails', isCategory: false },
  { id: 'nail-extensions', name: 'Nail Extensions', icon: '💎', categoryId: 'nails', isCategory: false },
  
  // Skincare & Facials sub-services
  { id: 'facial', name: 'Classic Facial', icon: '✨', categoryId: 'skincare', isCategory: false },
  { id: 'anti-aging', name: 'Anti-Aging Treatment', icon: '🌟', categoryId: 'skincare', isCategory: false },
  { id: 'acne-treatment', name: 'Acne Treatment', icon: '🧴', categoryId: 'skincare', isCategory: false },
  { id: 'hydrafacial', name: 'HydraFacial', icon: '💧', categoryId: 'skincare', isCategory: false },
  { id: 'cleanup', name: 'Cleanup & Bleach', icon: '🧼', categoryId: 'skincare', isCategory: false },
  { id: 'chemical-peel', name: 'Chemical Peel', icon: '🍋', categoryId: 'skincare', isCategory: false },
  
  // Massage & Spa sub-services
  { id: 'body-massage', name: 'Full Body Massage', icon: '🧘', categoryId: 'massage', isCategory: false },
  { id: 'aromatherapy', name: 'Aromatherapy', icon: '🌸', categoryId: 'massage', isCategory: false },
  { id: 'deep-tissue', name: 'Deep Tissue Massage', icon: '💪', categoryId: 'massage', isCategory: false },
  { id: 'thai-massage', name: 'Thai Massage', icon: '🙏', categoryId: 'massage', isCategory: false },
  { id: 'hot-stone', name: 'Hot Stone Massage', icon: '🔥', categoryId: 'massage', isCategory: false },
  { id: 'spa-package', name: 'Spa Packages', icon: '🛁', categoryId: 'massage', isCategory: false },
  
  // Eyebrows & Lashes sub-services
  { id: 'eyebrow-shaping', name: 'Eyebrow Shaping', icon: '👁️', categoryId: 'eyes', isCategory: false },
  { id: 'threading', name: 'Threading', icon: '🧵', categoryId: 'eyes', isCategory: false },
  { id: 'eyelash-extensions', name: 'Eyelash Extensions', icon: '👀', categoryId: 'eyes', isCategory: false },
  { id: 'lash-lift', name: 'Lash Lift & Tint', icon: '🌙', categoryId: 'eyes', isCategory: false },
  { id: 'eyebrow-tint', name: 'Eyebrow Tinting', icon: '🎨', categoryId: 'eyes', isCategory: false },
  { id: 'microblading', name: 'Microblading', icon: '✏️', categoryId: 'eyes', isCategory: false },
  
  // Hair Removal sub-services
  { id: 'waxing', name: 'Waxing', icon: '🪶', categoryId: 'hair-removal', isCategory: false },
  { id: 'laser-hair-removal', name: 'Laser Hair Removal', icon: '⚡', categoryId: 'hair-removal', isCategory: false },
  { id: 'full-body-wax', name: 'Full Body Waxing', icon: '✨', categoryId: 'hair-removal', isCategory: false },
  { id: 'bikini-wax', name: 'Bikini Wax', icon: '👙', categoryId: 'hair-removal', isCategory: false },
  { id: 'brazilian-wax', name: 'Brazilian Wax', icon: '💫', categoryId: 'hair-removal', isCategory: false },
  
  // Piercing sub-services
  { id: 'ear-piercing', name: 'Ear Piercing', icon: '👂', categoryId: 'piercing', isCategory: false },
  { id: 'nose-piercing', name: 'Nose Piercing', icon: '👃', categoryId: 'piercing', isCategory: false },
  { id: 'belly-piercing', name: 'Belly Piercing', icon: '💫', categoryId: 'piercing', isCategory: false },
  { id: 'lip-piercing', name: 'Lip Piercing', icon: '💋', categoryId: 'piercing', isCategory: false },
  { id: 'eyebrow-piercing', name: 'Eyebrow Piercing', icon: '👁️', categoryId: 'piercing', isCategory: false },
  { id: 'cartilage-piercing', name: 'Cartilage Piercing', icon: '✨', categoryId: 'piercing', isCategory: false },
  
  // Tattoo sub-services
  { id: 'small-tattoo', name: 'Small Tattoo', icon: '✨', categoryId: 'tattoo', isCategory: false },
  { id: 'medium-tattoo', name: 'Medium Tattoo', icon: '🎨', categoryId: 'tattoo', isCategory: false },
  { id: 'large-tattoo', name: 'Large Tattoo', icon: '🖼️', categoryId: 'tattoo', isCategory: false },
  { id: 'coverup-tattoo', name: 'Cover-up Tattoo', icon: '🔄', categoryId: 'tattoo', isCategory: false },
  { id: 'tattoo-removal', name: 'Tattoo Removal', icon: '🔥', categoryId: 'tattoo', isCategory: false },
  { id: 'permanent-makeup', name: 'Permanent Makeup Tattoo', icon: '💄', categoryId: 'tattoo', isCategory: false },
  { id: 'henna-tattoo', name: 'Henna/Mehndi Tattoo', icon: '🌿', categoryId: 'tattoo', isCategory: false },
  
  // Makeup sub-services
  { id: 'bridal-makeup', name: 'Bridal Makeup', icon: '👰', categoryId: 'makeup', isCategory: false },
  { id: 'party-makeup', name: 'Party Makeup', icon: '🎉', categoryId: 'makeup', isCategory: false },
  { id: 'hd-makeup', name: 'HD Makeup', icon: '📸', categoryId: 'makeup', isCategory: false },
  { id: 'airbrush-makeup', name: 'Airbrush Makeup', icon: '💨', categoryId: 'makeup', isCategory: false },
  { id: 'natural-makeup', name: 'Natural Makeup', icon: '🌸', categoryId: 'makeup', isCategory: false },
  
  // Body Treatments sub-services
  { id: 'body-scrub', name: 'Body Scrub & Polishing', icon: '🧖', categoryId: 'body', isCategory: false },
  { id: 'body-wrap', name: 'Body Wrap', icon: '🌿', categoryId: 'body', isCategory: false },
  { id: 'tan-removal', name: 'Tan Removal', icon: '☀️', categoryId: 'body', isCategory: false },
  { id: 'body-polish', name: 'Body Polishing', icon: '✨', categoryId: 'body', isCategory: false },
  
  // Men's Grooming sub-services
  { id: 'mens-haircut', name: "Men's Haircut", icon: '💈', categoryId: 'mens', isCategory: false },
  { id: 'beard-trim', name: 'Beard Trim & Styling', icon: '🧔', categoryId: 'mens', isCategory: false },
  { id: 'mens-facial', name: "Men's Facial", icon: '👨', categoryId: 'mens', isCategory: false },
  { id: 'mens-grooming', name: "Men's Grooming Package", icon: '🎩', categoryId: 'mens', isCategory: false },
  
  // Wellness & Other sub-services
  { id: 'reflexology', name: 'Reflexology', icon: '🦶', categoryId: 'wellness', isCategory: false },
  { id: 'wellness-therapy', name: 'Wellness Therapy', icon: '🧘‍♀️', categoryId: 'wellness', isCategory: false },
  { id: 'consultation', name: 'Beauty Consultation', icon: '💬', categoryId: 'wellness', isCategory: false },
];

const radiusOptions = [
  { value: 0.3, label: '300m' },
  { value: 0.5, label: '500m' },
  { value: 1, label: '1km' },
  { value: 2, label: '2km' },
  { value: 5, label: '5km' }
];

// Fresha-style Calendar Component
function FreshaCalendar({ selectedDate, onDateSelect }: { selectedDate: string; onDateSelect: (date: string) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const generateCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
    
    // Previous month's trailing days
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Current month's days
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }
    
    return days;
  };
  
  const handleDateClick = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = selected.toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
    onDateSelect(dateString);
  };
  
  const isPastDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = date.toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
    return dateString === selectedDate;
  };
  
  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  return (
    <div className="w-full">
      {/* Month Navigation - Compact */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      
      {/* Day Names - Compact */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid - Compact */}
      <div className="grid grid-cols-7 gap-0.5">
        {generateCalendarDays().map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const past = isPastDate(day);
          const selected = isSelectedDate(day);
          const todayDate = isToday(day);
          
          return (
            <button
              key={day}
              onClick={() => !past && handleDateClick(day)}
              disabled={past}
              className={cn(
                "aspect-square rounded-md text-xs font-medium transition-all",
                past && "text-gray-300 cursor-not-allowed",
                !past && !selected && !todayDate && "text-gray-900 hover:bg-gray-100",
                todayDate && !selected && "border border-purple-600 text-purple-600",
                selected && "bg-purple-600 text-white shadow-md"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FreshaSearchBar({
  onSearch,
  currentLocationCoords,
  locationAccuracy,
  savedLocations = []
}: FreshaSearchBarProps) {
  const [selectedService, setSelectedService] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSubServices, setShowSubServices] = useState(false);
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

    // Load last search parameters from localStorage
    const savedLastSearch = localStorage.getItem('fresha-last-search');
    if (savedLastSearch) {
      try {
        const lastSearch = JSON.parse(savedLastSearch);
        if (lastSearch.service) setSelectedService(lastSearch.service);
        if (lastSearch.category) setSelectedCategory(lastSearch.category);
        if (lastSearch.location) {
          setSelectedLocation(lastSearch.location);
          setLocationQuery(lastSearch.location.name || '');
        }
        if (lastSearch.radius) setSelectedRadius(lastSearch.radius);
        if (lastSearch.dateType) setSelectedDateType(lastSearch.dateType);
        if (lastSearch.date) setSelectedDate(lastSearch.date);
        if (lastSearch.timeType) setSelectedTimeType(lastSearch.timeType);
        if (lastSearch.customTimeRange) setCustomTimeRange(lastSearch.customTimeRange);
        console.log('Restored last search:', lastSearch);
      } catch (error) {
        console.error('Error loading last search:', error);
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
    console.log('🎯 FreshaSearchBar: Location selected:', location);
    const coords = location.coords || { lat: 0, lng: 0 };
    console.log('🎯 FreshaSearchBar: Setting NEW coordinates:', coords);
    
    const newLocation = {
      name: location.title || location.address,
      coords: coords
    };
    
    setSelectedLocation(newLocation);
    setLocationQuery(location.title || location.address);
    setShowLocationDropdown(false);
    setShowSuggestions(false);
    
    // Immediately update localStorage with new location to prevent old coordinates from persisting
    const currentSearch = localStorage.getItem('fresha-last-search');
    if (currentSearch) {
      try {
        const searchData = JSON.parse(currentSearch);
        searchData.location = newLocation;
        localStorage.setItem('fresha-last-search', JSON.stringify(searchData));
        console.log('✅ Updated localStorage with new location:', newLocation);
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    }
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

  // Reverse geocode to get location name from coordinates
  const reverseGeocode = async (coords: { lat: number; lng: number }): Promise<string> => {
    try {
      const response = await fetch(`/api/locations/reverse?lat=${coords.lat}&lng=${coords.lng}`);
      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          return data.address;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    return 'Current location';
  };

  // Handle current location
  const handleCurrentLocation = async () => {
    if (currentLocationCoords) {
      setIsGettingLocation(true);
      setLocationQuery('Getting location name...');
      
      const locationName = await reverseGeocode(currentLocationCoords);
      
      setSelectedLocation({
        name: locationName,
        coords: currentLocationCoords
      });
      setLocationQuery(locationName);
      setShowLocationDropdown(false);
      setIsGettingLocation(false);
    } else {
      // Request geolocation with better error handling
      if (navigator.geolocation) {
        // Show loading state
        setIsGettingLocation(true);
        setLocationQuery('Getting your location...');
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            // Get the actual location name
            const locationName = await reverseGeocode(coords);
            
            setSelectedLocation({
              name: locationName,
              coords
            });
            setLocationQuery(locationName);
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
            maximumAge: 0 // Always get fresh location, no caching
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

    console.log('🔍 FreshaSearchBar: Search triggered with location:', selectedLocation);
    console.log('🔍 FreshaSearchBar: EXACT Coordinates being sent:', selectedLocation.coords);
    console.log('🔍 FreshaSearchBar: Lat:', selectedLocation.coords.lat, 'Lng:', selectedLocation.coords.lng);
    
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
    
    // Save search parameters to localStorage for persistence
    const searchParams = {
      service: selectedService,
      category: selectedCategory,
      location: selectedLocation,
      radius: selectedRadius,
      dateType: selectedDateType,
      date: selectedDate,
      timeType: selectedTimeType,
      customTimeRange: customTimeRange
    };
    localStorage.setItem('fresha-last-search', JSON.stringify(searchParams));
    console.log('Saved last search to localStorage:', searchParams);
    
    onSearch({
      service: selectedService || selectedCategory || '',
      coords: selectedLocation.coords,
      radius: selectedRadius,
      date: selectedDate,
      time: formattedTime,
      locationName: selectedLocation.name
    });
  };

  // Get current date and time (using local timezone)
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local timezone
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
      setSelectedDate(tomorrow.toLocaleDateString('en-CA')); // YYYY-MM-DD in local timezone
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

  // Timezone-aware time slot validation for "Today" selections
  const isTimeSlotDisabled = (timeSlot: 'morning' | 'afternoon' | 'evening'): boolean => {
    // Only apply filtering if "Today" is explicitly selected via the quick pill
    // OR if the selected date matches today's date (for calendar selections)
    
    // Use local date comparison to avoid timezone issues with ISO strings
    const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const isTodaySelected = selectedDateType === 'today' || selectedDate === todayLocal;
    
    if (!isTodaySelected) return false;

    const now = new Date();
    const currentHour = now.getHours();
    
    // Morning (6:00 AM - 12:00 PM): Disabled if current time is >= 12:00 PM
    if (timeSlot === 'morning' && currentHour >= 12) {
      return true;
    }
    
    // Afternoon (12:00 PM - 6:00 PM): Disabled if current time is >= 6:00 PM
    if (timeSlot === 'afternoon' && currentHour >= 18) {
      return true;
    }
    
    // Evening (6:00 PM - 11:00 PM): Disabled if current time is >= 11:00 PM
    if (timeSlot === 'evening' && currentHour >= 23) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-0">
      {/* Main Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 md:p-1">
        {/* Mobile: Stacked Layout | Desktop: Horizontal Layout */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-1">
          {/* Service Selection */}
          <div className="relative flex-1 w-full md:w-auto border-b md:border-b-0 border-gray-200 pb-2 md:pb-0" ref={serviceRef}>
            <button
              onClick={() => {
                // If a category is already selected, show sub-services
                if (selectedCategory && !showSubServices) {
                  setShowSubServices(true);
                  setShowServiceDropdown(true);
                } else {
                  setShowServiceDropdown(!showServiceDropdown);
                  if (showServiceDropdown) {
                    setShowSubServices(false);
                  }
                }
              }}
              className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 md:rounded-xl transition-colors"
            >
              <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-gray-900">
                {selectedService 
                  ? subServices.find(s => s.id === selectedService)?.name 
                  : selectedCategory 
                    ? mainCategories.find(c => c.id === selectedCategory)?.name
                    : 'All treatments'}
              </span>
              {/* Clear/Delete Icon - Only show when service is selected */}
              {selectedService && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent dropdown from opening
                    setSelectedService('');
                    setSelectedCategory('');
                    setShowSubServices(false);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
                  aria-label="Clear service selection"
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                </button>
              )}
            </button>
            
            {showServiceDropdown && (
              <div className="absolute top-full left-0 right-0 md:left-0 md:right-auto md:w-96 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-[70vh] overflow-y-auto">
                {!showSubServices ? (
                  // Show main categories
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900">Treatments</h3>
                    </div>
                    {mainCategories.map((category, index) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setSelectedService('');
                          setShowSubServices(true);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0",
                          selectedCategory === category.id && !selectedService && "bg-purple-50 hover:bg-purple-100"
                        )}
                      >
                        <span className="text-xl">{category.icon}</span>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  // Show sub-services for selected category
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowSubServices(false);
                          setSelectedService('');
                        }}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        ← Back
                      </button>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {mainCategories.find(c => c.id === selectedCategory)?.name}
                      </h3>
                    </div>
                    {subServices
                      .filter(service => service.categoryId === selectedCategory)
                      .map((service, index, array) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service.id);
                            setShowServiceDropdown(false);
                            setShowSubServices(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0",
                            selectedService === service.id && "bg-purple-50 hover:bg-purple-100"
                          )}
                        >
                          <span className="text-lg">{service.icon}</span>
                          <span className="text-gray-900">{service.name}</span>
                        </button>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Divider - Hidden on mobile */}
          <div className="hidden md:block w-px h-8 bg-gray-200" />

          {/* Location Selection */}
          <div className="relative flex-1 w-full md:w-auto border-b md:border-b-0 border-gray-200 pb-2 md:pb-0" ref={locationRef}>
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
              <div className="absolute top-full left-0 right-0 md:left-0 md:right-auto md:w-96 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-[70vh] overflow-y-auto">
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

          {/* Divider - Hidden on mobile */}
          <div className="hidden md:block w-px h-8 bg-gray-200" />

          {/* Date & Time Container - Compact single row */}
          <div className="flex gap-1 w-full md:w-auto border-b md:border-b-0 border-gray-200 pb-2 md:pb-0">
            {/* Date Selection */}
            <div className="relative flex-1" ref={dateRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors w-full"
            >
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 whitespace-nowrap">
                {getDateDisplayText()}
              </span>
            </button>
            
            {showDatePicker && (
              <div className="fixed md:absolute top-auto md:top-full left-4 md:left-0 md:right-auto mt-2 bg-white rounded-2xl shadow-2xl z-[99999] w-[calc(100%-2rem)] md:w-[420px] border border-gray-100 max-h-[85vh] overflow-y-auto">
                {/* Quick Date Selection Pills */}
                <div className="p-4 flex gap-2 flex-wrap border-b border-gray-100 bg-white sticky top-0 z-10">
                  <button
                    onClick={() => handleDateTypeChange('any')}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedDateType === 'any'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Any date
                  </button>
                  <button
                    onClick={() => handleDateTypeChange('today')}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedDateType === 'today'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleDateTypeChange('tomorrow')}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedDateType === 'tomorrow'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Tomorrow
                  </button>
                </div>
                
                {/* Calendar Grid - Compact Padding */}
                <div className="px-3 pb-3 pt-1">
                  <FreshaCalendar
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedDateType('any');
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Time Selection */}
          <div className="relative flex-1" ref={timeRef}>
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors w-full"
            >
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-900 whitespace-nowrap">
                {getTimeDisplayText()}
              </span>
            </button>
            
            {showTimePicker && (
              <div className="fixed md:absolute top-auto md:top-full left-4 md:left-0 md:right-auto mt-2 bg-white rounded-2xl shadow-2xl z-[99999] w-[calc(100%-2rem)] md:w-[320px] border border-gray-100 max-h-[85vh] overflow-y-auto">
                {/* Quick Time Selection Pills */}
                <div className="p-4 space-y-2 bg-white sticky top-0 z-10 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleTimeTypeChange('any')}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        selectedTimeType === 'any'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      Any time
                    </button>
                    <button
                      onClick={() => !isTimeSlotDisabled('morning') && handleTimeTypeChange('morning')}
                      disabled={isTimeSlotDisabled('morning')}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        isTimeSlotDisabled('morning')
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : selectedTimeType === 'morning'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      Morning
                    </button>
                    <button
                      onClick={() => !isTimeSlotDisabled('afternoon') && handleTimeTypeChange('afternoon')}
                      disabled={isTimeSlotDisabled('afternoon')}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        isTimeSlotDisabled('afternoon')
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : selectedTimeType === 'afternoon'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      Afternoon
                    </button>
                    <button
                      onClick={() => !isTimeSlotDisabled('evening') && handleTimeTypeChange('evening')}
                      disabled={isTimeSlotDisabled('evening')}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        isTimeSlotDisabled('evening')
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : selectedTimeType === 'evening'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      Evening
                    </button>
                  </div>
                  
                  {/* Time range indicators */}
                  <div className="text-xs text-gray-500 pl-1">
                    {selectedTimeType === 'morning' && '6:00 AM - 12:00 PM'}
                    {selectedTimeType === 'afternoon' && '12:00 PM - 6:00 PM'}
                    {selectedTimeType === 'evening' && '6:00 PM - 11:00 PM'}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Divider - Hidden on mobile */}
          <div className="hidden md:block w-px h-8 bg-gray-200" />

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
              onClick={() => {
                setSelectedRadius(option.value);
                // Auto-trigger search when radius changes
                if (selectedLocation) {
                  handleSearch();
                }
              }}
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