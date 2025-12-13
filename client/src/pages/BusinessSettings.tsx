import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Salon } from "@/../../shared/schema";
import {
  Building,
  MapPin,
  Clock,
  Bell,
  CreditCard,
  Shield,
  Users,
  Globe,
  Smartphone,
  Mail,
  Trash2,
  Save,
  Calendar,
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Phone,
  Link as LinkIcon,
  ArrowLeft,
  Wallet,
  UserCheck,
  Ban,
  TrendingUp,
  IndianRupee,
  Info,
  BarChart3,
  Search,
  Plus,
  Edit2,
  X,
  Gift,
  QrCode,
  Layout,
  Eye,
  Copy,
  Palette,
  MessageSquare,
  ExternalLink,
  Download,
  FileSpreadsheet,
  FileText,
  Car,
  Pause,
  Play,
  XCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import ShopAdminManagement from "@/components/business-dashboard/ShopAdminManagement";
import DepartureAlertsDashboard from "@/components/business-dashboard/DepartureAlertsDashboard";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  LineChart,
  Line
} from 'recharts';

interface BusinessSettingsProps {
  salonId: string;
}

export default function BusinessSettings({ salonId }: BusinessSettingsProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Read tab from URL query parameter
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') || 'business';
    }
    return 'business';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [salonToDelete, setSalonToDelete] = useState<Salon | null>(null);

  // Fetch salon data
  const { data: salonData, isLoading } = useQuery({
    queryKey: ['/api/salons', salonId],
    enabled: !!salonId,
  });

  // Fetch all user's salons
  const { data: salons } = useQuery({
    queryKey: ['/api/my/salons'],
  });

  // Delete salon mutation
  const deleteSalonMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/salons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/my/salons'] });
      toast({
        title: "Salon Deleted",
        description: "The salon has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setSalonToDelete(null);
      
      // Filter out the deleted salon to get remaining salons
      const remainingSalons = salons?.filter((s: any) => s.id !== salonId) || [];
      
      // Navigate to another salon or dashboard
      if (remainingSalons.length > 0) {
        setLocation(`/business/settings/${remainingSalons[0].id}`);
      } else {
        setLocation('/business/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete salon.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !salonData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const settingsSections = [
    { id: "business", label: "Business Profile", icon: Building, badge: null },
    { id: "location", label: "Location & Contact", icon: MapPin, badge: null },
    { id: "hours", label: "Operating Hours", icon: Clock, badge: null },
    { id: "notifications", label: "Notifications", icon: Bell, badge: null },
    { id: "booking", label: "Booking Preferences", icon: Calendar, badge: null },
    { id: "deposits", label: "Deposits & Protection", icon: Wallet, badge: null },
    { id: "giftcards", label: "Gift Cards", icon: Gift, badge: "NEW" },
    { id: "rebooking", label: "Smart Rebooking", icon: RefreshCw, badge: "NEW" },
    { id: "departure", label: "Departure Alerts", icon: Car, badge: "NEW" },
    { id: "subscription", label: "Subscription & Billing", icon: CreditCard, badge: "NEW" },
    { id: "integrations", label: "Social Integrations", icon: Globe, badge: "NEW" },
    { id: "team", label: "Team & Permissions", icon: Users, badge: "NEW" },
    { id: "salons", label: "Salon Management", icon: Building, badge: null },
    { id: "security", label: "Account & Security", icon: Shield, badge: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/business/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground">Manage your business preferences and configuration</p>
            </div>
          </div>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <Card className="col-span-12 lg:col-span-3 shadow-lg border-violet-100">
            <CardContent className="p-2">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-1">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeTab === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md"
                            : "hover:bg-violet-50 text-slate-700"
                        }`}
                        data-testid={`settings-tab-${section.id}`}
                      >
                        <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-violet-600"}`} />
                        <span className="flex-1 text-left text-sm font-medium">{section.label}</span>
                        {section.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {section.badge}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9">
            <Card className="shadow-lg border-violet-100">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <CardContent className="p-6">
                  {/* Business Profile */}
                  {activeTab === "business" && (
                    <BusinessProfileSettings salonData={salonData} salonId={salonId} />
                  )}

                  {/* Location & Contact */}
                  {activeTab === "location" && (
                    <LocationContactSettings salonData={salonData} salonId={salonId} />
                  )}

                  {/* Operating Hours */}
                  {activeTab === "hours" && (
                    <OperatingHoursSettings salonData={salonData} salonId={salonId} />
                  )}

                  {/* Notifications */}
                  {activeTab === "notifications" && (
                    <NotificationsSettings salonData={salonData} salonId={salonId} />
                  )}

                  {/* Booking Preferences */}
                  {activeTab === "booking" && (
                    <BookingPreferencesSettings salonData={salonData} salonId={salonId} />
                  )}

                  {/* Deposits & Protection */}
                  {activeTab === "deposits" && (
                    <DepositsSettings salonId={salonId} />
                  )}

                  {/* Gift Cards */}
                  {activeTab === "giftcards" && (
                    <GiftCardsSettings salonId={salonId} />
                  )}

                  {/* Smart Rebooking */}
                  {activeTab === "rebooking" && (
                    <RebookingSettings salonId={salonId} />
                  )}

                  {/* Team & Permissions */}
                  {activeTab === "team" && (
                    <ShopAdminManagement salonId={salonId} />
                  )}

                  {/* Salon Management */}
                  {activeTab === "salons" && (
                    <SalonManagementSettings
                      salons={salons || []}
                      currentSalonId={salonId}
                      onDeleteSalon={(salon) => {
                        setSalonToDelete(salon);
                        setDeleteDialogOpen(true);
                      }}
                    />
                  )}

                  {/* Account & Security */}
                  {activeTab === "security" && (
                    <AccountSecuritySettings salonData={salonData} salonId={salonId} />
                  )}

                  {activeTab === "subscription" && (
                    <SubscriptionSettings salonId={salonId} />
                  )}

                  {activeTab === "integrations" && (
                    <SocialIntegrationsSettings salonId={salonId} />
                  )}

                  {activeTab === "departure" && (
                    <DepartureAlertsDashboard salonId={salonId} />
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}

// Business Profile Settings Component
function BusinessProfileSettings({ salonData, salonId }: { salonData: any; salonId: string }) {
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState(salonData?.name || "");
  const [description, setDescription] = useState(salonData?.description || "");
  const [websiteUrl, setWebsiteUrl] = useState(salonData?.websiteUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(salonData?.instagramUrl || "");
  const [facebookUrl, setFacebookUrl] = useState(salonData?.facebookUrl || "");

  // Sync state when salonData changes (after query refetch)
  useEffect(() => {
    if (salonData) {
      setBusinessName(salonData.name || "");
      setDescription(salonData.description || "");
      setWebsiteUrl(salonData.websiteUrl || "");
      setInstagramUrl(salonData.instagramUrl || "");
      setFacebookUrl(salonData.facebookUrl || "");
    }
  }, [salonData]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/salons/${salonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      queryClient.invalidateQueries({ queryKey: ['/api/my/salons'] });
      toast({
        title: "Success",
        description: "Business profile updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      name: businessName,
      description,
      websiteUrl,
      instagramUrl,
      facebookUrl,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Business Profile</h2>
        <p className="text-muted-foreground">Update your business information and social media links</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <Label htmlFor="business-name">Business Name *</Label>
          <Input
            id="business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
            data-testid="input-business-name"
          />
        </div>

        <div>
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers about your business..."
            rows={4}
            data-testid="input-description"
          />
          <p className="text-sm text-muted-foreground mt-1">
            This will be shown on your public profile
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Globe className="h-5 w-5 text-violet-600" />
            Online Presence
          </h3>

          <div>
            <Label htmlFor="website">Website URL</Label>
            <div className="flex gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground mt-3" />
              <Input
                id="website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                data-testid="input-website"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instagram">Instagram URL</Label>
            <Input
              id="instagram"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/yourbusiness"
              data-testid="input-instagram"
            />
          </div>

          <div>
            <Label htmlFor="facebook">Facebook URL</Label>
            <Input
              id="facebook"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/yourbusiness"
              data-testid="input-facebook"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600"
          data-testid="button-save-business-profile"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// Location & Contact Settings Component
function LocationContactSettings({ salonData, salonId }: { salonData: any; salonId: string }) {
  const { toast } = useToast();
  const [phone, setPhone] = useState(salonData?.phone || "");
  const [email, setEmail] = useState(salonData?.email || "");
  const [address, setAddress] = useState(salonData?.address || "");
  const [city, setCity] = useState(salonData?.city || "");
  const [state, setState] = useState(salonData?.state || "");
  const [pincode, setPincode] = useState(salonData?.pincode || "");

  // Sync state when salonData changes
  useEffect(() => {
    if (salonData) {
      setPhone(salonData.phone || "");
      setEmail(salonData.email || "");
      setAddress(salonData.address || "");
      setCity(salonData.city || "");
      setState(salonData.state || "");
      setPincode(salonData.pincode || "");
    }
  }, [salonData]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/salons/${salonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Success",
        description: "Location details updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update location details",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      phone,
      email,
      address,
      city,
      state,
      pincode,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Location & Contact</h2>
        <p className="text-muted-foreground">Manage your business location and contact information</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="flex gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-3" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                data-testid="input-phone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <div className="flex gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-3" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@yourbusiness.com"
                data-testid="input-email"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street, Building Name"
            data-testid="input-address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Delhi"
              data-testid="input-city"
            />
          </div>

          <div>
            <Label htmlFor="state">State *</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Delhi"
              data-testid="input-state"
            />
          </div>

          <div>
            <Label htmlFor="pincode">Pincode *</Label>
            <Input
              id="pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="110001"
              data-testid="input-pincode"
            />
          </div>
        </div>

        <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-violet-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Location Visibility</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your address will be shown to customers after they book an appointment
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600"
          data-testid="button-save-location"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// Operating Hours Settings Component
function OperatingHoursSettings({ salonData, salonId }: { salonData: any; salonId: string }) {
  const { toast } = useToast();
  
  // Initialize hours from salonData or use defaults
  const defaultHours = {
    monday: { open: "09:00", close: "18:00", closed: false },
    tuesday: { open: "09:00", close: "18:00", closed: false },
    wednesday: { open: "09:00", close: "18:00", closed: false },
    thursday: { open: "09:00", close: "18:00", closed: false },
    friday: { open: "09:00", close: "18:00", closed: false },
    saturday: { open: "10:00", close: "16:00", closed: false },
    sunday: { open: "10:00", close: "16:00", closed: true },
  };
  
  const [hours, setHours] = useState(salonData?.businessHours || defaultHours);

  // Sync state when salonData changes
  useEffect(() => {
    if (salonData?.businessHours) {
      setHours(salonData.businessHours);
    }
  }, [salonData]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/salons/${salonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Success",
        description: "Operating hours updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update operating hours",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ businessHours: hours });
  };

  const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Operating Hours</h2>
        <p className="text-muted-foreground">Set your business hours for each day of the week</p>
      </div>

      <Separator />

      <div className="space-y-3">
        {daysOfWeek.map((day) => (
          <div key={day.key} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="w-32">
              <Label className="font-medium">{day.label}</Label>
            </div>

            <div className="flex items-center gap-3 flex-1">
              <Input
                type="time"
                value={hours[day.key as keyof typeof hours].open}
                onChange={(e) =>
                  setHours({
                    ...hours,
                    [day.key]: { ...hours[day.key as keyof typeof hours], open: e.target.value },
                  })
                }
                disabled={hours[day.key as keyof typeof hours].closed}
                className="w-32"
                data-testid={`input-open-${day.key}`}
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                value={hours[day.key as keyof typeof hours].close}
                onChange={(e) =>
                  setHours({
                    ...hours,
                    [day.key]: { ...hours[day.key as keyof typeof hours], close: e.target.value },
                  })
                }
                disabled={hours[day.key as keyof typeof hours].closed}
                className="w-32"
                data-testid={`input-close-${day.key}`}
              />

              <div className="flex items-center gap-2 ml-auto">
                <Switch
                  checked={!hours[day.key as keyof typeof hours].closed}
                  onCheckedChange={(checked) =>
                    setHours({
                      ...hours,
                      [day.key]: { ...hours[day.key as keyof typeof hours], closed: !checked },
                    })
                  }
                  data-testid={`switch-${day.key}`}
                />
                <Label className="text-sm">
                  {hours[day.key as keyof typeof hours].closed ? "Closed" : "Open"}
                </Label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Note</p>
            <p className="text-sm text-muted-foreground mt-1">
              These hours will be displayed to customers when they book appointments
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600"
          data-testid="button-save-hours"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// Notifications Settings Component
function NotificationsSettings({ salonData, salonId }: { salonData: any; salonId: string }) {
  const { toast } = useToast();
  
  // Initialize from salonData or use defaults
  const notifSettings = salonData?.notificationSettings || {};
  const [emailNotifications, setEmailNotifications] = useState(notifSettings.email ?? true);
  const [smsNotifications, setSmsNotifications] = useState(notifSettings.sms ?? true);
  const [bookingConfirmations, setBookingConfirmations] = useState(notifSettings.bookingConfirmations ?? true);
  const [reminderTiming, setReminderTiming] = useState(notifSettings.reminderTiming || "24");
  const [cancelNotifications, setCancelNotifications] = useState(notifSettings.cancelNotifications ?? true);

  // Sync state when salonData changes
  useEffect(() => {
    const settings = salonData?.notificationSettings || {};
    setEmailNotifications(settings.email ?? true);
    setSmsNotifications(settings.sms ?? true);
    setBookingConfirmations(settings.bookingConfirmations ?? true);
    setReminderTiming(settings.reminderTiming || "24");
    setCancelNotifications(settings.cancelNotifications ?? true);
  }, [salonData]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/salons/${salonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Success",
        description: "Notification settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      notificationSettings: {
        email: emailNotifications,
        sms: smsNotifications,
        bookingConfirmations,
        reminderTiming,
        cancelNotifications,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Notifications & Reminders</h2>
        <p className="text-muted-foreground">Configure how you want to communicate with customers</p>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Notification Channels</h3>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-violet-600" />
              <div>
                <Label className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send booking updates via email</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              data-testid="switch-email-notifications"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-violet-600" />
              <div>
                <Label className="font-medium">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send booking updates via SMS</p>
              </div>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
              data-testid="switch-sms-notifications"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Automated Messages</h3>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <Label className="font-medium">Booking Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Send automatic confirmation when booking is made
                </p>
              </div>
            </div>
            <Switch
              checked={bookingConfirmations}
              onCheckedChange={setBookingConfirmations}
              data-testid="switch-booking-confirmations"
            />
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="h-5 w-5 text-violet-600" />
              <div className="flex-1">
                <Label className="font-medium">Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders before appointments
                </p>
              </div>
            </div>
            <Select value={reminderTiming} onValueChange={setReminderTiming}>
              <SelectTrigger data-testid="select-reminder-timing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour before</SelectItem>
                <SelectItem value="3">3 hours before</SelectItem>
                <SelectItem value="6">6 hours before</SelectItem>
                <SelectItem value="12">12 hours before</SelectItem>
                <SelectItem value="24">24 hours before</SelectItem>
                <SelectItem value="48">48 hours before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <Label className="font-medium">Cancellation Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notify when customers cancel appointments
                </p>
              </div>
            </div>
            <Switch
              checked={cancelNotifications}
              onCheckedChange={setCancelNotifications}
              data-testid="switch-cancel-notifications"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600"
          data-testid="button-save-notifications"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// Booking Preferences Settings Component
function BookingPreferencesSettings({ salonData, salonId }: { salonData: any; salonId: string }) {
  const { toast } = useToast();
  
  // Initialize from salonData or use defaults
  const bookingSettings = salonData?.bookingSettings || {};
  const [onlineBooking, setOnlineBooking] = useState(bookingSettings.onlineBooking ?? true);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(bookingSettings.advanceBookingDays || "30");
  const [bufferTime, setBufferTime] = useState(bookingSettings.bufferTime || "15");
  const [sameDayBooking, setSameDayBooking] = useState(bookingSettings.sameDayBooking ?? true);
  const [requireDeposit, setRequireDeposit] = useState(bookingSettings.requireDeposit ?? false);

  // Sync state when salonData changes
  useEffect(() => {
    const settings = salonData?.bookingSettings || {};
    setOnlineBooking(settings.onlineBooking ?? true);
    setAdvanceBookingDays(settings.advanceBookingDays || "30");
    setBufferTime(settings.bufferTime || "15");
    setSameDayBooking(settings.sameDayBooking ?? true);
    setRequireDeposit(settings.requireDeposit ?? false);
  }, [salonData]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/salons/${salonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] });
      toast({
        title: "Success",
        description: "Booking preferences updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update booking preferences",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      bookingSettings: {
        onlineBooking,
        advanceBookingDays,
        bufferTime,
        sameDayBooking,
        requireDeposit,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Booking Preferences</h2>
        <p className="text-muted-foreground">Configure how customers can book appointments</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-violet-600" />
            <div>
              <Label className="font-medium">Enable Online Booking</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to book appointments 24/7
              </p>
            </div>
          </div>
          <Switch
            checked={onlineBooking}
            onCheckedChange={setOnlineBooking}
            data-testid="switch-online-booking"
          />
        </div>

        <div className="p-4 border rounded-lg">
          <Label className="font-medium">Advance Booking Limit</Label>
          <p className="text-sm text-muted-foreground mb-3">
            How far in advance can customers book?
          </p>
          <Select value={advanceBookingDays} onValueChange={setAdvanceBookingDays}>
            <SelectTrigger data-testid="select-advance-booking">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">1 week</SelectItem>
              <SelectItem value="14">2 weeks</SelectItem>
              <SelectItem value="30">1 month</SelectItem>
              <SelectItem value="60">2 months</SelectItem>
              <SelectItem value="90">3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 border rounded-lg">
          <Label className="font-medium">Buffer Time Between Appointments</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Prep/cleanup time between bookings
          </p>
          <Select value={bufferTime} onValueChange={setBufferTime}>
            <SelectTrigger data-testid="select-buffer-time">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No buffer</SelectItem>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-violet-600" />
            <div>
              <Label className="font-medium">Same-Day Booking</Label>
              <p className="text-sm text-muted-foreground">
                Allow customers to book on the same day
              </p>
            </div>
          </div>
          <Switch
            checked={sameDayBooking}
            onCheckedChange={setSameDayBooking}
            data-testid="switch-same-day-booking"
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-violet-600" />
            <div>
              <Label className="font-medium">Require Deposit</Label>
              <p className="text-sm text-muted-foreground">
                Customers must pay deposit to confirm booking
              </p>
            </div>
          </div>
          <Switch
            checked={requireDeposit}
            onCheckedChange={setRequireDeposit}
            data-testid="switch-require-deposit"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-gradient-to-r from-violet-600 to-purple-600"
          data-testid="button-save-booking-prefs"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// Salon Management Settings Component
function SalonManagementSettings({
  salons,
  currentSalonId,
  onDeleteSalon,
}: {
  salons: Salon[];
  currentSalonId: string;
  onDeleteSalon: (salon: Salon) => void;
}) {
  const { toast } = useToast();
  
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ salonId, isActive }: { salonId: string; isActive: boolean }) => {
      const res = await fetch(`/api/salons/${salonId}/toggle-status`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/my/salons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      toast({ 
        title: variables.isActive ? "Salon Enabled" : "Salon Paused", 
        description: variables.isActive 
          ? "Your salon is now visible and accepting bookings" 
          : "Your salon is temporarily paused and hidden from customers"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Cannot Update Salon Status", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Salon Management</h2>
        <p className="text-muted-foreground">View and manage all your salon locations</p>
      </div>

      <Separator />

      <div className="space-y-3">
        {Array.isArray(salons) && salons.map((salon: any) => (
          <div
            key={salon.id}
            className={`p-4 border rounded-lg transition-shadow ${
              salon.isActive === 0 
                ? 'bg-red-50/50 border-red-200' 
                : 'bg-gradient-to-r from-violet-50/50 to-pink-50/50 hover:shadow-md'
            }`}
            data-testid={`salon-item-${salon.id}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-violet-600" />
                  <h3 className="font-semibold text-lg">{salon.name}</h3>
                  {salon.id === currentSalonId && (
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                      Current
                    </Badge>
                  )}
                  {salon.isActive === 0 && (
                    <Badge variant="destructive">
                      {salon.disabledBySuperAdmin === 1 ? 'Disabled by Admin' : 'Paused'}
                    </Badge>
                  )}
                </div>
                {salon.city && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 ml-7">
                    <MapPin className="h-3.5 w-3.5" />
                    {salon.city}, {salon.state}
                  </p>
                )}
                {salon.email && (
                  <p className="text-sm text-muted-foreground ml-7">{salon.email}</p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Salon Status Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {salon.isActive === 1 ? 'Active' : 'Paused'}
                  </span>
                  <Switch
                    checked={salon.isActive === 1}
                    onCheckedChange={(checked) => 
                      toggleStatusMutation.mutate({ salonId: salon.id, isActive: checked })
                    }
                    disabled={toggleStatusMutation.isPending || salon.disabledBySuperAdmin === 1}
                    data-testid={`switch-salon-status-${salon.id}`}
                  />
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteSalon(salon)}
                  disabled={salons.length <= 1}
                  title={salons.length <= 1 ? "Cannot delete your only salon" : "Delete salon"}
                  data-testid={`button-delete-salon-${salon.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            
            {/* Show warning if disabled by super admin */}
            {salon.isActive === 0 && salon.disabledBySuperAdmin === 1 && (
              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Ban className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      This salon was disabled by platform administrator
                    </p>
                    {salon.disabledReason && (
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {salon.disabledReason}
                      </p>
                    )}
                    <p className="text-xs text-red-600 mt-2">
                      Please contact support to re-enable your salon.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show info if self-paused */}
            {salon.isActive === 0 && salon.disabledBySuperAdmin !== 1 && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      This salon is temporarily paused
                    </p>
                    {salon.disabledReason && (
                      <p className="text-sm text-amber-700 mt-1">
                        Reason: {salon.disabledReason}
                      </p>
                    )}
                    <p className="text-xs text-amber-600 mt-2">
                      Your salon is hidden from customers. Toggle the switch above to make it visible again.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {salons.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No salons found</p>
        </div>
      )}
    </div>
  );
}

// Account & Security Settings Component
function AccountSecuritySettings({ salonData, salonId }: { salonData: any; salonId: string }) {
  const { toast } = useToast();

  const handleExportData = () => {
    toast({
      title: "Export Initiated",
      description: "Your data export has been queued. You'll receive an email when it's ready.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Account & Security</h2>
        <p className="text-muted-foreground">Manage your account security and data</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-5 w-5 text-violet-600" />
            <div className="flex-1">
              <Label className="font-medium">Change Password</Label>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
          </div>
          <Button variant="outline" data-testid="button-change-password">
            Change Password
          </Button>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Building className="h-5 w-5 text-violet-600" />
            <div className="flex-1">
              <Label className="font-medium">Export Business Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your business data in JSON format
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleExportData}
            data-testid="button-export-data"
          >
            Export Data
          </Button>
        </div>

        <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <Label className="font-medium text-red-900">Danger Zone</Label>
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data
              </p>
            </div>
          </div>
          <Button variant="destructive" data-testid="button-delete-account">
            Delete Account
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Your Data is Secure</p>
            <p className="text-sm text-muted-foreground mt-1">
              We use industry-standard encryption to protect your data. Your information is never
              shared with third parties without your consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DepositsSettings({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [activeDepositTab, setActiveDepositTab] = useState<'settings' | 'policy' | 'services' | 'trusted' | 'analytics'>('settings');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [addCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);

  const { data: depositSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['/api/business', salonId, 'deposit-settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/${salonId}/deposit-settings`);
      return res.json();
    },
    enabled: !!salonId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: cancellationPolicy, isLoading: policyLoading, error: policyError } = useQuery({
    queryKey: ['/api/business', salonId, 'cancellation-policy'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/${salonId}/cancellation-policy`);
      return res.json();
    },
    enabled: !!salonId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: serviceRules, isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['/api/business', salonId, 'service-deposit-rules'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/${salonId}/service-deposit-rules`);
      return res.json();
    },
    enabled: !!salonId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: trustedCustomersData, isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['/api/business', salonId, 'trusted-customers'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/${salonId}/trusted-customers`);
      return res.json();
    },
    enabled: !!salonId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['/api/business', salonId, 'deposit-analytics'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/${salonId}/deposit-analytics`);
      return res.json();
    },
    enabled: !!salonId,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: servicesData } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/salons/${salonId}/services`);
      return res.json();
    },
    enabled: !!salonId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/business/${salonId}/deposit-settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'deposit-settings'] });
      toast({ title: "Success", description: "Deposit settings updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/business/${salonId}/cancellation-policy`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'cancellation-policy'] });
      toast({ title: "Success", description: "Cancellation policy updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update policy", variant: "destructive" });
    },
  });

  const updateServiceRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/business/${salonId}/service-deposit-rules`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'service-deposit-rules'] });
      toast({ title: "Success", description: "Service rule updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update service rule", variant: "destructive" });
    },
  });

  const addTrustedCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/business/${salonId}/trusted-customers`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'trusted-customers'] });
      toast({ title: "Success", description: "Customer added to trusted list" });
      setAddCustomerDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add trusted customer", variant: "destructive" });
    },
  });

  const updateTrustedCustomerMutation = useMutation({
    mutationFn: async ({ customerId, data }: { customerId: string; data: any }) => {
      return apiRequest('PUT', `/api/business/${salonId}/trusted-customers/${customerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'trusted-customers'] });
      toast({ title: "Success", description: "Customer updated" });
      setEditingCustomer(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update customer", variant: "destructive" });
    },
  });

  const removeTrustedCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return apiRequest('DELETE', `/api/business/${salonId}/trusted-customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'trusted-customers'] });
      toast({ title: "Success", description: "Customer removed from list" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove customer", variant: "destructive" });
    },
  });

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(paisa / 100);
  };

  const depositTabs = [
    { id: 'settings', label: 'Deposit Settings', icon: Wallet },
    { id: 'policy', label: 'Cancellation Policy', icon: Shield },
    { id: 'services', label: 'Service Rules', icon: Calendar },
    { id: 'trusted', label: 'Trusted Customers', icon: UserCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Deposits & No-Show Protection</h2>
        <p className="text-muted-foreground">Protect your business from no-shows with upfront deposits</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {depositTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDepositTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveDepositTab(tab.id as any)}
              className={isActive ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeDepositTab === 'settings' && (
        <DepositSettingsTab
          settings={depositSettings}
          isLoading={settingsLoading}
          error={settingsError}
          onUpdate={(data) => updateSettingsMutation.mutate(data)}
          isPending={updateSettingsMutation.isPending}
        />
      )}

      {activeDepositTab === 'policy' && (
        <CancellationPolicyTab
          policy={cancellationPolicy}
          isLoading={policyLoading}
          onUpdate={(data) => updatePolicyMutation.mutate(data)}
          isPending={updatePolicyMutation.isPending}
        />
      )}

      {activeDepositTab === 'services' && (
        <ServiceRulesTab
          rules={serviceRules || []}
          services={servicesData || []}
          isLoading={rulesLoading}
          defaultPercentage={depositSettings?.depositPercentage || 25}
          onUpdate={(data) => updateServiceRuleMutation.mutate(data)}
          isPending={updateServiceRuleMutation.isPending}
        />
      )}

      {activeDepositTab === 'trusted' && (
        <TrustedCustomersTab
          customers={trustedCustomersData?.customers || []}
          isLoading={customersLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddCustomer={() => setAddCustomerDialogOpen(true)}
          onEditCustomer={setEditingCustomer}
          onRemoveCustomer={(id) => removeTrustedCustomerMutation.mutate(id)}
          editingCustomer={editingCustomer}
          onUpdateCustomer={(customerId, data) => updateTrustedCustomerMutation.mutate({ customerId, data })}
          onCancelEdit={() => setEditingCustomer(null)}
          isUpdating={updateTrustedCustomerMutation.isPending}
          isRemoving={removeTrustedCustomerMutation.isPending}
          formatCurrency={formatCurrency}
        />
      )}

      {activeDepositTab === 'analytics' && (
        <DepositAnalyticsTab
          analytics={analytics}
          isLoading={analyticsLoading}
          formatCurrency={formatCurrency}
        />
      )}

      <Dialog open={addCustomerDialogOpen} onOpenChange={setAddCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Trusted Customer</DialogTitle>
            <DialogDescription>
              Search for a customer to add to your trusted list
            </DialogDescription>
          </DialogHeader>
          <AddTrustedCustomerForm
            salonId={salonId}
            onSubmit={(data) => addTrustedCustomerMutation.mutate(data)}
            isPending={addTrustedCustomerMutation.isPending}
            onCancel={() => setAddCustomerDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DepositSettingsTab({
  settings,
  isLoading,
  error,
  onUpdate,
  isPending,
}: {
  settings: any;
  isLoading: boolean;
  error: Error | null;
  onUpdate: (data: any) => void;
  isPending: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(settings?.isEnabled === 1);
  const [depositPercentage, setDepositPercentage] = useState(settings?.depositPercentage || 25);
  const [usePriceThreshold, setUsePriceThreshold] = useState(settings?.usePriceThreshold === 1);
  const [priceThreshold, setPriceThreshold] = useState((settings?.priceThresholdPaisa || 100000) / 100);
  const [useCategoryBased, setUseCategoryBased] = useState(settings?.useCategoryBased === 1);
  const [useManualToggle, setUseManualToggle] = useState(settings?.useManualToggle === 1);
  const [allowTrustedBypass, setAllowTrustedBypass] = useState(settings?.allowTrustedCustomerBypass === 1);
  const [requireCardOnFile, setRequireCardOnFile] = useState(settings?.requireCardOnFile === 1);

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.isEnabled === 1);
      setDepositPercentage(settings.depositPercentage || 25);
      setUsePriceThreshold(settings.usePriceThreshold === 1);
      setPriceThreshold((settings.priceThresholdPaisa || 100000) / 100);
      setUseCategoryBased(settings.useCategoryBased === 1);
      setUseManualToggle(settings.useManualToggle === 1);
      setAllowTrustedBypass(settings.allowTrustedCustomerBypass === 1);
      setRequireCardOnFile(settings.requireCardOnFile === 1);
    }
  }, [settings]);

  const handleSave = () => {
    onUpdate({
      isEnabled: isEnabled ? 1 : 0,
      depositPercentage,
      usePriceThreshold: usePriceThreshold ? 1 : 0,
      priceThresholdPaisa: priceThreshold * 100,
      useCategoryBased: useCategoryBased ? 1 : 0,
      useManualToggle: useManualToggle ? 1 : 0,
      allowTrustedCustomerBypass: allowTrustedBypass ? 1 : 0,
      requireCardOnFile: requireCardOnFile ? 1 : 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Failed to load deposit settings</h3>
        <p className="text-muted-foreground mb-4">{error.message || 'An error occurred while loading settings.'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-violet-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-violet-600" />
                Enable Deposits
              </CardTitle>
              <CardDescription>
                Require deposits for bookings to reduce no-shows
              </CardDescription>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
        </CardHeader>
      </Card>

      {isEnabled && (
        <>
          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle className="text-lg">Deposit Amount</CardTitle>
              <CardDescription>Set the percentage of service price to collect as deposit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[20, 25, 50, 100].map((pct) => (
                  <Button
                    key={pct}
                    variant={depositPercentage === pct ? "default" : "outline"}
                    onClick={() => setDepositPercentage(pct)}
                    className={depositPercentage === pct ? "bg-violet-600 hover:bg-violet-700" : ""}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <Label>Custom percentage:</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(parseInt(e.target.value) || 25)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle className="text-lg">Trigger Methods</CardTitle>
              <CardDescription>Choose when deposits are required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Price Threshold</Label>
                  <p className="text-sm text-muted-foreground">Require deposit for services above a certain price</p>
                </div>
                <Switch
                  checked={usePriceThreshold}
                  onCheckedChange={setUsePriceThreshold}
                />
              </div>
              {usePriceThreshold && (
                <div className="ml-4 flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                  <Label>Minimum price:</Label>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      value={priceThreshold}
                      onChange={(e) => setPriceThreshold(parseInt(e.target.value) || 0)}
                      className="w-32 ml-1"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Category-Based</Label>
                  <p className="text-sm text-muted-foreground">Require deposit for specific service categories</p>
                </div>
                <Switch
                  checked={useCategoryBased}
                  onCheckedChange={setUseCategoryBased}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Manual Toggle Per Service</Label>
                  <p className="text-sm text-muted-foreground">Manually enable deposits for individual services</p>
                </div>
                <Switch
                  checked={useManualToggle}
                  onCheckedChange={setUseManualToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle className="text-lg">Trusted Customer Settings</CardTitle>
              <CardDescription>Configure how trusted customers are handled</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="font-medium">Allow Trusted Customer Bypass</Label>
                  <p className="text-sm text-muted-foreground">Trusted customers can book without deposits</p>
                </div>
                <Switch
                  checked={allowTrustedBypass}
                  onCheckedChange={setAllowTrustedBypass}
                />
              </div>

              {allowTrustedBypass && (
                <div className="flex items-center justify-between p-4 border rounded-lg ml-4 bg-slate-50">
                  <div>
                    <Label className="font-medium">Require Card on File</Label>
                    <p className="text-sm text-muted-foreground">Trusted customers must have a saved card to bypass</p>
                  </div>
                  <Switch
                    checked={requireCardOnFile}
                    onCheckedChange={setRequireCardOnFile}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function CancellationPolicyTab({
  policy,
  isLoading,
  onUpdate,
  isPending,
}: {
  policy: any;
  isLoading: boolean;
  onUpdate: (data: any) => void;
  isPending: boolean;
}) {
  const [windowHours, setWindowHours] = useState(policy?.cancellationWindowHours || 24);
  const [withinWindowAction, setWithinWindowAction] = useState(policy?.withinWindowAction || 'forfeit_full');
  const [partialPercentage, setPartialPercentage] = useState(policy?.partialForfeitPercentage || 50);
  const [noShowAction, setNoShowAction] = useState(policy?.noShowAction || 'forfeit_full');
  const [graceMinutes, setGraceMinutes] = useState(policy?.noShowGraceMinutes || 15);
  const [policyText, setPolicyText] = useState(policy?.policyText || '');

  useEffect(() => {
    if (policy) {
      setWindowHours(policy.cancellationWindowHours || 24);
      setWithinWindowAction(policy.withinWindowAction || 'forfeit_full');
      setPartialPercentage(policy.partialForfeitPercentage || 50);
      setNoShowAction(policy.noShowAction || 'forfeit_full');
      setGraceMinutes(policy.noShowGraceMinutes || 15);
      setPolicyText(policy.policyText || '');
    }
  }, [policy]);

  const handleSave = () => {
    onUpdate({
      cancellationWindowHours: windowHours,
      withinWindowAction,
      partialForfeitPercentage: partialPercentage,
      noShowAction,
      noShowGraceMinutes: graceMinutes,
      policyText,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-600" />
            Cancellation Window
          </CardTitle>
          <CardDescription>
            Set the time limit for free cancellations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[12, 24, 48, 72].map((hours) => (
              <Button
                key={hours}
                variant={windowHours === hours ? "default" : "outline"}
                onClick={() => setWindowHours(hours)}
                className={windowHours === hours ? "bg-violet-600 hover:bg-violet-700" : ""}
              >
                {hours} hours
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="text-lg">Within-Window Cancellation</CardTitle>
          <CardDescription>What happens when a customer cancels within the window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={withinWindowAction} onValueChange={setWithinWindowAction}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forfeit_full">Forfeit Full Deposit</SelectItem>
              <SelectItem value="forfeit_partial">Forfeit Partial Deposit</SelectItem>
              <SelectItem value="no_penalty">No Penalty</SelectItem>
            </SelectContent>
          </Select>

          {withinWindowAction === 'forfeit_partial' && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <Label>Forfeit percentage:</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={partialPercentage}
                onChange={(e) => setPartialPercentage(parseInt(e.target.value) || 50)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">% of deposit</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-600" />
            No-Show Handling
          </CardTitle>
          <CardDescription>What happens when a customer doesn't show up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={noShowAction} onValueChange={setNoShowAction}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="forfeit_full">Forfeit Full Deposit</SelectItem>
              <SelectItem value="forfeit_partial">Forfeit Partial Deposit</SelectItem>
              <SelectItem value="charge_full_service">Charge Full Service Amount</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <Label>Grace period:</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(parseInt(e.target.value) || 15)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">minutes after appointment start</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="text-lg">Policy Text</CardTitle>
          <CardDescription>Custom text shown to customers during booking</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="Enter your cancellation policy text here..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isPending ? "Saving..." : "Save Policy"}
        </Button>
      </div>
    </div>
  );
}

function ServiceRulesTab({
  rules,
  services,
  isLoading,
  defaultPercentage,
  onUpdate,
  isPending,
}: {
  rules: any[];
  services: any[];
  isLoading: boolean;
  defaultPercentage: number;
  onUpdate: (data: any) => void;
  isPending: boolean;
}) {
  const [editingService, setEditingService] = useState<string | null>(null);
  const [customPercentage, setCustomPercentage] = useState<number | null>(null);

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(paisa / 100);
  };

  const getServiceRule = (serviceId: string) => {
    return rules.find((r: any) => r.serviceId === serviceId);
  };

  const handleToggle = (serviceId: string, currentlyEnabled: boolean) => {
    onUpdate({
      serviceId,
      requiresDeposit: currentlyEnabled ? 0 : 1,
    });
  };

  const handleCustomPercentage = (serviceId: string) => {
    if (customPercentage !== null) {
      onUpdate({
        serviceId,
        requiresDeposit: 1,
        customPercentage,
      });
      setEditingService(null);
      setCustomPercentage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Service-Level Deposit Rules</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enable deposits for specific services. Default deposit is {defaultPercentage}% of service price.
              You can set custom percentages for individual services.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {services.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No services found. Add services to configure deposit rules.
            </CardContent>
          </Card>
        ) : (
          services.map((service: any) => {
            const rule = getServiceRule(service.id);
            const isEnabled = rule?.requiresDeposit === 1;
            const percentage = rule?.customPercentage || defaultPercentage;
            const depositAmount = Math.round((service.priceInPaisa * percentage) / 100);

            return (
              <Card key={service.id} className="border-violet-100">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{service.name}</h4>
                        {service.category && (
                          <Badge variant="secondary" className="text-xs">
                            {service.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Price: {formatCurrency(service.priceInPaisa)}
                        {isEnabled && (
                          <span className="ml-2 text-violet-600">
                            | Deposit: {formatCurrency(depositAmount)} ({percentage}%)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEnabled && editingService === service.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={5}
                            max={100}
                            value={customPercentage ?? percentage}
                            onChange={(e) => setCustomPercentage(parseInt(e.target.value) || defaultPercentage)}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                          <Button
                            size="sm"
                            onClick={() => handleCustomPercentage(service.id)}
                            disabled={isPending}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingService(null);
                              setCustomPercentage(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {isEnabled && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingService(service.id);
                                setCustomPercentage(percentage);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={() => handleToggle(service.id, isEnabled)}
                            disabled={isPending}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function TrustedCustomersTab({
  customers,
  isLoading,
  searchTerm,
  onSearchChange,
  onAddCustomer,
  onEditCustomer,
  onRemoveCustomer,
  editingCustomer,
  onUpdateCustomer,
  onCancelEdit,
  isUpdating,
  isRemoving,
  formatCurrency,
}: {
  customers: any[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddCustomer: () => void;
  onEditCustomer: (customer: any) => void;
  onRemoveCustomer: (id: string) => void;
  editingCustomer: any;
  onUpdateCustomer: (customerId: string, data: any) => void;
  onCancelEdit: () => void;
  isUpdating: boolean;
  isRemoving: boolean;
  formatCurrency: (paisa: number) => string;
}) {
  const [editTrustLevel, setEditTrustLevel] = useState(editingCustomer?.trustLevel || 'trusted');
  const [editReason, setEditReason] = useState(editingCustomer?.reason || '');
  const [editCanBypass, setEditCanBypass] = useState(editingCustomer?.canBypassDeposit === 1);

  useEffect(() => {
    if (editingCustomer) {
      setEditTrustLevel(editingCustomer.trustLevel || 'trusted');
      setEditReason(editingCustomer.reason || '');
      setEditCanBypass(editingCustomer.canBypassDeposit === 1);
    }
  }, [editingCustomer]);

  const filteredCustomers = customers.filter((c: any) => {
    const name = `${c.customerFirstName || ''} ${c.customerLastName || ''}`.toLowerCase();
    const email = (c.customerEmail || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const getTrustLevelBadge = (level: string) => {
    switch (level) {
      case 'vip':
        return <Badge className="bg-amber-500">VIP</Badge>;
      case 'blacklisted':
        return <Badge variant="destructive">Blacklisted</Badge>;
      default:
        return <Badge className="bg-green-500">Trusted</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onAddCustomer} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {filteredCustomers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            {searchTerm ? 'No customers match your search' : 'No trusted customers added yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer: any) => (
            <Card key={customer.id} className="border-violet-100">
              <CardContent className="py-4">
                {editingCustomer?.id === customer.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {customer.customerFirstName} {customer.customerLastName}
                      </h4>
                      <span className="text-sm text-muted-foreground">{customer.customerEmail}</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="mb-2 block">Trust Level</Label>
                        <Select value={editTrustLevel} onValueChange={setEditTrustLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trusted">Trusted</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                            <SelectItem value="blacklisted">Blacklisted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={editCanBypass}
                          onCheckedChange={setEditCanBypass}
                        />
                        <Label>Can bypass deposit</Label>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block">Reason/Notes</Label>
                      <Input
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Optional reason..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={onCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => onUpdateCustomer(customer.id, {
                          trustLevel: editTrustLevel,
                          reason: editReason,
                          canBypassDeposit: editCanBypass ? 1 : 0,
                        })}
                        disabled={isUpdating}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {customer.customerFirstName} {customer.customerLastName}
                        </h4>
                        {getTrustLevelBadge(customer.trustLevel)}
                        {customer.canBypassDeposit === 1 && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Bypass
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{customer.customerEmail}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Bookings: {customer.totalBookings || 0}</span>
                        <span>Completed: {customer.completedBookings || 0}</span>
                        {customer.noShowCount > 0 && (
                          <span className="text-red-500">No-shows: {customer.noShowCount}</span>
                        )}
                      </div>
                      {customer.reason && (
                        <p className="text-sm text-muted-foreground mt-1 italic">
                          "{customer.reason}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditCustomer(customer)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => onRemoveCustomer(customer.id)}
                        disabled={isRemoving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddTrustedCustomerForm({
  salonId,
  onSubmit,
  isPending,
  onCancel,
}: {
  salonId: string;
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [customerId, setCustomerId] = useState('');
  const [trustLevel, setTrustLevel] = useState('trusted');
  const [reason, setReason] = useState('');
  const [canBypass, setCanBypass] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customers } = useQuery({
    queryKey: ['/api/business', salonId, 'customers', searchTerm],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/${salonId}/customers?search=${searchTerm}`);
      return res.json();
    },
    enabled: searchTerm.length >= 2,
  });

  const handleSubmit = () => {
    if (!customerId) return;
    onSubmit({
      customerId,
      trustLevel,
      reason: reason || null,
      canBypassDeposit: canBypass ? 1 : 0,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Search Customer</Label>
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {customers?.customers && customers.customers.length > 0 && (
          <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
            {customers.customers.map((c: any) => (
              <button
                key={c.id}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 ${customerId === c.id ? 'bg-violet-50' : ''}`}
                onClick={() => setCustomerId(c.id)}
              >
                <div className="font-medium">{c.firstName} {c.lastName}</div>
                <div className="text-sm text-muted-foreground">{c.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label className="mb-2 block">Trust Level</Label>
        <Select value={trustLevel} onValueChange={setTrustLevel}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trusted">Trusted</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="blacklisted">Blacklisted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Reason (Optional)</Label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this customer trusted?"
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={canBypass} onCheckedChange={setCanBypass} />
        <Label>Can bypass deposit requirement</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!customerId || isPending}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isPending ? "Adding..." : "Add Customer"}
        </Button>
      </div>
    </div>
  );
}

function DepositAnalyticsTab({
  analytics,
  isLoading,
  formatCurrency,
}: {
  analytics: any;
  isLoading: boolean;
  formatCurrency: (paisa: number) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const deposits = analytics?.deposits || {
    totalCollectedPaisa: 0,
    totalRefundedPaisa: 0,
    totalForfeitedPaisa: 0,
    netRevenuePaisa: 0,
    noShowsCount: 0,
    count: { collected: 0, refunded: 0, forfeited: 0 }
  };
  const customers = analytics?.customers || {
    trusted: 0,
    vip: 0,
    blacklisted: 0,
    withSavedCards: 0
  };
  
  const stats = {
    totalCollected: deposits.totalCollectedPaisa,
    totalRefunded: deposits.totalRefundedPaisa,
    totalForfeited: deposits.totalForfeitedPaisa,
    noShowCount: deposits.noShowsCount,
    lateCancellationCount: deposits.count?.forfeited || 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Total Collected</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(stats.totalCollected || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Refunded</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(stats.totalRefunded || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Total Forfeited</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatCurrency(stats.totalForfeited || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                <Ban className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700">No-Shows</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.noShowCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Late Cancellations</p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.lateCancellationCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-violet-700">Protection Rate</p>
                <p className="text-2xl font-bold text-violet-900">
                  {stats.totalCollected > 0 
                    ? Math.round((stats.totalForfeited / stats.totalCollected) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-600" />
            Deposit Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Net Revenue Protected</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency((stats.totalForfeited || 0) - (stats.totalRefunded || 0))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deposits Currently Held</p>
                <p className="text-xl font-bold text-violet-600">
                  {formatCurrency((stats.totalCollected || 0) - (stats.totalRefunded || 0) - (stats.totalForfeited || 0))}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface GiftCardTemplate {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  category?: string;
  designUrl?: string;
  designData?: Record<string, any>;
  presetValuesPaisa?: string[];
  allowCustomValue: number;
  minValuePaisa: number;
  maxValuePaisa: number;
  isActive: number;
  isDefault: number;
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

interface GiftCard {
  id: string;
  code: string;
  balancePaisa: number;
  originalValuePaisa: number;
  status: string;
  expiresAt?: string;
  recipientName?: string;
  recipientEmail?: string;
  purchasedAt?: string;
  lastUsedAt?: string;
  redemptionCount: number;
  totalRedemptionsPaisa: number;
  purchaserEmail?: string;
  purchaserName?: string;
}

function GiftCardsSettings({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [activeGiftCardTab, setActiveGiftCardTab] = useState<'templates' | 'cards' | 'redeem' | 'analytics'>('templates');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingTemplate, setEditingTemplate] = useState<GiftCardTemplate | null>(null);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [validatedCard, setValidatedCard] = useState<any>(null);

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/business/gift-cards', salonId, 'templates'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/gift-cards/${salonId}/templates`);
      return res.json();
    },
    enabled: !!salonId,
  });

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['/api/business/gift-cards', salonId, 'cards'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/gift-cards/${salonId}/cards`);
      return res.json();
    },
    enabled: !!salonId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/business/gift-cards', salonId, 'analytics'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/business/gift-cards/${salonId}/analytics`);
      return res.json();
    },
    enabled: !!salonId,
  });

  const { data: bookings } = useQuery({
    queryKey: ['/api/salons', salonId, 'bookings', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await apiRequest('GET', `/api/salons/${salonId}/bookings?date=${today}`);
      return res.json();
    },
    enabled: !!salonId && activeGiftCardTab === 'redeem',
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/business/gift-cards/${salonId}/templates`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/gift-cards', salonId, 'templates'] });
      toast({ title: "Success", description: "Template created successfully" });
      setCreateTemplateOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ templateId, data }: { templateId: string; data: any }) => {
      return apiRequest('PUT', `/api/business/gift-cards/${salonId}/templates/${templateId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/gift-cards', salonId, 'templates'] });
      toast({ title: "Success", description: "Template updated successfully" });
      setEditingTemplate(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest('DELETE', `/api/business/gift-cards/${salonId}/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/gift-cards', salonId, 'templates'] });
      toast({ title: "Success", description: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    },
  });

  const validateCardMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest('POST', '/api/gift-cards/validate', { code, salonId });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setValidatedCard(data.card);
        toast({ title: "Gift Card Valid", description: `Balance: ${formatCurrency(data.card.balancePaisa)}` });
      } else {
        setValidatedCard(null);
        toast({ title: "Invalid Gift Card", description: data.error, variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to validate gift card", variant: "destructive" });
    },
  });

  const redeemCardMutation = useMutation({
    mutationFn: async (data: { code: string; bookingId: string; amountPaisa?: number }) => {
      return apiRequest('POST', `/api/business/gift-cards/${salonId}/redeem`, data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/gift-cards', salonId, 'cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business/gift-cards', salonId, 'analytics'] });
      toast({ 
        title: "Gift Card Redeemed", 
        description: `Redeemed ${formatCurrency(data.redeemedAmount)}. Remaining: ${formatCurrency(data.remainingBalance)}` 
      });
      setRedeemCode('');
      setRedeemAmount('');
      setSelectedBookingId('');
      setValidatedCard(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to redeem gift card", variant: "destructive" });
    },
  });

  const formatCurrency = (paisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(paisa / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'partially_used': 'bg-blue-100 text-blue-800',
      'fully_redeemed': 'bg-slate-100 text-slate-800',
      'expired': 'bg-red-100 text-red-800',
      'pending_payment': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return statusStyles[status] || 'bg-slate-100 text-slate-800';
  };

  const filteredCards = (cards?.cards || []).filter((card: GiftCard) => {
    const matchesSearch = 
      card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.purchaserName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const giftCardTabs = [
    { id: 'templates', label: 'Templates', icon: Layout },
    { id: 'cards', label: 'Gift Cards', icon: CreditCard },
    { id: 'redeem', label: 'Redeem', icon: QrCode },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gift Cards Management</h2>
        <p className="text-muted-foreground">Create and manage gift cards for your salon</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {giftCardTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeGiftCardTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveGiftCardTab(tab.id as any)}
              className={isActive ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeGiftCardTab === 'templates' && (
        <GiftCardTemplatesTab
          templates={templates?.templates || []}
          isLoading={templatesLoading}
          onCreateTemplate={() => setCreateTemplateOpen(true)}
          onEditTemplate={setEditingTemplate}
          onDeleteTemplate={(id) => deleteTemplateMutation.mutate(id)}
          isDeleting={deleteTemplateMutation.isPending}
          formatCurrency={formatCurrency}
        />
      )}

      {activeGiftCardTab === 'cards' && (
        <GiftCardListTab
          cards={filteredCards}
          isLoading={cardsLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
        />
      )}

      {activeGiftCardTab === 'redeem' && (
        <GiftCardRedeemTab
          redeemCode={redeemCode}
          onCodeChange={setRedeemCode}
          redeemAmount={redeemAmount}
          onAmountChange={setRedeemAmount}
          selectedBookingId={selectedBookingId}
          onBookingChange={setSelectedBookingId}
          validatedCard={validatedCard}
          bookings={bookings || []}
          onValidate={() => validateCardMutation.mutate(redeemCode)}
          onRedeem={() => {
            if (!selectedBookingId) {
              toast({ title: "Error", description: "Please select a booking", variant: "destructive" });
              return;
            }
            redeemCardMutation.mutate({
              code: redeemCode,
              bookingId: selectedBookingId,
              amountPaisa: redeemAmount ? parseFloat(redeemAmount) * 100 : undefined,
            });
          }}
          isValidating={validateCardMutation.isPending}
          isRedeeming={redeemCardMutation.isPending}
          formatCurrency={formatCurrency}
        />
      )}

      {activeGiftCardTab === 'analytics' && (
        <GiftCardAnalyticsTab
          analytics={analytics}
          isLoading={analyticsLoading}
          formatCurrency={formatCurrency}
        />
      )}

      <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Gift Card Template</DialogTitle>
            <DialogDescription>
              Design a gift card template for your customers
            </DialogDescription>
          </DialogHeader>
          <GiftCardTemplateForm
            onSubmit={(data) => createTemplateMutation.mutate(data)}
            isPending={createTemplateMutation.isPending}
            onCancel={() => setCreateTemplateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Gift Card Template</DialogTitle>
            <DialogDescription>
              Update the gift card template
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <GiftCardTemplateForm
              template={editingTemplate}
              onSubmit={(data) => updateTemplateMutation.mutate({ templateId: editingTemplate.id, data })}
              isPending={updateTemplateMutation.isPending}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GiftCardTemplatesTab({
  templates,
  isLoading,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isDeleting,
  formatCurrency,
}: {
  templates: GiftCardTemplate[];
  isLoading: boolean;
  onCreateTemplate: () => void;
  onEditTemplate: (template: GiftCardTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  isDeleting: boolean;
  formatCurrency: (paisa: number) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Design templates that customers can choose from when purchasing gift cards
        </p>
        <Button onClick={onCreateTemplate} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed border-2 border-violet-200">
          <CardContent className="py-12 text-center">
            <Gift className="h-12 w-12 mx-auto text-violet-300 mb-4" />
            <h3 className="font-semibold mb-2">No Templates Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first gift card template to start selling gift cards
            </p>
            <Button onClick={onCreateTemplate} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Create First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="border-violet-100 overflow-hidden">
              <div 
                className="h-24 flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-500 text-white"
              >
                <Gift className="h-10 w-10" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{template.category || 'general'}</p>
                  </div>
                  <div className="flex gap-1">
                    {template.isDefault === 1 && (
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    )}
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="text-sm mb-3">
                  <span className="text-muted-foreground">Value Range: </span>
                  <span className="font-medium">
                    {formatCurrency(template.minValuePaisa)} - {formatCurrency(template.maxValuePaisa)}
                  </span>
                </div>
                <div className="text-sm mb-4">
                  <span className="text-muted-foreground">Custom amounts: </span>
                  <span className="font-medium">{template.allowCustomValue ? 'Allowed' : 'Not allowed'}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditTemplate(template)}
                    className="flex-1"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteTemplate(template.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GiftCardTemplateForm({
  template,
  onSubmit,
  isPending,
  onCancel,
}: {
  template?: GiftCardTemplate;
  onSubmit: (data: any) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'general');
  const [minValue, setMinValue] = useState((template?.minValuePaisa || 50000) / 100);
  const [maxValue, setMaxValue] = useState((template?.maxValuePaisa || 2500000) / 100);
  const [allowCustomValue, setAllowCustomValue] = useState(template?.allowCustomValue !== 0);
  const [isActive, setIsActive] = useState(template?.isActive !== 0);
  const [presetValues, setPresetValues] = useState<string>(
    template?.presetValuesPaisa?.map(v => parseInt(v) / 100).join(', ') || '500, 1000, 2000, 5000'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const presetValuesPaisa = presetValues.split(',')
      .map(v => String(parseFloat(v.trim()) * 100))
      .filter(v => !isNaN(parseFloat(v)));
    
    onSubmit({
      name,
      description: description || null,
      category,
      minValuePaisa: minValue * 100,
      maxValuePaisa: maxValue * 100,
      allowCustomValue: allowCustomValue ? 1 : 0,
      presetValuesPaisa,
      isActive: isActive ? 1 : 0,
      sortOrder: template?.sortOrder || 0,
    });
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'occasion', label: 'Special Occasion' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Birthday Gift Card"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description for the template"
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minValue">Minimum Value (₹)</Label>
          <Input
            id="minValue"
            type="number"
            value={minValue}
            onChange={(e) => setMinValue(parseFloat(e.target.value) || 500)}
            min={100}
          />
        </div>
        <div>
          <Label htmlFor="maxValue">Maximum Value (₹)</Label>
          <Input
            id="maxValue"
            type="number"
            value={maxValue}
            onChange={(e) => setMaxValue(parseFloat(e.target.value) || 25000)}
            min={minValue}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="presetValues">Preset Values (₹, comma-separated)</Label>
        <Input
          id="presetValues"
          value={presetValues}
          onChange={(e) => setPresetValues(e.target.value)}
          placeholder="500, 1000, 2000, 5000"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Suggested amounts customers can quickly select
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="allowCustomValue" className="cursor-pointer">Allow Custom Amounts</Label>
        <Switch
          id="allowCustomValue"
          checked={allowCustomValue}
          onCheckedChange={setAllowCustomValue}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <div className="h-20 rounded-lg flex items-center justify-center bg-gradient-to-r from-violet-500 to-purple-500 text-white">
        <Gift className="h-8 w-8 mr-2" />
        <span className="font-semibold">{name || 'Preview'}</span>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1 bg-violet-600 hover:bg-violet-700">
          {isPending ? "Saving..." : template ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </form>
  );
}

function GiftCardListTab({
  cards,
  isLoading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  formatCurrency,
  getStatusBadge,
}: {
  cards: GiftCard[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  formatCurrency: (paisa: number) => string;
  getStatusBadge: (status: string) => string;
}) {
  const { toast } = useToast();

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: "Gift card code copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'partially_used', label: 'Partially Used' },
    { value: 'fully_redeemed', label: 'Fully Redeemed' },
    { value: 'expired', label: 'Expired' },
    { value: 'pending_payment', label: 'Pending Payment' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, recipient, or purchaser..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cards.length === 0 ? (
        <Card className="border-dashed border-2 border-violet-200">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-violet-300 mb-4" />
            <h3 className="font-semibold mb-2">No Gift Cards Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? "Try adjusting your filters"
                : "Gift cards will appear here when customers purchase them"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-violet-100">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-violet-50">
                  <tr>
                    <th className="text-left p-3 font-medium text-sm">Code</th>
                    <th className="text-left p-3 font-medium text-sm">Recipient</th>
                    <th className="text-left p-3 font-medium text-sm">Value</th>
                    <th className="text-left p-3 font-medium text-sm">Balance</th>
                    <th className="text-left p-3 font-medium text-sm">Status</th>
                    <th className="text-left p-3 font-medium text-sm">Purchased</th>
                    <th className="text-left p-3 font-medium text-sm">Uses</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cards.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                            {card.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(card.code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium">{card.recipientName || '-'}</p>
                          <p className="text-xs text-muted-foreground">{card.recipientEmail || '-'}</p>
                        </div>
                      </td>
                      <td className="p-3 font-medium">
                        {formatCurrency(card.originalValuePaisa)}
                      </td>
                      <td className="p-3">
                        <span className={card.balancePaisa > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                          {formatCurrency(card.balancePaisa)}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusBadge(card.status)}>
                          {card.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {card.purchasedAt 
                          ? new Date(card.purchasedAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-3 text-sm">
                        {card.redemptionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GiftCardRedeemTab({
  redeemCode,
  onCodeChange,
  redeemAmount,
  onAmountChange,
  selectedBookingId,
  onBookingChange,
  validatedCard,
  bookings,
  onValidate,
  onRedeem,
  isValidating,
  isRedeeming,
  formatCurrency,
}: {
  redeemCode: string;
  onCodeChange: (value: string) => void;
  redeemAmount: string;
  onAmountChange: (value: string) => void;
  selectedBookingId: string;
  onBookingChange: (value: string) => void;
  validatedCard: any;
  bookings: any[];
  onValidate: () => void;
  onRedeem: () => void;
  isValidating: boolean;
  isRedeeming: boolean;
  formatCurrency: (paisa: number) => string;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-violet-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-violet-600" />
            Redeem Gift Card
          </CardTitle>
          <CardDescription>
            Enter a gift card code to validate and apply to a booking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter gift card code (e.g., GIFT-XXXX-XXXX)"
              value={redeemCode}
              onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
              className="flex-1 font-mono"
            />
            <Button 
              onClick={onValidate} 
              disabled={!redeemCode || isValidating}
              variant="outline"
            >
              {isValidating ? "Checking..." : "Validate"}
            </Button>
          </div>

          {validatedCard && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">Valid Gift Card</p>
                    <p className="text-sm text-green-700">
                      Code: {validatedCard.code} | Balance: {formatCurrency(validatedCard.balancePaisa)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {validatedCard && (
            <>
              <Separator />
              
              <div>
                <Label htmlFor="booking">Select Booking to Apply</Label>
                <Select value={selectedBookingId} onValueChange={onBookingChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a booking..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(bookings || []).map((booking: any) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.customerName || 'Guest'} - {booking.serviceName} - {formatCurrency(booking.totalPaisa || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount to Redeem (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={`Max: ₹${validatedCard.balancePaisa / 100}`}
                  value={redeemAmount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  max={validatedCard.balancePaisa / 100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to redeem full balance
                </p>
              </div>

              <Button 
                onClick={onRedeem} 
                disabled={!selectedBookingId || isRedeeming}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {isRedeeming ? "Processing..." : "Redeem Gift Card"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-100 bg-violet-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-violet-600 mt-0.5" />
            <div className="text-sm text-violet-800">
              <p className="font-medium mb-1">How to Redeem</p>
              <ol className="list-decimal list-inside space-y-1 text-violet-700">
                <li>Enter the gift card code and click Validate</li>
                <li>Select the booking to apply the gift card to</li>
                <li>Optionally enter a partial amount, or leave empty for full balance</li>
                <li>Click Redeem to complete the transaction</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GiftCardAnalyticsTab({
  analytics,
  isLoading,
  formatCurrency,
}: {
  analytics: any;
  isLoading: boolean;
  formatCurrency: (paisa: number) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const stats = {
    totalSold: {
      count: analytics?.totalSold?.count || 0,
      valuePaisa: analytics?.totalSold?.valuePaisa || 0,
    },
    totalRedeemed: {
      count: analytics?.totalRedeemed?.count || 0,
      valuePaisa: analytics?.totalRedeemed?.valuePaisa || 0,
    },
    fullyRedeemedCount: analytics?.fullyRedeemedCount || 0,
    outstandingBalancePaisa: analytics?.outstandingBalancePaisa || 0,
    expired: {
      count: analytics?.expired?.count || 0,
      lostValuePaisa: analytics?.expired?.lostValuePaisa || 0,
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-violet-100">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cards Sold</p>
                <p className="text-2xl font-bold">{stats.totalSold.count}</p>
                <p className="text-xs text-green-600">
                  {formatCurrency(stats.totalSold.valuePaisa)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-100">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Redeemed</p>
                <p className="text-2xl font-bold">{stats.totalRedeemed.count}</p>
                <p className="text-xs text-blue-600">
                  {formatCurrency(stats.totalRedeemed.valuePaisa)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-100">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-violet-600">
                  {formatCurrency(stats.outstandingBalancePaisa)}
                </p>
                <p className="text-xs text-muted-foreground">Unredeemed balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-100">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{stats.expired.count}</p>
                <p className="text-xs text-amber-600">
                  {formatCurrency(stats.expired.lostValuePaisa)} unused
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-violet-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              Revenue Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Gift Card Sales</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.totalSold.valuePaisa)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount Applied to Bookings</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(stats.totalRedeemed.valuePaisa)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Breakage (Expired Unused)</span>
                <span className="font-semibold text-amber-600">
                  {formatCurrency(stats.expired.lostValuePaisa)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-violet-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-600" />
              Redemption Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Fully Redeemed Cards</span>
                <span className="font-semibold">{stats.fullyRedeemedCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Redemption Rate</span>
                <span className="font-semibold">
                  {stats.totalSold.valuePaisa > 0
                    ? Math.round((stats.totalRedeemed.valuePaisa / stats.totalSold.valuePaisa) * 100)
                    : 0}%
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Gift Card Value</span>
                <span className="font-semibold">
                  {stats.totalSold.count > 0
                    ? formatCurrency(stats.totalSold.valuePaisa / stats.totalSold.count)
                    : '₹0'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center">
              <Gift className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Gift Card Performance</h3>
              <p className="text-muted-foreground">
                Gift cards help bring new customers and increase repeat visits. 
                {stats.outstandingBalancePaisa > 0 && (
                  <span className="text-violet-600 font-medium">
                    {" "}You have {formatCurrency(stats.outstandingBalancePaisa)} in outstanding gift card balance waiting to be redeemed!
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Rebooking Settings Component
function RebookingSettings({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [editingCycle, setEditingCycle] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewChannel, setPreviewChannel] = useState<'email' | 'sms' | 'whatsapp'>('email');

  // Fetch rebooking settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/rebooking/settings', salonId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/rebooking/settings/${salonId}`);
      return res.json();
    },
    enabled: !!salonId,
  });

  // Fetch service rebooking cycles
  const { data: cycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['/api/rebooking/cycles', salonId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/rebooking/cycles/${salonId}`);
      return res.json();
    },
    enabled: !!salonId,
  });

  // Fetch services for the salon
  const { data: services } = useQuery({
    queryKey: ['/api/services', salonId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/services?salonId=${salonId}`);
      return res.json();
    },
    enabled: !!salonId,
  });

  // Fetch due rebookings
  const { data: dueRebookings } = useQuery({
    queryKey: ['/api/rebooking/due', salonId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/rebooking/due/${salonId}?limit=10`);
      return res.json();
    },
    enabled: !!salonId && settings?.isEnabled === 1,
  });

  // Fetch rebooking analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/rebooking/analytics', salonId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/rebooking/analytics/${salonId}`);
      return res.json();
    },
    enabled: !!salonId && settings?.isEnabled === 1,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', `/api/rebooking/settings/${salonId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rebooking/settings', salonId] });
      queryClient.invalidateQueries({ queryKey: ['/api/rebooking/due', salonId] });
      toast({ title: "Success", description: "Rebooking settings updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  const updateSetting = (key: string, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  // Create/Update cycle mutation
  const saveCycleMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingCycle
        ? `/api/rebooking/cycles/${salonId}/${editingCycle.id}`
        : `/api/rebooking/cycles/${salonId}`;
      const method = editingCycle ? 'PUT' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rebooking/cycles', salonId] });
      toast({ title: "Success", description: editingCycle ? "Cycle updated" : "Cycle created" });
      setShowCycleDialog(false);
      setEditingCycle(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save cycle", variant: "destructive" });
    },
  });

  // Delete cycle mutation
  const deleteCycleMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      return apiRequest('DELETE', `/api/rebooking/cycles/${salonId}/${cycleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rebooking/cycles', salonId] });
      toast({ title: "Success", description: "Cycle deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete cycle", variant: "destructive" });
    },
  });

  // Schedule reminders mutation
  const scheduleRemindersMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/rebooking/schedule/${salonId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rebooking/due', salonId] });
      toast({ title: "Success", description: `${data.scheduledCount} reminders scheduled` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule reminders", variant: "destructive" });
    },
  });

  // Export due customers to Excel
  const exportToExcel = async () => {
    if (!dueRebookings || dueRebookings.length === 0) {
      toast({ title: "No data", description: "No customers to export", variant: "destructive" });
      return;
    }

    try {
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Due Rebookings');

      worksheet.columns = [
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Phone', key: 'customerPhone', width: 18 },
        { header: 'Email', key: 'customerEmail', width: 30 },
        { header: 'Service', key: 'serviceName', width: 25 },
        { header: 'Last Booking', key: 'lastBookingDate', width: 15 },
        { header: 'Status', key: 'rebookingStatus', width: 12 },
        { header: 'Days Overdue', key: 'daysOverdue', width: 12 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF8B5CF6' }
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

      dueRebookings.forEach((item: any) => {
        worksheet.addRow({
          customerName: item.customerName || 'Unknown',
          customerPhone: item.customerPhone || '-',
          customerEmail: item.customerEmail || '-',
          serviceName: item.serviceName || '-',
          lastBookingDate: item.lastBookingDate 
            ? new Date(item.lastBookingDate).toLocaleDateString() 
            : 'N/A',
          rebookingStatus: item.rebookingStatus || '-',
          daysOverdue: item.daysOverdue || 0,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `due-rebookings-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Excel file downloaded" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export to Excel", variant: "destructive" });
    }
  };

  // Export due customers to PDF
  const exportToPDF = () => {
    if (!dueRebookings || dueRebookings.length === 0) {
      toast({ title: "No data", description: "No customers to export", variant: "destructive" });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: "Error", description: "Please allow popups to export PDF", variant: "destructive" });
        return;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Due Rebookings Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            h1 { color: #8B5CF6; margin-bottom: 5px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: linear-gradient(to right, #8B5CF6, #A855F7); color: white; padding: 12px 8px; text-align: left; }
            td { padding: 10px 8px; border-bottom: 1px solid #eee; }
            tr:hover { background: #f9fafb; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status-overdue { background: #FEE2E2; color: #B91C1C; }
            .status-due { background: #FEF3C7; color: #B45309; }
            .status-approaching { background: #DBEAFE; color: #1D4ED8; }
            .footer { margin-top: 30px; color: #666; font-size: 12px; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>Customers Due for Rebooking</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Service</th>
                <th>Last Visit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dueRebookings.map((item: any) => `
                <tr>
                  <td><strong>${item.customerName || 'Unknown'}</strong></td>
                  <td>
                    ${item.customerPhone ? `<div>${item.customerPhone}</div>` : ''}
                    ${item.customerEmail ? `<div style="font-size: 12px; color: #666;">${item.customerEmail}</div>` : ''}
                    ${!item.customerPhone && !item.customerEmail ? '-' : ''}
                  </td>
                  <td>${item.serviceName || '-'}</td>
                  <td>${item.lastBookingDate ? new Date(item.lastBookingDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span class="status status-${item.rebookingStatus || 'due'}">
                      ${item.rebookingStatus || '-'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="footer">Total: ${dueRebookings.length} customer(s)</p>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      toast({ title: "Success", description: "PDF opened for printing" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export to PDF", variant: "destructive" });
    }
  };

  if (settingsLoading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const getServiceName = (serviceId: string) => {
    return services?.find((s: any) => s.id === serviceId)?.name || 'Unknown Service';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      overdue: 'bg-red-100 text-red-700',
      due: 'bg-amber-100 text-amber-700',
      approaching: 'bg-blue-100 text-blue-700',
      not_due: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-violet-600" />
          Smart Rebooking
        </h2>
        <p className="text-muted-foreground">
          Automatically remind customers when it's time for their next appointment
        </p>
      </div>

      <Separator />

      {/* Main Toggle */}
      <Card className="border-violet-100">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Enable Smart Rebooking</h3>
                <p className="text-sm text-muted-foreground">
                  Send automatic reminders to customers based on service cycles
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.isEnabled === 1}
              onCheckedChange={(checked) => updateSettingsMutation.mutate({ isEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {settings?.isEnabled === 1 && (
        <>
          {/* Analytics Dashboard */}
          <Card className="border-violet-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-violet-600" />
                    Rebooking Analytics
                  </CardTitle>
                  <CardDescription>
                    Track customer retention and reminder effectiveness
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overview Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-violet-700">
                        {analytics?.dashboard?.totalCustomersTracked || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Tracked</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-700">
                        {analytics?.dashboard?.customersDue || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Due Now</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-rose-50 border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-700">
                        {analytics?.dashboard?.customersOverdue || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Overdue</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-700">
                        {analytics?.dashboard?.customersApproaching || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Approaching</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Rate */}
              {analytics?.dashboard?.overallConversionRate !== undefined && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Conversion Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-green-700">
                      {(analytics.dashboard.overallConversionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(analytics.dashboard.overallConversionRate * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Percentage of reminders that converted to bookings ({analytics.dashboard.totalConversions || 0} conversions from {analytics.dashboard.totalRemindersSent || 0} reminders)
                  </p>
                </div>
              )}

              <Separator />

              {/* Reminder Stats */}
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-violet-600" />
                  Reminder Performance (Last 30 Days)
                </h4>
                <div className="grid gap-3 sm:grid-cols-5">
                  <div className="text-center p-4 rounded-lg border border-violet-100">
                    <p className="text-2xl font-bold text-violet-700">
                      {analytics?.reminders?.totalSent || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-blue-100 bg-blue-50/30">
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics?.reminders?.delivered || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                    {analytics?.reminders?.deliveryRate > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {(analytics.reminders.deliveryRate * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <div className="text-center p-4 rounded-lg border border-indigo-100 bg-indigo-50/30">
                    <p className="text-2xl font-bold text-indigo-600">
                      {analytics?.reminders?.opened || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Opened</p>
                    {analytics?.reminders?.openRate > 0 && (
                      <p className="text-xs text-indigo-600 mt-1">
                        {(analytics.reminders.openRate * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <div className="text-center p-4 rounded-lg border border-purple-100 bg-purple-50/30">
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics?.reminders?.clicked || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Clicked</p>
                    {analytics?.reminders?.clickRate > 0 && (
                      <p className="text-xs text-purple-600 mt-1">
                        {(analytics.reminders.clickRate * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <div className="text-center p-4 rounded-lg border border-green-100 bg-green-50/30">
                    <p className="text-2xl font-bold text-green-600">
                      {analytics?.reminders?.converted || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Booked</p>
                    {analytics?.reminders?.conversionRate > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        {(analytics.reminders.conversionRate * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
                
                {(analytics?.reminders?.failed || 0) > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      {analytics.reminders.failed} reminder(s) failed to send
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Metrics */}
              {analytics?.dashboard?.avgDaysBetweenBookings > 0 && (
                <div className="p-4 rounded-lg border border-violet-100 bg-violet-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-600" />
                      <span className="text-sm font-medium">Average Days Between Bookings</span>
                    </div>
                    <p className="text-xl font-bold text-violet-700">
                      {analytics.dashboard.avgDaysBetweenBookings.toFixed(0)} days
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Analytics Charts */}
          {analytics && (
            <Card className="border-violet-100">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                  Visual Analytics
                </CardTitle>
                <CardDescription>
                  Charts showing customer status and reminder performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Customer Status Breakdown Chart */}
                  <div className="p-4 rounded-lg border border-violet-100">
                    <h4 className="font-medium mb-4 text-sm">Customer Status Breakdown</h4>
                    {!analytics?.dashboard ? (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-center text-muted-foreground text-sm">No customers require rebooking yet</p>
                      </div>
                    ) : (() => {
                      const dashboard = analytics.dashboard;
                      const customerData = [
                        { name: 'Approaching', value: Number(dashboard.customersApproaching) || 0, color: '#3B82F6' },
                        { name: 'Due', value: Number(dashboard.customersDue) || 0, color: '#F59E0B' },
                        { name: 'Overdue', value: Number(dashboard.customersOverdue) || 0, color: '#EF4444' },
                      ];
                      const filteredData = customerData.filter(d => d.value > 0);
                      const totalCustomers = customerData.reduce((sum, d) => sum + d.value, 0);
                      
                      if (totalCustomers === 0) {
                        return (
                          <div className="h-64 flex items-center justify-center">
                            <p className="text-center text-muted-foreground text-sm">No customers require rebooking yet</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={filteredData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {filteredData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => [value, 'Customers']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Reminder Funnel Chart */}
                  <div className="p-4 rounded-lg border border-violet-100">
                    <h4 className="font-medium mb-4 text-sm">Reminder Performance Funnel</h4>
                    {!analytics?.reminders ? (
                      <div className="h-64 flex items-center justify-center">
                        <p className="text-center text-muted-foreground text-sm">No reminders sent yet</p>
                      </div>
                    ) : (() => {
                      const reminders = analytics.reminders;
                      const reminderData = [
                        { stage: 'Sent', count: Number(reminders.totalSent) || 0, fill: '#8B5CF6' },
                        { stage: 'Delivered', count: Number(reminders.delivered) || 0, fill: '#6366F1' },
                        { stage: 'Opened', count: Number(reminders.opened) || 0, fill: '#3B82F6' },
                        { stage: 'Clicked', count: Number(reminders.clicked) || 0, fill: '#06B6D4' },
                        { stage: 'Booked', count: Number(reminders.converted) || 0, fill: '#10B981' },
                      ];
                      const totalSent = reminderData[0].count;
                      
                      if (totalSent === 0) {
                        return (
                          <div className="h-64 flex items-center justify-center">
                            <p className="text-center text-muted-foreground text-sm">No reminders sent yet</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={reminderData}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis type="number" />
                              <YAxis dataKey="stage" type="category" width={70} />
                              <Tooltip 
                                formatter={(value: number) => [value, 'Count']}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {reminderData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Conversion Rate Gauge */}
                {(() => {
                  const conversionRate = Number(analytics?.dashboard?.overallConversionRate) || 0;
                  const totalConversions = Number(analytics?.dashboard?.totalConversions) || 0;
                  const totalRemindersSent = Number(analytics?.dashboard?.totalRemindersSent) || 0;
                  const widthPercent = Math.min(Math.max(conversionRate * 100, 0), 100);
                  
                  return (
                    <div className="p-4 rounded-lg border border-violet-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Overall Conversion Performance</h4>
                        <Badge 
                          variant="secondary" 
                          className={
                            conversionRate >= 0.2 
                              ? 'bg-green-100 text-green-700' 
                              : conversionRate >= 0.1 
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                          }
                        >
                          {conversionRate >= 0.2 ? 'Excellent' : conversionRate >= 0.1 ? 'Good' : 'Needs Improvement'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-violet-500 to-green-500 transition-all duration-700"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>Target: 20%</span>
                            <span>100%</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-violet-700">
                            {(conversionRate * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {totalConversions} / {totalRemindersSent}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Default Settings */}
          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle className="text-lg">Default Settings</CardTitle>
              <CardDescription>
                These apply when no service-specific cycle is configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Default Recommended Days</Label>
                  <Input
                    type="number"
                    value={settings?.defaultRecommendedDays || 30}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      defaultRecommendedDays: parseInt(e.target.value) 
                    })}
                    min={1}
                    max={365}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Days between appointments</p>
                </div>
                <div>
                  <Label>First Reminder (days before)</Label>
                  <Input
                    type="number"
                    value={settings?.defaultFirstReminderDays || 7}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      defaultFirstReminderDays: parseInt(e.target.value) 
                    })}
                    min={1}
                    max={30}
                  />
                </div>
                <div>
                  <Label>Second Reminder (days before)</Label>
                  <Input
                    type="number"
                    value={settings?.defaultSecondReminderDays || 3}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      defaultSecondReminderDays: parseInt(e.target.value) 
                    })}
                    min={0}
                    max={14}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Reminder Channels</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings?.defaultReminderChannels?.includes('email')}
                      onCheckedChange={(checked) => {
                        const channels = settings?.defaultReminderChannels || [];
                        const updated = checked
                          ? [...channels, 'email']
                          : channels.filter((c: string) => c !== 'email');
                        updateSettingsMutation.mutate({ defaultReminderChannels: updated });
                      }}
                    />
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings?.defaultReminderChannels?.includes('sms')}
                      onCheckedChange={(checked) => {
                        const channels = settings?.defaultReminderChannels || [];
                        const updated = checked
                          ? [...channels, 'sms']
                          : channels.filter((c: string) => c !== 'sms');
                        updateSettingsMutation.mutate({ defaultReminderChannels: updated });
                      }}
                    />
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> SMS
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings?.defaultReminderChannels?.includes('whatsapp')}
                      onCheckedChange={(checked) => {
                        const channels = settings?.defaultReminderChannels || [];
                        const updated = checked
                          ? [...channels, 'whatsapp']
                          : channels.filter((c: string) => c !== 'whatsapp');
                        updateSettingsMutation.mutate({ defaultReminderChannels: updated });
                      }}
                    />
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" /> WhatsApp
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings?.defaultReminderChannels?.includes('push')}
                      onCheckedChange={(checked) => {
                        const channels = settings?.defaultReminderChannels || [];
                        const updated = checked
                          ? [...channels, 'push']
                          : channels.filter((c: string) => c !== 'push');
                        updateSettingsMutation.mutate({ defaultReminderChannels: updated });
                      }}
                    />
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" /> Push
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Rebooking Discount</h4>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings?.enableRebookingDiscount === 1}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ 
                      enableRebookingDiscount: checked 
                    })}
                  />
                  <div className="flex-1">
                    <Label>Offer discount for quick rebooking</Label>
                    {settings?.enableRebookingDiscount === 1 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          value={settings?.rebookingDiscountPercent || 10}
                          onChange={(e) => updateSettingsMutation.mutate({ 
                            rebookingDiscountPercent: parseFloat(e.target.value) 
                          })}
                          className="w-20"
                          min={1}
                          max={50}
                        />
                        <span>% off for</span>
                        <Input
                          type="number"
                          value={settings?.discountValidDays || 7}
                          onChange={(e) => updateSettingsMutation.mutate({ 
                            discountValidDays: parseInt(e.target.value) 
                          })}
                          className="w-20"
                          min={1}
                          max={30}
                        />
                        <span>days after reminder</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card className="border-violet-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-violet-600" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Fine-tune reminder behavior and customer preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-violet-600" />
                      Quiet Hours
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Don't send reminders during these hours (customer's local time)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm w-16">From</Label>
                    <Select
                      value={settings?.quietHoursStart || '21:00'}
                      onValueChange={(value) => updateSettingsMutation.mutate({ quietHoursStart: value })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm w-16">To</Label>
                    <Select
                      value={settings?.quietHoursEnd || '09:00'}
                      onValueChange={(value) => updateSettingsMutation.mutate({ quietHoursEnd: value })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground bg-violet-50 p-2 rounded">
                  Example: Set 21:00 to 09:00 to avoid sending reminders between 9 PM and 9 AM
                </p>
              </div>

              <Separator />

              {/* Max Reminders Per Service */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4 text-violet-600" />
                    Maximum Reminders Per Service
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Limit how many reminders a customer receives for each service before they book
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={settings?.maxRemindersPerService || 2}
                    onChange={(e) => updateSettingsMutation.mutate({ 
                      maxRemindersPerService: parseInt(e.target.value) 
                    })}
                    className="w-20"
                    min={1}
                    max={5}
                  />
                  <span className="text-sm text-muted-foreground">reminders maximum per service</span>
                </div>
              </div>

              <Separator />

              {/* Min/Max Days Range */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-600" />
                    Default Rebooking Window
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Define the earliest and latest a customer should rebook
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Minimum Days</Label>
                    <Input
                      type="number"
                      value={settings?.defaultMinDays || 14}
                      onChange={(e) => updateSettingsMutation.mutate({ 
                        defaultMinDays: parseInt(e.target.value) 
                      })}
                      min={1}
                      max={365}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Earliest suggested rebooking</p>
                  </div>
                  <div>
                    <Label>Maximum Days</Label>
                    <Input
                      type="number"
                      value={settings?.defaultMaxDays || 60}
                      onChange={(e) => updateSettingsMutation.mutate({ 
                        defaultMaxDays: parseInt(e.target.value) 
                      })}
                      min={1}
                      max={365}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Latest before marked overdue</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Customer Opt-Out Respect */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-violet-600" />
                      Respect Customer Opt-Out
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Stop sending reminders to customers who have opted out of marketing communications
                    </p>
                  </div>
                  <Switch
                    checked={settings?.respectCustomerOptOut === 1}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ 
                      respectCustomerOptOut: checked 
                    })}
                  />
                </div>
                {settings?.respectCustomerOptOut === 1 && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Customer preferences are being respected. Opt-out customers won't receive reminders.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Cycles */}
          <Card className="border-violet-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Service Rebooking Cycles</CardTitle>
                  <CardDescription>
                    Set custom rebooking schedules for different services
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingCycle(null);
                    setShowCycleDialog(true);
                  }}
                  className="bg-gradient-to-r from-violet-500 to-purple-500"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Cycle
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cyclesLoading ? (
                <div className="text-center py-8">Loading cycles...</div>
              ) : cycles?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No service cycles configured yet</p>
                  <p className="text-sm">Add a cycle to customize rebooking for specific services</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cycles?.map((cycle: any) => (
                    <div
                      key={cycle.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-violet-100 hover:bg-violet-50/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{getServiceName(cycle.serviceId)}</h4>
                        <p className="text-sm text-muted-foreground">
                          Recommended: {cycle.recommendedDays} days • 
                          Reminders: {cycle.reminderEnabled ? 'On' : 'Off'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCycle(cycle);
                            setShowCycleDialog(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this cycle?')) {
                              deleteCycleMutation.mutate(cycle.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Due Rebookings */}
          <Card className="border-violet-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Customers Due for Rebooking</CardTitle>
                  <CardDescription>
                    Customers who are due or overdue for their next appointment
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToExcel}
                    disabled={!dueRebookings || dueRebookings.length === 0}
                    title="Export to Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    disabled={!dueRebookings || dueRebookings.length === 0}
                    title="Export to PDF"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPreviewDialog(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Reminder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => scheduleRemindersMutation.mutate()}
                    disabled={scheduleRemindersMutation.isPending}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {scheduleRemindersMutation.isPending ? 'Scheduling...' : 'Send Reminders'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!dueRebookings || dueRebookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>No customers due for rebooking right now</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dueRebookings.map((item: any) => (
                    <div
                      key={`${item.customerId}-${item.serviceId}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-violet-100"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.customerName || 'Unknown Customer'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.serviceName} • Last visit: {item.lastBookingDate 
                            ? new Date(item.lastBookingDate).toLocaleDateString() 
                            : 'N/A'}
                        </p>
                        {item.customerPhone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {item.customerPhone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.customerPhone && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                              title="Call customer"
                            >
                              <a href={`tel:${item.customerPhone.replace(/[^0-9+]/g, '')}`}>
                                <Phone className="h-4 w-4 text-green-600" />
                              </a>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                              title="Send WhatsApp message"
                            >
                              <a 
                                href={`https://wa.me/${item.customerPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageSquare className="h-4 w-4 text-green-500" />
                              </a>
                            </Button>
                          </>
                        )}
                        {item.customerEmail && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                            title="Send email"
                          >
                            <a href={`mailto:${item.customerEmail}?subject=${encodeURIComponent(`Your Next Appointment at ${item.salonName || 'Our Salon'}`)}&body=${encodeURIComponent(`Hi ${item.customerName || 'there'},\n\nWe noticed it's been a while since your last ${item.serviceName || 'appointment'}. We'd love to have you back!\n\nBook your next appointment today.`)}`}>
                              <Mail className="h-4 w-4 text-violet-600" />
                            </a>
                          </Button>
                        )}
                        <Badge className={getStatusBadge(item.rebookingStatus)}>
                          {item.rebookingStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Cycle Dialog */}
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCycle ? 'Edit Cycle' : 'Add Service Cycle'}</DialogTitle>
            <DialogDescription>
              Configure rebooking schedule for a service
            </DialogDescription>
          </DialogHeader>
          <ServiceCycleForm
            cycle={editingCycle}
            services={services || []}
            existingCycles={cycles || []}
            onSubmit={(data) => saveCycleMutation.mutate(data)}
            onCancel={() => {
              setShowCycleDialog(false);
              setEditingCycle(null);
            }}
            isLoading={saveCycleMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Reminder Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-violet-600" />
              Reminder Preview
            </DialogTitle>
            <DialogDescription>
              Preview how reminders will look to your customers
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Channel Selector */}
            <div className="flex gap-2">
              <Button
                variant={previewChannel === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewChannel('email')}
                className={previewChannel === 'email' ? 'bg-violet-600' : ''}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                variant={previewChannel === 'sms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewChannel('sms')}
                className={previewChannel === 'sms' ? 'bg-violet-600' : ''}
              >
                <Phone className="h-4 w-4 mr-2" />
                SMS
              </Button>
              <Button
                variant={previewChannel === 'whatsapp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewChannel('whatsapp')}
                className={previewChannel === 'whatsapp' ? 'bg-violet-600' : ''}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>

            {/* Preview Content */}
            <div className="border rounded-lg overflow-hidden">
              {previewChannel === 'email' && (
                <div className="bg-white">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-4 text-white">
                    <p className="text-xs opacity-80">From: Your Salon</p>
                    <p className="text-xs opacity-80">To: customer@example.com</p>
                    <p className="font-semibold mt-2">Subject: Time for your next appointment!</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <p>Hi <span className="font-semibold text-violet-600">Priya</span>,</p>
                    <p className="text-sm text-muted-foreground">
                      It's been a while since your last <span className="font-medium">Haircut</span> appointment with us!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We'd love to have you back. Book your next appointment today and keep looking your best.
                    </p>
                    {settings?.enableRebookingDiscount === 1 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 my-3">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          Special Offer: {settings.rebookingDiscountPercent}% off your next booking!
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Valid for {settings.discountValidDays} days
                        </p>
                      </div>
                    )}
                    <div className="pt-3">
                      <Button className="bg-gradient-to-r from-violet-600 to-purple-600 w-full">
                        Book Now
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      Your Salon Name • 123 Main Street
                    </p>
                  </div>
                </div>
              )}

              {previewChannel === 'sms' && (
                <div className="bg-gray-100 p-4">
                  <div className="bg-white rounded-2xl rounded-tl-none p-3 max-w-[280px] shadow-sm">
                    <p className="text-sm">
                      Hi Priya! It's time for your next Haircut. 
                      {settings?.enableRebookingDiscount === 1 && (
                        <span> Get {settings.rebookingDiscountPercent}% off if you book within {settings.discountValidDays} days!</span>
                      )}
                      {' '}Book now: salonhub.com/book/abc123
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">- Your Salon</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    ~{settings?.enableRebookingDiscount === 1 ? '140' : '95'} characters
                  </p>
                </div>
              )}

              {previewChannel === 'whatsapp' && (
                <div className="bg-[#e5ddd5] p-4">
                  <div className="bg-white rounded-lg p-3 max-w-[300px] shadow-sm">
                    <p className="text-sm">
                      Hi Priya! 👋
                    </p>
                    <p className="text-sm mt-2">
                      It's been a while since your last <strong>Haircut</strong> with us. We'd love to see you again!
                    </p>
                    {settings?.enableRebookingDiscount === 1 && (
                      <p className="text-sm mt-2">
                        🎁 Special offer: <strong>{settings.rebookingDiscountPercent}% off</strong> if you book within {settings.discountValidDays} days!
                      </p>
                    )}
                    <p className="text-sm mt-2">
                      📅 Tap below to book your appointment:
                    </p>
                    <div className="bg-violet-50 rounded p-2 mt-2 text-center">
                      <p className="text-sm text-violet-600 font-medium">Book Now →</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Your Salon ✨</p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Note */}
            <div className="bg-violet-50 p-3 rounded-lg border border-violet-100">
              <p className="text-sm text-violet-700 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  This is a sample preview. Actual reminders will include the customer's real name, service, and booking link.
                </span>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Service Cycle Form Component
function ServiceCycleForm({
  cycle,
  services,
  existingCycles,
  onSubmit,
  onCancel,
  isLoading,
}: {
  cycle: any;
  services: any[];
  existingCycles: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [serviceId, setServiceId] = useState(cycle?.serviceId || '');
  const [recommendedDays, setRecommendedDays] = useState(cycle?.recommendedDays || 30);
  const [minDays, setMinDays] = useState(cycle?.minDays || 14);
  const [maxDays, setMaxDays] = useState(cycle?.maxDays || 60);
  const [reminderEnabled, setReminderEnabled] = useState(cycle?.reminderEnabled ?? true);
  const [firstReminderDays, setFirstReminderDays] = useState(cycle?.firstReminderDays || 7);
  const [secondReminderDays, setSecondReminderDays] = useState(cycle?.secondReminderDays || 3);
  const [reminderChannels, setReminderChannels] = useState<string[]>(cycle?.reminderChannels || ['email']);
  const [customMessage, setCustomMessage] = useState(cycle?.customMessage || '');

  const availableServices = services.filter(
    (s) => !existingCycles.some((c) => c.serviceId === s.id && c.id !== cycle?.id)
  );

  const handleSubmit = () => {
    if (!serviceId) return;
    onSubmit({
      serviceId,
      recommendedDays,
      minDays,
      maxDays,
      reminderEnabled,
      firstReminderDays,
      secondReminderDays,
      reminderChannels,
      customMessage: customMessage || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Service</Label>
        <Select value={serviceId} onValueChange={setServiceId} disabled={!!cycle}>
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {availableServices.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <div>
          <Label>Min Days</Label>
          <Input
            type="number"
            value={minDays}
            onChange={(e) => setMinDays(parseInt(e.target.value))}
            min={1}
          />
        </div>
        <div>
          <Label>Recommended</Label>
          <Input
            type="number"
            value={recommendedDays}
            onChange={(e) => setRecommendedDays(parseInt(e.target.value))}
            min={1}
          />
        </div>
        <div>
          <Label>Max Days</Label>
          <Input
            type="number"
            value={maxDays}
            onChange={(e) => setMaxDays(parseInt(e.target.value))}
            min={1}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
        <Label>Enable reminders for this service</Label>
      </div>

      {reminderEnabled && (
        <>
          <div className="grid gap-4 grid-cols-2">
            <div>
              <Label>First Reminder (days before)</Label>
              <Input
                type="number"
                value={firstReminderDays}
                onChange={(e) => setFirstReminderDays(parseInt(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <Label>Second Reminder (days before)</Label>
              <Input
                type="number"
                value={secondReminderDays}
                onChange={(e) => setSecondReminderDays(parseInt(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <div>
            <Label>Reminder Channels</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={reminderChannels.includes('email')}
                  onCheckedChange={(checked) => {
                    setReminderChannels(
                      checked
                        ? [...reminderChannels, 'email']
                        : reminderChannels.filter((c) => c !== 'email')
                    );
                  }}
                />
                <span>Email</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={reminderChannels.includes('sms')}
                  onCheckedChange={(checked) => {
                    setReminderChannels(
                      checked
                        ? [...reminderChannels, 'sms']
                        : reminderChannels.filter((c) => c !== 'sms')
                    );
                  }}
                />
                <span>SMS</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Custom Message (optional)</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Use {customerName}, {serviceName}, {salonName} as placeholders..."
              rows={3}
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!serviceId || isLoading}
          className="bg-gradient-to-r from-violet-500 to-purple-500"
        >
          {isLoading ? 'Saving...' : cycle ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );
}

function SubscriptionSettings({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: tiersData, isLoading: tiersLoading } = useQuery({
    queryKey: ['/api/subscriptions/tiers'],
  });

  const { data: subscriptionData, isLoading: subLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ['/api/subscriptions/salon', salonId],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}`);
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json();
    },
  });

  const { data: refundEstimate, refetch: refetchRefundEstimate } = useQuery({
    queryKey: ['/api/subscriptions/salon', salonId, 'refund-estimate'],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}/refund-estimate`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: showCancelModal,
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ['/api/subscriptions/salon', salonId, 'payment-history'],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}/payment-history`);
      if (!res.ok) throw new Error('Failed to fetch payment history');
      return res.json();
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to pause subscription');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Subscription Paused', description: 'Your subscription has been paused. You can resume anytime within 90 days.' });
      setShowPauseModal(false);
      refetchSubscription();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to resume subscription');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Subscription Resumed', description: 'Your subscription is now active again.' });
      refetchSubscription();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}/process-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }
      return res.json();
    },
    onSuccess: (data) => {
      const message = data.refundAmountPaisa > 0 
        ? `Refund of ₹${(data.refundAmountPaisa / 100).toFixed(2)} will be processed within 5-7 business days.`
        : 'Your subscription has been cancelled.';
      toast({ title: 'Subscription Cancelled', description: message });
      setShowCancelModal(false);
      setCancelReason('');
      refetchSubscription();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const startTrialMutation = useMutation({
    mutationFn: async (tierName: string) => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}/start-trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierName, trialDays: 14 }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to start trial');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Trial Started', description: '14-day free trial activated!' });
      refetchSubscription();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ tierName, cycle }: { tierName: string; cycle: 'monthly' | 'yearly' }) => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}/create-upgrade-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierName, billingCycle: cycle }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create order');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.order && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: data.order.keyId,
          amount: data.order.amount,
          currency: data.order.currency,
          name: 'SalonHub',
          description: `Subscription Upgrade`,
          order_id: data.order.orderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch(`/api/subscriptions/salon/${salonId}/verify-upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tierName: selectedTier,
                  billingCycle,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              if (verifyRes.ok) {
                toast({ title: 'Upgrade Successful', description: 'Your subscription has been upgraded!' });
                refetchSubscription();
              }
            } catch (e) {
              toast({ title: 'Error', description: 'Payment verification failed', variant: 'destructive' });
            }
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const tiers = tiersData?.tiers || [];
  const currentTier = subscriptionData?.tier;
  const subscription = subscriptionData?.subscription;

  const tierFeatureList: Record<string, string[]> = {
    free: [
      'Basic salon listing',
      'Standard booking via SalonHub',
      'Up to 3 staff members',
      'Up to 10 services',
    ],
    growth: [
      'Everything in Free, plus:',
      'Instagram "Book Now" button',
      'Facebook "Book Now" button',
      'Social booking analytics',
      'Priority customer support',
      'Up to 10 staff members',
      'Up to 50 services',
    ],
    elite: [
      'Everything in Growth, plus:',
      'Reserve with Google',
      'Messenger chatbot booking',
      'Custom branding on booking widget',
      'API access for integrations',
      'Unlimited staff & services',
      'Dedicated account manager',
    ],
  };

  if (tiersLoading || subLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Subscription & Billing
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage your subscription tier and unlock premium features
        </p>
      </div>

      {currentTier && (
        <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Current Plan</CardTitle>
                <CardDescription>Your active subscription</CardDescription>
              </div>
              <Badge variant={currentTier.name === 'free' ? 'secondary' : 'default'} className="text-sm">
                {currentTier.displayName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {subscription?.status === 'paused' ? (
                  <Pause className="h-4 w-4 text-amber-600" />
                ) : subscription?.status === 'canceled' ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <span>Status: <span className="font-medium capitalize">{subscription?.status}</span></span>
              </div>
              {subscription?.trialEndsAt && subscription?.status === 'trialing' && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}</span>
                </div>
              )}
              {subscription?.pausedAt && subscription?.status === 'paused' && (
                <div className="flex items-center gap-2 text-amber-600">
                  <Clock className="h-4 w-4" />
                  <span>Paused since: {new Date(subscription.pausedAt).toLocaleDateString()}</span>
                </div>
              )}
              {subscription?.currentPeriodEnd && currentTier.name !== 'free' && subscription?.status !== 'canceled' && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-600" />
                  <span>{subscription?.status === 'paused' ? 'Resumes by' : 'Renews'}: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
              {subscription?.status === 'canceled' && subscription?.graceEndsAt && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Access until: {new Date(subscription.graceEndsAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {currentTier.name !== 'free' && subscription?.status !== 'canceled' && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {subscription?.status === 'paused' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeMutation.mutate()}
                    disabled={resumeMutation.isPending}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {resumeMutation.isPending ? 'Resuming...' : 'Resume Subscription'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPauseModal(true)}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Pause Subscription
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCancelModal(true);
                    refetchRefundEstimate();
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-center gap-4 mb-4">
        <span className={billingCycle === 'monthly' ? 'font-semibold text-violet-600' : 'text-muted-foreground'}>
          Monthly
        </span>
        <Switch
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <span className={billingCycle === 'yearly' ? 'font-semibold text-violet-600' : 'text-muted-foreground'}>
          Yearly
          <Badge variant="secondary" className="ml-2 text-xs">Save 17%</Badge>
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {tiers.map((tier: any) => {
          const isCurrentTier = currentTier?.name === tier.name;
          const price = billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice / 12;
          const features = tierFeatureList[tier.name] || [];

          return (
            <Card
              key={tier.id}
              className={`relative transition-all ${
                isCurrentTier
                  ? 'border-violet-400 shadow-lg ring-2 ring-violet-200'
                  : 'hover:border-violet-200 hover:shadow-md'
              }`}
            >
              {tier.name === 'growth' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{tier.displayName}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    {price === 0 ? 'Free' : `₹${price.toLocaleString()}`}
                  </span>
                  {price > 0 && <span className="text-muted-foreground">/month</span>}
                </div>
                {billingCycle === 'yearly' && tier.yearlyPrice > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Billed ₹{tier.yearlyPrice.toLocaleString()}/year
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentTier ? (
                  <Button disabled className="w-full" variant="secondary">
                    Current Plan
                  </Button>
                ) : tier.name === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Downgrade
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {currentTier?.name === 'free' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => startTrialMutation.mutate(tier.name)}
                        disabled={startTrialMutation.isPending}
                      >
                        Start 14-Day Free Trial
                      </Button>
                    )}
                    <Button
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-500"
                      onClick={() => {
                        setSelectedTier(tier.name);
                        createOrderMutation.mutate({ tierName: tier.name, cycle: billingCycle });
                      }}
                      disabled={createOrderMutation.isPending}
                    >
                      {createOrderMutation.isPending ? 'Processing...' : 'Upgrade Now'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {paymentHistory?.payments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentHistory.payments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">₹{payment.amount}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPauseModal} onOpenChange={setShowPauseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
            <DialogDescription>
              Your subscription will be paused and you can resume it anytime within 90 days.
              During the pause, you'll retain access to your current features but won't be charged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Maximum pause duration is 90 days. After that, your subscription will auto-resume.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => pauseMutation.mutate()}
              disabled={pauseMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {pauseMutation.isPending ? 'Pausing...' : 'Pause Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {refundEstimate && refundEstimate.eligibleForRefund && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <CheckCircle className="h-5 w-5" />
                  <span>You're eligible for a refund!</span>
                </div>
                <div className="text-sm text-green-600 space-y-1">
                  <p>Original amount: ₹{(refundEstimate.paidAmountPaisa / 100).toFixed(2)}</p>
                  <p>Days remaining: {refundEstimate.daysRemaining} of {refundEstimate.totalDays}</p>
                  <p className="font-semibold text-lg">Refund amount: ₹{(refundEstimate.refundAmountPaisa / 100).toFixed(2)}</p>
                  {refundEstimate.isWithinFullRefundWindow && (
                    <p className="text-xs">Full refund (within 7-day window)</p>
                  )}
                </div>
              </div>
            )}
            {refundEstimate && !refundEstimate.eligibleForRefund && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-sm text-gray-600">{refundEstimate.reason || 'No refund available for this subscription.'}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Help us improve by sharing why you're leaving..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">You'll have a 3-day grace period to retain access after cancellation.</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Keep Subscription
            </Button>
            <Button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              variant="destructive"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SocialIntegrationsSettings({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/subscriptions/salon', salonId],
    queryFn: async () => {
      const res = await fetch(`/api/subscriptions/salon/${salonId}`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: metaStatus, isLoading, refetch: refetchMeta } = useQuery({
    queryKey: ['/api/meta/status', salonId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/status/${salonId}`);
      if (!res.ok) return { connected: false };
      return res.json();
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/meta/analytics', salonId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/analytics/${salonId}?days=30`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: metaStatus?.connected,
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/meta/disconnect/${salonId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Disconnected', description: 'Facebook/Instagram integration removed' });
      refetchMeta();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const res = await fetch(`/api/meta/settings/${salonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Settings Updated' });
      refetchMeta();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch(`/api/meta/connect/${salonId}`);
      const data = await res.json();
      if (data.upgradeRequired) {
        toast({
          title: 'Upgrade Required',
          description: 'Please upgrade to Growth or Elite plan to use social booking',
          variant: 'destructive',
        });
        return;
      }
      if (data.oauthUrl) {
        window.location.href = data.oauthUrl;
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsConnecting(false);
    }
  };

  const currentTier = subscriptionData?.tier?.name;
  const hasAccess = currentTier === 'growth' || currentTier === 'elite';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Social Integrations
        </h2>
        <p className="text-muted-foreground mt-1">
          Connect your Instagram and Facebook to enable direct booking
        </p>
      </div>

      {!hasAccess && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Upgrade Required</p>
                <p className="text-sm text-amber-700">
                  Social booking buttons require a Growth or Elite subscription.
                </p>
              </div>
              <Button size="sm" className="ml-auto bg-gradient-to-r from-violet-500 to-purple-500">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={!hasAccess ? 'opacity-60' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Instagram</CardTitle>
                  <CardDescription>Book Now button on your profile</CardDescription>
                </div>
              </div>
              {metaStatus?.instagram && (
                <Badge variant="default" className="bg-green-500">Connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {metaStatus?.instagram ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>@{metaStatus.instagram.username}</span>
                </div>
                {analytics?.totals?.instagram && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-violet-50 rounded">
                      <p className="text-lg font-bold">{analytics.totals.instagram.buttonClicks}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="p-2 bg-violet-50 rounded">
                      <p className="text-lg font-bold">{analytics.totals.instagram.bookingsCompleted}</p>
                      <p className="text-xs text-muted-foreground">Bookings</p>
                    </div>
                    <div className="p-2 bg-violet-50 rounded">
                      <p className="text-lg font-bold">₹{analytics.totals.instagram.revenue}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enable customers to book directly from your Instagram profile.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={!hasAccess ? 'opacity-60' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Facebook</CardTitle>
                  <CardDescription>Book Now button on your Page</CardDescription>
                </div>
              </div>
              {metaStatus?.facebook && (
                <Badge variant="default" className="bg-green-500">Connected</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {metaStatus?.facebook ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{metaStatus.facebook.pageName}</span>
                </div>
                {analytics?.totals?.facebook && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-lg font-bold">{analytics.totals.facebook.buttonClicks}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-lg font-bold">{analytics.totals.facebook.bookingsCompleted}</p>
                      <p className="text-xs text-muted-foreground">Bookings</p>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-lg font-bold">₹{analytics.totals.facebook.revenue}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add a Book Now button to your Facebook Business Page.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {hasAccess && (
        <div className="flex gap-4">
          {!metaStatus?.connected ? (
            <Button
              className="bg-gradient-to-r from-violet-500 to-purple-500"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Facebook & Instagram'}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => refetchMeta()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              <Button
                variant="destructive"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      )}

      {metaStatus?.connected && metaStatus.settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking Settings</CardTitle>
            <CardDescription>Configure how social bookings work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Lead Time (hours before booking)</Label>
                <Select
                  value={String(metaStatus.settings.bookingLeadTimeHours)}
                  onValueChange={(value) =>
                    updateSettingsMutation.mutate({ bookingLeadTimeHours: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-confirm bookings</Label>
                <p className="text-xs text-muted-foreground">Automatically confirm new bookings</p>
              </div>
              <Switch
                checked={metaStatus.settings.autoConfirmBookings}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate({ autoConfirmBookings: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Send DM reminders</Label>
                <p className="text-xs text-muted-foreground">Send booking reminders via Instagram/Messenger</p>
              </div>
              <Switch
                checked={metaStatus.settings.sendDmReminders}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate({ sendDmReminders: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
