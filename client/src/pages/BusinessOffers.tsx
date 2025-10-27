import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Gift, 
  Plus, 
  ArrowLeft, 
  Percent, 
  DollarSign, 
  Check,
  Trash2,
  Edit,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BusinessOffer {
  id: string;
  title: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumPurchase: number | null;
  maxDiscount: number | null;
  validFrom: string;
  validUntil: string;
  isActive: number;
  usageLimit: number | null;
  usageCount: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalNotes: string | null;
  imageUrl: string | null;
  createdAt: string;
}

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

export default function BusinessOffers({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [editingOffer, setEditingOffer] = useState<BusinessOffer | null>(null);
  const [createForm, setCreateForm] = useState<CreateOfferForm>({
    title: "",
    description: "",
    discountType: 'percentage',
    discountValue: "",
    minimumPurchase: "",
    imageUrl: "",
    maxDiscount: "",
    validFrom: undefined,
    validUntil: undefined,
    usageLimit: "",
    isActive: true
  });

  // Fetch salon offers
  const { data: offers = [], isLoading } = useQuery<BusinessOffer[]>({
    queryKey: ['/api/salons', salonId, 'offers'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/offers`);
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    },
  });

  // Create/Update offer mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingOffer) {
        return apiRequest('PATCH', `/api/salons/${salonId}/offers/${editingOffer.id}`, data);
      }
      return apiRequest('POST', `/api/salons/${salonId}/offers`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'offers'] });
      setViewMode('list');
      resetForm();
      toast({ 
        title: editingOffer ? "Offer updated successfully" : "Offer created successfully",
        description: "Your promotional offer is now active"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to save offer", 
        description: error.message || "Please check all required fields",
        variant: "destructive" 
      });
    },
  });

  // Toggle status mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ offerId, isActive }: { offerId: string; isActive: number }) => {
      return apiRequest('POST', `/api/salons/${salonId}/offers/${offerId}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'offers'] });
      toast({ title: "Offer status updated successfully" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest('DELETE', `/api/salons/${salonId}/offers/${offerId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'offers'] });
      toast({ title: "Offer deleted successfully" });
    },
  });

  const resetForm = () => {
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
    setEditingOffer(null);
  };

  const handleEdit = (offer: BusinessOffer) => {
    setEditingOffer(offer);
    setCreateForm({
      title: offer.title,
      description: offer.description || "",
      discountType: offer.discountType,
      discountValue: offer.discountType === 'percentage' 
        ? offer.discountValue.toString() 
        : (offer.discountValue / 100).toString(),
      minimumPurchase: offer.minimumPurchase ? (offer.minimumPurchase / 100).toString() : "",
      maxDiscount: offer.maxDiscount ? (offer.maxDiscount / 100).toString() : "",
      validFrom: new Date(offer.validFrom),
      validUntil: new Date(offer.validUntil),
      usageLimit: offer.usageLimit?.toString() || "",
      imageUrl: offer.imageUrl || "",
      isActive: offer.isActive === 1
    });
    setViewMode('create');
  };

  const handleSubmit = () => {
    try {
      // Validation
      if (!createForm.title.trim()) {
        toast({ title: "Title is required", variant: "destructive" });
        return;
      }

      const discountValue = parseFloat(createForm.discountValue);
      if (!createForm.discountValue || !Number.isFinite(discountValue) || discountValue <= 0) {
        toast({ title: "Please enter a valid discount value greater than 0", variant: "destructive" });
        return;
      }

      if (createForm.discountType === 'percentage') {
        if (discountValue < 1 || discountValue > 100) {
          toast({ title: "Percentage must be between 1 and 100", variant: "destructive" });
          return;
        }
      }

      if (!createForm.validFrom || !createForm.validUntil) {
        toast({ title: "Valid dates are required", variant: "destructive" });
        return;
      }

      if (createForm.validUntil <= createForm.validFrom) {
        toast({ title: "Valid Until must be after Valid From", variant: "destructive" });
        return;
      }

      // Validate optional numeric fields
      if (createForm.minimumPurchase) {
        const minPurchase = parseFloat(createForm.minimumPurchase);
        if (!Number.isFinite(minPurchase) || minPurchase <= 0) {
          toast({ title: "Please enter a valid minimum purchase amount", variant: "destructive" });
          return;
        }
      }

      if (createForm.maxDiscount) {
        const maxDisc = parseFloat(createForm.maxDiscount);
        if (!Number.isFinite(maxDisc) || maxDisc <= 0) {
          toast({ title: "Please enter a valid maximum discount amount", variant: "destructive" });
          return;
        }
      }

      if (createForm.usageLimit) {
        const usageLimit = parseFloat(createForm.usageLimit);
        if (!Number.isFinite(usageLimit) || usageLimit <= 0 || !Number.isInteger(usageLimit)) {
          toast({ title: "Please enter a valid usage limit (whole number)", variant: "destructive" });
          return;
        }
      }

      // Validate dates
      if (!createForm.validFrom || !createForm.validUntil) {
        toast({ title: "Please select both valid from and valid until dates", variant: "destructive" });
        return;
      }

      // Prepare data with validated values
      const validFromDate = createForm.validFrom instanceof Date ? createForm.validFrom : new Date(createForm.validFrom);
      const validUntilDate = createForm.validUntil instanceof Date ? createForm.validUntil : new Date(createForm.validUntil);

      const offerData: any = {
        salonId,
        title: createForm.title,
        description: createForm.description || null,
        discountType: createForm.discountType,
        discountValue: createForm.discountType === 'percentage' 
          ? discountValue
          : Math.round(discountValue * 100),
        validFrom: validFromDate.toISOString(),
        validUntil: validUntilDate.toISOString(),
        isActive: createForm.isActive ? 1 : 0,
        isPlatformWide: 0, // Business users can only create salon-specific offers
        imageUrl: createForm.imageUrl || undefined, // Promotional image for offer card
      };

      if (createForm.minimumPurchase) {
        offerData.minimumPurchase = Math.round(parseFloat(createForm.minimumPurchase) * 100);
      }

      if (createForm.maxDiscount && createForm.discountType === 'percentage') {
        offerData.maxDiscount = Math.round(parseFloat(createForm.maxDiscount) * 100);
      }

      if (createForm.usageLimit) {
        offerData.usageLimit = parseInt(createForm.usageLimit);
      }

      createMutation.mutate(offerData);
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast({ 
        title: "Error saving offer", 
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive" 
      });
    }
  };

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // List View
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Offers & Promotions
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create and manage promotional offers for your customers
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setViewMode('create')}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-create-offer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>

        {/* Offers Grid */}
        {offers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Gift className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No offers created yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start attracting more customers with promotional offers
                </p>
                <Button 
                  onClick={() => setViewMode('create')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Offer
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Card 
                key={offer.id} 
                className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                data-testid={`card-offer-${offer.id}`}
              >
                {offer.imageUrl && (
                  <div className="w-full h-40 bg-gray-100 dark:bg-gray-800">
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
                  {/* Offer Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {offer.title}
                      </h3>
                    {offer.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {offer.description}
                      </p>
                    )}
                  </div>
                  {getApprovalBadge(offer.approvalStatus)}
                </div>

                {/* Discount Badge */}
                <div className="mb-4">
                  <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    {offer.discountType === 'percentage' ? (
                      <>
                        <Percent className="w-5 h-5 mr-2" />
                        <span className="text-2xl font-bold">{offer.discountValue}%</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5 mr-2" />
                        <span className="text-2xl font-bold">₹{(offer.discountValue / 100).toFixed(0)}</span>
                      </>
                    )}
                    <span className="ml-2 text-sm opacity-90">OFF</span>
                  </div>
                </div>

                {/* Offer Details */}
                <div className="space-y-2 mb-4">
                  {offer.minimumPurchase && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Min. purchase: ₹{(offer.minimumPurchase / 100).toFixed(0)}
                    </div>
                  )}
                  {offer.maxDiscount && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Max discount: ₹{(offer.maxDiscount / 100).toFixed(0)}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(new Date(offer.validFrom), 'MMM d')} - {format(new Date(offer.validUntil), 'MMM d, yyyy')}
                  </div>
                  {offer.usageLimit && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4 mr-2" />
                      Used: {offer.usageCount} / {offer.usageLimit}
                    </div>
                  )}
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={offer.isActive === 1}
                      onCheckedChange={(checked) => 
                        toggleMutation.mutate({ offerId: offer.id, isActive: checked ? 1 : 0 })
                      }
                      disabled={offer.approvalStatus !== 'approved' || toggleMutation.isPending}
                      data-testid={`switch-active-${offer.id}`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {offer.isActive === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(offer)}
                      data-testid={`button-edit-${offer.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this offer?')) {
                          deleteMutation.mutate(offer.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      data-testid={`button-delete-${offer.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Rejection Note */}
                {offer.approvalStatus === 'rejected' && offer.approvalNotes && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">
                      <strong>Rejection reason:</strong> {offer.approvalNotes}
                    </p>
                  </div>
                )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Create/Edit View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setViewMode('list');
            resetForm();
          }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offers
        </Button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingOffer ? 'Edit Offer' : 'Create New Offer'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {editingOffer ? 'Update your promotional offer details' : 'Set up a new promotional offer for your customers'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">
                Offer Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g., Diwali Special - 20% Off"
                className="mt-1"
                data-testid="input-title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe your offer..."
                rows={3}
                className="mt-1"
                data-testid="textarea-description"
              />
            </div>
          </div>
        </Card>

        {/* Discount Type Selection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Discount Type <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={cn(
                "p-6 cursor-pointer transition-all duration-200 hover:shadow-md",
                createForm.discountType === 'percentage'
                  ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
              onClick={() => setCreateForm({ ...createForm, discountType: 'percentage' })}
              data-testid="card-percentage-discount"
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                  createForm.discountType === 'percentage'
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}>
                  <Percent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Percentage Discount
                    </h3>
                    {createForm.discountType === 'percentage' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Offer a percentage off the total amount
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className={cn(
                "p-6 cursor-pointer transition-all duration-200 hover:shadow-md",
                createForm.discountType === 'fixed'
                  ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
              onClick={() => setCreateForm({ ...createForm, discountType: 'fixed' })}
              data-testid="card-fixed-discount"
            >
              <div className="flex items-start space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                  createForm.discountType === 'fixed'
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}>
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Fixed Amount
                    </h3>
                    {createForm.discountType === 'fixed' && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Offer a fixed rupee amount off
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Card>

        {/* Discount Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Discount Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountValue">
                {createForm.discountType === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="discountValue"
                type="number"
                value={createForm.discountValue}
                onChange={(e) => setCreateForm({ ...createForm, discountValue: e.target.value })}
                placeholder={createForm.discountType === 'percentage' ? "e.g., 20" : "e.g., 500"}
                className="mt-1"
                data-testid="input-discount-value"
              />
            </div>
            <div>
              <Label htmlFor="minimumPurchase">Minimum Purchase (₹)</Label>
              <Input
                id="minimumPurchase"
                type="number"
                value={createForm.minimumPurchase}
                onChange={(e) => setCreateForm({ ...createForm, minimumPurchase: e.target.value })}
                placeholder="Optional"
                className="mt-1"
                data-testid="input-min-purchase"
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
                  className="mt-1"
                  data-testid="input-max-discount"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Validity Period */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Validity Period
          </h2>
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
                <PopoverContent className="w-auto p-0" align="start">
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
                <PopoverContent className="w-auto p-0" align="start">
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

        {/* Additional Options */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Additional Options
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                value={createForm.usageLimit}
                onChange={(e) => setCreateForm({ ...createForm, usageLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
                className="mt-1"
                data-testid="input-usage-limit"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                className="mt-1"
                data-testid="input-image-url"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add an image to make your offer card more attractive (optional)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={createForm.isActive}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
                data-testid="switch-active"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Make offer active immediately
              </Label>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setViewMode('list');
              resetForm();
            }}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-submit"
          >
            {createMutation.isPending ? "Saving..." : editingOffer ? "Update Offer" : "Create Offer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
