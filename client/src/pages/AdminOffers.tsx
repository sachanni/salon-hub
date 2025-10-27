import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  CalendarIcon,
  ArrowLeft,
  Building2,
  Globe,
  Percent,
  DollarSign
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AdminOffer } from "@shared/admin-types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateOfferForm {
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minimumPurchase: string;
  maxDiscount: string;
  validFrom: Date | undefined;
  validUntil: Date | undefined;
  usageLimit: string;
  imageUrl: string;
  isActive: boolean;
}

export default function AdminOffers() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterApproval, setFilterApproval] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [selectedOffer, setSelectedOffer] = useState<AdminOffer | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Create offer form state
  const [createForm, setCreateForm] = useState<CreateOfferForm>({
    title: "",
    description: "",
    discountType: 'percentage',
    discountValue: "",
    minimumPurchase: "",
    maxDiscount: "",
    validFrom: undefined,
    validUntil: undefined,
    usageLimit: "",
    imageUrl: "",
    isActive: true
  });

  // Fetch offers
  const { data: offers = [], isLoading } = useQuery<AdminOffer[]>({
    queryKey: ['/api/admin/offers', filterStatus, filterApproval, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterApproval !== 'all') params.append('approvalStatus', filterApproval);
      if (filterType !== 'all') params.append('isPlatformWide', filterType === 'platform' ? '1' : '0');
      const response = await fetch(`/api/admin/offers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    },
  });


  // Approve offer mutation
  const approveMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest('POST', `/api/admin/offers/${offerId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/offers'] });
      toast({ title: "Offer approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve offer", variant: "destructive" });
    },
  });

  // Reject offer mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ offerId, reason }: { offerId: string; reason: string }) => {
      return apiRequest('POST', `/api/admin/offers/${offerId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/offers'] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      toast({ title: "Offer rejected successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reject offer", variant: "destructive" });
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ offerId, isActive }: { offerId: string; isActive: number }) => {
      return apiRequest('POST', `/api/admin/offers/${offerId}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/offers'] });
      toast({ title: "Offer status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update offer status", variant: "destructive" });
    },
  });

  // Delete offer mutation
  const deleteMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest('DELETE', `/api/admin/offers/${offerId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/offers'] });
      toast({ title: "Offer deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete offer", variant: "destructive" });
    },
  });

  // Create offer mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/offers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/offers'] });
      setViewMode('list');
      resetCreateForm();
      toast({ title: "Offer created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create offer", 
        description: error.message || "Please check all required fields",
        variant: "destructive" 
      });
    },
  });

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      discountType: 'percentage',
      discountValue: "",
      minimumPurchase: "",
      maxDiscount: "",
      validFrom: undefined,
      validUntil: undefined,
      usageLimit: "",
      imageUrl: "",
      isActive: true
    });
  };

  const handleCreateOffer = () => {
    try {
      // Validation
      if (!createForm.title.trim()) {
        toast({ title: "Title is required", variant: "destructive" });
        return;
      }

      if (!createForm.discountValue || parseFloat(createForm.discountValue) <= 0) {
        toast({ title: "Discount value must be greater than 0", variant: "destructive" });
        return;
      }

      if (createForm.discountType === 'percentage') {
        const value = parseFloat(createForm.discountValue);
        if (value < 1 || value > 100) {
          toast({ title: "Percentage must be between 1 and 100", variant: "destructive" });
          return;
        }
      }

      if (!createForm.validFrom || !createForm.validUntil) {
        toast({ title: "Valid dates are required", variant: "destructive" });
        return;
      }

      // Ensure dates are valid Date objects
      const validFromDate = createForm.validFrom instanceof Date ? createForm.validFrom : new Date(createForm.validFrom);
      const validUntilDate = createForm.validUntil instanceof Date ? createForm.validUntil : new Date(createForm.validUntil);

      if (isNaN(validFromDate.getTime()) || isNaN(validUntilDate.getTime())) {
        toast({ title: "Invalid date format", variant: "destructive" });
        return;
      }

      if (validUntilDate <= validFromDate) {
        toast({ title: "Valid Until must be after Valid From", variant: "destructive" });
        return;
      }

      // Prepare data - Super admin offers are ALWAYS platform-wide
      const offerData: any = {
        title: createForm.title.trim(),
        description: createForm.description?.trim() || null,
        discountType: createForm.discountType,
        discountValue: createForm.discountType === 'percentage' 
          ? parseFloat(createForm.discountValue)
          : Math.round(parseFloat(createForm.discountValue) * 100), // Convert rupees to paisa for fixed
        validFrom: validFromDate.toISOString(),
        validUntil: validUntilDate.toISOString(),
        isPlatformWide: 1, // Super admin offers are ALWAYS platform-wide
        isActive: createForm.isActive ? 1 : 0,
        imageUrl: createForm.imageUrl || undefined, // Promotional image for offer card
      }

      if (createForm.minimumPurchase && parseFloat(createForm.minimumPurchase) > 0) {
        offerData.minimumPurchase = Math.round(parseFloat(createForm.minimumPurchase) * 100); // Convert to paisa
      }

      if (createForm.maxDiscount && createForm.discountType === 'percentage' && parseFloat(createForm.maxDiscount) > 0) {
        offerData.maxDiscount = Math.round(parseFloat(createForm.maxDiscount) * 100); // Convert to paisa
      }

      if (createForm.usageLimit && parseInt(createForm.usageLimit) > 0) {
        offerData.usageLimit = parseInt(createForm.usageLimit);
      }

      console.log('Creating offer with data:', offerData);
      createMutation.mutate(offerData);
    } catch (error) {
      console.error('Error in handleCreateOffer:', error);
      toast({ 
        title: "Error creating offer", 
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  };

  const filteredOffers = offers.filter(offer => 
    offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        Inactive
      </Badge>
    );
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Offers Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {viewMode === 'list' ? 'Manage platform-wide and salon-specific offers' : 'Create a new promotional offer'}
            </p>
          </div>
        </div>
        {viewMode === 'list' ? (
          <Button onClick={() => setViewMode('create')} data-testid="button-create-offer">
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => {
              setViewMode('list');
              resetCreateForm();
            }} 
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        )}
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-offers"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="select-filter-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterApproval} onValueChange={setFilterApproval}>
                <SelectTrigger data-testid="select-filter-approval">
                  <SelectValue placeholder="Filter by approval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approvals</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger data-testid="select-filter-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="platform">Platform-Wide</SelectItem>
                  <SelectItem value="salon">Salon-Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Pending Approvals Alert */}
          {offers.filter(o => o.approvalStatus === 'pending').length > 0 && (
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                    {offers.filter(o => o.approvalStatus === 'pending').length} offer(s) pending approval
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">Review and approve or reject pending offers</p>
                </div>
              </div>
            </Card>
          )}

          {/* Offers List */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="p-0 overflow-hidden" data-testid={`card-offer-${offer.id}`}>
                  {offer.imageUrl && (
                    <div className="w-full h-48 bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={offer.imageUrl} 
                        alt={offer.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{offer.title}</h3>
                        {getStatusBadge(offer.isActive)}
                        {getApprovalBadge(offer.approvalStatus || 'pending')}
                        {offer.isPlatformWide === 1 && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Platform-Wide
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{offer.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Discount:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${(offer.discountValue / 100).toFixed(2)}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Valid From:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(offer.validFrom), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Valid Until:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(offer.validUntil), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {offer.usageCount || 0} / {offer.usageLimit || '∞'}
                          </p>
                        </div>
                      </div>
                      {offer.salonName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Salon: {offer.salonName}</p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      {offer.approvalStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(offer.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${offer.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedOffer(offer);
                              setIsRejectDialogOpen(true);
                            }}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${offer.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {offer.approvalStatus === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleMutation.mutate({ offerId: offer.id, isActive: offer.isActive === 1 ? 0 : 1 })}
                          disabled={toggleMutation.isPending}
                          data-testid={`button-toggle-${offer.id}`}
                        >
                          {offer.isActive === 1 ? <ToggleRight className="w-4 h-4 mr-1" /> : <ToggleLeft className="w-4 h-4 mr-1" />}
                          {offer.isActive === 1 ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(offer.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${offer.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Create Offer Form */
        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Offer Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g., Summer Sale 20% Off"
                  data-testid="input-offer-title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Describe your offer (optional)"
                  rows={3}
                  data-testid="textarea-offer-description"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Step 2: Offer Type - Platform-Wide Only */}
          <Card className="p-6 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Platform-Wide Offers Only</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  As super admin, you create promotional campaigns that apply across all salons on the platform. Individual salon owners manage their own salon-specific offers independently.
                </p>
              </div>
            </div>
          </Card>

          {/* Step 3: Discount Type Selection (Card-based) */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Discount Type <span className="text-red-500">*</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={cn(
                  "p-6 cursor-pointer transition-all border-2",
                  createForm.discountType === 'percentage'
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                )}
                onClick={() => setCreateForm({ ...createForm, discountType: 'percentage', discountValue: "", maxDiscount: "" })}
                data-testid="card-percentage"
              >
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    createForm.discountType === 'percentage' 
                      ? "bg-green-500" 
                      : "bg-gray-200 dark:bg-gray-700"
                  )}>
                    <Percent className={cn(
                      "w-6 h-6",
                      createForm.discountType === 'percentage' 
                        ? "text-white" 
                        : "text-gray-600 dark:text-gray-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Percentage Discount</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Offer a percentage off the total amount
                    </p>
                  </div>
                  {createForm.discountType === 'percentage' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </Card>

              <Card
                className={cn(
                  "p-6 cursor-pointer transition-all border-2",
                  createForm.discountType === 'fixed'
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                )}
                onClick={() => setCreateForm({ ...createForm, discountType: 'fixed', discountValue: "", maxDiscount: "" })}
                data-testid="card-fixed"
              >
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    createForm.discountType === 'fixed' 
                      ? "bg-green-500" 
                      : "bg-gray-200 dark:bg-gray-700"
                  )}>
                    <DollarSign className={cn(
                      "w-6 h-6",
                      createForm.discountType === 'fixed' 
                        ? "text-white" 
                        : "text-gray-600 dark:text-gray-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Fixed Amount</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Offer a fixed rupee amount off
                    </p>
                  </div>
                  {createForm.discountType === 'fixed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </Card>
            </div>
          </Card>

          {/* Step 4: Discount Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Discount Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discountValue">
                  Discount Value <span className="text-red-500">*</span>
                  {createForm.discountType === 'percentage' && <span className="text-sm text-gray-500"> (1-100%)</span>}
                  {createForm.discountType === 'fixed' && <span className="text-sm text-gray-500"> (in ₹)</span>}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={createForm.discountValue}
                  onChange={(e) => setCreateForm({ ...createForm, discountValue: e.target.value })}
                  placeholder={createForm.discountType === 'percentage' ? "e.g., 20" : "e.g., 500"}
                  min={createForm.discountType === 'percentage' ? "1" : "0"}
                  max={createForm.discountType === 'percentage' ? "100" : undefined}
                  step={createForm.discountType === 'percentage' ? "1" : "0.01"}
                  data-testid="input-discount-value"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimumPurchase">Minimum Purchase (₹)</Label>
                  <Input
                    id="minimumPurchase"
                    type="number"
                    value={createForm.minimumPurchase}
                    onChange={(e) => setCreateForm({ ...createForm, minimumPurchase: e.target.value })}
                    placeholder="Optional"
                    min="0"
                    step="0.01"
                    data-testid="input-minimum-purchase"
                    className="mt-1"
                  />
                </div>

                {createForm.discountType === 'percentage' && (
                  <div>
                    <Label htmlFor="maxDiscount">Max Discount Cap (₹)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      value={createForm.maxDiscount}
                      onChange={(e) => setCreateForm({ ...createForm, maxDiscount: e.target.value })}
                      placeholder="Optional"
                      min="0"
                      step="0.01"
                      data-testid="input-max-discount"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Step 5: Validity Period */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Validity Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Valid From <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !createForm.validFrom && "text-muted-foreground"
                      )}
                      data-testid="button-valid-from"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {createForm.validFrom ? format(createForm.validFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={createForm.validFrom}
                      onSelect={(date) => setCreateForm({ ...createForm, validFrom: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Valid Until <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !createForm.validUntil && "text-muted-foreground"
                      )}
                      data-testid="button-valid-until"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {createForm.validUntil ? format(createForm.validUntil, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={createForm.validUntil}
                      onSelect={(date) => setCreateForm({ ...createForm, validUntil: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>

          {/* Step 6: Additional Options */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Options</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={createForm.usageLimit}
                  onChange={(e) => setCreateForm({ ...createForm, usageLimit: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  data-testid="input-usage-limit"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum number of times this offer can be used
                </p>
              </div>

              <div>
                <Label htmlFor="imageUrl">Promotional Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/offer-image.jpg"
                  data-testid="input-image-url"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add an image to make your offer card more attractive (optional)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={createForm.isActive}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked as boolean })}
                  data-testid="checkbox-is-active"
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  Make offer active immediately
                </Label>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setViewMode('list');
                resetCreateForm();
              }}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOffer}
              disabled={createMutation.isPending}
              data-testid="button-submit-create"
            >
              {createMutation.isPending ? "Creating..." : "Create Offer"}
            </Button>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Offer</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this offer. The salon will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
                data-testid="textarea-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedOffer && rejectMutation.mutate({ offerId: selectedOffer.id, reason: rejectionReason })}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Reject Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
