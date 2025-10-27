import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, User, CreditCard, Check, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceInPaisa: number;
  category: string;
  imageUrl?: string | null;
}

interface Salon {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  role?: string;
  isActive: number;
}

const BookingPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const urlParams = new URLSearchParams(window.location.search);
  const salonId = urlParams.get('salonId') || '';
  const serviceIdsParam = urlParams.get('serviceIds') || '';
  const selectedServiceIds = serviceIdsParam.split(',').filter(Boolean);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'pay_now' | 'pay_at_salon'>('pay_now');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: salon, isLoading: isLoadingSalon, error: salonError } = useQuery({
    queryKey: ['salon', salonId],
    queryFn: async (): Promise<Salon> => {
      if (!salonId) throw new Error('No salon ID provided');
      const response = await fetch(`/api/salons/${salonId}`);
      if (!response.ok) throw new Error('Failed to fetch salon');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useQuery({
    queryKey: ['salon-services', salonId],
    queryFn: async (): Promise<Service[]> => {
      if (!salonId) throw new Error('No salon ID provided');
      const response = await fetch(`/api/salons/${salonId}/services`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: staff = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ['salon-staff', salonId],
    queryFn: async (): Promise<Staff[]> => {
      if (!salonId) return [];
      const response = await fetch(`/api/salons/${salonId}/staff`);
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    },
    enabled: !!salonId,
  });

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceInPaisa, 0) / 100;
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your appointment.",
        variant: "destructive"
      });
      return;
    }

    if (isGuestMode && !customerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide your email address.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const bookingData = {
        salonId,
        serviceIds: selectedServiceIds,
        date: selectedDate,
        time: selectedTime,
        staffId: selectedStaff || null,
        customerName: isGuestMode ? '' : customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        isGuest: isGuestMode,
        totalPrice: totalPrice * 100,
        totalDuration
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Booking failed');
      }

      const result = await response.json();

      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked.",
      });

      setLocation(`/salon-profile?id=${salonId}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isLoadingSalon || isLoadingServices || isLoadingStaff;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (salonError || servicesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Booking</h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the booking information. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation(`/services?salonId=${salonId}`)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show no services selected state (only after loading is complete)
  if (selectedServices.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Services Selected</h2>
          <p className="text-gray-600 mb-6">Please select services before booking.</p>
          <Button onClick={() => setLocation(`/salon-profile?id=${salonId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Salon
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation(`/services?salonId=${salonId}`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Book Appointment</h1>
              {salon && (
                <p className="text-sm text-gray-600">
                  {salon.name} • {salon.city}, {salon.state}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Services */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Services</h2>
                <div className="space-y-3">
                  {selectedServices.map((service, index) => (
                    <div key={service.id} className="flex items-start gap-3 justify-between py-3 border-b last:border-0">
                      {service.imageUrl && (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          data-testid={`img-service-checkout-${service.id}`}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {service.durationMinutes} min • {service.category}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-gray-900">
                          ₹{service.priceInPaisa / 100}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Staff Selection */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Choose Staff Member</h2>
                  <Badge variant="outline" className="ml-auto">Optional</Badge>
                </div>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any available staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.isActive === 1).map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} {member.role && `• ${member.role}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Date & Time</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="guest-mode" className="text-sm text-gray-600">Continue as Guest</Label>
                    <Switch
                      id="guest-mode"
                      checked={isGuestMode}
                      onCheckedChange={setIsGuestMode}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {!isGuestMode && (
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="email">Email {isGuestMode && <span className="text-red-500">*</span>}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('pay_now')}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      paymentMethod === 'pay_now'
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">Pay Now</div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('pay_at_salon')}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      paymentMethod === 'pay_at_salon'
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Clock className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-semibold">Pay at Salon</div>
                    <div className="text-xs text-gray-600 mt-1">Pay when you arrive</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Services</span>
                      <span className="font-medium">{selectedServices.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Duration</span>
                      <span className="font-medium">{totalDuration} mins</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold text-purple-600">₹{totalPrice}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBooking}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Booking'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By booking, you agree to our terms and conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
