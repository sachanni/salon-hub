import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  Bell,
  CheckCircle,
  AlertCircle,
  User,
  RefreshCw,
  Settings,
  Send,
  MapPin,
  Timer,
  Users,
  TrendingUp,
  Zap,
  Car,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDepartureQueueSocket } from "@/hooks/useDepartureQueueSocket";
import { format } from "date-fns";

interface StaffQueueStatus {
  staffId: string;
  staffName: string;
  currentStatus: string;
  appointmentsAhead: number;
  estimatedDelayMinutes: number;
  nextAvailableAt: string | null;
  currentCustomer?: string;
}

interface SalonQueueStatus {
  salonId: string;
  date: string;
  staff: StaffQueueStatus[];
  overallStatus: string;
  avgDelayMinutes: number;
}

interface DepartureAlertSettings {
  isEnabled: boolean;
  firstAlertMinutesBefore: number;
  updateIntervalMinutes: number;
  minDelayToNotify: number;
  defaultBufferMinutes: number;
  enablePushNotifications: boolean;
  enableSmsNotifications: boolean;
  enableWhatsappNotifications: boolean;
  useTrafficData: boolean;
  considerHistoricalOverrun: boolean;
  autoReassignStaff: boolean;
}

interface DepartureAlertsDashboardProps {
  salonId: string;
}

export function DepartureAlertsDashboard({ salonId }: DepartureAlertsDashboardProps) {
  const [activeTab, setActiveTab] = useState("queue");
  const [localSettings, setLocalSettings] = useState<DepartureAlertSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const authToken = localStorage.getItem('accessToken') || '';

  const handleQueueUpdate = useCallback((data: SalonQueueStatus & { updatedAt: string }) => {
    toast({
      title: "Queue Updated",
      description: `Real-time queue update received (${data.staff.length} staff)`,
      duration: 2000,
    });
  }, [toast]);

  const { isConnected } = useDepartureQueueSocket({
    salonId,
    authToken,
    userRole: 'staff',
    onQueueUpdate: handleQueueUpdate,
  });

  const { data: queueStatus, isLoading: loadingQueue, refetch: refetchQueue } = useQuery<{ data: SalonQueueStatus }>({
    queryKey: ["salon-queue-status", salonId],
    queryFn: async () => {
      const res = await fetch(`/api/salons/${salonId}/queue-status`);
      if (!res.ok) {
        if (res.status === 404) return { data: null };
        throw new Error("Failed to fetch queue status");
      }
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: settingsData, isLoading: loadingSettings } = useQuery<DepartureAlertSettings>({
    queryKey: ["departure-settings", salonId],
    queryFn: async () => {
      const res = await fetch(`/api/salons/${salonId}/departure-settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      return data.settings ?? data;
    },
  });

  useEffect(() => {
    if (settingsData && !localSettings) {
      setLocalSettings(settingsData);
    }
  }, [settingsData, localSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: DepartureAlertSettings) => {
      const res = await fetch(`/api/salons/${salonId}/departure-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departure-settings", salonId] });
      setHasUnsavedChanges(false);
      toast({
        title: "Settings Updated",
        description: "Departure alert settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentSettings = localSettings ?? settingsData;

  const handleSettingChange = (key: keyof DepartureAlertSettings, value: any) => {
    if (!currentSettings) return;
    const updatedSettings = { ...currentSettings, [key]: value };
    setLocalSettings(updatedSettings);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    if (localSettings) {
      updateSettingsMutation.mutate(localSettings);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case "busy":
        return <Badge className="bg-yellow-100 text-yellow-800">Busy</Badge>;
      case "break":
        return <Badge className="bg-blue-100 text-blue-800">On Break</Badge>;
      case "offline":
        return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "on_time":
        return "text-green-600";
      case "slight_delay":
        return "text-yellow-600";
      case "running_behind":
        return "text-orange-600";
      case "significant_delay":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Smart Departure Alerts</h2>
          <p className="text-muted-foreground">
            Predictive notifications to help customers arrive at the right time
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchQueue()}
          disabled={loadingQueue}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingQueue ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Live Queue Status
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4 mt-4">
          {loadingQueue ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : queueStatus?.data ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overall Status</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getOverallStatusColor(queueStatus.data.overallStatus)}`}>
                      {formatStatusLabel(queueStatus.data.overallStatus)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {format(new Date(), "h:mm a")}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Delay</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {queueStatus.data.avgDelayMinutes} min
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all staff
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {queueStatus.data.staff?.filter(s => s.currentStatus !== "offline").length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Of {queueStatus.data.staff?.length || 0} total
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Staff Queue Status</CardTitle>
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 flex items-center gap-1">
                          <WifiOff className="h-3 w-3" />
                          Offline
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Real-time queue position for each staff member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {queueStatus.data.staff && queueStatus.data.staff.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Queue</TableHead>
                          <TableHead>Delay</TableHead>
                          <TableHead>Next Available</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queueStatus.data.staff.map((staff) => (
                          <TableRow key={staff.staffId}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {staff.staffName}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(staff.currentStatus)}</TableCell>
                            <TableCell>
                              {staff.appointmentsAhead > 0 ? (
                                <span className="text-muted-foreground">
                                  {staff.appointmentsAhead} ahead
                                </span>
                              ) : (
                                <span className="text-green-600">Clear</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {staff.estimatedDelayMinutes > 0 ? (
                                <Badge variant="outline" className="bg-yellow-50">
                                  +{staff.estimatedDelayMinutes} min
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-50">
                                  On time
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {staff.nextAvailableAt ? (
                                format(new Date(staff.nextAvailableAt), "h:mm a")
                              ) : (
                                <span className="text-green-600">Now</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Staff Data</AlertTitle>
                      <AlertDescription>
                        Queue status will appear here once staff members have active appointments.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Queue Data</AlertTitle>
              <AlertDescription>
                Queue status will appear here once your salon has active appointments today.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          {loadingSettings ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : currentSettings ? (
            <>
              {hasUnsavedChanges && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Unsaved Changes</AlertTitle>
                  <AlertDescription className="text-amber-700 flex items-center justify-between">
                    <span>You have unsaved changes to your departure alert settings.</span>
                    <Button 
                      size="sm" 
                      onClick={handleSaveSettings}
                      disabled={updateSettingsMutation.isPending}
                      className="ml-4"
                    >
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Feature Settings
                  </CardTitle>
                  <CardDescription>
                    Control how departure alerts work for your salon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enabled">Enable Smart Departure Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send predictive departure notifications to customers
                      </p>
                    </div>
                    <Switch
                      id="enabled"
                      checked={currentSettings.isEnabled}
                      onCheckedChange={(checked) => handleSettingChange("isEnabled", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>First Alert Timing</Label>
                      <p className="text-sm text-muted-foreground">
                        Send first departure reminder {currentSettings.firstAlertMinutesBefore} minutes before appointment
                      </p>
                      <Slider
                        value={[currentSettings.firstAlertMinutesBefore]}
                        onValueChange={([value]) => handleSettingChange("firstAlertMinutesBefore", value)}
                        min={30}
                        max={120}
                        step={15}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>30 min</span>
                        <span>1 hour</span>
                        <span>2 hours</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Minimum Delay to Notify</Label>
                      <p className="text-sm text-muted-foreground">
                        Only notify customers if delay is at least {currentSettings.minDelayToNotify} minutes
                      </p>
                      <Slider
                        value={[currentSettings.minDelayToNotify]}
                        onValueChange={([value]) => handleSettingChange("minDelayToNotify", value)}
                        min={5}
                        max={30}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>5 min</span>
                        <span>15 min</span>
                        <span>30 min</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Buffer Time</Label>
                      <p className="text-sm text-muted-foreground">
                        Add {currentSettings.defaultBufferMinutes} minutes buffer to departure suggestions
                      </p>
                      <Slider
                        value={[currentSettings.defaultBufferMinutes]}
                        onValueChange={([value]) => handleSettingChange("defaultBufferMinutes", value)}
                        min={5}
                        max={30}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>
                    Choose how to send departure alerts to customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts via mobile app push notifications
                      </p>
                    </div>
                    <Switch
                      id="push"
                      checked={currentSettings.enablePushNotifications}
                      onCheckedChange={(checked) => handleSettingChange("enablePushNotifications", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts via SMS (additional charges may apply)
                      </p>
                    </div>
                    <Switch
                      id="sms"
                      checked={currentSettings.enableSmsNotifications}
                      onCheckedChange={(checked) => handleSettingChange("enableSmsNotifications", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="whatsapp">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send alerts via WhatsApp (coming soon)
                      </p>
                    </div>
                    <Switch
                      id="whatsapp"
                      checked={currentSettings.enableWhatsappNotifications}
                      onCheckedChange={(checked) => handleSettingChange("enableWhatsappNotifications", checked)}
                      disabled
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Advanced Features
                  </CardTitle>
                  <CardDescription>
                    Enhanced prediction settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="traffic">Traffic-Aware Calculations</Label>
                      <p className="text-sm text-muted-foreground">
                        Use real-time traffic data for departure suggestions (Premium)
                      </p>
                    </div>
                    <Switch
                      id="traffic"
                      checked={currentSettings.useTrafficData}
                      onCheckedChange={(checked) => handleSettingChange("useTrafficData", checked)}
                      disabled
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="overrun">Consider Historical Overrun</Label>
                      <p className="text-sm text-muted-foreground">
                        Factor in staff's average service time overrun
                      </p>
                    </div>
                    <Switch
                      id="overrun"
                      checked={currentSettings.considerHistoricalOverrun}
                      onCheckedChange={(checked) => handleSettingChange("considerHistoricalOverrun", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Settings Unavailable</AlertTitle>
              <AlertDescription>
                Unable to load departure alert settings. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DepartureAlertsDashboard;
