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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  CheckCircle,
  AlertCircle,
  Phone,
  Link as LinkIcon,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface BusinessSettingsProps {
  salonId: string;
}

export default function BusinessSettings({ salonId }: BusinessSettingsProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("business");
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Salon Management</h2>
        <p className="text-muted-foreground">View and manage all your salon locations</p>
      </div>

      <Separator />

      <div className="space-y-3">
        {Array.isArray(salons) && salons.map((salon: Salon) => (
          <div
            key={salon.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-violet-50/50 to-pink-50/50 hover:shadow-md transition-shadow"
            data-testid={`salon-item-${salon.id}`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-violet-600" />
                <h3 className="font-semibold text-lg">{salon.name}</h3>
                {salon.id === currentSalonId && (
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                    Current
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
