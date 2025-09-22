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
  Gift,
  FlaskConical,
  Split,
  Award,
  RotateCcw,
  Info,
  ChevronRight,
  ArrowUpDown,
  LineChart,
  PieChart,
  Sparkles,
  Brain,
  Wand2,
  Percent,
  Trophy,
  ChevronDown,
  ExternalLink,
  RefreshCw
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

// A/B Testing Interfaces
interface AbTestCampaign {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  status: string; // draft, running, paused, completed, cancelled
  baseTemplateId: string | null;
  testType: string; // subject_line, content, send_time, channel
  sampleSizePercentage: number;
  testDuration: number; // hours
  targetSegmentId: string | null;
  confidenceLevel: number; // 90, 95, 99
  successMetric: string; // open_rate, click_rate, conversion_rate, booking_rate
  winnerSelectionCriteria: string; // statistical_significance, business_rules
  autoOptimization: number; // boolean
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdBy: string | null;
}

interface TestVariant {
  id: string;
  testCampaignId: string;
  variantName: string;
  isControl: number; // boolean
  templateOverrides: any; // JSON object
  channelOverride: string | null;
  priority: number;
  audiencePercentage: number;
  status: string; // active, paused, winner, loser
  createdAt: Date;
}

interface TestMetric {
  id: string;
  testCampaignId: string;
  variantId: string | null;
  metricType: string; // sent, delivered, opened, clicked, converted, unsubscribed
  metricValue: number;
  recordedAt: Date;
}

interface TestResult {
  id: string;
  testCampaignId: string;
  winningVariantId: string | null;
  confidenceScore: number;
  statisticalSignificance: number; // boolean
  improvementPercentage: number;
  conclusion: string | null;
  createdAt: Date;
}

interface AbTestPerformanceSummary {
  campaignId: string;
  variants: Array<{
    id: string;
    name: string;
    isControl: boolean;
    messagesSent: number;
    messagesDelivered: number;
    messagesOpened: number;
    messagesClicked: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    status: string;
  }>;
  overallMetrics: {
    totalMessagesSent: number;
    averageOpenRate: number;
    averageClickRate: number;
    averageConversionRate: number;
    improvementOverControl: number;
    confidenceLevel: number;
    statisticalSignificance: boolean;
  };
  testProgress: {
    percentComplete: number;
    remainingHours: number;
    earlyStoppingRecommended: boolean;
  };
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

// A/B Testing Form Schemas
const abTestCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  baseTemplateId: z.string().min(1, "Base template is required"),
  testType: z.enum(["subject_line", "content", "send_time", "channel"]),
  sampleSizePercentage: z.number().min(1).max(100),
  testDuration: z.number().min(1).max(720), // Max 30 days
  targetSegmentId: z.string().optional(),
  confidenceLevel: z.enum(["90", "95", "99"]),
  successMetric: z.enum(["open_rate", "click_rate", "conversion_rate", "booking_rate"]),
  winnerSelectionCriteria: z.enum(["statistical_significance", "business_rules"]),
  autoOptimization: z.boolean().default(false)
});

const testVariantSchema = z.object({
  variantName: z.string().min(1, "Variant name is required"),
  templateOverrides: z.object({
    subject: z.string().optional(),
    content: z.string().optional(),
    sendTime: z.string().optional(),
    channel: z.enum(["email", "sms", "both"]).optional()
  }),
  audiencePercentage: z.number().min(1).max(100)
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

  // A/B Testing State
  const [selectedAbTestCampaign, setSelectedAbTestCampaign] = useState<AbTestCampaign | null>(null);
  const [selectedTestVariant, setSelectedTestVariant] = useState<TestVariant | null>(null);
  const [showAbTestCampaignDialog, setShowAbTestCampaignDialog] = useState(false);
  const [showVariantDialog, setShowVariantDialog] = useState(false);
  const [showPerformanceDialog, setShowPerformanceDialog] = useState(false);
  const [showWinnerSelectionDialog, setShowWinnerSelectionDialog] = useState(false);
  const [abTestView, setAbTestView] = useState<"campaigns" | "performance" | "variants">("campaigns");

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

  // A/B Testing Queries
  const { data: abTestCampaigns, isLoading: abTestCampaignsLoading } = useQuery<AbTestCampaign[]>({
    queryKey: ['/api/salons', salonId, 'ab-test-campaigns'],
    enabled: !!salonId,
    staleTime: 30000
  });

  const { data: testVariants, isLoading: testVariantsLoading } = useQuery<TestVariant[]>({
    queryKey: ['/api/salons', salonId, 'ab-test-campaigns', selectedAbTestCampaign?.id, 'variants'],
    enabled: !!salonId && !!selectedAbTestCampaign?.id,
    staleTime: 30000
  });

  const { data: abTestPerformance, isLoading: abTestPerformanceLoading } = useQuery<AbTestPerformanceSummary>({
    queryKey: ['/api/salons', salonId, 'ab-test-campaigns', selectedAbTestCampaign?.id, 'performance-summary'],
    enabled: !!salonId && !!selectedAbTestCampaign?.id,
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

  // A/B Testing Form Handlers
  const abTestCampaignForm = useForm<z.infer<typeof abTestCampaignSchema>>({
    resolver: zodResolver(abTestCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      baseTemplateId: "",
      testType: "subject_line",
      sampleSizePercentage: 20,
      testDuration: 24,
      targetSegmentId: "",
      confidenceLevel: "95",
      successMetric: "open_rate",
      winnerSelectionCriteria: "statistical_significance",
      autoOptimization: false
    }
  });

  const testVariantForm = useForm<z.infer<typeof testVariantSchema>>({
    resolver: zodResolver(testVariantSchema),
    defaultValues: {
      variantName: "",
      templateOverrides: {},
      audiencePercentage: 50
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
      // Convert "all" back to empty string for API
      const apiData = {
        ...data,
        targetSegmentId: data.targetSegmentId === "all" ? "" : data.targetSegmentId
      };
      return await apiRequest('POST', `/api/salons/${salonId}/communication-campaigns`, apiData);
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

  // A/B Testing Mutations
  const createAbTestCampaignMutation = useMutation({
    mutationFn: async (data: z.infer<typeof abTestCampaignSchema>) => {
      // Convert "all" back to empty string for API
      const apiData = {
        ...data,
        targetSegmentId: data.targetSegmentId === "all" ? "" : data.targetSegmentId
      };
      return await apiRequest('POST', `/api/salons/${salonId}/ab-test-campaigns`, apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'ab-test-campaigns'] });
      setShowAbTestCampaignDialog(false);
      abTestCampaignForm.reset();
      toast({ title: "Success", description: "A/B test campaign created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create A/B test campaign", variant: "destructive" });
    }
  });

  const createTestVariantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof testVariantSchema> & { testCampaignId: string }) => {
      return await apiRequest('POST', `/api/salons/${salonId}/ab-test-campaigns/${data.testCampaignId}/variants`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'ab-test-campaigns', selectedAbTestCampaign?.id, 'variants'] });
      setShowVariantDialog(false);
      testVariantForm.reset();
      toast({ title: "Success", description: "Test variant created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create test variant", variant: "destructive" });
    }
  });

  const startAbTestCampaignMutation = useMutation({
    mutationFn: async (testId: string) => {
      return await apiRequest('POST', `/api/salons/${salonId}/ab-test-campaigns/${testId}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'ab-test-campaigns'] });
      toast({ title: "Success", description: "A/B test campaign started successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to start A/B test campaign", variant: "destructive" });
    }
  });

  const pauseAbTestCampaignMutation = useMutation({
    mutationFn: async (testId: string) => {
      return await apiRequest('POST', `/api/salons/${salonId}/ab-test-campaigns/${testId}/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'ab-test-campaigns'] });
      toast({ title: "Success", description: "A/B test campaign paused successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to pause A/B test campaign", variant: "destructive" });
    }
  });

  const selectWinnerMutation = useMutation({
    mutationFn: async ({ testId, variantId }: { testId: string; variantId: string }) => {
      return await apiRequest('POST', `/api/salons/${salonId}/ab-test-campaigns/${testId}/select-winner`, { variantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'ab-test-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'ab-test-campaigns', selectedAbTestCampaign?.id, 'performance-summary'] });
      setShowWinnerSelectionDialog(false);
      toast({ title: "Success", description: "Winner selected successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to select winner", variant: "destructive" });
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
        <TabsList className="grid w-full grid-cols-6">
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
          <TabsTrigger value="ab-testing" data-testid="tab-ab-testing">
            <FlaskConical className="mr-2 h-4 w-4" />
            A/B Testing
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
                                <SelectItem value="all">All Customers</SelectItem>
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

        {/* A/B Testing Tab */}
        <TabsContent value="ab-testing" className="space-y-6">
          {/* A/B Testing Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">A/B Testing Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Optimize your marketing campaigns with data-driven testing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowAbTestCampaignDialog(true)}
                data-testid="button-create-ab-test"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create A/B Test
              </Button>
            </div>
          </div>

          {/* A/B Testing View Selector */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={abTestView === "campaigns" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAbTestView("campaigns")}
              data-testid="view-campaigns"
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Campaigns
            </Button>
            <Button
              variant={abTestView === "performance" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAbTestView("performance")}
              disabled={!selectedAbTestCampaign}
              data-testid="view-performance"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Performance
            </Button>
            <Button
              variant={abTestView === "variants" ? "default" : "ghost"}
              size="sm"
              onClick={() => setAbTestView("variants")}
              disabled={!selectedAbTestCampaign}
              data-testid="view-variants"
            >
              <Split className="mr-2 h-4 w-4" />
              Variants
            </Button>
          </div>

          {/* Campaigns View */}
          {abTestView === "campaigns" && (
            <div className="space-y-6">
              {/* Campaign Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card data-testid="card-total-tests">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                    <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-total-tests">
                      {abTestCampaigns?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">campaigns created</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-running-tests">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Running Tests</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-running-tests">
                      {abTestCampaigns?.filter(c => c.status === 'running').length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">active campaigns</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-completed-tests">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-completed-tests">
                      {abTestCampaigns?.filter(c => c.status === 'completed').length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">tests finished</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-average-improvement">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Improvement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-average-improvement">
                      +12.5%
                    </div>
                    <p className="text-xs text-muted-foreground">performance gain</p>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign List */}
              <Card>
                <CardHeader>
                  <CardTitle>A/B Test Campaigns</CardTitle>
                  <CardDescription>
                    Manage and monitor your A/B testing campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {abTestCampaignsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : abTestCampaigns && abTestCampaigns.length > 0 ? (
                    <div className="space-y-3">
                      {abTestCampaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                            selectedAbTestCampaign?.id === campaign.id ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedAbTestCampaign(campaign)}
                          data-testid={`campaign-${campaign.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-medium">{campaign.name}</h4>
                                <Badge 
                                  variant={getStatusBadgeColor(campaign.status)}
                                  data-testid={`status-${campaign.id}`}
                                >
                                  {campaign.status}
                                </Badge>
                                <Badge variant="outline">
                                  {campaign.testType.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline">
                                  {campaign.confidenceLevel}% confidence
                                </Badge>
                              </div>
                              {campaign.description && (
                                <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Sample Size: {campaign.sampleSizePercentage}%</span>
                                <span>Duration: {campaign.testDuration}h</span>
                                <span>Metric: {campaign.successMetric.replace('_', ' ')}</span>
                                {campaign.autoOptimization === 1 && (
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Auto-optimize
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {campaign.status === 'draft' && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startAbTestCampaignMutation.mutate(campaign.id);
                                  }}
                                  disabled={startAbTestCampaignMutation.isPending}
                                  data-testid={`start-${campaign.id}`}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {campaign.status === 'running' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    pauseAbTestCampaignMutation.mutate(campaign.id);
                                  }}
                                  disabled={pauseAbTestCampaignMutation.isPending}
                                  data-testid={`pause-${campaign.id}`}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAbTestView("performance");
                                }}
                                data-testid={`view-performance-${campaign.id}`}
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No A/B Tests Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first A/B test to start optimizing your campaigns
                      </p>
                      <Button 
                        onClick={() => setShowAbTestCampaignDialog(true)}
                        data-testid="button-create-first-ab-test"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create A/B Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance View */}
          {abTestView === "performance" && selectedAbTestCampaign && (
            <div className="space-y-6">
              {/* Performance Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{selectedAbTestCampaign.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Performance analytics and statistical results
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" data-testid="button-export-results">
                    <Download className="mr-2 h-4 w-4" />
                    Export Results
                  </Button>
                  {selectedAbTestCampaign.status === 'running' && (
                    <Button 
                      onClick={() => setShowWinnerSelectionDialog(true)}
                      data-testid="button-select-winner"
                    >
                      <Award className="mr-2 h-4 w-4" />
                      Select Winner
                    </Button>
                  )}
                </div>
              </div>

              {/* Test Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Progress</CardTitle>
                  <CardDescription>Current status and remaining time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {abTestPerformance?.testProgress?.percentComplete || 0}% Complete
                      </span>
                    </div>
                    <Progress 
                      value={abTestPerformance?.testProgress?.percentComplete || 0}
                      className="h-2"
                    />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Remaining Time:</span>
                        <div className="font-medium">
                          {abTestPerformance?.testProgress?.remainingHours || 0}h
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Statistical Significance:</span>
                        <div className="font-medium flex items-center gap-1">
                          {abTestPerformance?.overallMetrics?.statisticalSignificance ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Achieved
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 text-orange-500" />
                              Pending
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card data-testid="card-messages-sent-ab">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-messages-sent-ab">
                      {formatNumber(abTestPerformance?.overallMetrics?.totalMessagesSent || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">across all variants</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-average-open-rate">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-average-open-rate">
                      {formatPercentage(abTestPerformance?.overallMetrics?.averageOpenRate || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">all variants combined</p>
                  </CardContent>
                </Card>

                <Card data-testid="card-improvement">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Improvement</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600" data-testid="text-improvement">
                      +{formatPercentage(abTestPerformance?.overallMetrics?.improvementOverControl || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">vs control variant</p>
                  </CardContent>
                </Card>
              </div>

              {/* Variant Performance Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Variant Performance</CardTitle>
                  <CardDescription>
                    Compare performance metrics across test variants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {abTestPerformanceLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-20 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : abTestPerformance?.variants && abTestPerformance.variants.length > 0 ? (
                    <div className="space-y-4">
                      {abTestPerformance.variants.map((variant) => (
                        <div 
                          key={variant.id} 
                          className={`p-4 border rounded-lg ${variant.isControl ? 'border-blue-200 bg-blue-50/50' : ''}`}
                          data-testid={`variant-performance-${variant.id}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{variant.name}</h5>
                              {variant.isControl && (
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  Control
                                </Badge>
                              )}
                              {variant.status === 'winner' && (
                                <Badge className="bg-green-600">
                                  <Trophy className="mr-1 h-3 w-3" />
                                  Winner
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatNumber(variant.messagesSent)} messages sent
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Open Rate</div>
                              <div className="text-lg font-semibold">
                                {formatPercentage(variant.openRate)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Click Rate</div>
                              <div className="text-lg font-semibold">
                                {formatPercentage(variant.clickRate)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Conversion Rate</div>
                              <div className="text-lg font-semibold">
                                {formatPercentage(variant.conversionRate)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Audience %</div>
                              <div className="text-lg font-semibold">
                                {Math.round((variant.messagesSent / (abTestPerformance?.overallMetrics?.totalMessagesSent || 1)) * 100)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
                      <p className="text-muted-foreground">
                        Performance data will appear once the test starts running
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistical Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistical Analysis</CardTitle>
                  <CardDescription>
                    Confidence levels and significance testing results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Confidence Level</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedAbTestCampaign.confidenceLevel}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Statistical Significance</span>
                        <span className={`text-sm ${abTestPerformance?.overallMetrics?.statisticalSignificance ? 'text-green-600' : 'text-orange-600'}`}>
                          {abTestPerformance?.overallMetrics?.statisticalSignificance ? 'Achieved' : 'Not Yet'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Success Metric</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedAbTestCampaign.successMetric.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Test Type</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedAbTestCampaign.testType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Auto-Optimization</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedAbTestCampaign.autoOptimization === 1 ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Winner Criteria</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedAbTestCampaign.winnerSelectionCriteria.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Variants View */}
          {abTestView === "variants" && selectedAbTestCampaign && (
            <div className="space-y-6">
              {/* Variants Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{selectedAbTestCampaign.name} - Variants</h4>
                  <p className="text-sm text-muted-foreground">
                    Manage test variants and their configurations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowVariantDialog(true)}
                    data-testid="button-add-variant"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Variant
                  </Button>
                </div>
              </div>

              {/* Variant List */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Variants</CardTitle>
                  <CardDescription>
                    Configure and compare different variations of your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {testVariantsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : testVariants && testVariants.length > 0 ? (
                    <div className="space-y-4">
                      {testVariants.map((variant) => (
                        <div 
                          key={variant.id}
                          className={`p-4 border rounded-lg ${variant.isControl === 1 ? 'border-blue-200 bg-blue-50/50' : ''}`}
                          data-testid={`variant-${variant.id}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{variant.variantName}</h5>
                              {variant.isControl === 1 && (
                                <Badge variant="outline" className="text-blue-600 border-blue-600">
                                  Control
                                </Badge>
                              )}
                              <Badge variant="outline">
                                {variant.audiencePercentage}% audience
                              </Badge>
                              <Badge variant={getStatusBadgeColor(variant.status)}>
                                {variant.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" data-testid={`edit-variant-${variant.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" data-testid={`preview-variant-${variant.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Template Overrides */}
                          {variant.templateOverrides && Object.keys(variant.templateOverrides).length > 0 && (
                            <div className="space-y-2">
                              <h6 className="text-sm font-medium text-muted-foreground">Template Overrides:</h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {variant.templateOverrides.subject && (
                                  <div>
                                    <span className="font-medium">Subject:</span>
                                    <div className="text-muted-foreground truncate">
                                      {variant.templateOverrides.subject}
                                    </div>
                                  </div>
                                )}
                                {variant.templateOverrides.content && (
                                  <div>
                                    <span className="font-medium">Content:</span>
                                    <div className="text-muted-foreground truncate">
                                      {variant.templateOverrides.content.substring(0, 100)}...
                                    </div>
                                  </div>
                                )}
                                {variant.templateOverrides.channel && (
                                  <div>
                                    <span className="font-medium">Channel:</span>
                                    <div className="text-muted-foreground">
                                      {variant.templateOverrides.channel}
                                    </div>
                                  </div>
                                )}
                                {variant.templateOverrides.sendTime && (
                                  <div>
                                    <span className="font-medium">Send Time:</span>
                                    <div className="text-muted-foreground">
                                      {variant.templateOverrides.sendTime}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Split className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Variants Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add variants to start testing different approaches
                      </p>
                      <Button 
                        onClick={() => setShowVariantDialog(true)}
                        data-testid="button-create-first-variant"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Variant
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Create A/B Test Campaign Dialog */}
          <Dialog open={showAbTestCampaignDialog} onOpenChange={setShowAbTestCampaignDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create A/B Test Campaign</DialogTitle>
              </DialogHeader>
              <Form {...abTestCampaignForm}>
                <form onSubmit={abTestCampaignForm.handleSubmit((data) => createAbTestCampaignMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={abTestCampaignForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter campaign name" {...field} data-testid="input-campaign-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={abTestCampaignForm.control}
                      name="testType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-test-type">
                                <SelectValue placeholder="Select test type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="subject_line">Subject Line</SelectItem>
                              <SelectItem value="content">Content</SelectItem>
                              <SelectItem value="send_time">Send Time</SelectItem>
                              <SelectItem value="channel">Channel</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={abTestCampaignForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your test..." {...field} data-testid="textarea-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={abTestCampaignForm.control}
                      name="baseTemplateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Template</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-base-template">
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
                    <FormField
                      control={abTestCampaignForm.control}
                      name="targetSegmentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Segment (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-target-segment">
                                <SelectValue placeholder="Select segment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">All Customers</SelectItem>
                              {segments?.map((segment) => (
                                <SelectItem key={segment.id} value={segment.id}>
                                  {segment.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={abTestCampaignForm.control}
                      name="sampleSizePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample Size (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="100" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-sample-size"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={abTestCampaignForm.control}
                      name="testDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (hours)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="720" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-test-duration"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={abTestCampaignForm.control}
                      name="confidenceLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confidence Level</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-confidence-level">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="90">90%</SelectItem>
                              <SelectItem value="95">95%</SelectItem>
                              <SelectItem value="99">99%</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={abTestCampaignForm.control}
                      name="successMetric"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Success Metric</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-success-metric">
                                <SelectValue placeholder="Select metric" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="open_rate">Open Rate</SelectItem>
                              <SelectItem value="click_rate">Click Rate</SelectItem>
                              <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                              <SelectItem value="booking_rate">Booking Rate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={abTestCampaignForm.control}
                      name="winnerSelectionCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Winner Selection</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-winner-criteria">
                                <SelectValue placeholder="Select criteria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="statistical_significance">Statistical Significance</SelectItem>
                              <SelectItem value="business_rules">Business Rules</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={abTestCampaignForm.control}
                    name="autoOptimization"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-Optimization</FormLabel>
                          <FormDescription>
                            Automatically select winner when statistical significance is achieved
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-auto-optimization"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowAbTestCampaignDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createAbTestCampaignMutation.isPending}
                      data-testid="button-create-ab-test-submit"
                    >
                      {createAbTestCampaignMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create A/B Test'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Create Variant Dialog */}
          <Dialog open={showVariantDialog} onOpenChange={setShowVariantDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Test Variant</DialogTitle>
              </DialogHeader>
              <Form {...testVariantForm}>
                <form onSubmit={testVariantForm.handleSubmit((data) => {
                  if (selectedAbTestCampaign) {
                    createTestVariantMutation.mutate({...data, testCampaignId: selectedAbTestCampaign.id});
                  }
                })} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={testVariantForm.control}
                      name="variantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Variant A" {...field} data-testid="input-variant-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={testVariantForm.control}
                      name="audiencePercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Audience Percentage</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="100" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-audience-percentage"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Template Overrides</Label>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="subject-override">Subject Line Override</Label>
                        <Input 
                          id="subject-override"
                          placeholder="Optional: Override subject line"
                          data-testid="input-subject-override"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content-override">Content Override</Label>
                        <Textarea 
                          id="content-override"
                          placeholder="Optional: Override content"
                          rows={4}
                          data-testid="textarea-content-override"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="channel-override">Channel Override</Label>
                          <Select data-testid="select-channel-override">
                            <SelectTrigger>
                              <SelectValue placeholder="Same as template" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="send-time-override">Send Time Override</Label>
                          <Input 
                            id="send-time-override"
                            type="time"
                            data-testid="input-send-time-override"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowVariantDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTestVariantMutation.isPending}
                      data-testid="button-create-variant-submit"
                    >
                      {createTestVariantMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Add Variant'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Winner Selection Dialog */}
          <Dialog open={showWinnerSelectionDialog} onOpenChange={setShowWinnerSelectionDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Select Test Winner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose the winning variant to complete this A/B test. The selected variant will be marked as the winner.
                </p>
                
                {abTestPerformance?.variants?.map((variant) => (
                  <div 
                    key={variant.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      if (selectedAbTestCampaign) {
                        selectWinnerMutation.mutate({
                          testId: selectedAbTestCampaign.id,
                          variantId: variant.id
                        });
                      }
                    }}
                    data-testid={`select-winner-${variant.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{variant.name}</h5>
                        <div className="text-sm text-muted-foreground">
                          Open: {formatPercentage(variant.openRate)} | 
                          Click: {formatPercentage(variant.clickRate)} | 
                          Conv: {formatPercentage(variant.conversionRate)}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowWinnerSelectionDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

      </Tabs>
    </div>
  );
}