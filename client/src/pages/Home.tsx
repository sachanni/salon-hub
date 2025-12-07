import FreshaSearchBar from "@/components/FreshaSearchBar";
import Footer from "@/components/Footer";
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog";
import HowItWorks from "@/components/HowItWorks";
import TrustSignals from "@/components/TrustSignals";
import SpecialOffersBanner from "@/components/SpecialOffersBanner";
import DownloadAppSection from "@/components/DownloadAppSection";
import UserTestimonials from "@/components/UserTestimonials";
import LoyaltyProgramCard from "@/components/LoyaltyProgramCard";
import USPStrip from "@/components/USPStrip";
import TrendingServicesCarousel from "@/components/TrendingServicesCarousel";
import RebookingSuggestions from "@/components/RebookingSuggestions";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LocationStorage } from "@/utils/versionManager";
import { TrendingUp } from "lucide-react";

export default function Home() {
  const [currentLocationCoords, setCurrentLocationCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [locationAccuracy, setLocationAccuracy] = useState<number | undefined>(undefined);
  const [bookingCount, setBookingCount] = useState(455234);
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocationRoute] = useLocation();

  // Auto-detect business owners and redirect appropriately
  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated && user) {
      const isBusinessOwner = user.roles.includes('owner');
      
      if (isBusinessOwner) {
        const hasCompletedSetup = user.orgMemberships && user.orgMemberships.length > 0;
        
        if (!hasCompletedSetup) {
          setLocationRoute('/business/setup');
          return;
        } else {
          setLocationRoute('/business/dashboard');
          return;
        }
      }
    }
  }, [isAuthenticated, user, isLoading, setLocationRoute]);

  // Animate booking counter
  useEffect(() => {
    const interval = setInterval(() => {
      setBookingCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const handleSearch = (params: {
    service: string;
    coords?: { lat: number; lng: number };
    radius: number;
    date?: string;
    time?: string;
    locationName?: string;
  }) => {
    sessionStorage.setItem('salonSearchParams', JSON.stringify({
      service: params.service,
      coords: params.coords,
      radius: params.radius,
      locationName: params.locationName || "Current Location",
      time: params.time,
      date: params.date
    }));

    setLocationRoute('/salons');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50">
      <main>
        {/* Hero Section with Search - Optimized for Conversion */}
        <div className="relative min-h-screen flex items-center justify-center overflow-visible">
          {/* Gradient Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-100/60 via-transparent to-indigo-50/60"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-pink-50/40 to-transparent"></div>
          </div>
          
          {/* Animated Gradient Orbs */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-violet-200/40 to-purple-300/40 rounded-full blur-3xl animate-float"></div>
            <div className="absolute top-1/3 right-10 w-80 h-80 bg-gradient-to-br from-fuchsia-200/40 to-pink-300/40 rounded-full blur-3xl animate-float-delayed"></div>
            <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-rose-200/40 to-purple-200/40 rounded-full blur-3xl animate-float-slow"></div>
          </div>
          
          {/* Subtle Mesh Pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(139, 92, 246) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
          
          {/* Content */}
          <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            {/* Simplified Hero Text */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
                Book Beauty Services
                <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                  {" "}In 30 Seconds
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed px-4 mb-6">
                Top-rated salons, instant booking, verified professionals
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-5xl mx-auto">
              <FreshaSearchBar
                onSearch={handleSearch}
                currentLocationCoords={currentLocationCoords}
                locationAccuracy={locationAccuracy}
                savedLocations={[]}
              />
            </div>
            
            {/* Live Booking Counter & Stats */}
            <div className="mt-12 sm:mt-16">
              {/* Live Counter with Animation */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <TrendingUp className="w-5 h-5 text-green-600 animate-pulse" />
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-purple-600 text-lg tabular-nums">
                    {bookingCount.toLocaleString()}
                  </span>
                  {" "}appointments booked today
                </p>
              </div>

              {/* Trust Stats */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-gray-600">
                <div className="text-center px-4">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">250K+</p>
                  <p className="text-xs sm:text-sm">Verified Professionals</p>
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
                <div className="text-center px-4">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">120+</p>
                  <p className="text-xs sm:text-sm">Cities Covered</p>
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
                <div className="text-center px-4">
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">4.9★</p>
                  <p className="text-xs sm:text-sm">Average Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* USP Strip - Immediate Value Props */}
        <USPStrip />
        
        {/* Personalized Rebooking Suggestions - For returning customers */}
        <RebookingSuggestions />
        
        {/* Trending Services Carousel - Discovery & Engagement */}
        <TrendingServicesCarousel userLocation={currentLocationCoords} />
        
        {/* Social Proof Block - Trust Building */}
        <TrustSignals />
        
        {/* Special Offers Banner - Urgency & Conversion */}
        <SpecialOffersBanner />
        
        {/* How It Works - Education */}
        <HowItWorks />
        
        {/* User Testimonials - Deep Validation */}
        <UserTestimonials />
        
        {/* Loyalty Program - Incentive to Join */}
        <LoyaltyProgramCard />
        
        {/* App Download - Final CTA */}
        <DownloadAppSection />
      </main>
      
      <Footer />

      <LocationPermissionDialog
        onPermissionGranted={handleLocationGranted}
        onPermissionDenied={handleLocationDenied}
      />
    </div>
  );
}
