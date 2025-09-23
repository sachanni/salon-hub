import { useQuery } from "@tanstack/react-query";
import SalonCard from "./SalonCard";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, MapPin } from "lucide-react";
import salonImage1 from '@assets/generated_images/Modern_luxury_salon_interior_aa8eed5a.png';
import salonImage2 from '@assets/generated_images/Modern_nail_salon_interior_132903e9.png';
import salonImage3 from '@assets/generated_images/Relaxing_spa_massage_room_1508aeb5.png';

// Helper function to format distance for display (meters for nearby, km for far)
const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
};

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
  distance?: number; // Distance in kilometers for proximity search results
}

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

interface SalonGridProps {
  title: string;
  subtitle?: string;
  searchParams?: SearchParams;
  onBookingClick?: (salonName: string, salonId: string) => void;
}

export default function SalonGrid({ title, subtitle, searchParams, onBookingClick }: SalonGridProps) {
  // Build API URL with query parameters
  const buildApiUrl = () => {
    if (searchParams?.coordinates) {
      // Use proximity search
      const params = new URLSearchParams();
      params.append('lat', searchParams.coordinates.lat.toString());
      params.append('lng', searchParams.coordinates.lng.toString());
      params.append('radiusKm', (searchParams.radius || 0.5).toString());
      if (searchParams.service) params.append('q', searchParams.service);
      if (searchParams.category) params.append('category', searchParams.category);
      params.append('sort', searchParams.sortBy || 'distance');
      return `/api/search/salons?${params.toString()}`;
    } else {
      // Use regular search
      const params = new URLSearchParams();
      if (searchParams?.service) params.append('service', searchParams.service);
      if (searchParams?.category) params.append('category', searchParams.category);
      if (searchParams?.filters?.priceRange) {
        params.append('minPrice', searchParams.filters.priceRange[0].toString());
        params.append('maxPrice', searchParams.filters.priceRange[1].toString());
      }
      if (searchParams?.filters?.minRating) params.append('minRating', searchParams.filters.minRating.toString());
      if (searchParams?.sortBy) params.append('sortBy', searchParams.sortBy);
      if (searchParams?.filters?.availableToday) params.append('availableToday', 'true');
      if (searchParams?.filters?.specificServices?.length) {
        params.append('services', searchParams.filters.specificServices.join(','));
      }
      
      return `/api/salons${params.toString() ? '?' + params.toString() : ''}`;
    }
  };

  // Use React Query for data fetching
  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['salons', searchParams],
    queryFn: async () => {
      const apiUrl = buildApiUrl();
      console.log('SalonGrid: Making API call to:', apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch salons: ${response.status}`);
      }
      const data = await response.json();
      console.log('SalonGrid: API response received:', { salonCount: data?.salons?.length || data?.length || 0, hasCoordinates: !!searchParams?.coordinates });
      return data;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract salons from response and fix data shape mismatch with safe defaults
  const salons = rawData?.salons ? rawData.salons.map((salon: any) => ({
    ...salon,
    // Map distance_km to distance for SalonCard compatibility
    distance: salon.distance_km,
    // Format location from address and city
    location: salon.address && salon.city ? `${salon.address}, ${salon.city}` : salon.location || 'Location not specified',
    // Use imageUrl from proximity search or fallback to image
    image: salon.imageUrl || salon.image || '',
    // Ensure priceRange has a safe default
    priceRange: salon.priceRange || salon.price_range || '$$',
    // Ensure category has a safe default
    category: salon.category || 'Beauty Services',
    // Ensure rating has a safe default
    rating: salon.rating || 0,
    // Ensure reviewCount has a safe default
    reviewCount: salon.reviewCount || salon.review_count || 0
  })) : rawData || [];

  // NEVER use mock data - production apps should show real data or proper error states
  const displaySalons = salons;

  return (
    <section className="py-8 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" data-testid="text-section-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4 sm:px-0" data-testid="text-section-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {isLoading ? (
            // Loading skeleton state
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-muted rounded-lg p-6 animate-pulse" data-testid={`salon-skeleton-${index}`}>
                <div className="h-48 bg-muted-foreground/20 rounded mb-4"></div>
                <div className="h-6 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-10 bg-muted-foreground/20 rounded"></div>
              </div>
            ))
          ) : error ? (
            // Error state with retry functionality - NEVER show mock data
            <div className="col-span-full flex flex-col items-center justify-center py-12 px-4" data-testid="salon-grid-error">
              <div className="text-center max-w-md mx-auto">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to load salons</h3>
                <p className="text-muted-foreground mb-6">
                  {searchParams?.coordinates 
                    ? 'We\'re having trouble finding salons in your area. Please check your connection and try again.'
                    : 'We\'re having trouble loading salon information. Please check your connection and try again.'
                  }
                </p>
                <Button 
                  onClick={() => refetch()} 
                  variant="outline" 
                  className="gap-2"
                  data-testid="button-retry-salons"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : displaySalons.length === 0 ? (
            // Empty state when no salons found
            <div className="col-span-full flex flex-col items-center justify-center py-12 px-4" data-testid="salon-grid-empty">
              <div className="text-center max-w-md mx-auto">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchParams?.coordinates ? 'No salons found nearby' : 'No salons found'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchParams?.coordinates 
                    ? `We couldn't find any salons within ${searchParams.radius ? formatDistance(searchParams.radius) : '500m'} of your location. Try expanding your search radius or choosing a different area.`
                    : 'No salons match your current search criteria. Try adjusting your filters or search terms.'
                  }
                </p>
              </div>
            </div>
          ) : (
            // Display actual salon results
            displaySalons.map((salon: Salon, index: number) => {
              const imageMap = [salonImage1, salonImage2, salonImage3];
              const salonWithImage = {
                ...salon,
                // Only use fallback images if no real image is provided
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