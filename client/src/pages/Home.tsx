import FreshaSearchBar from "@/components/FreshaSearchBar";
import SalonGrid from "@/components/SalonGrid";
import SalonMapView from "@/components/SalonMapView";
import RecentlyViewed from "@/components/RecentlyViewed";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

// Define SearchParams interface for communication between SearchBar and SalonGrid
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

  // Detect user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocationCoords(coords);
          setLocationAccuracy(position.coords.accuracy);
          console.log('Current location detected:', coords, 'Accuracy:', position.coords.accuracy);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          // Try to get cached location from localStorage
          const cachedLocation = localStorage.getItem('user_location');
          if (cachedLocation) {
            try {
              const location = JSON.parse(cachedLocation);
              setCurrentLocationCoords({ lat: location.lat, lng: location.lng });
              setLocationAccuracy(location.accuracy);
              console.log('Using cached location:', location);
            } catch (e) {
              console.warn('Failed to parse cached location');
            }
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  }, []);

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
    <div className="min-h-screen bg-background">
      <main>
        {/* Hero Section with Fresha-style Search */}
        <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80')"
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-16">
            {/* Hero Text */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Book local beauty and<br />
                <span className="text-yellow-300">wellness services</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                Discover and book appointments at top-rated salons, spas, and wellness centers near you
              </p>
            </div>
            
            {/* Fresha Search Bar */}
            <FreshaSearchBar
              onSearch={(params) => {
                console.log('Home: Received search params from FreshaSearchBar:', params);
                console.log('Home: Coordinates received:', params.coords);
                const searchParams: SearchParams = {
                  service: params.service,
                  coordinates: params.coords,
                  radius: params.radius,
                  category: params.service, // Map service to category
                };
                console.log('Home: Setting search params:', searchParams);
                setSearchParams(searchParams);
                setSearchLocationName(params.locationName || "Current Location"); // Set the actual location name
                setIsSearchActive(true);
                setShowMapView(true); // Show map view when search is performed
              }}
              currentLocationCoords={currentLocationCoords}
              locationAccuracy={locationAccuracy}
              savedLocations={[]}
            />
          </div>
        </div>
            {showMapView ? (
              <SalonMapView
                searchParams={searchParams}
                onBackToSearch={() => {
                  setShowMapView(false);
                  setIsSearchActive(false);
                  setSearchParams({});
                }}
                searchLocationName={searchLocationName}
              />
            ) : (
          <>
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
    </div>
  );
}