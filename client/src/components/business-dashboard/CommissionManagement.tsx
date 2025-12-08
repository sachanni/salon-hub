import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Filter,
  Download,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface CommissionRate {
  id: string;
  salonId: string;
  staffId: string | null;
  serviceId: string | null;
  rateType: string;
  rateValue: string;
  minAmount: number | null;
  maxAmount: number | null;
  isDefault: number;
  isActive: number;
  createdAt: string;
  staffName?: string;
  serviceName?: string;
}

interface Commission {
  id: string;
  salonId: string;
  staffId: string;
  bookingId: string | null;
  serviceId: string | null;
  baseAmountPaisa: number;
  commissionAmountPaisa: number;
  commissionRate: string;
  serviceDate: string;
  paymentStatus: string;
  paidAt: string | null;
  staffName?: string;
  serviceName?: string;
  customerName?: string;
}

interface StaffCommissionSummary {
  staffId: string;
  staffName: string;
  staffPhoto?: string;
  servicesCompleted: number;
  totalServiceValue: number;
  totalCommission: number;
  pendingAmount: number;
  paidAmount: number;
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

interface CommissionManagementProps {
  salonId: string;
}

export default function CommissionManagement({ salonId }: CommissionManagementProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<CommissionRate | null>(null);
  const [selectedStaffForPayout, setSelectedStaffForPayout] = useState<StaffCommissionSummary | null>(null);
  const [dateFilter, setDateFilter] = useState("this_month");

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

  const { data: commissionRates = [], isLoading: ratesLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'commission-rates'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/commission-rates`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch commission rates');
      return response.json() as Promise<CommissionRate[]>;
    },
    enabled: !!salonId,
  });

  const { data: commissionSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'commissions', 'summary', dateFilter],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const response = await fetch(
        `/api/salons/${salonId}/commissions/summary?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch commission summary');
      return response.json();
    },
    enabled: !!salonId,
  });

  const { data: staffCommissions = [], isLoading: staffCommissionsLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'commissions', 'by-staff', dateFilter],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const response = await fetch(
        `/api/salons/${salonId}/commissions/by-staff?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch staff commissions');
      return response.json() as Promise<StaffCommissionSummary[]>;
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

  const createRateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/salons/${salonId}/commission-rates`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'commission-rates'] });
      setRateDialogOpen(false);
      setEditingRate(null);
      toast({ title: "Success", description: "Commission rate created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ rateId, data }: { rateId: string; data: any }) => {
      const response = await fetch(`/api/salons/${salonId}/commission-rates/${rateId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'commission-rates'] });
      setRateDialogOpen(false);
      setEditingRate(null);
      toast({ title: "Success", description: "Commission rate updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deactivateRateMutation = useMutation({
    mutationFn: async (rateId: string) => {
      const response = await fetch(`/api/salons/${salonId}/commission-rates/${rateId}/deactivate`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to deactivate rate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'commission-rates'] });
      toast({ title: "Success", description: "Commission rate deactivated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const payoutMutation = useMutation({
    mutationFn: async (data: { staffId: string; paymentMethod: string; notes?: string }) => {
      const { start, end } = getDateRange();
      const response = await fetch(`/api/salons/${salonId}/commissions/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payout');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'commissions'] });
      setPayoutDialogOpen(false);
      setSelectedStaffForPayout(null);
      toast({ 
        title: "Payout Processed", 
        description: `Marked ${data.updatedCount || 0} commissions as paid` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  const defaultRate = commissionRates.find(r => r.isDefault === 1 && r.isActive === 1);
  const staffRates = commissionRates.filter(r => r.staffId && !r.serviceId && r.isActive === 1);
  const serviceSpecificRates = commissionRates.filter(r => r.staffId && r.serviceId && r.isActive === 1);

  const SummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total This Period</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatAmount(commissionSummary?.totalCommission || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            From {commissionSummary?.totalServices || 0} services
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatAmount(commissionSummary?.pendingAmount || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {commissionSummary?.pendingCount || 0} pending
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid This Period</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatAmount(commissionSummary?.paidAmount || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {commissionSummary?.paidCount || 0} paid
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Per Staff</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatAmount(commissionSummary?.averagePerStaff || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {staffCommissions.length} staff with commissions
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const StaffCommissionTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Staff Commissions</CardTitle>
            <CardDescription>Commission earnings by staff member</CardDescription>
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
        {staffCommissionsLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : staffCommissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">No commissions for this period</p>
            <p className="text-sm text-muted-foreground mt-1">
              Commissions are calculated when job cards are completed
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead className="text-center">Services</TableHead>
                <TableHead className="text-right">Service Value</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffCommissions.map((sc) => (
                <TableRow key={sc.staffId}>
                  <TableCell className="font-medium">{sc.staffName}</TableCell>
                  <TableCell className="text-center">{sc.servicesCompleted}</TableCell>
                  <TableCell className="text-right">{formatAmount(sc.totalServiceValue)}</TableCell>
                  <TableCell className="text-right font-medium">{formatAmount(sc.totalCommission)}</TableCell>
                  <TableCell className="text-right">
                    {sc.pendingAmount > 0 ? (
                      <span className="text-orange-600 font-medium">{formatAmount(sc.pendingAmount)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {sc.paidAmount > 0 ? (
                      <span className="text-green-600">{formatAmount(sc.paidAmount)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {sc.pendingAmount > 0 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedStaffForPayout(sc);
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
  );

  const RateConfigurationPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Salon Default Rate</CardTitle>
              <CardDescription>
                This rate applies when no specific rate is configured for a staff member or service
              </CardDescription>
            </div>
            {!defaultRate && (
              <Button 
                size="sm"
                onClick={() => {
                  setEditingRate(null);
                  setRateDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Set Default
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {defaultRate ? (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                  {defaultRate.rateType === 'percentage' ? (
                    <Percent className="h-6 w-6 text-violet-600" />
                  ) : (
                    <IndianRupee className="h-6 w-6 text-violet-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {defaultRate.rateType === 'percentage' 
                      ? `${defaultRate.rateValue}%` 
                      : formatAmount(Number(defaultRate.rateValue) * 100)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {defaultRate.rateType === 'percentage' ? 'Percentage' : 'Fixed Amount'} per service
                    {defaultRate.minAmount && ` • Min: ${formatAmount(defaultRate.minAmount)}`}
                    {defaultRate.maxAmount && ` • Max: ${formatAmount(defaultRate.maxAmount)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setEditingRate(defaultRate);
                    setRateDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No default rate configured</p>
              <p className="text-sm">System will use 10% as fallback</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff-Specific Rates</CardTitle>
              <CardDescription>
                Override the default rate for specific staff members
              </CardDescription>
            </div>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingRate(null);
                setRateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staffRates.length === 0 && serviceSpecificRates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff-specific rates configured</p>
              <p className="text-sm">All staff will use the default rate</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Min/Max</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...staffRates, ...serviceSpecificRates].map((rate) => {
                  const staffMember = staff.find(s => s.id === rate.staffId);
                  const service = services.find(s => s.id === rate.serviceId);
                  return (
                    <TableRow key={rate.id}>
                      <TableCell className="font-medium">
                        {staffMember?.name || 'Unknown Staff'}
                      </TableCell>
                      <TableCell>
                        {service?.name || (rate.serviceId ? 'Unknown Service' : 'All Services')}
                      </TableCell>
                      <TableCell>
                        {rate.rateType === 'percentage' 
                          ? `${rate.rateValue}%` 
                          : formatAmount(Number(rate.rateValue) * 100)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rate.minAmount || rate.maxAmount ? (
                          <>
                            {rate.minAmount && `Min: ${formatAmount(rate.minAmount)}`}
                            {rate.minAmount && rate.maxAmount && ' / '}
                            {rate.maxAmount && `Max: ${formatAmount(rate.maxAmount)}`}
                          </>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={rate.isActive ? "default" : "secondary"}>
                          {rate.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setEditingRate(rate);
                              setRateDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deactivateRateMutation.mutate(rate.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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
    </div>
  );

  const RateFormDialog = () => {
    const [formData, setFormData] = useState({
      staffId: editingRate?.staffId || '',
      serviceId: editingRate?.serviceId || '',
      rateType: editingRate?.rateType || 'percentage',
      rateValue: editingRate?.rateValue || '',
      minAmount: editingRate?.minAmount ? String(editingRate.minAmount / 100) : '',
      maxAmount: editingRate?.maxAmount ? String(editingRate.maxAmount / 100) : '',
      isDefault: editingRate?.isDefault === 1 || (!editingRate && !defaultRate),
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
        staffId: formData.staffId || null,
        serviceId: formData.serviceId || null,
        rateType: formData.rateType,
        rateValue: formData.rateValue,
        minAmount: formData.minAmount ? Math.round(Number(formData.minAmount) * 100) : null,
        maxAmount: formData.maxAmount ? Math.round(Number(formData.maxAmount) * 100) : null,
        isDefault: formData.isDefault ? 1 : 0,
        isActive: 1,
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
            <DialogTitle>
              {editingRate ? 'Edit Commission Rate' : 'Add Commission Rate'}
            </DialogTitle>
            <DialogDescription>
              Configure how much staff members earn per service
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked, staffId: '', serviceId: '' })}
              />
              <Label htmlFor="isDefault">Set as salon default rate</Label>
            </div>

            {!formData.isDefault && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff Member</Label>
                  <Select 
                    value={formData.staffId} 
                    onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                  >
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
                  <Label htmlFor="serviceId">Service (Optional)</Label>
                  <Select 
                    value={formData.serviceId} 
                    onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All services (default for this staff)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Services</SelectItem>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rateType">Rate Type</Label>
                <Select 
                  value={formData.rateType} 
                  onValueChange={(value) => setFormData({ ...formData, rateType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateValue">
                  {formData.rateType === 'percentage' ? 'Percentage' : 'Amount (₹)'}
                </Label>
                <Input
                  id="rateValue"
                  type="number"
                  step={formData.rateType === 'percentage' ? '0.1' : '1'}
                  value={formData.rateValue}
                  onChange={(e) => setFormData({ ...formData, rateValue: e.target.value })}
                  placeholder={formData.rateType === 'percentage' ? 'e.g., 15' : 'e.g., 100'}
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">Minimum Cap (₹) (Optional)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  placeholder="e.g., 50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAmount">Maximum Cap (₹) (Optional)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRateMutation.isPending || updateRateMutation.isPending}>
                {editingRate ? 'Update Rate' : 'Create Rate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const PayoutDialog = () => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');

    const handlePayout = () => {
      if (!selectedStaffForPayout) return;
      payoutMutation.mutate({
        staffId: selectedStaffForPayout.staffId,
        paymentMethod,
        notes,
      });
    };

    return (
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Commission Payout</DialogTitle>
            <DialogDescription>
              Mark pending commissions as paid for {selectedStaffForPayout?.staffName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Amount to Pay</span>
                <span className="text-2xl font-bold">
                  {formatAmount(selectedStaffForPayout?.pendingAmount || 0)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                This will mark all pending commissions for this period as paid
              </p>
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Transaction ID, reference number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayout} disabled={payoutMutation.isPending}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Commission Management</h2>
          <p className="text-muted-foreground">
            Configure rates, track earnings, and process staff payouts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rate Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <SummaryCards />
          <StaffCommissionTable />
        </TabsContent>

        <TabsContent value="rates" className="mt-6">
          <RateConfigurationPanel />
        </TabsContent>
      </Tabs>

      <RateFormDialog />
      <PayoutDialog />
    </div>
  );
}
