import Hero from "@/components/Hero";
import SalonGrid from "@/components/SalonGrid";
import RecentlyViewed from "@/components/RecentlyViewed";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState("");
  const [selectedSalonId, setSelectedSalonId] = useState("");
  const [salonsData, setSalonsData] = useState<any[]>([]);
  
  const { addRecentlyViewed } = useRecentlyViewed();

  // Fetch salon data on component mount for recently viewed tracking
  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const response = await fetch('/api/salons');
        if (response.ok) {
          const salons = await response.json();
          setSalonsData(salons);
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