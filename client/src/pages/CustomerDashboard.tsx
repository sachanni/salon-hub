import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BookingModal from "@/components/BookingModal";
import { 
  Calendar, 
  History, 
  User, 
  CreditCard, 
  Plus,
  Clock,
  MapPin,
  Phone,
  Mail,
  Settings,
  BookOpen,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  X,
  RotateCcw,
  Check,
  AlertTriangle,
  Receipt,
  MessageCircle,
  Filter,
  Search,
  RefreshCcw
} from "lucide-react";

// Server response types (what the backend actually returns)
interface ServerAppointment {
  id: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  staffName: string;
  bookingDate: string; // Server uses bookingDate
  bookingTime: string; // Server uses bookingTime
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  totalAmountPaisa: number; // Server uses totalAmountPaisa
  currency: string;
  notes?: string;
}

interface ServerPaymentRecord {
  id: string;
  bookingId: string; // Server uses bookingId
  salonName: string;
  serviceName: string;
  amountPaisa: number; // Server uses amountPaisa
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionDate: string; // Server uses transactionDate
  receiptUrl?: string;
}

interface ServerCustomerProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  preferences?: any;
  stats: {
    totalBookings: number;
    totalSpentPaisa: number;
    memberSince: string;
    lastBookingDate?: string;
    favoriteServices: Array<{
      serviceId: string;
      serviceName: string;
      count: number;
    }>;
    averageSpend: number;
    bookingFrequency: string;
  };
}

// Frontend types (mapped from server responses)
interface CustomerProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
}

interface Appointment {
  id: string;
  salonId: string;
  salonName: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  totalPaisa: number;
  notes?: string;
}

interface PaymentRecord {
  id: string;
  appointmentId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  date: string;
  salonName: string;
  serviceName: string;
}

interface DashboardStats {
  upcomingAppointments: number;
  totalAppointments: number;
  totalSpent: number;
  favoriteServices: Array<{
    serviceName: string;
    count: number;
  }>;
}

// Data mapping functions
const mapAppointmentData = (serverData: ServerAppointment): Appointment => ({
  id: serverData.id,
  salonId: serverData.salonId,
  salonName: serverData.salonName,
  serviceName: serverData.serviceName,
  staffName: serverData.staffName,
  date: serverData.bookingDate, // Map bookingDate to date
  time: serverData.bookingTime, // Map bookingTime to time
  duration: serverData.duration,
  status: serverData.status,
  totalPaisa: serverData.totalAmountPaisa, // Map totalAmountPaisa to totalPaisa
  notes: serverData.notes
});

const mapPaymentData = (serverData: ServerPaymentRecord): PaymentRecord => ({
  id: serverData.id,
  appointmentId: serverData.bookingId, // Map bookingId to appointmentId
  amount: serverData.amountPaisa, // Map amountPaisa to amount
  status: serverData.status,
  paymentMethod: 'Card', // Default since server doesn't return this yet
  date: serverData.transactionDate, // Map transactionDate to date
  salonName: serverData.salonName,
  serviceName: serverData.serviceName
});

const mapDashboardStats = (profile: ServerCustomerProfile): DashboardStats => ({
  upcomingAppointments: 0, // Will be calculated from upcoming appointments query
  totalAppointments: profile.stats.totalBookings,
  totalSpent: profile.stats.totalSpentPaisa,
  favoriteServices: profile.stats.favoriteServices.map(service => ({
    serviceName: service.serviceName,
    count: service.count
  }))
});

export default function CustomerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);

  // History filtering and search state
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyDateFilter, setHistoryDateFilter] = useState("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  
  // Rebooking modal state (separate from reschedule)
  const [rebookModalOpen, setRebookModalOpen] = useState(false);
  const [rebookAppointment, setRebookAppointment] = useState<{
    salonId: string;
    salonName: string;
    serviceId?: string;
    staffId?: string;
  } | null>(null);

  // Fetch customer profile with stats (replaces dashboard-stats)
  const { data: customerProfile, isLoading: profileLoading } = useQuery<ServerCustomerProfile>({
    queryKey: ['/api/customer/profile'],
    enabled: isAuthenticated,
    staleTime: 30000
  });

  // Fetch upcoming appointments using correct endpoint with status parameter
  const { data: upcomingAppointmentsData, isLoading: upcomingLoading, error: upcomingError, refetch: refetchUpcoming } = useQuery<ServerAppointment[]>({
    queryKey: ['/api/customer/appointments', { status: 'upcoming' }],
    enabled: isAuthenticated && activeTab === "upcoming",
    staleTime: 30000
  });

  // Calculate date range for filtering
  const getDateRange = (filter: string) => {
    const now = new Date();
    switch (filter) {
      case '30days': {
        const date = new Date(now);
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
      }
      case '3months': {
        const date = new Date(now);
        date.setMonth(date.getMonth() - 3);
        return date.toISOString().split('T')[0];
      }
      case '1year': {
        const date = new Date(now);
        date.setFullYear(date.getFullYear() - 1);
        return date.toISOString().split('T')[0];
      }
      default:
        return null;
    }
  };

  // Fetch appointment history with enhanced filtering - use 'all' instead of unsupported 'history'
  const { data: allHistoryData, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery<ServerAppointment[]>({
    queryKey: ['/api/customer/appointments', { 
      status: historyStatusFilter === 'all' ? 'all' : historyStatusFilter,
      dateFrom: getDateRange(historyDateFilter),
      limit: 50 // Fetch more for better filtering
    }],
    enabled: isAuthenticated && activeTab === "history",
    staleTime: 30000
  });

  // Fetch payment history (correct endpoint already exists)
  const { data: paymentHistoryData, isLoading: paymentsLoading } = useQuery<ServerPaymentRecord[]>({
    queryKey: ['/api/customer/payments'],
    enabled: isAuthenticated && activeTab === "payments",
    staleTime: 30000
  });

  // Map server data to frontend types
  const dashboardStats = customerProfile ? mapDashboardStats(customerProfile) : undefined;
  const upcomingAppointments = upcomingAppointmentsData?.map(mapAppointmentData) || [];
  const paymentHistory = paymentHistoryData?.map(mapPaymentData) || [];

  // Filter and search appointment history with memoization
  const appointmentHistory = useMemo(() => {
    if (!allHistoryData) return [];
    
    let filteredHistory = allHistoryData.map(mapAppointmentData);
    
    // Apply status filter
    if (historyStatusFilter !== 'all') {
      filteredHistory = filteredHistory.filter(app => app.status === historyStatusFilter);
    }
    
    // Apply search filter
    if (historySearchQuery.trim()) {
      const query = historySearchQuery.toLowerCase();
      filteredHistory = filteredHistory.filter(app => 
        app.salonName.toLowerCase().includes(query) || 
        app.serviceName.toLowerCase().includes(query) ||
        app.staffName.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (most recent first)
    filteredHistory.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
    
    return filteredHistory;
  }, [allHistoryData, historyStatusFilter, historySearchQuery]);
  
  // Update upcoming appointments count in stats using useEffect to avoid mutation
  useEffect(() => {
    if (dashboardStats) {
      dashboardStats.upcomingAppointments = upcomingAppointments?.length || 0;
    }
  }, [upcomingAppointments, dashboardStats]);

  const statsLoading = profileLoading;

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return apiRequest(`/api/customer/appointments/${appointmentId}`, {
        method: 'PATCH',
        body: { status: 'cancelled' }
      });
    },
    onSuccess: () => {
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ['/api/customer/appointments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const formatCurrency = (paisa: number) => {
    const rupees = paisa / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rupees);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'refunded': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Helper functions for appointment actions
  const toggleCardExpansion = (appointmentId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(appointmentId)) {
      newExpanded.delete(appointmentId);
    } else {
      newExpanded.add(appointmentId);
    }
    setExpandedCards(newExpanded);
  };

  const handleReschedule = (appointment: Appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleGetDirections = (salonName: string) => {
    const query = encodeURIComponent(salonName);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(mapsUrl, '_blank');
  };


  const handleCancelAppointment = (appointmentId: string) => {
    cancelAppointmentMutation.mutate(appointmentId);
  };

  // Enhanced action handlers for appointment history
  const handleRebook = (appointment: Appointment) => {
    setRebookAppointment({
      salonId: appointment.salonId,
      salonName: appointment.salonName,
      // TODO: Backend should provide staffId - using staffName as fallback for now
      staffId: undefined, // staffId not available in current API response
    });
    setRebookModalOpen(true);
    
    toast({
      title: "Rebooking Appointment",
      description: `Opening booking for ${appointment.serviceName} at ${appointment.salonName}`,
    });
  };

  const handleLeaveReview = (appointment: Appointment) => {
    // Placeholder for review functionality
    toast({
      title: "Leave Review",
      description: "Review functionality will be available soon. Thank you for your feedback!",
    });
  };

  const handleViewReceipt = (appointment: Appointment) => {
    // Placeholder for receipt viewing
    toast({
      title: "View Receipt", 
      description: `Receipt for ${appointment.serviceName} on ${formatDate(appointment.date)} will be available soon.`,
    });
  };

  const handleContactSalon = (appointment?: Appointment) => {
    toast({
      title: "Contact Salon",
      description: appointment 
        ? `Contact information for ${appointment.salonName} will be available soon. You can visit their profile page for more details.`
        : "Salon contact information will be available soon. You can contact them through their profile page.",
    });
  };

  // Enhanced status badge component with icons
  const getStatusBadgeContent = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <Check className="h-3 w-3" />,
          text: 'Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
      case 'cancelled':
        return {
          icon: <X className="h-3 w-3" />,
          text: 'Cancelled', 
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
      case 'no-show':
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          text: 'No-show',
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        };
      default:
        return {
          icon: null,
          text: status,
          className: getStatusColor(status)
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Access Required</CardTitle>
            <p className="text-muted-foreground">Please log in to view your dashboard</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login/customer">
              <Button className="w-full" data-testid="button-login">
                Log In
              </Button>
            </Link>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <Link href="/join/customer">
                <Button variant="ghost" className="p-0 h-auto" data-testid="link-signup">
                  Sign up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8" data-testid="header-section">
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={user?.profileImageUrl} 
                alt={`${user?.firstName || ''} ${user?.lastName || ''}`} 
              />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-welcome">
                Welcome back, {user?.firstName || 'Customer'}!
              </h1>
              <p className="text-muted-foreground">
                Manage your appointments and beauty bookings
              </p>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-950" data-testid="card-upcoming-stats">
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Upcoming
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-upcoming-count">
                        {dashboardStats?.upcomingAppointments || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950" data-testid="card-total-stats">
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-green-300 dark:bg-green-700 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Total Bookings
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="text-total-appointments">
                        {dashboardStats?.totalAppointments || 0}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-green-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950" data-testid="card-spent-stats">
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                    <div className="h-8 w-20 bg-purple-300 dark:bg-purple-700 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-total-spent">
                        {formatCurrency(dashboardStats?.totalSpent || 0)}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-pink-50 dark:bg-pink-950" data-testid="card-favorite-stats">
              <CardContent className="p-6">
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-pink-200 dark:bg-pink-800 rounded animate-pulse"></div>
                    <div className="h-8 w-24 bg-pink-300 dark:bg-pink-700 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-700 dark:text-pink-300">
                        Favorite Service
                      </p>
                      <p className="text-lg font-bold text-pink-900 dark:text-pink-100" data-testid="text-favorite-service">
                        {dashboardStats?.favoriteServices?.[0]?.serviceName || 'None yet'}
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-pink-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex" data-testid="tabs-navigation">
            <TabsTrigger value="upcoming" className="flex items-center gap-2" data-testid="tab-upcoming">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Upcoming</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2" data-testid="tab-history">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2" data-testid="tab-profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2" data-testid="tab-payments">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Appointments Tab */}
          <TabsContent value="upcoming" className="space-y-4" data-testid="content-upcoming">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Upcoming Appointments</h2>
              <Link href="/">
                <Button data-testid="button-book-appointment">
                  <Plus className="h-4 w-4 mr-2" />
                  Book New Appointment
                </Button>
              </Link>
            </div>
            
            {upcomingError ? (
              <div className="text-center py-8" data-testid="error-state-upcoming">
                <div className="mx-auto h-12 w-12 text-muted-foreground mb-4 flex items-center justify-center">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Failed to load appointments</h3>
                <p className="text-muted-foreground mb-4">There was an error loading your upcoming appointments. Please try again.</p>
                <Button onClick={() => refetchUpcoming()} variant="outline" data-testid="button-retry-upcoming">
                  Try Again
                </Button>
              </div>
            ) : upcomingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => {
                  const isExpanded = expandedCards.has(appointment.id);
                  return (
                    <Card key={appointment.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500" data-testid={`card-appointment-${appointment.id}`}>
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{appointment.serviceName}</h3>
                            <p className="text-muted-foreground text-sm font-medium">{appointment.salonName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(appointment.status)} data-testid={`badge-status-${appointment.id}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCardExpansion(appointment.id)}
                              data-testid={`button-expand-${appointment.id}`}
                              aria-label={isExpanded ? 'Collapse appointment details' : 'Expand appointment details'}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{formatDate(appointment.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Clock className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{appointment.time}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <User className="h-4 w-4 text-purple-500" />
                              <span>with <span className="font-medium">{appointment.staffName}</span></span>
                            </div>
                            {appointment.duration && (
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span><span className="font-medium">{appointment.duration}</span> minutes</span>
                              </div>
                            )}
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(appointment.totalPaisa)}</span>
                              </div>
                              {appointment.notes && (
                                <div className="space-y-1">
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</span>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                    {appointment.notes}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Appointment ID</span>
                                <p className="text-xs font-mono text-gray-500 dark:text-gray-500">{appointment.id}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-0 pb-4">
                        <div className="flex gap-2 w-full flex-wrap">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleReschedule(appointment)}
                            data-testid={`button-reschedule-${appointment.id}`}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reschedule
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                data-testid={`button-cancel-${appointment.id}`}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <X className="h-3 w-3" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel your appointment for <strong>{appointment.serviceName}</strong> at <strong>{appointment.salonName}</strong> on {formatDate(appointment.date)} at {appointment.time}?
                                  <br /><br />
                                  <span className="text-sm text-muted-foreground">
                                    Please note that cancellation policies may apply. Contact the salon if you need to reschedule instead.
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelAppointment(appointment.id)}
                                  className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                                  disabled={cancelAppointmentMutation.isPending}
                                >
                                  {cancelAppointmentMutation.isPending ? 'Cancelling...' : 'Cancel Appointment'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleGetDirections(appointment.salonName)}
                            data-testid={`button-directions-${appointment.id}`}
                            className="flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" />
                            Directions
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleContactSalon}
                            data-testid={`button-contact-${appointment.id}`}
                            className="flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            Contact
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleCardExpansion(appointment.id)}
                            data-testid={`button-details-${appointment.id}`}
                            className="flex items-center gap-1 ml-auto"
                          >
                            <Eye className="h-3 w-3" />
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="empty-state-upcoming">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-4">Book your next beauty appointment today</p>
                <Link href="/">
                  <Button data-testid="button-book-now-empty">
                    <Plus className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Comprehensive Appointment History Tab */}
          <TabsContent value="history" className="space-y-6" data-testid="content-history">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Appointment History</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" data-testid="text-history-count">
                  {appointmentHistory.length} {appointmentHistory.length === 1 ? 'appointment' : 'appointments'}
                </Badge>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar bg-card rounded-lg p-4 border" data-testid="filter-bar">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Select value={historyStatusFilter} onValueChange={setHistoryStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Appointments</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Select value={historyDateFilter} onValueChange={setHistoryDateFilter}>
                    <SelectTrigger data-testid="select-date-filter">
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="3months">Last 3 months</SelectItem>
                      <SelectItem value="1year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search salons or services..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-history"
                    />
                  </div>
                </div>

                {(historyStatusFilter !== 'all' || historyDateFilter !== 'all' || historySearchQuery) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setHistoryStatusFilter('all');
                      setHistoryDateFilter('all');
                      setHistorySearchQuery('');
                    }}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            
            {/* History Content */}
            {historyError ? (
              <Card className="text-center py-12" data-testid="error-history">
                <CardContent>
                  <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load history</h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn't load your appointment history. Please try again.
                  </p>
                  <Button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/customer/appointments'] })}
                    data-testid="button-retry-history"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : historyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="h-5 w-48 bg-muted rounded animate-pulse"></div>
                            <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                            <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
                          </div>
                          <div className="space-y-2 text-right">
                            <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
                            <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
                          <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
                          <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : appointmentHistory && appointmentHistory.length > 0 ? (
              <div className="space-y-4">
                {appointmentHistory.map((appointment) => {
                  const isExpanded = expandedCards.has(appointment.id);
                  const statusBadge = getStatusBadgeContent(appointment.status);
                  
                  return (
                    <Card 
                      key={appointment.id} 
                      className="appointment-history-card hover:shadow-md transition-shadow" 
                      data-testid={`card-history-${appointment.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg" data-testid={`text-service-${appointment.id}`}>
                              {appointment.serviceName}
                            </h3>
                            <p className="text-muted-foreground" data-testid={`text-salon-${appointment.id}`}>
                              {appointment.salonName}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-date-time-${appointment.id}`}>
                              {formatDate(appointment.date)} at {appointment.time}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge 
                              className={`${statusBadge.className} flex items-center gap-1`}
                              data-testid={`badge-status-${appointment.id}`}
                            >
                              {statusBadge.icon}
                              {statusBadge.text}
                            </Badge>
                            <p className="text-sm font-medium" data-testid={`text-price-${appointment.id}`}>
                              {formatCurrency(appointment.totalPaisa)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 pb-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1" data-testid={`text-staff-${appointment.id}`}>
                            <User className="h-4 w-4" />
                            {appointment.staffName}
                          </span>
                          <span className="flex items-center gap-1" data-testid={`text-duration-${appointment.id}`}>
                            <Clock className="h-4 w-4" />
                            {appointment.duration} min
                          </span>
                        </div>

                        {isExpanded && appointment.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-lg" data-testid={`text-notes-${appointment.id}`}>
                            <p className="text-sm">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="pt-0">
                        <div className="flex flex-wrap gap-2 w-full">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRebook(appointment)}
                            data-testid={`button-rebook-${appointment.id}`}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Rebook
                          </Button>

                          {appointment.status === 'completed' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleLeaveReview(appointment)}
                                data-testid={`button-review-${appointment.id}`}
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewReceipt(appointment)}
                                data-testid={`button-receipt-${appointment.id}`}
                              >
                                <Receipt className="h-3 w-3 mr-1" />
                                Receipt
                              </Button>
                            </>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleContactSalon(appointment)}
                            data-testid={`button-contact-${appointment.id}`}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Contact
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleCardExpansion(appointment.id)}
                            data-testid={`button-details-${appointment.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {isExpanded ? 'Hide' : 'Details'}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12" data-testid="empty-history">
                <CardContent>
                  <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {historyStatusFilter !== 'all' || historySearchQuery ? 'No matching appointments' : 'No appointment history'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {historyStatusFilter !== 'all' || historySearchQuery 
                      ? 'Try adjusting your filters or search terms.'
                      : 'Your completed appointments will appear here after your visits.'
                    }
                  </p>
                  {(historyStatusFilter !== 'all' || historySearchQuery) ? (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setHistoryStatusFilter('all');
                        setHistoryDateFilter('all');
                        setHistorySearchQuery('');
                      }}
                      data-testid="button-clear-filters-empty"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  ) : (
                    <Link href="/">
                      <Button data-testid="button-start-booking">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Your Beauty Journey
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4" data-testid="content-profile">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Profile Information</h2>
              <Button variant="outline" disabled data-testid="button-edit-profile">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-personal-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-lg" data-testid="text-profile-name">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.firstName || user?.lastName || 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-lg flex items-center gap-2" data-testid="text-profile-email">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-lg flex items-center gap-2" data-testid="text-profile-phone">
                      <Phone className="h-4 w-4" />
                      Not provided
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-preferences">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notification Settings</label>
                    <p className="text-sm text-muted-foreground">
                      Email notifications enabled
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Preferred Location</label>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Not set
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loyalty Points</label>
                    <p className="text-lg font-semibold text-primary">
                      0 points
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments" className="space-y-4" data-testid="content-payments">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Payment History</h2>
              <Button variant="outline" disabled data-testid="button-payment-methods">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Methods
              </Button>
            </div>
            
            {paymentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-4 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paymentHistory && paymentHistory.length > 0 ? (
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <Card key={payment.id} className="hover:shadow-md transition-shadow" data-testid={`card-payment-${payment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{payment.serviceName}</h3>
                            <Badge className={getStatusColor(payment.status)} data-testid={`badge-payment-status-${payment.id}`}>
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{payment.salonName}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(payment.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              {payment.paymentMethod}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12" data-testid="empty-payments">
                <CardContent>
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No payment history</h3>
                  <p className="text-muted-foreground mb-6">
                    Your payment records and receipts will appear here after appointments.
                  </p>
                  <div className="text-center">
                    <Button variant="outline" disabled data-testid="button-add-payment-method">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Reschedule Modal */}
      {rescheduleAppointment && (
        <BookingModal
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setRescheduleAppointment(null);
          }}
          salonName={rescheduleAppointment.salonName}
          salonId={rescheduleAppointment.salonId}
          staffId={rescheduleAppointment.staffId}
        />
      )}

      {/* Rebooking Modal for History Actions */}
      {rebookAppointment && (
        <BookingModal
          isOpen={rebookModalOpen}
          onClose={() => {
            setRebookModalOpen(false);
            setRebookAppointment(null);
          }}
          salonName={rebookAppointment.salonName}
          salonId={rebookAppointment.salonId}
          staffId={rebookAppointment.staffId}
        />
      )}
    </div>
  );
}