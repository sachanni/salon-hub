import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Sparkles, Percent, Gift, Tag } from "lucide-react";
import { useLocation } from "wouter";

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  rating?: number;
  reviewCount?: number;
  category?: string;
  images?: string[];
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  validUntil: string;
  isPlatformWide: number;
  isActive: number;
  salonId?: string;
  salon?: Salon;
}

const categories = [
  { id: "all", label: "All" },
  { id: "salons", label: "Salons" },
  { id: "spas", label: "Spas" },
  { id: "clinics", label: "Clinics" },
  { id: "nail_spas", label: "Nail Spas" },
];

function OfferCard({ offer }: { offer: Offer }) {
  const [, navigate] = useLocation();
  
  const getDiscountText = () => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    }
    return `₹${(offer.discountValue / 100).toFixed(0)} OFF`;
  };

  const handleBookNow = () => {
    if (offer.salonId) {
      navigate(`/salon/${offer.salonId}`);
    }
  };

  const salon = offer.salon;

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 overflow-hidden"
      data-testid={`offer-card-${offer.id}`}
    >
      <CardContent className="p-0">
        {/* Salon Image/Logo Section */}
        <div className="relative h-40 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
          {salon?.images && salon.images.length > 0 ? (
            <img 
              src={salon.images[0]} 
              alt={salon.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto backdrop-blur-sm border-2 border-white/30">
                <span className="text-3xl font-bold">{salon?.name?.charAt(0) || 'S'}</span>
              </div>
            </div>
          )}
          
          {/* Discount Badge */}
          <div className="absolute top-4 left-4">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
              {offer.discountType === 'percentage' ? (
                <Percent className="w-4 h-4" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
              {getDiscountText()}
            </div>
          </div>

          {/* Platform Wide Badge */}
          {offer.isPlatformWide === 1 && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-600 text-white border-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Platform Offer
              </Badge>
            </div>
          )}
        </div>

        {/* Salon Info & CTA */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2" data-testid={`offer-title-${offer.id}`}>
            {offer.title}
          </h3>

          {salon && (
            <>
              {/* Salon Name & Category */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-700">{salon.name}</h4>
                {salon.category && (
                  <Badge variant="outline" className="text-xs">
                    {salon.category}
                  </Badge>
                )}
              </div>

              {/* Rating */}
              {salon.rating && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded">
                    <span className="text-sm font-bold">{Number(salon.rating).toFixed(1)}</span>
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                  {salon.reviewCount && (
                    <span className="text-sm text-gray-500">
                      {salon.reviewCount} reviews
                    </span>
                  )}
                </div>
              )}

              {/* Location */}
              <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">
                  {salon.address}, {salon.city}, {salon.state}
                </span>
              </div>
            </>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {offer.description}
          </p>

          {/* CTA Button */}
          <Button 
            onClick={handleBookNow}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            data-testid={`button-book-${offer.id}`}
          >
            Get {getDiscountText()} via SalonHub
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AllOffersPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch all offers
  const { data: offers = [], isLoading, error } = useQuery<Offer[]>({
    queryKey: ['/api/offers/all-with-salons'],
    queryFn: async () => {
      const res = await fetch('/api/offers/all-with-salons');
      if (!res.ok) throw new Error('Failed to fetch offers');
      return res.json();
    },
  });

  const filteredOffers = offers.filter(offer => {
    if (selectedCategory === "all") return true;
    
    const category = offer.salon?.category?.toLowerCase() || "";
    
    switch (selectedCategory) {
      case "salons":
        return category.includes("salon") || category.includes("hair");
      case "spas":
        return category.includes("spa");
      case "clinics":
        return category.includes("clinic");
      case "nail_spas":
        return category.includes("nail");
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-20 bg-white rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-96 bg-white rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="mt-20">
            <CardContent className="p-12 text-center">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Offers</h2>
              <p className="text-gray-600">Something went wrong loading offers. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">OFFERS NEAR YOU</h1>
            <div className="flex items-start gap-8 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Book your appointment via the SalonHub app</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Go and avail the services</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Pay bill with SalonHub to avail the offer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-white border">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat.id} 
                  value={cat.id}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  data-testid={`tab-${cat.id}`}
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers available</h3>
              <p className="text-gray-600">
                {selectedCategory === "all" 
                  ? "No offers available at the moment. Check back soon!"
                  : `No offers available in ${categories.find(c => c.id === selectedCategory)?.label} category.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map(offer => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
