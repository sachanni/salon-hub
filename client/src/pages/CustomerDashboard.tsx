import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
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
  ChevronRight
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
  totalPaisa: serverData.totalAmountPaisa // Map totalAmountPaisa to totalPaisa
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

  // Fetch customer profile with stats (replaces dashboard-stats)
  const { data: customerProfile, isLoading: profileLoading } = useQuery<ServerCustomerProfile>({
    queryKey: ['/api/customer/profile'],
    enabled: isAuthenticated,
    staleTime: 30000
  });

  // Fetch upcoming appointments using correct endpoint with status parameter
  const { data: upcomingAppointmentsData, isLoading: upcomingLoading } = useQuery<ServerAppointment[]>({
    queryKey: ['/api/customer/appointments', { status: 'upcoming' }],
    enabled: isAuthenticated && activeTab === "upcoming",
    staleTime: 30000
  });

  // Fetch appointment history using correct endpoint with status parameter
  const { data: appointmentHistoryData, isLoading: historyLoading } = useQuery<ServerAppointment[]>({
    queryKey: ['/api/customer/appointments', { status: 'completed' }],
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
  const appointmentHistory = appointmentHistoryData?.map(mapAppointmentData) || [];
  const paymentHistory = paymentHistoryData?.map(mapPaymentData) || [];
  
  // Update upcoming appointments count in stats
  if (dashboardStats && upcomingAppointments.length > 0) {
    dashboardStats.upcomingAppointments = upcomingAppointments.length;
  }

  const statsLoading = profileLoading;

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
            
            {upcomingLoading ? (
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
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow" data-testid={`card-appointment-${appointment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{appointment.serviceName}</h3>
                            <Badge className={getStatusColor(appointment.status)} data-testid={`badge-status-${appointment.id}`}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{appointment.salonName}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(appointment.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {appointment.staffName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{formatCurrency(appointment.totalPaisa)}</p>
                          <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12" data-testid="empty-upcoming">
                <CardContent>
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                  <p className="text-muted-foreground mb-6">
                    Your upcoming appointments will appear here once you book them.
                  </p>
                  <Link href="/">
                    <Button data-testid="button-book-first-appointment">
                      <Plus className="h-4 w-4 mr-2" />
                      Book Your First Appointment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Appointment History Tab */}
          <TabsContent value="history" className="space-y-4" data-testid="content-history">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Appointment History</h2>
              <Button variant="outline" disabled data-testid="button-filters">
                <Settings className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
            
            {historyLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
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
            ) : appointmentHistory && appointmentHistory.length > 0 ? (
              <div className="space-y-4">
                {appointmentHistory.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow" data-testid={`card-history-${appointment.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{appointment.serviceName}</h3>
                            <Badge className={getStatusColor(appointment.status)} data-testid={`badge-history-status-${appointment.id}`}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{appointment.salonName}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(appointment.date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {appointment.staffName}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{formatCurrency(appointment.totalPaisa)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12" data-testid="empty-history">
                <CardContent>
                  <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No appointment history</h3>
                  <p className="text-muted-foreground">
                    Your completed appointments will appear here after your visits.
                  </p>
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
    </div>
  );
}