import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Shield, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface PaymentSetupStepProps {
  salonId: string;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export default function PaymentSetupStep({ 
  salonId, 
  onNext,
  onSkip
}: PaymentSetupStepProps) {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing payout accounts
  const { data: payoutAccounts = [] } = useQuery<any[]>({
    queryKey: ['/api/salons', salonId, 'payout-accounts'],
    enabled: !!salonId,
  });

  // Setup Razorpay payout account mutation
  const setupPayoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/salons/${salonId}/payout-accounts`, {
        provider: 'razorpay',
        onboardingStatus: 'pending'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'payout-accounts'] 
      });
      toast({
        title: "Payment Setup Initiated",
        description: "Your payment processing setup has been started. You can complete KYC verification later.",
      });
      onNext?.();
    },
    onError: () => {
      toast({
        title: "Setup Failed",
        description: "Failed to setup payment processing. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSetupRazorpay = async () => {
    setIsSettingUp(true);
    await setupPayoutMutation.mutateAsync();
    setIsSettingUp(false);
  };

  const handleSkipForNow = () => {
    onSkip?.();
    toast({
      title: "Payment Setup Skipped",
      description: "You can set up payment processing later from your dashboard.",
    });
  };

  const razorpayAccount = payoutAccounts.find((account: any) => account.provider === 'razorpay');
  const hasPaymentSetup = payoutAccounts.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Configure payment processing</h3>
          <p className="text-muted-foreground">
            Set up secure payment processing to accept online bookings
          </p>
        </div>
      </div>

      {/* Current Status */}
      {hasPaymentSetup && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Payment Processing Configured
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You have {payoutAccounts.length} payment method{payoutAccounts.length !== 1 ? 's' : ''} configured
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {payoutAccounts.map((account: any) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <span className="font-medium capitalize">{account.provider}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={account.onboardingStatus === 'approved' ? 'default' : 'secondary'}
                        >
                          {account.onboardingStatus}
                        </Badge>
                        {account.isDefault && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {account.onboardingStatus !== 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('#', '_blank')}
                      data-testid={`button-complete-kyc-${account.id}`}
                    >
                      Complete KYC
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Razorpay Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img 
              src="https://razorpay.com/assets/razorpay-logo.svg" 
              alt="Razorpay" 
              className="h-6"
            />
            Razorpay Payment Gateway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium">Secure & Trusted</h4>
                <p className="text-sm text-muted-foreground">
                  Accept payments securely with India's leading payment gateway
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <h5 className="font-medium">Multiple Payment Methods</h5>
                <p className="text-sm text-muted-foreground">
                  Cards, UPI, Wallets, Net Banking
                </p>
              </div>
              <div className="text-center">
                <h5 className="font-medium">Instant Settlement</h5>
                <p className="text-sm text-muted-foreground">
                  Get paid within 24 hours
                </p>
              </div>
              <div className="text-center">
                <h5 className="font-medium">Low Transaction Fees</h5>
                <p className="text-sm text-muted-foreground">
                  Competitive pricing
                </p>
              </div>
            </div>

            {!razorpayAccount ? (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSetupRazorpay}
                  disabled={isSettingUp || setupPayoutMutation.isPending}
                  className="w-full"
                  data-testid="button-setup-razorpay"
                >
                  {isSettingUp || setupPayoutMutation.isPending ? "Setting up..." : "Setup Razorpay"}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  You'll need to complete KYC verification after setup to start accepting payments
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Razorpay Connected</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Status: {razorpayAccount.onboardingStatus}
                </p>
                {razorpayAccount.onboardingStatus !== 'approved' && (
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open('#', '_blank')}
                    data-testid="button-complete-razorpay-kyc"
                  >
                    Complete KYC Verification
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alternative Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Other Payment Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6" />
                  <div>
                    <h4 className="font-medium">Stripe</h4>
                    <p className="text-sm text-muted-foreground">
                      International payment processing
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6" />
                  <div>
                    <h4 className="font-medium">PayPal</h4>
                    <p className="text-sm text-muted-foreground">
                      Global payment solution
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                Important Note
              </h4>
              <div className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                <p>• Payment processing is required to accept online bookings</p>
                <p>• You can set this up later from your dashboard</p>
                <p>• KYC verification may take 1-2 business days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {hasPaymentSetup && (
            <span className="text-green-600 font-medium">✓ Payment setup complete</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!hasPaymentSetup && (
            <Button
              variant="outline"
              onClick={handleSkipForNow}
              data-testid="button-skip-payment"
            >
              Skip for Now
            </Button>
          )}

          <Button
            onClick={onNext}
            data-testid="button-continue-payment"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}