import FreshaSearchBar from "@/components/FreshaSearchBar";
import SalonGrid from "@/components/SalonGrid";
import SalonMapView from "@/components/SalonMapView";
import RecentlyViewed from "@/components/RecentlyViewed";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog";
import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LocationStorage } from "@/utils/versionManager";

// Define SearchParams interface for communication between SearchBar and SalonGrid
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

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState("");
  const [selectedSalonId, setSelectedSalonId] = useState("");
  const [salonsData, setSalonsData] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams>({});
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [searchLocationName, setSearchLocationName] = useState<string>("Nirala Estate, Greater Noida");
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>(undefined);
  
  const { addRecentlyViewed } = useRecentlyViewed();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Auto-detect business owners and redirect appropriately
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load
    
    if (isAuthenticated && user) {
      // Check if user is a business owner
      const isBusinessOwner = user.roles.includes('owner');
      
      if (isBusinessOwner) {
        // Check if they have completed business setup (have organizations/salons)
        const hasCompletedSetup = user.orgMemberships && user.orgMemberships.length > 0;
        
        if (!hasCompletedSetup) {
          console.log('Business owner detected without setup, redirecting to business setup');
          setLocation('/business/setup');
          return;
        } else {
          // Business owner with completed setup should go to dashboard, not customer home page
          console.log('Business owner with completed setup, redirecting to dashboard');
          setLocation('/business/dashboard');
          return;
        }
      }
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  // Handle location permission granted
  const handleLocationGranted = (coords: { lat: number; lng: number }) => {
    setCurrentLocationCoords(coords);
    
    // Save to versioned storage with 24h TTL
    LocationStorage.save('user', coords, undefined, 24 * 60 * 60 * 1000);
    console.log('✅ Location permission granted:', coords);
  };

  // Handle location permission denied
  const handleLocationDenied = () => {
    // Try to get cached location from versioned storage
    const cachedData = LocationStorage.get('user');
    if (cachedData) {
      setCurrentLocationCoords(cachedData.coords);
      setLocationAccuracy(undefined);
      console.log('Using cached location (permission denied):', cachedData.coords);
    } else {
      console.log('❌ Location permission denied, no cached data available');
    }
  };

  // Fetch salon data on component mount for recently viewed tracking
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        // Add cache-busting to ensure fresh data with images
        const response = await fetch('/api/salons?_=' + Date.now());
        if (response.ok) {
          const salons = await response.json();
          setSalonsData(salons);
          console.log('Fresh salon data loaded with images:', salons.length);
        }
      } catch (error) {
        console.error('Error fetching salons for recently viewed:', error);
      }
    };
    
    fetchSalons();
  }, []);

  const handleBookingClick = (salonName: string, salonId: string) => {
    // Track salon view for recently viewed feature
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
    // Close modal first if it's open to force a clean state reset
    if (isBookingOpen) {
      setIsBookingOpen(false);
      // Use setTimeout to ensure modal closes before opening with new salon
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
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-pink-100 to-rose-50">
      <main>
        {showMapView ? (
          /* Map View with Search Bar at Top - Fresha Style */
          <div className="min-h-screen">
            {/* Compact Search Bar at Top - Sticky */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-violet-200/50 shadow-lg overflow-visible">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-visible">
                <FreshaSearchBar
                  onSearch={(params) => {
                    console.log('🏠 Home: Received search params from FreshaSearchBar:', params);
                    console.log('🏠 Home: Coordinates received:', params.coords);
                    console.log('🏠 Home: EXACT Lat:', params.coords?.lat, 'Lng:', params.coords?.lng);
                    const searchParams: SearchParams = {
                      service: params.service,
                      coordinates: params.coords,
                      radius: params.radius,
                      category: params.service,
                      time: params.time,
                      date: params.date,
                    };
                    console.log('🏠 Home: Setting search params:', searchParams);
                    console.log('🏠 Home: searchParams.coordinates:', searchParams.coordinates);
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
            
            {/* Map View Component */}
            <SalonMapView
              searchParams={searchParams}
              onBackToSearch={() => {
                setShowMapView(false);
                setIsSearchActive(false);
                setSearchParams({});
              }}
              searchLocationName={searchLocationName}
            />
          </div>
        ) : (
          <>
            {/* Hero Section with Professional Design - Only shown when not in map view */}
            <div className="relative min-h-screen flex items-center justify-center overflow-visible">
              {/* Layered Gradient Overlays for Visual Depth - No duplicate background */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-tl from-purple-100/60 via-transparent to-indigo-50/60"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-50/40 to-transparent"></div>
              </div>
              
              {/* Animated Gradient Orbs - Light & Soft */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-300/40 rounded-full blur-3xl animate-float"></div>
                <div className="absolute top-1/3 right-10 w-80 h-80 bg-gradient-to-br from-fuchsia-200/40 to-pink-300/40 rounded-full blur-3xl animate-float-delayed"></div>
                <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-rose-200/40 to-purple-200/40 rounded-full blur-3xl animate-float-slow"></div>
              </div>
              
              {/* Subtle Mesh Pattern Overlay */}
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(139, 92, 246) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
              
              {/* Content */}
              <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
                {/* Hero Text */}
                <div className="text-center mb-8 sm:mb-12">
                  <div className="inline-block mb-4 px-4 py-2 bg-violet-100/60 backdrop-blur-sm rounded-full border border-violet-200">
                    <p className="text-sm sm:text-base text-violet-900 font-medium">✨ Your Beauty & Wellness Journey Starts Here</p>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
                    Book local beauty and
                    <br className="hidden sm:block" />
                    <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                      {" "}wellness services
                    </span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed px-4">
                    Discover and book appointments at top-rated salons, spas, and wellness centers near you
                  </p>
                </div>
                
                {/* Search Bar with Enhanced Styling */}
                <div className="max-w-5xl mx-auto">
                  <FreshaSearchBar
                    onSearch={(params) => {
                      console.log('🏠 Home: Received search params from FreshaSearchBar:', params);
                      console.log('🏠 Home: Coordinates received:', params.coords);
                      console.log('🏠 Home: EXACT Lat:', params.coords?.lat, 'Lng:', params.coords?.lng);
                      const searchParams: SearchParams = {
                        service: params.service,
                        coordinates: params.coords,
                        radius: params.radius,
                        category: params.service,
                      };
                      console.log('🏠 Home: Setting search params:', searchParams);
                      console.log('🏠 Home: searchParams.coordinates:', searchParams.coordinates);
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
                
                {/* Trust Indicators */}
                <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-gray-600">
                  <div className="text-center px-4">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">455K+</p>
                    <p className="text-xs sm:text-sm">Bookings Today</p>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
                  <div className="text-center px-4">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">10K+</p>
                    <p className="text-xs sm:text-sm">Partner Salons</p>
                  </div>
                  <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
                  <div className="text-center px-4">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">4.8★</p>
                    <p className="text-xs sm:text-sm">Average Rating</p>
                  </div>
                </div>
              </div>
            </div>
            
            <RecentlyViewed onBookingClick={handleBookingClick} />
            {isSearchActive ? (
              <SalonGrid 
                title="Search Results" 
                subtitle={searchParams.coordinates 
                  ? `Found salons within ${searchParams.radius || 10}km of your location`
                  : "Results for your search"
                }
                searchParams={searchParams}
                onBookingClick={handleBookingClick}
              />
            ) : (
              <SalonGrid 
                title="Recommended" 
                subtitle="Discover the most popular salons and spas in your area" 
                onBookingClick={handleBookingClick}
              />
            )}
            {!isSearchActive && (
              <>
                <SalonGrid 
                  title="New to SalonHub" 
                  subtitle="Recently joined salons offering exceptional services" 
                  onBookingClick={handleBookingClick}
                />
                <SalonGrid 
                  title="Trending" 
                  subtitle="The most booked services this week" 
                  onBookingClick={handleBookingClick}
                />
              </>
            )}
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
    </div>
  );
}