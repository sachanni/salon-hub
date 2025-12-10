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
  Ban,
  CreditCard,
  Edit2,
  Save,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Crown,
  Zap,
  Star,
  RefreshCw,
  BarChart3,
  UserPlus,
  UserMinus,
  IndianRupee,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
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
      id: 'subscriptions', 
      label: 'Subscription Tiers', 
      icon: CreditCard, 
      path: '/admin/subscriptions',
      badge: null
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
          {currentPage === 'subscriptions' && <SubscriptionTiersPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

// Business Management Page Component
function BusinessManagementPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();

  const { data: salons = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/salons', { approvalStatus: statusFilter === 'all' ? undefined : statusFilter }],
  });

  const approveMutation = useMutation({
    mutationFn: async (salonId: string) => {
      const res = await fetch(`/api/admin/salons/${salonId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to approve salon');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-stats'] });
      toast({ title: "Success", description: "Salon approved successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (salonId: string) => {
      const res = await fetch(`/api/admin/salons/${salonId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Rejected by admin' }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reject salon');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-stats'] });
      toast({ title: "Success", description: "Salon rejected" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ salonId, isActive }: { salonId: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/salons/${salonId}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update salon status');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons'] });
      toast({ 
        title: variables.isActive ? "Salon Enabled" : "Salon Disabled", 
        description: variables.isActive 
          ? "Salon is now visible and accepting bookings" 
          : "Salon is now hidden from customers"
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const salonArray = Array.isArray(salons) ? salons : [];
  const filteredSalons = salonArray.filter((salon: any) => {
    if (activeFilter === 'active') return salon.isActive === 1;
    if (activeFilter === 'disabled') return salon.isActive === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Management</h2>
          <p className="text-gray-600">Review, approve, and manage salon listings</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status">
                <SelectValue placeholder="Approval Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approval Status</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Active Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active (Enabled)</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading salons...</div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No salons found</div>
          ) : (
            <div className="space-y-4">
              {filteredSalons.map((salon: any) => (
                <div 
                  key={salon.id} 
                  className={cn(
                    "border rounded-lg p-4 transition-colors",
                    salon.isActive === 0 ? "bg-red-50 border-red-200" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{salon.name}</h3>
                        {salon.isActive === 0 && (
                          <Badge variant="destructive" className="text-xs">DISABLED</Badge>
                        )}
                      </div>
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
                    <div className="flex flex-col items-end gap-3">
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
                      
                      {salon.approvalStatus === 'approved' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {salon.isActive === 1 ? 'Enabled' : 'Disabled'}
                          </span>
                          <Switch
                            checked={salon.isActive === 1}
                            onCheckedChange={(checked) => 
                              toggleStatusMutation.mutate({ salonId: salon.id, isActive: checked })
                            }
                            disabled={toggleStatusMutation.isPending}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {salon.isActive === 0 && salon.approvalStatus === 'approved' && (
                    <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                      This salon is currently disabled and hidden from customers. They cannot receive new bookings.
                    </div>
                  )}
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
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('general');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/settings/admin/all'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ category, data }: { category: string; data: any }) => {
      const res = await fetch(`/api/settings/admin/${category}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: (result) => {
      toast({ title: 'Settings Updated', description: result.message || 'Changes saved successfully' });
      setUnsavedChanges(false);
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ feature, enabled }: { feature: string; enabled: boolean }) => {
      const res = await fetch('/api/settings/admin/toggle-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feature, enabled }),
      });
      if (!res.ok) throw new Error('Failed to toggle feature');
      return res.json();
    },
    onSuccess: (result) => {
      toast({ title: 'Feature Updated', description: result.message });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMaintenanceMutation = useMutation({
    mutationFn: async ({ enabled, message, endTime }: { enabled: boolean; message?: string; endTime?: string }) => {
      const res = await fetch('/api/settings/admin/toggle-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled, message, endTime }),
      });
      if (!res.ok) throw new Error('Failed to toggle maintenance mode');
      return res.json();
    },
    onSuccess: (result) => {
      toast({ title: result.settings.maintenanceMode ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled' });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const settings = (settingsData as any)?.settings || {};

  const settingsSections = [
    { id: 'general', label: 'General', icon: Settings, description: 'Platform name, contact, locale' },
    { id: 'booking', label: 'Booking', icon: Calendar, description: 'Booking rules and policies' },
    { id: 'payment', label: 'Payment', icon: CreditCard, description: 'Payment gateways and commissions' },
    { id: 'communication', label: 'Communication', icon: Mail, description: 'Email, SMS, notifications' },
    { id: 'security', label: 'Security', icon: AlertTriangle, description: 'Password and session policies' },
    { id: 'features', label: 'Feature Flags', icon: Sparkles, description: 'Enable/disable platform features' },
    { id: 'branding', label: 'Branding', icon: Star, description: 'Colors, logo, customization' },
    { id: 'maintenance', label: 'Maintenance', icon: RefreshCw, description: 'Maintenance mode control' },
  ];

  const featureDescriptions: Record<string, string> = {
    enableEvents: 'Allow salons to create and manage events',
    enableShop: 'Enable e-commerce shop for product sales',
    enableLoyalty: 'Loyalty points and rewards program',
    enableReferrals: 'Customer referral program',
    enableAIConsultant: 'AI-powered beauty consultant',
    enableJobCards: 'Front desk job card management',
    enableMetaIntegration: 'Facebook/Instagram booking integration',
    enableSmartRebooking: 'AI-powered rebooking reminders',
    enableGiftCards: 'Digital gift card system',
    enableCustomerImport: 'Bulk customer import via CSV',
    enableReviews: 'Customer review system',
    enableWaitlist: 'Waitlist for fully booked slots',
    enableDynamicPricing: 'Off-peak dynamic pricing',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-purple-600" />
            Platform Settings
          </h2>
          <p className="text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="w-64 shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                        activeSection === section.id 
                          ? "bg-purple-100 text-purple-700" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium text-sm">{section.label}</p>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
                Loading settings...
              </CardContent>
            </Card>
          ) : (
            <>
              {activeSection === 'general' && (
                <GeneralSettingsSection 
                  settings={settings.general || {}}
                  onSave={(data) => updateSettingsMutation.mutate({ category: 'general', data })}
                  isLoading={updateSettingsMutation.isPending}
                />
              )}
              {activeSection === 'booking' && (
                <BookingSettingsSection 
                  settings={settings.booking || {}}
                  onSave={(data) => updateSettingsMutation.mutate({ category: 'booking', data })}
                  isLoading={updateSettingsMutation.isPending}
                />
              )}
              {activeSection === 'payment' && (
                <PaymentSettingsSection 
                  settings={settings.payment || {}}
                  onSave={(data) => updateSettingsMutation.mutate({ category: 'payment', data })}
                  isLoading={updateSettingsMutation.isPending}
                />
              )}
              {activeSection === 'communication' && (
                <CommunicationSettingsSection 
                  settings={settings.communication || {}}
                  onSave={(data) => updateSettingsMutation.mutate({ category: 'communication', data })}
                  isLoading={updateSettingsMutation.isPending}
                />
              )}
              {activeSection === 'security' && (
                <SecuritySettingsSection 
                  settings={settings.security || {}}
                  onSave={(data) => updateSettingsMutation.mutate({ category: 'security', data })}
                  isLoading={updateSettingsMutation.isPending}
                />
              )}
              {activeSection === 'features' && (
                <FeatureFlagsSection 
                  settings={settings.features || {}}
                  descriptions={featureDescriptions}
                  onToggle={(feature, enabled) => toggleFeatureMutation.mutate({ feature, enabled })}
                  isLoading={toggleFeatureMutation.isPending}
                />
              )}
              {activeSection === 'branding' && (
                <BrandingSettingsSection 
                  settings={settings.branding || {}}
                  onSave={(data) => updateSettingsMutation.mutate({ category: 'branding', data })}
                  isLoading={updateSettingsMutation.isPending}
                />
              )}
              {activeSection === 'maintenance' && (
                <MaintenanceSection 
                  settings={settings.maintenance || {}}
                  onToggle={(enabled, message, endTime) => toggleMaintenanceMutation.mutate({ enabled, message, endTime })}
                  isLoading={toggleMaintenanceMutation.isPending}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneralSettingsSection({ settings, onSave, isLoading }: { settings: any; onSave: (data: any) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    platformName: settings.platformName || 'SalonHub',
    platformTagline: settings.platformTagline || '',
    contactEmail: settings.contactEmail || '',
    contactPhone: settings.contactPhone || '',
    defaultCurrency: settings.defaultCurrency || 'INR',
    defaultTimezone: settings.defaultTimezone || 'Asia/Kolkata',
    defaultLanguage: settings.defaultLanguage || 'en',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          General Settings
        </CardTitle>
        <CardDescription>Basic platform configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Platform Name</Label>
            <Input 
              value={form.platformName}
              onChange={(e) => setForm({ ...form, platformName: e.target.value })}
            />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input 
              value={form.platformTagline}
              onChange={(e) => setForm({ ...form, platformTagline: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Contact Email</Label>
            <Input 
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input 
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Default Currency</Label>
            <Select value={form.defaultCurrency} onValueChange={(v) => setForm({ ...form, defaultCurrency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default Timezone</Label>
            <Select value={form.defaultTimezone} onValueChange={(v) => setForm({ ...form, defaultTimezone: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Default Language</Label>
            <Select value={form.defaultLanguage} onValueChange={(v) => setForm({ ...form, defaultLanguage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingSettingsSection({ settings, onSave, isLoading }: { settings: any; onSave: (data: any) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    advanceBookingDays: settings.advanceBookingDays || 30,
    minBookingNoticeMins: settings.minBookingNoticeMins || 60,
    maxServicesPerBooking: settings.maxServicesPerBooking || 5,
    bufferTimeMins: settings.bufferTimeMins || 15,
    allowInstantBooking: settings.allowInstantBooking ?? true,
    requirePhoneVerification: settings.requirePhoneVerification ?? false,
    cancellationWindowHours: settings.cancellationWindowHours || 24,
    rescheduleWindowHours: settings.rescheduleWindowHours || 12,
    noShowPenaltyPercent: settings.noShowPenaltyPercent || 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Booking Settings
        </CardTitle>
        <CardDescription>Configure booking rules and policies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Advance Booking (days)</Label>
            <Input 
              type="number"
              value={form.advanceBookingDays}
              onChange={(e) => setForm({ ...form, advanceBookingDays: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">How far in advance can customers book</p>
          </div>
          <div>
            <Label>Min Notice (minutes)</Label>
            <Input 
              type="number"
              value={form.minBookingNoticeMins}
              onChange={(e) => setForm({ ...form, minBookingNoticeMins: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum time before appointment</p>
          </div>
          <div>
            <Label>Buffer Time (minutes)</Label>
            <Input 
              type="number"
              value={form.bufferTimeMins}
              onChange={(e) => setForm({ ...form, bufferTimeMins: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Gap between appointments</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Max Services Per Booking</Label>
            <Input 
              type="number"
              value={form.maxServicesPerBooking}
              onChange={(e) => setForm({ ...form, maxServicesPerBooking: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Cancellation Window (hours)</Label>
            <Input 
              type="number"
              value={form.cancellationWindowHours}
              onChange={(e) => setForm({ ...form, cancellationWindowHours: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Reschedule Window (hours)</Label>
            <Input 
              type="number"
              value={form.rescheduleWindowHours}
              onChange={(e) => setForm({ ...form, rescheduleWindowHours: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Allow Instant Booking</p>
              <p className="text-sm text-gray-500">Customers can book without salon approval</p>
            </div>
            <Switch 
              checked={form.allowInstantBooking}
              onCheckedChange={(checked) => setForm({ ...form, allowInstantBooking: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Require Phone Verification</p>
              <p className="text-sm text-gray-500">Verify phone before booking</p>
            </div>
            <Switch 
              checked={form.requirePhoneVerification}
              onCheckedChange={(checked) => setForm({ ...form, requirePhoneVerification: checked })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentSettingsSection({ settings, onSave, isLoading }: { settings: any; onSave: (data: any) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    razorpayEnabled: settings.razorpayEnabled ?? true,
    defaultCommissionPercent: settings.defaultCommissionPercent || 10,
    minPayoutAmountPaisa: settings.minPayoutAmountPaisa || 50000,
    payoutFrequency: settings.payoutFrequency || 'weekly',
    gstPercent: settings.gstPercent || 18,
    allowPartialPayments: settings.allowPartialPayments ?? false,
    allowCashPayments: settings.allowCashPayments ?? true,
    allowWalletPayments: settings.allowWalletPayments ?? true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          Payment Settings
        </CardTitle>
        <CardDescription>Configure payment processing and commissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Platform Commission (%)</Label>
            <Input 
              type="number"
              value={form.defaultCommissionPercent}
              onChange={(e) => setForm({ ...form, defaultCommissionPercent: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Commission on each booking</p>
          </div>
          <div>
            <Label>Min Payout Amount (₹)</Label>
            <Input 
              type="number"
              value={form.minPayoutAmountPaisa / 100}
              onChange={(e) => setForm({ ...form, minPayoutAmountPaisa: parseFloat(e.target.value) * 100 })}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum for salon payout</p>
          </div>
          <div>
            <Label>GST Rate (%)</Label>
            <Input 
              type="number"
              value={form.gstPercent}
              onChange={(e) => setForm({ ...form, gstPercent: parseFloat(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <Label>Payout Frequency</Label>
          <Select value={form.payoutFrequency} onValueChange={(v) => setForm({ ...form, payoutFrequency: v })}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Razorpay Enabled</p>
              <p className="text-sm text-gray-500">Accept online payments via Razorpay</p>
            </div>
            <Switch 
              checked={form.razorpayEnabled}
              onCheckedChange={(checked) => setForm({ ...form, razorpayEnabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Allow Cash Payments</p>
              <p className="text-sm text-gray-500">Pay at salon after service</p>
            </div>
            <Switch 
              checked={form.allowCashPayments}
              onCheckedChange={(checked) => setForm({ ...form, allowCashPayments: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Allow Wallet Payments</p>
              <p className="text-sm text-gray-500">Pay using platform wallet</p>
            </div>
            <Switch 
              checked={form.allowWalletPayments}
              onCheckedChange={(checked) => setForm({ ...form, allowWalletPayments: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Allow Partial Payments</p>
              <p className="text-sm text-gray-500">Split payment methods</p>
            </div>
            <Switch 
              checked={form.allowPartialPayments}
              onCheckedChange={(checked) => setForm({ ...form, allowPartialPayments: checked })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CommunicationSettingsSection({ settings, onSave, isLoading }: { settings: any; onSave: (data: any) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    sendGridEnabled: settings.sendGridEnabled ?? false,
    twilioEnabled: settings.twilioEnabled ?? false,
    enableEmailNotifications: settings.enableEmailNotifications ?? true,
    enableSmsNotifications: settings.enableSmsNotifications ?? true,
    enablePushNotifications: settings.enablePushNotifications ?? true,
    bookingConfirmationEmail: settings.bookingConfirmationEmail ?? true,
    bookingReminderHoursBefore: settings.bookingReminderHoursBefore || 24,
    marketingEmailsEnabled: settings.marketingEmailsEnabled ?? false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-purple-600" />
          Communication Settings
        </CardTitle>
        <CardDescription>Configure email, SMS, and notification settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
            <div>
              <p className="font-medium">SendGrid Email</p>
              <p className="text-sm text-gray-500">Transactional email delivery</p>
            </div>
            <Switch 
              checked={form.sendGridEnabled}
              onCheckedChange={(checked) => setForm({ ...form, sendGridEnabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
            <div>
              <p className="font-medium">Twilio SMS/WhatsApp</p>
              <p className="text-sm text-gray-500">SMS and WhatsApp messaging</p>
            </div>
            <Switch 
              checked={form.twilioEnabled}
              onCheckedChange={(checked) => setForm({ ...form, twilioEnabled: checked })}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Email Notifications</p>
            </div>
            <Switch 
              checked={form.enableEmailNotifications}
              onCheckedChange={(checked) => setForm({ ...form, enableEmailNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">SMS Notifications</p>
            </div>
            <Switch 
              checked={form.enableSmsNotifications}
              onCheckedChange={(checked) => setForm({ ...form, enableSmsNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Push Notifications</p>
            </div>
            <Switch 
              checked={form.enablePushNotifications}
              onCheckedChange={(checked) => setForm({ ...form, enablePushNotifications: checked })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Booking Reminder (hours before)</Label>
            <Input 
              type="number"
              value={form.bookingReminderHoursBefore}
              onChange={(e) => setForm({ ...form, bookingReminderHoursBefore: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-gray-500">Promotional campaigns</p>
            </div>
            <Switch 
              checked={form.marketingEmailsEnabled}
              onCheckedChange={(checked) => setForm({ ...form, marketingEmailsEnabled: checked })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySettingsSection({ settings, onSave, isLoading }: { settings: any; onSave: (data: any) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    minPasswordLength: settings.minPasswordLength || 8,
    requirePasswordUppercase: settings.requirePasswordUppercase ?? true,
    requirePasswordNumber: settings.requirePasswordNumber ?? true,
    requirePasswordSpecial: settings.requirePasswordSpecial ?? false,
    sessionTimeoutMins: settings.sessionTimeoutMins || 1440,
    maxLoginAttempts: settings.maxLoginAttempts || 5,
    lockoutDurationMins: settings.lockoutDurationMins || 30,
    require2FAForAdmin: settings.require2FAForAdmin ?? false,
    enableAuditLogs: settings.enableAuditLogs ?? true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-purple-600" />
          Security Settings
        </CardTitle>
        <CardDescription>Password policies, session management, and security features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">Changes to security settings may affect all users. Review carefully before saving.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Min Password Length</Label>
            <Input 
              type="number"
              value={form.minPasswordLength}
              onChange={(e) => setForm({ ...form, minPasswordLength: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Session Timeout (minutes)</Label>
            <Input 
              type="number"
              value={form.sessionTimeoutMins}
              onChange={(e) => setForm({ ...form, sessionTimeoutMins: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Max Login Attempts</Label>
            <Input 
              type="number"
              value={form.maxLoginAttempts}
              onChange={(e) => setForm({ ...form, maxLoginAttempts: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Require Uppercase</p>
              <p className="text-sm text-gray-500">At least one capital letter</p>
            </div>
            <Switch 
              checked={form.requirePasswordUppercase}
              onCheckedChange={(checked) => setForm({ ...form, requirePasswordUppercase: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Require Number</p>
              <p className="text-sm text-gray-500">At least one digit</p>
            </div>
            <Switch 
              checked={form.requirePasswordNumber}
              onCheckedChange={(checked) => setForm({ ...form, requirePasswordNumber: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Require Special Character</p>
              <p className="text-sm text-gray-500">At least one special character</p>
            </div>
            <Switch 
              checked={form.requirePasswordSpecial}
              onCheckedChange={(checked) => setForm({ ...form, requirePasswordSpecial: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">2FA for Admin</p>
              <p className="text-sm text-gray-500">Require two-factor auth</p>
            </div>
            <Switch 
              checked={form.require2FAForAdmin}
              onCheckedChange={(checked) => setForm({ ...form, require2FAForAdmin: checked })}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureFlagsSection({ settings, descriptions, onToggle, isLoading }: { 
  settings: Record<string, boolean>; 
  descriptions: Record<string, string>;
  onToggle: (feature: string, enabled: boolean) => void;
  isLoading: boolean;
}) {
  const defaultFeatures = {
    enableEvents: true,
    enableShop: true,
    enableLoyalty: true,
    enableReferrals: true,
    enableAIConsultant: true,
    enableJobCards: true,
    enableMetaIntegration: true,
    enableSmartRebooking: true,
    enableGiftCards: true,
    enableCustomerImport: true,
    enableReviews: true,
    enableWaitlist: false,
    enableDynamicPricing: false,
  };

  const features = { ...defaultFeatures, ...settings };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Feature Flags
        </CardTitle>
        <CardDescription>Enable or disable platform features globally</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(features).map(([key, enabled]) => (
            <div 
              key={key}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg transition-colors",
                enabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              )}
            >
              <div>
                <p className="font-medium capitalize">{key.replace('enable', '').replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-sm text-gray-500">{descriptions[key] || 'Feature toggle'}</p>
              </div>
              <Switch 
                checked={enabled}
                onCheckedChange={(checked) => onToggle(key, checked)}
                disabled={isLoading}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BrandingSettingsSection({ settings, onSave, isLoading }: { settings: any; onSave: (data: any) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    primaryColor: settings.primaryColor || '#8B5CF6',
    secondaryColor: settings.secondaryColor || '#EC4899',
    logoUrl: settings.logoUrl || '',
    faviconUrl: settings.faviconUrl || '',
    footerText: settings.footerText || '© 2025 SalonHub. All rights reserved.',
    showPoweredBy: settings.showPoweredBy ?? true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-600" />
          Branding Settings
        </CardTitle>
        <CardDescription>Customize the look and feel of your platform</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color"
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input 
                value={form.primaryColor}
                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color"
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="w-16 h-10 p-1"
              />
              <Input 
                value={form.secondaryColor}
                onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Logo URL</Label>
            <Input 
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div>
            <Label>Favicon URL</Label>
            <Input 
              value={form.faviconUrl}
              onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
              placeholder="https://example.com/favicon.ico"
            />
          </div>
        </div>
        <div>
          <Label>Footer Text</Label>
          <Input 
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Show "Powered by SalonHub"</p>
            <p className="text-sm text-gray-500">Display attribution in footer</p>
          </div>
          <Switch 
            checked={form.showPoweredBy}
            onCheckedChange={(checked) => setForm({ ...form, showPoweredBy: checked })}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(form)} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceSection({ settings, onToggle, isLoading }: { 
  settings: any; 
  onToggle: (enabled: boolean, message?: string, endTime?: string) => void;
  isLoading: boolean;
}) {
  const [message, setMessage] = useState(settings.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.');
  const [endTime, setEndTime] = useState(settings.maintenanceEndTime || '');
  const isEnabled = settings.maintenanceMode ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-purple-600" />
          Maintenance Mode
        </CardTitle>
        <CardDescription>Control platform availability during maintenance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={cn(
          "p-6 rounded-lg border-2 transition-colors",
          isEnabled ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"
        )}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{isEnabled ? 'Maintenance Mode is ON' : 'Platform is Live'}</h3>
              <p className="text-sm text-gray-600">
                {isEnabled 
                  ? 'Users will see the maintenance message when accessing the platform' 
                  : 'The platform is accessible to all users'}
              </p>
            </div>
            <Switch 
              checked={isEnabled}
              onCheckedChange={(checked) => onToggle(checked, message, endTime)}
              disabled={isLoading}
              className="scale-125"
            />
          </div>
        </div>
        <div>
          <Label>Maintenance Message</Label>
          <Textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        <div>
          <Label>Expected End Time (optional)</Label>
          <Input 
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        {isEnabled && (
          <div className="flex justify-end">
            <Button onClick={() => onToggle(true, message, endTime)} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Message'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Subscription Tiers Management Page Component - Industry Level
function SubscriptionTiersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingTier, setEditingTier] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});

  // Fetch tiers with analytics
  const { data: tiersData, isLoading: tiersLoading, refetch: refetchTiers } = useQuery({
    queryKey: ['/api/subscriptions/admin/tiers'],
  });

  // Fetch subscription analytics
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['/api/subscriptions/admin/analytics'],
  });

  // Fetch active subscriptions
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/subscriptions/admin/subscriptions'],
  });

  // Update tier mutation
  const updateTierMutation = useMutation({
    mutationFn: async ({ tierId, data }: { tierId: string; data: any }) => {
      const res = await fetch(`/api/subscriptions/admin/tiers/${tierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update tier');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Subscription tier updated successfully.' });
      setEditingTier(null);
      refetchTiers();
      refetchAnalytics();
    },
    onError: (error: any) => {
      toast({ title: 'Update Failed', description: error.message, variant: 'destructive' });
    },
  });

  // Create tier mutation
  const createTierMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/subscriptions/admin/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create tier');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'New subscription tier created.' });
      setShowCreateDialog(false);
      refetchTiers();
    },
    onError: (error: any) => {
      toast({ title: 'Creation Failed', description: error.message, variant: 'destructive' });
    },
  });

  const tiers = (tiersData as any)?.tiers || [];
  const analytics = (analyticsData as any)?.overview || {};
  const subscriptions = (subscriptionsData as any)?.subscriptions || [];

  const formatPrice = (paisa: number) => {
    if (!paisa) return '₹0';
    return `₹${(paisa / 100).toLocaleString('en-IN')}`;
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName) {
      case 'free': return <Layers className="w-5 h-5" />;
      case 'growth': return <Zap className="w-5 h-5" />;
      case 'elite': return <Crown className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getTierGradient = (tierName: string) => {
    switch (tierName) {
      case 'free': return 'from-gray-100 to-gray-200';
      case 'growth': return 'from-blue-500 to-purple-600';
      case 'elite': return 'from-amber-400 to-orange-600';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  const featureLabels: Record<string, { label: string; description: string }> = {
    instagramBooking: { label: 'Instagram Booking', description: 'Accept bookings via Instagram' },
    facebookBooking: { label: 'Facebook Booking', description: 'Accept bookings via Facebook' },
    messengerBot: { label: 'Messenger Bot', description: 'Automated chat assistant' },
    reserveWithGoogle: { label: 'Reserve with Google', description: 'Book from Google Search/Maps' },
    customBranding: { label: 'Custom Branding', description: 'White-label your booking page' },
    prioritySupport: { label: 'Priority Support', description: '24/7 dedicated support' },
    analyticsAdvanced: { label: 'Advanced Analytics', description: 'Deep business insights' },
    apiAccess: { label: 'API Access', description: 'Build custom integrations' },
  };

  const toggleTierExpand = (tierId: string) => {
    setExpandedTiers(prev => ({ ...prev, [tierId]: !prev[tierId] }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-purple-600" />
            Subscription Management
          </h2>
          <p className="text-gray-600 mt-1">Configure pricing, features, and billing for all subscription tiers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { refetchTiers(); refetchAnalytics(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-rose-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Subscription Tier</DialogTitle>
                <DialogDescription>Add a new pricing tier for your platform</DialogDescription>
              </DialogHeader>
              <CreateTierForm 
                onSubmit={(data) => createTierMutation.mutate(data)} 
                isLoading={createTierMutation.isPending} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatPrice(analytics.totalMonthlyRevenuePaisa || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Annual: {formatPrice(analytics.totalAnnualRevenuePaisa || 0)}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Subscriptions</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalActive || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Trialing: {analytics.totalTrialing || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New (30 days)</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.newSubscriptions30Days || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Growth metric
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Churn (30 days)</p>
                <p className="text-2xl font-bold text-red-600">{analytics.cancellations30Days || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Past due: {analytics.totalPastDue || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Tier Overview
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <IndianRupee className="w-4 h-4" />
            Pricing & Features
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="w-4 h-4" />
            Subscribers
          </TabsTrigger>
        </TabsList>

        {/* Tier Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          {tiersLoading ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
              Loading tiers...
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {tiers.map((tier: any) => (
                <Card 
                  key={tier.id} 
                  className={cn(
                    "relative overflow-hidden transition-all hover:shadow-lg",
                    tier.isActive === 0 && "opacity-60"
                  )}
                >
                  {/* Tier Header Gradient */}
                  <div className={cn(
                    "h-24 bg-gradient-to-br flex items-center justify-center",
                    getTierGradient(tier.name)
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center",
                      tier.name === 'free' ? 'bg-white/30 text-gray-700' : 'bg-white/20 text-white'
                    )}>
                      {getTierIcon(tier.name)}
                    </div>
                  </div>

                  <CardContent className="pt-4">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold">{tier.displayName}</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatPrice(tier.monthlyPricePaisa)}
                        <span className="text-sm font-normal text-gray-500">/mo</span>
                      </p>
                      {tier.yearlyPricePaisa > 0 && (
                        <p className="text-sm text-gray-500">
                          or {formatPrice(tier.yearlyPricePaisa)}/year
                        </p>
                      )}
                    </div>

                    {/* Subscriber Stats */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{tier.subscribers?.total || 0}</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{tier.subscribers?.active || 0}</p>
                          <p className="text-xs text-gray-500">Active</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-600">{tier.subscribers?.trialing || 0}</p>
                          <p className="text-xs text-gray-500">Trialing</p>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Revenue */}
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg mb-4">
                      <span className="text-sm text-gray-600">Monthly Revenue</span>
                      <span className="font-bold text-green-600">{formatPrice(tier.monthlyRevenuePaisa || 0)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setEditingTier(tier)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant={tier.isActive ? "ghost" : "secondary"}
                        size="icon"
                        onClick={() => updateTierMutation.mutate({ 
                          tierId: tier.id, 
                          data: { isActive: !tier.isActive }
                        })}
                        disabled={tier.name === 'free'}
                      >
                        {tier.isActive ? 
                          <ToggleRight className="w-5 h-5 text-green-600" /> : 
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        }
                      </Button>
                    </div>

                    {!tier.isActive && (
                      <Badge variant="secondary" className="w-full justify-center mt-2">
                        Inactive
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pricing & Features Tab */}
        <TabsContent value="pricing" className="mt-6 space-y-4">
          {tiers.map((tier: any) => (
            <Card key={tier.id} className={cn(tier.isActive === 0 && "opacity-60")}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleTierExpand(tier.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                      getTierGradient(tier.name)
                    )}>
                      <span className={cn(tier.name === 'free' ? 'text-gray-700' : 'text-white')}>
                        {getTierIcon(tier.name)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tier.displayName}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatPrice(tier.monthlyPricePaisa)}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                      <p className="text-sm text-gray-500">{formatPrice(tier.yearlyPricePaisa)}/yr</p>
                    </div>
                    <Badge variant={tier.isActive ? "default" : "secondary"}>
                      {tier.subscribers?.active || 0} active
                    </Badge>
                    {expandedTiers[tier.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </CardHeader>

              {expandedTiers[tier.id] && (
                <CardContent className="border-t pt-4 space-y-6">
                  {/* Limits Section */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Usage Limits
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Max Staff</p>
                        <p className="text-xl font-bold">{tier.limits?.maxStaff === -1 ? 'Unlimited' : tier.limits?.maxStaff || 0}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Max Services</p>
                        <p className="text-xl font-bold">{tier.limits?.maxServices === -1 ? 'Unlimited' : tier.limits?.maxServices || 0}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Max Locations</p>
                        <p className="text-xl font-bold">{tier.limits?.maxLocations || 1}</p>
                      </div>
                    </div>
                  </div>

                  {/* Features Section */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Features
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(featureLabels).map(([key, { label, description }]) => {
                        const isEnabled = tier.features?.[key] === true;
                        return (
                          <div 
                            key={key}
                            className={cn(
                              "p-3 rounded-lg border transition-colors",
                              isEnabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {isEnabled ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-gray-400" />
                              )}
                              <span className={cn(
                                "text-sm font-medium",
                                isEnabled ? "text-gray-900" : "text-gray-500"
                              )}>
                                {label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => setEditingTier(tier)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit This Tier
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Active Subscriptions
              </CardTitle>
              <CardDescription>View and manage all salon subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading subscriptions...</div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active subscriptions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-gray-600">Salon</th>
                        <th className="pb-3 font-medium text-gray-600">Tier</th>
                        <th className="pb-3 font-medium text-gray-600">Status</th>
                        <th className="pb-3 font-medium text-gray-600">Billing Cycle</th>
                        <th className="pb-3 font-medium text-gray-600">Period End</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {subscriptions.map((sub: any) => (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="py-3">
                            <div>
                              <p className="font-medium text-gray-900">{sub.salonName}</p>
                              <p className="text-sm text-gray-500">{sub.salonCity}</p>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge className={cn(
                              sub.tierName === 'free' && "bg-gray-100 text-gray-700",
                              sub.tierName === 'growth' && "bg-blue-100 text-blue-700",
                              sub.tierName === 'elite' && "bg-amber-100 text-amber-700"
                            )}>
                              {sub.tierDisplayName}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant={
                              sub.status === 'active' ? 'default' :
                              sub.status === 'trialing' ? 'secondary' :
                              'destructive'
                            }>
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-gray-600 capitalize">{sub.billingCycle}</td>
                          <td className="py-3 text-gray-600">
                            {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Tier Dialog */}
      <Dialog open={!!editingTier} onOpenChange={(open) => !open && setEditingTier(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                getTierGradient(editingTier?.name || 'free')
              )}>
                <span className={cn(editingTier?.name === 'free' ? 'text-gray-700' : 'text-white')}>
                  {getTierIcon(editingTier?.name || 'free')}
                </span>
              </div>
              Edit {editingTier?.displayName} Tier
            </DialogTitle>
            <DialogDescription>Configure pricing, limits, and features for this subscription tier</DialogDescription>
          </DialogHeader>
          {editingTier && (
            <EditTierForm 
              tier={editingTier}
              onSubmit={(data) => updateTierMutation.mutate({ tierId: editingTier.id, data })}
              onCancel={() => setEditingTier(null)}
              isLoading={updateTierMutation.isPending}
              featureLabels={featureLabels}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Tier Form Component
function CreateTierForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    monthlyPricePaisa: 0,
    yearlyPricePaisa: 0,
    sortOrder: 99,
    features: {},
    limits: { maxStaff: 3, maxServices: 10, maxLocations: 1 },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Tier Name (slug)</Label>
          <Input 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
            placeholder="premium"
            required
          />
        </div>
        <div>
          <Label>Display Name</Label>
          <Input 
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Premium"
            required
          />
        </div>
      </div>
      
      <div>
        <Label>Description</Label>
        <Textarea 
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Perfect for growing salons..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Monthly Price (₹)</Label>
          <Input 
            type="number"
            value={formData.monthlyPricePaisa / 100}
            onChange={(e) => setFormData({ ...formData, monthlyPricePaisa: parseFloat(e.target.value) * 100 })}
          />
        </div>
        <div>
          <Label>Yearly Price (₹)</Label>
          <Input 
            type="number"
            value={formData.yearlyPricePaisa / 100}
            onChange={(e) => setFormData({ ...formData, yearlyPricePaisa: parseFloat(e.target.value) * 100 })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Tier'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Edit Tier Form Component  
function EditTierForm({ 
  tier, 
  onSubmit, 
  onCancel, 
  isLoading,
  featureLabels 
}: { 
  tier: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
  isLoading: boolean;
  featureLabels: Record<string, { label: string; description: string }>;
}) {
  const [formData, setFormData] = useState({
    displayName: tier.displayName || '',
    description: tier.description || '',
    monthlyPricePaisa: tier.monthlyPricePaisa || 0,
    yearlyPricePaisa: tier.yearlyPricePaisa || 0,
    features: tier.features || {},
    limits: tier.limits || { maxStaff: 3, maxServices: 10, maxLocations: 1 },
    isActive: tier.isActive === 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleFeature = (key: string) => {
    setFormData({
      ...formData,
      features: { ...formData.features, [key]: !formData.features[key] }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Basic Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Display Name</Label>
            <Input 
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              disabled={tier.name === 'free'}
            />
          </div>
          <div className="flex items-center gap-4 pt-6">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              disabled={tier.name === 'free'}
            />
            <Label>Active</Label>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Pricing</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Monthly Price (₹)</Label>
            <Input 
              type="number"
              value={formData.monthlyPricePaisa / 100}
              onChange={(e) => setFormData({ ...formData, monthlyPricePaisa: parseFloat(e.target.value) * 100 || 0 })}
              disabled={tier.name === 'free'}
            />
          </div>
          <div>
            <Label>Yearly Price (₹)</Label>
            <Input 
              type="number"
              value={formData.yearlyPricePaisa / 100}
              onChange={(e) => setFormData({ ...formData, yearlyPricePaisa: parseFloat(e.target.value) * 100 || 0 })}
              disabled={tier.name === 'free'}
            />
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Usage Limits</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Max Staff (-1 = unlimited)</Label>
            <Input 
              type="number"
              value={formData.limits.maxStaff}
              onChange={(e) => setFormData({ 
                ...formData, 
                limits: { ...formData.limits, maxStaff: parseInt(e.target.value) || 0 }
              })}
            />
          </div>
          <div>
            <Label>Max Services (-1 = unlimited)</Label>
            <Input 
              type="number"
              value={formData.limits.maxServices}
              onChange={(e) => setFormData({ 
                ...formData, 
                limits: { ...formData.limits, maxServices: parseInt(e.target.value) || 0 }
              })}
            />
          </div>
          <div>
            <Label>Max Locations</Label>
            <Input 
              type="number"
              value={formData.limits.maxLocations}
              onChange={(e) => setFormData({ 
                ...formData, 
                limits: { ...formData.limits, maxLocations: parseInt(e.target.value) || 1 }
              })}
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Features</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(featureLabels).map(([key, { label, description }]) => (
            <div 
              key={key}
              className={cn(
                "p-3 rounded-lg border cursor-pointer transition-all",
                formData.features[key] ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200 hover:border-gray-300"
              )}
              onClick={() => toggleFeature(key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <Switch checked={!!formData.features[key]} onCheckedChange={() => toggleFeature(key)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}
