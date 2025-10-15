import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, ChevronLeft, MapPin, Clock, Star, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "wouter";

interface Service {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  priceInPaisa: number;
  durationMinutes: number;
  description?: string | null;
}

interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string | null;
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
  const [bookingStep, setBookingStep] = useState<BookingStep>('services');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Featured");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [viewingMonth, setViewingMonth] = useState<Date>(new Date()); // Separate state for calendar navigation

  // Helper function to check if two dates are the same day (timezone-safe)
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Calculate total price and duration from selected services
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

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
    const serviceId = params.get('service');
    const staffId = params.get('staff');
    
    if (serviceId && services.length > 0 && selectedServices.length === 0) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setSelectedServices([{ ...service, sequence: 0 }]);
        // Switch to the service's category to show it
        setSelectedCategory(service.category);
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
                          <div className="font-semibold text-gray-900">
                            ₹{(service.priceInPaisa / 100).toFixed(0)}
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
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        value={selectedStaff?.id || ''}
                        onChange={(e) => {
                          const staffMember = staff.find(s => s.id === e.target.value);
                          setSelectedStaff(staffMember || null);
                        }}
                      >
                        <option value="">Any professional</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.role && `• ${s.role}`}
                          </option>
                        ))}
                      </select>
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
                        {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
                          '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'].map((time) => {
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
                          <div className="font-semibold text-gray-900 flex-shrink-0">
                            ₹{(service.priceInPaisa / 100).toFixed(0)}
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
                          <div className="font-semibold text-gray-900 text-sm">₹{(service.priceInPaisa / 100).toFixed(0)}</div>
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

                {/* Payment Options - Confirm Step */}
                {bookingStep === 'confirm' && (
                  <div className="space-y-3 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Payment Method</div>
                    <button
                      className="w-full py-6 px-4 text-left border-2 border-gray-300 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition-colors"
                    >
                      <div className="font-semibold">Pay at Salon</div>
                      <div className="text-xs text-gray-500">Pay when you arrive</div>
                    </button>
                    <button
                      className="w-full py-6 px-4 text-left border-2 border-gray-300 rounded-lg hover:border-violet-500 hover:bg-violet-50 transition-colors"
                    >
                      <div className="font-semibold">Pay Now</div>
                      <div className="text-xs text-gray-500">Secure online payment</div>
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

                {/* Total - Always Visible */}
                <div className="flex justify-between items-center mb-6">
                  <div className="text-sm font-semibold text-gray-900">Total</div>
                  <div className="text-xl font-bold text-gray-900">
                    {totalPrice === 0 ? "Free" : `₹${(totalPrice / 100).toFixed(0)}`}
                  </div>
                </div>

                {/* Continue Button */}
                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold py-6 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    bookingStep === 'services' ? selectedServices.length === 0 :
                    bookingStep === 'datetime' ? !selectedDate || !selectedTime :
                    false
                  }
                  onClick={() => {
                    if (bookingStep === 'services') {
                      setBookingStep('datetime');
                    } else if (bookingStep === 'datetime') {
                      setBookingStep('confirm');
                    }
                  }}
                >
                  {bookingStep === 'confirm' ? 'Book Now' : 'Continue'}
                </Button>

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
