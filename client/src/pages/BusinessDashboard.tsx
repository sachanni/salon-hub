import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSalonSetupStatus } from "@/hooks/useSalonSetupStatus";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { 
  Building, 
  Scissors, 
  Users, 
  Settings, 
  Camera,
  CheckCircle,
  ArrowRight,
  BarChart,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Package,
  Home,
  ChevronDown,
  Menu,
  Cog,
  MapPin,
  Sparkles,
  Bell,
  Star,
  Gift,
  Zap,
  Crown,
  UserCircle,
  LogOut,
  ChevronRight,
  Plus,
  Check,
  Trash2
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useLocation } from "wouter";
import type { Salon } from "@/../../shared/schema";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import FinancialReportingDashboard from "@/components/FinancialReportingDashboard";
import CustomerCommunicationDashboard from "@/components/CustomerCommunicationDashboard";
import InventoryManagementDashboard from "@/components/InventoryManagementDashboard";
import CalendarManagement from "@/pages/CalendarManagement";
import PackageManagement from "@/components/business-dashboard/PackageManagement";

// Type definitions for completion data
interface CompletionData {
  profile: { isComplete: boolean; missingFields?: string[] };
  services: { isComplete: boolean; count: number };
  staff: { isComplete: boolean; count: number };
  settings: { isComplete: boolean; missingFields?: string[] };
  media: { isComplete: boolean; count: number };
  overallProgress: number;
  nextStep?: string;
}

// Type definitions for analytics data
interface TrendData {
  percentage: string;
  direction: 'up' | 'down' | 'neutral';
}

interface AnalyticsOverview {
  todayBookings: number;
  todayRevenuePaisa: number;
  totalRevenuePaisa: number;
  activeStaffCount: number;
  totalBookings: number;
  averageBookingValuePaisa: number;
  bookingsTrend: TrendData;
  revenueTrend: TrendData;
  averageValueTrend: TrendData;
  cancellationRate?: string;
  cancelledBookings?: number;
  completedBookings?: number;
  confirmedBookings?: number;
}

interface PopularService {
  id: string;
  name: string;
  bookingCount: number;
  revenuePaisa: number;
}

interface StaffPerformance {
  id: string;
  name: string;
  bookingCount: number;
  revenuePaisa: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  popularServices?: PopularService[];
  staffPerformance?: StaffPerformance[];
  bookingTrends?: BookingTrend[];
}

// Import step components - Use the same components as BusinessSetup
import BusinessInfoStep from "@/components/business-setup/BusinessInfoStep";
import LocationContactStep from "@/components/business-setup/LocationContactStep";
import ServicesStep from "@/components/business-setup/ServicesStep";
import StaffStep from "@/components/business-setup/StaffStep";
import ResourcesStep from "@/components/business-setup/ResourcesStep";
import BookingSettingsStep from "@/components/business-setup/BookingSettingsStep";
import PaymentSetupStep from "@/components/business-setup/PaymentSetupStep";
import MediaStep from "@/components/business-setup/MediaStep";
import ReviewPublishStep from "@/components/business-setup/ReviewPublishStep";

export default function BusinessDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [salonId, setSalonId] = useState<string | null>(() => {
    // Try to get salon ID from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedSalonId');
    }
    return null;
  });
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salonToDelete, setSalonToDelete] = useState<Salon | null>(null);
  const isMobile = useIsMobile();

  // Fetch user's salons
  const { data: salons, isLoading: salonsLoading } = useQuery({
    queryKey: ['/api/my/salons'],
    enabled: isAuthenticated,
    staleTime: 60000
  });

  // Delete salon mutation
  const deleteSalonMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/salons/${id}`);
    },
    onSuccess: (data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/salons'] });
      
      // If we deleted the currently selected salon, switch to another one
      if (deletedId === salonId && Array.isArray(salons)) {
        const remainingSalons = salons.filter((s: Salon) => s.id !== deletedId);
        if (remainingSalons.length > 0) {
          handleSalonSwitch(remainingSalons[0].id);
        }
      }
      
      toast({
        title: "Salon Deleted",
        description: "The salon has been successfully deleted.",
      });
      
      setDeleteDialogOpen(false);
      setSalonToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete salon. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set salon ID with localStorage persistence
  useEffect(() => {
    if (Array.isArray(salons) && salons.length > 0) {
      // Check if stored salon ID is valid
      const storedId = localStorage.getItem('selectedSalonId');
      const isValidStoredId = storedId && salons.some(s => s.id === storedId);
      
      if (!salonId) {
        // Use stored ID if valid, otherwise use first salon
        const idToUse = isValidStoredId ? storedId : salons[0].id;
        setSalonId(idToUse);
        localStorage.setItem('selectedSalonId', idToUse);
      } else if (!isValidStoredId && salonId !== salons[0].id) {
        // If current salon is not in the list, switch to first salon
        setSalonId(salons[0].id);
        localStorage.setItem('selectedSalonId', salons[0].id);
      }
    }
  }, [salons, salonId]);

  // Handler for salon switching
  const handleSalonSwitch = (value: string) => {
    if (value === '__create_new__') {
      // Redirect to business setup to create new salon
      setLocation('/business/setup');
      return;
    }
    
    setSalonId(value);
    localStorage.setItem('selectedSalonId', value);
    toast({
      title: "Salon Switched",
      description: "You're now viewing a different salon location",
    });
  };

  // Use centralized completion service
  const { data: completionData } = useQuery<CompletionData>({
    queryKey: ['/api/salons', salonId, 'dashboard-completion'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch setup status from new unified API
  const { data: setupStatus, isLoading: setupStatusLoading } = useSalonSetupStatus(salonId);

  // Keep individual data queries for components that still need them
  const { data: salonData } = useQuery<Salon>({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: services } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: staff } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: bookingSettings } = useQuery({
    queryKey: ['/api/salons', salonId, 'booking-settings'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: mediaAssets } = useQuery({
    queryKey: ['/api/salons', salonId, 'media-assets'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch real analytics data with proper query key invalidation
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    isError: isAnalyticsError 
  } = useQuery<AnalyticsData>({
    queryKey: ['/api/salons', salonId, 'analytics', selectedPeriod],
    queryFn: async () => {
      const params = new URLSearchParams({ period: selectedPeriod });
      const response = await fetch(`/api/salons/${salonId}/analytics?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!salonId && !!selectedPeriod,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000
  });

  // Use centralized completion logic instead of ad-hoc checks
  const isProfileComplete = completionData?.profile?.isComplete ?? false;
  const hasServices = completionData?.services?.isComplete ?? false;
  const hasStaff = completionData?.staff?.isComplete ?? false;
  const hasSettings = completionData?.settings?.isComplete ?? false;
  const hasMedia = completionData?.media?.isComplete ?? false;
  const completionPercentage = completionData?.overallProgress ?? 0;
  const nextStep = completionData?.nextStep;

  // Helper functions for formatting and trends
  const formatCurrency = (paisa: number) => {
    const rupees = paisa / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rupees);
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Extract analytics data with fallbacks
  const overview: Partial<AnalyticsOverview> = analyticsData?.overview || {};
  const todayBookings = overview.todayBookings || 0;
  const todayRevenue = overview.todayRevenuePaisa || 0;
  const totalRevenue = overview.totalRevenuePaisa || 0;
  const activeStaff = overview.activeStaffCount || 0;
  const totalBookings = overview.totalBookings || 0;
  const averageBookingValue = overview.averageBookingValuePaisa || 0;
  
  const bookingsTrend = overview.bookingsTrend || { percentage: '0.0', direction: 'neutral' };
  const revenueTrend = overview.revenueTrend || { percentage: '0.0', direction: 'neutral' };
  const averageValueTrend = overview.averageValueTrend || { percentage: '0.0', direction: 'neutral' };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Link href="/login/business"><Button>Log In</Button></Link>
        </div>
      </div>
    );
  }

  if (salonsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Auto-redirect to setup if no business found
  if (!Array.isArray(salons) || salons.length === 0) {
    setLocation('/business/setup');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleStepComplete = async (data?: any) => {
    // Invalidate completion cache to refresh indicators
    await queryClient.invalidateQueries({ 
      queryKey: ['/api/salons', salonId, 'dashboard-completion'] 
    });
    
    // No automatic redirect - let user control navigation
    toast({
      title: "Step Completed",
      description: "Great progress! You can now move to the next step.",
    });
  };

  // Navigation structure with grouped sections - Industry Standard Approach
  const navigationSections = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      items: [
        { id: "overview", label: "Dashboard", icon: BarChart }
      ]
    },
    {
      id: "operations",
      label: "Operations",
      icon: Calendar,
      items: [
        { id: "calendar", label: "Bookings & Calendar", icon: Calendar },
        { id: "inventory", label: "Inventory Management", icon: Package }
      ]
    },
    {
      id: "business",
      label: "Business Setup & Management",
      icon: Building,
      items: [
        { id: "business-info", label: "Business Info", icon: Building, isComplete: isProfileComplete, isSetup: true },
        { id: "location-contact", label: "Location & Contact", icon: MapPin, isComplete: isProfileComplete, isSetup: true },
        { id: "services", label: "Services & Pricing", icon: Scissors, isComplete: hasServices, isSetup: true },
        { id: "packages", label: "Package & Combos", icon: Gift, isComplete: false, isSetup: false },
        { id: "staff", label: "Staff Management", icon: Users, isComplete: hasStaff, isSetup: true },
        { id: "resources", label: "Resources & Equipment", icon: Settings, isComplete: false, isSetup: false, isOptional: true },
        { id: "booking-settings", label: "Booking Settings", icon: Cog, isComplete: hasSettings, isSetup: true },
        { id: "payment-setup", label: "Payment Setup", icon: CreditCard, isComplete: false, isSetup: false, isOptional: true },
        { id: "media", label: "Media Gallery", icon: Camera, isComplete: hasMedia, isSetup: true },
        { id: "publish", label: "Publish Business", icon: CheckCircle, progress: completionPercentage, isSetup: true }
      ]
    },
    {
      id: "analytics",
      label: "Analytics & Reports",
      icon: BarChart,
      items: [
        { id: "analytics", label: "Advanced Analytics", icon: TrendingUp },
        { id: "financials", label: "Financial Reports", icon: CreditCard }
      ]
    },
    {
      id: "communications",
      label: "Communications",
      icon: MessageSquare,
      items: [
        { id: "communications", label: "Customer Communications", icon: MessageSquare }
      ]
    }
  ];

  // Stunning Sidebar navigation component with WOW factors
  const SidebarNavigation = () => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 17) return "Good Afternoon";
      return "Good Evening";
    };

    const servicesCount = services?.length || 0;
    const staffCount = staff?.length || 0;
    const todayBookingsCount = todayBookings || 0;

    return (
      <Sidebar collapsible="icon" className="border-r-0 h-screen flex flex-col">
        {/* Premium Profile Section - Compact */}
        <SidebarHeader className="flex-shrink-0 border-none bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-3 pt-4 group-data-[collapsible=icon]:p-2">
          <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
            {/* User Avatar & Greeting */}
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/40 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                  <UserCircle className="h-6 w-6 text-white group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white group-data-[collapsible=icon]:h-2.5 group-data-[collapsible=icon]:w-2.5" />
              </div>
              
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-[10px] font-medium text-white/90">{getGreeting()}</p>
                <p className="text-sm font-bold text-white truncate">{user?.username || 'Business Owner'}</p>
                <p className="text-[10px] text-white/80 truncate flex items-center gap-1">
                  <Building className="h-2.5 w-2.5" />
                  {salonData?.name || 'Your Business'}
                </p>
              </div>
            </div>

            {/* Quick Stats - Compact */}
            <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-white/20 group-data-[collapsible=icon]:hidden">
              <div className="text-center">
                <p className="text-base font-bold text-white">{todayBookingsCount}</p>
                <p className="text-[9px] text-white/80">Today</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">{servicesCount}</p>
                <p className="text-[9px] text-white/80">Services</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-white">{staffCount}</p>
                <p className="text-[9px] text-white/80">Team</p>
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-1">
              {/* Quick Actions Panel - Compact */}
              <div className="mb-3 group-data-[collapsible=icon]:hidden">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Zap className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-[10px] font-semibold text-blue-900">Quick Actions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => setActiveTab('calendar')}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 rounded-md border border-blue-100 transition-all text-[10px] font-medium text-blue-700 hover:shadow-sm"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Book</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('services')}
                      className="flex items-center justify-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 rounded-md border border-blue-100 transition-all text-[10px] font-medium text-blue-700 hover:shadow-sm"
                    >
                      <Scissors className="h-3 w-3" />
                      <span>Services</span>
                    </button>
                  </div>
                </div>
              </div>

              <Accordion type="multiple" defaultValue={["overview", "business", "operations"]} className="w-full space-y-1">
                {navigationSections.map((section) => (
                  section.items.length === 1 ? (
                    // Single item sections (no accordion)
                    <div key={section.id}>
                      <SidebarGroup>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                onClick={() => setActiveTab(section.items[0].id)}
                                isActive={activeTab === section.items[0].id}
                                tooltip={section.label}
                                className={`w-full justify-start h-10 rounded-lg transition-all ${
                                  activeTab === section.items[0].id 
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md hover:shadow-lg' 
                                    : 'hover:bg-violet-50 hover:text-violet-700'
                                }`}
                                data-testid={`nav-${section.items[0].id}`}
                              >
                                <section.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden font-medium">{section.label}</span>
                                {activeTab === section.items[0].id && (
                                  <ChevronRight className="h-4 w-4 ml-auto group-data-[collapsible=icon]:hidden" />
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                    </div>
                  ) : (
                    // Multi-item sections (with accordion)
                    <AccordionItem key={section.id} value={section.id} className="border-none">
                      <AccordionTrigger className="group-data-[collapsible=icon]:justify-center px-3 py-2 hover:no-underline hover:bg-violet-50 rounded-lg transition-colors data-[state=open]:bg-violet-50">
                        <div className="flex items-center gap-2">
                          <section.icon className="h-4 w-4 text-violet-600" />
                          <span className="group-data-[collapsible=icon]:hidden text-sm font-semibold text-slate-700">
                            {section.label}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-1">
                        <SidebarGroup>
                          <SidebarGroupContent>
                            <SidebarMenu className="space-y-0.5">
                              {section.items.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                  <SidebarMenuItem key={item.id}>
                                    <SidebarMenuButton
                                      onClick={() => setActiveTab(item.id)}
                                      isActive={isActive}
                                      tooltip={item.label}
                                      className={`w-full justify-start ml-4 group-data-[collapsible=icon]:ml-0 h-9 rounded-lg transition-all ${
                                        isActive 
                                          ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm' 
                                          : 'hover:bg-violet-50/50'
                                      }`}
                                      data-testid={`nav-${item.id}`}
                                    >
                                      <item.icon className="h-4 w-4" />
                                      <span className="group-data-[collapsible=icon]:hidden flex items-center justify-between w-full text-sm">
                                        <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                                        <div className="flex items-center gap-1.5">
                                          {item.isComplete && (
                                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500/20">
                                              <CheckCircle className="h-3 w-3 text-green-600" title="Complete" />
                                            </div>
                                          )}
                                          {item.isSetup && !item.isComplete && (
                                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Setup required" />
                                          )}
                                          {item.isOptional && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                                              Optional
                                            </Badge>
                                          )}
                                          {'progress' in item && item.progress !== undefined && item.progress < 100 && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                                              {Math.round(item.progress)}%
                                            </Badge>
                                          )}
                                          {'progress' in item && item.progress === 100 && (
                                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500/20">
                                              <CheckCircle className="h-3 w-3 text-green-600" />
                                            </div>
                                          )}
                                          {isActive && (
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                          )}
                                        </div>
                                      </span>
                                    </SidebarMenuButton>
                                  </SidebarMenuItem>
                                );
                              })}
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup>
                      </AccordionContent>
                    </AccordionItem>
                  )
                ))}
              </Accordion>

              {/* Premium Features Teaser - Compact */}
              <div className="mt-3 group-data-[collapsible=icon]:hidden">
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 rounded-lg p-2 border border-amber-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Crown className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[10px] font-semibold text-amber-900">Premium Features</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-800">
                      <Star className="h-2.5 w-2.5 text-amber-500" />
                      <span>Advanced Analytics</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-800">
                      <Gift className="h-2.5 w-2.5 text-amber-500" />
                      <span>Loyalty Programs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-800">
                      <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                      <span>AI Recommendations</span>
                    </div>
                    <Button size="sm" variant="default" className="w-full mt-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm h-6 text-[10px]">
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>
    );
  };

  // Mobile navigation component
  const MobileNavigation = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Business Dashboard</span>
                <span className="text-xs text-muted-foreground">
                  {salonData?.name || 'Professional Management'}
                </span>
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <Accordion type="multiple" defaultValue={["overview", "business"]} className="w-full">
                {navigationSections.map((section) => (
                  section.items.length === 1 ? (
                    // Single item sections
                    <div key={section.id} className="mb-2">
                      <Button
                        variant={activeTab === section.items[0].id ? "default" : "ghost"}
                        onClick={() => setActiveTab(section.items[0].id)}
                        className="w-full justify-start"
                        data-testid={`mobile-nav-${section.items[0].id}`}
                      >
                        <section.icon className="h-4 w-4 mr-3" />
                        {section.label}
                      </Button>
                    </div>
                  ) : (
                    // Multi-item sections
                    <AccordionItem key={section.id} value={section.id} className="border-none">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-accent rounded-md">
                        <div className="flex items-center gap-3">
                          <section.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{section.label}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-1 ml-6">
                          {section.items.map((item) => (
                            <Button
                              key={item.id}
                              variant={activeTab === item.id ? "default" : "ghost"}
                              onClick={() => setActiveTab(item.id)}
                              className="w-full justify-start h-8"
                              data-testid={`mobile-nav-${item.id}`}
                            >
                              <item.icon className="h-4 w-4 mr-3" />
                              <span className="flex items-center gap-2 text-sm">
                                {item.label}
                                <div className="ml-auto flex items-center gap-1">
                                  {item.isComplete && (
                                    <CheckCircle className="h-3 w-3 text-green-500" title="Complete" />
                                  )}
                                  {item.isSetup && !item.isComplete && (
                                    <div className="h-2 w-2 rounded-full bg-orange-500" title="Setup required" />
                                  )}
                                  {item.isOptional && (
                                    <span className="text-xs text-blue-500" title="Optional">(Optional)</span>
                                  )}
                                  {!item.isSetup && !item.isOptional && item.isComplete === false && (
                                    <span className="text-xs text-red-500">*</span>
                                  )}
                                  {'progress' in item && item.progress !== undefined && item.progress < 100 && (
                                    <span className="text-xs text-amber-500">({Math.round(item.progress)}%)</span>
                                  )}
                                  {'progress' in item && item.progress === 100 && (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  )}
                                </div>
                              </span>
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );

  const renderTabContent = () => {
    if (activeTab === "overview") {
      return (
        <div className="p-6 space-y-6">
          {/* Setup Progress - Using Unified Setup Status API */}
          {setupStatus && !setupStatus.isSetupComplete && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">Complete Setup</CardTitle>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Complete all {setupStatus.totalSteps} steps to publish your salon
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Progress: {setupStatus.completedSteps} of {setupStatus.totalSteps} steps complete ({setupStatus.progress}%)
                  </span>
                </div>
                <Progress value={setupStatus.progress} className="h-2" />
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Required Steps:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.businessInfo.completed ? '✓' : '○'} Business Info
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.locationContact.completed ? '✓' : '○'} Location & Contact
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.services.completed ? '✓' : '○'} Services ({setupStatus.steps.services.count})
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.staff.completed ? '✓' : '○'} Team Members ({setupStatus.steps.staff.count})
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.bookingSettings.completed ? '✓' : '○'} Booking Settings
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.paymentSetup.completed ? '✓' : '○'} Payment Setup
                    </div>
                    <div className="flex items-center gap-1">
                      {setupStatus.steps.media.completed ? '✓' : '○'} Photos ({setupStatus.steps.media.count})
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      {setupStatus.steps.resources.completed ? '✓' : '○'} Resources (optional)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Complete all steps to publish your salon
                  </p>
                  <Link href="/business/setup">
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continue Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Setup Complete Message */}
          {setupStatus && setupStatus.isSetupComplete && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      🎉 Setup Complete!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your salon profile is ready to go live
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Period Filter and Export */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Business insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!analyticsData) return;
                      const exportData = {
                        period: selectedPeriod,
                        salon: salonData?.name || 'Salon',
                        exportDate: new Date().toISOString(),
                        overview: analyticsData.overview,
                        popularServices: analyticsData.popularServices,
                        staffPerformance: analyticsData.staffPerformance,
                        bookingTrends: analyticsData.bookingTrends
                      };
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                        type: 'application/json'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `salon-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      toast({
                        title: "Analytics Exported",
                        description: "Analytics data has been downloaded as JSON file for accounting/reporting."
                      });
                    }}
                    disabled={!analyticsData || analyticsLoading || isAnalyticsError}
                    data-testid="button-export-analytics"
                  >
                    Export Data
                  </Button>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={analyticsLoading}>
                    <SelectTrigger className="w-40" data-testid="select-period">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Error Handling */}
          {isAnalyticsError && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950" data-testid="alert-analytics-error">
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="flex items-center gap-2">
                  <span>⚠️ Failed to load analytics data</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 h-auto text-red-700 dark:text-red-300 underline"
                    onClick={() => window.location.reload()}
                    data-testid="button-retry-analytics"
                  >
                    Retry
                  </Button>
                </div>
                {analyticsError && (
                  <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                    {analyticsError instanceof Error ? analyticsError.message : 'Unknown error occurred'}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-950" data-testid="card-today-bookings">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">--</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Data unavailable</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Today's Bookings</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100" data-testid="text-today-bookings">
                          {todayBookings}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(bookingsTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(bookingsTrend.direction)}`}>
                            {bookingsTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Period total: {totalBookings}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950" data-testid="card-revenue">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-green-300 dark:bg-green-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-green-200 dark:bg-green-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-green-300 dark:bg-green-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Revenue
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">--</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Data unavailable</p>
                    </div>
                    <BarChart className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Revenue
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100" data-testid="text-revenue">
                          {formatCurrency(totalRevenue)}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(revenueTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(revenueTrend.direction)}`}>
                            {revenueTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Today: {formatCurrency(todayRevenue)}
                      </p>
                    </div>
                    <BarChart className="h-8 w-8 text-green-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-950" data-testid="card-staff">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                      <div className="h-8 w-12 bg-purple-300 dark:bg-purple-700 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-purple-200 dark:bg-purple-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-purple-300 dark:bg-purple-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">--</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">Data unavailable</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Staff</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="text-active-staff">
                        {activeStaff}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Available for bookings
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950" data-testid="card-avg-value">
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-orange-200 dark:bg-orange-800 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-orange-300 dark:bg-orange-700 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-orange-200 dark:bg-orange-800 rounded animate-pulse"></div>
                    </div>
                    <div className="h-8 w-8 bg-orange-300 dark:bg-orange-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Average Booking Value</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">--</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400">Data unavailable</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Average Booking Value</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100" data-testid="text-avg-value">
                          {formatCurrency(averageBookingValue)}
                        </p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(averageValueTrend.direction)}
                          <span className={`text-xs font-medium ${getTrendColor(averageValueTrend.direction)}`}>
                            {averageValueTrend.percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        From {totalBookings} bookings
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card data-testid="card-cancellation-rate">
              <CardHeader>
                <CardTitle className="text-base">Cancellation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-cancellation-rate">
                      {overview.cancellationRate || '0.00'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overview.cancelledBookings || 0} of {totalBookings} cancelled
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-completion-rate">
              <CardHeader>
                <CardTitle className="text-base">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-completion-rate">
                      {totalBookings > 0 ? ((overview.completedBookings || 0) / totalBookings * 100).toFixed(1) : '0.0'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {overview.completedBookings || 0} completed bookings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-confirmed-bookings">
              <CardHeader>
                <CardTitle className="text-base">Confirmed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ) : isAnalyticsError ? (
                  <div>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-sm text-muted-foreground">Data unavailable</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold" data-testid="text-confirmed-bookings">
                      {overview.confirmedBookings || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ready for service delivery
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Popular Services and Staff Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-popular-services">
              <CardHeader>
                <CardTitle className="text-base">Popular Services</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : isAnalyticsError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Unable to load popular services</p>
                  </div>
                ) : analyticsData?.popularServices && analyticsData.popularServices.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.popularServices.slice(0, 5).map((service: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{service.serviceName}</p>
                          <p className="text-sm text-muted-foreground">{service.bookingCount} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(service.totalRevenuePaisa)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No popular services data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-staff-performance">
              <CardHeader>
                <CardTitle className="text-base">Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isAnalyticsError ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Unable to load staff performance</p>
                  </div>
                ) : analyticsData?.staffPerformance && analyticsData.staffPerformance.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.staffPerformance.slice(0, 5).map((staff: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{staff.staffName}</p>
                          <p className="text-sm text-muted-foreground">{staff.bookingCount} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(staff.totalRevenuePaisa)}</p>
                          <p className="text-sm text-muted-foreground">{staff.utilization}% utilization</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No staff performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="pt-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Back to SalonHub
            </Link>
          </div>
        </div>
      );
    }

    // Render step components - Unified with BusinessSetup
    const components = {
      'business-info': BusinessInfoStep,
      'location-contact': LocationContactStep,
      'services': ServicesStep,
      'staff': StaffStep,
      'resources': ResourcesStep,
      'booking-settings': BookingSettingsStep,
      'payment-setup': PaymentSetupStep,
      'media': MediaStep,
      'publish': ReviewPublishStep
    };

    // Handle analytics tab
    if (activeTab === "analytics") {
      return (
        <div className="p-6">
          <AdvancedAnalyticsDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle financials tab
    if (activeTab === "financials") {
      return (
        <div className="p-6">
          <FinancialReportingDashboard 
            salonId={salonId || ''} 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>
      );
    }

    // Handle communications tab
    if (activeTab === "communications") {
      return (
        <div className="p-6">
          <CustomerCommunicationDashboard 
            salonId={salonId || ''} 
            selectedPeriod={selectedPeriod}
          />
        </div>
      );
    }

    // Handle inventory tab
    if (activeTab === "inventory") {
      return (
        <div className="p-6">
          <InventoryManagementDashboard salonId={salonId || ''} />
        </div>
      );
    }

    // Handle packages tab
    if (activeTab === "packages") {
      return (
        <div className="p-6">
          <PackageManagement salonId={salonId || ''} />
        </div>
      );
    }

    // Handle calendar tab
    if (activeTab === "calendar") {
      return (
        <div className="p-6">
          <CalendarManagement salonId={salonId || ''} />
        </div>
      );
    }

    const Component = components[activeTab as keyof typeof components];
    if (Component && salonId) {
      return (
        <div className="p-6">
          <Component
            salonId={salonId}
            onComplete={handleStepComplete}
            isCompleted={false}
          />
        </div>
      );
    }

    return <div className="p-6">Content not found</div>;
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen bg-background flex w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <SidebarNavigation />
        
        {/* Main Content */}
        <SidebarInset className="flex-1 flex flex-col">
          {/* Premium Header with User Name */}
          <header className="flex h-20 items-center justify-between gap-4 border-b bg-gradient-to-r from-white via-violet-50/30 to-pink-50/30 px-4 md:px-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <MobileNavigation />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                      {user?.username || 'Business Owner'}
                    </h1>
                    <div className="h-4 w-4 rounded-full bg-green-500 ring-2 ring-green-100" title="Online" />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-violet-500" />
                    {salonData?.name || 'Your Business'}
                    {salonData?.city && (
                      <>
                        <span className="text-slate-300">•</span>
                        <MapPin className="h-3.5 w-3.5 text-pink-500" />
                        {salonData.city}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Salon Selector Dropdown */}
            {Array.isArray(salons) && salons.length > 1 && (
              <div className="flex items-center gap-2">
                <Select value={salonId || undefined} onValueChange={handleSalonSwitch}>
                  <SelectTrigger className="w-[200px] md:w-[280px] bg-white border-violet-200 hover:border-violet-300 focus:ring-violet-500" data-testid="dropdown-salon-selector">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-violet-500" />
                      <SelectValue placeholder="Select salon location">
                        {salonData?.name || 'Select salon...'}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {salons.map((salon: Salon) => (
                      <SelectItem 
                        key={salon.id} 
                        value={salon.id}
                        data-testid={`salon-option-${salon.id}`}
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-violet-500" />
                            <span className="font-medium">{salon.name}</span>
                          </div>
                          {salon.id === salonId && (
                            <Check className="h-4 w-4 text-violet-600" />
                          )}
                        </div>
                        {salon.city && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {salon.city}
                          </p>
                        )}
                      </SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <SelectItem value="__create_new__" data-testid="button-create-new-salon">
                      <div className="flex items-center gap-2 text-violet-600 font-medium">
                        <Plus className="h-4 w-4" />
                        <span>Create New Salon</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              {completionPercentage === 100 && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md hidden md:flex">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Setup Complete
                </Badge>
              )}
              {completionPercentage < 100 && (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hidden md:flex">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {Math.round(completionPercentage)}% Complete
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-violet-100">
                <Bell className="h-4 w-4 text-slate-600" />
              </Button>
              
              {/* Settings Link */}
              <Link href={`/business/settings/${salonId}`}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-violet-100" data-testid="button-settings">
                  <Settings className="h-4 w-4 text-slate-600" />
                </Button>
              </Link>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            {renderTabContent()}
          </main>
        </SidebarInset>
      </div>

      {/* Delete Salon Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Salon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{salonToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSalonToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (salonToDelete) {
                  deleteSalonMutation.mutate(salonToDelete.id);
                }
              }}
              disabled={deleteSalonMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteSalonMutation.isPending ? "Deleting..." : "Delete Salon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
