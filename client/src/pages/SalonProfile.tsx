import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Star, 
  Users, 
  ArrowLeft, 
  Share2,
  Heart,
  Camera,
  ChevronLeft,
  ChevronRight,
  Award,
  Wifi,
  CreditCard,
  Car,
  Coffee,
  Shield
} from "lucide-react";
import { Link } from "wouter";

export default function SalonProfile() {
  const { salonId } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const { addRecentlyViewed } = useRecentlyViewed();

  // Fetch salon details
  const { data: salon, isLoading: isSalonLoading } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  // Fetch salon services
  const { data: services, isLoading: isServicesLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
  });

  // Fetch salon staff
  const { data: staff, isLoading: isStaffLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
  });

  // Fetch media assets
  const { data: mediaAssets } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
  });

  // Your uploaded images only - no placeholder images
  const allImages = (mediaAssets && Array.isArray(mediaAssets)) ? 
    mediaAssets.map((asset: any) => asset.url).filter(Boolean) : [];

  // Automatically track salon visit for recently viewed
  useEffect(() => {
    if (salon && !isSalonLoading) {
      console.log('Tracking salon visit for recently viewed:', salon.name);
      addRecentlyViewed({
        id: salon.id,
        name: salon.name,
        rating: salon.rating || 4.5,
        reviewCount: salon.reviewCount || 0,
        location: salon.location || '',
        category: salon.category || 'Beauty & Wellness',
        priceRange: salon.priceRange || '$$',
        image: salon.image || ''
      });
    }
  }, [salon, isSalonLoading, addRecentlyViewed]);

  // Service categories from actual data
  const serviceCategories = (services && Array.isArray(services)) ? 
    services.reduce((acc: Record<string, any[]>, service: any) => {
      const category = service.category || 'General Services';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {}) : {};

  // No mock reviews - production ready
  const reviews: any[] = []; // Will be populated when review API is implemented

  // Amenities
  const amenities = [
    { icon: Wifi, label: "Free WiFi" },
    { icon: CreditCard, label: "Card Payment" },
    { icon: Car, label: "Parking Available" },
    { icon: Coffee, label: "Complimentary Drinks" },
    { icon: Shield, label: "Health & Safety Certified" }
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (isSalonLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading salon profile...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Salon Not Found</h1>
          <p className="text-muted-foreground mb-6">The salon you're looking for doesn't exist or isn't published yet.</p>
          <Button asChild>
            <Link href="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild data-testid="button-back-home">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFavorited(!isFavorited)}
                data-testid="button-favorite"
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-share">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden bg-gray-100">
        {allImages.length > 0 ? (
          <img 
            src={allImages[currentImageIndex]}
            alt={`${salon?.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p>No images uploaded yet</p>
            </div>
          </div>
        )}
        
        {/* Enhanced Gallery Navigation */}
        {allImages.length > 1 && (
          <>
            {/* Large Navigation Arrows - Much More Visible */}
            <Button
              variant="secondary"
              size="lg"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-lg border-0 h-14 w-14 rounded-full p-0 z-10"
              onClick={prevImage}
              data-testid="button-prev-image"
            >
              <ChevronLeft className="h-8 w-8 text-gray-800" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-lg border-0 h-14 w-14 rounded-full p-0 z-10"
              onClick={nextImage}
              data-testid="button-next-image"
            >
              <ChevronRight className="h-8 w-8 text-gray-800" />
            </Button>
            
            {/* Dot Indicators for Easy Navigation */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-white scale-125 shadow-lg' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                  data-testid={`button-image-dot-${index}`}
                />
              ))}
            </div>
            
            {/* Image Counter - Moved to Top Right */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium z-10">
              <Camera className="h-3 w-3 inline mr-1" />
              {currentImageIndex + 1} / {allImages.length}
            </div>
            
            {/* Navigation Hint */}
            <div className="absolute bottom-20 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs z-10">
              👆 Click dots or arrows to view all photos
            </div>
          </>
        )}
        
        {/* Click Anywhere to Navigate */}
        {allImages.length > 1 && (
          <div 
            className="absolute inset-0 cursor-pointer z-5"
            onClick={nextImage}
            title="Click to view next image"
          />
        )}
        
        {/* Salon Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
          <div className="container mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold" data-testid="text-salon-rating">
                  {salon?.rating || 'New'}
                </span>
                <span className="text-white/80">({salon?.reviewCount || 0} reviews)</span>
              </div>
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                {salon?.category || 'Beauty & Wellness'}
              </Badge>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2" data-testid="text-salon-name">
              {salon?.name}
            </h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="h-4 w-4" />
              <span className="text-sm lg:text-base" data-testid="text-salon-location">
                {salon?.address}, {salon?.city}, {salon?.state} {salon?.zipCode}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              {/* Services Tab */}
              <TabsContent value="services" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Our Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isServicesLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : Object.keys(serviceCategories).length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(serviceCategories).map(([category, categoryServices]) => (
                          <div key={category}>
                            <h3 className="text-lg font-semibold mb-4 text-primary">{category}</h3>
                            <div className="space-y-4">
                              {categoryServices.map((service: any) => (
                                <div key={service.id} className="flex justify-between items-start p-4 rounded-lg border hover:shadow-sm transition-shadow" data-testid={`service-${service.id}`}>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-lg mb-1" data-testid={`text-service-name-${service.id}`}>
                                      {service.name}
                                    </h4>
                                    <p className="text-muted-foreground mb-2" data-testid={`text-service-description-${service.id}`}>
                                      {service.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        <span data-testid={`text-service-duration-${service.id}`}>
                                          {service.duration} min
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        <span>Professional team</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right ml-6">
                                    <p className="font-bold text-xl mb-2" data-testid={`text-service-price-${service.id}`}>
                                      ₹{service.price}
                                    </p>
                                    <Button size="sm" data-testid={`button-book-service-${service.id}`}>
                                      <Calendar className="h-3 w-3 mr-1" />
                                      Book
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Services will be available soon.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Meet Our Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isStaffLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-32 bg-muted rounded-lg mb-3"></div>
                            <div className="h-4 bg-muted rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        ))}
                      </div>
                    ) : staff && Array.isArray(staff) && staff.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {staff.map((member: any, index: number) => {
                          // Professional team member photos
                          const profileImages = [
                            'https://images.unsplash.com/photo-1594824720108-82cccd6946e6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                            'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                            'https://images.unsplash.com/photo-1595475884552-c2b8a8b3d39a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'
                          ];
                          
                          return (
                            <div key={member.id} className="text-center" data-testid={`staff-${member.id}`}>
                              <div className="relative mx-auto mb-4">
                                <img
                                  src={profileImages[index % profileImages.length]}
                                  alt={member.name}
                                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                                <div className="absolute -bottom-2 -right-2 bg-green-500 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              </div>
                              <h4 className="font-semibold text-lg mb-1" data-testid={`text-staff-name-${member.id}`}>
                                {member.name}
                              </h4>
                              <p className="text-muted-foreground mb-2" data-testid={`text-staff-role-${member.id}`}>
                                {member.role || 'Senior Specialist'}
                              </p>
                              <Button variant="outline" size="sm" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Book with {member.name?.split(' ')[0] || 'Specialist'}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Our team information will be available soon.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Customer Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to review this salon after booking an appointment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About {salon.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6" data-testid="text-salon-description">
                        {salon?.description || `Welcome to ${salon?.name}, your premier destination for beauty and wellness services. Our experienced team is dedicated to providing exceptional service in a relaxing and professional environment.`}
                      </p>
                      
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3">Amenities & Features</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {amenities.map((amenity) => (
                            <div key={amenity.label} className="flex items-center gap-2 text-sm">
                              <amenity.icon className="h-4 w-4 text-primary" />
                              <span>{amenity.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{salon?.category || 'Beauty & Wellness'}</Badge>
                        <Badge variant="outline">{salon?.priceRange || 'Mid-range'}</Badge>
                        <Badge variant="outline">Professional</Badge>
                        <Badge variant="outline">Certified</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book an Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" data-testid="button-book-appointment">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
                <Separator />
                
                {/* Opening Hours */}
                <div>
                  <h4 className="font-semibold mb-2">Opening Hours</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span className="font-medium">{salon?.openTime || '9:00 AM'} - {salon?.closeTime || '9:00 PM'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span className="font-medium">9:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span className="font-medium">10:00 AM - 6:00 PM</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Quick Contact */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{salon?.phone || '+91 XXXXX XXXXX'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {salon?.city}, {salon?.state}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Address</h4>
                  <p className="text-muted-foreground text-sm" data-testid="text-contact-address">
                    {salon?.address}<br />
                    {salon?.city}, {salon?.state} {salon?.zipCode}
                  </p>
                </div>
                
                {/* Interactive Map */}
                <div className="space-y-3">
                  <div className="h-48 rounded-lg overflow-hidden border">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${salon?.address}, ${salon?.city}, ${salon?.state} ${salon?.zipCode}`
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="w-full h-full"
                      title="Salon Location"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}