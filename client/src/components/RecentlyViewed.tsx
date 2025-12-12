import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import SalonCard from "./SalonCard";
import { useRef, useState, useEffect } from "react";

interface RecentlyViewedProps {
  onBookingClick?: (salonName: string, salonId: string) => void;
}

export default function RecentlyViewed({ onBookingClick }: RecentlyViewedProps) {
  const { getRecentlyViewed, hasRecentlyViewed } = useRecentlyViewed();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const recentSalons = getRecentlyViewed(8); // Display up to 8 salons

  // Update scroll button states
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    
    // Also update on resize
    const handleResize = () => updateScrollButtons();
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', handleResize);
    };
  }, [recentSalons]);

  // Scroll functions
  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 280; // Compact card width + gap
    scrollContainerRef.current.scrollBy({
      left: -cardWidth * 2, // Scroll by 2 cards
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;
    const cardWidth = 280; // Compact card width + gap
    scrollContainerRef.current.scrollBy({
      left: cardWidth * 2, // Scroll by 2 cards
      behavior: 'smooth'
    });
  };

  // Don't render if no recently viewed salons
  if (!hasRecentlyViewed || recentSalons.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30" data-testid="section-recently-viewed">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-recently-viewed-title">
                Recently viewed
              </h2>
              <p className="text-muted-foreground" data-testid="text-recently-viewed-subtitle">
                Continue where you left off
              </p>
            </div>
          </div>
          
          {/* Navigation arrows - only show if needed */}
          {recentSalons.length > 3 && (
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                data-testid="button-scroll-left"
                className="h-10 w-10"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollRight}
                disabled={!canScrollRight}
                data-testid="button-scroll-right"
                className="h-10 w-10"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Horizontally scrolling salon cards */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{
              WebkitOverflowScrolling: 'touch'
            }}
            data-testid="container-recently-viewed-scroll"
          >
            {recentSalons.map((salon) => (
              <div 
                key={salon.id} 
                className="flex-none w-[260px] sm:w-[280px] snap-start"
                data-testid={`item-recently-viewed-${salon.id}`}
              >
                <SalonCard
                  id={salon.id}
                  name={salon.name}
                  rating={salon.rating}
                  reviewCount={salon.reviewCount}
                  location={salon.location}
                  category={salon.category}
                  image={salon.image || ''}
                  priceRange={salon.priceRange}
                  onBookingClick={onBookingClick}
                />
              </div>
            ))}
          </div>
          
          {/* Fade effect on sides for better UX */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>

        {/* Mobile scroll indicator */}
        {recentSalons.length > 1 && (
          <div className="flex justify-center mt-4 md:hidden">
            <p className="text-sm text-muted-foreground" data-testid="text-swipe-hint">
              Swipe to see more
            </p>
          </div>
        )}
      </div>
    </section>
  );
}