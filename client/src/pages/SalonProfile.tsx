import React, { useState, useEffect, useRef } from 'react';
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
  Image as ImageIcon,
  Sparkles,
  Grid3x3,
  Tag,
  Timer,
  Gift
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import BookingModal from '@/components/BookingModal';
import { PlatformOffersCarousel } from '@/components/PlatformOffersCarousel';
import { ReviewSection } from '@/components/reviews/ReviewSection';
import { cn } from '@/lib/utils';
import { Map } from '@/components/ui/map';
import SalonCard from '@/components/SalonCard';
import { WebChatWidget } from '@/components/chat';
import MembershipPlansCard from '@/components/customer/MembershipPlansCard';

interface NearbySalon {
  id: string;
  name: string;
  rating: string;
  reviewCount: number;
  address: string;
  city: string;
  category: string;
  image?: string;
  imageUrls?: string[];
  distance_km: number;
  hasGoogleReviews?: boolean;
}

interface NearbySalonsSectionProps {
  salonId: string;
}

const NearbySalonsSection: React.FC<NearbySalonsSectionProps> = ({ salonId }) => {
  const { data: nearbySalons, isLoading, error, refetch } = useQuery<NearbySalon[]>({
    queryKey: ['nearby-salons', salonId],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/nearby?limit=6`);
      if (!response.ok) {
        throw new Error('Failed to fetch nearby salons');
      }
      return response.json();
    },
    enabled: !!salonId,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-t-lg"></div>
            <div className="bg-white p-4 rounded-b-lg space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
        <div className="flex flex-col items-center gap-3">
          <MapPin className="w-12 h-12 text-red-400" />
          <div>
            <p className="text-red-600 font-medium mb-1">Failed to load nearby salons</p>
            <p className="text-red-500 text-sm">Unable to fetch nearby salons. Please try again.</p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!nearbySalons || nearbySalons.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No nearby salons found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {nearbySalons.map((salon) => (
        <SalonCard
          key={salon.id}
          id={salon.id}
          name={salon.name}
          rating={parseFloat(salon.rating || '0')}
          reviewCount={salon.reviewCount}
          location={`${salon.address}, ${salon.city}`}
          category={salon.category}
          image={salon.image || ''}
          imageUrls={salon.imageUrls}
          distance={salon.distance_km}
          priceRange="$$"
          hasGoogleReviews={salon.hasGoogleReviews}
        />
      ))}
    </div>
  );
};

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
  durationMinutes: number;
  priceInPaisa: number;
  category: string;
  imageUrl?: string;
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  role?: string;
  specialties?: string[];
  isActive: number;
  salonId: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  packagePriceInPaisa: number;
  regularPriceInPaisa?: number;
  totalDurationMinutes: number;
  discountPercentage?: number;
  category?: string;
  imageUrl?: string;
  isActive: number;
  services?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

interface SalonProfileProps {
  salonId?: string;
}

const SalonProfile: React.FC<SalonProfileProps> = ({ salonId: propSalonId }) => {
  const [, setLocation] = useLocation();
  const [salonId, setSalonId] = useState<string>(propSalonId || '');
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeSection, setActiveSection] = useState('services');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);
  
  // Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(undefined);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  
  // Real-time open/closed status
  const [currentTime, setCurrentTime] = useState(new Date());

  // Refs for scroll spy
  const servicesRef = useRef<HTMLDivElement>(null);
  const packagesRef = useRef<HTMLDivElement>(null);
  const offersRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  // Sticky header offset constant (in pixels)
  const STICKY_HEADER_OFFSET = 200;

  // Get salon ID from URL params or props
  useEffect(() => {
    if (propSalonId) {
      setSalonId(propSalonId);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        setSalonId(id);
      } else {
        const pathParts = window.location.pathname.split('/');
        const salonIdFromPath = pathParts[pathParts.length - 1];
        if (salonIdFromPath && salonIdFromPath !== 'salon-profile') {
          setSalonId(salonIdFromPath);
        }
      }
    }
  }, [propSalonId]);

  // Handle selected services and auto-open booking from ServicesSelection page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedServices = urlParams.get('selectedServices');
    const openBooking = urlParams.get('openBooking');
    
    if (selectedServices) {
      const serviceIds = selectedServices.split(',').filter(Boolean);
      setSelectedServiceIds(serviceIds);
    }
    
    if (openBooking === 'true' && selectedServices) {
      setIsBookingOpen(true);
      
      // Clean up URL params after opening booking
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('selectedServices');
      newUrl.searchParams.delete('openBooking');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  // Scroll spy effect with proper offset for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + STICKY_HEADER_OFFSET;

      const sections = [
        { id: 'services', ref: servicesRef },
        { id: 'packages', ref: packagesRef },
        { id: 'offers', ref: offersRef },
        { id: 'staff', ref: staffRef },
        { id: 'about', ref: aboutRef },
        { id: 'reviews', ref: reviewsRef },
      ];

      for (const section of sections) {
        if (section.ref.current) {
          const { offsetTop, offsetHeight } = section.ref.current;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, [STICKY_HEADER_OFFSET]);

  // Update current time every minute for real-time open/closed status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  // Booking handlers - Navigate to full-page booking
  const handleBookNow = (serviceId?: string, packageId?: string) => {
    const params = new URLSearchParams();
    if (serviceId) {
      params.set('service', serviceId);
    }
    if (packageId) {
      params.set('package', packageId);
    }
    setLocation(`/salon/${salonId}/book?${params.toString()}`);
  };

  const handleBookWithStaff = (staffId: string) => {
    const params = new URLSearchParams();
    params.set('staff', staffId);
    setLocation(`/salon/${salonId}/book?${params.toString()}`);
  };

  // Scroll to section with offset for sticky header
  const scrollToSection = (sectionId: string) => {
    const refs: Record<string, React.RefObject<HTMLDivElement>> = {
      services: servicesRef,
      packages: packagesRef,
      offers: offersRef,
      staff: staffRef,
      about: aboutRef,
      reviews: reviewsRef,
    };
    
    const element = refs[sectionId]?.current;
    if (element) {
      const yOffset = -STICKY_HEADER_OFFSET;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
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

  // Fetch salon offers (platform-wide + salon-specific)
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['salon-offers', salonId],
    queryFn: async (): Promise<any[]> => {
      if (!salonId) return [];
      const response = await fetch(`/api/offers/customer?salonId=${salonId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!salonId,
  });

  // Fetch salon packages
  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['salon-packages', salonId],
    queryFn: async (): Promise<ServicePackage[]> => {
      if (!salonId) return [];
      const response = await fetch(`/api/salons/${salonId}/packages`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!salonId,
  });

  // Filter active packages only
  const activePackages = packages.filter((pkg: ServicePackage) => pkg.isActive === 1);

  const handleBackToSearch = () => {
    window.close();
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
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
    }
  };

  // Get unique service categories
  const serviceCategories = services 
    ? Array.from(new Set(services.map(s => s.category)))
    : [];

  // Filter services by category
  const filteredServices = selectedServiceCategory
    ? services?.filter(s => s.category === selectedServiceCategory)
    : services;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading salon details...</p>
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
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

  const primaryImage = mediaAssets?.find((asset: any) => asset.isPrimary === 1)?.url || mediaAssets?.[0]?.url;
  const galleryImages = mediaAssets?.slice(0, 4) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50">
      {/* Hero Section with Image Gallery */}
      <div className="relative">
        {/* Salon Header Info - Moved to Top */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{salon.name}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900">{salon.rating || '0.0'}</span>
                    <span className="text-gray-600">({salon.reviewCount || 0})</span>
                  </div>
                  
                  <Separator orientation="vertical" className="h-4" />
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-green-600 font-medium">
                      {salon.openTime && salon.closeTime 
                        ? `Open until ${salon.closeTime}` 
                        : 'Hours not specified'}
                    </span>
                  </div>

                  <Separator orientation="vertical" className="h-4" />
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{salon.city}, {salon.state}</span>
                  </div>

                  {salon.category && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        {salon.category.replace('_', ' ')}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFavorite}
                  className={cn(isFavorite && "text-red-500")}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Gallery - Fresha Style: 1 Large + 2 Small Stacked */}
        <div className="relative h-[400px] bg-white">
          {galleryImages.length > 0 ? (
            <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex gap-2">
              {/* Large Primary Image */}
              <div className="relative flex-1 rounded-lg overflow-hidden group cursor-pointer">
                <img
                  src={primaryImage}
                  alt={salon.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Small Images Stacked Vertically */}
              <div className="flex flex-col gap-2 w-96">
                {galleryImages.slice(1, 3).map((asset: any, index: number) => (
                  <div 
                    key={asset.id || index} 
                    className="relative flex-1 rounded-lg overflow-hidden group cursor-pointer"
                  >
                    <img
                      src={asset.url}
                      alt={`Gallery ${index + 2}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {index === 1 && mediaAssets && mediaAssets.length > 3 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                        <button 
                          onClick={() => setIsGalleryOpen(true)}
                          data-testid="button-see-all-images"
                          className="text-white font-medium text-sm hover:scale-105 transition-transform"
                        >
                          See all images
                        </button>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm border-2 border-white/30">
                  <span className="text-4xl font-bold">{salon.name.charAt(0)}</span>
                </div>
                <p className="text-xl font-semibold">{salon.name}</p>
              </div>
            </div>
          )}

        </div>

        {/* Platform-Wide Offers Carousel */}
        <PlatformOffersCarousel offers={offers} />

        {/* Sticky Navigation */}
        <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
          <div className="border-t bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'services', label: 'Services', icon: Sparkles },
                  { id: 'packages', label: 'Packages', icon: Gift },
                  { id: 'offers', label: 'Offers', icon: Tag },
                  { id: 'staff', label: 'Team', icon: Users },
                  { id: 'about', label: 'About', icon: MapPin },
                  { id: 'reviews', label: 'Reviews', icon: Star },
                ].map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-all relative",
                      activeSection === section.id
                        ? "text-purple-600"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <section.icon className="w-4 h-4" />
                    {section.label}
                    {activeSection === section.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Services Section */}
            <section ref={servicesRef} id="services" className="scroll-mt-[200px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Services</h2>
                <p className="text-gray-600">Explore our range of professional treatments</p>
              </div>

              {/* Service Category Pills */}
              {serviceCategories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f7 #f3f4f6' }}>
                  <button
                    onClick={() => setSelectedServiceCategory(null)}
                    className={cn(
                      "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all",
                      !selectedServiceCategory
                        ? "bg-gray-900 text-white shadow-lg"
                        : "bg-white text-gray-700 border hover:border-gray-300"
                    )}
                  >
                    All Services
                  </button>
                  {serviceCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedServiceCategory(category)}
                      className={cn(
                        "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all",
                        selectedServiceCategory === category
                          ? "bg-gray-900 text-white shadow-lg"
                          : "bg-white text-gray-700 border hover:border-gray-300"
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}

              {/* Services List - Show only 4 initially */}
              <div className="space-y-3">
                {filteredServices && filteredServices.length > 0 ? (
                  <>
                    {filteredServices.slice(0, 4).map((service) => (
                      <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            {/* Service Image */}
                            {service.imageUrl && (
                              <img
                                src={service.imageUrl}
                                alt={service.name}
                                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                                data-testid={`img-service-${service.id}`}
                              />
                            )}
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                                {service.name}
                              </h3>
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">{service.description}</p>
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {service.durationMinutes} min
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {service.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right ml-6 flex-shrink-0">
                              <div className="text-2xl font-bold text-gray-900 mb-2">
                                ₹{(service.priceInPaisa / 100).toFixed(0)}
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handleBookNow(service.id)}
                                className="bg-purple-600 hover:bg-purple-700"
                                data-testid={`button-book-service-${service.id}`}
                              >
                                Book
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Show All Button - Fresha Style */}
                    {filteredServices.length > 4 && (
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setLocation(`/salon/${salonId}/book`)}
                          className="w-full py-6 text-base font-medium hover:bg-gray-50 border-2"
                        >
                          See all ({filteredServices.length} services)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No services available</p>
                    <p className="text-sm">Check back later for updates</p>
                  </div>
                )}
              </div>
            </section>

            {/* Packages Section */}
            <section ref={packagesRef} id="packages" className="scroll-mt-[200px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Packages</h2>
                <p className="text-gray-600">Save more with our bundled service packages</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packagesLoading ? (
                  <>
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-32 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : activePackages && activePackages.length > 0 ? (
                  activePackages.map((pkg: ServicePackage) => {
                    const savings = pkg.regularPriceInPaisa && pkg.regularPriceInPaisa > pkg.packagePriceInPaisa
                      ? pkg.regularPriceInPaisa - pkg.packagePriceInPaisa
                      : 0;
                    const savingsPercent = pkg.discountPercentage || (savings > 0 && pkg.regularPriceInPaisa
                      ? Math.round((savings / pkg.regularPriceInPaisa) * 100)
                      : 0);

                    return (
                      <Card 
                        key={pkg.id} 
                        className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 relative overflow-hidden"
                      >
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
                        
                        <CardContent className="p-6 relative">
                          <div className="flex items-start gap-4">
                            {/* Package Image */}
                            {pkg.imageUrl && (
                              <img
                                src={pkg.imageUrl}
                                alt={pkg.name}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {savingsPercent > 0 && (
                                  <Badge className="bg-green-100 text-green-700 border-green-200" variant="outline">
                                    Save {savingsPercent}%
                                  </Badge>
                                )}
                                {pkg.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {pkg.category}
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors truncate">
                                {pkg.name}
                              </h3>
                              
                              {pkg.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {pkg.description}
                                </p>
                              )}

                              {/* Services included */}
                              {pkg.services && pkg.services.length > 0 && (
                                <div className="text-xs text-gray-500 mb-3">
                                  Includes: {pkg.services.map(s => s.name).slice(0, 3).join(', ')}
                                  {pkg.services.length > 3 && ` +${pkg.services.length - 3} more`}
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-gray-900">
                                      ₹{(pkg.packagePriceInPaisa / 100).toFixed(0)}
                                    </span>
                                    {pkg.regularPriceInPaisa && pkg.regularPriceInPaisa > pkg.packagePriceInPaisa && (
                                      <span className="text-sm text-gray-400 line-through">
                                        ₹{(pkg.regularPriceInPaisa / 100).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {pkg.totalDurationMinutes} min
                                  </div>
                                </div>
                                
                                <Button 
                                  size="sm"
                                  onClick={() => handleBookNow(undefined, pkg.id)}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Book Package
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-500 bg-white rounded-2xl border-2 border-dashed">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No packages available</p>
                    <p className="text-sm">Check back later for bundled service deals</p>
                  </div>
                )}
              </div>
            </section>

            {/* Membership Plans Section */}
            <section id="memberships" className="scroll-mt-[200px]">
              <MembershipPlansCard salonId={salonId} salonName={salon?.name} />
            </section>

            {/* Offers Section - Salon-Specific Only */}
            <section ref={offersRef} id="offers" className="scroll-mt-[200px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Salon Exclusive Offers</h2>
                <p className="text-gray-600">Special deals from this salon</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offersLoading ? (
                  <>
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="h-24 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : offers && offers.filter((o: any) => o.isPlatformWide === 0).length > 0 ? (
                  offers.filter((o: any) => o.isPlatformWide === 0).map((offer: any) => {
                    const daysLeft = Math.ceil((new Date(offer.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isPlatformOffer = offer.isPlatformWide === 1;
                    
                    return (
                      <Card 
                        key={offer.id} 
                        className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 relative overflow-hidden"
                        data-testid={`offer-card-${offer.id}`}
                      >
                        {/* Gradient Background Decoration */}
                        <div className={cn(
                          "absolute inset-0 opacity-5",
                          isPlatformOffer 
                            ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                            : "bg-gradient-to-br from-amber-500 to-orange-500"
                        )}></div>
                        
                        <CardContent className="p-6 relative">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge 
                                  className={cn(
                                    "font-semibold",
                                    isPlatformOffer
                                      ? "bg-purple-100 text-purple-700 border-purple-200"
                                      : "bg-amber-100 text-amber-700 border-amber-200"
                                  )}
                                  variant="outline"
                                  data-testid={`offer-badge-${offer.id}`}
                                >
                                  {isPlatformOffer ? 'Platform Offer' : 'Salon Offer'}
                                </Badge>
                                {daysLeft <= 3 && (
                                  <Badge variant="destructive" className="animate-pulse">
                                    <Timer className="w-3 h-3 mr-1" />
                                    {daysLeft}d left
                                  </Badge>
                                )}
                              </div>
                              
                              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                                {offer.title}
                              </h3>
                              
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {offer.description}
                              </p>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Tag className={cn(
                                    "w-4 h-4",
                                    isPlatformOffer ? "text-purple-600" : "text-amber-600"
                                  )} />
                                  <span className="font-semibold text-gray-900">
                                    {offer.discountType === 'percentage' 
                                      ? `${offer.discountValue}% OFF`
                                      : `₹${offer.discountValue} OFF`}
                                  </span>
                                  {offer.maxDiscount && offer.discountType === 'percentage' && (
                                    <span className="text-xs text-gray-500">
                                      (max ₹{offer.maxDiscount})
                                    </span>
                                  )}
                                </div>

                                {offer.minimumPurchase && (
                                  <div className="text-xs text-gray-500">
                                    Min. purchase: ₹{(offer.minimumPurchase / 100).toFixed(0)}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Discount Icon */}
                            <div className={cn(
                              "w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ml-4",
                              isPlatformOffer
                                ? "bg-purple-100"
                                : "bg-amber-100"
                            )}>
                              <div className={cn(
                                "text-2xl font-bold",
                                isPlatformOffer ? "text-purple-600" : "text-amber-600"
                              )}>
                                {offer.discountType === 'percentage' 
                                  ? `${offer.discountValue}%`
                                  : `₹${offer.discountValue}`}
                              </div>
                            </div>
                          </div>

                          {/* Valid Until Date */}
                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                Valid until {new Date(offer.validUntil).toLocaleDateString('en-IN', { 
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className={cn(
                                "font-medium",
                                isPlatformOffer ? "text-purple-600" : "text-amber-600"
                              )}>
                                Auto-applied at checkout
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed">
                    <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No offers available</p>
                    <p className="text-sm">Check back later for exciting deals</p>
                  </div>
                )}
              </div>
            </section>

            {/* Staff Section */}
            <section ref={staffRef} id="staff" className="scroll-mt-[200px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Meet Our Team</h2>
                <p className="text-gray-600">Book with your favorite expert</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff && staff.length > 0 ? (
                  staff.filter(member => member.isActive === 1).map((member) => (
                    <Card key={member.id} className="group hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt={member.name}
                              className="w-20 h-20 rounded-full object-cover ring-2 ring-purple-100"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-purple-100">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
                              {member.name}
                            </h3>
                            {member.role && (
                              <p className="text-sm text-gray-600 mt-1">{member.role}</p>
                            )}
                            {member.specialties && member.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {member.specialties.slice(0, 3).map((specialty, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="mt-3 group-hover:bg-purple-50 group-hover:border-purple-200 group-hover:text-purple-700 transition-colors"
                              onClick={() => handleBookWithStaff(member.id)}
                            >
                              Book with {member.name.split(' ')[0]}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-2xl border-2 border-dashed">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No staff information available</p>
                  </div>
                )}
              </div>
            </section>

            {/* About Section */}
            <section ref={aboutRef} id="about" className="scroll-mt-[200px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">About {salon.name}</h2>
                <p className="text-gray-600">Learn more about our salon</p>
              </div>

              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{salon.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact & Location</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="text-gray-700">{salon.address}</p>
                          <p className="text-gray-600 text-sm">{salon.city}, {salon.state} {salon.zipCode}</p>
                        </div>
                      </div>
                      
                      {salon.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-purple-600" />
                          <a href={`tel:${salon.phone}`} className="text-gray-700 hover:text-purple-600 transition-colors">
                            {salon.phone}
                          </a>
                        </div>
                      )}
                      
                      {salon.email && (
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-purple-600" />
                          <a href={`mailto:${salon.email}`} className="text-gray-700 hover:text-purple-600 transition-colors">
                            {salon.email}
                          </a>
                        </div>
                      )}
                      
                      {salon.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-purple-600" />
                          <a href={salon.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Interactive Map */}
                  {salon.latitude && salon.longitude && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Location on Map</h3>
                        <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                          <Map
                            latitude={parseFloat(salon.latitude)}
                            longitude={parseFloat(salon.longitude)}
                            zoom={15}
                            className="w-full h-96"
                            markerTitle={salon.name}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {salon.address}, {salon.city}, {salon.state} {salon.zipCode}
                        </p>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Opening times</h3>
                    {(() => {
                      // Parse business hours from JSONB
                      const businessHours = (salon as any).businessHours;
                      
                      if (!businessHours) {
                        // Fallback to legacy openTime/closeTime
                        return (
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <span className="text-gray-700">
                              {salon.openTime && salon.closeTime 
                                ? `${salon.openTime} - ${salon.closeTime}` 
                                : 'Hours not specified'}
                            </span>
                          </div>
                        );
                      }

                      // Format time from 24h to 12h format
                      const formatTime = (time24: string) => {
                        if (!time24) return '';
                        const [hours, minutes] = time24.split(':');
                        const hour = parseInt(hours);
                        const ampm = hour >= 12 ? 'pm' : 'am';
                        const hour12 = hour % 12 || 12;
                        return `${hour12}:${minutes}${ampm}`;
                      };

                      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                      const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                      return (
                        <div className="space-y-2.5">
                          {days.map((day, index) => {
                            const dayHours = businessHours[day];
                            const isOpen = dayHours?.open;
                            const startTime = isOpen ? formatTime(dayHours.start) : '';
                            const endTime = isOpen ? formatTime(dayHours.end) : '';

                            return (
                              <div key={day} className="flex items-center gap-3" data-testid={`hours-${day}`}>
                                <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className="w-24 text-gray-900 font-medium">{dayLabels[index]}</span>
                                <span className="text-gray-700 font-medium">
                                  {isOpen ? `${startTime} - ${endTime}` : 'Closed'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Reviews Section */}
            <section ref={reviewsRef} id="reviews" className="scroll-mt-[200px]">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
                <p className="text-gray-600">See what our clients are saying</p>
              </div>

              <ReviewSection salonId={salonId} />
            </section>

            {/* Nearby Salons Section */}
            <section className="scroll-mt-[200px] mt-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Nearby Salons</h2>
                <p className="text-gray-600">Discover more salons in the area</p>
              </div>

              <NearbySalonsSection salonId={salonId} />
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[88px]">
              <Card className="shadow-lg border border-gray-200 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
                <CardContent className="p-6 space-y-4">
                  {/* Salon Name */}
                  <h1 className="text-2xl font-bold text-gray-900" data-testid="text-salon-name">
                    {salon.name}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold text-gray-900" data-testid="text-rating">
                      {salon.rating || '0.0'}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={cn(
                            "w-5 h-5",
                            star <= Math.floor(Number(salon.rating || 0)) 
                              ? "text-yellow-400 fill-yellow-400" 
                              : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                    {salon.reviewCount > 0 && (
                      <span className="text-sm text-gray-500" data-testid="text-review-count">
                        ({salon.reviewCount})
                      </span>
                    )}
                  </div>

                  {/* Open/Closed Status - Intelligent day-based detection */}
                  {(() => {
                    const checkSalonStatus = () => {
                      // Get current day of week (lowercase)
                      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                      const currentDay = days[currentTime.getDay()];
                      
                      // First, check businessHours for day-specific hours
                      const businessHours = (salon as any).businessHours;
                      if (businessHours && typeof businessHours === 'object') {
                        const dayHours = businessHours[currentDay];
                        
                        if (dayHours && dayHours.open === true && dayHours.start && dayHours.end) {
                          const currentTimeInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                          const [openHour, openMin] = dayHours.start.split(':').map(Number);
                          const openTimeInMinutes = openHour * 60 + openMin;
                          const [closeHour, closeMin] = dayHours.end.split(':').map(Number);
                          const closeTimeInMinutes = closeHour * 60 + closeMin;
                          
                          const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
                          return {
                            isOpen,
                            openTime: dayHours.start,
                            closeTime: dayHours.end
                          };
                        } else if (dayHours && dayHours.open === false) {
                          // Salon is closed on this day
                          return { isOpen: false, openTime: null, closeTime: null, closedToday: true };
                        }
                      }
                      
                      // Fallback to legacy openTime/closeTime if businessHours not available
                      if (salon.openTime && salon.closeTime) {
                        const currentTimeInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                        const [openHour, openMin] = salon.openTime.split(':').map(Number);
                        const openTimeInMinutes = openHour * 60 + openMin;
                        const [closeHour, closeMin] = salon.closeTime.split(':').map(Number);
                        const closeTimeInMinutes = closeHour * 60 + closeMin;
                        
                        const isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
                        return { isOpen, openTime: salon.openTime, closeTime: salon.closeTime };
                      }
                      
                      return null;
                    };

                    const status = checkSalonStatus();
                    
                    return status ? (
                      <div className="flex items-center gap-2" data-testid="status-open-closed">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {status.closedToday ? (
                          <span className="text-sm text-red-600 font-medium">
                            Closed today
                          </span>
                        ) : status.isOpen ? (
                          <span className="text-sm text-green-600 font-medium">
                            Open - closes at {status.closeTime ? new Date(`2000-01-01T${status.closeTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                          </span>
                        ) : (
                          <span className="text-sm text-red-600 font-medium">
                            Closed - opens at {status.openTime ? new Date(`2000-01-01T${status.openTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}

                  <Separator />

                  {/* Book Now Button */}
                  <Button 
                    onClick={() => handleBookNow()}
                    size="lg"
                    className="w-full bg-black hover:bg-gray-800 text-white text-base font-medium h-12"
                    data-testid="button-book-now"
                  >
                    Book now
                  </Button>

                  {/* Gift Cards Button */}
                  <Button 
                    onClick={() => setLocation(`/salon/${salonId}/gift-cards`)}
                    variant="outline"
                    size="lg"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 text-base font-medium h-12"
                    data-testid="button-gift-cards"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    Buy Gift Card
                  </Button>

                  <Separator />

                  {/* Contact */}
                  {salon.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a 
                        href={`tel:${salon.phone}`}
                        className="text-sm text-gray-700 hover:text-gray-900"
                        data-testid="link-phone"
                      >
                        {salon.phone}
                      </a>
                    </div>
                  )}

                  {/* Address & Directions */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700" data-testid="text-address">
                          {salon.address}, {salon.city}, {salon.state} {salon.zipCode}
                        </p>
                        <button 
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salon.address + ', ' + salon.city + ', ' + salon.state)}`;
                            window.open(url, '_blank');
                          }}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium mt-1 inline-block"
                          data-testid="button-get-directions"
                        >
                          Get directions
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Full-Page Gallery View (Fresha-style) */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          {/* Header with close button */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
                  <p className="text-sm text-gray-500">{salon?.name}</p>
                </div>
                <button
                  onClick={() => setIsGalleryOpen(false)}
                  data-testid="button-close-gallery"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close gallery"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Gallery grid */}
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaAssets && mediaAssets.length > 0 ? (
                  mediaAssets.map((asset: any, index: number) => (
                    <div 
                      key={asset.id || index} 
                      className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100"
                      data-testid={`gallery-image-${index}`}
                    >
                      <img
                        src={asset.url}
                        alt={asset.caption || `Gallery ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          {asset.caption && (
                            <p className="text-white text-sm font-medium truncate">{asset.caption}</p>
                          )}
                        </div>
                      </div>
                      {asset.isPrimary === 1 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-amber-500 text-white border-none">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Featured
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-16 text-gray-500">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No images available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        salonName={salon?.name || ''}
        salonId={salonId}
        staffId={selectedStaffId}
        preSelectedServiceIds={selectedServiceIds.length > 0 ? selectedServiceIds : undefined}
      />

      {/* Chat Widget - allows customers to message the salon */}
      {salon && (
        <WebChatWidget
          salonId={salonId}
          salonName={salon.name}
          salonImage={salon.imageUrl || salon.image}
        />
      )}
    </div>
  );
};

export default SalonProfile;
