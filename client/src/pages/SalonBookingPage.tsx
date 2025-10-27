import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, ChevronLeft, MapPin, Clock, Star, Calendar as CalendarIcon, User, Check } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  priceInPaisa: number;
  durationMinutes: number;
  description?: string | null;
  imageUrl?: string | null;
}

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string | null;
  openTime?: string;
  closeTime?: string;
}

interface MediaAsset {
  id: string;
  salonId: string;
  assetType: string;
  url: string;
  altText?: string;
  displayOrder: number;
  isPrimary: number;
  isActive: number;
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  specialties?: string[];
  photoUrl?: string;
}

interface SelectedService extends Service {
  sequence: number;
}

interface Booking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  staffId?: string | null;
  serviceDuration?: number;
}

type BookingStep = 'services' | 'datetime' | 'confirm';

export default function SalonBookingPage() {
  const { salonId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [bookingStep, setBookingStep] = useState<BookingStep>('services');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Featured");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'salon' | 'online'>('salon');
  const [viewingMonth, setViewingMonth] = useState<Date>(new Date()); // Separate state for calendar navigation
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Helper function to check if two dates are the same day (timezone-safe)
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Generate time slots based on salon operating hours
  const generateTimeSlots = (): string[] => {
    if (!salon?.openTime || !salon?.closeTime) {
      // Default fallback slots if salon hours not available
      return ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
              '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
    }

    const slots: string[] = [];
    const [openHour, openMin] = salon.openTime.split(':').map(Number);
    const [closeHour, closeMin] = salon.closeTime.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMin = openMin;
    
    // Generate 30-minute intervals from open to close time
    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeStr);
      
      // Add 30 minutes
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour += 1;
      }
    }
    
    return slots;
  };

  // Calculate total price and duration from selected services
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // OTP Functions
  const sendOtp = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: customerPhone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setOtpCooldown(30); // 30 seconds cooldown
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: customerPhone, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid OTP');
      }

      setOtpVerified(true);
      toast({
        title: "Phone Verified ✓",
        description: "Your phone number has been verified successfully",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Fetch salon details
  const { data: salon, isLoading: isSalonLoading, error: salonError } = useQuery<Salon>({
    queryKey: [`/api/salons/${salonId}`],
  });

  // Fetch media assets
  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: [`/api/salons/${salonId}/media-assets`],
    enabled: !!salonId,
  });

  // Get primary image from media assets
  const primaryImage = mediaAssets.find(asset => asset.isPrimary === 1 && asset.isActive === 1)?.url 
    || mediaAssets.find(asset => asset.isActive === 1)?.url 
    || salon?.imageUrl
    || null;

  // Fetch services
  const { data: services = [], isLoading: isServicesLoading, error: servicesError } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salonId}/services`],
  });

  // Fetch staff
  const { data: staff = [], isLoading: isStaffLoading, error: staffError } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${salonId}/staff`],
  });

  // State for promo code
  const [promoCode, setPromoCode] = useState<string>('');
  const [showPromoInput, setShowPromoInput] = useState<boolean>(false);
  const [promoError, setPromoError] = useState<string>('');

  // Calculate applicable offers with auto-apply logic
  const { data: offerCalculation, refetch: refetchOffers } = useQuery<any>({
    queryKey: ['/api/offers/calculate', { salonId, totalPrice, promoCode }],
    queryFn: async () => {
      const response = await fetch('/api/offers/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId,
          totalAmountPaisa: totalPrice,
          promoCode: promoCode || undefined,
        }),
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!salonId && totalPrice > 0 && bookingStep === 'confirm',
    staleTime: 10000, // Cache for 10 seconds
  });

  // Get auto-applied offer and price breakdown
  const bestOffer = offerCalculation?.bestOffer || null;
  const priceBreakdown = offerCalculation?.priceBreakdown || {
    originalAmount: totalPrice,
    discountAmount: 0,
    finalAmount: totalPrice,
    savingsPercentage: 0,
  };

  const discountAmount = priceBreakdown.discountAmount;
  const finalPrice = priceBreakdown.finalAmount;

  // Booking mutation
  const bookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Booking Confirmed! 🎉",
        description: `Your booking has been confirmed${data.discountApplied && data.discountApplied > 0 ? ` with ₹${(data.discountApplied / 100).toFixed(0)} discount!` : '!'}`,
      });
      // Redirect to customer dashboard or booking confirmation
      setTimeout(() => setLocation('/customer/dashboard'), 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Fetch bookings for the selected date to check availability
  const { data: dayBookings = [], refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: [`/api/salons/${salonId}/bookings`, selectedDate?.toLocaleDateString('en-CA')],
    queryFn: async () => {
      if (!selectedDate) return [];
      
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      const params = new URLSearchParams({
        startDate: dateStr,
        endDate: dateStr,
        status: 'confirmed,pending' // Only check confirmed and pending bookings
      });
      
      const response = await fetch(`/api/salons/${salonId}/bookings?${params}`);
      if (!response.ok) return [];
      
      return response.json();
    },
    enabled: !!selectedDate && !!salonId,
    refetchInterval: 15000, // Refresh every 15 seconds for real-time updates
  });

  // Helper function to check if a time slot is booked
  const isTimeSlotBooked = (time: string): boolean => {
    if (!selectedDate || dayBookings.length === 0) return false;

    const [slotHours, slotMinutes] = time.split(':').map(Number);
    const slotStartMinutes = slotHours * 60 + slotMinutes;
    
    // Calculate end time of proposed appointment (use conservative default of 30 min if no services selected)
    const proposedDuration = totalDuration || 30;
    const slotEndMinutes = slotStartMinutes + proposedDuration;
    
    // Check each booking for overlap
    for (const booking of dayBookings) {
      // Skip if booking is for a different staff member
      if (selectedStaff && booking.staffId && booking.staffId !== selectedStaff.id) {
        continue;
      }
      
      const [bookingHours, bookingMinutes] = booking.bookingTime.split(':').map(Number);
      const bookingStartMinutes = bookingHours * 60 + bookingMinutes;
      
      // Use fixed 30-minute default for bookings without duration info
      const bookingDuration = booking.serviceDuration || 30;
      const bookingEndMinutes = bookingStartMinutes + bookingDuration;
      
      // Check for any overlap: slot overlaps if it starts before booking ends AND ends after booking starts
      if (slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes) {
        return true;
      }
    }
    
    return false;
  };

  // Clear selected time if date changes and selected time becomes invalid (past or booked)
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const now = new Date();
      const isToday = isSameDay(selectedDate, now);
      if (isToday) {
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const timeSlotDate = new Date();
        timeSlotDate.setHours(hours, minutes, 0, 0);
        if (timeSlotDate < now) {
          setSelectedTime(null);
        }
      }
      
      // Clear if slot is now booked or duration/staff change makes it invalid
      if (isTimeSlotBooked(selectedTime)) {
        setSelectedTime(null);
      }
    }
  }, [selectedDate, selectedTime, dayBookings, totalDuration, selectedStaff]);

  // Safety check: Clear selected date if it's in the past
  useEffect(() => {
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(selectedDate);
      checkDate.setHours(0, 0, 0, 0);
      
      if (checkDate < today) {
        setSelectedDate(null);
        setSelectedTime(null);
      }
    }
  }, [selectedDate]);

  // Debug logging
  useEffect(() => {
    console.log('Salon loading:', isSalonLoading, 'has data:', !!salon);
    console.log('Services loading:', isServicesLoading, 'count:', services.length);
    console.log('Staff loading:', isStaffLoading, 'count:', staff.length);
  }, [salon, isSalonLoading, salonError, services, isServicesLoading, servicesError, staff, isStaffLoading, staffError]);

  // Pre-select service and/or staff from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');
    const staffId = params.get('staff');
    
    if (serviceParam && services.length > 0 && selectedServices.length === 0) {
      // Try to find service by ID first, then by name (for search results)
      let service = services.find(s => s.id === serviceParam);
      
      if (!service) {
        // Try finding by name (case-insensitive)
        const decodedServiceName = decodeURIComponent(serviceParam);
        service = services.find(s => s.name.toLowerCase() === decodedServiceName.toLowerCase());
      }
      
      if (service) {
        setSelectedServices([{ ...service, sequence: 0 }]);
        // Switch to the service's category to show it
        setSelectedCategory(service.category);
        console.log('✅ Auto-selected service:', service.name, 'from URL parameter');
      }
    }

    if (staffId && staff.length > 0 && !selectedStaff) {
      const staffMember = staff.find(s => s.id === staffId);
      if (staffMember) {
        setSelectedStaff(staffMember);
      }
    }
  }, [services, staff, selectedServices.length, selectedStaff]);

  // Get unique categories
  const categories = ["Featured", ...Array.from(new Set(services.map((s) => s.category)))];

  // Filter services by selected category
  const filteredServices = selectedCategory === "Featured"
    ? services.filter((s) => s.subCategory === "Featured" || !s.subCategory)
    : services.filter((s) => s.category === selectedCategory);

  const handleServiceToggle = (service: Service, checked: boolean) => {
    if (checked) {
      const sequence = selectedServices.length;
      setSelectedServices([...selectedServices, { ...service, sequence }]);
    } else {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    }
  };

  if (isSalonLoading || isServicesLoading || isStaffLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!salon) {
    return <div>Salon not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-violet-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/salon/${salonId}`}>
              <Button variant="ghost" size="icon" className="hover:bg-violet-100">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">{salon.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{salon.rating || "5.0"}</span>
                  <span className="text-gray-400">({salon.reviewCount || "4,053"})</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{salon.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Service Catalog */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Tabs - Scrollable */}
            <div className="relative">
              <div 
                className="flex gap-2 overflow-x-auto pb-3 scroll-smooth"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#a78bfa #f5f3ff'
                }}
              >
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 whitespace-nowrap flex-shrink-0"
                      : "whitespace-nowrap hover:bg-violet-50 flex-shrink-0"
                    }
                  >
                    {category}
                  </Button>
                ))}
              </div>
              {/* Gradient fade indicators */}
              <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-violet-50 to-transparent pointer-events-none" />
            </div>

            {/* Services List */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedCategory}
              </h2>

              {filteredServices.length === 0 ? (
                <Card className="p-6 text-center text-gray-500">
                  No services in this category
                </Card>
              ) : (
                filteredServices.map((service) => {
                  const isSelected = selectedServices.some((s) => s.id === service.id);
                  return (
                    <Card
                      key={service.id}
                      className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${
                        isSelected ? "border-violet-500 bg-violet-50/50" : ""
                      }`}
                      onClick={() => handleServiceToggle(service, !isSelected)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleServiceToggle(service, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 border-violet-400 data-[state=checked]:bg-violet-600"
                        />
                        {service.imageUrl && (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            data-testid={`img-service-booking-${service.id}`}
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {service.durationMinutes}min • {service.subCategory || service.category}
                          </p>
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-gray-900">
                            from ₹{(service.priceInPaisa / 100).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Sticky Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="p-6 shadow-lg border-violet-100">
                {/* Salon Info - Always Visible */}
                <div className="flex gap-3 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {primaryImage ? (
                      <img src={primaryImage} alt={salon.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{salon.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm text-gray-600">{salon.rating || "5.0"}</span>
                      <span className="text-sm text-gray-400">({salon.reviewCount || "4,053"})</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 truncate">{salon.address || salon.city}</span>
                    </div>
                  </div>
                </div>

                {/* Date & Time Picker Step */}
                {bookingStep === 'datetime' && (
                  <div className="space-y-4 mb-4">
                    {/* Staff Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Professional
                      </label>
                      <div className="space-y-2">
                        {/* Any Professional Option */}
                        <Card
                          className={`p-3 cursor-pointer transition-all ${
                            !selectedStaff
                              ? "border-violet-500 bg-violet-50/50 ring-2 ring-violet-500"
                              : "hover:border-violet-300"
                          }`}
                          onClick={() => setSelectedStaff(null)}
                          data-testid="card-staff-any"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-violet-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">Any Professional</div>
                              <div className="text-xs text-gray-500">First available staff member</div>
                            </div>
                            {!selectedStaff && (
                              <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </Card>

                        {/* Staff Members */}
                        {staff.map((s) => (
                          <Card
                            key={s.id}
                            className={`p-3 cursor-pointer transition-all ${
                              selectedStaff?.id === s.id
                                ? "border-violet-500 bg-violet-50/50 ring-2 ring-violet-500"
                                : "hover:border-violet-300"
                            }`}
                            onClick={() => setSelectedStaff(s)}
                            data-testid={`card-staff-${s.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                {s.photoUrl ? (
                                  <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                                    <User className="w-6 h-6 text-violet-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900">{s.name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                  {s.role || 'Professional'}
                                </div>
                              </div>
                              {selectedStaff?.id === s.id && (
                                <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Date
                      </label>
                      
                      {/* Quick Date Buttons */}
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0); // Normalize to local midnight
                            setSelectedDate(today);
                          }}
                          className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                            selectedDate && isSameDay(selectedDate, new Date())
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'border-gray-300 hover:border-violet-400 text-gray-700'
                          }`}
                        >
                          Today
                        </button>
                        <button
                          onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(0, 0, 0, 0); // Normalize to local midnight
                            setSelectedDate(tomorrow);
                          }}
                          className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                            selectedDate && isSameDay(selectedDate, (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })())
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'border-gray-300 hover:border-violet-400 text-gray-700'
                          }`}
                        >
                          Tomorrow
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="border border-gray-300 rounded-lg p-3">
                        {/* Month Header */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => {
                              const newMonth = new Date(viewingMonth);
                              newMonth.setMonth(newMonth.getMonth() - 1);
                              // Don't allow going to past months
                              const today = new Date();
                              const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                              const newMonthStart = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
                              
                              if (newMonthStart >= currentMonthStart) {
                                setViewingMonth(newMonth);
                              }
                            }}
                            disabled={(() => {
                              const newMonth = new Date(viewingMonth);
                              newMonth.setMonth(newMonth.getMonth() - 1);
                              const today = new Date();
                              const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                              const newMonthStart = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
                              return newMonthStart < currentMonthStart;
                            })()}
                            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          <div className="text-sm font-semibold text-gray-900">
                            {viewingMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          </div>
                          <button
                            onClick={() => {
                              const newMonth = new Date(viewingMonth);
                              newMonth.setMonth(newMonth.getMonth() + 1);
                              setViewingMonth(newMonth);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600 rotate-180" />
                          </button>
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="text-xs font-medium text-gray-500 py-1">
                              {day}
                            </div>
                          ))}
                          {(() => {
                            const year = viewingMonth.getFullYear();
                            const month = viewingMonth.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            const days = [];
                            // Empty cells for days before month starts
                            for (let i = 0; i < firstDay; i++) {
                              days.push(<div key={`empty-${i}`} className="py-1" />);
                            }
                            
                            // Actual days
                            for (let day = 1; day <= daysInMonth; day++) {
                              const date = new Date(year, month, day);
                              date.setHours(0, 0, 0, 0);
                              const isPast = date < today;
                              const isSelected = selectedDate && isSameDay(date, selectedDate);
                              const isToday = isSameDay(date, new Date());
                              
                              days.push(
                                <button
                                  key={day}
                                  onClick={() => {
                                    if (!isPast) {
                                      const normalizedDate = new Date(year, month, day);
                                      normalizedDate.setHours(0, 0, 0, 0); // Ensure midnight normalization
                                      setSelectedDate(normalizedDate);
                                    }
                                  }}
                                  disabled={isPast}
                                  className={`py-1.5 text-sm rounded-lg transition-colors ${
                                    isPast
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-violet-600 text-white font-semibold'
                                      : isToday
                                      ? 'bg-violet-50 text-violet-600 font-semibold'
                                      : 'hover:bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            }
                            return days;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Time
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {generateTimeSlots().map((time) => {
                          const now = new Date();
                          const isToday = selectedDate && isSameDay(selectedDate, now);
                          const [hours, minutes] = time.split(':').map(Number);
                          const timeSlotDate = new Date();
                          timeSlotDate.setHours(hours, minutes, 0, 0);
                          const isPastTime = !!(isToday && timeSlotDate < now);
                          const isBooked = isTimeSlotBooked(time);
                          const isDisabled = isPastTime || isBooked;
                          
                          return (
                            <button
                              key={time}
                              onClick={() => !isDisabled && setSelectedTime(time)}
                              disabled={isDisabled}
                              className={`py-2 px-3 text-sm border rounded-lg transition-colors ${
                                isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : selectedTime === time
                                  ? 'bg-violet-600 text-white border-violet-600'
                                  : 'border-gray-300 hover:border-violet-400'
                              }`}
                              data-testid={`button-time-${time}`}
                              title={isBooked ? 'Already booked' : isPastTime ? 'Past time' : ''}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full text-violet-600 hover:bg-violet-50"
                      onClick={() => setBookingStep('services')}
                    >
                      ← Back to Services
                    </Button>
                  </div>
                )}

                {/* Selected Staff Display (services step) */}
                {bookingStep === 'services' && selectedStaff && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 mb-4">
                    <div className="text-xs font-medium text-violet-900 mb-1">Professional</div>
                    <div className="font-semibold text-gray-900">{selectedStaff.name}</div>
                    {selectedStaff.role && (
                      <div className="text-xs text-gray-600 mt-1">{selectedStaff.role}</div>
                    )}
                  </div>
                )}

                {/* Selected Services Display - Services Step */}
                {bookingStep === 'services' && (
                  selectedServices.length === 0 ? (
                    <div className="text-center py-6 mb-6">
                      <p className="text-gray-500">No services selected</p>
                      <p className="text-xs text-gray-400 mt-1">Select services to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {selectedServices.map((service) => (
                        <div key={service.id} className="flex justify-between items-start text-sm">
                          <div className="flex-1 pr-2">
                            <div className="font-medium text-gray-900">{service.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {service.durationMinutes}min • {service.subCategory || service.category}
                            </div>
                          </div>
                          <div className="text-gray-900 flex-shrink-0">
                            from ₹{(service.priceInPaisa / 100).toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Booking Summary - DateTime & Confirm Steps */}
                {(bookingStep === 'datetime' || bookingStep === 'confirm') && (
                  <div className="space-y-3 mb-4">
                    {/* Header with Total Duration */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                      <div className="text-sm font-medium text-gray-900">
                        {selectedServices.length} service(s) selected
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.floor(totalDuration / 60) > 0 && `${Math.floor(totalDuration / 60)} hr `}{totalDuration % 60 > 0 && `${totalDuration % 60} min`}
                        </span>
                      </div>
                    </div>

                    {/* Date & Time Info - Confirm Step Only */}
                    {bookingStep === 'confirm' && selectedDate && selectedTime && (
                      <div className="pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{selectedTime}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Individual Services */}
                    {selectedServices.map((service, index) => (
                      <div key={service.id} className={index > 0 ? "pt-3 border-t border-gray-100" : ""}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium text-gray-900 text-sm">{service.name}</div>
                          <div className="text-gray-900 text-sm">from ₹{(service.priceInPaisa / 100).toFixed(0)}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {service.durationMinutes} mins with {selectedStaff?.name || 'any professional'}
                        </div>
                        {service.subCategory && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {service.subCategory}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Customer Details Form - Confirm Step */}
                {bookingStep === 'confirm' && (
                  <div className="space-y-4 mb-4">
                    <div className="text-sm font-medium text-gray-900 mb-3">Your Details</div>
                    
                    {/* Name Input */}
                    <div>
                      <label htmlFor="customerName" className="text-xs font-medium text-gray-700 mb-1 block">
                        Full Name *
                      </label>
                      <input
                        id="customerName"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                        data-testid="input-customer-name"
                      />
                    </div>

                    {/* Email Input */}
                    <div>
                      <label htmlFor="customerEmail" className="text-xs font-medium text-gray-700 mb-1 block">
                        Email *
                      </label>
                      <input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                        data-testid="input-customer-email"
                      />
                    </div>

                    {/* Phone Input with OTP */}
                    <div>
                      <label htmlFor="customerPhone" className="text-xs font-medium text-gray-700 mb-1 block">
                        Phone Number *
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="customerPhone"
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setCustomerPhone(value);
                            if (otpSent || otpVerified) {
                              setOtpSent(false);
                              setOtpVerified(false);
                              setOtp('');
                            }
                          }}
                          placeholder="Enter 10-digit phone number"
                          maxLength={10}
                          disabled={otpVerified}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm disabled:bg-gray-100"
                          data-testid="input-customer-phone"
                        />
                        {!otpVerified && (
                          <Button
                            onClick={sendOtp}
                            disabled={otpLoading || !customerPhone || customerPhone.length < 10 || otpCooldown > 0}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 text-sm"
                            data-testid="button-send-otp"
                          >
                            {otpLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : otpSent ? (
                              otpCooldown > 0 ? `${otpCooldown}s` : 'Resend'
                            ) : (
                              'Send OTP'
                            )}
                          </Button>
                        )}
                        {otpVerified && (
                          <div className="flex items-center gap-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* OTP Verification */}
                    {otpSent && !otpVerified && (
                      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-3">
                        <div className="text-xs font-medium text-violet-900">
                          Enter the 6-digit OTP sent to {customerPhone}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="flex-1 px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                            data-testid="input-otp"
                          />
                          <Button
                            onClick={verifyOtp}
                            disabled={otpLoading || !otp || otp.length !== 6}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 text-sm"
                            data-testid="button-verify-otp"
                          >
                            {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                          </Button>
                        </div>
                        <div className="text-xs text-violet-700">
                          Development Mode: OTP is displayed in console logs
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Options - Confirm Step */}
                {bookingStep === 'confirm' && (
                  <div className="space-y-3 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Payment Method</div>
                    <button
                      onClick={() => setPaymentMethod('salon')}
                      className={`w-full py-6 px-4 text-left border-2 rounded-lg transition-all ${
                        paymentMethod === 'salon'
                          ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-500'
                          : 'border-gray-300 hover:border-violet-300'
                      }`}
                      data-testid="button-payment-salon"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Pay at Salon</div>
                          <div className="text-xs text-gray-500">Pay when you arrive</div>
                        </div>
                        {paymentMethod === 'salon' && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('online')}
                      className={`w-full py-6 px-4 text-left border-2 rounded-lg transition-all ${
                        paymentMethod === 'online'
                          ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-500'
                          : 'border-gray-300 hover:border-violet-300'
                      }`}
                      data-testid="button-payment-online"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Pay Now</div>
                          <div className="text-xs text-gray-500">Secure online payment</div>
                        </div>
                        {paymentMethod === 'online' && (
                          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      className="w-full text-violet-600 hover:bg-violet-50"
                      onClick={() => setBookingStep('datetime')}
                    >
                      ← Back to Date & Time
                    </Button>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Auto-Applied Offer Display - Confirm Step */}
                {bookingStep === 'confirm' && (
                  <div className="space-y-3 mb-4">
                    {/* Best Offer Auto-Applied */}
                    {bestOffer && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-green-900">Best Offer Applied!</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                bestOffer.isPlatformWide ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {bestOffer.isPlatformWide ? 'Platform Offer' : 'Salon Offer'}
                              </span>
                            </div>
                            <div className="text-xs text-green-800 mb-1">
                              {bestOffer.title}
                              {bestOffer.description && (
                                <span className="block text-green-700 mt-0.5">{bestOffer.description}</span>
                              )}
                            </div>
                            <div className="text-xs font-medium text-green-900">
                              You save ₹{(discountAmount / 100).toFixed(0)} ({priceBreakdown.savingsPercentage}% off)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Promo Code Entry (Collapsible) */}
                    {!showPromoInput ? (
                      <button
                        onClick={() => setShowPromoInput(true)}
                        className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                        data-testid="button-show-promo"
                      >
                        Have a promo code?
                      </button>
                    ) : (
                      <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                              setPromoCode(e.target.value.toUpperCase());
                              setPromoError('');
                            }}
                            placeholder="Enter promo code"
                            className="flex-1 px-3 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm uppercase"
                            data-testid="input-promo-code"
                          />
                          <Button
                            onClick={() => refetchOffers()}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            data-testid="button-apply-promo"
                          >
                            Apply
                          </Button>
                        </div>
                        {promoError && (
                          <p className="text-xs text-red-600">{promoError}</p>
                        )}
                        <button
                          onClick={() => {
                            setShowPromoInput(false);
                            setPromoCode('');
                            setPromoError('');
                          }}
                          className="text-xs text-violet-600 hover:text-violet-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Price Breakdown - Confirm Step */}
                {bookingStep === 'confirm' && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Service Total</span>
                      <span className="text-gray-900">₹{(totalPrice / 100).toFixed(0)}</span>
                    </div>
                    {bestOffer && discountAmount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Discount ({bestOffer.title})
                        </span>
                        <span className="text-green-600 font-medium">-₹{(discountAmount / 100).toFixed(0)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-semibold text-gray-900">Amount to Pay</div>
                      <div className="text-xl font-bold text-gray-900">
                        {finalPrice === 0 ? "Free" : `₹${(finalPrice / 100).toFixed(0)}`}
                      </div>
                    </div>
                    {bestOffer && priceBreakdown.savingsPercentage > 0 && (
                      <div className="text-xs text-center text-green-600 font-medium bg-green-50 rounded-lg py-2">
                        🎉 You're saving {priceBreakdown.savingsPercentage}% on this booking!
                      </div>
                    )}
                  </div>
                )}

                {/* Total - Other Steps */}
                {bookingStep !== 'confirm' && (
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-sm font-semibold text-gray-900">Total</div>
                    <div className="text-xl font-bold text-gray-900">
                      {totalPrice === 0 ? "Free" : `₹${(totalPrice / 100).toFixed(0)}`}
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    bookingStep === 'services' ? selectedServices.length === 0 :
                    bookingStep === 'datetime' ? !selectedDate || !selectedTime :
                    bookingStep === 'confirm' ? (
                      bookingMutation.isPending || 
                      !customerName || 
                      !customerEmail || 
                      !otpVerified
                    ) : false
                  }
                  onClick={() => {
                    if (bookingStep === 'services') {
                      // Auto-select today's date when moving to datetime step
                      if (!selectedDate) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        setSelectedDate(today);
                      }
                      setBookingStep('datetime');
                    } else if (bookingStep === 'datetime') {
                      setBookingStep('confirm');
                    } else if (bookingStep === 'confirm') {
                      // Validate customer details before submitting
                      if (!customerName || !customerEmail || !customerPhone || !otpVerified) {
                        toast({
                          title: "Missing Information",
                          description: "Please fill in all required fields and verify your phone number",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Create booking with verified phone
                      bookingMutation.mutate({
                        salonId,
                        serviceIds: selectedServices.map(s => s.id),
                        date: selectedDate?.toLocaleDateString('en-CA'),
                        time: selectedTime,
                        staffId: selectedStaff?.id || null,
                        customerName: customerName,
                        customerEmail: customerEmail,
                        customerPhone: customerPhone,
                        paymentMethod: paymentMethod === 'salon' ? 'pay_at_salon' : 'pay_now',
                        isGuest: true,
                        totalPrice: totalPrice,
                        totalDuration: totalDuration,
                        offerId: bestOffer?.id || null
                      });
                    }
                  }}
                  data-testid="button-continue"
                >
                  {bookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : bookingStep === 'confirm' ? 'Book Now' : 'Continue'}
                </Button>

                {/* Validation hint for confirm step */}
                {bookingStep === 'confirm' && !otpVerified && (
                  <p className="text-xs text-center text-orange-600 mt-2">
                    Please verify your phone number to continue
                  </p>
                )}

                {selectedServices.length > 0 && bookingStep === 'services' && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Next: Select date, time & professional
                  </p>
                )}
                
                {bookingStep === 'datetime' && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Next: Payment & confirmation
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
