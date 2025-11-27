import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, ChevronRight, Calendar, MapPin, Users, IndianRupee, AlertCircle } from 'lucide-react';
import { registrationAttendeeSchema } from '@/lib/validations/eventSchemas';
import { z } from 'zod';

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  maxPerUser: number;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  venueName: string;
  venueAddress: string;
}

export default function EventRegistration() {
  const [, params] = useRoute('/events/:eventId/register');
  const [, setLocation] = useLocation();
  const eventId = params?.eventId;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [attendeeInfo, setAttendeeInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number): boolean => {
    try {
      setErrors({});
      
      if (step === 1) {
        // Validate that at least one ticket is selected
        const hasTickets = Object.values(selectedTickets).some(qty => qty > 0);
        if (!hasTickets) {
          setErrors({ tickets: 'Please select at least one ticket' });
          return false;
        }
      } else if (step === 2) {
        // Validate attendee information
        registrationAttendeeSchema.parse(attendeeInfo);
      }
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const [eventRes, ticketsRes] = await Promise.all([
        fetch(`/api/events/public/${eventId}`),
        fetch(`/api/events/${eventId}/tickets`)
      ]);

      if (eventRes.ok) {
        const eventData = await eventRes.json();
        setEvent(eventData);
      }

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTicketTypes(ticketsData);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: Math.max(0, quantity)
    }));
  };

  const calculateTotal = () => {
    return ticketTypes.reduce((total, ticket) => {
      const qty = selectedTickets[ticket.id] || 0;
      return total + (ticket.price * qty);
    }, 0);
  };

  const handleSubmitRegistration = async () => {
    if (!validateStep(2)) {
      alert('Please fill in all required information');
      return;
    }

    setSubmitting(true);
    try {
      // Convert selectedTickets to array format
      const tickets = Object.entries(selectedTickets)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

      // Create registration (pending payment)
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tickets,
          attendeeName: attendeeInfo.name,
          attendeeEmail: attendeeInfo.email,
          attendeePhone: attendeeInfo.phone,
          specialRequests: attendeeInfo.specialRequests,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || 'Failed to create registration');
        return;
      }

      const { registrationId } = await response.json();

      // Get Razorpay key and create payment order
      const [keyRes, orderRes] = await Promise.all([
        fetch('/api/events/razorpay-key'),
        fetch(`/api/events/registrations/${registrationId}/create-payment-order`, {
          method: 'POST',
          credentials: 'include',
        })
      ]);

      if (!keyRes.ok || !orderRes.ok) {
        alert('Failed to initialize payment');
        return;
      }

      const { key } = await keyRes.json();
      const { orderId, amount } = await orderRes.json();

      // Open Razorpay checkout
      const options = {
        key,
        amount,
        currency: 'INR',
        name: event?.title || 'Event Registration',
        description: `Registration for ${event?.title}`,
        order_id: orderId,
        handler: async function (response: any) {
          // Verify payment on backend
          try {
            const verifyRes = await fetch(`/api/events/registrations/${registrationId}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              setLocation(`/events/registration/${registrationId}/confirmation`);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: attendeeInfo.name,
          email: attendeeInfo.email,
          contact: attendeeInfo.phone,
        },
        theme: {
          color: '#9333ea', // Purple color matching your theme
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', function (response: any) {
        alert('Payment failed: ' + response.error.description);
      });

    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to process registration');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Select Tickets' },
    { number: 2, title: 'Your Information' },
    { number: 3, title: 'Review & Pay' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Event not found</p>
      </div>
    );
  }

  const totalTickets = Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const totalAmount = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Event Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium">{event.startDate} at {event.startTime}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-gray-600">Venue</p>
                  <p className="font-medium">{event.venueName || 'TBA'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-gray-600">Tickets Selected</p>
                  <p className="font-medium">{totalTickets} ticket(s)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step.number
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <p className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className={`w-5 h-5 mx-2 ${
                    currentStep > step.number ? 'text-purple-600' : 'text-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Choose your ticket type and quantity'}
              {currentStep === 2 && 'Enter your contact information'}
              {currentStep === 3 && 'Review your order and complete payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Ticket Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {ticketTypes.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No tickets available yet</p>
                ) : (
                  ticketTypes.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{ticket.name}</h3>
                          <p className="text-sm text-gray-600">{ticket.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Available: {ticket.quantity} | Max per person: {ticket.maxPerUser}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600 flex items-center">
                            <IndianRupee className="w-5 h-5" />
                            {ticket.price}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTicketQuantity(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                          disabled={(selectedTickets[ticket.id] || 0) === 0}
                        >
                          -
                        </Button>
                        <span className="font-medium w-8 text-center">
                          {selectedTickets[ticket.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateTicketQuantity(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                          disabled={
                            (selectedTickets[ticket.id] || 0) >= ticket.maxPerUser ||
                            (selectedTickets[ticket.id] || 0) >= ticket.quantity
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 2: Attendee Information */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={attendeeInfo.name}
                    onChange={(e) => setAttendeeInfo(prev => ({ ...prev, name: e.target.value }))}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={attendeeInfo.email}
                    onChange={(e) => setAttendeeInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={attendeeInfo.phone}
                    onChange={(e) => setAttendeeInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                  <Input
                    id="specialRequests"
                    placeholder="Any dietary requirements or special needs?"
                    value={attendeeInfo.specialRequests}
                    onChange={(e) => setAttendeeInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Step 3: Review & Payment */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-purple-50 p-6 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                  
                  <div className="space-y-2">
                    {ticketTypes.map((ticket) => {
                      const qty = selectedTickets[ticket.id] || 0;
                      if (qty === 0) return null;
                      return (
                        <div key={ticket.id} className="flex justify-between text-sm">
                          <span>{ticket.name} × {qty}</span>
                          <span className="font-medium flex items-center">
                            <IndianRupee className="w-4 h-4" />
                            {ticket.price * qty}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-purple-600 flex items-center">
                        <IndianRupee className="w-5 h-5" />
                        {totalAmount}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">Contact Information</h4>
                  <p className="text-sm"><strong>Name:</strong> {attendeeInfo.name}</p>
                  <p className="text-sm"><strong>Email:</strong> {attendeeInfo.email}</p>
                  <p className="text-sm"><strong>Phone:</strong> {attendeeInfo.phone}</p>
                  {attendeeInfo.specialRequests && (
                    <p className="text-sm"><strong>Special Requests:</strong> {attendeeInfo.specialRequests}</p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-900">
                    <strong>Payment:</strong> You'll receive a QR code for event check-in after completing payment. Payment integration will be completed in the next phase.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button 
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={currentStep === 1 && totalTickets === 0}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitRegistration} 
                  disabled={submitting || !attendeeInfo.name || !attendeeInfo.email || !attendeeInfo.phone}
                >
                  {submitting ? 'Processing...' : `Pay ₹${totalAmount}`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
