import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Star,
  Target,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Award,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

interface AdvancedAnalyticsDashboardProps {
  salonId: string;
}

interface StaffAnalytic {
  staffId: string;
  staffName: string;
  position: string;
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  cancellationRate: number;
  totalRevenuePaisa: number;
  averageBookingValuePaisa: number;
  workingDays: number;
  bookingsPerDay: number;
  revenuePerDay: number;
  utilizationScore: number;
  efficiency: number;
}

interface RetentionMetric {
  customerEmail: string;
  customerName: string;
  totalBookings: number;
  completedBookings: number;
  totalSpentPaisa: number;
  averageBookingValuePaisa: number;
  daysSinceFirst: number;
  daysSinceLast: number;
  averageDaysBetweenBookings: number;
  lifecycleStage: 'new' | 'returning' | 'loyal';
  churnRisk: 'low' | 'medium' | 'high';
  lifetimeValue: number;
}

interface ServiceAnalytic {
  serviceId: string;
  serviceName: string;
  category: string;
  standardPricePaisa: number;
  durationMinutes: number;
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  cancellationRate: number;
  totalRevenuePaisa: number;
  averageRevenuePerBookingPaisa: number;
  uniqueCustomers: number;
  customerReturnRate: number;
  bookingsTrend: { percentage: string; direction: string };
  revenueTrend: { percentage: string; direction: string };
  popularityScore: number;
}

interface CohortData {
  cohortMonth: string;
  cohortSize: number;
  returningCustomers: number;
  loyalCustomers: number;
  retentionRate: number;
  loyaltyRate: number;
  averageBookingsPerCustomer: number;
}

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
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    case 'down':
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    default:
      return 'default';
  }
};

const getLifecycleColor = (stage: string) => {
  switch (stage) {
    case 'loyal':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'returning':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function AdvancedAnalyticsDashboard({ salonId }: AdvancedAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [filterValue, setFilterValue] = useState("all");

  // Fetch advanced analytics data
  const { data: staffAnalytics, isLoading: staffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['/api/salons', salonId, 'analytics/staff', selectedPeriod],
    queryFn: () => fetch(`/api/salons/${salonId}/analytics/staff?period=${selectedPeriod}`).then(res => res.json()),
    enabled: !!salonId,
    staleTime: 60000
  });

  const { data: retentionAnalytics, isLoading: retentionLoading, refetch: refetchRetention } = useQuery({
    queryKey: ['/api/salons', salonId, 'analytics/retention', selectedPeriod],
    queryFn: () => fetch(`/api/salons/${salonId}/analytics/retention?period=${selectedPeriod}`).then(res => res.json()),
    enabled: !!salonId,
    staleTime: 60000
  });

  const { data: serviceAnalytics, isLoading: serviceLoading, refetch: refetchServices } = useQuery({
    queryKey: ['/api/salons', salonId, 'analytics/services', selectedPeriod],
    queryFn: () => fetch(`/api/salons/${salonId}/analytics/services?period=${selectedPeriod}`).then(res => res.json()),
    enabled: !!salonId,
    staleTime: 60000
  });

  const { data: businessIntelligence, isLoading: biLoading, refetch: refetchBI } = useQuery({
    queryKey: ['/api/salons', salonId, 'analytics/intelligence', selectedPeriod],
    queryFn: () => fetch(`/api/salons/${salonId}/analytics/intelligence?period=${selectedPeriod}`).then(res => res.json()),
    enabled: !!salonId,
    staleTime: 60000
  });

  const { data: cohortAnalysis, isLoading: cohortLoading, refetch: refetchCohorts } = useQuery({
    queryKey: ['/api/salons', salonId, 'analytics/cohorts'],
    enabled: !!salonId,
    staleTime: 300000 // 5 minutes cache for cohort analysis
  });

  const { data: customerSegmentation, isLoading: segmentationLoading, refetch: refetchSegmentation } = useQuery({
    queryKey: ['/api/salons', salonId, 'analytics/segmentation'],
    enabled: !!salonId,
    staleTime: 300000
  });

  const handleRefreshAll = () => {
    refetchStaff();
    refetchRetention();
    refetchServices();
    refetchBI();
    refetchCohorts();
    refetchSegmentation();
  };

  const handleExportData = () => {
    // Prepare data for export
    const exportData = {
      period: selectedPeriod,
      timestamp: new Date().toISOString(),
      staffAnalytics: staffAnalytics?.staffAnalytics || [],
      retentionMetrics: retentionAnalytics?.retentionMetrics || {},
      serviceMetrics: serviceAnalytics?.serviceAnalytics || [],
      businessIntelligence: businessIntelligence || {},
      cohortData: cohortAnalysis?.cohorts || [],
      customerSegments: customerSegmentation?.segments || []
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salon-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = staffLoading || retentionLoading || serviceLoading || biLoading || cohortLoading || segmentationLoading;

  return (
    <div className="space-y-6" data-testid="advanced-analytics-dashboard">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="dashboard-title">
            Advanced Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive business intelligence and performance insights
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Select 
            value={selectedPeriod} 
            onValueChange={setSelectedPeriod}
            data-testid="period-selector"
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoading}
            data-testid="refresh-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isLoading}
            data-testid="export-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading advanced analytics...
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6" data-testid="analytics-tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="staff" data-testid="tab-staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="retention" data-testid="tab-retention">Client Retention</TabsTrigger>
          <TabsTrigger value="services" data-testid="tab-services">Service Analytics</TabsTrigger>
          <TabsTrigger value="intelligence" data-testid="tab-intelligence">Business Intelligence</TabsTrigger>
          <TabsTrigger value="cohorts" data-testid="tab-cohorts">Cohort Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Key Performance Indicators */}
            <Card data-testid="kpi-staff-performance">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Staff Utilization</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffAnalytics?.summary?.averageUtilization || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {staffAnalytics?.summary?.totalStaff || 0} staff members
                </p>
              </CardContent>
            </Card>

            <Card data-testid="kpi-retention-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customer Retention Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {retentionAnalytics?.retentionMetrics?.retentionRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {retentionAnalytics?.retentionMetrics?.returningCustomers || 0} returning customers
                </p>
              </CardContent>
            </Card>

            <Card data-testid="kpi-avg-lifetime-value">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Customer LTV</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(retentionAnalytics?.retentionMetrics?.averageLifetimeValuePaisa || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime value per customer
                </p>
              </CardContent>
            </Card>

            <Card data-testid="kpi-revenue-growth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue Growth Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {businessIntelligence?.trends?.revenueGrowthRate || 0}%
                  {getTrendIcon(businessIntelligence?.trends?.revenueGrowthRate > 0 ? 'up' : 'down')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Period-over-period growth
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card data-testid="top-performers-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Best Staff Member</p>
                  <p className="text-lg font-semibold text-primary">
                    {staffAnalytics?.summary?.topPerformer || 'No data'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Most Popular Service</p>
                  <p className="text-lg font-semibold text-primary">
                    {serviceAnalytics?.insights?.topService || 'No data'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Best Performing Cohort</p>
                  <p className="text-lg font-semibold text-primary">
                    {cohortAnalysis?.summary?.bestPerformingCohort?.cohortMonth || 'No data'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Alerts and Insights */}
            <Card data-testid="alerts-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Business Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {retentionAnalytics?.retentionMetrics?.churnRisk?.high > 0 && (
                  <Alert data-testid="high-churn-alert">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {retentionAnalytics.retentionMetrics.churnRisk.high} customers at high churn risk
                    </AlertDescription>
                  </Alert>
                )}
                
                {businessIntelligence?.performance?.capacityUtilization < 50 && (
                  <Alert data-testid="low-utilization-alert">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Capacity utilization is {businessIntelligence.performance.capacityUtilization}% - consider optimization
                    </AlertDescription>
                  </Alert>
                )}

                {(staffAnalytics?.summary?.averageUtilization || 0) < 60 && (
                  <Alert data-testid="staff-utilization-alert">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Staff utilization below optimal level - review scheduling
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Performance Tab */}
        <TabsContent value="staff" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Performance Chart */}
            <Card data-testid="staff-performance-chart">
              <CardHeader>
                <CardTitle>Staff Revenue Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={staffAnalytics?.staffAnalytics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="staffName" angle={-45} textAnchor="end" height={80} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => `Staff: ${label}`}
                    />
                    <Bar dataKey="totalRevenuePaisa" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Utilization Scores */}
            <Card data-testid="staff-utilization-chart">
              <CardHeader>
                <CardTitle>Staff Utilization Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={staffAnalytics?.staffAnalytics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="staffName" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Utilization Score']}
                    />
                    <Bar dataKey="utilizationScore" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Staff Performance Table */}
          <Card data-testid="staff-performance-table">
            <CardHeader>
              <CardTitle>Detailed Staff Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Staff Member</th>
                      <th className="text-left p-2">Position</th>
                      <th className="text-right p-2">Bookings</th>
                      <th className="text-right p-2">Completion %</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(staffAnalytics?.staffAnalytics || []).map((staff: StaffAnalytic) => (
                      <tr key={staff.staffId} className="border-b hover:bg-muted/50" data-testid={`staff-row-${staff.staffId}`}>
                        <td className="p-2 font-medium">{staff.staffName}</td>
                        <td className="p-2 text-muted-foreground">{staff.position}</td>
                        <td className="p-2 text-right">{staff.totalBookings}</td>
                        <td className="p-2 text-right">
                          <Badge variant={staff.completionRate >= 90 ? 'default' : 'secondary'}>
                            {staff.completionRate}%
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(staff.totalRevenuePaisa)}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={staff.utilizationScore} className="w-16" />
                            <span className="text-sm">{staff.utilizationScore}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Retention Tab */}
        <TabsContent value="retention" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Retention Overview */}
            <Card data-testid="retention-overview">
              <CardHeader>
                <CardTitle>Customer Lifecycle Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New', value: retentionAnalytics?.retentionMetrics?.newCustomers || 0 },
                        { name: 'Returning', value: retentionAnalytics?.retentionMetrics?.returningCustomers || 0 },
                        { name: 'Loyal', value: retentionAnalytics?.retentionMetrics?.loyalCustomers || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'New', value: retentionAnalytics?.retentionMetrics?.newCustomers || 0 },
                        { name: 'Returning', value: retentionAnalytics?.retentionMetrics?.returningCustomers || 0 },
                        { name: 'Loyal', value: retentionAnalytics?.retentionMetrics?.loyalCustomers || 0 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Churn Risk Analysis */}
            <Card data-testid="churn-risk-analysis">
              <CardHeader>
                <CardTitle>Churn Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Low Risk', value: retentionAnalytics?.retentionMetrics?.churnRisk?.low || 0 },
                        { name: 'Medium Risk', value: retentionAnalytics?.retentionMetrics?.churnRisk?.medium || 0 },
                        { name: 'High Risk', value: retentionAnalytics?.retentionMetrics?.churnRisk?.high || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Low Risk', value: retentionAnalytics?.retentionMetrics?.churnRisk?.low || 0 },
                        { name: 'Medium Risk', value: retentionAnalytics?.retentionMetrics?.churnRisk?.medium || 0 },
                        { name: 'High Risk', value: retentionAnalytics?.retentionMetrics?.churnRisk?.high || 0 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#00C49F' : index === 1 ? '#FFBB28' : '#FF8042'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Customer Retention Metrics */}
          <Card data-testid="retention-metrics">
            <CardHeader>
              <CardTitle>Key Retention Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {retentionAnalytics?.retentionMetrics?.retentionRate || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Retention Rate</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {retentionAnalytics?.retentionMetrics?.loyaltyRate || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Loyalty Rate</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {retentionAnalytics?.retentionMetrics?.averageBookingsPerCustomer || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Bookings/Customer</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(retentionAnalytics?.retentionMetrics?.averageLifetimeValuePaisa || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. LTV</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High-Value Customers Table */}
          <Card data-testid="high-value-customers">
            <CardHeader>
              <CardTitle>High-Value Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Customer</th>
                      <th className="text-right p-2">Bookings</th>
                      <th className="text-right p-2">Lifetime Value</th>
                      <th className="text-left p-2">Stage</th>
                      <th className="text-left p-2">Churn Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(retentionAnalytics?.customerAnalytics || []).slice(0, 10).map((customer: RetentionMetric, index: number) => (
                      <tr key={customer.customerEmail} className="border-b hover:bg-muted/50" data-testid={`customer-row-${index}`}>
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{customer.customerName}</div>
                            <div className="text-sm text-muted-foreground">{customer.customerEmail}</div>
                          </div>
                        </td>
                        <td className="p-2 text-right">{customer.totalBookings}</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(customer.lifetimeValue)}
                        </td>
                        <td className="p-2">
                          <Badge className={getLifecycleColor(customer.lifecycleStage)}>
                            {customer.lifecycleStage}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant={getRiskColor(customer.churnRisk) as any}>
                            {customer.churnRisk}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Analytics Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Popularity Chart */}
            <Card data-testid="service-popularity-chart">
              <CardHeader>
                <CardTitle>Service Popularity Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={(serviceAnalytics?.serviceAnalytics || []).slice(0, 8)}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="serviceName" width={100} />
                    <Tooltip 
                      formatter={(value: number) => [value.toFixed(1), 'Popularity Score']}
                    />
                    <Bar dataKey="popularityScore" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Revenue Chart */}
            <Card data-testid="service-revenue-chart">
              <CardHeader>
                <CardTitle>Service Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={(serviceAnalytics?.serviceAnalytics || []).slice(0, 6).map(service => ({
                        name: service.serviceName,
                        value: service.totalRevenuePaisa
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(serviceAnalytics?.serviceAnalytics || []).slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Service Performance Table */}
          <Card data-testid="service-performance-table">
            <CardHeader>
              <CardTitle>Service Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Service</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Bookings</th>
                      <th className="text-right p-2">Completion %</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(serviceAnalytics?.serviceAnalytics || []).map((service: ServiceAnalytic) => (
                      <tr key={service.serviceId} className="border-b hover:bg-muted/50" data-testid={`service-row-${service.serviceId}`}>
                        <td className="p-2 font-medium">{service.serviceName}</td>
                        <td className="p-2 text-muted-foreground">{service.category}</td>
                        <td className="p-2 text-right">{service.totalBookings}</td>
                        <td className="p-2 text-right">
                          <Badge variant={service.completionRate >= 90 ? 'default' : 'secondary'}>
                            {service.completionRate}%
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(service.totalRevenuePaisa)}
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {getTrendIcon(service.revenueTrend.direction)}
                            <span className="text-sm">{service.revenueTrend.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Forecasting */}
            <Card data-testid="revenue-forecasting">
              <CardHeader>
                <CardTitle>Revenue Trend & Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={businessIntelligence?.trends?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenuePaisa" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Booking Volume Trend */}
            <Card data-testid="booking-volume-trend">
              <CardHeader>
                <CardTitle>Booking Volume Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={businessIntelligence?.trends?.dailyData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Bookings']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card data-testid="performance-metrics">
            <CardHeader>
              <CardTitle>Business Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(businessIntelligence?.forecasting?.averageDailyRevenuePaisa || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Daily Revenue</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {businessIntelligence?.forecasting?.averageDailyBookings || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Daily Bookings</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {businessIntelligence?.performance?.capacityUtilization || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Capacity Utilization</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {businessIntelligence?.trends?.revenueGrowthRate || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Revenue Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Performance Analysis */}
          <Card data-testid="peak-performance">
            <CardHeader>
              <CardTitle>Peak Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Peak Revenue Day</h4>
                  <div className="space-y-2">
                    <div className="text-lg font-bold">
                      {businessIntelligence?.performance?.peakRevenueDay?.date || 'No data'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(businessIntelligence?.performance?.peakRevenueDay?.revenuePaisa || 0)} revenue
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {businessIntelligence?.performance?.peakRevenueDay?.bookings || 0} bookings
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Peak Booking Day</h4>
                  <div className="space-y-2">
                    <div className="text-lg font-bold">
                      {businessIntelligence?.performance?.peakBookingDay?.date || 'No data'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {businessIntelligence?.performance?.peakBookingDay?.bookings || 0} bookings
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(businessIntelligence?.performance?.peakBookingDay?.revenuePaisa || 0)} revenue
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohorts" className="space-y-6">
          <Card data-testid="cohort-performance">
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track customer retention by month of first booking
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cohort Month</th>
                      <th className="text-right p-2">Size</th>
                      <th className="text-right p-2">Returning</th>
                      <th className="text-right p-2">Retention %</th>
                      <th className="text-right p-2">Loyal</th>
                      <th className="text-right p-2">Loyalty %</th>
                      <th className="text-right p-2">Avg. Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cohortAnalysis?.cohorts || []).map((cohort: CohortData) => (
                      <tr key={cohort.cohortMonth} className="border-b hover:bg-muted/50" data-testid={`cohort-row-${cohort.cohortMonth}`}>
                        <td className="p-2 font-medium">{cohort.cohortMonth}</td>
                        <td className="p-2 text-right">{cohort.cohortSize}</td>
                        <td className="p-2 text-right">{cohort.returningCustomers}</td>
                        <td className="p-2 text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={cohort.retentionRate} className="w-16" />
                            <span className="text-sm">{cohort.retentionRate}%</span>
                          </div>
                        </td>
                        <td className="p-2 text-right">{cohort.loyalCustomers}</td>
                        <td className="p-2 text-right">
                          <Badge variant={cohort.loyaltyRate >= 20 ? 'default' : 'secondary'}>
                            {cohort.loyaltyRate}%
                          </Badge>
                        </td>
                        <td className="p-2 text-right">{cohort.averageBookingsPerCustomer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cohort Summary */}
          <Card data-testid="cohort-summary">
            <CardHeader>
              <CardTitle>Cohort Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {cohortAnalysis?.summary?.totalCohorts || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Cohorts</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {cohortAnalysis?.summary?.averageRetentionRate || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Retention Rate</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {cohortAnalysis?.summary?.averageLoyaltyRate || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Loyalty Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Segmentation */}
          <Card data-testid="customer-segmentation">
            <CardHeader>
              <CardTitle>Customer Segmentation Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Segment</th>
                      <th className="text-right p-2">Customers</th>
                      <th className="text-right p-2">% of Base</th>
                      <th className="text-right p-2">Total Revenue</th>
                      <th className="text-right p-2">Avg. LTV</th>
                      <th className="text-right p-2">Avg. Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(customerSegmentation?.segments || []).map((segment, index) => (
                      <tr key={segment.segmentName} className="border-b hover:bg-muted/50" data-testid={`segment-row-${index}`}>
                        <td className="p-2 font-medium">{segment.segmentName}</td>
                        <td className="p-2 text-right">{segment.customerCount}</td>
                        <td className="p-2 text-right">{segment.percentage}%</td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(segment.totalRevenuePaisa)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(segment.averageLifetimeValuePaisa)}
                        </td>
                        <td className="p-2 text-right">{segment.averageBookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}