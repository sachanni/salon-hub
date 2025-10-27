import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Calendar, 
  DollarSign, 
  Settings,
  Gift,
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  MapPin,
  Phone,
  Mail,
  Eye,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PlatformStats } from "@shared/admin-types";
import AdminOffers from "@/pages/AdminOffers";

export default function SuperAdminDashboard() {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Check authentication
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin panel.",
        variant: "destructive",
      });
      setLocation('/login/business');
    }
  }, [user, userLoading, setLocation, toast]);

  // Fetch platform stats
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/platform-stats'],
  });

  const currentPage = location.split('/admin/')[1] || 'dashboard';

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/admin/dashboard',
      badge: null
    },
    { 
      id: 'salons', 
      label: 'Business Management', 
      icon: Store, 
      path: '/admin/salons',
      badge: stats?.pendingApprovals || null
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users, 
      path: '/admin/users',
      badge: null
    },
    { 
      id: 'bookings', 
      label: 'Booking Analytics', 
      icon: Calendar, 
      path: '/admin/bookings',
      badge: null
    },
    { 
      id: 'offers', 
      label: 'Offers', 
      icon: Gift, 
      path: '/admin/offers',
      badge: null
    },
    { 
      id: 'payouts', 
      label: 'Payouts', 
      icon: DollarSign, 
      path: '/admin/payouts',
      badge: stats?.pendingPayouts || null
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/admin/settings',
      badge: null
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      setLocation('/');
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      });
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-40 h-screen transition-transform bg-white border-r border-gray-200",
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-0"
      )}>
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6 px-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-rose-600 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">SalonHub</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
              data-testid="button-close-sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <ul className="space-y-2 font-medium">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link href={item.path}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer",
                      currentPage === item.id
                        ? "bg-purple-50 text-purple-700"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                    data-testid={`nav-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Logout */}
          <div className="absolute bottom-4 left-3 right-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-3 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {navItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">Platform Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {currentPage === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              {statsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : stats ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card data-testid="card-total-salons">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Salons
                      </CardTitle>
                      <Store className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalSalons || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.activeSalons || 0} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-total-users">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Users
                      </CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.activeUsers || 0} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-total-bookings">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Bookings
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalBookings || 0}</div>
                      <p className="text-xs text-green-600 mt-1">
                        +{stats.todayBookings || 0} today
                      </p>
                    </CardContent>
                  </Card>

                  <Card data-testid="card-total-revenue">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Revenue
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ₹{((stats.totalRevenue || 0) / 100).toLocaleString('en-IN')}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Commission: ₹{((stats.totalCommission || 0) / 100).toLocaleString('en-IN')}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {/* Quick Actions */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                      Pending Approvals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stats?.pendingApprovals || 0}</div>
                    <Link href="/admin/salons">
                      <Button size="sm" variant="outline" data-testid="button-view-approvals">
                        View All
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      Active Offers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stats?.activeOffers || 0}</div>
                    <Link href="/admin/offers">
                      <Button size="sm" variant="outline" data-testid="button-view-offers">
                        Manage Offers
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Clock className="h-5 w-5" />
                      Pending Payouts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stats?.pendingPayouts || 0}</div>
                    <Link href="/admin/payouts">
                      <Button size="sm" variant="outline" data-testid="button-view-payouts">
                        Process Payouts
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {currentPage === 'salons' && <BusinessManagementPage />}
          {currentPage === 'users' && <UserManagementPage />}
          {currentPage === 'bookings' && <BookingAnalyticsPage />}
          {currentPage === 'offers' && <OffersManagementPage />}
          {currentPage === 'payouts' && <PayoutsPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

// Business Management Page Component
function BusinessManagementPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: salons = [], isLoading } = useQuery({
    queryKey: ['/api/admin/salons', { approvalStatus: statusFilter === 'all' ? undefined : statusFilter }],
  });

  const approveMutation = useMutation({
    mutationFn: (salonId: string) => 
      apiRequest(`/api/admin/salons/${salonId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-stats'] });
      toast({ title: "Success", description: "Salon approved successfully" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (salonId: string) => 
      apiRequest(`/api/admin/salons/${salonId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-stats'] });
      toast({ title: "Success", description: "Salon rejected" });
    },
  });

  const salonArray = Array.isArray(salons) ? salons : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Management</h2>
          <p className="text-gray-600">Review and approve salon registrations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salons</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading salons...</div>
          ) : salonArray.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No salons found</div>
          ) : (
            <div className="space-y-4">
              {salonArray.map((salon: any) => (
                <div key={salon.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{salon.name}</h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{salon.address}, {salon.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{salon.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{salon.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={
                        salon.approvalStatus === 'approved' ? 'default' :
                        salon.approvalStatus === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {salon.approvalStatus}
                      </Badge>
                      {salon.approvalStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(salon.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${salon.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectMutation.mutate(salon.id)}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-reject-${salon.id}`}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// User Management Page Component
function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users', { search: searchQuery || undefined }],
  });

  const userArray = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">User Management</h2>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading users...</div>
          ) : userArray.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-2">
              {userArray.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Badge variant={user.isActive === 1 ? "default" : "secondary"}>
                    {user.isActive === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Booking Analytics Page Component
function BookingAnalyticsPage() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/api/admin/bookings'],
  });

  const bookingArray = Array.isArray(bookings) ? bookings : [];
  const totalRevenue = bookingArray
    .filter((b: any) => b.status === 'completed')
    .reduce((sum: number, b: any) => sum + (b.totalAmountPaisa || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Booking Analytics</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingArray.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bookingArray.filter((b: any) => b.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalRevenue / 100).toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading bookings...</div>
          ) : bookingArray.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No bookings found</div>
          ) : (
            <div className="space-y-2">
              {bookingArray.slice(0, 10).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Booking #{booking.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">{new Date(booking.bookingDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{((booking.totalAmountPaisa || 0) / 100).toFixed(2)}</p>
                    <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Offers Management Page Component - uses imported AdminOffers
function OffersManagementPage() {
  return <AdminOffers />;
}

// Payouts Page Component
function PayoutsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payouts</h2>
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Payout management coming soon...
        </CardContent>
      </Card>
    </div>
  );
}

// Settings Page Component
function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Platform settings coming soon...
        </CardContent>
      </Card>
    </div>
  );
}
