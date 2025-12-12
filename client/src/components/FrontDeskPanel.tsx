import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardList, 
  UserCheck, 
  CreditCard, 
  Clock, 
  Phone, 
  User, 
  Search, 
  Play,
  CheckCircle,
  AlertCircle,
  Timer,
  IndianRupee,
  UserPlus,
  MessageCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { formatDistanceToNow, format, isToday, parseISO } from "date-fns";
import WalkInDialog from "./WalkInDialog";
import { ChatDock } from "./chat/ChatDock";

interface JobCard {
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
  discountValue?: number;
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
  isWalkIn: boolean;
  feedbackRequested: boolean;
  createdAt: string;
  updatedAt: string;
  services?: JobCardService[];
  products?: JobCardProduct[];
}

interface JobCardService {
  id: string;
  serviceName: string;
  staffId?: string;
  originalPricePaisa: number;
  finalPricePaisa: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimatedDurationMinutes?: number;
}

interface JobCardProduct {
  id: string;
  productName: string;
  quantity: number;
  unitPricePaisa: number;
  totalPricePaisa: number;
}

interface Booking {
  id: string;
  salonId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  staffId?: string;
  staffName?: string;
  serviceId?: string;
  serviceName?: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  totalPrice?: number;
  notes?: string;
  createdAt: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ChatConversation {
  id: string;
  salonId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  staffUnreadCount: number;
  lastMessageAt?: string;
  status: string;
}

interface FrontDeskPanelProps {
  salonId: string;
  onOpenJobCard?: (jobCardId: string) => void;
}

export default function FrontDeskPanel({ salonId, onOpenJobCard }: FrontDeskPanelProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);

  const { data: jobCards = [], isLoading: jobCardsLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'job-cards', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/salons/${salonId}/job-cards?date=${today}&include=services,products`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch job cards');
      }
      const data = await response.json();
      return data.jobCards || [];
    },
    enabled: !!salonId && isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: bookingsData = { bookings: [] }, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'bookings', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/salons/${salonId}/bookings?startDate=${today}&endDate=${today}&status=confirmed`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      return { bookings: Array.isArray(data) ? data : (data.bookings || []) };
    },
    enabled: !!salonId && isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/staff`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      return response.json() as Promise<Staff[]>;
    },
    enabled: !!salonId && isAuthenticated
  });

  const { data: chatConversations = [] } = useQuery({
    queryKey: ['/api/chat/conversations', salonId, 'frontdesk'],
    queryFn: async () => {
      const response = await fetch(`/api/chat/conversations?role=staff&salonId=${salonId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        console.error('Failed to fetch chat conversations for indicators:', response.status);
        return [];
      }
      const data = await response.json();
      return (data.conversations || []) as ChatConversation[];
    },
    enabled: !!salonId && isAuthenticated,
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
  });

  const getCustomerChatInfo = (customerId?: string, customerPhone?: string) => {
    if (!customerId && !customerPhone) return null;
    
    let conversation = null;
    
    if (customerId) {
      conversation = chatConversations.find(c => c.customerId === customerId);
    }
    
    if (!conversation && customerPhone) {
      const normalizedPhone = customerPhone.replace(/\D/g, '').slice(-10);
      conversation = chatConversations.find(c => {
        const convPhone = c.customerPhone?.replace(/\D/g, '').slice(-10);
        return convPhone && convPhone === normalizedPhone;
      });
    }
    
    if (!conversation) return null;
    return {
      hasConversation: true,
      unreadCount: conversation.staffUnreadCount,
      conversationId: conversation.id
    };
  };

  const checkInMutation = useMutation({
    mutationFn: async ({ bookingId, customerName, customerPhone, isWalkIn = false }: { 
      bookingId?: string; 
      customerName?: string;
      customerPhone?: string;
      isWalkIn?: boolean;
    }) => {
      const response = await fetch(`/api/salons/${salonId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          bookingId, 
          customerName, 
          customerPhone,
          checkInMethod: isWalkIn ? 'walk_in' : 'manual'
        }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to check in';
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
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      // Invalidate all client profile queries (list and detail)
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients'], exact: false });
      toast({
        title: "Checked In",
        description: `Job card ${data.jobCard.jobCardNumber} created successfully`
      });
      if (onOpenJobCard && data.jobCard?.id) {
        onOpenJobCard(data.jobCard.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const startServiceMutation = useMutation({
    mutationFn: async (jobCardId: string) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'in_service' }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to start service';
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
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      toast({
        title: "Service Started",
        description: "Job card status updated to In Service"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const readyForCheckoutMutation = useMutation({
    mutationFn: async (jobCardId: string) => {
      const response = await fetch(`/api/salons/${salonId}/job-cards/${jobCardId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'pending_checkout' }),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      toast({
        title: "Ready for Checkout",
        description: "Customer is ready for payment"
      });
      setActiveTab("checkout");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getStaffName = (staffId?: string) => {
    if (!staffId) return "Unassigned";
    const staffMember = staff.find(s => s.id === staffId);
    return staffMember?.name || "Unknown";
  };

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return format(date, 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_service': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_checkout': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Arrived';
      case 'in_service': return 'In Service';
      case 'pending_checkout': return 'Checkout';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  const getDurationDisplay = (jobCard: JobCard) => {
    if (!jobCard.checkInAt) return null;
    const checkInTime = new Date(jobCard.checkInAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / 60000);
    const estimated = jobCard.estimatedDurationMinutes || 60;
    const isOvertime = elapsedMinutes > estimated;
    return (
      <span className={isOvertime ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
        {elapsedMinutes}m / {estimated}m
      </span>
    );
  };

  const bookings: Booking[] = bookingsData.bookings || [];
  
  const pendingCheckInBookings = bookings.filter((booking: Booking) => {
    const hasJobCard = jobCards.some((jc: JobCard) => jc.bookingId === booking.id);
    return !hasJobCard && booking.status === 'confirmed';
  });

  const activeJobCards = jobCards.filter((jc: JobCard) => 
    jc.status === 'open' || jc.status === 'in_service'
  );

  const checkoutJobCards = jobCards.filter((jc: JobCard) => 
    jc.status === 'pending_checkout'
  );

  const filteredBookings = pendingCheckInBookings.filter((booking: Booking) =>
    booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customerPhone?.includes(searchQuery)
  );

  if (jobCardsLoading && bookingsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading front desk...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="h-5 w-5" />
          Front Desk
        </CardTitle>
        <CardDescription>
          Manage check-ins, active visits, and checkouts
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="active" className="flex items-center gap-1.5" data-testid="tab-active-jobs">
              <Timer className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
              {activeJobCards.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeJobCards.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-1.5" data-testid="tab-checkin">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Check-in</span>
              {pendingCheckInBookings.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {pendingCheckInBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex items-center gap-1.5" data-testid="tab-checkout">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Checkout</span>
              {checkoutJobCards.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                  {checkoutJobCards.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-0 p-4">
            <ScrollArea className="h-[400px]">
              {activeJobCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Timer className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">No active visits</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check in a customer to start
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeJobCards.map((jobCard: JobCard) => (
                    <Card 
                      key={jobCard.id} 
                      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => onOpenJobCard?.(jobCard.id)}
                      data-testid={`job-card-${jobCard.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              {jobCard.jobCardNumber}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(jobCard.status)}`}>
                              {getStatusLabel(jobCard.status)}
                            </Badge>
                            {jobCard.isWalkIn && (
                              <Badge variant="outline" className="text-xs">Walk-in</Badge>
                            )}
                            {(() => {
                              const chatInfo = getCustomerChatInfo(jobCard.customerId, jobCard.customerPhone);
                              if (chatInfo) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="relative cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <MessageCircle className={`h-4 w-4 ${chatInfo.unreadCount > 0 ? 'text-violet-600' : 'text-muted-foreground'}`} />
                                        {chatInfo.unreadCount > 0 && (
                                          <span className="absolute -top-1.5 -right-1.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                                            {chatInfo.unreadCount > 9 ? '9+' : chatInfo.unreadCount}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{chatInfo.unreadCount > 0 ? `${chatInfo.unreadCount} unread message(s)` : 'Has chat conversation'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <p className="font-medium truncate">{jobCard.customerName}</p>
                          {jobCard.customerPhone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {jobCard.customerPhone}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <User className="h-3 w-3" />
                              {getStaffName(jobCard.assignedStaffId)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getDurationDisplay(jobCard)}
                            </span>
                          </div>
                          {jobCard.services && jobCard.services.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {jobCard.services.slice(0, 3).map((service: JobCardService) => (
                                <Badge key={service.id} variant="outline" className="text-xs">
                                  {service.serviceName}
                                </Badge>
                              ))}
                              {jobCard.services.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{jobCard.services.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {jobCard.status === 'open' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                startServiceMutation.mutate(jobCard.id);
                              }}
                              disabled={startServiceMutation.isPending}
                              data-testid={`btn-start-service-${jobCard.id}`}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {jobCard.status === 'in_service' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                readyForCheckoutMutation.mutate(jobCard.id);
                              }}
                              disabled={readyForCheckoutMutation.isPending}
                              data-testid={`btn-checkout-${jobCard.id}`}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="checkin" className="mt-0 p-4">
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="search-checkin"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setWalkInDialogOpen(true)}
                data-testid="btn-walk-in"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Walk-in
              </Button>
            </div>
            
            <ScrollArea className="h-[350px]">
              {filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">No pending check-ins</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ? "No bookings match your search" : "All confirmed bookings have been checked in"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((booking: Booking) => (
                    <Card key={booking.id} className="p-3" data-testid={`booking-${booking.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {booking.bookingTime ? formatTime(`2000-01-01T${booking.bookingTime}`) : 'No time'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Confirmed
                            </Badge>
                            {(() => {
                              const chatInfo = getCustomerChatInfo(booking.customerId, booking.customerPhone);
                              if (chatInfo) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="relative cursor-pointer">
                                        <MessageCircle className={`h-4 w-4 ${chatInfo.unreadCount > 0 ? 'text-violet-600' : 'text-muted-foreground'}`} />
                                        {chatInfo.unreadCount > 0 && (
                                          <span className="absolute -top-1.5 -right-1.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                                            {chatInfo.unreadCount > 9 ? '9+' : chatInfo.unreadCount}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{chatInfo.unreadCount > 0 ? `${chatInfo.unreadCount} unread message(s)` : 'Has chat conversation'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <p className="font-medium truncate">{booking.customerName}</p>
                          {booking.customerPhone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.customerPhone}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            {booking.serviceName && (
                              <span>{booking.serviceName}</span>
                            )}
                            {booking.staffName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {booking.staffName}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => checkInMutation.mutate({ 
                            bookingId: booking.id,
                            customerName: booking.customerName,
                            customerPhone: booking.customerPhone,
                          })}
                          disabled={checkInMutation.isPending}
                          data-testid={`btn-checkin-${booking.id}`}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Check In
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="checkout" className="mt-0 p-4">
            <ScrollArea className="h-[400px]">
              {checkoutJobCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground font-medium">No pending checkouts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customers ready for payment will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkoutJobCards.map((jobCard: JobCard) => (
                    <Card 
                      key={jobCard.id} 
                      className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-orange-200"
                      onClick={() => onOpenJobCard?.(jobCard.id)}
                      data-testid={`checkout-card-${jobCard.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              {jobCard.jobCardNumber}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(jobCard.status)}`}>
                              Ready to Pay
                            </Badge>
                            {(() => {
                              const chatInfo = getCustomerChatInfo(jobCard.customerId, jobCard.customerPhone);
                              if (chatInfo) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="relative cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                        <MessageCircle className={`h-4 w-4 ${chatInfo.unreadCount > 0 ? 'text-violet-600' : 'text-muted-foreground'}`} />
                                        {chatInfo.unreadCount > 0 && (
                                          <span className="absolute -top-1.5 -right-1.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                                            {chatInfo.unreadCount > 9 ? '9+' : chatInfo.unreadCount}
                                          </span>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{chatInfo.unreadCount > 0 ? `${chatInfo.unreadCount} unread message(s)` : 'Has chat conversation'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <p className="font-medium truncate">{jobCard.customerName}</p>
                          {jobCard.customerPhone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {jobCard.customerPhone}
                            </p>
                          )}
                          
                          <Separator className="my-2" />
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>{formatAmount(jobCard.subtotalPaisa)}</span>
                            </div>
                            {jobCard.discountAmountPaisa > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>-{formatAmount(jobCard.discountAmountPaisa)}</span>
                              </div>
                            )}
                            {jobCard.taxAmountPaisa > 0 && (
                              <div className="flex justify-between text-muted-foreground">
                                <span>Tax (GST)</span>
                                <span>{formatAmount(jobCard.taxAmountPaisa)}</span>
                              </div>
                            )}
                            <Separator className="my-1" />
                            <div className="flex justify-between font-semibold text-base">
                              <span>Total</span>
                              <span className="flex items-center">
                                <IndianRupee className="h-4 w-4" />
                                {(jobCard.totalAmountPaisa / 100).toLocaleString('en-IN')}
                              </span>
                            </div>
                            {jobCard.paidAmountPaisa > 0 && jobCard.balancePaisa > 0 && (
                              <div className="flex justify-between text-orange-600">
                                <span>Balance Due</span>
                                <span>{formatAmount(jobCard.balancePaisa)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenJobCard?.(jobCard.id);
                          }}
                          data-testid={`btn-pay-${jobCard.id}`}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      <WalkInDialog
        salonId={salonId}
        open={walkInDialogOpen}
        onOpenChange={setWalkInDialogOpen}
        onSuccess={(jobCardId) => {
          onOpenJobCard?.(jobCardId);
        }}
      />

      <ChatDock salonId={salonId} />
    </Card>
    </TooltipProvider>
  );
}
