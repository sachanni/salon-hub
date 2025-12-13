import FreshaSearchBar from "@/components/FreshaSearchBar";
import SalonGrid from "@/components/SalonGrid";
import SalonMapView from "@/components/SalonMapView";
import RecentlyViewed from "@/components/RecentlyViewed";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog";
import SearchResultsHeader from "@/components/SearchResultsHeader";
import FilterPanel, { FilterState } from "@/components/FilterPanel";
import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { LocationStorage } from "@/utils/versionManager";
import { MapIcon, Grid3x3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchParams {
  coordinates?: { lat: number; lng: number };
  radius?: number;
  service?: string;
  category?: string;
  sortBy?: string;
  time?: string;
  date?: string;
  filters?: {
    priceRange?: [number, number];
    minRating?: number;
    availableToday?: boolean;
    specificServices?: string[];
  };
}

export default function Salons() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState("");
  const [selectedSalonId, setSelectedSalonId] = useState("");
  const [salonsData, setSalonsData] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [searchLocationName, setSearchLocationName] = useState<string>("Current Location");
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>(undefined);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filteredSalonCount, setFilteredSalonCount] = useState<number>(0);
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'recommended',
    maxPrice: 10000,
    venueType: 'everyone',
    instantBooking: false,
    availableToday: false,
  });
  
  const { addRecentlyViewed } = useRecentlyViewed();
  const { toast } = useToast();

  // Handle location permission granted
  const handleLocationGranted = (coords: { lat: number; lng: number }) => {
    setCurrentLocationCoords(coords);
    LocationStorage.save('user', coords, undefined, 24 * 60 * 60 * 1000);
  };

  // Handle location permission denied
  const handleLocationDenied = () => {
    const cachedData = LocationStorage.get('user');
    if (cachedData) {
      setCurrentLocationCoords(cachedData.coords);
      setLocationAccuracy(undefined);
    }
  };

  // Fetch salon data and check for saved search params on component mount
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const response = await fetch('/api/salons?_=' + Date.now());
        if (response.ok) {
          const salons = await response.json();
          setSalonsData(salons);
        }
      } catch (error) {
        console.error('Error fetching salons:', error);
      }
    };
    
    fetchSalons();

    // Load cached location on mount (so it's available before button press)
    const cachedData = LocationStorage.get('user');
    if (cachedData && !currentLocationCoords) {
      setCurrentLocationCoords(cachedData.coords);
      console.log('📍 Loaded cached location:', cachedData.coords);
    }

    // Check for saved search params from Home page
    const savedParams = sessionStorage.getItem('salonSearchParams');
    if (savedParams) {
      try {
        const params = JSON.parse(savedParams);
        // Map params from Home to SalonGrid format
        setSearchParams({
          service: params.service,
          coordinates: params.coords,  // Map 'coords' to 'coordinates'
          radius: params.radius,
          category: params.service,  // Use service as category
          time: params.time,
          date: params.date,
        });
        setSearchLocationName(params.locationName || "Current Location");
        setIsSearchActive(true);
        // Clear the saved params after using them
        sessionStorage.removeItem('salonSearchParams');
      } catch (error) {
        console.error('Error parsing saved search params:', error);
      }
    }
  }, []);

  const handleBookingClick = (salonName: string, salonId: string) => {
    const salonData = salonsData.find(salon => salon.id === salonId);
    if (salonData) {
      addRecentlyViewed({
        id: salonData.id,
        name: salonData.name,
        rating: salonData.rating,
        reviewCount: salonData.reviewCount,
        location: salonData.location,
        category: salonData.category,
        priceRange: salonData.priceRange,
        image: salonData.image
      });
    }
    
    if (isBookingOpen) {
      setIsBookingOpen(false);
      setTimeout(() => {
        setSelectedSalon(salonName);
        setSelectedSalonId(salonId);
        setIsBookingOpen(true);
      }, 100);
    } else {
      setSelectedSalon(salonName);
      setSelectedSalonId(salonId);
      setIsBookingOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50">
      <main>
        {showMapView ? (
          <div className="h-screen flex flex-col overflow-hidden">
            {/* Search bar - fixed height */}
            <div className="flex-shrink-0 z-50 bg-white/95 backdrop-blur-md border-b border-violet-200/50 shadow-lg overflow-visible">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-visible">
                <FreshaSearchBar
                  onSearch={(params) => {
                    const searchParams: SearchParams = {
                      service: params.service,
                      coordinates: params.coords,
                      radius: params.radius,
                      category: params.service,
                      time: params.time,
                      date: params.date,
                    };
                    setSearchParams(searchParams);
                    setSearchLocationName(params.locationName || "Current Location");
                    setIsSearchActive(true);
                    setShowMapView(true);
                  }}
                  currentLocationCoords={currentLocationCoords}
                  locationAccuracy={locationAccuracy}
                  savedLocations={[]}
                />
              </div>
            </div>
            
            {/* Map view fills remaining height */}
            <div className="flex-1 overflow-hidden">
              <SalonMapView
                searchParams={searchParams}
                onBackToSearch={() => {
                setShowMapView(false);
                setIsSearchActive(false);
                setSearchParams({});
              }}
              onToggleToGrid={() => {
                setShowMapView(false);
              }}
              searchLocationName={searchLocationName}
              onSalonCountChange={setFilteredSalonCount}
              />
            </div>
          </div>
        ) : (
          <>
            {!isSearchActive ? (
              /* Initial Landing - Hero Section with Search */
              (<div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                  <div className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">Find Your Perfect Studio</h1>
                    <p className="text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto">
                      Browse thousands of verified studios, spas, and beauty professionals
                    </p>
                  </div>

                  <div className="max-w-5xl mx-auto">
                    <FreshaSearchBar
                      onSearch={(params) => {
                        const searchParams: SearchParams = {
                          service: params.service,
                          coordinates: params.coords,
                          radius: params.radius,
                          category: params.service,
                          time: params.time,
                          date: params.date,
                        };
                        setSearchParams(searchParams);
                        setSearchLocationName(params.locationName || "Current Location");
                        setIsSearchActive(true);
                      }}
                      currentLocationCoords={currentLocationCoords}
                      locationAccuracy={locationAccuracy}
                      savedLocations={[]}
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setShowMapView(false)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                        !showMapView 
                          ? 'bg-white text-purple-600 shadow-lg' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Grid3x3 className="w-5 h-5" />
                      Grid View
                    </button>
                    <button
                      onClick={() => {
                        // Auto-search with current location when switching to map view
                        const coords = currentLocationCoords;
                        
                        if (!coords) {
                          // No location available - show toast and stay on current view
                          toast({
                            title: "Location Required",
                            description: "Please enable location access to use map view. Click 'Allow' when prompted.",
                            variant: "default",
                          });
                          return;
                        }
                        
                        // Location available - auto-search and switch to map
                        setIsAutoSearching(true);
                        const autoSearchParams: SearchParams = {
                          coordinates: coords,
                          radius: 10, // Default 10km radius (matches existing default)
                          service: '', // All treatments
                          category: '',
                        };
                        setSearchParams(autoSearchParams);
                        setSearchLocationName('Current Location');
                        setIsSearchActive(true);
                        setShowMapView(true);
                        
                        // Clear loading state after a brief delay
                        setTimeout(() => setIsAutoSearching(false), 500);
                      }}
                      disabled={isAutoSearching}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                        showMapView 
                          ? 'bg-white text-purple-600 shadow-lg' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      } ${isAutoSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <MapIcon className="w-5 h-5" />
                      {isAutoSearching ? 'Loading...' : 'Map View'}
                    </button>
                  </div>
                </div>
              </div>)
            ) : (
              /* Search Active - Compact Header with Search Bar (Map Style) */
              (<div className="sticky top-0 z-40 bg-white shadow-sm">
                {/* Search Bar - Same as Map View */}
                <div className="border-b border-gray-200 py-4 px-4">
                  <FreshaSearchBar
                    onSearch={(params) => {
                      const searchParams: SearchParams = {
                        service: params.service,
                        coordinates: params.coords,
                        radius: params.radius,
                        category: params.service,
                        time: params.time,
                        date: params.date,
                      };
                      setSearchParams(searchParams);
                      setSearchLocationName(params.locationName || "Current Location");
                      setIsSearchActive(true);
                    }}
                    currentLocationCoords={currentLocationCoords}
                    locationAccuracy={locationAccuracy}
                    savedLocations={[]}
                  />
                </div>
                {/* Results Header */}
                <SearchResultsHeader
                  salonCount={filteredSalonCount}
                  locationName={searchLocationName}
                  onOpenFilters={() => setIsFilterPanelOpen(true)}
                  viewMode={showMapView ? 'map' : 'grid'}
                  onToggleView={(mode) => setShowMapView(mode === 'map')}
                />
              </div>)
            )}

            {/* Salon Listings */}
            <div className="py-8">
              {/* Only show Recently Viewed when NOT searching */}
              {!isSearchActive && <RecentlyViewed onBookingClick={handleBookingClick} />}
              
              {isSearchActive ? (
                <SalonGrid 
                  title="Search Results" 
                  subtitle={searchParams.coordinates 
                    ? `Found salons within ${searchParams.radius || 10}km of your location`
                    : "Results for your search"
                  }
                  searchParams={searchParams}
                  onBookingClick={handleBookingClick}
                  onSalonCountChange={setFilteredSalonCount}
                />
              ) : (
                <>
                  <SalonGrid 
                    title="Recommended for You" 
                    subtitle="Discover the most popular salons and spas in your area" 
                    onBookingClick={handleBookingClick}
                  />
                  <SalonGrid 
                    title="New to SalonHub" 
                    subtitle="Recently joined salons offering exceptional services" 
                    onBookingClick={handleBookingClick}
                  />
                  <SalonGrid 
                    title="Trending Now" 
                    subtitle="The most booked services this week" 
                    onBookingClick={handleBookingClick}
                  />
                </>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        salonName={selectedSalon}
        salonId={selectedSalonId}
      />
      <LocationPermissionDialog
        onPermissionGranted={handleLocationGranted}
        onPermissionDenied={handleLocationDenied}
      />
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          // Filters will be applied through SalonGrid component
        }}
        currentFilters={filters}
      />
    </div>
  );
}
