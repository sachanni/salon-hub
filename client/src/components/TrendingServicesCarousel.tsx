import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

interface TrendingService {
  id: string;
  name: string;
  image: string;
  category: string;
  nearbyCount: number;
  avgRating: number;
  popularityScore: number;
  basePrice?: string;
}

interface TrendingServicesCarouselProps {
  userLocation?: { lat: number; lng: number };
}

export default function TrendingServicesCarousel({ userLocation }: TrendingServicesCarouselProps) {
  const [, setLocationRoute] = useLocation();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const trendingServices: TrendingService[] = [
    {
      id: "haircut-styling",
      name: "Haircut & Styling",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
      category: "Hair",
      nearbyCount: 147,
      avgRating: 4.8,
      popularityScore: 95,
      basePrice: "₹499"
    },
    {
      id: "facial-treatment",
      name: "Facial Treatment",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop",
      category: "Skin",
      nearbyCount: 89,
      avgRating: 4.9,
      popularityScore: 92,
      basePrice: "₹799"
    },
    {
      id: "manicure-pedicure",
      name: "Manicure & Pedicure",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop",
      category: "Nails",
      nearbyCount: 112,
      avgRating: 4.7,
      popularityScore: 88,
      basePrice: "₹599"
    },
    {
      id: "massage-therapy",
      name: "Massage Therapy",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
      category: "Wellness",
      nearbyCount: 64,
      avgRating: 4.9,
      popularityScore: 90,
      basePrice: "₹1,299"
    },
    {
      id: "bridal-makeup",
      name: "Bridal Makeup",
      image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop",
      category: "Makeup",
      nearbyCount: 43,
      avgRating: 4.9,
      popularityScore: 87,
      basePrice: "₹8,999"
    },
    {
      id: "hair-color",
      name: "Hair Coloring",
      image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=300&fit=crop",
      category: "Hair",
      nearbyCount: 98,
      avgRating: 4.8,
      popularityScore: 85,
      basePrice: "₹1,499"
    },
    {
      id: "spa-package",
      name: "Spa Package",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop",
      category: "Wellness",
      nearbyCount: 52,
      avgRating: 4.8,
      popularityScore: 83,
      basePrice: "₹2,499"
    },
    {
      id: "beard-grooming",
      name: "Beard Grooming",
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop",
      category: "Hair",
      nearbyCount: 76,
      avgRating: 4.7,
      popularityScore: 80,
      basePrice: "₹399"
    }
  ];

  const handleServiceClick = (service: TrendingService) => {
    sessionStorage.setItem('salonSearchParams', JSON.stringify({
      service: service.name,
      coords: userLocation,
      radius: 10,
      locationName: userLocation ? "Your Location" : "Current Location",
      category: service.category
    }));
    setLocationRoute('/salons');
  };

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
  }, []);

  return (
    <section className="relative py-12 sm:py-16 bg-gradient-to-b from-white to-violet-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Trending Services
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Most popular services {userLocation ? "near you" : "this week"}
            </p>
          </div>

          {/* Navigation Buttons - Desktop */}
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

        {/* Carousel Container */}
        <div className="relative">
          {/* Gradient Fade - Left */}
          {canScrollLeft && (
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
          )}

          {/* Gradient Fade - Right */}
          {canScrollRight && (
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-violet-50/30 via-violet-50/20 to-transparent z-10 pointer-events-none" />
          )}

          {/* Scrollable Container */}
          <div
            id="trending-carousel"
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {trendingServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex-shrink-0 w-72 sm:w-80 snap-start group cursor-pointer"
                onClick={() => handleServiceClick(service)}
              >
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-2">
                  {/* Service Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Popularity Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-bold text-gray-900">{service.popularityScore}%</span>
                    </div>

                    {/* Category Tag */}
                    <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-white">{service.category}</span>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-violet-600 transition-colors">
                      {service.name}
                    </h3>

                    <div className="flex items-center justify-between mb-3">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold text-gray-900">{service.avgRating}</span>
                        <span className="text-xs text-gray-500">(2.4k)</span>
                      </div>

                      {/* Price */}
                      {service.basePrice && (
                        <div className="text-sm font-bold text-violet-600">
                          {service.basePrice}
                        </div>
                      )}
                    </div>

                    {/* Location Info */}
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-medium">
                        {service.nearbyCount} salons nearby
                      </span>
                    </div>

                    {/* CTA Button */}
                    <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-lg hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-300 shadow-md hover:shadow-lg">
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile Scroll Indicator */}
          <div className="flex md:hidden justify-center mt-4 gap-1.5">
            {Array.from({ length: Math.ceil(trendingServices.length / 2) }).map((_, index) => (
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
