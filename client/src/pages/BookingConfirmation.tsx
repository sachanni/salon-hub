import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Calendar, Clock, MapPin, User, Home, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface BookingDetails {
  id: string;
  salonId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  bookingDate: string;
  bookingTime: string;
  status: string;
  totalAmountPaisa: number;
  discountInPaisa: number | null;
  finalAmountPaisa: number;
  notes: string | null;
  salon?: {
    name: string;
    address: string;
    city: string;
  };
  service?: {
    name: string;
    durationMinutes: number;
  };
  staff?: {
    name: string;
  } | null;
}

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: booking, isLoading, error } = useQuery<BookingDetails>({
    queryKey: [`/api/bookings/${bookingId}/confirmation`],
    enabled: !!bookingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Skeleton className="w-20 h-20 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex flex-col items-center justify-center p-4">
        <Calendar className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Booking not found</h2>
        <p className="text-muted-foreground mb-4">This booking may have expired or doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-6 relative">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 
                data-testid="icon-success"
                className="w-16 h-16 text-green-600" 
              />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-100 rounded-full animate-ping opacity-20" />
          </div>

          <h1 
            data-testid="text-success-title"
            className="text-2xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {booking.customerEmail ? `A confirmation has been sent to ${booking.customerEmail}` : 'Your appointment has been confirmed.'}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {booking.salon?.name && (
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-violet-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{booking.salon.name}</p>
                  {booking.salon.address && (
                    <p className="text-sm text-muted-foreground">{booking.salon.address}, {booking.salon.city}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0" />
              <div>
                <p className="font-medium">{booking.service?.name || 'Service'}</p>
                {booking.service?.durationMinutes && (
                  <p className="text-sm text-muted-foreground">{booking.service.durationMinutes} minutes</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-violet-600 flex-shrink-0" />
              <p className="font-medium">{formatDate(booking.bookingDate)}</p>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-violet-600 flex-shrink-0" />
              <p className="font-medium">{formatTime(booking.bookingTime)}</p>
            </div>

            {booking.staff?.name && (
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-violet-600 flex-shrink-0" />
                <p className="font-medium">with {booking.staff.name}</p>
              </div>
            )}

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-lg">
                  ₹{((booking.finalAmountPaisa || booking.totalAmountPaisa) / 100).toFixed(0)}
                </span>
              </div>
              {booking.discountInPaisa && booking.discountInPaisa > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Discount applied</span>
                  <span>-₹{(booking.discountInPaisa / 100).toFixed(0)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {isAuthenticated ? (
              <Button 
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={() => navigate('/customer/dashboard')}
              >
                View My Bookings
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button 
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    Login to Track Bookings
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Login to easily manage and track all your appointments. Check your email for login credentials.
                </p>
              </>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
