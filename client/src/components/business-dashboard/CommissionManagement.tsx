import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  IndianRupee, 
  Percent, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Plus,
  Edit,
  Trash2,
  Settings,
  Wallet,
  Calendar,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  FileSpreadsheet,
  FileText,
  Gift,
  Minus,
  History,
  RotateCcw,
  Package
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface CommissionRate {
  id: string;
  salonId: string;
  staffId: string | null;
  serviceId: string | null;
  productId: string | null;
  rateType: string;
  rateValue: string;
  minAmount: number | null;
  maxAmount: number | null;
  isDefault: number;
  isActive: number;
  appliesTo: string;
  createdAt: string;
  staffName?: string;
  serviceName?: string;
  productName?: string;
}

interface StaffSummary {
  staffId: string;
  staffName: string;
  commissions: number;
  tips: number;
  bonuses: number;
  deductions: number;
  adjustmentsNet: number;
  total: number;
  commissionCount: number;
}

interface StaffPayout {
  id: string;
  staffId: string;
  staffName?: string;
  totalAmountPaisa: number;
  commissionAmountPaisa: number;
  tipsAmountPaisa: number;
  adjustmentsAmountPaisa: number;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  paymentReference?: string;
  paymentDate: string;
  status: string;
  processedByName?: string;
  notes?: string;
}

interface StaffAdjustment {
  id: string;
  staffId: string;
  staffName?: string;
  adjustmentType: string;
  category: string;
  amountPaisa: number;
  reason: string;
  effectiveDate: string;
  status: string;
  createdByName?: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Service {
  id: string;
  name: string;
  priceInPaisa: number;
  category: string;
}

interface Product {
  id: string;
  name: string;
  sellingPriceInPaisa: number;
  category: string;
}

interface CommissionManagementProps {
  salonId: string;
}

export default function CommissionManagement({ salonId }: CommissionManagementProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CommissionRate | null>(null);
  const [selectedStaffForPayout, setSelectedStaffForPayout] = useState<StaffSummary | null>(null);
  const [dateFilter, setDateFilter] = useState("this_month");
  const [rateTypeFilter, setRateTypeFilter] = useState("all");

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "this_week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return { start: startOfWeek, end: now };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/commission-payout/summary', salonId, dateFilter],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const response = await fetch(
        `/api/commission-payout/summary/${salonId}?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch summary');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: payoutsData, isLoading: payoutsLoading } = useQuery({
    queryKey: ['/api/commission-payout/payouts', salonId],
    queryFn: async () => {
      const response = await fetch(`/api/commission-payout/payouts/${salonId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch payouts');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['/api/commission-payout/adjustments', salonId],
    queryFn: async () => {
      const response = await fetch(`/api/commission-payout/adjustments/${salonId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch adjustments');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: ratesData = [], isLoading: ratesLoading } = useQuery({
    queryKey: ['/api/commission-payout/rates', salonId, rateTypeFilter],
    queryFn: async () => {
      const typeParam = rateTypeFilter !== 'all' ? `?type=${rateTypeFilter}` : '';
      const response = await fetch(`/api/commission-payout/rates/${salonId}${typeParam}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch rates');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/staff`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json() as Promise<Staff[]>;
    },
    enabled: !!salonId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/services`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json() as Promise<Service[]>;
    },
    enabled: !!salonId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/salons', salonId, 'products'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/products`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json() as Promise<Product[]>;
    },
    enabled: !!salonId,
  });

  const createPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/commission-payout/payouts/${salonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payout');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commission-payout'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commission-payout/payouts', salonId] });
      queryClient.invalidateQueries({ queryKey: ['/api/commission-payout/summary', salonId] });
      setPayoutDialogOpen(false);
      setSelectedStaffForPayout(null);
      toast({ title: "Success", description: "Payout processed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/commission-payout/adjustments/${salonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create adjustment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commission-payout/adjustments'] });
      setAdjustmentDialogOpen(false);
      toast({ title: "Success", description: "Adjustment created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAdjustmentMutation = useMutation({
    mutationFn: async (adjustmentId: string) => {
      const response = await fetch(`/api/commission-payout/adjustments/${salonId}/${adjustmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete adjustment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commission-payout/adjustments'] });
      toast({ title: "Success", description: "Adjustment deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createRateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/commission-payout/rates/${salonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commission-payout/rates'] });
      setRateDialogOpen(false);
      setEditingRate(null);
      toast({ title: "Success", description: "Commission rate created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ rateId, data }: { rateId: string; data: any }) => {
      const response = await fetch(`/api/commission-payout/rates/${salonId}/${rateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/commission-payout/rates'] });
      setRateDialogOpen(false);
      setEditingRate(null);
      toast({ title: "Success", description: "Commission rate updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  const staffSummaries: StaffSummary[] = summaryData?.staffSummaries || [];
  const totals = summaryData?.totals || { commissions: 0, tips: 0, bonuses: 0, deductions: 0, adjustmentsNet: 0, total: 0 };
  const payouts: StaffPayout[] = payoutsData?.payouts || [];
  const adjustments: StaffAdjustment[] = adjustmentsData?.adjustments || [];

  const handleExport = async (format: 'excel' | 'pdf') => {
    const { start, end } = getDateRange();
    const url = `/api/commission-payout/export/${salonId}/${format}?startDate=${start.toISOString()}&endDate=${end.toISOString()}&type=all`;
    
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `commission-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({ title: "Success", description: `${format.toUpperCase()} report downloaded` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export report", variant: "destructive" });
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totals.commissions)}</div>
            <p className="text-xs text-muted-foreground">From services & products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tips Received</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(totals.tips)}</div>
            <p className="text-xs text-muted-foreground">Customer tips</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonuses</CardTitle>
            <Plus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatAmount(totals.bonuses)}</div>
            <p className="text-xs text-muted-foreground">Manual bonuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <Minus className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatAmount(totals.deductions)}</div>
            <p className="text-xs text-muted-foreground">Manual deductions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-700">Total Payable</CardTitle>
            <Wallet className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700">{formatAmount(totals.total)}</div>
            <p className="text-xs text-violet-600">Net amount due</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Earnings Summary</CardTitle>
              <CardDescription>Commission, tips, and adjustments by staff member</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : staffSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No earnings for this period</p>
              <p className="text-sm text-muted-foreground mt-1">
                Commissions are calculated when job cards are completed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-right">Commissions</TableHead>
                  <TableHead className="text-right">Tips</TableHead>
                  <TableHead className="text-right">Bonuses</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Total Payable</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffSummaries.map((ss) => (
                  <TableRow key={ss.staffId}>
                    <TableCell className="font-medium">{ss.staffName}</TableCell>
                    <TableCell className="text-right">{formatAmount(ss.commissions)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatAmount(ss.tips)}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatAmount(ss.bonuses)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatAmount(ss.deductions)}</TableCell>
                    <TableCell className="text-right font-bold">{formatAmount(ss.total)}</TableCell>
                    <TableCell className="text-center">
                      {ss.total > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedStaffForPayout(ss);
                            setPayoutDialogOpen(true);
                          }}
                        >
                          <Wallet className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const PayoutsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>All processed payouts to staff</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No payouts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Process your first payout from the Overview tab
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Tips</TableHead>
                  <TableHead className="text-right">Adjustments</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{format(new Date(payout.paymentDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{payout.staffName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(payout.periodStart), 'MMM dd')} - {format(new Date(payout.periodEnd), 'MMM dd')}
                    </TableCell>
                    <TableCell className="text-right">{formatAmount(payout.commissionAmountPaisa)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatAmount(payout.tipsAmountPaisa)}</TableCell>
                    <TableCell className="text-right">{formatAmount(payout.adjustmentsAmountPaisa)}</TableCell>
                    <TableCell className="text-right font-bold">{formatAmount(payout.totalAmountPaisa)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payout.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const AdjustmentsTab = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manual Adjustments</CardTitle>
                <CardDescription>Bonuses, deductions, and other adjustments for staff</CardDescription>
              </div>
              <Button onClick={() => setAdjustmentDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Adjustment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {adjustmentsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : adjustments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No adjustments</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add bonuses or deductions for staff members
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell>{format(new Date(adj.effectiveDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="font-medium">{adj.staffName}</TableCell>
                      <TableCell>
                        <Badge variant={adj.adjustmentType === 'bonus' ? 'default' : 'destructive'}>
                          {adj.adjustmentType === 'bonus' ? (
                            <><Plus className="h-3 w-3 mr-1" /> Bonus</>
                          ) : (
                            <><Minus className="h-3 w-3 mr-1" /> Deduction</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{adj.category.replace(/_/g, ' ')}</TableCell>
                      <TableCell className={`text-right font-medium ${adj.adjustmentType === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>
                        {adj.adjustmentType === 'bonus' ? '+' : '-'}{formatAmount(adj.amountPaisa)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={adj.reason}>{adj.reason}</TableCell>
                      <TableCell>
                        <Badge variant={adj.status === 'pending' ? 'secondary' : 'outline'}>
                          {adj.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {adj.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this adjustment?')) {
                                deleteAdjustmentMutation.mutate(adj.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const RatesTab = () => {
    const serviceRates = ratesData.filter((r: CommissionRate) => r.appliesTo === 'service');
    const productRates = ratesData.filter((r: CommissionRate) => r.appliesTo === 'product');
    const defaultServiceRate = serviceRates.find((r: CommissionRate) => !r.staffId && !r.serviceId);
    const defaultProductRate = productRates.find((r: CommissionRate) => !r.staffId && !r.productId);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={rateTypeFilter} onValueChange={setRateTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rates</SelectItem>
                <SelectItem value="service">Service Rates</SelectItem>
                <SelectItem value="product">Product Rates</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { setEditingRate(null); setRateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rate
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Service Commission Rates
              </CardTitle>
              <CardDescription>Rates for service-based commissions</CardDescription>
            </CardHeader>
            <CardContent>
              {defaultServiceRate ? (
                <div className="p-3 bg-violet-50 rounded-lg border border-violet-200 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-violet-700">Default Rate</p>
                      <p className="text-sm text-violet-600">
                        {defaultServiceRate.rateType === 'percentage' 
                          ? `${defaultServiceRate.rateValue}%` 
                          : formatAmount(Number(defaultServiceRate.rateValue) * 100)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingRate(defaultServiceRate); setRateDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No default service rate set
                </div>
              )}
              
              {serviceRates.filter((r: CommissionRate) => r.staffId || r.serviceId).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff/Service</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceRates.filter((r: CommissionRate) => r.staffId || r.serviceId).map((rate: CommissionRate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rate.staffName || 'All Staff'}</p>
                            <p className="text-sm text-muted-foreground">{rate.serviceName || 'All Services'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rate.rateType === 'percentage' 
                            ? `${rate.rateValue}%` 
                            : formatAmount(Number(rate.rateValue) * 100)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingRate(rate); setRateDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  No custom service rates configured
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Commission Rates
              </CardTitle>
              <CardDescription>Rates for product sales commissions</CardDescription>
            </CardHeader>
            <CardContent>
              {defaultProductRate ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-700">Default Rate</p>
                      <p className="text-sm text-green-600">
                        {defaultProductRate.rateType === 'percentage' 
                          ? `${defaultProductRate.rateValue}%` 
                          : formatAmount(Number(defaultProductRate.rateValue) * 100)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingRate(defaultProductRate); setRateDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No default product rate set
                </div>
              )}
              
              {productRates.filter((r: CommissionRate) => r.staffId || r.productId).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff/Product</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productRates.filter((r: CommissionRate) => r.staffId || r.productId).map((rate: CommissionRate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rate.staffName || 'All Staff'}</p>
                            <p className="text-sm text-muted-foreground">{rate.productName || 'All Products'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {rate.rateType === 'percentage' 
                            ? `${rate.rateValue}%` 
                            : formatAmount(Number(rate.rateValue) * 100)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingRate(rate); setRateDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground text-sm">
                  No custom product rates configured
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const ReportsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Commission Reports</CardTitle>
          <CardDescription>Generate and download detailed commission reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <FileSpreadsheet className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="font-semibold mb-2">Excel Report</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Detailed spreadsheet with commission breakdown, tips, and adjustments
                  </p>
                  <Button variant="outline" onClick={() => handleExport('excel')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <FileText className="h-12 w-12 text-red-600 mb-4" />
                  <h3 className="font-semibold mb-2">PDF Statement</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Professional payout statement suitable for records and sharing
                  </p>
                  <Button variant="outline" onClick={() => handleExport('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PayoutDialog = () => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentReference, setPaymentReference] = useState('');
    const [notes, setNotes] = useState('');

    const handlePayout = () => {
      if (!selectedStaffForPayout) return;
      const { start, end } = getDateRange();
      createPayoutMutation.mutate({
        staffId: selectedStaffForPayout.staffId,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        paymentMethod,
        paymentReference: paymentReference || undefined,
        notes: notes || undefined,
      });
    };

    return (
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Staff Payout</DialogTitle>
            <DialogDescription>
              Pay all pending earnings for {selectedStaffForPayout?.staffName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Commissions:</span>
                <span>{formatAmount(selectedStaffForPayout?.commissions || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tips:</span>
                <span className="text-green-600">{formatAmount(selectedStaffForPayout?.tips || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Net Adjustments:</span>
                <span className={selectedStaffForPayout?.adjustmentsNet && selectedStaffForPayout.adjustmentsNet >= 0 ? 'text-blue-600' : 'text-red-600'}>
                  {formatAmount(selectedStaffForPayout?.adjustmentsNet || 0)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total Payable:</span>
                <span className="text-lg">{formatAmount(selectedStaffForPayout?.total || 0)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('cash')}
                  className="h-auto py-3"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className="h-auto py-3"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bank
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('upi')}
                  className="h-auto py-3"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  UPI
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentRef">Reference Number (Optional)</Label>
              <Input
                id="paymentRef"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., Transaction ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayout} disabled={createPayoutMutation.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const AdjustmentDialog = () => {
    const [formData, setFormData] = useState({
      staffId: '',
      adjustmentType: 'bonus' as 'bonus' | 'deduction',
      category: 'performance',
      amountRupees: '',
      reason: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createAdjustmentMutation.mutate({
        staffId: formData.staffId,
        adjustmentType: formData.adjustmentType,
        category: formData.category,
        amountPaisa: Math.round(parseFloat(formData.amountRupees) * 100),
        reason: formData.reason,
        effectiveDate: new Date().toISOString(),
      });
    };

    return (
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Adjustment</DialogTitle>
            <DialogDescription>
              Add a bonus or deduction for a staff member
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={formData.staffId} onValueChange={(v) => setFormData({ ...formData, staffId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.adjustmentType === 'bonus' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, adjustmentType: 'bonus' })}
                  className="h-auto py-3"
                >
                  <Plus className="h-4 w-4 mr-2 text-green-500" />
                  Bonus
                </Button>
                <Button
                  type="button"
                  variant={formData.adjustmentType === 'deduction' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, adjustmentType: 'deduction' })}
                  className="h-auto py-3"
                >
                  <Minus className="h-4 w-4 mr-2 text-red-500" />
                  Deduction
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="sales_target">Sales Target</SelectItem>
                  <SelectItem value="customer_feedback">Customer Feedback</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={formData.amountRupees}
                onChange={(e) => setFormData({ ...formData, amountRupees: e.target.value })}
                placeholder="e.g., 500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain the reason for this adjustment..."
                rows={3}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAdjustmentMutation.isPending || !formData.staffId || !formData.amountRupees}>
                Add Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const RateFormDialog = () => {
    const [formData, setFormData] = useState({
      name: editingRate?.staffName || editingRate?.serviceName || editingRate?.productName || 'Commission Rate',
      staffId: editingRate?.staffId || '',
      serviceId: editingRate?.serviceId || '',
      productId: editingRate?.productId || '',
      rateType: editingRate?.rateType || 'percentage',
      rateValue: editingRate?.rateValue || '',
      appliesTo: editingRate?.appliesTo || 'service',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
        name: formData.name,
        staffId: formData.staffId || null,
        serviceId: formData.appliesTo === 'service' ? (formData.serviceId || null) : null,
        productId: formData.appliesTo === 'product' ? (formData.productId || null) : null,
        rateType: formData.rateType,
        rateValue: parseFloat(formData.rateValue),
        appliesTo: formData.appliesTo,
      };

      if (editingRate) {
        updateRateMutation.mutate({ rateId: editingRate.id, data });
      } else {
        createRateMutation.mutate(data);
      }
    };

    return (
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRate ? 'Edit' : 'Add'} Commission Rate</DialogTitle>
            <DialogDescription>
              Configure commission rate for services or products
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Applies To</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={formData.appliesTo === 'service' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, appliesTo: 'service', productId: '' })}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Services
                </Button>
                <Button
                  type="button"
                  variant={formData.appliesTo === 'product' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, appliesTo: 'product', serviceId: '' })}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Staff Member (Optional)</Label>
              <Select value={formData.staffId || "__all__"} onValueChange={(v) => setFormData({ ...formData, staffId: v === "__all__" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Staff (Default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Staff (Default)</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.appliesTo === 'service' && (
              <div className="space-y-2">
                <Label>Service (Optional)</Label>
                <Select value={formData.serviceId || "__all__"} onValueChange={(v) => setFormData({ ...formData, serviceId: v === "__all__" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Services</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.appliesTo === 'product' && (
              <div className="space-y-2">
                <Label>Product (Optional)</Label>
                <Select value={formData.productId || "__all__"} onValueChange={(v) => setFormData({ ...formData, productId: v === "__all__" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Products" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Products</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rate Type</Label>
                <Select value={formData.rateType} onValueChange={(v) => setFormData({ ...formData, rateType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate Value</Label>
                <Input
                  type="number"
                  min="0"
                  step={formData.rateType === 'percentage' ? '0.1' : '1'}
                  value={formData.rateValue}
                  onChange={(e) => setFormData({ ...formData, rateValue: e.target.value })}
                  placeholder={formData.rateType === 'percentage' ? 'e.g., 10' : 'e.g., 100'}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRateMutation.isPending || updateRateMutation.isPending}>
                {editingRate ? 'Update' : 'Create'} Rate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Commission & Payout Management</h2>
          <p className="text-muted-foreground">
            Track earnings, manage rates, process payouts, and generate reports
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Rates
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Adjustments
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6 mt-6">
          <PayoutsTab />
        </TabsContent>

        <TabsContent value="rates" className="space-y-6 mt-6">
          <RatesTab />
        </TabsContent>

        <TabsContent value="adjustments" className="space-y-6 mt-6">
          <AdjustmentsTab />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          <ReportsTab />
        </TabsContent>
      </Tabs>

      <PayoutDialog />
      <AdjustmentDialog />
      <RateFormDialog />
    </div>
  );
}
