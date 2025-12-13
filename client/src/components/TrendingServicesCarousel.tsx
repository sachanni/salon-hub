import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, TrendingUp, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SalonCard from "./SalonCard";

interface TrendingServicesCarouselProps {
  userLocation?: { lat: number; lng: number };
}

interface Salon {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  category: string;
  image: string;
  imageUrls?: string[];
  priceRange: string;
  distance?: number;
  hasPackages?: boolean;
  hasGoogleReviews?: boolean;
}

export default function TrendingServicesCarousel({ userLocation }: TrendingServicesCarouselProps) {
  const [, setLocationRoute] = useLocation();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: salons = [], isLoading, error } = useQuery<Salon[]>({
    queryKey: ['trending-salons', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
        params.append('radiusKm', '50');
      }
      params.append('minRating', '4.0');
      
      const response = await fetch(`/api/salons?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch salons');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayedSalons = salons.slice(0, 8);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('trending-carousel');
    if (!container) return;

    const scrollAmount = 320;
    const newPosition = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  const updateScrollButtons = () => {
    const container = document.getElementById('trending-carousel');
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
    setScrollPosition(container.scrollLeft);
  };

  useEffect(() => {
    const container = document.getElementById('trending-carousel');
    if (!container) return;

    container.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();

    return () => container.removeEventListener('scroll', updateScrollButtons);
  }, [displayedSalons]);

  if (isLoading) {
    return (
      <section className="relative py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading trending studios...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || displayedSalons.length === 0) {
    return null;
  }

  return (
    <section className="relative py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Trending Studios
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Top-rated studios {userLocation ? "near you" : "this week"}
            </p>
          </div>

          <div className="hidden md:flex gap-2">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-all ${
                canScrollLeft
                  ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-all ${
                canScrollRight
                  ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          {canScrollLeft && (
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
          )}

          {canScrollRight && (
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-violet-50/30 via-violet-50/20 to-transparent z-10 pointer-events-none" />
          )}

          <div
            id="trending-carousel"
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {displayedSalons.map((salon, index) => (
              <motion.div
                key={salon.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex-shrink-0 w-72 sm:w-80 snap-start"
              >
                <SalonCard
                  id={salon.id}
                  name={salon.name}
                  rating={salon.rating || 0}
                  reviewCount={salon.reviewCount || 0}
                  location={salon.location}
                  category={salon.category || 'beauty_salon'}
                  image={salon.image}
                  imageUrls={salon.imageUrls}
                  priceRange={salon.priceRange || '₹₹'}
                  distance={salon.distance}
                  hasPackages={salon.hasPackages}
                  hasGoogleReviews={salon.hasGoogleReviews}
                />
              </motion.div>
            ))}
          </div>

          <div className="flex md:hidden justify-center mt-4 gap-1.5">
            {Array.from({ length: Math.ceil(displayedSalons.length / 2) }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  Math.floor(scrollPosition / 320) === index
                    ? 'w-8 bg-violet-600'
                    : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
