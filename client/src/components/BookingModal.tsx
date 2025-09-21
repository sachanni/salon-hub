import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, CreditCard, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Service } from "@shared/schema";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonName: string;
  salonId?: string;
  staffId?: string; // NEW: Add this prop for staff pre-selection
}

export default function BookingModal({ isOpen, onClose, salonName, salonId, staffId }: BookingModalProps) {
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(true); // Default to guest mode
  const [guestSessionId, setGuestSessionId] = useState<string | null>(null);

  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Guest session management
  const GUEST_DATA_KEY = 'salonhub_guest_data';
  
  const saveGuestData = (email: string, phone?: string) => {
    if (!email) return null;
    
    const sessionId = guestSessionId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const guestData = {
      email,
      phone: phone || "",
      lastUsed: new Date().toISOString(),
      sessionId
    };
    
    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(guestData));
    setGuestSessionId(sessionId);
    return sessionId;
  };

  const loadGuestData = () => {
    try {
      const saved = localStorage.getItem(GUEST_DATA_KEY);
      if (saved && typeof saved === 'string') {
        const guestData = JSON.parse(saved);
        // Validate that we got an object with expected properties
        if (guestData && typeof guestData === 'object' && guestData.lastUsed) {
          // Check if data is recent (within 30 days)
          const lastUsed = new Date(guestData.lastUsed);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (lastUsed > thirtyDaysAgo) {
            setGuestSessionId(guestData.sessionId);
            return guestData;
          } else {
            // Clean up expired data
            localStorage.removeItem(GUEST_DATA_KEY);
          }
        } else {
          throw new Error('Invalid guest data structure');
        }
      }
    } catch (error) {
      console.error('Error loading guest data:', error);
      localStorage.removeItem(GUEST_DATA_KEY); // Clean up corrupted data
    }
    return null;
  };

  // Clear form data when switching modes
  const handleGuestModeChange = (guestMode: boolean) => {
    setIsGuestMode(guestMode);
    
    // Clear all fields when switching modes for consistency
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setGuestSessionId(null);
    
    if (guestMode) {
      // Switching to guest mode - load saved data if available
      const guestData = loadGuestData();
      if (guestData) {
        setCustomerEmail(guestData.email || "");
        setCustomerPhone(guestData.phone || "");
      }
    }
  };

  // Reset all state when salon changes to prevent cross-contamination
  useEffect(() => {
    setSelectedService("");
    setSelectedDate("");
    setSelectedTime("");
    setSelectedStaff("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setGuestSessionId(null);
  }, [salonId]);

  // Handle staff pre-selection when staffId prop changes
  useEffect(() => {
    if (staffId && staff.length > 0) {
      setSelectedStaff(staffId);
    } else if (!staffId) {
      setSelectedStaff("");
    }
  }, [staffId, staff]);

  // Fetch services from backend for the specific salon
  useEffect(() => {
    const fetchServices = async () => {
      if (!salonId) {
        toast({
          title: "Error",
          description: "Salon information missing. Please try again.",
          variant: "destructive"
        });
        setIsLoadingServices(false);
        return;
      }

      try {
        // Add cache-busting parameter to ensure fresh data for each salon
        const response = await fetch(`/api/services?salonId=${salonId}&t=${Date.now()}`, {
          cache: 'no-cache'
        });
        if (response.ok) {
          const fetchedServices = await response.json();
          setServices(fetchedServices);
        } else {
          throw new Error('Failed to fetch services');
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: "Failed to load services. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingServices(false);
      }
    };

    const fetchStaff = async () => {
      if (!salonId) {
        setIsLoadingStaff(false);
        return;
      }

      try {
        const response = await fetch(`/api/staff?salonId=${salonId}&t=${Date.now()}`, {
          cache: 'no-cache'
        });
        if (response.ok) {
          const fetchedStaff = await response.json();
          setStaff(fetchedStaff || []);
        } else {
          console.warn('Failed to fetch staff');
          setStaff([]);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    if (isOpen) {
      // Clear ALL form state when opening modal to prevent cross-salon contamination
      setSelectedService("");
      setSelectedDate("");
      setSelectedTime("");
      setSelectedStaff("");
      setIsLoadingServices(true);
      setIsLoadingStaff(true);
      console.log('BookingModal opened - salonId:', salonId, 'salonName:', salonName, 'staffId:', staffId);
      fetchServices();
      fetchStaff();
    }
  }, [isOpen, salonId, toast]);

  // Load guest data when modal opens
  useEffect(() => {
    if (isOpen && isGuestMode) {
      const guestData = loadGuestData();
      if (guestData) {
        setCustomerEmail(guestData.email || "");
        setCustomerPhone(guestData.phone || "");
        toast({
          title: "Welcome back!",
          description: "We've pre-filled your contact information from your last visit.",
        });
      }
    }
  }, [isOpen, isGuestMode, toast]);

  const handleBooking = async () => {
    // Debug logging to track salon ID issues
    console.log('BookingModal - handleBooking called with salonId:', salonId);
    console.log('BookingModal - selectedService:', selectedService);
    
    if (!salonId) {
      toast({
        title: "Error",
        description: "Salon information missing. Please refresh and try again.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields based on guest mode
    const requiredFieldsValid = isGuestMode 
      ? (!selectedService || !selectedDate || !selectedTime || !customerEmail)
      : (!selectedService || !selectedDate || !selectedTime || !customerName || !customerEmail);
      
    if (requiredFieldsValid) {
      toast({
        title: "Missing Information",
        description: isGuestMode 
          ? "Please fill in service, date, time, and email" 
          : "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Save guest data if in guest mode and get session ID
      let currentGuestSessionId = guestSessionId;
      if (isGuestMode && customerEmail) {
        currentGuestSessionId = saveGuestData(customerEmail, customerPhone);
      }

      const selectedServiceDetails = services.find(s => s.id === selectedService);
      if (!selectedServiceDetails) {
        toast({
          title: "Error",
          description: "Selected service not found",
          variant: "destructive"
        });
        return;
      }

      // Create order on backend with serviceId - backend calculates amount
      const response = await fetch('/api/create-payment-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          salonId: salonId,
          serviceId: selectedService,
          booking: {
            date: selectedDate,
            time: selectedTime,
            customer: { name: customerName, email: customerEmail, phone: customerPhone },
            ...(selectedStaff && { staffId: selectedStaff }),
            ...(isGuestMode && currentGuestSessionId && { guestSessionId: currentGuestSessionId })
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const order = await response.json();

      // Check if Razorpay is loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        toast({
          title: "Payment Error",
          description: "Payment system not loaded. Please refresh the page and try again.",
          variant: "destructive"
        });
        return;
      }

      // Initialize Razorpay checkout
      const options = {
        key: await fetch('/api/razorpay-key').then(r => r.json()).then(d => d.key),
        amount: order.amount,
        currency: order.currency,
        name: 'SalonHub',
        description: `${selectedServiceDetails.name} at ${salonName}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (verifyResponse.ok) {
              // Update guest data with successful booking timestamp
              if (isGuestMode && customerEmail) {
                saveGuestData(customerEmail, customerPhone);
              }
              
              toast({
                title: "Booking Confirmed!",
                description: "Your appointment has been successfully booked. You'll receive a confirmation email shortly."
              });
              onClose();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            toast({
              title: "Payment Verification Failed",
              description: "There was an issue verifying your payment. Please contact support.",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: '#8B5CF6' // Purple color from design guidelines
        }
      };

      try {
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } catch (razorpayError) {
        console.error('Razorpay initialization error:', razorpayError);
        toast({
          title: "Payment Error",
          description: "Unable to initialize payment. Please refresh the page and try again.",
          variant: "destructive"
        });
      }

    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const mockTimeSlots = ["9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "5:00 PM"];
  
  // Helper function to format price from paisa to rupees
  const formatPrice = (priceInPaisa: number): string => {
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
  };
  
  // Helper function to format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins} min`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-booking">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Appointment at {salonName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Staff Selection */}
          {staff.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="staff">Select Staff Member (Optional)</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger data-testid="select-staff">
                  <SelectValue placeholder={staffId ? "Staff pre-selected" : "Choose a staff member (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingStaff ? (
                    <SelectItem value="loading" disabled>
                      Loading staff...
                    </SelectItem>
                  ) : (
                    <>
                      <SelectItem value="">
                        Any available staff member
                      </SelectItem>
                      {staff.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <span>{member.name}</span>
                            <span className="text-muted-foreground text-sm">
                              - {member.role || 'Specialist'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {staffId && (
                <p className="text-sm text-muted-foreground">
                  ✨ A specific staff member was selected for your booking
                </p>
              )}
            </div>
          )}

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">Select Service</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger data-testid="select-service">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingServices ? (
                  <SelectItem value="loading" disabled>
                    Loading services...
                  </SelectItem>
                ) : services.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No services available
                  </SelectItem>
                ) : (
                  services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex justify-between w-full">
                        <span>{service.name}</span>
                        <span className="text-muted-foreground ml-4">
                          {formatDuration(service.durationMinutes)} • {formatPrice(service.priceInPaisa)}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                data-testid="input-booking-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger data-testid="select-time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {mockTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Guest Mode Toggle */}
          <div className="space-y-4 p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <Label htmlFor="guest-mode" className="font-medium">Continue as Guest</Label>
              </div>
              <Switch
                id="guest-mode"
                data-testid="switch-guest-mode"
                checked={isGuestMode}
                onCheckedChange={handleGuestModeChange}
              />
            </div>
            {isGuestMode ? (
              <p className="text-sm text-muted-foreground">
                Skip account creation. We'll save your contact details for next time.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Create an account to manage your bookings and preferences.
              </p>
            )}
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {isGuestMode ? "Contact Information" : "Your Information"}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {!isGuestMode && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    data-testid="input-customer-name"
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              )}
              {isGuestMode && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    data-testid="input-customer-name"
                    placeholder="Your name for the appointment"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  data-testid="input-customer-email"
                  type="email"
                  placeholder="Enter your email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  data-testid="input-customer-phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          {selectedService && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm">
                {(() => {
                  const selectedServiceDetails = services.find(s => s.id === selectedService);
                  return selectedServiceDetails ? (
                    <>
                      <p><strong>Service:</strong> {selectedServiceDetails.name}</p>
                      <p><strong>Duration:</strong> {formatDuration(selectedServiceDetails.durationMinutes)}</p>
                      <p><strong>Price:</strong> {formatPrice(selectedServiceDetails.priceInPaisa)}</p>
                    </>
                  ) : null;
                })()}
                {selectedDate && <p><strong>Date:</strong> {selectedDate}</p>}
                {selectedTime && <p><strong>Time:</strong> {selectedTime}</p>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              data-testid="button-cancel-booking"
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              data-testid="button-confirm-booking"
              onClick={handleBooking}
              disabled={
                !selectedService || !selectedDate || !selectedTime || !customerEmail || 
                (!isGuestMode && !customerName) || isProcessingPayment || isLoadingServices
              }
              className="flex-1"
            >
              {isProcessingPayment ? "Processing..." : "Pay & Book Appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}