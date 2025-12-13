import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import MembershipBadge, { MembershipStatusBadge } from "./MembershipBadge";
import {
  Crown,
  Percent,
  CreditCard,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  Pause,
  Play,
  XCircle,
  MapPin,
  IndianRupee,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { Link } from "wouter";

interface CustomerMembership {
  id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';
  startDate: string;
  endDate: string;
  creditBalanceInPaisa: number;
  pausedAt: string | null;
  resumeDate: string | null;
  plan: {
    id: string;
    name: string;
    planType: 'discount' | 'credit' | 'packaged';
    durationMonths: number;
    priceInPaisa: number;
    discountPercentage: number | null;
    creditAmountInPaisa: number | null;
    bonusPercentage: number | null;
    priorityBooking: number;
  };
  salon: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  serviceUsage?: {
    serviceId: string;
    serviceName: string;
    usedThisMonth: number;
    allowedPerMonth: number;
    isUnlimited: boolean;
  }[];
}

const planTypeIcons = {
  discount: Percent,
  credit: CreditCard,
  packaged: Package,
};

export default function CustomerMemberships() {
  const { toast } = useToast();
  const [selectedMembership, setSelectedMembership] = useState<CustomerMembership | null>(null);
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'cancel' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: membershipsResponse, isLoading } = useQuery<{ memberships: CustomerMembership[] }>({
    queryKey: ['/api/my/memberships'],
    staleTime: 30000,
  });

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/my/memberships/${id}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/memberships'] });
      toast({ title: "Membership Paused", description: "Your membership has been paused successfully." });
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to pause membership", variant: "destructive" });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/my/memberships/${id}/resume`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/memberships'] });
      toast({ title: "Membership Resumed", description: "Your membership is now active again." });
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to resume membership", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/my/memberships/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/memberships'] });
      toast({ title: "Membership Cancelled", description: "Your membership has been cancelled." });
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to cancel membership", variant: "destructive" });
    },
  });

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(paisa / 100);
  };

  const handleAction = (membership: CustomerMembership, action: 'pause' | 'resume' | 'cancel') => {
    setSelectedMembership(membership);
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    if (!selectedMembership || !actionType) return;

    switch (actionType) {
      case 'pause':
        pauseMutation.mutate(selectedMembership.id);
        break;
      case 'resume':
        resumeMutation.mutate(selectedMembership.id);
        break;
      case 'cancel':
        cancelMutation.mutate(selectedMembership.id);
        break;
    }
  };

  const memberships = membershipsResponse?.memberships || [];
  const activeMemberships = memberships.filter(m => m.status === 'active' || m.status === 'paused' || m.status === 'grace_period');
  const expiredMemberships = memberships.filter(m => m.status === 'expired' || m.status === 'cancelled');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Crown className="h-16 w-16 text-amber-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Memberships</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Join a membership plan at your favorite salon to unlock exclusive discounts, credits, and priority booking.
          </p>
          <Link href="/salons">
            <Button className="bg-gradient-to-r from-amber-500 to-purple-600">
              Explore Salons
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const renderMembershipCard = (membership: CustomerMembership) => {
    const PlanIcon = planTypeIcons[membership.plan.planType];
    const daysRemaining = differenceInDays(parseISO(membership.endDate), new Date());
    const totalDays = membership.plan.durationMonths * 30;
    const progressPercentage = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));

    return (
      <Card key={membership.id} className="overflow-hidden">
        <div className={`h-1.5 ${membership.status === 'active' ? 'bg-gradient-to-r from-amber-500 to-purple-600' : 'bg-gray-300'}`}></div>
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${membership.status === 'active' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <PlanIcon className={`h-5 w-5 ${membership.status === 'active' ? 'text-amber-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{membership.plan.name}</CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {membership.salon.name}
                </CardDescription>
              </div>
            </div>
            <MembershipStatusBadge status={membership.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Start Date</span>
              <p className="font-medium">{format(parseISO(membership.startDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Expires</span>
              <p className="font-medium">{format(parseISO(membership.endDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {membership.status === 'active' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Membership Progress</span>
                <span className="font-medium">{daysRemaining > 0 ? `${daysRemaining} days left` : 'Expiring soon'}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            {membership.plan.planType === 'discount' && membership.plan.discountPercentage && (
              <div className="flex items-center gap-2 text-green-600">
                <Percent className="h-4 w-4" />
                <span className="font-medium">{membership.plan.discountPercentage}% discount on all services</span>
              </div>
            )}

            {membership.plan.planType === 'credit' && (
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Credit Balance</span>
                  <span className="text-lg font-bold text-purple-700">
                    {formatCurrency(membership.creditBalanceInPaisa)}
                  </span>
                </div>
                {membership.plan.creditAmountInPaisa && (
                  <p className="text-xs text-purple-600 mt-1">
                    {formatCurrency(membership.plan.creditAmountInPaisa)} added monthly
                    {membership.plan.bonusPercentage && ` (+${membership.plan.bonusPercentage}% bonus)`}
                  </p>
                )}
              </div>
            )}

            {membership.plan.planType === 'packaged' && membership.serviceUsage && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Service Usage This Month</span>
                {membership.serviceUsage.map((usage) => (
                  <div key={usage.serviceId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{usage.serviceName}</span>
                    <span className="font-medium">
                      {usage.isUnlimited ? (
                        <Badge variant="outline" className="text-xs">Unlimited</Badge>
                      ) : (
                        `${usage.usedThisMonth} / ${usage.allowedPerMonth}`
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {membership.plan.priorityBooking === 1 && (
              <div className="flex items-center gap-2 text-amber-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Priority booking enabled</span>
              </div>
            )}
          </div>

          {(membership.status === 'active' || membership.status === 'paused') && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Link href={`/salon/${membership.salon.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
                {membership.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAction(membership, 'pause')}
                    title="Pause Membership"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleAction(membership, 'resume')}
                    title="Resume Membership"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleAction(membership, 'cancel')}
                  title="Cancel Membership"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {membership.status === 'paused' && membership.resumeDate && (
            <div className="bg-yellow-50 rounded-lg p-3 flex items-center gap-2 text-yellow-700 text-sm">
              <Clock className="h-4 w-4" />
              <span>Auto-resumes on {format(parseISO(membership.resumeDate), 'MMM dd, yyyy')}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {activeMemberships.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Active Memberships
          </h3>
          {activeMemberships.map(renderMembershipCard)}
        </div>
      )}

      {expiredMemberships.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muted-foreground">Past Memberships</h3>
          {expiredMemberships.map(renderMembershipCard)}
        </div>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionType === 'pause' && <Pause className="h-5 w-5 text-yellow-600" />}
              {actionType === 'resume' && <Play className="h-5 w-5 text-green-600" />}
              {actionType === 'cancel' && <AlertTriangle className="h-5 w-5 text-red-600" />}
              {actionType === 'pause' && 'Pause Membership?'}
              {actionType === 'resume' && 'Resume Membership?'}
              {actionType === 'cancel' && 'Cancel Membership?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'pause' && 
                'Your membership benefits will be temporarily suspended. You can resume anytime within 90 days.'}
              {actionType === 'resume' && 
                'Your membership benefits will be reactivated immediately.'}
              {actionType === 'cancel' && 
                'This action cannot be undone. You will lose access to all membership benefits.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {pauseMutation.isPending || resumeMutation.isPending || cancelMutation.isPending
                ? 'Processing...'
                : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
