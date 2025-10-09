import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Heart,
  Share2,
  Calendar,
  ChevronRight,
  CheckCircle,
  Award,
  Users,
  Camera,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import BookingModal from '@/components/BookingModal';

interface Salon {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  category: string;
  priceRange: string;
  rating: string;
  reviewCount: number;
  imageUrl?: string;
  image?: string;
  openTime?: string;
  closeTime?: string;
  distance_km?: number;
  createdAt: string;
  isActive?: number;
  ownerId?: string;
  orgId?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  isActive: number;
  salonId: string;
}

interface SalonProfileProps {
  salonId?: string;
}

const SalonProfile: React.FC<SalonProfileProps> = ({ salonId: propSalonId }) => {
  const [, setLocation] = useLocation();
  const [salonId, setSalonId] = useState<string>(propSalonId || '');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined);

  // Get salon ID from URL params or props
  useEffect(() => {
    if (propSalonId) {
      setSalonId(propSalonId);
    } else {
      // Check for query parameter (salon-profile?id=...)
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        setSalonId(id);
      } else {
        // Check for path parameter (/salon/:salonId)
        const pathParts = window.location.pathname.split('/');
        const salonIdFromPath = pathParts[pathParts.length - 1];
        if (salonIdFromPath && salonIdFromPath !== 'salon-profile') {
          setSalonId(salonIdFromPath);
        }
      }
    }
  }, [propSalonId]);

  // Handle booking modal events
  useEffect(() => {
    const handleOpenBookingModal = (event: CustomEvent) => {
      const { salonId: eventSalonId, salonName, staffId } = event.detail;
      if (eventSalonId === salonId) {
        setSelectedStaffId(staffId);
        setIsBookingOpen(true);
      }
    };

    window.addEventListener('openBookingModal', handleOpenBookingModal as EventListener);
    return () => {
      window.removeEventListener('openBookingModal', handleOpenBookingModal as EventListener);
    };
  }, [salonId]);

  // Booking handlers
  const handleBookNow = () => {
    setSelectedStaffId(undefined); // No specific staff selected
    setIsBookingOpen(true);
  };

  const handleBookWithStaff = (staffId: string) => {
    setSelectedStaffId(staffId);
    setIsBookingOpen(true);
  };

  // Fetch salon details
  const { data: salon, isLoading, error } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: async (): Promise<Salon> => {
      if (!salonId) throw new Error('No salon ID provided');
      const response = await fetch(`/api/salons/${salonId}`);
      if (!response.ok) throw new Error('Failed to fetch salon');
      return response.json();
    },
    enabled: !!salonId,
  });

  // Fetch salon services
  const { data: services } = useQuery({
    queryKey: ['salon-services', salonId],
    queryFn: async (): Promise<Service[]> => {
      if (!salonId) return [];
      const response = await fetch(`/api/salons/${salonId}/services`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!salonId,
  });

  // Fetch salon staff
  const { data: staff } = useQuery({
    queryKey: ['salon-staff', salonId],
    queryFn: async (): Promise<Staff[]> => {
      if (!salonId) return [];
      const response = await fetch(`/api/salons/${salonId}/staff`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!salonId,
  });

  // Fetch salon media assets
  const { data: mediaAssets } = useQuery({
    queryKey: ['salon-media', salonId],
    queryFn: async (): Promise<any[]> => {
      if (!salonId) return [];
      const response = await fetch(`/api/salons/${salonId}/media-assets`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!salonId,
  });

  const handleBackToSearch = () => {
    // Close the current tab and go back to search
    window.close();
  };


  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Implement favorite functionality
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: salon?.name,
        text: `Check out ${salon?.name} on Salon Hub`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salon details...</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salon Not Found</h2>
          <p className="text-gray-600 mb-6">The salon you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleBackToSearch} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToSearch}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
            </Button>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {salon.name}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className={isFavorite ? "text-red-500" : "text-gray-600"}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-600"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* First Row - Image Gallery Only */}
        <div className="mb-6">
          <div className="relative h-96 overflow-hidden rounded-lg">
            {mediaAssets && mediaAssets.length > 0 ? (
              <div className="flex h-full">
                {/* Main large image - reduced width */}
                <div className="w-2/3 relative">
                  <img
                    src={mediaAssets.find((asset: any) => asset.isPrimary === 1)?.url || mediaAssets[0]?.url}
                    alt={salon.name}
            className="w-full h-full object-cover"
          />
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/90 text-gray-900">
                      {salon.category.replace('_', ' ')}
                    </Badge>
            </div>
          </div>
                
                {/* Side thumbnails - increased width */}
                {mediaAssets.length > 1 && (
                  <div className="w-1/3 flex flex-col">
                    {mediaAssets.slice(1, 4).map((asset: any, index: number) => (
                      <div key={asset.id || index} className="flex-1 relative">
                        <img
                          src={asset.url}
                          alt={asset.altText || `Salon image ${index + 2}`}
                          className="w-full h-full object-cover"
                        />
                        {index === 2 && mediaAssets.length > 4 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              +{mediaAssets.length - 4} more
                            </span>
                          </div>
                        )}
                      </div>
              ))}
            </div>
                )}
              </div>
            ) : (salon.imageUrl || salon.image) ? (
              <img
                src={salon.imageUrl || salon.image}
                alt={salon.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-3 mx-auto backdrop-blur-sm border border-white/30">
                    <span className="text-3xl font-bold text-white">{salon.name.charAt(0)}</span>
                  </div>
                  <p className="text-lg font-semibold">{salon.name}</p>
            </div>
            </div>
            )}
        </div>
      </div>

        {/* Second Row - Salon Info and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Salon Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{salon.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{salon.rating || '0.0'}</span>
                        <span className="ml-1">({salon.reviewCount || 0} reviews)</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{salon.distance_km ? `${salon.distance_km.toFixed(1)} km away` : 'Location available'}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{salon.openTime && salon.closeTime ? `${salon.openTime} - ${salon.closeTime}` : 'Hours not specified'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-sm mb-2">
                      {salon.priceRange || 'Price not specified'}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFavorite}
                        className={isFavorite ? "text-red-500" : "text-gray-600"}
                      >
                        <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="text-gray-600"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{salon.description}</p>

                <Button 
                  onClick={handleBookNow}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="lg"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Services & Pricing</h3>
                      <div className="space-y-4">
                      {services && services.length > 0 ? (
                        services.map((service) => (
                          <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                  <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{service.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              <div className="flex items-center mt-2 text-sm text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{service.duration || 'Duration not specified'} min</span>
                                <span className="mx-2">•</span>
                                <Badge variant="outline" className="text-xs">
                                  {service.category || 'Service'}
                                </Badge>
                              </div>
                                    </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                ₹{service.price || 'Price not specified'}
                              </div>
                              <Button size="sm" variant="outline" className="mt-2">
                                      Book
                                    </Button>
                                  </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No services available at the moment</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Salon Gallery</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaAssets && mediaAssets.length > 0 ? (
                        mediaAssets
                          .filter((asset: any) => asset.type === 'image')
                          .map((asset: any, index: number) => (
                            <div key={asset.id || index} className="relative group">
                              <img
                                src={asset.url}
                                alt={asset.altText || `Salon image ${index + 1}`}
                                className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform duration-200 cursor-pointer"
                                onClick={() => {
                                  // Open image in full screen or modal
                                  window.open(asset.url, '_blank');
                                }}
                              />
                              {asset.isPrimary === 1 && (
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-white/90 text-gray-900 text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Camera className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No images available</p>
                          <p className="text-sm">Check back later for salon photos</p>
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="staff" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Our Team</h3>
                    <div className="space-y-4">
                      {staff && staff.length > 0 ? (
                        staff.filter(member => member.isActive === 1).map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {member.name.charAt(0).toUpperCase()}
                          </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{member.name}</h4>
                                {member.specialties && member.specialties.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {member.specialties.map((specialty, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {specialty}
                                      </Badge>
                        ))}
                      </div>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                  {member.phone && (
                                    <div className="flex items-center">
                                      <Phone className="w-3 h-3 mr-1" />
                                      <a 
                                        href={`tel:${member.phone}`}
                                        className="hover:text-purple-600 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {member.phone}
                                      </a>
                                    </div>
                                  )}
                                  {member.email && (
                                    <div className="flex items-center">
                                      <Mail className="w-3 h-3 mr-1" />
                                      <a 
                                        href={`mailto:${member.email}`}
                                        className="hover:text-purple-600 transition-colors truncate max-w-32"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {member.email}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <div className="flex items-center text-xs text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                Available
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="group-hover:bg-purple-50 group-hover:border-purple-200 group-hover:text-purple-700 transition-colors"
                                onClick={() => handleBookWithStaff(member.id)}
                              >
                                Book with {member.name.split(' ')[0]}
                              </Button>
                            </div>
                      </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No staff information available</p>
                      </div>
                    )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                  <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">About {salon.name}</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700">{salon.description}</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{salon.address}, {salon.city}, {salon.state} {salon.zipCode}</span>
                          </div>
                          {salon.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{salon.phone}</span>
                            </div>
                          )}
                          {salon.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{salon.email}</span>
                            </div>
                          )}
                          {salon.website && (
                            <div className="flex items-center text-sm">
                              <Globe className="w-4 h-4 mr-2 text-gray-400" />
                              <a href={salon.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                                Visit Website
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Separator />

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Business Hours</h4>
                        <div className="text-sm text-gray-700">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{salon.openTime && salon.closeTime ? `${salon.openTime} - ${salon.closeTime}` : 'Hours not specified'}</span>
                          </div>
                        </div>
                      </div>
                      </div>
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No reviews yet</p>
                      <p className="text-sm">Be the first to review this salon!</p>
                </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                <Button 
                    onClick={handleBookNow}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Salon
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Directions
                </Button>
                </div>
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Location</h3>
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Map View</p>
                    <p className="text-xs">{salon.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        salonName={salon?.name || ''}
        salonId={salonId}
        staffId={selectedStaffId}
      />
    </div>
  );
};

export default SalonProfile;