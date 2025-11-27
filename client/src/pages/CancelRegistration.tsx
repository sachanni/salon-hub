import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Clock, AlertTriangle, CheckCircle2, XCircle, IndianRupee } from 'lucide-react';
import { useRoute, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Registration {
  id: string;
  bookingId: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    startTime: string;
    venueName: string;
    venueAddress: string;
  };
  attendeeInfo: {
    fullName: string;
    email: string;
  };
}

export default function CancelRegistration() {
  const [, params] = useRoute('/registrations/:bookingId/cancel');
  const bookingId = params?.bookingId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: registration, isLoading } = useQuery<Registration>({
    queryKey: [`/api/events/registrations/${bookingId}`],
    queryFn: async () => {
      const res = await fetch(`/api/events/registrations/${bookingId}`);
      if (!res.ok) throw new Error('Failed to fetch registration');
      return res.json();
    },
    enabled: !!bookingId,
  });

  const cancelMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const res = await fetch(`/api/events/registrations/${registrationId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to cancel registration');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cancellation Successful",
        description: `Your registration has been cancelled. Refund of ₹${data.refundAmount} will be processed within 5-7 business days.`,
      });
      setLocation('/customer/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateRefund = () => {
    if (!registration) return { refundPercentage: 0, refundAmount: 0, deduction: 0, daysUntilEvent: 0 };

    const eventDate = new Date(`${registration.event.startDate}T${registration.event.startTime}`);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;
    if (daysUntilEvent >= 7) {
      refundPercentage = 100;
    } else if (daysUntilEvent >= 3) {
      refundPercentage = 75;
    } else if (daysUntilEvent >= 1) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = Math.round((registration.paidAmount * refundPercentage) / 100);
    const deduction = registration.paidAmount - refundAmount;

    return { refundPercentage, refundAmount, deduction, daysUntilEvent };
  };

  if (!bookingId) {
    return <div className="container mx-auto px-4 py-8">Booking ID not found</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Registration not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (registration.status === 'cancelled') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>This registration has already been cancelled</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { refundPercentage, refundAmount, deduction, daysUntilEvent } = calculateRefund();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Cancel Registration</h1>
          <p className="text-muted-foreground">
            Review the cancellation policy and refund details before proceeding
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Booking ID: {registration.bookingId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{registration.event.title}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(registration.event.startDate).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{registration.event.startTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{registration.event.venueName}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Attendee Information</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {registration.attendeeInfo.fullName}</p>
                <p><span className="text-muted-foreground">Email:</span> {registration.attendeeInfo.email}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">₹{registration.paidAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cancellation Policy</CardTitle>
            <CardDescription>
              {daysUntilEvent} {daysUntilEvent === 1 ? 'day' : 'days'} until event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={refundPercentage === 0 ? 'border-destructive' : refundPercentage === 100 ? 'border-green-500' : 'border-yellow-500'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {refundPercentage === 100 && "Full refund available - Cancelled 7+ days before event"}
                {refundPercentage === 75 && "75% refund - Cancelled 3-6 days before event"}
                {refundPercentage === 50 && "50% refund - Cancelled 1-2 days before event"}
                {refundPercentage === 0 && "No refund available - Same day cancellation"}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">7+ days before</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  100% Refund
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">3-6 days before</span>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  75% Refund
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">1-2 days before</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  50% Refund
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Same day</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  No Refund
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Refund Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Amount</span>
              <span className="font-medium">₹{registration.paidAmount.toFixed(2)}</span>
            </div>
            {deduction > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cancellation Fee ({100 - refundPercentage}%)</span>
                <span className="text-destructive">-₹{deduction.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold text-lg">Refund Amount</span>
              <span className="font-bold text-lg text-green-600">₹{refundAmount.toFixed(2)}</span>
            </div>
            {refundAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Refund will be processed to your original payment method within 5-7 business days
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setLocation(`/registrations/${bookingId}`)}
          >
            Keep Registration
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowConfirmDialog(true)}
            disabled={cancelMutation.isPending || isLoading || !registration}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Registration'}
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your registration for "{registration.event.title}"?
              {refundAmount > 0 ? (
                <span className="block mt-2 font-medium text-foreground">
                  You will receive a refund of ₹{refundAmount.toFixed(2)}
                </span>
              ) : (
                <span className="block mt-2 font-medium text-destructive">
                  No refund will be processed for same-day cancellations
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                if (registration?.id) {
                  cancelMutation.mutate(registration.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
