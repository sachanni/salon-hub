import { Star, MapPin, BadgeCheck, Package, CreditCard, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useState } from "react";

interface ServiceDetail {
  name: string;
  durationMinutes: number;
  price: number;
  currency?: string;
  imageUrl?: string | null;
}

interface SalonCardProps {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  category: string;
  image: string;
  imageUrls?: string[];
  priceRange: string;
  openTime?: string;
  closeTime?: string;
  distance?: number;
  services?: ServiceDetail[];
  availableTimeSlots?: Array<{ time: string; staffName?: string; available: boolean }>;
  onBookingClick?: (salonName: string, salonId: string) => void;
  searchQuery?: string;
  timeFilter?: string;
  showServices?: boolean;
  hasPackages?: boolean;
  hasGoogleReviews?: boolean;
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
  distance,
  hasPackages = false,
  hasGoogleReviews = false,
  availableTimeSlots = [],
  onBookingClick,
}: SalonCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Call onBookingClick when card is clicked to track recently viewed
  const handleCardClick = () => {
    if (onBookingClick) {
      console.log('🔵 SalonCard clicked - calling onBookingClick for:', name, id);
      onBookingClick(name, id);
    }
  };

  // Format category to Title Case (remove snake_case)
  const formatCategory = (cat: string) => {
    return cat
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
  
  // Generate a unique fallback image URL based on salon ID
  // Using different Unsplash salon images to ensure variety
  const salonImageOptions = [
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', // Spa massage wellness
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop', // Wellness retreat spa
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&h=400&fit=crop', // Yoga meditation studio
    'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&h=400&fit=crop', // Luxury spa treatment
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&h=400&fit=crop', // Wellness studio
    'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&h=400&fit=crop', // Fitness wellness
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=400&fit=crop', // Peaceful spa
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop', // Wellness therapy
  ];
  
  // Generate consistent index from salon ID to ensure same salon always gets same fallback
  const getImageIndex = (salonId: string) => {
    let hash = 0;
    for (let i = 0; i < salonId.length; i++) {
      const char = salonId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % salonImageOptions.length;
  };
  
  const defaultSalonImage = salonImageOptions[getImageIndex(id)];

  // Use first image from gallery, or primary image, or fallback
  // Safely handle null/undefined imageUrls
  const safeImageUrls = Array.isArray(imageUrls) ? imageUrls : [];
  const heroImage = safeImageUrls.length > 0 ? safeImageUrls[0] : (showFallback ? defaultSalonImage : image);

  // Get first 3 available time slots for live availability chip
  const upcomingSlots = availableTimeSlots
    ?.filter(slot => slot.available)
    .slice(0, 3)
    .map(slot => slot.time) || [];

  return (
    <Link href={`/salon/${id}`} onClick={handleCardClick}>
      <Card 
        data-testid={`card-salon-${id}`}
        className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 bg-white group"
      >
        {/* Single Hero Image - Compact Style */}
        <div className="relative h-36 sm:h-40 overflow-hidden bg-gray-100">
          <img 
            src={heroImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 animate-pulse" />
          )}
          
          {/* India-Specific Feature Badges - Top Left Overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {/* GST Invoice Ready Badge */}
            <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
              <BadgeCheck className="h-3 w-3" />
              <span>GST Invoice</span>
            </div>
            
            {/* Package Deals Badge */}
            {hasPackages && (
              <div className="flex items-center gap-1 bg-purple-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
                <Package className="h-3 w-3" />
                <span>Packages</span>
              </div>
            )}
            
            {/* Razorpay Instant Confirmation Badge */}
            <div className="flex items-center gap-1 bg-blue-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
              <CreditCard className="h-3 w-3" />
              <span>Instant Pay</span>
            </div>
          </div>
        </div>

        <CardContent className="p-3 space-y-1.5">
          {/* Rating and Review Count - First (Fresha Style) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-900" data-testid={`text-rating-${id}`}>
                {typeof rating === 'number' ? rating.toFixed(1) : '0.0'}
              </span>
              <span className="text-sm text-gray-600">
                ({reviewCount || 0})
              </span>
            </div>
            
            {/* Google Reviews Verified Badge */}
            {hasGoogleReviews && (
              <div className="flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium px-1.5 py-0.5 rounded border border-blue-200">
                <BadgeCheck className="h-3 w-3" />
                <span>Google Verified</span>
              </div>
            )}
          </div>

          {/* Salon Name - Bold */}
          <h3 
            className="font-bold text-base leading-tight line-clamp-1 text-gray-900" 
            data-testid={`text-salon-name-${id}`}
          >
            {name}
          </h3>

          {/* Address with Distance */}
          <div className="flex items-start gap-1.5">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 line-clamp-1" data-testid={`text-location-${id}`}>
                {location}
                {distance !== undefined && (
                  <span className="text-gray-500 ml-1">
                    • {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Live Availability Chip - Show Available Time Slots */}
          {upcomingSlots.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <Clock className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {upcomingSlots.map((slot, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200"
                  >
                    {slot}
                  </span>
                ))}
                <span className="text-[11px] text-green-600 font-medium">available today</span>
              </div>
            </div>
          )}

          {/* Category - Simple Text at Bottom (Fresha Style) */}
          <p className="text-sm text-gray-500 pt-1">
            {formatCategory(category)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
