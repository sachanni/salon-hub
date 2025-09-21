import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MessageSquare,
  Send,
  Users,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Calendar,
  Filter,
  Search,
  Download,
  Upload,
  Copy,
  Zap,
  Heart,
  Gift
} from "lucide-react";

interface CommunicationDashboardProps {
  salonId: string;
  selectedPeriod: string;
}

interface DashboardMetrics {
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesOpened: number;
  totalMessagesClicked: number;
  totalMessagesFailed: number;
  emailOpenRate: number;
  emailClickRate: number;
  smsDeliveryRate: number;
  unsubscribeRate: number;
  activeCampaigns: number;
  topPerformingCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    openRate: number;
    clickRate: number;
    messagesSent: number;
  }>;
  channelPerformance: Array<{
    channel: string;
    messagesSent: number;
    deliveryRate: number;
    engagementRate: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

interface MessageTemplate {
  id: string;
  salonId: string;
  name: string;
  type: string;
  channel: string;
  subject: string | null;
  content: string;
  variables: string[];
  isDefault: number;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerSegment {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  criteria: any;
  customerCount: number;
  isActive: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunicationCampaign {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  channel: string;
  targetSegmentId: string | null;
  templateId: string | null;
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  messagesSent: number;
  messagesDelivered: number;
  messagesOpened: number;
  messagesClicked: number;
  messagesFailed: number;
  unsubscribes: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Form schemas
const messageTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.string().min(1, "Template type is required"),
  channel: z.enum(["email", "sms", "both"]),
  subject: z.string().optional(),
  content: z.string().min(1, "Template content is required"),
  isDefault: z.boolean().default(false)
});

const customerSegmentSchema = z.object({
  name: z.string().min(1, "Segment name is required"),
  description: z.string().optional(),
  criteria: z.object({}).passthrough()
});

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  type: z.enum(["promotional", "informational", "automated"]),
  channel: z.enum(["email", "sms", "both"]),
  targetSegmentId: z.string().optional(),
  templateId: z.string().optional(),
  scheduledFor: z.string().optional()
});

export default function CustomerCommunicationDashboard({ salonId, selectedPeriod }: CommunicationDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CommunicationCampaign | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState("");

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/salons', salonId, 'communication-dashboard/metrics', selectedPeriod],
    enabled: !!salonId,
    staleTime: 60000
  });

  // Fetch message templates
  const { data: templates, isLoading: templatesLoading } = useQuery<MessageTemplate[]>({
    queryKey: ['/api/salons', salonId, 'message-templates'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch customer segments
  const { data: segments, isLoading: segmentsLoading } = useQuery<CustomerSegment[]>({
    queryKey: ['/api/salons', salonId, 'customer-segments'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch communication campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CommunicationCampaign[]>({
    queryKey: ['/api/salons', salonId, 'communication-campaigns'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Form handlers
  const templateForm = useForm<z.infer<typeof messageTemplateSchema>>({
    resolver: zodResolver(messageTemplateSchema),
    defaultValues: {
      name: "",
      type: "",
      channel: "email",
      subject: "",
      content: "",
      isDefault: false
    }
  });

  const segmentForm = useForm<z.infer<typeof customerSegmentSchema>>({
    resolver: zodResolver(customerSegmentSchema),
    defaultValues: {
      name: "",
      description: "",
      criteria: {}
    }
  });

  const campaignForm = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "promotional",
      channel: "email",
      targetSegmentId: "",
      templateId: "",
      scheduledFor: ""
    }
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageTemplateSchema>) => {
      return await apiRequest('POST', `/api/salons/${salonId}/message-templates`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'message-templates'] });
      setShowTemplateDialog(false);
      templateForm.reset();
      toast({ title: "Success", description: "Message template created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create message template", variant: "destructive" });
    }
  });

  const createSegmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerSegmentSchema>) => {
      return await apiRequest('POST', `/api/salons/${salonId}/customer-segments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'customer-segments'] });
      setShowSegmentDialog(false);
      segmentForm.reset();
      toast({ title: "Success", description: "Customer segment created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create customer segment", variant: "destructive" });
    }
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof campaignSchema>) => {
      return await apiRequest('POST', `/api/salons/${salonId}/communication-campaigns`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'communication-campaigns'] });
      setShowCampaignDialog(false);
      campaignForm.reset();
      toast({ title: "Success", description: "Campaign created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    }
  });

  const createDefaultTemplatesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/salons/${salonId}/message-templates/defaults`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'message-templates'] });
      toast({ title: "Success", description: "Default templates created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create default templates", variant: "destructive" });
    }
  });

  // Helper functions
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'scheduled': return 'default';
      case 'running': return 'default';
      case 'completed': return 'secondary';
      case 'paused': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'both': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'booking_reminder': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'follow_up': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'birthday': return <Gift className="h-4 w-4 text-purple-500" />;
      case 'promotional': return <Target className="h-4 w-4 text-orange-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Quick setup for new salons
  const hasTemplates = templates && templates.length > 0;
  const hasSegments = segments && segments.length > 0;
  const hasCampaigns = campaigns && campaigns.length > 0;

  if (metricsLoading || templatesLoading || segmentsLoading || campaignsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Communication</h2>
          <p className="text-muted-foreground">
            Manage message templates, campaigns, and customer engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hasTemplates && (
            <Button 
              onClick={() => createDefaultTemplatesMutation.mutate()}
              disabled={createDefaultTemplatesMutation.isPending}
              variant="outline"
              data-testid="button-create-default-templates"
            >
              <Zap className="mr-2 h-4 w-4" />
              Quick Setup
            </Button>
          )}
        </div>
      </div>

      {/* Quick Setup Alert */}
      {(!hasTemplates || !hasSegments) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Get started by setting up message templates and customer segments. 
            Use the "Quick Setup" button to create default templates automatically.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">
            <MessageSquare className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Send className="mr-2 h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="segments" data-testid="tab-segments">
            <Users className="mr-2 h-4 w-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card data-testid="card-messages-sent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-messages-sent">
                  {formatNumber(metrics?.totalMessagesSent || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics?.totalMessagesDelivered || 0)} delivered
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-open-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-open-rate">
                  {formatPercentage(metrics?.emailOpenRate || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics?.totalMessagesOpened || 0)} opens
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-click-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-click-rate">
                  {formatPercentage(metrics?.emailClickRate || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(metrics?.totalMessagesClicked || 0)} clicks
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-active-campaigns">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-active-campaigns">
                  {metrics?.activeCampaigns || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  campaigns running
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Channel Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>
                  Message performance by communication channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.channelPerformance?.map((channel, index) => (
                    <div key={index} className="flex items-center">
                      <div className="flex items-center space-x-2 flex-1">
                        {getChannelIcon(channel.channel)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">
                              {channel.channel}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>
                                {formatPercentage(channel.deliveryRate / 100)}
                              </span>
                              <span>
                                {formatNumber(channel.messagesSent)} sent
                              </span>
                            </div>
                          </div>
                          <Progress 
                            value={channel.engagementRate} 
                            className="h-2 mt-1" 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {!metrics?.channelPerformance?.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No channel data available yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest communication activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="h-2 w-2 bg-blue-500 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!metrics?.recentActivity?.length && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>
                Your best campaigns by engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Messages Sent</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Click Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics?.topPerformingCampaigns?.map((campaign, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {campaign.campaignName}
                      </TableCell>
                      <TableCell>{formatNumber(campaign.messagesSent)}</TableCell>
                      <TableCell>{formatPercentage(campaign.openRate / 100)}</TableCell>
                      <TableCell>{formatPercentage(campaign.clickRate / 100)}</TableCell>
                    </TableRow>
                  ))}
                  {!metrics?.topPerformingCampaigns?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No campaign data available yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Message Templates</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage templates for different types of communications
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!hasTemplates && (
                <Button 
                  onClick={() => createDefaultTemplatesMutation.mutate()}
                  disabled={createDefaultTemplatesMutation.isPending}
                  variant="outline"
                  size="sm"
                  data-testid="button-create-defaults"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Create Defaults
                </Button>
              )}
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-template">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedTemplate ? 'Edit Template' : 'Create Message Template'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit((data) => createTemplateMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Booking Confirmation" {...field} data-testid="input-template-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-template-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                                  <SelectItem value="booking_reminder">Booking Reminder</SelectItem>
                                  <SelectItem value="follow_up">Follow-up</SelectItem>
                                  <SelectItem value="birthday">Birthday Offer</SelectItem>
                                  <SelectItem value="promotional">Promotional</SelectItem>
                                  <SelectItem value="informational">Informational</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={templateForm.control}
                          name="channel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Communication Channel</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-template-channel">
                                    <SelectValue placeholder="Select channel" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="email">Email Only</SelectItem>
                                  <SelectItem value="sms">SMS Only</SelectItem>
                                  <SelectItem value="both">Email & SMS</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={templateForm.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>Default Template</FormLabel>
                                <FormDescription>
                                  Use as default for this type
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-template-default"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={templateForm.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject Line (Email only)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Your booking is confirmed!" {...field} data-testid="input-template-subject" />
                            </FormControl>
                            <FormDescription>
                              Use variables like {'{'}customerName{'}'}, {'{'}serviceName{'}'}, {'{'}appointmentDate{'}'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Hi {{customerName}}, your appointment for {{serviceName}} is confirmed for {{appointmentDate}} at {{appointmentTime}}..."
                                className="min-h-[150px]"
                                {...field}
                                data-testid="textarea-template-content"
                              />
                            </FormControl>
                            <FormDescription>
                              Available variables: {'{'}customerName{'}'}, {'{'}serviceName{'}'}, {'{'}appointmentDate{'}'}, {'{'}appointmentTime{'}'}, {'{'}salonName{'}'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowTemplateDialog(false)}
                          data-testid="button-cancel-template"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createTemplateMutation.isPending}
                          data-testid="button-save-template"
                        >
                          {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow" data-testid={`card-template-${template.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(template.type)}
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getChannelIcon(template.channel)}
                      {template.isDefault === 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {template.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{template.type.replace('_', ' ')}</span>
                      <span>{template.channel}</span>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Button size="sm" variant="outline" data-testid={`button-edit-template-${template.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-copy-template-${template.id}`}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!templates?.length && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No message templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first message template to get started with customer communications.
                  </p>
                  <Button 
                    onClick={() => setShowTemplateDialog(true)}
                    data-testid="button-create-first-template"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Communication Campaigns</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage marketing campaigns and automated communications
              </p>
            </div>
            <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-campaign">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                </DialogHeader>
                <Form {...campaignForm}>
                  <form onSubmit={campaignForm.handleSubmit((data) => createCampaignMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={campaignForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Summer Special Promotion" {...field} data-testid="input-campaign-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-campaign-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="promotional">Promotional</SelectItem>
                                <SelectItem value="informational">Informational</SelectItem>
                                <SelectItem value="automated">Automated</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={campaignForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe your campaign..." {...field} data-testid="textarea-campaign-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={campaignForm.control}
                        name="channel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Channel</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-campaign-channel">
                                  <SelectValue placeholder="Select channel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="targetSegmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Segment</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-campaign-segment">
                                  <SelectValue placeholder="Select segment" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">All Customers</SelectItem>
                                {segments?.map((segment) => (
                                  <SelectItem key={segment.id} value={segment.id}>
                                    {segment.name} ({segment.customerCount} customers)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={campaignForm.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message Template</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-campaign-template">
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templates?.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={campaignForm.control}
                      name="scheduledFor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule For (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                              data-testid="input-campaign-schedule"
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty to send immediately
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCampaignDialog(false)}
                        data-testid="button-cancel-campaign"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createCampaignMutation.isPending}
                        data-testid="button-save-campaign"
                      >
                        {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {campaigns?.map((campaign) => (
              <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription>{campaign.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      {getChannelIcon(campaign.channel)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(campaign.messagesSent)}</div>
                      <div className="text-xs text-muted-foreground">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(campaign.messagesDelivered)}</div>
                      <div className="text-xs text-muted-foreground">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(campaign.messagesOpened)}</div>
                      <div className="text-xs text-muted-foreground">Opened</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatNumber(campaign.messagesClicked)}</div>
                      <div className="text-xs text-muted-foreground">Clicked</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Type: {campaign.type}</span>
                      {campaign.scheduledFor && (
                        <span>Scheduled: {new Date(campaign.scheduledFor).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'draft' && (
                        <Button size="sm" data-testid={`button-start-campaign-${campaign.id}`}>
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {campaign.status === 'running' && (
                        <Button size="sm" variant="outline" data-testid={`button-pause-campaign-${campaign.id}`}>
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      <Button size="sm" variant="outline" data-testid={`button-edit-campaign-${campaign.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!campaigns?.length && (
              <Card>
                <CardContent className="text-center py-12">
                  <Send className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first marketing campaign to start engaging with customers.
                  </p>
                  <Button 
                    onClick={() => setShowCampaignDialog(true)}
                    data-testid="button-create-first-campaign"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Customer Segments</h3>
              <p className="text-sm text-muted-foreground">
                Create customer segments for targeted marketing campaigns
              </p>
            </div>
            <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-segment">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Customer Segment</DialogTitle>
                </DialogHeader>
                <Form {...segmentForm}>
                  <form onSubmit={segmentForm.handleSubmit((data) => createSegmentMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={segmentForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segment Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., VIP Customers" {...field} data-testid="input-segment-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={segmentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe this customer segment..." {...field} data-testid="textarea-segment-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-4">
                      <h4 className="font-medium">Segment Criteria (Coming Soon)</h4>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Advanced segmentation criteria will be available in the next update. 
                          For now, segments will include all customers.
                        </AlertDescription>
                      </Alert>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowSegmentDialog(false)}
                        data-testid="button-cancel-segment"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createSegmentMutation.isPending}
                        data-testid="button-save-segment"
                      >
                        {createSegmentMutation.isPending ? "Creating..." : "Create Segment"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments?.map((segment) => (
              <Card key={segment.id} data-testid={`card-segment-${segment.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{segment.name}</CardTitle>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>{segment.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Customers</span>
                      <span className="text-2xl font-bold">{formatNumber(segment.customerCount)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" data-testid={`button-edit-segment-${segment.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" data-testid={`button-view-segment-${segment.id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!segments?.length && (
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No customer segments yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create customer segments to target specific groups with your marketing campaigns.
                  </p>
                  <Button 
                    onClick={() => setShowSegmentDialog(true)}
                    data-testid="button-create-first-segment"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Segment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Communication Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Detailed insights into your communication performance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-export-analytics">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
                <CardDescription>Message delivery success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatPercentage((metrics?.totalMessagesDelivered || 0) / Math.max(metrics?.totalMessagesSent || 1, 1))}
                      </div>
                      <div className="text-xs text-muted-foreground">delivery rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">SMS</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatPercentage(metrics?.smsDeliveryRate || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">delivery rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>How customers interact with your messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Open Rate</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatPercentage(metrics?.emailOpenRate || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(metrics?.totalMessagesOpened || 0)} opens
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">Click Rate</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatPercentage(metrics?.emailClickRate || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(metrics?.totalMessagesClicked || 0)} clicks
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Unsubscribe Rate</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatPercentage(metrics?.unsubscribeRate || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Over Time Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>
                Track your communication performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Performance Charts Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics charts will be available in the next update
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}