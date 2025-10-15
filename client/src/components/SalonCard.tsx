import { Star, MapPin, Clock, Eye, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SalonCardProps {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  category: string;
  image: string;
  imageUrls?: string[]; // Multiple images for gallery
  priceRange: string;
  openTime?: string;
  distance?: number; // Distance in kilometers for proximity search results
  services?: string[]; // Services offered
  availableTimeSlots?: Array<{ time: string; staffName?: string; available: boolean }>; // Available time slots
  onBookingClick?: (salonName: string, salonId: string) => void;
  searchQuery?: string; // Search query for highlighting matched services
  timeFilter?: string; // Time filter applied (e.g., "afternoon")
}

export default function SalonCard({
  id,
  name,
  rating,
  reviewCount,
  location,
  category,
  image,
  imageUrls = [],
  priceRange,
  openTime,
  distance,
  services = [],
  availableTimeSlots = [],
  onBookingClick,
  searchQuery = '',
  timeFilter = ''
}: SalonCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Book now clicked for salon:', id);
    onBookingClick?.(name, id);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Determine if we should show fallback image
  const showFallback = !image || imageError || image === 'none' || image.trim() === '';
  
  // Default salon image URL
  const defaultSalonImage = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500&h=300&fit=crop&crop=center';

  // Display images: use imageUrls if available, otherwise use primary image
  const displayImages = imageUrls.length > 0 ? imageUrls.slice(0, 3) : (showFallback ? [] : [image]);

  // Check if a service matches the search query
  const isServiceMatched = (service: string) => {
    if (!searchQuery) return false;
    return service.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Get time filter display text - handle both semantic tokens and formatted times
  const getTimeFilterText = () => {
    if (!timeFilter) return '';
    
    // Check for semantic tokens directly
    if (timeFilter === 'morning') return 'morning';
    if (timeFilter === 'afternoon') return 'afternoon';
    if (timeFilter === 'evening') return 'evening';
    
    // Check for formatted time ranges and map them back to semantic tokens
    if (timeFilter.includes('6:00 AM') && timeFilter.includes('12:00 PM')) return 'morning';
    if (timeFilter.includes('12:00 PM') && timeFilter.includes('6:00 PM')) return 'afternoon';
    if (timeFilter.includes('6:00 PM') && timeFilter.includes('11:00 PM')) return 'evening';
    
    return '';
  };

  return (
    <Link href={`/salon/${id}`}>
      <Card 
        data-testid={`card-salon-${id}`}
        className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white"
      >
        {/* Image Gallery Grid - Fresha Style */}
        <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
          {displayImages.length > 0 ? (
            displayImages.length === 1 ? (
              // Single image - full width
              <img 
                src={displayImages[0]}
                alt={name}
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            ) : (
              // Multiple images - grid layout (Fresha style)
              <div className="flex gap-1 h-full">
                <div className="flex-1 relative overflow-hidden">
                  <img 
                    src={displayImages[0]}
                    alt={`${name} - Image 1`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 w-1/3">
                  {displayImages[1] && (
                    <div className="flex-1 relative overflow-hidden">
                      <img 
                        src={displayImages[1]}
                        alt={`${name} - Image 2`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {displayImages[2] && (
                    <div className="flex-1 relative overflow-hidden">
                      <img 
                        src={displayImages[2]}
                        alt={`${name} - Image 3`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            // Fallback gradient when no images
            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
              <div className="text-white text-4xl font-bold">{name.charAt(0)}</div>
            </div>
          )}
          
          {/* Price badge overlay */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-gray-900 font-semibold">
              {priceRange}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-3 p-4 sm:p-5 space-y-3">
          {/* Title and Rating */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-1" data-testid={`text-salon-name-${id}`}>
              {name}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold" data-testid={`text-rating-${id}`}>
                  {rating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">({reviewCount})</span>
              </div>
              <Badge variant="outline" className="text-xs">{category}</Badge>
            </div>
          </div>

          {/* Location with distance badge */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600 truncate" data-testid={`text-location-${id}`}>
                {location}
              </span>
            </div>
            {distance !== undefined && (
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex-shrink-0">
                <MapPin className="h-3 w-3 mr-1" />
                {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
              </Badge>
            )}
          </div>

          {/* Services - Fresha Style with Pills (prioritize matched services) */}
          {services.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <div className="flex gap-1.5 flex-wrap">
                {/* Sort services: matched ones first, then others */}
                {[...services]
                  .sort((a, b) => {
                    const aMatched = isServiceMatched(a);
                    const bMatched = isServiceMatched(b);
                    if (aMatched && !bMatched) return -1;
                    if (!aMatched && bMatched) return 1;
                    return 0;
                  })
                  .map((service, index) => {
                    const matched = isServiceMatched(service);
                    return (
                      <span 
                        key={index}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          matched 
                            ? "bg-purple-600 text-white ring-2 ring-purple-300" // Highlighted matched services
                            : "bg-purple-50 text-purple-700" // Regular services
                        )}
                      >
                        {service}
                      </span>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Available Time Slots - Production-Ready with Real-Time Availability */}
          {availableTimeSlots.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {(() => {
                      const availableCount = availableTimeSlots.filter((s: any) => s.available).length;
                      const timeText = getTimeFilterText();
                      if (timeText) {
                        return `${availableCount} available slot${availableCount !== 1 ? 's' : ''} in ${timeText}`;
                      }
                      return availableCount > 0 ? 'Available times' : 'No availability';
                    })()}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {availableTimeSlots.map((slot: any, index: number) => {
                  const isAvailable = slot.available;
                  const isBooked = slot.booked;
                  const isPast = slot.past;
                  
                  return (
                    <button
                      key={index}
                      onClick={(e) => {
                        if (isAvailable) {
                          e.preventDefault();
                          e.stopPropagation();
                          handleBookNow(e);
                        }
                      }}
                      disabled={!isAvailable}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        isAvailable && "bg-white border border-gray-200 text-gray-700 hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700 cursor-pointer",
                        isBooked && "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed",
                        isPast && "bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed"
                      )}
                      data-testid={`button-time-slot-${index}`}
                      title={isBooked ? 'Booked' : isPast ? 'Past' : 'Available - Click to book'}
                    >
                      {slot.time}
                      {isBooked && <span className="ml-1 text-xs">(Booked)</span>}
                      {isPast && <span className="ml-1 text-xs">(Past)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // Show "No availability set" if business hours not configured
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">No availability set</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0 p-4 sm:p-5">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="flex-1"
              data-testid={`button-view-${id}`}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            <Button 
              data-testid={`button-book-${id}`}
              onClick={handleBookNow}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Book Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}