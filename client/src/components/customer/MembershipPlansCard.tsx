import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Percent,
  CreditCard,
  Package,
  CheckCircle2,
  Star,
  Clock,
  Gift,
  Sparkles,
  IndianRupee,
} from "lucide-react";

interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  planType: 'discount' | 'credit' | 'packaged';
  durationMonths: number;
  priceInPaisa: number;
  billingType: 'one_time' | 'monthly';
  monthlyPriceInPaisa: number | null;
  discountPercentage: number | null;
  creditAmountInPaisa: number | null;
  bonusPercentage: number | null;
  priorityBooking: number;
  includedServices?: {
    id: string;
    serviceId: string;
    quantityPerMonth: number;
    isUnlimited: number;
    serviceName: string;
    servicePrice: number;
  }[];
}

interface MembershipPlansCardProps {
  salonId: string;
  salonName?: string;
}

const planTypeLabels = {
  discount: 'Discount Plan',
  credit: 'Beauty Bank',
  packaged: 'Service Package',
};

const planTypeIcons = {
  discount: Percent,
  credit: CreditCard,
  packaged: Package,
};

const planTypeColors = {
  discount: 'bg-blue-100 text-blue-800 border-blue-200',
  credit: 'bg-purple-100 text-purple-800 border-purple-200',
  packaged: 'bg-green-100 text-green-800 border-green-200',
};

export default function MembershipPlansCard({ salonId, salonName }: MembershipPlansCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: plansResponse, isLoading } = useQuery<{ plans: MembershipPlan[] }>({
    queryKey: [`/api/salons/${salonId}/memberships/available`],
    enabled: !!salonId,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest('POST', '/api/memberships/purchase', { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/memberships'] });
      toast({
        title: "Membership Activated!",
        description: "Welcome! Your membership benefits are now active.",
      });
      setShowConfirmDialog(false);
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Could not complete your purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(paisa / 100);
  };

  const plans = plansResponse?.plans || [];

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return null;
  }

  const handleSelectPlan = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      setLocation(`/login?redirect=/salon/${salonId}`);
      return;
    }
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  return (
    <>
      <section className="scroll-mt-[200px]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            Membership Plans
          </h2>
          <p className="text-gray-600">Join our membership program for exclusive benefits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const PlanIcon = planTypeIcons[plan.planType];
            return (
              <Card
                key={plan.id}
                className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5"></div>
                
                <CardHeader className="relative pb-2">
                  <Badge className={planTypeColors[plan.planType]}>
                    <PlanIcon className="h-3 w-3 mr-1" />
                    {planTypeLabels[plan.planType]}
                  </Badge>
                  <CardTitle className="mt-2 text-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  )}
                </CardHeader>

                <CardContent className="relative space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatCurrency(plan.priceInPaisa)}
                    </span>
                    <span className="text-gray-500">
                      / {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}
                    </span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    {plan.planType === 'discount' && plan.discountPercentage && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">{plan.discountPercentage}% off all services</span>
                      </div>
                    )}

                    {plan.planType === 'credit' && plan.creditAmountInPaisa && (
                      <>
                        <div className="flex items-center gap-2 text-purple-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">
                            {formatCurrency(plan.creditAmountInPaisa)}/month credits
                          </span>
                        </div>
                        {plan.bonusPercentage && plan.bonusPercentage > 0 && (
                          <div className="flex items-center gap-2 text-purple-600">
                            <Gift className="h-4 w-4" />
                            <span>+{plan.bonusPercentage}% bonus credits</span>
                          </div>
                        )}
                      </>
                    )}

                    {plan.planType === 'packaged' && plan.includedServices && (
                      <div className="space-y-1">
                        {plan.includedServices.slice(0, 3).map((svc) => (
                          <div key={svc.id} className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">
                              {svc.serviceName} ({svc.isUnlimited ? 'Unlimited' : `${svc.quantityPerMonth}/mo`})
                            </span>
                          </div>
                        ))}
                        {plan.includedServices.length > 3 && (
                          <span className="text-xs text-muted-foreground pl-6">
                            +{plan.includedServices.length - 3} more services
                          </span>
                        )}
                      </div>
                    )}

                    {plan.priorityBooking === 1 && (
                      <div className="flex items-center gap-2 text-amber-600">
                        <Star className="h-4 w-4" />
                        <span>Priority booking access</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{plan.durationMonths}-month validity</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700"
                    onClick={() => handleSelectPlan(plan)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Join Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Confirm Membership Purchase
            </DialogTitle>
            <DialogDescription>
              You're about to join the {selectedPlan?.name} plan at {salonName || 'this salon'}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span>{selectedPlan.durationMonths} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <Badge className={planTypeColors[selectedPlan.planType]}>
                    {planTypeLabels[selectedPlan.planType]}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-purple-600">{formatCurrency(selectedPlan.priceInPaisa)}</span>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Your membership will be active immediately after purchase. Benefits can be used for bookings at this salon.
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedPlan && purchaseMutation.mutate(selectedPlan.id)}
              disabled={purchaseMutation.isPending}
              className="bg-gradient-to-r from-amber-500 to-purple-600"
            >
              {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
