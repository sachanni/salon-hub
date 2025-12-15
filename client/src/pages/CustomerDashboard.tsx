import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { profileUpdateSchema, preferencesSchema } from "@shared/schema";
import { format } from "date-fns";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAccessToken } from "@/lib/auth";
import BookingModal from "@/components/BookingModal";
import { RescheduleModal } from "@/components/RescheduleModal";
import { LateArrivalButton } from "@/components/customer/LateArrivalButton";
import MyBeautyProfile from "@/components/customer/MyBeautyProfile";
import CustomerMemberships from "@/components/customer/CustomerMemberships";
import { CustomerChatModal } from "@/components/customer/CustomerChatModal";
import { 
  Calendar, 
  History, 
  User, 
  CreditCard, 
  Crown,
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
  RefreshCcw,
  Edit,
  Save,
  X as Cancel,
  Heart,
  Users,
  Shield,
  Bell,
  Smartphone,
  MessageSquare,
  CheckCircle,
  Sun,
  Moon,
  Monitor
} from "lucide-react";

// Server response types (what the backend actually returns)
interface ServerAppointment {
  id: string;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
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
  salonId?: string; // Add salonId from server
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
  serviceId: string;
  serviceName: string;
  staffId: string;
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
  salonId: string; // Add salonId for proper rebooking
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  date: string;
  salonName: string;
  serviceName: string;
  transactionId: string;
  receiptUrl?: string;
  currency: string;
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
  serviceId: serverData.serviceId,
  serviceName: serverData.serviceName,
  staffId: serverData.staffId || '',
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
  salonId: serverData.salonId || '', // Add salonId mapping
  amount: serverData.amountPaisa, // Keep in paisa for consistent currency handling
  status: serverData.status,
  paymentMethod: 'Card', // Default since server doesn't return this yet
  date: serverData.transactionDate, // Map transactionDate to date
  salonName: serverData.salonName,
  serviceName: serverData.serviceName,
  transactionId: serverData.id,
  receiptUrl: serverData.receiptUrl,
  currency: serverData.currency || 'INR'
});

const mapDashboardStats = (profile: ServerCustomerProfile): DashboardStats => ({
  upcomingAppointments: 0, // Will be calculated from upcoming appointments query
  totalAppointments: profile.stats.totalBookings || 0,
  totalSpent: Math.floor((profile.stats.totalSpentPaisa || 0) / 100), // CRITICAL FIX: Convert paisa to rupees
  favoriteServices: (profile.stats.favoriteServices || []).map(service => ({
    serviceName: service.serviceName,
    count: service.count
  }))
});

// Use shared schemas from @shared/schema for consistency
type ProfileFormData = z.infer<typeof profileUpdateSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function CustomerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);

  // Profile management state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [preferencesData, setPreferencesData] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingComms: false,
    preferredTimes: [] as string[],
    preferredDays: [] as string[],
    preferredCommunicationMethod: 'email' as 'email' | 'sms' | 'both'
  });

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  // Chat modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatSalonInfo, setChatSalonInfo] = useState<{
    salonId: string;
    salonName: string;
    bookingContext?: {
      bookingId: string;
      serviceName: string;
      bookingDate: string;
    };
  } | null>(null);

  // Payment filtering and search state
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState("all");
  const [paymentsDateFilter, setPaymentsDateFilter] = useState("all");
  const [paymentsAmountFilter, setPaymentsAmountFilter] = useState("all");
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState("");
  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [currentPaymentsPage, setCurrentPaymentsPage] = useState(0);

  // Fetch customer profile with stats (replaces dashboard-stats)
  const { data: customerProfile, isLoading: profileLoading } = useQuery<ServerCustomerProfile>({
    queryKey: ['/api/customer/profile'],
    enabled: isAuthenticated,
    staleTime: 30000
  });

  // Fetch upcoming appointments using correct endpoint with status parameter
  const { data: upcomingAppointmentsData, isLoading: upcomingLoading, error: upcomingError, refetch: refetchUpcoming } = useQuery<ServerAppointment[]>({
    queryKey: ['/api/customer/appointments?status=upcoming'],
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

  // Build query string for appointment history
  const buildHistoryQueryString = useMemo(() => {
    const params = new URLSearchParams();
    const status = historyStatusFilter === 'all' ? 'history' : historyStatusFilter;
    params.set('status', status);
    
    const dateRange = getDateRange(historyDateFilter);
    if (dateRange) {
      params.set('dateFrom', dateRange);
    }
    params.set('limit', '50');
    
    return `/api/customer/appointments?${params.toString()}`;
  }, [historyStatusFilter, historyDateFilter]);

  // Fetch appointment history with enhanced filtering - use 'history' for past appointments
  const { data: allHistoryData, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery<ServerAppointment[]>({
    queryKey: [buildHistoryQueryString],
    enabled: isAuthenticated && activeTab === "history",
    staleTime: 30000
  });

  // Build query string for payment history  
  const buildPaymentsQueryString = useMemo(() => {
    const params = new URLSearchParams();
    
    if (paymentsStatusFilter !== 'all') {
      params.set('status', paymentsStatusFilter);
    }
    
    const dateRange = getDateRange(paymentsDateFilter);
    if (dateRange && paymentsDateFilter !== 'all') {
      params.set('dateFrom', dateRange);
    }
    params.set('limit', '20');
    params.set('offset', (currentPaymentsPage * 20).toString());
    
    return `/api/customer/payments?${params.toString()}`;
  }, [paymentsStatusFilter, paymentsDateFilter, currentPaymentsPage]);

  // Enhanced payment history fetching with filtering
  const { data: paymentHistoryData, isLoading: paymentsLoading, error: paymentsError, refetch: refetchPayments } = useQuery<{ payments: ServerPaymentRecord[] }>({
    queryKey: [buildPaymentsQueryString],
    enabled: isAuthenticated && activeTab === "payments",
    staleTime: 30000
  });

  // Fetch customer beauty profiles for displaying preferences on appointments
  interface BeautyProfileSalon {
    id: string;
    salonId: string;
    allergies?: string[] | null;
    sensitivities?: string[] | null;
    preferences: {
      preferredStylist?: string;
      communicationStyle?: string;
      beveragePreference?: string;
      musicPreference?: string;
      specialRequirements?: string;
    } | null;
    hairProfile: {
      hairType?: string;
      hairCondition?: string;
    } | null;
    skinProfile: {
      skinType?: string;
    } | null;
  }

  const { data: beautyProfilesData } = useQuery<{ profiles: BeautyProfileSalon[] }>({
    queryKey: ['/api/client-profiles/my-beauty-profile'],
    enabled: isAuthenticated,
    staleTime: 60000
  });

  // Helper to get profile for a specific salon
  const getProfileForSalon = (salonId: string): BeautyProfileSalon | undefined => {
    return beautyProfilesData?.profiles?.find(p => p.salonId === salonId);
  };

  // Map server data to frontend types
  const dashboardStats = customerProfile ? mapDashboardStats(customerProfile) : undefined;
  const upcomingAppointments = upcomingAppointmentsData?.appointments?.map(mapAppointmentData) || [];
  const allPaymentHistory = paymentHistoryData?.payments?.map(mapPaymentData) || [];

  // Filter and search payment history with memoization
  const paymentHistory = useMemo(() => {
    if (!allPaymentHistory) return [];
    
    let filteredPayments = [...allPaymentHistory];
    
    // Apply status filter
    if (paymentsStatusFilter !== 'all') {
      filteredPayments = filteredPayments.filter(payment => payment.status === paymentsStatusFilter);
    }
    
    // Apply amount filter
    if (paymentsAmountFilter !== 'all') {
      switch (paymentsAmountFilter) {
        case '0-500':
          filteredPayments = filteredPayments.filter(payment => payment.amount >= 0 && payment.amount <= 500);
          break;
        case '500-1000':
          filteredPayments = filteredPayments.filter(payment => payment.amount > 500 && payment.amount <= 1000);
          break;
        case '1000+':
          filteredPayments = filteredPayments.filter(payment => payment.amount > 1000);
          break;
      }
    }
    
    // Apply search filter
    if (paymentsSearchQuery.trim()) {
      const query = paymentsSearchQuery.toLowerCase();
      filteredPayments = filteredPayments.filter(payment => 
        payment.salonName.toLowerCase().includes(query) || 
        payment.serviceName.toLowerCase().includes(query) ||
        payment.transactionId.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (most recent first)
    filteredPayments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return filteredPayments;
  }, [allPaymentHistory, paymentsStatusFilter, paymentsAmountFilter, paymentsSearchQuery]);

  // Calculate payment summary stats
  const paymentSummaryStats = useMemo(() => {
    if (!paymentHistory || !paymentHistory.length) return null;
    
    const completedPayments = paymentHistory.filter(p => p.status === 'completed');
    const totalSpent = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageSpend = completedPayments.length > 0 ? Math.round(totalSpent / completedPayments.length) : 0;
    const lastPaymentDate = paymentHistory.length > 0 ? formatDate(paymentHistory[0].date) : 'Never';
    
    return {
      totalSpent,
      totalTransactions: paymentHistory.length,
      averageSpend,
      lastPaymentDate
    };
  }, [paymentHistory]);

  // Filter and search appointment history with memoization
  const appointmentHistory = useMemo(() => {
    if (!allHistoryData?.appointments) return [];
    
    let filteredHistory = allHistoryData.appointments.map(mapAppointmentData);
    
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
  
  // Create derived stats with upcoming appointments count using useMemo to prevent infinite loops
  const dashboardStatsWithUpcoming = useMemo(() => {
    if (dashboardStats) {
      return {
        ...dashboardStats,
        upcomingAppointments: upcomingAppointments?.length || 0
      };
    }
    return undefined;
  }, [dashboardStats, upcomingAppointments]);

  const statsLoading = profileLoading;

  // Profile form setup
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    }
  });

  // Update form when authoritative profile data changes
  useEffect(() => {
    if (customerProfile && !profileLoading) {
      profileForm.reset({
        firstName: customerProfile.firstName || '',
        lastName: customerProfile.lastName || '',
        phone: customerProfile.phone || '',
      });
    }
  }, [customerProfile, profileLoading]);

  // Hydrate preferences from server data to prevent data loss
  useEffect(() => {
    if (customerProfile?.preferences) {
      setPreferencesData({
        emailNotifications: customerProfile.preferences.emailNotifications ?? true,
        smsNotifications: customerProfile.preferences.smsNotifications ?? false,
        marketingComms: customerProfile.preferences.marketingComms ?? false,
        preferredTimes: customerProfile.preferences.preferredTimes ?? [],
        preferredDays: customerProfile.preferences.preferredDays ?? [],
        preferredCommunicationMethod: customerProfile.preferences.preferredCommunicationMethod ?? 'email'
      });
    }
  }, [customerProfile]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { firstName?: string; lastName?: string; phone?: string; preferences?: any }) => {
      return apiRequest('/api/customer/profile', {
        method: 'PATCH',
        body: profileData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }); // Refresh user data
      toast({ 
        title: "Profile updated successfully",
        description: "Your changes have been saved."
      });
      setIsEditingProfile(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update profile", 
        description: error.message || "Please try again later.", 
        variant: "destructive" 
      });
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return apiRequest('PATCH', `/api/customer/appointments/${appointmentId}`, { status: 'cancelled' });
    },
    onSuccess: () => {
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      // Invalidate and refetch all appointment queries
      queryClient.invalidateQueries({ queryKey: ['/api/customer/appointments?status=upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer/appointments?status=history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form handlers
  const handleProfileSubmit = async (values: ProfileFormData) => {
    await updateProfileMutation.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone || null,
    });
  };

  const handlePreferencesUpdate = async (newPreferences: Partial<typeof preferencesData>) => {
    const updatedPreferences = { ...preferencesData, ...newPreferences };
    setPreferencesData(updatedPreferences);
    await updateProfileMutation.mutateAsync({
      preferences: updatedPreferences
    });
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    profileForm.reset({
      firstName: customerProfile?.firstName || '',
      lastName: customerProfile?.lastName || '',
      phone: customerProfile?.phone || '',
    });
  };

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

  // Payment action handlers
  const handleViewReceiptPayment = (payment: PaymentRecord) => {
    setSelectedReceipt(payment);
    toast({
      title: "Viewing Receipt",
      description: `Receipt for ${payment.serviceName} at ${payment.salonName}`,
    });
  };

  const handleDownloadReceipt = (payment: PaymentRecord) => {
    toast({
      title: "Download Receipt",
      description: "Receipt download functionality will be available soon.",
    });
  };

  const handleRetryPayment = (payment: PaymentRecord) => {
    toast({
      title: "Retry Payment",
      description: "Payment retry functionality will be available soon.",
    });
  };

  const handleRequestRefund = (payment: PaymentRecord) => {
    toast({
      title: "Request Refund",
      description: "Refund request functionality will be available soon.",
    });
  };

  const handleBookAgainFromPayment = (payment: PaymentRecord) => {
    // Use the proper salonId for rebooking
    setRebookAppointment({
      salonId: payment.salonId, // Use proper salonId field
      salonName: payment.salonName,
    });
    setRebookModalOpen(true);
    
    toast({
      title: "Book Again",
      description: `Opening booking for ${payment.serviceName} at ${payment.salonName}`,
    });
  };

  const togglePaymentExpansion = (paymentId: string) => {
    setExpandedPayment(expandedPayment === paymentId ? null : paymentId);
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
    const authToken = getAccessToken();
    console.log('handleContactSalon called', { appointment, user, hasToken: !!authToken });
    if (appointment) {
      const salonInfo = {
        salonId: appointment.salonId,
        salonName: appointment.salonName,
        bookingContext: {
          bookingId: appointment.id,
          serviceName: appointment.serviceName,
          bookingDate: formatDate(appointment.date)
        }
      };
      console.log('Setting chatSalonInfo:', salonInfo);
      setChatSalonInfo(salonInfo);
      setChatModalOpen(true);
      console.log('Modal should now be open');
    } else {
      toast({
        title: "Contact Salon",
        description: "Please select a booking to contact the salon about.",
      });
    }
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

  // Payment status badge component with proper colors and icons
  const getPaymentStatusBadgeContent = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <Check className="h-3 w-3" />,
          text: 'Completed',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
      case 'pending':
        return {
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        };
      case 'failed':
        return {
          icon: <X className="h-3 w-3" />,
          text: 'Failed',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
      case 'refunded':
        return {
          icon: <RefreshCcw className="h-3 w-3" />,
          text: 'Refunded',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        };
      default:
        return {
          icon: null,
          text: status,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
                        {dashboardStatsWithUpcoming?.upcomingAppointments || 0}
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
                        {dashboardStatsWithUpcoming?.totalAppointments || 0}
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
                        {formatCurrency(dashboardStatsWithUpcoming?.totalSpent || 0)}
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
                        {dashboardStatsWithUpcoming?.favoriteServices?.[0]?.serviceName || 'None yet'}
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex" data-testid="tabs-navigation">
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
            <TabsTrigger value="memberships" className="flex items-center gap-2" data-testid="tab-memberships">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Memberships</span>
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
                              
                              {/* Customer Preferences Section */}
                              {(() => {
                                const salonProfile = getProfileForSalon(appointment.salonId);
                                if (!salonProfile) return null;
                                
                                const hasAllergies = salonProfile.allergies && salonProfile.allergies.length > 0;
                                const hasSensitivities = salonProfile.sensitivities && salonProfile.sensitivities.length > 0;
                                const hasPreferences = salonProfile.preferences && (
                                  salonProfile.preferences.preferredStylist ||
                                  salonProfile.preferences.beveragePreference ||
                                  salonProfile.preferences.specialRequirements
                                );
                                
                                if (!hasAllergies && !hasSensitivities && !hasPreferences) return null;
                                
                                return (
                                  <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2">
                                      <Heart className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Your Profile at This Salon</span>
                                    </div>
                                    
                                    {(hasAllergies || hasSensitivities) && (
                                      <div className="flex flex-wrap gap-2">
                                        {hasAllergies && (
                                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                                            <AlertTriangle className="h-3 w-3 text-red-600" />
                                            <span className="text-red-700 dark:text-red-300">
                                              Allergies: {salonProfile.allergies!.join(", ")}
                                            </span>
                                          </div>
                                        )}
                                        {hasSensitivities && (
                                          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded text-xs">
                                            <span className="text-orange-700 dark:text-orange-300">
                                              Sensitivities: {salonProfile.sensitivities!.join(", ")}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {hasPreferences && (
                                      <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                                        {salonProfile.preferences?.preferredStylist && (
                                          <p>Preferred stylist: {salonProfile.preferences.preferredStylist}</p>
                                        )}
                                        {salonProfile.preferences?.beveragePreference && (
                                          <p>Beverage: {salonProfile.preferences.beveragePreference}</p>
                                        )}
                                        {salonProfile.preferences?.specialRequirements && (
                                          <p>Special needs: {salonProfile.preferences.specialRequirements}</p>
                                        )}
                                      </div>
                                    )}
                                    
                                    <Link href="/customer/beauty-profile">
                                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-purple-600 hover:text-purple-800">
                                        View Full Profile
                                      </Button>
                                    </Link>
                                  </div>
                                );
                              })()}
                              
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
                          
                          <LateArrivalButton
                            bookingId={appointment.id}
                            bookingTime={appointment.time}
                            bookingDate={appointment.date}
                            salonName={appointment.salonName}
                            bookingStatus={appointment.status}
                            onSuccess={() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/customer/appointments?status=upcoming'] });
                            }}
                          />
                          
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
                            onClick={() => handleContactSalon(appointment)}
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
          <TabsContent value="profile" className="space-y-6" data-testid="content-profile">
            {/* Profile Header */}
            <div className="profile-header mb-8" data-testid="profile-header">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={user?.profileImageUrl} 
                      alt={`${user?.firstName || ''} ${user?.lastName || ''}`} 
                    />
                    <AvatarFallback className="text-xl font-semibold">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-profile-name">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.firstName || user?.lastName || 'Customer'
                      }
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2" data-testid="text-profile-email">
                      <Mail className="h-4 w-4" />
                      {user?.email}
                    </p>
                    {customerProfile && (
                      <p className="text-sm text-muted-foreground" data-testid="text-member-since">
                        Member since {format(new Date(customerProfile.stats?.memberSince || new Date()), 'MMMM yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditingProfile ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-cancel-edit"
                      >
                        <Cancel className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={profileForm.handleSubmit(handleProfileSubmit)}
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEditProfile} data-testid="button-edit-profile">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Personal Information */}
              <Card className="xl:col-span-2" data-testid="card-personal-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem data-testid="field-first-name">
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter first name"
                                  disabled={!isEditingProfile}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem data-testid="field-last-name">
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter last name"
                                  disabled={!isEditingProfile}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem data-testid="field-phone">
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter phone number"
                                  disabled={!isEditingProfile}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormItem data-testid="field-email">
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              value={user?.email || ''}
                              disabled
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormDescription>
                            Email cannot be changed as it's used for account authentication
                          </FormDescription>
                        </FormItem>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card data-testid="card-account-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                          <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : customerProfile ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Bookings</Label>
                        <p className="text-lg font-semibold" data-testid="text-total-bookings">
                          {customerProfile.stats.totalBookings}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Spent</Label>
                        <p className="text-lg font-semibold" data-testid="text-total-spent-profile">
                          {formatCurrency(customerProfile.stats.totalSpentPaisa)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Active</span>
                        </div>
                      </div>
                      {customerProfile.stats.lastBookingDate && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Last Booking</Label>
                          <p className="text-sm">{formatDate(customerProfile.stats.lastBookingDate)}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Account information unavailable</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preferences Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Display Preferences */}
              <Card data-testid="card-display-preferences">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Display Preferences
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customize your app appearance
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between" data-testid="toggle-theme">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        {isDarkTheme ? (
                          <Moon className="h-4 w-4" />
                        ) : (
                          <Sun className="h-4 w-4" />
                        )}
                        Theme
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isDarkTheme ? 'Dark mode enabled' : 'Light mode enabled'}
                      </p>
                    </div>
                    <Switch 
                      checked={isDarkTheme}
                      onCheckedChange={(checked) => {
                        setIsDarkTheme(checked);
                        if (checked) {
                          document.documentElement.classList.add('dark');
                          localStorage.setItem('theme', 'dark');
                        } else {
                          document.documentElement.classList.remove('dark');
                          localStorage.setItem('theme', 'light');
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Communication Preferences */}
              <Card data-testid="card-communication-preferences">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Communication Preferences
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose how you'd like to receive updates about your appointments
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between" data-testid="toggle-email-notifications">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Appointment confirmations and reminders via email
                      </p>
                    </div>
                    <Switch 
                      checked={preferencesData.emailNotifications}
                      onCheckedChange={(checked) => handlePreferencesUpdate({ emailNotifications: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between" data-testid="toggle-sms-notifications">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        <Smartphone className="h-4 w-4" />
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Urgent reminders and updates via text message
                      </p>
                    </div>
                    <Switch 
                      checked={preferencesData.smsNotifications}
                      onCheckedChange={(checked) => handlePreferencesUpdate({ smsNotifications: checked })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between" data-testid="toggle-marketing-comms">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2 text-base font-medium">
                        <MessageSquare className="h-4 w-4" />
                        Marketing Communications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Special offers, promotions, and salon news
                      </p>
                    </div>
                    <Switch 
                      checked={preferencesData.marketingComms}
                      onCheckedChange={(checked) => handlePreferencesUpdate({ marketingComms: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Service Preferences */}
              <Card data-testid="card-service-preferences">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Service Preferences
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Based on your booking history and preferences
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {customerProfile && customerProfile.stats.favoriteServices && customerProfile.stats.favoriteServices.length > 0 ? (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Favorite Services</Label>
                        <div className="mt-2 space-y-2">
                          {customerProfile.stats.favoriteServices.slice(0, 3).map((service, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg" data-testid={`favorite-service-${index}`}>
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm font-medium">{service.serviceName}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {service.count} times
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                    </>
                  ) : null}
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Preferred Times</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {['Morning', 'Afternoon', 'Evening'].map((time) => (
                        <Button
                          key={time}
                          variant={preferencesData.preferredTimes.includes(time.toLowerCase()) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const currentTimes = preferencesData.preferredTimes;
                            const timeValue = time.toLowerCase();
                            const newTimes = currentTimes.includes(timeValue) 
                              ? currentTimes.filter(t => t !== timeValue)
                              : [...currentTimes, timeValue];
                            handlePreferencesUpdate({ preferredTimes: newTimes });
                          }}
                          data-testid={`toggle-time-${time.toLowerCase()}`}
                          className="text-xs"
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Preferred Communication Method</Label>
                    <Select 
                      value={preferencesData.preferredCommunicationMethod} 
                      onValueChange={(value) => handlePreferencesUpdate({ preferredCommunicationMethod: value as 'email' | 'sms' | 'both' })}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-communication-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="sms">SMS Only</SelectItem>
                        <SelectItem value="both">Both Email & SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Beauty Profile Section */}
            <div className="mt-6">
              <MyBeautyProfile />
            </div>
          </TabsContent>

          {/* Comprehensive Payment History Tab */}
          <TabsContent value="payments" className="space-y-6" data-testid="content-payments">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Payment History</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" data-testid="text-payments-count">
                  {paymentHistory.length} {paymentHistory.length === 1 ? 'payment' : 'payments'}
                </Badge>
              </div>
            </div>

            {/* Payment Summary Stats */}
            {paymentSummaryStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold" data-testid="text-total-spent-summary">
                      ₹{paymentSummaryStats.totalSpent}
                    </p>
                    <p className="text-muted-foreground">Total Spent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold" data-testid="text-total-transactions">
                      {paymentSummaryStats.totalTransactions}
                    </p>
                    <p className="text-muted-foreground">Total Payments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold" data-testid="text-average-spend">
                      ₹{paymentSummaryStats.averageSpend}
                    </p>
                    <p className="text-muted-foreground">Average Spend</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold" data-testid="text-last-payment">
                      {paymentSummaryStats.lastPaymentDate}
                    </p>
                    <p className="text-muted-foreground">Last Payment</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payments Filter Bar */}
            <div className="payments-filter-bar bg-card rounded-lg p-4 border" data-testid="payments-filter-bar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Select value={paymentsStatusFilter} onValueChange={setPaymentsStatusFilter}>
                    <SelectTrigger data-testid="select-payment-status-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <Select value={paymentsDateFilter} onValueChange={setPaymentsDateFilter}>
                    <SelectTrigger data-testid="select-payment-date-filter">
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
                  <Select value={paymentsAmountFilter} onValueChange={setPaymentsAmountFilter}>
                    <SelectTrigger data-testid="select-payment-amount-filter">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All amounts</SelectItem>
                      <SelectItem value="0-500">₹0 - ₹500</SelectItem>
                      <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
                      <SelectItem value="1000+">₹1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={paymentsSearchQuery}
                      onChange={(e) => setPaymentsSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-payments"
                    />
                  </div>
                </div>
              </div>

              {(paymentsStatusFilter !== 'all' || paymentsDateFilter !== 'all' || paymentsAmountFilter !== 'all' || paymentsSearchQuery) && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPaymentsStatusFilter('all');
                      setPaymentsDateFilter('all');
                      setPaymentsAmountFilter('all');
                      setPaymentsSearchQuery('');
                    }}
                    data-testid="button-clear-payment-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
            
            {/* Payment History Content */}
            {paymentsError ? (
              <Card className="text-center py-12" data-testid="error-payments">
                <CardContent>
                  <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load payments</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an error loading your payment history. Please try again.
                  </p>
                  <Button 
                    onClick={() => refetchPayments()}
                    variant="outline"
                    data-testid="button-retry-payments"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : paymentsLoading ? (
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
            ) : paymentHistory && paymentHistory.length > 0 ? (
              <div className="space-y-4">
                {paymentHistory.map((payment) => {
                  const isExpanded = expandedPayment === payment.id;
                  const statusBadge = getPaymentStatusBadgeContent(payment.status);
                  
                  return (
                    <Card 
                      key={payment.id} 
                      className="payment-history-card hover:shadow-md transition-shadow" 
                      data-testid={`card-payment-${payment.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg" data-testid={`text-payment-service-${payment.id}`}>
                              {payment.serviceName}
                            </h3>
                            <p className="text-muted-foreground" data-testid={`text-payment-salon-${payment.id}`}>
                              {payment.salonName}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-payment-date-${payment.id}`}>
                              {formatDate(payment.date)} • Transaction #{payment.transactionId.slice(-6)}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge 
                              className={`${statusBadge.className} flex items-center gap-1`}
                              data-testid={`badge-payment-status-${payment.id}`}
                            >
                              {statusBadge.icon}
                              {statusBadge.text}
                            </Badge>
                            <p className="text-lg font-semibold" data-testid={`text-payment-amount-${payment.id}`}>
                              ₹{payment.amount}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-payment-method-${payment.id}`}>
                              {payment.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="pt-0 pb-3">
                          <div className="mt-4 pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Appointment ID:</span>
                              <span className="font-mono" data-testid={`text-appointment-id-${payment.id}`}>
                                {payment.appointmentId}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Payment Method:</span>
                              <span>{payment.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Transaction Date:</span>
                              <span>{formatDate(payment.date)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Currency:</span>
                              <span>{payment.currency}</span>
                            </div>
                          </div>
                        </CardContent>
                      )}
                      
                      <CardFooter className="pt-0">
                        <div className="flex flex-wrap gap-2 w-full">
                          {payment.status === 'completed' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewReceiptPayment(payment)}
                                data-testid={`button-view-receipt-${payment.id}`}
                              >
                                <Receipt className="h-3 w-3 mr-1" />
                                View Receipt
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDownloadReceipt(payment)}
                                data-testid={`button-download-receipt-${payment.id}`}
                              >
                                <Receipt className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleBookAgainFromPayment(payment)}
                                data-testid={`button-book-again-${payment.id}`}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Book Again
                              </Button>
                            </>
                          ) : payment.status === 'failed' ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRetryPayment(payment)}
                                data-testid={`button-retry-payment-${payment.id}`}
                              >
                                <RefreshCcw className="h-3 w-3 mr-1" />
                                Retry Payment
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleContactSalon()}
                                data-testid={`button-contact-support-${payment.id}`}
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Contact Support
                              </Button>
                            </>
                          ) : payment.status === 'completed' ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRequestRefund(payment)}
                              data-testid={`button-request-refund-${payment.id}`}
                            >
                              <RefreshCcw className="h-3 w-3 mr-1" />
                              Request Refund
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => togglePaymentExpansion(payment.id)}
                              data-testid={`button-payment-details-${payment.id}`}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Payment Details
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => togglePaymentExpansion(payment.id)}
                            data-testid={`button-toggle-details-${payment.id}`}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Details
                              </>
                            )}
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-12" data-testid="empty-payments">
                <CardContent>
                  <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {paymentsStatusFilter !== 'all' || paymentsSearchQuery ? 'No matching payments' : 'No payment history'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {paymentsStatusFilter !== 'all' || paymentsSearchQuery 
                      ? 'Try adjusting your filters or search terms.'
                      : 'Your payment transactions will appear here after you book services'
                    }
                  </p>
                  {(paymentsStatusFilter !== 'all' || paymentsSearchQuery) ? (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setPaymentsStatusFilter('all');
                        setPaymentsDateFilter('all');
                        setPaymentsAmountFilter('all');
                        setPaymentsSearchQuery('');
                      }}
                      data-testid="button-clear-payment-filters-empty"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  ) : (
                    <Link href="/">
                      <Button data-testid="button-browse-salons">
                        Browse Salons
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Memberships Tab */}
          <TabsContent value="memberships" className="space-y-4" data-testid="content-memberships">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
                My Memberships
              </h2>
            </div>
            <CustomerMemberships />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Receipt Modal */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-md" data-testid="receipt-modal">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h3 className="font-semibold" data-testid="receipt-salon-name">
                  {selectedReceipt.salonName}
                </h3>
                <p className="text-muted-foreground" data-testid="receipt-service-name">
                  {selectedReceipt.serviceName}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span data-testid="receipt-date">{formatDate(selectedReceipt.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold" data-testid="receipt-amount">
                    ₹{selectedReceipt.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span data-testid="receipt-payment-method">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-sm" data-testid="receipt-transaction-id">
                    {selectedReceipt.transactionId}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Status:</span>
                  <div>
                    {(() => {
                      const statusBadge = getPaymentStatusBadgeContent(selectedReceipt.status);
                      return (
                        <Badge 
                          className={`${statusBadge.className} flex items-center gap-1`}
                          data-testid="receipt-status"
                        >
                          {statusBadge.icon}
                          {statusBadge.text}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleDownloadReceipt(selectedReceipt)}
                  data-testid="button-download-receipt-modal"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedReceipt(null)}
                  data-testid="button-close-receipt-modal"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      {rescheduleAppointment && (
        <RescheduleModal
          isOpen={rescheduleModalOpen}
          onClose={() => {
            setRescheduleModalOpen(false);
            setRescheduleAppointment(null);
            refetchUpcoming();
          }}
          appointment={{
            id: rescheduleAppointment.id,
            salonId: rescheduleAppointment.salonId,
            salonName: rescheduleAppointment.salonName,
            serviceId: rescheduleAppointment.serviceId,
            serviceName: rescheduleAppointment.serviceName,
            staffId: rescheduleAppointment.staffId,
            staffName: rescheduleAppointment.staffName,
            bookingDate: rescheduleAppointment.date,
            bookingTime: rescheduleAppointment.time,
            duration: rescheduleAppointment.duration,
          }}
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

      {/* Chat Modal for contacting salon */}
      {chatSalonInfo && user && getAccessToken() && (
        <CustomerChatModal
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setChatSalonInfo(null);
          }}
          salonId={chatSalonInfo.salonId}
          salonName={chatSalonInfo.salonName}
          userId={user.id}
          userName={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer'}
          userAvatar={user.profileImageUrl}
          authToken={getAccessToken()!}
          bookingContext={chatSalonInfo.bookingContext}
        />
      )}
    </div>
  );
}