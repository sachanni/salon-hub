import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  Loader2, 
  QrCode, 
  MapPin, 
  Phone,
  User,
  AlertCircle,
  Sparkles,
  Clock
} from "lucide-react";

interface SalonInfo {
  salonId: string;
  salonName: string;
  salonLogo: string | null;
  salonAddress: string | null;
}

interface CheckInResponse {
  success: boolean;
  message: string;
  jobCardNumber: string;
  customerName: string;
  salonName: string;
}

interface CheckInError {
  error: string;
  requiresWalkIn?: boolean;
  jobCardId?: string;
  jobCardNumber?: string;
}

export default function SelfCheckIn() {
  const params = useParams<{ salonId: string }>();
  const salonId = params.salonId;
  const { toast } = useToast();

  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState<CheckInResponse | null>(null);

  const { data: salonInfo, isLoading: salonLoading, error: salonError } = useQuery<SalonInfo>({
    queryKey: ['/api/salons/public/checkin', salonId],
    queryFn: async () => {
      const response = await fetch(`/api/salons/public/checkin/${salonId}`);
      if (!response.ok) {
        throw new Error('Salon not found');
      }
      return response.json();
    },
    enabled: !!salonId,
  });

  const checkInMutation = useMutation({
    mutationFn: async (data: { phone?: string; customerName?: string }) => {
      const response = await fetch(`/api/salons/public/checkin/${salonId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw result;
      }
      
      return result as CheckInResponse;
    },
    onSuccess: (data) => {
      setCheckInSuccess(data);
      toast({
        title: "Check-in Successful!",
        description: `Welcome to ${data.salonName}. Your job card number is ${data.jobCardNumber}`,
      });
    },
    onError: (error: CheckInError) => {
      if (error.requiresWalkIn) {
        setShowWalkInForm(true);
        toast({
          title: "No Booking Found",
          description: "Please enter your name to check in as a walk-in customer",
          variant: "default",
        });
      } else if (error.jobCardNumber) {
        setCheckInSuccess({
          success: true,
          message: "You are already checked in",
          jobCardNumber: error.jobCardNumber,
          customerName: "",
          salonName: salonInfo?.salonName || "",
        });
      } else {
        toast({
          title: "Check-in Failed",
          description: error.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    checkInMutation.mutate({ phone: phone.trim() });
  };

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    checkInMutation.mutate({ 
      phone: phone.trim() || undefined,
      customerName: customerName.trim() 
    });
  };

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading salon information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (salonError || !salonInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-background to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-800">Salon Not Found</h2>
              <p className="text-red-600 mt-2">
                This check-in link is invalid or the salon doesn't exist.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Please scan the correct QR code at the salon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkInSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-green-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-bold">Check-in Successful!</h2>
            <p className="text-green-100 mt-1">Welcome to our salon</p>
          </div>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Your Job Card Number</p>
              <p className="text-3xl font-mono font-bold text-primary tracking-wider">
                {checkInSuccess.jobCardNumber}
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salon</p>
                  <p className="font-medium">{checkInSuccess.salonName || salonInfo.salonName}</p>
                </div>
              </div>
              
              {checkInSuccess.customerName && (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{checkInSuccess.customerName}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Please have a seat</p>
                <p className="text-blue-600">
                  Our staff will call you shortly. Feel free to relax while you wait.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-white">
          <div className="flex items-center gap-4">
            {salonInfo.salonLogo ? (
              <img 
                src={salonInfo.salonLogo} 
                alt={salonInfo.salonName}
                className="h-16 w-16 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <QrCode className="h-8 w-8" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{salonInfo.salonName}</h1>
              {salonInfo.salonAddress && (
                <p className="text-primary-foreground/80 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {salonInfo.salonAddress}
                </p>
              )}
            </div>
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Self Check-in
          </CardTitle>
          <CardDescription>
            {showWalkInForm 
              ? "Enter your name to check in as a walk-in customer"
              : "Enter your phone number to check in for your appointment"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showWalkInForm ? (
            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="text-amber-800">
                  No booking found for this phone number. You can still check in as a walk-in customer.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Name *
                </Label>
                <Input
                  id="customerName"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-lg"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneWalkIn" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number (optional)
                </Label>
                <Input
                  id="phoneWalkIn"
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-lg"
                  type="tel"
                  autoComplete="tel"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWalkInForm(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={checkInMutation.isPending || !customerName.trim()}
                  className="flex-1"
                >
                  {checkInMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Checking in...
                    </>
                  ) : (
                    "Check In"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  placeholder="Enter your registered phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-lg"
                  type="tel"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the phone number used during booking
                </p>
              </div>

              <Button
                type="submit"
                disabled={checkInMutation.isPending}
                className="w-full"
                size="lg"
              >
                {checkInMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Looking up booking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Check In
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowWalkInForm(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Check in as Walk-in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
