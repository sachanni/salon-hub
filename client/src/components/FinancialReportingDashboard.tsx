import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  FileText,
  CreditCard,
  Users,
  Target,
  AlertTriangle,
  Calendar,
  Download,
  Plus,
  Edit,
  Check,
  X,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Settings
} from "lucide-react";

// Financial data type definitions
interface FinancialKPIs {
  revenue: {
    totalRevenue: number;
    averageBookingValue: number;
    revenuePerCustomer: number;
    revenueGrowthRate: number;
  };
  expenses: {
    totalExpenses: number;
    expenseRatio: number;
    costPerService: number;
    expenseGrowthRate: number;
  };
  profitability: {
    grossProfitMargin: number;
    netProfitMargin: number;
    breakEvenPoint: number;
    returnOnInvestment: number;
  };
  efficiency: {
    revenuePerStaff: number;
    serviceUtilizationRate: number;
    averageServiceTime: number;
    staffProductivity: number;
  };
}

const DEFAULT_KPIS: FinancialKPIs = {
  revenue: {
    totalRevenue: 0,
    averageBookingValue: 0,
    revenuePerCustomer: 0,
    revenueGrowthRate: 0
  },
  expenses: {
    totalExpenses: 0,
    expenseRatio: 0,
    costPerService: 0,
    expenseGrowthRate: 0
  },
  profitability: {
    grossProfitMargin: 0,
    netProfitMargin: 0,
    breakEvenPoint: 0,
    returnOnInvestment: 0
  },
  efficiency: {
    revenuePerStaff: 0,
    serviceUtilizationRate: 0,
    averageServiceTime: 0,
    staffProductivity: 0
  }
};

const safeNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const safeToFixed = (value: unknown, digits: number = 0, fallback: number = 0): string => {
  return safeNumber(value, fallback).toFixed(digits);
};

interface ProfitLossStatement {
  period: { startDate: string; endDate: string };
  revenue: {
    serviceRevenue: number;
    otherRevenue: number;
    totalRevenue: number;
  };
  expenses: {
    operatingExpenses: Array<{ categoryId: string; categoryName: string; amount: number }>;
    totalOperatingExpenses: number;
    commissions: number;
    taxes: number;
    totalExpenses: number;
  };
  profitLoss: {
    grossProfit: number;
    grossProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
    ebitda: number;
  };
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  isDefault: number;
}

interface Expense {
  id: string;
  salonId: string;
  categoryId: string;
  title: string;
  description?: string;
  amountPaisa: number;
  expenseDate: string;
  vendor?: string;
  receiptUrl?: string;
  status: string;
  taxDeductible: number;
  createdBy: string;
}

interface Commission {
  id: string;
  salonId: string;
  staffId: string;
  baseAmountPaisa: number;
  commissionAmountPaisa: number;
  commissionRate: string;
  serviceDate: string;
  paymentStatus: string;
}

interface Budget {
  id: string;
  salonId: string;
  categoryId: string;
  name: string;
  budgetAmountPaisa: number;
  spentAmountPaisa: number;
  budgetType: string;
  budgetPeriod: string;
  startDate: string;
  endDate: string;
  alertThreshold: number;
}

interface ExpenseAnalytics {
  totalExpenses: number;
  pendingApprovals: number;
  taxDeductibleAmount: number;
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

interface CommissionAnalytics {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  averageCommissionRate: number;
  commissionsByStaff: Array<{
    staffId: string;
    staffName: string;
    amount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;
}

interface BudgetAnalytics {
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  budgetsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    budget: number;
    spent: number;
    utilization: number;
  }>;
  alertingBudgets: Array<{
    budgetId: string;
    name: string;
    utilization: number;
  }>;
}

interface FinancialForecast {
  forecast: Array<{
    month: string;
    projectedRevenue: number;
    projectedExpenses: number;
    projectedProfit: number;
    confidence: number;
  }>;
  assumptions: {
    revenueGrowthRate: number;
    seasonalFactors: Array<{ month: number; factor: number }>;
    costInflationRate: number;
  };
  scenarios: {
    optimistic: { totalRevenue: number; totalProfit: number };
    realistic: { totalRevenue: number; totalProfit: number };
    pessimistic: { totalRevenue: number; totalProfit: number };
  };
}

// Form validation schemas
const expenseFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amountPaisa: z.number().min(1, "Amount must be greater than 0"),
  expenseDate: z.string().min(1, "Date is required"),
  vendor: z.string().optional(),
  taxDeductible: z.boolean().optional(),
});

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Budget name is required"),
  budgetAmountPaisa: z.number().min(1, "Budget amount must be greater than 0"),
  budgetType: z.string().min(1, "Budget type is required"),
  budgetPeriod: z.string().min(1, "Budget period is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  alertThreshold: z.number().min(1).max(100).optional(),
});

interface FinancialReportingDashboardProps {
  salonId: string;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export default function FinancialReportingDashboard({ 
  salonId, 
  selectedPeriod, 
  onPeriodChange 
}: FinancialReportingDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Format currency
  const formatCurrency = (amountInPaisa: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amountInPaisa / 100);
  };

  // Fetch financial KPIs
  const { data: kpisData, isLoading: kpisLoading } = useQuery<FinancialKPIs>({
    queryKey: ['/api/salons', salonId, 'financial-analytics/kpis', selectedPeriod],
    enabled: !!salonId,
    staleTime: 30000
  });

  const kpis: FinancialKPIs = {
    revenue: {
      totalRevenue: safeNumber(kpisData?.revenue?.totalRevenue),
      averageBookingValue: safeNumber(kpisData?.revenue?.averageBookingValue),
      revenuePerCustomer: safeNumber(kpisData?.revenue?.revenuePerCustomer),
      revenueGrowthRate: safeNumber(kpisData?.revenue?.revenueGrowthRate)
    },
    expenses: {
      totalExpenses: safeNumber(kpisData?.expenses?.totalExpenses),
      expenseRatio: safeNumber(kpisData?.expenses?.expenseRatio),
      costPerService: safeNumber(kpisData?.expenses?.costPerService),
      expenseGrowthRate: safeNumber(kpisData?.expenses?.expenseGrowthRate)
    },
    profitability: {
      grossProfitMargin: safeNumber(kpisData?.profitability?.grossProfitMargin),
      netProfitMargin: safeNumber(kpisData?.profitability?.netProfitMargin),
      breakEvenPoint: safeNumber(kpisData?.profitability?.breakEvenPoint),
      returnOnInvestment: safeNumber(kpisData?.profitability?.returnOnInvestment)
    },
    efficiency: {
      revenuePerStaff: safeNumber(kpisData?.efficiency?.revenuePerStaff),
      serviceUtilizationRate: safeNumber(kpisData?.efficiency?.serviceUtilizationRate),
      averageServiceTime: safeNumber(kpisData?.efficiency?.averageServiceTime),
      staffProductivity: safeNumber(kpisData?.efficiency?.staffProductivity)
    }
  };

  // Fetch P&L statement
  const { data: plStatement, isLoading: plLoading } = useQuery<ProfitLossStatement>({
    queryKey: ['/api/salons', salonId, 'financial-reports/profit-loss', dateRange.startDate, dateRange.endDate],
    enabled: !!salonId && !!dateRange.startDate && !!dateRange.endDate,
    staleTime: 30000
  });

  // Fetch expense categories
  const { data: expenseCategories } = useQuery<ExpenseCategory[]>({
    queryKey: ['/api/salons', salonId, 'expense-categories'],
    enabled: !!salonId,
    staleTime: 60000
  });

  // Fetch expenses
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ['/api/salons', salonId, 'expenses'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch commissions
  const { data: commissions } = useQuery<Commission[]>({
    queryKey: ['/api/salons', salonId, 'commissions'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch budgets
  const { data: budgets } = useQuery<Budget[]>({
    queryKey: ['/api/salons', salonId, 'budgets'],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch expense analytics
  const { data: expenseAnalytics } = useQuery<ExpenseAnalytics>({
    queryKey: ['/api/salons', salonId, 'expenses/analytics', selectedPeriod],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch commission analytics
  const { data: commissionAnalytics } = useQuery<CommissionAnalytics>({
    queryKey: ['/api/salons', salonId, 'commissions/analytics', selectedPeriod],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch budget analytics
  const { data: budgetAnalytics } = useQuery<BudgetAnalytics>({
    queryKey: ['/api/salons', salonId, 'budgets/analytics', selectedPeriod],
    enabled: !!salonId,
    staleTime: 30000
  });

  // Fetch financial forecast
  const { data: forecast } = useQuery<FinancialForecast>({
    queryKey: ['/api/salons', salonId, 'financial-analytics/forecast', 12],
    enabled: !!salonId,
    staleTime: 300000 // 5 minutes cache for forecast
  });

  // Create default expense categories mutation
  const createDefaultCategoriesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/salons/${salonId}/expense-categories/default`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'expense-categories'] });
      toast({ title: "Success", description: "Default expense categories created" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create default categories",
        variant: "destructive" 
      });
    }
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/salons/${salonId}/expenses`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'expenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'expenses/analytics'] });
      toast({ title: "Success", description: "Expense created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create expense",
        variant: "destructive" 
      });
    }
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', `/api/salons/${salonId}/budgets`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'budgets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'budgets/analytics'] });
      toast({ title: "Success", description: "Budget created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create budget",
        variant: "destructive" 
      });
    }
  });

  // Expense form
  const expenseForm = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      amountPaisa: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      vendor: "",
      taxDeductible: false,
    }
  });

  // Budget form
  const budgetForm = useForm({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      budgetAmountPaisa: 0,
      budgetType: "category",
      budgetPeriod: "monthly",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      alertThreshold: 80,
    }
  });

  const onExpenseSubmit = (data: any) => {
    createExpenseMutation.mutate({
      ...data,
      amountPaisa: Math.round(data.amountPaisa * 100), // Convert to paisa
    });
  };

  const onBudgetSubmit = (data: any) => {
    createBudgetMutation.mutate({
      ...data,
      budgetAmountPaisa: Math.round(data.budgetAmountPaisa * 100), // Convert to paisa
    });
  };

  // Chart colors
  const chartColors = ['#8B5CF6', '#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#F97316', '#6366F1', '#8B5A2B'];

  return (
    <div className="space-y-6 bg-white dark:bg-black text-black dark:text-white" data-testid="financial-dashboard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="dashboard-title">Financial Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive financial management and reporting</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={onPeriodChange} data-testid="period-selector">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            data-testid="button-export"
            onClick={() => {
              // TODO: Implement export functionality
              toast({ title: "Export", description: "Export functionality coming soon" });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6" data-testid="financial-tabs">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="profitloss" data-testid="tab-profitloss">P&L</TabsTrigger>
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
          <TabsTrigger value="commissions" data-testid="tab-commissions">Commissions</TabsTrigger>
          <TabsTrigger value="budgets" data-testid="tab-budgets">Budgets</TabsTrigger>
          <TabsTrigger value="forecast" data-testid="tab-forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Financial Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {kpisLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : kpis ? (
            <>
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card data-testid="kpi-revenue">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">{formatCurrency(kpis.revenue.totalRevenue)}</p>
                        <div className="flex items-center mt-1">
                          {kpis.revenue.revenueGrowthRate >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm ml-1 ${kpis.revenue.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(kpis.revenue.revenueGrowthRate).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="kpi-expenses">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold">{formatCurrency(kpis.expenses.totalExpenses)}</p>
                        <p className="text-sm text-muted-foreground">
                          {kpis.expenses.expenseRatio.toFixed(1)}% of revenue
                        </p>
                      </div>
                      <Receipt className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="kpi-profit-margin">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Net Profit Margin</p>
                        <p className="text-2xl font-bold">{kpis.profitability.netProfitMargin.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">
                          ROI: {kpis.profitability.returnOnInvestment.toFixed(1)}%
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="kpi-efficiency">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Revenue per Staff</p>
                        <p className="text-2xl font-bold">{formatCurrency(kpis.efficiency.revenuePerStaff)}</p>
                        <p className="text-sm text-muted-foreground">
                          {kpis.efficiency.serviceUtilizationRate.toFixed(0)}% utilization
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Financial Health Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Health Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Gross Profit Margin</span>
                        <span>{kpis.profitability.grossProfitMargin.toFixed(1)}%</span>
                      </div>
                      <Progress value={kpis.profitability.grossProfitMargin} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Break-even Point</span>
                        <span>{formatCurrency(kpis.profitability.breakEvenPoint)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Service Time</span>
                        <span>{kpis.efficiency.averageServiceTime.toFixed(0)} min</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Staff Productivity</span>
                        <span>{kpis.efficiency.staffProductivity.toFixed(1)} bookings/staff</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" data-testid="button-add-expense">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Expense
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Expense</DialogTitle>
                        </DialogHeader>
                        <Form {...expenseForm}>
                          <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
                            <FormField
                              control={expenseForm.control}
                              name="categoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {expenseCategories?.map((category: ExpenseCategory) => (
                                        <SelectItem key={category.id} value={category.id}>
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={expenseForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Expense title" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={expenseForm.control}
                              name="amountPaisa"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount (₹)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      {...field} 
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                      placeholder="0.00" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={expenseForm.control}
                              name="expenseDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button type="submit" className="w-full" disabled={createExpenseMutation.isPending}>
                              {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" data-testid="button-create-budget">
                          <Target className="h-4 w-4 mr-2" />
                          Create Budget
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New Budget</DialogTitle>
                        </DialogHeader>
                        <Form {...budgetForm}>
                          <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
                            <FormField
                              control={budgetForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Budget Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Monthly Supplies Budget" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={budgetForm.control}
                              name="categoryId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {expenseCategories?.map((category: ExpenseCategory) => (
                                        <SelectItem key={category.id} value={category.id}>
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={budgetForm.control}
                              name="budgetAmountPaisa"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Budget Amount (₹)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01"
                                      {...field} 
                                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                      placeholder="0.00" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={budgetForm.control}
                                name="startDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={budgetForm.control}
                                name="endDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={createBudgetMutation.isPending}>
                              {createBudgetMutation.isPending ? "Creating..." : "Create Budget"}
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    {!expenseCategories?.length && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => createDefaultCategoriesMutation.mutate()}
                        disabled={createDefaultCategoriesMutation.isPending}
                        data-testid="button-create-categories"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        {createDefaultCategoriesMutation.isPending ? "Creating..." : "Setup Expense Categories"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Unable to load financial data. Please check your connection and try again.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Profit & Loss Tab */}
        <TabsContent value="profitloss" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Profit & Loss Statement</h3>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                data-testid="input-start-date"
              />
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                data-testid="input-end-date"
              />
            </div>
          </div>

          {plLoading ? (
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : plStatement ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-revenue-breakdown">
                <CardHeader>
                  <CardTitle className="text-green-600">Revenue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Service Revenue</span>
                    <span className="font-medium">{formatCurrency(plStatement.revenue.serviceRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Revenue</span>
                    <span className="font-medium">{formatCurrency(plStatement.revenue.otherRevenue)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total Revenue</span>
                    <span>{formatCurrency(plStatement.revenue.totalRevenue)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-expense-breakdown">
                <CardHeader>
                  <CardTitle className="text-red-600">Expenses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plStatement.expenses.operatingExpenses.map((expense, index) => (
                    <div key={expense.categoryId} className="flex justify-between">
                      <span>{expense.categoryName}</span>
                      <span className="font-medium">{formatCurrency(expense.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span>Staff Commissions</span>
                    <span className="font-medium">{formatCurrency(plStatement.expenses.commissions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span className="font-medium">{formatCurrency(plStatement.expenses.taxes)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(plStatement.expenses.totalExpenses)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2" data-testid="card-profit-analysis">
                <CardHeader>
                  <CardTitle>Profit Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(plStatement.profitLoss.grossProfit)}
                      </p>
                      <p className="text-sm text-muted-foreground">Gross Profit</p>
                      <p className="text-xs">({plStatement.profitLoss.grossProfitMargin.toFixed(1)}% margin)</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${plStatement.profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(plStatement.profitLoss.netProfit)}
                      </p>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className="text-xs">({plStatement.profitLoss.netProfitMargin.toFixed(1)}% margin)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(plStatement.profitLoss.ebitda)}
                      </p>
                      <p className="text-sm text-muted-foreground">EBITDA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Unable to generate P&L statement. Please select a valid date range.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Expense Management</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-add-expense-tab">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <Form {...expenseForm}>
                  <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="space-y-4">
                    <FormField
                      control={expenseForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseCategories?.map((category: ExpenseCategory) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Expense title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Additional details..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="amountPaisa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              placeholder="0.00" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="vendor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Vendor name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="expenseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? "Creating..." : "Create Expense"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense Analytics */}
            {expenseAnalytics && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseAnalytics.expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {expenseAnalytics.expensesByCategory.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Expense Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenseAnalytics && (
                  <>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(expenseAnalytics.totalExpenses)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Pending Approvals</span>
                        <Badge variant="outline">{expenseAnalytics.pendingApprovals}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax Deductible</span>
                        <span>{formatCurrency(expenseAnalytics.taxDeductibleAmount)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses?.slice(0, 10).map((expense: Expense) => {
                  const category = expenseCategories?.find((cat: ExpenseCategory) => cat.id === expense.categoryId);
                  return (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category?.color || '#8B5CF6' }}
                        ></div>
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {category?.name} • {new Date(expense.expenseDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(expense.amountPaisa)}</p>
                        <Badge 
                          variant={expense.status === 'approved' ? 'default' : expense.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Commission Management</h3>
            <Button variant="outline" data-testid="button-commission-settings">
              <Settings className="h-4 w-4 mr-2" />
              Commission Settings
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Analytics */}
            {commissionAnalytics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Commission Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(commissionAnalytics.totalCommissions)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(commissionAnalytics.paidCommissions)}
                        </p>
                        <p className="text-xs text-muted-foreground">Paid Out</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(commissionAnalytics.pendingCommissions)}
                        </p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Average Commission Rate: {commissionAnalytics.averageCommissionRate.toFixed(1)}%
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Commission Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={commissionAnalytics.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Staff Commission Performance */}
          {commissionAnalytics?.commissionsByStaff && (
            <Card>
              <CardHeader>
                <CardTitle>Staff Commission Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commissionAnalytics.commissionsByStaff.map((staff: any) => (
                    <div key={staff.staffId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{staff.staffName}</p>
                        <p className="text-sm text-muted-foreground">
                          Earned: {formatCurrency(staff.earned)} • Pending: {formatCurrency(staff.pending)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(staff.paid)}</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Budget Management</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-create-budget-tab">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                </DialogHeader>
                <Form {...budgetForm}>
                  <form onSubmit={budgetForm.handleSubmit(onBudgetSubmit)} className="space-y-4">
                    <FormField
                      control={budgetForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Monthly Supplies Budget" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={budgetForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseCategories?.map((category: ExpenseCategory) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={budgetForm.control}
                      name="budgetAmountPaisa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Amount (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              placeholder="0.00" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={budgetForm.control}
                        name="budgetPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Period</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={budgetForm.control}
                        name="alertThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alert at (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="100"
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value) || 80)}
                                placeholder="80" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={budgetForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={budgetForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createBudgetMutation.isPending}>
                      {createBudgetMutation.isPending ? "Creating..." : "Create Budget"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Budget Analytics */}
          {budgetAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(budgetAnalytics.totalBudget)}</p>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Spent</span>
                      <span>{formatCurrency(budgetAnalytics.totalSpent)}</span>
                    </div>
                    <Progress value={budgetAnalytics.budgetUtilization} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {budgetAnalytics.budgetUtilization.toFixed(1)}% utilized
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Budget Performance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetAnalytics.budgetsByCategory.map((budget: any, index: number) => (
                      <div key={budget.categoryId} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{budget.categoryName}</span>
                          <div className="text-right">
                            <span className="text-sm">
                              {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                            </span>
                            <Badge 
                              variant={budget.status === 'over' ? 'destructive' : budget.status === 'on-track' ? 'secondary' : 'default'}
                              className="ml-2"
                            >
                              {budget.utilization.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <Progress 
                          value={budget.utilization} 
                          className={`h-2 ${budget.status === 'over' ? 'bg-red-100' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Budget Alerts */}
          {(budgetAnalytics?.alertingBudgets?.length ?? 0) > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Budget Alerts</p>
                  {budgetAnalytics?.alertingBudgets?.map((alert: any) => (
                    <p key={alert.budgetId} className="text-sm">
                      {alert.name} is at {alert.utilization.toFixed(0)}% utilization
                    </p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Financial Forecast</h3>
            <Badge variant="outline">12 Month Projection</Badge>
          </div>

          {forecast && (
            <>
              {/* Scenario Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center text-green-600">Optimistic</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-xl font-bold">{formatCurrency(forecast.scenarios.optimistic.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(forecast.scenarios.optimistic.totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Profit</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-center text-blue-600">Realistic</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-xl font-bold">{formatCurrency(forecast.scenarios.realistic.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(forecast.scenarios.realistic.totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Profit</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-center text-orange-600">Conservative</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <p className="text-xl font-bold">{formatCurrency(forecast.scenarios.pessimistic.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {formatCurrency(forecast.scenarios.pessimistic.totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Profit</p>
                  </CardContent>
                </Card>
              </div>

              {/* Forecast Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Profit Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={forecast.forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="projectedRevenue" 
                        stackId="1" 
                        stroke="#8B5CF6" 
                        fill="#8B5CF6" 
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="projectedProfit" 
                        stackId="2" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                        name="Profit"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Forecast Assumptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Assumptions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-medium">Revenue Growth Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        {forecast.assumptions.revenueGrowthRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Monthly</p>
                    </div>
                    <div>
                      <p className="font-medium">Cost Inflation Rate</p>
                      <p className="text-2xl font-bold text-red-600">
                        {forecast.assumptions.costInflationRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-muted-foreground">Annual</p>
                    </div>
                    <div>
                      <p className="font-medium">Seasonal Variance</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ±{Math.max(...forecast.assumptions.seasonalFactors.map(f => Math.abs(f.factor - 1))).toFixed(1)}
                      </p>
                      <p className="text-sm text-muted-foreground">Factor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}