import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, Percent, Calendar, Tag, Sparkles, TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

// Component to display an offer with eligibility checking
function OfferCard({ offer }: { offer: any }) {
  const { isAuthenticated } = useAuth();
  
  // Fetch eligibility for authenticated users
  const { data: eligibility } = useQuery({
    queryKey: ['/api/offers', offer.id, 'eligibility'],
    queryFn: async () => {
      const res = await fetch(`/api/offers/${offer.id}/eligibility`, {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated && !!offer.id,
  });

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(0)}`;
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'percentage_discount': return Percent;
      case 'flat_discount': return Tag;
      case 'cashback': return Gift;
      case 'first_booking': return Sparkles;
      default: return Gift;
    }
  };

  const isLaunchOffer = (offer: any) => {
    return ['first_3_bookings', 'signup_bonus', 'referral'].includes(offer.offerType);
  };

  const Icon = getOfferIcon(offer.offerType);
  const isLaunch = isLaunchOffer(offer);
  const isActive = offer.isActive && 
    (!offer.validFrom || new Date(offer.validFrom) <= new Date()) &&
    (!offer.validUntil || new Date(offer.validUntil) >= new Date());

  // Determine eligibility status
  const isEligible = eligibility?.isEligible !== false;
  const eligibilityReason = eligibility?.reason || '';

  return (
    <Card 
      className={`relative overflow-hidden ${!isActive ? 'opacity-60' : ''}`}
      data-testid={`offer-card-${offer.id}`}
    >
      {/* Offer Badge */}
      {isLaunch && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-yellow-500 text-white border-0">
            Launch Special
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${
            isLaunch ? 'bg-yellow-100' : 'bg-purple-100'
          }`}>
            <Icon className={`w-6 h-6 ${
              isLaunch ? 'text-yellow-600' : 'text-purple-600'
            }`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{offer.title}</CardTitle>
            <p className="text-sm text-gray-600">{offer.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Eligibility Alert */}
        {isAuthenticated && eligibility && (
          <Alert className={isEligible ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}>
            <div className="flex items-center gap-2">
              {isEligible ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <AlertDescription className={isEligible ? 'text-green-700' : 'text-orange-700'}>
                {isEligible ? (
                  <span data-testid={`eligibility-${offer.id}-eligible`}>
                    You're eligible for this offer!
                  </span>
                ) : (
                  <span data-testid={`eligibility-${offer.id}-not-eligible`}>
                    {eligibilityReason || 'Not eligible for this offer'}
                  </span>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Discount Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          {offer.discountType === 'percentage' && (
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {offer.discountValue}% OFF
              </span>
            </div>
          )}
          {offer.discountType === 'fixed' && (
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {formatAmount(offer.discountValue)} OFF
              </span>
            </div>
          )}
          {offer.cashbackPercent && (
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">
                + {offer.cashbackPercent}% Cashback
              </span>
            </div>
          )}
          {offer.cashbackAmountInPaisa && (
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              <span className="text-lg font-semibold text-green-600">
                + {formatAmount(offer.cashbackAmountInPaisa)} Cashback
              </span>
            </div>
          )}
        </div>

        {/* Terms & Validity */}
        <div className="space-y-2 text-sm text-gray-600">
          {offer.minimumPurchase && (
            <p>• Min. purchase: {formatAmount(offer.minimumPurchase)}</p>
          )}
          {offer.maxUsagePerUser && (
            <p>• Valid for {offer.maxUsagePerUser} booking{offer.maxUsagePerUser > 1 ? 's' : ''}</p>
          )}
          {offer.validUntil && (
            <div className="flex items-center gap-2 text-orange-600">
              <Calendar className="w-4 h-4" />
              <span>Expires: {format(parseISO(offer.validUntil), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button 
          className={`w-full ${
            isLaunch 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          }`}
          disabled={!isActive || (!isEligible && isAuthenticated)}
          data-testid={`button-claim-${offer.id}`}
        >
          {!isActive 
            ? 'Offer Expired' 
            : (!isEligible && isAuthenticated) 
            ? 'Not Eligible'
            : 'Book Now & Save'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CustomerOffers() {
  const { data: offers = [], isLoading: offersLoading, error: offersError } = useQuery<any[]>({
    queryKey: ['/api/offers'],
  });

  const { data: launchOffers = [], isLoading: launchLoading, error: launchError } = useQuery<any[]>({
    queryKey: ['/api/launch-offers'],
  });

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(0)}`;
  };

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'percentage_discount': return Percent;
      case 'flat_discount': return Tag;
      case 'cashback': return Gift;
      case 'first_booking': return Sparkles;
      default: return Gift;
    }
  };

  const isLaunchOffer = (offer: any) => {
    return ['first_3_bookings', 'signup_bonus', 'referral'].includes(offer.offerType);
  };

  // Error handling
  if (offersError || launchError) {
    const error: any = offersError || launchError;
    const isAuthError = error?.message?.includes('401') || error?.message?.includes('Unauthorized');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="mt-20">
            <CardContent className="p-12 text-center">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {isAuthError ? 'Please Sign In' : 'Unable to Load Offers'}
              </h2>
              <p className="text-gray-600 mb-4" data-testid="error-message">
                {isAuthError 
                  ? 'Sign in to view exclusive offers and deals' 
                  : 'Something went wrong loading offers. Please try again later.'}
              </p>
              {isAuthError && (
                <Button onClick={() => window.location.href = '/login/customer'} data-testid="button-signin">
                  Sign In
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (offersLoading || launchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-white rounded-lg"></div>
            <div className="h-32 bg-white rounded-lg"></div>
            <div className="h-32 bg-white rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const allOffers = [...launchOffers, ...offers];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Special Offers</h1>
          <p className="text-gray-600">Save big on your beauty and wellness bookings</p>
        </div>

        {/* Launch Offers Banner */}
        {launchOffers.length > 0 && (
          <Card className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-white border-0" data-testid="launch-banner">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-xl font-bold">🎉 App Launch Special!</h2>
              </div>
              <p className="text-white/90">
                Limited time offers for our first {launchOffers[0]?.maxUsersLimit?.toLocaleString() || '5,000'} customers! Don't miss out!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allOffers.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="p-12 text-center">
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500" data-testid="no-offers">
                  No offers available at the moment. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            allOffers.map((offer: any) => (
              <OfferCard key={offer.id} offer={offer} />
            ))
          )}
        </div>

        {/* How It Works */}
        <Card data-testid="how-it-works">
          <CardHeader>
            <CardTitle>How Launch Offers Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Choose Your Service</p>
                <p className="text-sm text-gray-600">Browse salons and select your desired service</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Auto-Apply Best Offer</p>
                <p className="text-sm text-gray-600">Our system automatically applies the best available offer at checkout</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Save Instantly + Get Cashback</p>
                <p className="text-sm text-gray-600">Get instant discount + earn cashback in your wallet for future bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
