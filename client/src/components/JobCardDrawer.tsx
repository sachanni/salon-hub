import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Mail,
  Clock,
  Play,
  CheckCircle,
  Plus,
  Trash2,
  IndianRupee,
  Package,
  Scissors,
  CreditCard,
  MessageSquare,
  Timer,
  AlertCircle,
  Receipt,
  Banknote,
  Smartphone,
  Wallet,
  X,
  Printer,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

type PaymentMethodType = 'cash' | 'card' | 'upi' | 'wallet';

interface SplitPaymentEntry {
  id: string;
  method: PaymentMethodType;
  amountPaisa: number;
  transactionId?: string;
  cardLast4?: string;
  upiId?: string;
}

interface JobCardService {
  id: string;
  jobCardId: string;
  serviceId: string;
  staffId?: string;
  serviceName: string;
  serviceCategory?: string;
  originalPricePaisa: number;
  discountPaisa: number;
  finalPricePaisa: number;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  staffName?: string;
}

interface JobCardProduct {
  id: string;
  jobCardId: string;
  productId: string;
  staffId?: string;
  productName: string;
  productSku?: string;
  productCategory?: string;
  quantity: number;
  unitPricePaisa: number;
  discountPaisa: number;
  totalPricePaisa: number;
  taxAmountPaisa: number;
  notes?: string;
  staffName?: string;
}

interface JobCardPayment {
  id: string;
  paymentMethod: string;
  amountPaisa: number;
  status: string;
  transactionId?: string;
  cardLast4?: string;
  cardNetwork?: string;
  upiId?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  collectedByName?: string;
}

interface JobCardTip {
  id: string;
  staffId: string;
  amountPaisa: number;
  paymentMethod: string;
  notes?: string;
  staffName?: string;
}

interface JobCardDetails {
  id: string;
  jobCardNumber: string;
  salonId: string;
  bookingId?: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  checkInMethod: string;
  checkInAt: string;
  checkInBy?: string;
  assignedStaffId?: string;
  serviceStartAt?: string;
  serviceEndAt?: string;
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  status: 'open' | 'in_service' | 'pending_checkout' | 'completed' | 'cancelled' | 'no_show';
  subtotalPaisa: number;
  discountAmountPaisa: number;
  discountType?: string;
  discountValue?: string;
  discountReason?: string;
  taxAmountPaisa: number;
  tipAmountPaisa: number;
  totalAmountPaisa: number;
  paidAmountPaisa: number;
  balancePaisa: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  checkoutAt?: string;
  checkoutBy?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  internalNotes?: string;
  customerNotes?: string;
  isWalkIn: number;
  feedbackRequested: number;
  createdAt: string;
  updatedAt: string;
  services: JobCardService[];
  products: JobCardProduct[];
  payments: JobCardPayment[];
  tips: JobCardTip[];
  assignedStaffDetails?: { id: string; name: string; email: string; };
}

interface Service {
  id: string;
  name: string;
  category?: string;
  priceInPaisa: number;
  durationMinutes: number;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  priceInPaisa: number;
  sellingPriceInPaisa?: number;
}

interface Staff {
  id: string;
  name: string;
  email: string;
}

interface JobCardDrawerProps {
  salonId: string;
  jobCardId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JobCardDrawer({ salonId, jobCardId, open, onOpenChange }: JobCardDrawerProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const [splitPayments, setSplitPayments] = useState<SplitPaymentEntry[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethodType>('cash');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>("");
  const [currentTransactionId, setCurrentTransactionId] = useState<string>("");
  const [currentCardLast4, setCurrentCardLast4] = useState<string>("");
  const [currentUpiId, setCurrentUpiId] = useState<string>("");
  const [isProcessingPayments, setIsProcessingPayments] = useState(false);
  const [completedReceiptNumber, setCompletedReceiptNumber] = useState<string | null>(null);

  const { data: jobCard, isLoading: jobCardLoading, refetch: refetchJobCard } = useQuery<JobCardDetails>({
    queryKey: ['/api/salons', salonId, 'job-cards', jobCardId],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch job card');
      }
      return response.json();
    },
    enabled: !!salonId && !!jobCardId && isAuthenticated && open,
    refetchInterval: open ? 10000 : false,
  });

  const { data: availableServices = [] } = useQuery<Service[]>({
    queryKey: ['/api/salons', salonId, 'services'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/services`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !!salonId && isAuthenticated && addServiceDialogOpen,
  });

  const { data: availableProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/salons', salonId, 'products'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/products`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      return data.products || data;
    },
    enabled: !!salonId && isAuthenticated && addProductDialogOpen,
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['/api/salons', salonId, 'staff'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/staff`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      return response.json();
    },
    enabled: !!salonId && isAuthenticated,
  });

  const addServiceMutation = useMutation({
    mutationFn: async ({ serviceId, staffId }: { serviceId: string; staffId?: string }) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ serviceId, staffId }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to add service';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      refetchJobCard();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      toast({ title: "Service Added", description: "Service has been added to the job card" });
      setAddServiceDialogOpen(false);
      setSelectedServiceId("");
      setSelectedStaffId("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: async (serviceItemId: string) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/services/${serviceItemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        let errorMessage = 'Failed to remove service';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      refetchJobCard();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      toast({ title: "Service Removed", description: "Service has been removed from the job card" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async ({ productId, staffId, quantity }: { productId: string; staffId?: string; quantity: number }) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ productId, staffId, quantity }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to add product';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      refetchJobCard();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      toast({ title: "Product Added", description: "Product has been added to the job card" });
      setAddProductDialogOpen(false);
      setSelectedProductId("");
      setSelectedStaffId("");
      setProductQuantity(1);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productItemId: string) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/products/${productItemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        let errorMessage = 'Failed to remove product';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      refetchJobCard();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      toast({ title: "Product Removed", description: "Product has been removed from the job card" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes?: string }) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to update status';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      refetchJobCard();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      const statusLabels: Record<string, string> = {
        'open': 'Arrived',
        'in_service': 'In Service',
        'pending_checkout': 'Ready for Checkout',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
      };
      toast({ title: "Status Updated", description: `Job card is now ${statusLabels[variables.status] || variables.status}` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateServiceStatusMutation = useMutation({
    mutationFn: async ({ serviceItemId, status }: { serviceItemId: string; status: string }) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/services/${serviceItemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to update service status';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      refetchJobCard();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      toast({ title: "Service Updated", description: "Service status has been updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (payment: {
      paymentMethod: string;
      amountPaisa: number;
      transactionId?: string;
      cardLast4?: string;
      upiId?: string;
    }) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payment),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to process payment';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
  });

  const completeJobCardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to complete job card';
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: (data) => {
      refetchJobCard();
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      setCompletedReceiptNumber(data.receiptNumber);
      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);
      toast({ title: "Payment Complete", description: `Receipt: ${data.receiptNumber}` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (paymentDialogOpen && jobCard) {
      setSplitPayments([]);
      setCurrentPaymentMethod('cash');
      setCurrentPaymentAmount("");
      setCurrentTransactionId("");
      setCurrentCardLast4("");
      setCurrentUpiId("");
    }
  }, [paymentDialogOpen, jobCard]);

  const addSplitPayment = () => {
    const amountPaisa = Math.round(parseFloat(currentPaymentAmount || "0") * 100);
    if (amountPaisa <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    if (currentPaymentMethod === 'card' && !currentCardLast4) {
      toast({ title: "Error", description: "Please enter last 4 digits of card", variant: "destructive" });
      return;
    }

    if (currentPaymentMethod === 'upi' && !currentUpiId) {
      toast({ title: "Error", description: "Please enter UPI ID", variant: "destructive" });
      return;
    }

    const newEntry: SplitPaymentEntry = {
      id: Date.now().toString(),
      method: currentPaymentMethod,
      amountPaisa,
      transactionId: currentTransactionId || undefined,
      cardLast4: currentCardLast4 || undefined,
      upiId: currentUpiId || undefined,
    };

    setSplitPayments([...splitPayments, newEntry]);
    setCurrentPaymentAmount("");
    setCurrentTransactionId("");
    setCurrentCardLast4("");
    setCurrentUpiId("");
  };

  const removeSplitPayment = (id: string) => {
    setSplitPayments(splitPayments.filter(p => p.id !== id));
  };

  const getTotalSplitPayments = () => {
    return splitPayments.reduce((sum, p) => sum + p.amountPaisa, 0);
  };

  const processAllPayments = async () => {
    if (!jobCard) return;
    
    const totalToPay = jobCard.balancePaisa;
    const totalSplit = getTotalSplitPayments();
    
    if (totalSplit !== totalToPay) {
      toast({ 
        title: "Amount Mismatch", 
        description: `Total payments (₹${(totalSplit / 100).toFixed(2)}) must equal balance due (₹${(totalToPay / 100).toFixed(2)})`,
        variant: "destructive" 
      });
      return;
    }

    setIsProcessingPayments(true);
    
    try {
      for (const payment of splitPayments) {
        await processPaymentMutation.mutateAsync({
          paymentMethod: payment.method,
          amountPaisa: payment.amountPaisa,
          transactionId: payment.transactionId,
          cardLast4: payment.cardLast4,
          upiId: payment.upiId,
        });
      }
      
      await refetchJobCard();
      
      await completeJobCardMutation.mutateAsync();
      
    } catch (error: any) {
      toast({ title: "Payment Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingPayments(false);
    }
  };

  const payFullAmountWithMethod = async (method: PaymentMethodType) => {
    if (!jobCard) return;
    
    setSplitPayments([{
      id: Date.now().toString(),
      method,
      amountPaisa: jobCard.balancePaisa,
    }]);
  };

  const getPaymentMethodIcon = (method: PaymentMethodType) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'upi': return <Smartphone className="h-4 w-4" />;
      case 'wallet': return <Wallet className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethodType) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'card': return 'Card';
      case 'upi': return 'UPI';
      case 'wallet': return 'Wallet';
    }
  };

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_service': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_checkout': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Arrived';
      case 'in_service': return 'In Service';
      case 'pending_checkout': return 'Ready for Checkout';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700 line-through';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveNotes = async () => {
    if (!jobCard || !notes.trim()) return;
    setIsSavingNotes(true);
    try {
      await updateStatusMutation.mutateAsync({ status: jobCard.status, notes: notes.trim() });
      setNotes("");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const isJobCardEditable = jobCard && !['completed', 'cancelled'].includes(jobCard.status);
  const canStartService = jobCard?.status === 'open';
  const canMarkReady = jobCard?.status === 'in_service';

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
        {jobCardLoading || !jobCard ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading job card...</div>
          </div>
        ) : (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-mono text-lg">{jobCard.jobCardNumber}</SheetTitle>
                <Badge className={getStatusColor(jobCard.status)}>
                  {getStatusLabel(jobCard.status)}
                </Badge>
              </div>
              <SheetDescription className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{jobCard.customerName}</span>
                  {jobCard.isWalkIn === 1 && (
                    <Badge variant="outline" className="text-xs">Walk-in</Badge>
                  )}
                </div>
                {jobCard.customerPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    <span>{jobCard.customerPhone}</span>
                  </div>
                )}
                {jobCard.customerEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3" />
                    <span>{jobCard.customerEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Checked in {formatDistanceToNow(new Date(jobCard.checkInAt), { addSuffix: true })}</span>
                </div>
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pb-4">
                <Card>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scissors className="h-4 w-4" />
                        Services
                      </CardTitle>
                      {isJobCardEditable && (
                        <Dialog open={addServiceDialogOpen} onOpenChange={setAddServiceDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7">
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Service</DialogTitle>
                              <DialogDescription>
                                Select a service to add to this job card
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Service</Label>
                                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a service" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableServices.map((service) => (
                                      <SelectItem key={service.id} value={service.id}>
                                        <div className="flex justify-between items-center w-full">
                                          <span>{service.name}</span>
                                          <span className="text-muted-foreground ml-2">
                                            {formatAmount(service.priceInPaisa)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Assign Staff (Optional)</Label>
                                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select staff member" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {staffList.map((staff) => (
                                      <SelectItem key={staff.id} value={staff.id}>
                                        {staff.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => addServiceMutation.mutate({ 
                                  serviceId: selectedServiceId, 
                                  staffId: selectedStaffId || undefined 
                                })}
                                disabled={!selectedServiceId || addServiceMutation.isPending}
                              >
                                {addServiceMutation.isPending ? "Adding..." : "Add Service"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    {jobCard.services.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No services added</p>
                    ) : (
                      <div className="space-y-2">
                        {jobCard.services.filter(s => s.status !== 'cancelled').map((service) => (
                          <div key={service.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{service.serviceName}</span>
                                <Badge variant="secondary" className={`text-xs ${getServiceStatusColor(service.status)}`}>
                                  {service.status === 'in_progress' ? 'In Progress' : 
                                   service.status === 'completed' ? 'Done' : 
                                   service.status === 'pending' ? 'Pending' : service.status}
                                </Badge>
                              </div>
                              {service.staffName && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <User className="h-3 w-3" />
                                  {service.staffName}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{formatAmount(service.finalPricePaisa)}</span>
                              {isJobCardEditable && service.status === 'pending' && (
                                <>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7"
                                    onClick={() => updateServiceStatusMutation.mutate({ 
                                      serviceItemId: service.id, 
                                      status: 'in_progress' 
                                    })}
                                    disabled={updateServiceStatusMutation.isPending}
                                  >
                                    <Play className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => removeServiceMutation.mutate(service.id)}
                                    disabled={removeServiceMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {isJobCardEditable && service.status === 'in_progress' && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-green-600"
                                  onClick={() => updateServiceStatusMutation.mutate({ 
                                    serviceItemId: service.id, 
                                    status: 'completed' 
                                  })}
                                  disabled={updateServiceStatusMutation.isPending}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Products
                      </CardTitle>
                      {isJobCardEditable && (
                        <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7">
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Product</DialogTitle>
                              <DialogDescription>
                                Select a product to add to this job card
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Product</Label>
                                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableProducts.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        <div className="flex justify-between items-center w-full">
                                          <span>{product.name}</span>
                                          <span className="text-muted-foreground ml-2">
                                            {formatAmount(product.sellingPriceInPaisa || product.priceInPaisa)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={productQuantity}
                                  onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Sold By (Optional)</Label>
                                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select staff member" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {staffList.map((staff) => (
                                      <SelectItem key={staff.id} value={staff.id}>
                                        {staff.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => addProductMutation.mutate({ 
                                  productId: selectedProductId, 
                                  staffId: selectedStaffId || undefined,
                                  quantity: productQuantity
                                })}
                                disabled={!selectedProductId || addProductMutation.isPending}
                              >
                                {addProductMutation.isPending ? "Adding..." : "Add Product"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    {jobCard.products.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No products added</p>
                    ) : (
                      <div className="space-y-2">
                        {jobCard.products.map((product) => (
                          <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{product.productName}</span>
                                <Badge variant="outline" className="text-xs">x{product.quantity}</Badge>
                              </div>
                              {product.staffName && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <User className="h-3 w-3" />
                                  {product.staffName}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{formatAmount(product.totalPricePaisa)}</span>
                              {isJobCardEditable && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => removeProductMutation.mutate(product.id)}
                                  disabled={removeProductMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    {jobCard.internalNotes && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Previous Notes</p>
                        <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {jobCard.internalNotes}
                        </div>
                      </div>
                    )}
                    {isJobCardEditable && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Type a new note to add..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleSaveNotes}
                          disabled={!notes.trim() || isSavingNotes}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {isSavingNotes ? "Adding..." : "Add Note"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Bill Summary
                      </CardTitle>
                      <Badge className={getPaymentStatusColor(jobCard.paymentStatus)}>
                        {jobCard.paymentStatus === 'unpaid' ? 'Unpaid' :
                         jobCard.paymentStatus === 'partial' ? 'Partial' :
                         jobCard.paymentStatus === 'paid' ? 'Paid' : jobCard.paymentStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatAmount(jobCard.subtotalPaisa)}</span>
                      </div>
                      {jobCard.discountAmountPaisa > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount {jobCard.discountType === 'percentage' ? `(${jobCard.discountValue}%)` : ''}</span>
                          <span>-{formatAmount(jobCard.discountAmountPaisa)}</span>
                        </div>
                      )}
                      {jobCard.taxAmountPaisa > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tax (GST)</span>
                          <span>{formatAmount(jobCard.taxAmountPaisa)}</span>
                        </div>
                      )}
                      {jobCard.tipAmountPaisa > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Tips</span>
                          <span>{formatAmount(jobCard.tipAmountPaisa)}</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold text-base">
                        <span>Total</span>
                        <span className="flex items-center">
                          <IndianRupee className="h-4 w-4" />
                          {(jobCard.totalAmountPaisa / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {jobCard.paidAmountPaisa > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Paid</span>
                          <span>{formatAmount(jobCard.paidAmountPaisa)}</span>
                        </div>
                      )}
                      {jobCard.balancePaisa > 0 && (
                        <div className="flex justify-between text-orange-600 font-medium">
                          <span>Balance Due</span>
                          <span>{formatAmount(jobCard.balancePaisa)}</span>
                        </div>
                      )}
                    </div>

                    {jobCard.payments.length > 0 && (
                      <div className="mt-4 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Payment History</p>
                        <div className="space-y-1">
                          {jobCard.payments.map((payment) => (
                            <div key={payment.id} className="flex justify-between text-xs">
                              <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                              <span>{formatAmount(payment.amountPaisa)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <Separator />

            <div className="pt-4 space-y-2">
              {canStartService && (
                <Button 
                  className="w-full"
                  onClick={() => updateStatusMutation.mutate({ status: 'in_service' })}
                  disabled={updateStatusMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Service
                </Button>
              )}
              
              {canMarkReady && (
                <Button 
                  className="w-full"
                  variant="default"
                  onClick={() => updateStatusMutation.mutate({ status: 'pending_checkout' })}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ready for Checkout
                </Button>
              )}
              
              {jobCard.status === 'pending_checkout' && jobCard.balancePaisa > 0 && (
                <Button 
                  className="w-full"
                  variant="default"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment ({formatAmount(jobCard.balancePaisa)})
                </Button>
              )}

              {jobCard.status === 'pending_checkout' && jobCard.balancePaisa === 0 && (
                <Button 
                  className="w-full"
                  variant="default"
                  onClick={() => completeJobCardMutation.mutate()}
                  disabled={completeJobCardMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {completeJobCardMutation.isPending ? "Completing..." : "Complete & Generate Receipt"}
                </Button>
              )}

              {jobCard.status === 'completed' && jobCard.receiptNumber && (
                <div className="text-center py-2">
                  <Badge variant="outline" className="text-xs">
                    Receipt: {jobCard.receiptNumber}
                  </Badge>
                </div>
              )}
            </div>

            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Process Payment
                  </DialogTitle>
                  <DialogDescription>
                    Balance Due: <span className="font-bold text-lg text-foreground">{formatAmount(jobCard.balancePaisa)}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 gap-2">
                    {(['cash', 'card', 'upi', 'wallet'] as PaymentMethodType[]).map((method) => (
                      <Button
                        key={method}
                        variant="outline"
                        size="sm"
                        className={`flex flex-col h-16 gap-1 ${splitPayments.length === 1 && splitPayments[0].method === method ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => payFullAmountWithMethod(method)}
                      >
                        {getPaymentMethodIcon(method)}
                        <span className="text-xs">{getPaymentMethodLabel(method)}</span>
                      </Button>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Split Payment</p>
                    
                    <div className="flex gap-2">
                      <Select value={currentPaymentMethod} onValueChange={(v) => setCurrentPaymentMethod(v as PaymentMethodType)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="wallet">Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={currentPaymentAmount}
                        onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="icon" onClick={addSplitPayment}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {currentPaymentMethod === 'card' && (
                      <Input
                        placeholder="Last 4 digits of card"
                        maxLength={4}
                        value={currentCardLast4}
                        onChange={(e) => setCurrentCardLast4(e.target.value.replace(/\D/g, ''))}
                      />
                    )}

                    {currentPaymentMethod === 'upi' && (
                      <Input
                        placeholder="UPI ID (e.g., name@upi)"
                        value={currentUpiId}
                        onChange={(e) => setCurrentUpiId(e.target.value)}
                      />
                    )}

                    {(currentPaymentMethod === 'card' || currentPaymentMethod === 'upi') && (
                      <Input
                        placeholder="Transaction ID (optional)"
                        value={currentTransactionId}
                        onChange={(e) => setCurrentTransactionId(e.target.value)}
                      />
                    )}
                  </div>

                  {splitPayments.length > 0 && (
                    <div className="space-y-2 bg-muted p-3 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground">Payment Entries</p>
                      {splitPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.method)}
                            <span className="text-sm capitalize">{payment.method}</span>
                            {payment.cardLast4 && <span className="text-xs text-muted-foreground">****{payment.cardLast4}</span>}
                            {payment.upiId && <span className="text-xs text-muted-foreground">{payment.upiId}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatAmount(payment.amountPaisa)}</span>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6"
                              onClick={() => removeSplitPayment(payment.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className={getTotalSplitPayments() === jobCard.balancePaisa ? 'text-green-600' : 'text-orange-600'}>
                          {formatAmount(getTotalSplitPayments())}
                        </span>
                      </div>
                      {getTotalSplitPayments() !== jobCard.balancePaisa && (
                        <p className="text-xs text-orange-600">
                          {getTotalSplitPayments() < jobCard.balancePaisa 
                            ? `Remaining: ${formatAmount(jobCard.balancePaisa - getTotalSplitPayments())}`
                            : `Overpayment: ${formatAmount(getTotalSplitPayments() - jobCard.balancePaisa)}`
                          }
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={processAllPayments}
                    disabled={splitPayments.length === 0 || getTotalSplitPayments() !== jobCard.balancePaisa || isProcessingPayments}
                  >
                    {isProcessingPayments ? "Processing..." : "Complete Payment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    Payment Successful
                  </DialogTitle>
                </DialogHeader>
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Receipt Number</p>
                    <p className="text-2xl font-mono font-bold">{completedReceiptNumber || jobCard.receiptNumber}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{jobCard.customerName}</p>
                    <p>Total Paid: {formatAmount(jobCard.totalAmountPaisa)}</p>
                  </div>
                </div>
                <DialogFooter className="sm:justify-center gap-2">
                  <Button variant="outline" onClick={() => {
                    setReceiptDialogOpen(false);
                    onOpenChange(false);
                  }}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    window.print();
                  }}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
