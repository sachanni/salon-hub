import { Star, MapPin, Clock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface SalonCardProps {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  category: string;
  image: string;
  priceRange: string;
  openTime?: string;
  onBookingClick?: (salonName: string, salonId: string) => void;
}

export default function SalonCard({
  id,
  name,
  rating,
  reviewCount,
  location,
  category,
  image,
  priceRange,
  openTime,
  onBookingClick
}: SalonCardProps) {
  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Book now clicked for salon:', id);
    onBookingClick?.(name, id);
  };

  return (
    <Link href={`/salon/${id}`}>
      <Card 
        data-testid={`card-salon-${id}`}
        className="overflow-hidden hover-elevate transition-all duration-200 cursor-pointer"
      >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90 text-black">
            {priceRange}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" data-testid={`text-salon-name-${id}`}>
              {name}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium" data-testid={`text-rating-${id}`}>
                  {rating}
                </span>
                <span className="text-sm text-muted-foreground">({reviewCount})</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground" data-testid={`text-location-${id}`}>
                {location}
              </span>
            </div>
            <Badge variant="outline" className="mb-3">{category}</Badge>
            {openTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Open until {openTime}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1"
            data-testid={`button-view-${id}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button 
            data-testid={`button-book-${id}`}
            onClick={handleBookNow}
            className="flex-1"
          >
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}