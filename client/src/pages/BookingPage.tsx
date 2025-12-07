import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, User, CreditCard, Check, Users, Shield, AlertTriangle, Info, XCircle, Loader2, Gift, X } from 'lucide-react';
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
import { BookingPreferenceSummary } from '@/components/customer/BookingPreferenceSummary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

interface DepositInfo {
  requiresDeposit: boolean;
  reason?: string;
  totalDepositPaisa?: number;
  totalServicePaisa?: number;
  balanceDuePaisa?: number;
  forceFullPayment?: boolean;
  serviceDeposits?: Array<{
    serviceId: string;
    serviceName: string;
    servicePriceInPaisa: number;
    depositAmountPaisa: number;
    depositPercentage: number;
    requiresDeposit: boolean;
    reason: string;
  }>;
  cancellationPolicy?: {
    windowHours: number;
    withinWindowAction: string;
    partialForfeitPercentage?: number;
    noShowAction: string;
    noShowGraceMinutes?: number;
    policyText?: string;
  } | null;
}

interface GiftCardInfo {
  id: string;
  code: string;
  balancePaisa: number;
  originalValuePaisa: number;
  status: string;
  expiresAt?: string | null;
  salonName?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
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
  const [paymentMethod, setPaymentMethod] = useState<'pay_now' | 'pay_at_salon' | 'deposit'>('pay_now');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCard, setAppliedGiftCard] = useState<GiftCardInfo | null>(null);
  const [giftCardError, setGiftCardError] = useState('');
  const [isValidatingGiftCard, setIsValidatingGiftCard] = useState(false);

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

  const { data: depositInfo, isLoading: isLoadingDeposit } = useQuery({
    queryKey: ['deposit-check', salonId, selectedServiceIds.join(',')],
    queryFn: async (): Promise<DepositInfo> => {
      if (!salonId || selectedServiceIds.length === 0) {
        return { requiresDeposit: false };
      }
      const response = await fetch('/api/deposits/check-booking-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId,
          serviceIds: selectedServiceIds,
          customerId: null,
        }),
      });
      if (!response.ok) {
        console.error('Failed to check deposit requirements');
        return { requiresDeposit: false };
      }
      return response.json();
    },
    enabled: !!salonId && selectedServiceIds.length > 0,
  });

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.priceInPaisa, 0) / 100;
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  useEffect(() => {
    if (depositInfo?.requiresDeposit && depositInfo.forceFullPayment) {
      setPaymentMethod('pay_now');
    } else if (depositInfo?.requiresDeposit && paymentMethod === 'pay_at_salon') {
      setPaymentMethod('deposit');
    }
  }, [depositInfo]);

  useEffect(() => {
    if (paymentMethod === 'deposit' && appliedGiftCard) {
      setAppliedGiftCard(null);
      setGiftCardCode('');
      setGiftCardError('');
    }
  }, [paymentMethod]);

  const getPayNowAmount = () => {
    if (!depositInfo?.requiresDeposit || paymentMethod === 'pay_now') {
      return totalPrice * 100;
    }
    if (paymentMethod === 'deposit') {
      return depositInfo.totalDepositPaisa || 0;
    }
    return 0;
  };

  const formatWithinWindowAction = (action: string) => {
    switch (action) {
      case 'forfeit_full': return 'Full deposit will be forfeited';
      case 'forfeit_partial': return 'Partial deposit will be forfeited';
      case 'no_penalty': return 'No penalty applies';
      default: return action;
    }
  };

  const formatNoShowAction = (action: string) => {
    switch (action) {
      case 'forfeit_full': return 'Full deposit will be forfeited';
      case 'forfeit_partial': return 'Partial deposit will be forfeited';
      case 'charge_full_service': return 'Full service amount will be charged';
      default: return action;
    }
  };

  const canApplyGiftCard = paymentMethod === 'pay_now' || paymentMethod === 'pay_at_salon';
  const giftCardDiscountPaisa = appliedGiftCard && canApplyGiftCard
    ? Math.min(appliedGiftCard.balancePaisa, Math.round(totalPrice * 100))
    : 0;
  const totalAfterGiftCard = Math.max(0, Math.round(totalPrice * 100) - giftCardDiscountPaisa);

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) {
      setGiftCardError('Please enter a gift card code');
      return;
    }

    setIsValidatingGiftCard(true);
    setGiftCardError('');

    try {
      const response = await fetch('/api/gift-cards/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: giftCardCode.trim().toUpperCase(),
          salonId 
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setGiftCardError(data.error || 'Invalid gift card code');
        setAppliedGiftCard(null);
        return;
      }

      setAppliedGiftCard(data.card);
      setGiftCardCode('');
      toast({
        title: "Gift Card Applied!",
        description: `₹${data.card.balancePaisa / 100} will be applied to your order.`,
      });
    } catch (error) {
      console.error('Gift card validation error:', error);
      setGiftCardError('Failed to validate gift card. Please try again.');
    } finally {
      setIsValidatingGiftCard(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode('');
    setGiftCardError('');
  };

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handlePayAtSalonBooking = async () => {
    setIsProcessing(true);
    try {
      const bookingData = {
        salonId,
        serviceIds: selectedServiceIds,
        date: selectedDate,
        time: selectedTime,
        staffId: selectedStaff || null,
        customerName: customerName || '',
        customerEmail,
        customerPhone,
        paymentMethod: 'pay_at_salon',
        isGuest: isGuestMode,
        totalPrice: totalPrice * 100,
        totalDuration,
        giftCardCode: appliedGiftCard?.code || null,
        giftCardDiscountPaisa: giftCardDiscountPaisa || 0,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        throw new Error('Booking failed');
      }

      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been booked. Please pay at the salon.",
      });

      setLocation(`/salon-profile?id=${salonId}`);
    } catch (error) {
      console.error('Booking error:', error);
      setAppliedGiftCard(null);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    
    try {
      const paymentType = paymentMethod === 'deposit' ? 'deposit' : 'full_payment';
      const baseAmountPaisa = paymentMethod === 'deposit' 
        ? (depositInfo?.totalDepositPaisa || 0)
        : Math.round(totalPrice * 100);
      
      const amountAfterGiftCard = paymentMethod === 'deposit' 
        ? baseAmountPaisa 
        : Math.max(0, baseAmountPaisa - giftCardDiscountPaisa);

      if (amountAfterGiftCard === 0 && appliedGiftCard && paymentMethod !== 'deposit') {
        try {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              salonId,
              serviceIds: selectedServiceIds,
              date: selectedDate,
              time: selectedTime,
              staffId: selectedStaff || null,
              customerName: customerName || '',
              customerEmail,
              customerPhone,
              paymentMethod: 'gift_card',
              isGuest: isGuestMode,
              totalPrice: totalPrice * 100,
              totalDuration,
              giftCardCode: appliedGiftCard.code,
              giftCardDiscountPaisa: giftCardDiscountPaisa,
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Booking failed');
          }

          toast({
            title: "Booking Confirmed!",
            description: "Your appointment has been booked using your gift card.",
          });

          setLocation(`/salon-profile?id=${salonId}`);
        } catch (error: any) {
          console.error('Gift card booking error:', error);
          setAppliedGiftCard(null);
          toast({
            title: "Booking Failed",
            description: error.message || "There was an error processing your booking. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Payment Error",
          description: "Failed to load payment gateway. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      const amountPaisa = amountAfterGiftCard;

      const orderResponse = await fetch('/api/deposits/create-deposit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonId,
          serviceIds: selectedServiceIds,
          amountPaisa,
          paymentType,
          customerEmail,
          customerPhone,
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          staffId: selectedStaff || null,
          giftCardCode: appliedGiftCard?.code || null,
          giftCardDiscountPaisa: giftCardDiscountPaisa || 0,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: orderData.salonName || salon?.name || 'SalonHub',
        description: paymentType === 'deposit' 
          ? `Deposit for ${orderData.serviceNames?.join(', ') || 'services'}`
          : `Payment for ${orderData.serviceNames?.join(', ') || 'services'}`,
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch('/api/deposits/verify-deposit-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                salonId,
                serviceIds: selectedServiceIds,
                bookingDate: selectedDate,
                bookingTime: selectedTime,
                staffId: selectedStaff || null,
                customerEmail,
                customerPhone,
                customerName: customerName || '',
                paymentType,
                giftCardCode: appliedGiftCard?.code || null,
                giftCardDiscountPaisa: giftCardDiscountPaisa || 0,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }

            const result = await verifyResponse.json();

            toast({
              title: "Payment Successful!",
              description: paymentType === 'deposit'
                ? `Deposit of ₹${amountPaisa / 100} paid. Balance of ₹${(result.booking.balanceDue || 0) / 100} due at salon.`
                : "Full payment completed. Your appointment is confirmed!",
            });

            setLocation(`/salon-profile?id=${salonId}`);
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Please contact support with your payment details.",
              variant: "destructive"
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          email: customerEmail,
          contact: customerPhone,
          name: customerName || '',
        },
        theme: {
          color: '#7c3aed',
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment. Your booking was not created.",
              variant: "destructive"
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      setAppliedGiftCard(null);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

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

    if (depositInfo?.requiresDeposit && !policyAccepted) {
      setShowPolicyDialog(true);
      return;
    }

    if (paymentMethod === 'pay_at_salon' && !depositInfo?.requiresDeposit) {
      await handlePayAtSalonBooking();
      return;
    }

    await handleRazorpayPayment();
  };

  const handlePolicyAccept = () => {
    setPolicyAccepted(true);
    setShowPolicyDialog(false);
    handleBooking();
  };

  const isLoading = isLoadingSalon || isLoadingServices || isLoadingStaff || isLoadingDeposit;

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
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Services</h2>
                <div className="space-y-3">
                  {selectedServices.map((service) => {
                    const serviceDeposit = depositInfo?.serviceDeposits?.find(sd => sd.serviceId === service.id);
                    return (
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{service.name}</h3>
                            {serviceDeposit?.requiresDeposit && (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Deposit Required
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {service.durationMinutes} min • {service.category}
                          </p>
                          {serviceDeposit?.requiresDeposit && serviceDeposit.depositAmountPaisa > 0 && (
                            <p className="text-xs text-amber-700 mt-1">
                              Deposit: ₹{serviceDeposit.depositAmountPaisa / 100} ({serviceDeposit.depositPercentage}%)
                            </p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-semibold text-gray-900">
                            ₹{service.priceInPaisa / 100}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {depositInfo?.requiresDeposit && depositInfo.cancellationPolicy && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <Shield className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900 mb-2">Deposit Required</h3>
                      <p className="text-sm text-amber-800 mb-3">
                        This salon requires a deposit to secure your booking. The deposit helps protect against no-shows and late cancellations.
                      </p>
                      
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Deposit Amount:</span>
                            <span className="font-semibold text-gray-900 ml-2">
                              ₹{(depositInfo.totalDepositPaisa || 0) / 100}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Balance Due at Salon:</span>
                            <span className="font-semibold text-gray-900 ml-2">
                              ₹{(depositInfo.balanceDuePaisa || 0) / 100}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="mt-4">
                        <AccordionItem value="policy" className="border-0">
                          <AccordionTrigger className="text-sm text-amber-800 hover:no-underline py-2">
                            <span className="flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              View Cancellation Policy
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="bg-white rounded-lg p-4 border border-amber-200 space-y-3 text-sm">
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                                <div>
                                  <span className="font-medium">Cancellation Window:</span>
                                  <span className="text-gray-600 ml-1">
                                    {depositInfo.cancellationPolicy.windowHours} hours before appointment
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                                <div>
                                  <span className="font-medium">Late Cancellation:</span>
                                  <span className="text-gray-600 ml-1">
                                    {formatWithinWindowAction(depositInfo.cancellationPolicy.withinWindowAction)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                <div>
                                  <span className="font-medium">No-Show:</span>
                                  <span className="text-gray-600 ml-1">
                                    {formatNoShowAction(depositInfo.cancellationPolicy.noShowAction)}
                                  </span>
                                  {depositInfo.cancellationPolicy.noShowGraceMinutes && (
                                    <span className="text-gray-500 text-xs block">
                                      ({depositInfo.cancellationPolicy.noShowGraceMinutes} minutes grace period)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {depositInfo.cancellationPolicy.policyText && (
                                <div className="pt-2 border-t border-gray-100">
                                  <p className="text-gray-600 text-xs italic">
                                    {depositInfo.cancellationPolicy.policyText}
                                  </p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                </div>
                <div className={cn(
                  "grid gap-4",
                  depositInfo?.requiresDeposit && !depositInfo.forceFullPayment ? "grid-cols-3" : "grid-cols-2"
                )}>
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
                    <div className="font-semibold">Pay Full Amount</div>
                    <div className="text-xs text-gray-600 mt-1">₹{totalPrice}</div>
                  </button>

                  {depositInfo?.requiresDeposit && !depositInfo.forceFullPayment && (
                    <button
                      onClick={() => setPaymentMethod('deposit')}
                      className={cn(
                        "p-4 rounded-lg border-2 text-center transition-all",
                        paymentMethod === 'deposit'
                          ? "border-amber-600 bg-amber-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Shield className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                      <div className="font-semibold">Pay Deposit</div>
                      <div className="text-xs text-amber-700 mt-1">
                        ₹{(depositInfo.totalDepositPaisa || 0) / 100} now
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{(depositInfo.balanceDuePaisa || 0) / 100} at salon
                      </div>
                    </button>
                  )}

                  {!depositInfo?.requiresDeposit && (
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
                  )}

                  {depositInfo?.requiresDeposit && !depositInfo.forceFullPayment && (
                    <div className="col-span-full">
                      <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                        <Info className="w-3 h-3" />
                        A deposit is required to secure this booking
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Customer Preferences Summary */}
              <BookingPreferenceSummary salonId={salonId} />
              
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
                      <span className="text-gray-600">Service Total</span>
                      <span className="font-semibold">₹{totalPrice}</span>
                    </div>

                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Have a Gift Card?</span>
                      </div>
                      
                      {paymentMethod === 'deposit' && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          Gift cards cannot be applied to deposit payments. Choose "Pay Full Amount" to use your gift card.
                        </p>
                      )}
                      
                      {appliedGiftCard && canApplyGiftCard ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-800">
                                {appliedGiftCard.code}
                              </p>
                              <p className="text-xs text-green-600">
                                Balance: ₹{appliedGiftCard.balancePaisa / 100}
                              </p>
                            </div>
                            <button
                              onClick={handleRemoveGiftCard}
                              className="p-1 hover:bg-green-100 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4 text-green-700" />
                            </button>
                          </div>
                          <div className="mt-2 pt-2 border-t border-green-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-700">Discount Applied</span>
                              <span className="font-semibold text-green-800">
                                -₹{giftCardDiscountPaisa / 100}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : canApplyGiftCard ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={giftCardCode}
                              onChange={(e) => {
                                setGiftCardCode(e.target.value.toUpperCase());
                                setGiftCardError('');
                              }}
                              placeholder="Enter code (e.g., GIFT-XXXX-XXXX)"
                              className="flex-1 text-sm"
                            />
                            <Button
                              onClick={handleApplyGiftCard}
                              disabled={isValidatingGiftCard || !giftCardCode.trim()}
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                            >
                              {isValidatingGiftCard ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          </div>
                          {giftCardError && (
                            <p className="text-xs text-red-500">{giftCardError}</p>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {depositInfo?.requiresDeposit && paymentMethod === 'deposit' && (
                      <>
                        <Separator />
                        <div className="bg-amber-50 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-amber-800 flex items-center gap-1">
                              <Shield className="w-4 h-4" />
                              Deposit Now
                            </span>
                            <span className="font-semibold text-amber-900">
                              ₹{(depositInfo.totalDepositPaisa || 0) / 100}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Balance at Salon</span>
                            <span className="font-medium text-gray-900">
                              ₹{(depositInfo.balanceDuePaisa || 0) / 100}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />
                    
                    {appliedGiftCard && giftCardDiscountPaisa > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          Gift Card Discount
                        </span>
                        <span className="font-medium text-green-600">
                          -₹{giftCardDiscountPaisa / 100}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        {paymentMethod === 'deposit' ? 'Pay Now' : 'Total'}
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        ₹{paymentMethod === 'deposit' 
                          ? (depositInfo?.totalDepositPaisa || 0) / 100 
                          : paymentMethod === 'pay_at_salon' 
                            ? 0 
                            : totalAfterGiftCard / 100}
                      </span>
                    </div>
                    
                    {appliedGiftCard && totalAfterGiftCard === 0 && paymentMethod !== 'pay_at_salon' && (
                      <p className="text-xs text-green-600 text-center">
                        Your gift card covers the full amount!
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleBooking}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg"
                  >
                    {isProcessing ? 'Processing...' : 
                      paymentMethod === 'pay_at_salon' ? 'Confirm Booking' :
                      paymentMethod === 'deposit' ? `Pay Deposit ₹${(depositInfo?.totalDepositPaisa || 0) / 100}` :
                      totalAfterGiftCard === 0 && appliedGiftCard ? 'Confirm Booking (Gift Card)' :
                      `Pay ₹${totalAfterGiftCard / 100}`}
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By booking, you agree to our terms and conditions
                    {depositInfo?.requiresDeposit && " and the salon's cancellation policy"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" />
              Cancellation Policy Agreement
            </DialogTitle>
            <DialogDescription>
              Please review and accept the cancellation policy before proceeding with your booking.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {depositInfo?.cancellationPolicy && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                <div>
                  <span className="font-medium">Cancellation Window:</span>
                  <span className="text-gray-600 ml-1">
                    {depositInfo.cancellationPolicy.windowHours} hours before appointment
                  </span>
                </div>
                
                <div>
                  <span className="font-medium">Late Cancellation:</span>
                  <span className="text-gray-600 ml-1">
                    {formatWithinWindowAction(depositInfo.cancellationPolicy.withinWindowAction)}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium">No-Show:</span>
                  <span className="text-gray-600 ml-1">
                    {formatNoShowAction(depositInfo.cancellationPolicy.noShowAction)}
                  </span>
                </div>

                {depositInfo.cancellationPolicy.policyText && (
                  <p className="text-gray-600 text-xs italic border-t pt-2">
                    {depositInfo.cancellationPolicy.policyText}
                  </p>
                )}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-medium mb-1">Deposit Amount: ₹{(depositInfo?.totalDepositPaisa || 0) / 100}</p>
              <p className="text-xs">
                By proceeding, you acknowledge that this deposit is non-refundable under the conditions stated above.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePolicyAccept} className="bg-amber-600 hover:bg-amber-700">
              I Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage;
