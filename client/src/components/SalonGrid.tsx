import { useState, useEffect } from "react";
import SalonCard from "./SalonCard";
import salonImage1 from '@assets/generated_images/Modern_luxury_salon_interior_aa8eed5a.png';
import salonImage2 from '@assets/generated_images/Modern_nail_salon_interior_132903e9.png';
import salonImage3 from '@assets/generated_images/Relaxing_spa_massage_room_1508aeb5.png';

interface Salon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  category: string;
  priceRange: string;
  openTime?: string;
  image?: string;
}

interface SalonGridProps {
  title: string;
  subtitle?: string;
  onBookingClick?: (salonName: string, salonId: string) => void;
}

export default function SalonGrid({ title, subtitle, onBookingClick }: SalonGridProps) {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const response = await fetch('/api/salons');
        if (response.ok) {
          const fetchedSalons = await response.json();
          setSalons(fetchedSalons);
        } else {
          setSalons(mockSalonsData);
        }
      } catch (error) {
        console.error('Error fetching salons:', error);
        setSalons(mockSalonsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalons();
  }, []);

  const mockSalonsData = [
    {
      id: "1",
      name: "Artisan Theory Salon",
      rating: 5.0,
      reviewCount: 140,
      location: "100 Roosevelt Road, Villa Park",
      category: "Hair Salon",
      image: salonImage1,
      priceRange: "$$",
      openTime: "9 PM"
    },
    {
      id: "2",
      name: "LO Spa & Nails",
      rating: 4.9,
      reviewCount: 591,
      location: "Chicago Loop, Chicago",
      category: "Nails",
      image: salonImage2,
      priceRange: "$$$",
      openTime: "8 PM"
    },
    {
      id: "3",
      name: "Tranquil Spa Retreat",
      rating: 5.0,
      reviewCount: 328,
      location: "Downtown District",
      category: "Massage",
      image: salonImage3,
      priceRange: "$$$$",
      openTime: "10 PM"
    },
    {
      id: "4",
      name: "Elite Beauty Studio",
      rating: 4.8,
      reviewCount: 267,
      location: "Uptown Center",
      category: "Beauty Salon",
      image: salonImage1,
      priceRange: "$$$"
    },
    {
      id: "5",
      name: "Royal Nail Lounge",
      rating: 4.9,
      reviewCount: 892,
      location: "Westside Plaza",
      category: "Nails",
      image: salonImage2,
      priceRange: "$$",
      openTime: "9 PM"
    },
    {
      id: "6",
      name: "Zen Wellness Center",
      rating: 5.0,
      reviewCount: 156,
      location: "Garden District",
      category: "Spa & Wellness",
      image: salonImage3,
      priceRange: "$$$$"
    }
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" data-testid="text-section-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-section-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-muted rounded-lg p-6 animate-pulse">
                <div className="h-48 bg-muted-foreground/20 rounded mb-4"></div>
                <div className="h-6 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-10 bg-muted-foreground/20 rounded"></div>
              </div>
            ))
          ) : (
            salons.map((salon, index) => {
              const imageMap = [salonImage1, salonImage2, salonImage3];
              const salonWithImage = {
                ...salon,
                image: salon.image || imageMap[index % imageMap.length] || salonImage1
              };
              return (
                <SalonCard key={salon.id} {...salonWithImage} onBookingClick={onBookingClick} />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}