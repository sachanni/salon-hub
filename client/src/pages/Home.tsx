import Hero from "@/components/Hero";
import SalonGrid from "@/components/SalonGrid";
import RecentlyViewed from "@/components/RecentlyViewed";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState("");
  const [selectedSalonId, setSelectedSalonId] = useState("");
  const [salonsData, setSalonsData] = useState<any[]>([]);
  
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

  // Fetch salon data on component mount for recently viewed tracking
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        // Add cache-busting to ensure fresh data with images
        const response = await fetch('/api/salons?_=' + Date.now());
        if (response.ok) {
          const salons = await response.json();
          setSalonsData(salons);
          console.log('Fresh salon data loaded with images:', salons.find(s => s.name.includes('UNIBEAM'))?.image);
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
        <Hero />
        <RecentlyViewed onBookingClick={handleBookingClick} />
        <SalonGrid 
          title="Recommended" 
          subtitle="Discover the most popular salons and spas in your area" 
          onBookingClick={handleBookingClick}
        />
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