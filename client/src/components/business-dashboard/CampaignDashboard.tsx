import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  MessageSquare,
  Phone,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Trash2,
  Eye,
  TrendingUp,
  PlusCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  messageTemplate: string;
  status: string;
  targetCustomerCount: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface CampaignStats {
  id: string;
  name: string;
  status: string;
  channel: string;
  targetCustomerCount: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  deliveryRate: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface WelcomeOffer {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  isActive: number;
}

interface CampaignDashboardProps {
  salonId: string;
}

const DEFAULT_TEMPLATE = `Hi {{customer_name}}!

{{salon_name}} is now on SalonHub app. Book appointments, earn rewards, and get exclusive offers!

🎁 Special for you: Get {{offer_amount}} OFF your next visit!
Your code: {{offer_code}}

Download now: {{download_link}}

Valid for {{expiry_days}} days.`;

const CAMPAIGN_STATUSES = {
  draft: { label: "Draft", color: "secondary" },
  scheduled: { label: "Scheduled", color: "default" },
  sending: { label: "Sending", color: "default" },
  completed: { label: "Completed", color: "default" },
  paused: { label: "Paused", color: "secondary" },
  failed: { label: "Failed", color: "destructive" },
} as const;

export default function CampaignDashboard({ salonId }: CampaignDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    channel: "whatsapp" as "whatsapp" | "sms" | "both",
    messageTemplate: DEFAULT_TEMPLATE,
    welcomeOfferId: "",
  });

  const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/salons", salonId, "invitation-campaigns"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salonId}/invitation-campaigns`);
      return response.json();
    },
  });

  const { data: welcomeOffers } = useQuery<WelcomeOffer[]>({
    queryKey: ["/api/salons", salonId, "welcome-offers"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/salons/${salonId}/welcome-offers`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof newCampaign) => {
      const response = await apiRequest("POST", `/api/salons/${salonId}/invitation-campaigns`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign created successfully" });
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: "",
        channel: "whatsapp",
        messageTemplate: DEFAULT_TEMPLATE,
        welcomeOfferId: "",
      });
      refetchCampaigns();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/salons/${salonId}/invitation-campaigns/${campaignId}/send`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign started! Messages are being sent." });
      refetchCampaigns();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/salons/${salonId}/invitation-campaigns/${campaignId}/pause`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to pause campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign paused" });
      refetchCampaigns();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("DELETE", `/api/salons/${salonId}/invitation-campaigns/${campaignId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign deleted" });
      refetchCampaigns();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const config = CAMPAIGN_STATUSES[status as keyof typeof CAMPAIGN_STATUSES] || { label: status, color: "secondary" };
    return <Badge variant={config.color as any}>{config.label}</Badge>;
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case "sms":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "both":
        return (
          <div className="flex gap-1">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <Phone className="h-4 w-4 text-blue-600" />
          </div>
        );
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const totalStats = campaigns?.reduce(
    (acc, c) => ({
      sent: acc.sent + c.messagesSent,
      delivered: acc.delivered + c.messagesDelivered,
      failed: acc.failed + c.messagesFailed,
    }),
    { sent: 0, delivered: 0, failed: 0 }
  ) || { sent: 0, delivered: 0, failed: 0 };

  const overallDeliveryRate = totalStats.sent > 0 
    ? ((totalStats.delivered / totalStats.sent) * 100).toFixed(1) 
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invitation Campaigns</h2>
          <p className="text-muted-foreground">Send WhatsApp/SMS invitations to imported customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchCampaigns()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Invitation Campaign</DialogTitle>
                <DialogDescription>
                  Send personalized invitations to your imported customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Welcome Campaign March 2024"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Select
                    value={newCampaign.channel}
                    onValueChange={(value: "whatsapp" | "sms" | "both") => 
                      setNewCampaign({ ...newCampaign, channel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          WhatsApp Only
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          SMS Only
                        </div>
                      </SelectItem>
                      <SelectItem value="both">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          <Phone className="h-4 w-4 text-blue-600" />
                          Both (WhatsApp + SMS)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {welcomeOffers && welcomeOffers.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="offer">Welcome Offer (Optional)</Label>
                    <Select
                      value={newCampaign.welcomeOfferId}
                      onValueChange={(value) => 
                        setNewCampaign({ ...newCampaign, welcomeOfferId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an offer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No offer</SelectItem>
                        {welcomeOffers.filter(o => o.isActive === 1).map((offer) => (
                          <SelectItem key={offer.id} value={offer.id}>
                            {offer.name} ({offer.discountType === "percentage" ? `${offer.discountValue}%` : `₹${offer.discountValue / 100}`})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="template">Message Template</Label>
                  <Textarea
                    id="template"
                    className="min-h-[200px] font-mono text-sm"
                    value={newCampaign.messageTemplate}
                    onChange={(e) => setNewCampaign({ ...newCampaign, messageTemplate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {"{{customer_name}}"}, {"{{salon_name}}"}, {"{{offer_amount}}"}, {"{{offer_code}}"}, {"{{download_link}}"}, {"{{expiry_days}}"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createCampaignMutation.mutate(newCampaign)}
                  disabled={!newCampaign.name || !newCampaign.messageTemplate || createCampaignMutation.isPending}
                >
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallDeliveryRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
          <CardDescription>Manage and monitor your invitation campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No campaigns yet</p>
              <p className="text-sm">Create your first campaign to start inviting customers</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const progress = campaign.targetCustomerCount > 0
                    ? (campaign.messagesSent / campaign.targetCustomerCount) * 100
                    : 0;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {campaign.targetCustomerCount} customers targeted
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getChannelIcon(campaign.channel)}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell>
                        <div className="w-32">
                          <Progress value={progress} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            {campaign.messagesSent}/{campaign.targetCustomerCount} sent
                            {campaign.messagesDelivered > 0 && (
                              <span className="text-green-600 ml-2">
                                ({campaign.messagesDelivered} delivered)
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(campaign.createdAt), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(campaign.createdAt), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(campaign.status === "draft" || campaign.status === "paused") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startCampaignMutation.mutate(campaign.id)}
                              disabled={startCampaignMutation.isPending}
                            >
                              <Play className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {campaign.status === "sending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => pauseCampaignMutation.mutate(campaign.id)}
                              disabled={pauseCampaignMutation.isPending}
                            >
                              <Pause className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          {campaign.status !== "sending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this campaign?")) {
                                  deleteCampaignMutation.mutate(campaign.id);
                                }
                              }}
                              disabled={deleteCampaignMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>Campaign details and statistics</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Channel</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {getChannelIcon(selectedCampaign.channel)}
                    <span className="capitalize">{selectedCampaign.channel}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Target Customers</Label>
                  <div className="mt-1 font-medium">{selectedCampaign.targetCustomerCount}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Messages Sent</Label>
                  <div className="mt-1 font-medium">{selectedCampaign.messagesSent}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Delivered</Label>
                  <div className="mt-1 font-medium text-green-600">{selectedCampaign.messagesDelivered}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Failed</Label>
                  <div className="mt-1 font-medium text-red-600">{selectedCampaign.messagesFailed}</div>
                </div>
              </div>
              {selectedCampaign.messagesSent > 0 && (
                <div>
                  <Label className="text-muted-foreground">Delivery Rate</Label>
                  <div className="mt-2">
                    <Progress 
                      value={(selectedCampaign.messagesDelivered / selectedCampaign.messagesSent) * 100} 
                      className="h-3"
                    />
                    <div className="text-sm mt-1">
                      {((selectedCampaign.messagesDelivered / selectedCampaign.messagesSent) * 100).toFixed(1)}% delivered
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Message Template</Label>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{selectedCampaign.messageTemplate}</pre>
                </div>
              </div>
              {selectedCampaign.startedAt && (
                <div>
                  <Label className="text-muted-foreground">Started</Label>
                  <div className="mt-1">{format(new Date(selectedCampaign.startedAt), "PPpp")}</div>
                </div>
              )}
              {selectedCampaign.completedAt && (
                <div>
                  <Label className="text-muted-foreground">Completed</Label>
                  <div className="mt-1">{format(new Date(selectedCampaign.completedAt), "PPpp")}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
