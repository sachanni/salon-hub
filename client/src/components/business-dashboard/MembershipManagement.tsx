import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Crown,
  Plus,
  Trash2,
  Edit,
  Users,
  IndianRupee,
  Percent,
  CreditCard,
  Package,
  TrendingUp,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  AlertCircle,
  Sparkles,
  Gift,
  Star,
} from "lucide-react";

interface MembershipManagementProps {
  salonId: string;
}

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
  maxMembers: number | null;
  isActive: number;
  includedServices?: {
    id: string;
    serviceId: string;
    quantityPerMonth: number;
    isUnlimited: number;
    serviceName: string;
    servicePrice: number;
  }[];
}

interface Member {
  membership: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    creditBalanceInPaisa: number;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImageUrl: string | null;
  };
  plan: {
    id: string;
    name: string;
    planType: string;
  };
}

interface MembershipAnalytics {
  activeMembers: number;
  totalMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  newMembersThisMonth: number;
  cancelledThisMonth: number;
  churnRate: number;
  membersByPlan: { planId: string; planName: string; planType: string; count: number }[];
}

interface Service {
  id: string;
  name: string;
  priceInPaisa: number;
  durationMinutes: number;
  category: string;
}

const planTypeLabels = {
  discount: 'Discount Membership',
  credit: 'Credit/Beauty Bank',
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

export default function MembershipManagement({ salonId }: MembershipManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('plans');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    planType: 'discount' as 'discount' | 'credit' | 'packaged',
    durationMonths: 6,
    priceInPaisa: 0,
    billingType: 'one_time' as 'one_time' | 'monthly',
    monthlyPriceInPaisa: 0,
    discountPercentage: 10,
    creditAmountInPaisa: 200000,
    bonusPercentage: 20,
    priorityBooking: 0,
    maxMembers: null as number | null,
    includedServices: [] as { serviceId: string; quantityPerMonth: number; isUnlimited: boolean }[],
  });

  const { data: plansResponse, isLoading: plansLoading } = useQuery<{ plans: MembershipPlan[] }>({
    queryKey: [`/api/salons/${salonId}/membership-plans/manage`],
    enabled: !!salonId,
  });

  const { data: membersResponse, isLoading: membersLoading } = useQuery<{ members: Member[]; totalCount: number }>({
    queryKey: [`/api/salons/${salonId}/members`],
    enabled: !!salonId && activeTab === 'members',
  });

  const { data: analyticsResponse, isLoading: analyticsLoading } = useQuery<MembershipAnalytics & { success: boolean }>({
    queryKey: [`/api/salons/${salonId}/membership-analytics`],
    enabled: !!salonId && activeTab === 'analytics',
  });

  const { data: servicesResponse } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salonId}/services`],
    enabled: !!salonId,
  });

  const plans = plansResponse?.plans || [];
  const members = membersResponse?.members || [];
  const analytics = analyticsResponse;
  const services = servicesResponse || [];

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/salons/${salonId}/membership-plans`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/membership-plans/manage`] });
      toast({ title: "Plan Created!", description: "Your membership plan is now available" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create plan", variant: "destructive" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: any }) => {
      return apiRequest('PUT', `/api/membership-plans/${planId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/membership-plans/manage`] });
      toast({ title: "Plan Updated!", description: "Your membership plan has been updated" });
      setEditingPlan(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update plan", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest('DELETE', `/api/membership-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/membership-plans/manage`] });
      toast({ title: "Plan Deleted", description: "The membership plan has been removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete plan", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      planType: 'discount',
      durationMonths: 6,
      priceInPaisa: 0,
      billingType: 'one_time',
      monthlyPriceInPaisa: 0,
      discountPercentage: 10,
      creditAmountInPaisa: 200000,
      bonusPercentage: 20,
      priorityBooking: 0,
      maxMembers: null,
      includedServices: [],
    });
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      planType: plan.planType,
      durationMonths: plan.durationMonths,
      priceInPaisa: plan.priceInPaisa,
      billingType: plan.billingType,
      monthlyPriceInPaisa: plan.monthlyPriceInPaisa || 0,
      discountPercentage: plan.discountPercentage || 10,
      creditAmountInPaisa: plan.creditAmountInPaisa || 200000,
      bonusPercentage: plan.bonusPercentage || 20,
      priorityBooking: plan.priorityBooking,
      maxMembers: plan.maxMembers,
      includedServices: plan.includedServices?.map(s => ({
        serviceId: s.serviceId,
        quantityPerMonth: s.quantityPerMonth,
        isUnlimited: s.isUnlimited === 1,
      })) || [],
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formData.name,
      description: formData.description || null,
      planType: formData.planType,
      durationMonths: formData.durationMonths,
      priceInPaisa: formData.priceInPaisa,
      billingType: formData.billingType,
      monthlyPriceInPaisa: formData.billingType === 'monthly' ? formData.monthlyPriceInPaisa : null,
      discountPercentage: formData.planType === 'discount' ? formData.discountPercentage : null,
      creditAmountInPaisa: formData.planType === 'credit' ? formData.creditAmountInPaisa : null,
      bonusPercentage: formData.planType === 'credit' ? formData.bonusPercentage : null,
      priorityBooking: formData.priorityBooking,
      maxMembers: formData.maxMembers,
      includedServices: formData.planType === 'packaged' ? formData.includedServices : undefined,
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ planId: editingPlan.id, data: payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(paisa / 100);
  };

  const toggleServiceInPackage = (serviceId: string) => {
    const existing = formData.includedServices.find(s => s.serviceId === serviceId);
    if (existing) {
      setFormData({
        ...formData,
        includedServices: formData.includedServices.filter(s => s.serviceId !== serviceId),
      });
    } else {
      setFormData({
        ...formData,
        includedServices: [...formData.includedServices, { serviceId, quantityPerMonth: 1, isUnlimited: false }],
      });
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    setFormData({
      ...formData,
      includedServices: formData.includedServices.map(s =>
        s.serviceId === serviceId ? { ...s, quantityPerMonth: quantity } : s
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            Membership Management
          </h1>
          <p className="text-muted-foreground">Create and manage membership plans for your customers</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingPlan(null); setShowCreateDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          {plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader><div className="h-6 bg-gray-200 rounded w-3/4"></div></CardHeader>
                  <CardContent><div className="h-20 bg-gray-200 rounded"></div></CardContent>
                </Card>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Crown className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Membership Plans Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first membership plan to offer recurring benefits to your customers
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => {
                const PlanIcon = planTypeIcons[plan.planType];
                return (
                  <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge className={planTypeColors[plan.planType]}>
                            <PlanIcon className="h-3 w-3 mr-1" />
                            {planTypeLabels[plan.planType]}
                          </Badge>
                          <CardTitle className="mt-2">{plan.name}</CardTitle>
                        </div>
                        {!plan.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Price</span>
                          <span className="font-semibold">{formatCurrency(plan.priceInPaisa)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Duration</span>
                          <span>{plan.durationMonths} months</span>
                        </div>
                        
                        {plan.planType === 'discount' && plan.discountPercentage && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Discount</span>
                            <span className="text-green-600 font-semibold">{plan.discountPercentage}% off</span>
                          </div>
                        )}
                        
                        {plan.planType === 'credit' && plan.creditAmountInPaisa && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Monthly Credit</span>
                            <span className="text-purple-600 font-semibold">
                              {formatCurrency(plan.creditAmountInPaisa)}
                              {plan.bonusPercentage && <span className="text-xs ml-1">(+{plan.bonusPercentage}% bonus)</span>}
                            </span>
                          </div>
                        )}
                        
                        {plan.planType === 'packaged' && plan.includedServices && (
                          <div>
                            <span className="text-sm text-muted-foreground">Included Services</span>
                            <div className="mt-1 space-y-1">
                              {plan.includedServices.slice(0, 3).map(svc => (
                                <div key={svc.id} className="text-sm flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {svc.serviceName} ({svc.isUnlimited ? 'Unlimited' : `${svc.quantityPerMonth}/mo`})
                                </div>
                              ))}
                              {plan.includedServices.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{plan.includedServices.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {plan.priorityBooking === 1 && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Star className="h-3 w-3" />
                            <span className="text-xs">Priority Booking</span>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditPlan(plan)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deletePlanMutation.mutate(plan.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {membersLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : members.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Members Yet</h3>
                <p className="text-muted-foreground text-center">
                  When customers purchase memberships, they'll appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {members.map(member => (
                <Card key={member.membership.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {member.customer.firstName?.[0] || member.customer.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.customer.firstName} {member.customer.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant={member.membership.status === 'active' ? 'default' : 'secondary'}>
                            {member.membership.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">{member.plan.name}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Expires</p>
                          <p>{new Date(member.membership.endDate).toLocaleDateString()}</p>
                        </div>
                        {member.plan.planType === 'credit' && (
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Credit Balance</p>
                            <p className="font-semibold text-purple-600">
                              {formatCurrency(member.membership.creditBalanceInPaisa)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analyticsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <Users className="h-5 w-5" />
                      <span className="text-2xl font-bold">{analytics.activeMembers}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Active Members</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <IndianRupee className="h-5 w-5" />
                      <span className="text-2xl font-bold">{formatCurrency(analytics.monthlyRevenue)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-2xl font-bold">{analytics.newMembersThisMonth}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">New This Month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-2xl font-bold">{analytics.churnRate}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Churn Rate</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Members by Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.membersByPlan.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No membership data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.membersByPlan.map(item => (
                        <div key={item.planId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={planTypeColors[item.planType as keyof typeof planTypeColors]}>
                              {item.planType}
                            </Badge>
                            <span className="font-medium">{item.planName}</span>
                          </div>
                          <span className="font-semibold">{item.count} members</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{formatCurrency(analytics.totalRevenue)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Total Membership Revenue</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{analytics.totalMembers}</p>
                      <p className="text-sm text-muted-foreground mt-1">Total Members (All Time)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Unable to load analytics</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}</DialogTitle>
            <DialogDescription>
              Configure a membership plan to offer recurring benefits to your customers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Plan Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gold Membership"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the benefits of this membership"
              />
            </div>

            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select
                value={formData.planType}
                onValueChange={(v: 'discount' | 'credit' | 'packaged') => setFormData({ ...formData, planType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Discount Membership - Percentage off all services
                    </div>
                  </SelectItem>
                  <SelectItem value="credit">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit/Beauty Bank - Monthly credits with bonus
                    </div>
                  </SelectItem>
                  <SelectItem value="packaged">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Service Package - Fixed services per month
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (Months)</Label>
                <Select
                  value={formData.durationMonths.toString()}
                  onValueChange={v => setFormData({ ...formData, durationMonths: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Billing Type</Label>
                <Select
                  value={formData.billingType}
                  onValueChange={(v: 'one_time' | 'monthly') => setFormData({ ...formData, billingType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time Payment</SelectItem>
                    <SelectItem value="monthly">Monthly Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Total Price (₹)</Label>
              <Input
                type="number"
                value={formData.priceInPaisa / 100 || ''}
                onChange={e => setFormData({ ...formData, priceInPaisa: parseInt(e.target.value) * 100 || 0 })}
                placeholder="e.g., 2999"
              />
            </div>

            {formData.planType === 'discount' && (
              <div className="space-y-2">
                <Label>Discount Percentage (%)</Label>
                <Input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={e => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 15"
                  min={1}
                  max={100}
                />
              </div>
            )}

            {formData.planType === 'credit' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monthly Credit Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.creditAmountInPaisa / 100 || ''}
                    onChange={e => setFormData({ ...formData, creditAmountInPaisa: parseInt(e.target.value) * 100 || 0 })}
                    placeholder="e.g., 2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Percentage (%)</Label>
                  <Input
                    type="number"
                    value={formData.bonusPercentage}
                    onChange={e => setFormData({ ...formData, bonusPercentage: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 20"
                  />
                </div>
              </div>
            )}

            {formData.planType === 'packaged' && (
              <div className="space-y-2">
                <Label>Included Services</Label>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No services available. Add services first.</p>
                  ) : (
                    <div className="space-y-2">
                      {services.map(service => {
                        const selected = formData.includedServices.find(s => s.serviceId === service.id);
                        return (
                          <div key={service.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={!!selected}
                                onCheckedChange={() => toggleServiceInPackage(service.id)}
                              />
                              <div>
                                <p className="text-sm font-medium">{service.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(service.priceInPaisa)}</p>
                              </div>
                            </div>
                            {selected && (
                              <Input
                                type="number"
                                className="w-20"
                                value={selected.quantityPerMonth}
                                onChange={e => updateServiceQuantity(service.id, parseInt(e.target.value) || 1)}
                                min={1}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.priorityBooking === 1}
                  onCheckedChange={checked => setFormData({ ...formData, priorityBooking: checked ? 1 : 0 })}
                />
                <Label>Priority Booking</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Maximum Members (optional)</Label>
              <Input
                type="number"
                value={formData.maxMembers || ''}
                onChange={e => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || null })}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingPlan(null); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || formData.priceInPaisa <= 0 || createPlanMutation.isPending || updatePlanMutation.isPending}
              >
                {createPlanMutation.isPending || updatePlanMutation.isPending ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
