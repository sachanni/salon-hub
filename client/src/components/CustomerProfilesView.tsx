import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  MessageSquare,
  User, 
  Crown, 
  Calendar,
  DollarSign,
  Scissors,
  ArrowUpDown,
  Eye,
  Edit,
  Tags,
  Heart
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Customer {
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpentPaisa: number;
  lastBookingDate: string;
  lastBookingStatus: string;
}

interface CustomerProfile {
  id: string;
  salonId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  preferences?: Record<string, any>;
  isVip: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CustomerStats {
  totalBookings: number;
  totalSpent: number;
  lastVisit: string | null;
  favoriteServices: Array<{ serviceId: string; serviceName: string; count: number }>;
  averageSpend: number;
  bookingFrequency: string;
}

interface BookingHistory {
  id: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  totalAmountPaisa: number;
  currency: string;
  notes?: string;
  createdAt: string;
  serviceName?: string;
  serviceDuration?: number;
  staffName?: string;
}

const customerNotesSchema = z.object({
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  preferences: z.record(z.any()).optional(),
  isVip: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

const BOOKING_FREQUENCY_COLORS = {
  'New Customer': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  'Returning': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Regular': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Frequent': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const STATUS_COLORS = {
  'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

interface CustomerProfilesViewProps {
  salonId: string;
}

export default function CustomerProfilesView({ salonId }: CustomerProfilesViewProps) {
  const { } = useAuth(); // Session-based auth - no token needed
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("lastBookingDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterFrequency, setFilterFrequency] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['/api/salons', salonId, 'customers'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/customers`, {
        credentials: 'include', // Include session cookies
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      return response.json() as Promise<Customer[]>;
    },
    enabled: !!salonId
  });

  // Fetch customer detail
  const { data: customerDetail, isLoading: customerDetailLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'customers', selectedCustomer?.email],
    queryFn: async () => {
      if (!selectedCustomer?.email) return null;
      const encodedEmail = encodeURIComponent(selectedCustomer.email);
      const response = await fetch(`/api/salons/${salonId}/customers/${encodedEmail}`, {
        credentials: 'include', // Include session cookies
      });
      if (!response.ok) {
        throw new Error('Failed to fetch customer detail');
      }
      const data = await response.json();
      return data as { profile: CustomerProfile; bookingHistory: BookingHistory[]; stats: CustomerStats };
    },
    enabled: !!selectedCustomer?.email && !!salonId && isCustomerDialogOpen
  });

  // Customer notes form
  const notesForm = useForm({
    resolver: zodResolver(customerNotesSchema),
    defaultValues: {
      notes: "",
      preferences: {},
      isVip: false,
      tags: []
    }
  });

  // Hydrate form with actual customer data when customerDetail loads
  useEffect(() => {
    if (customerDetail?.profile && isCustomerDialogOpen) {
      const profile = customerDetail.profile;
      
      // Populate form with actual customer data
      notesForm.reset({
        notes: profile.notes || "",
        preferences: profile.preferences || {},
        isVip: !!profile.isVip, // Convert number to boolean
        tags: profile.tags || []
      });
    }
  }, [customerDetail, isCustomerDialogOpen, notesForm]);

  // Update customer profile mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!selectedCustomer?.email) throw new Error('No customer selected');
      const encodedEmail = encodeURIComponent(selectedCustomer.email);
      return apiRequest(`/api/salons/${salonId}/customers/${encodedEmail}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'customers', selectedCustomer?.email] });
      toast({
        title: "Success",
        description: "Customer profile updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer profile",
        variant: "destructive"
      });
    }
  });

  // Calculate booking frequency from total bookings
  const getBookingFrequency = (totalBookings: number) => {
    if (totalBookings >= 10) return 'Frequent';
    if (totalBookings >= 5) return 'Regular';
    if (totalBookings >= 2) return 'Returning';
    return 'New Customer';
  };

  // Format currency
  const formatCurrency = (amountPaisa: number, currency: string = 'INR') => {
    const amount = amountPaisa / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date and time
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}`);
      return format(dateTime, 'MMM dd, yyyy h:mm a');
    } catch {
      return `${date} ${time}`;
    }
  };

  // Handle contact actions
  const handleCall = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  const handleSMS = (phone: string) => {
    if (phone) {
      window.open(`sms:${phone}`, '_self');
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Reset form to defaults initially - will be hydrated when customerDetail loads
    notesForm.reset({
      notes: "",
      preferences: {},
      isVip: false,
      tags: []
    });
    setIsCustomerDialogOpen(true);
  };

  const handleSaveNotes = (data: any) => {
    // Add defensive checks to prevent overwriting existing data with empty values
    if (!customerDetail?.profile) {
      toast({
        title: "Error",
        description: "Customer data not loaded. Please wait and try again.",
        variant: "destructive"
      });
      return;
    }

    // Merge form data with existing profile data to prevent loss
    const updateData = {
      notes: data.notes !== undefined ? data.notes : (customerDetail.profile.notes || ""),
      preferences: data.preferences !== undefined ? data.preferences : (customerDetail.profile.preferences || {}),
      isVip: data.isVip !== undefined ? data.isVip : !!customerDetail.profile.isVip,
      tags: data.tags !== undefined ? data.tags : (customerDetail.profile.tags || [])
    };

    updateCustomerMutation.mutate(updateData);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvData = filteredAndSortedCustomers.map(customer => ({
        'Customer Name': customer.name,
        'Email': customer.email,
        'Phone': customer.phone,
        'Total Bookings': customer.totalBookings,
        'Total Spent': formatCurrency(customer.totalSpentPaisa),
        'Last Booking Date': customer.lastBookingDate ? format(parseISO(customer.lastBookingDate), 'MMM dd, yyyy') : 'Never',
        'Last Booking Status': customer.lastBookingStatus || 'N/A',
        'Booking Frequency': getBookingFrequency(customer.totalBookings)
      }));

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salon-customers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Customer data exported successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export customer data", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  // Filtered and sorted customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const searchMatch = searchTerm === "" || 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase());

      const frequencyMatch = filterFrequency === "" || filterFrequency === "all" ||
        getBookingFrequency(customer.totalBookings) === filterFrequency;

      return searchMatch && frequencyMatch;
    });

    return filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Customer];
      let bVal: any = b[sortBy as keyof Customer];

      if (sortBy === 'totalSpentPaisa' || sortBy === 'totalBookings') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortBy === 'lastBookingDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, searchTerm, sortBy, sortOrder, filterFrequency]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (customersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Customer Profiles...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Fetching customer data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (customersError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load customer profiles. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2" data-testid="text-customers-title">
              <User className="h-6 w-6" />
              Customer Profiles ({customers.length})
            </CardTitle>
            <CardDescription>
              Manage your salon's customer relationships and booking history
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || customers.length === 0}
              data-testid="button-export-customers"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-customers"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterFrequency} onValueChange={setFilterFrequency}>
              <SelectTrigger className="w-48" data-testid="select-frequency-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="New Customer">New Customer</SelectItem>
                <SelectItem value="Returning">Returning</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Frequent">Frequent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredAndSortedCustomers.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchTerm || filterFrequency ? "No customers match your search criteria" : "No customers found"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterFrequency ? "Try adjusting your filters" : "Customer profiles will appear here after they make bookings"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('name')} data-testid="header-customer-name">
                    <div className="flex items-center gap-2">
                      Customer Name
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('totalBookings')} data-testid="header-total-bookings">
                    <div className="flex items-center gap-2">
                      Total Bookings
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('totalSpentPaisa')} data-testid="header-total-spent">
                    <div className="flex items-center gap-2">
                      Total Spent
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('lastBookingDate')} data-testid="header-last-visit">
                    <div className="flex items-center gap-2">
                      Last Visit
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCustomers.map((customer, index) => (
                  <TableRow key={`${customer.email}-${index}`} data-testid={`row-customer-${index}`}>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-customer-name-${index}`}>
                        {customer.name}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-customer-email-${index}`}>
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {customer.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(customer.phone)}
                            data-testid={`button-call-${index}`}
                          >
                            <Phone className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEmail(customer.email)}
                          data-testid={`button-email-${index}`}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                        {customer.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSMS(customer.phone)}
                            data-testid={`button-sms-${index}`}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-bookings-count-${index}`}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {customer.totalBookings}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-total-spent-${index}`}>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {formatCurrency(customer.totalSpentPaisa)}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-last-visit-${index}`}>
                      {customer.lastBookingDate ? (
                        <div>
                          <div className="text-sm">
                            {format(parseISO(customer.lastBookingDate), 'MMM dd, yyyy')}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={STATUS_COLORS[customer.lastBookingStatus as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"}
                            data-testid={`badge-last-status-${index}`}
                          >
                            {customer.lastBookingStatus}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={BOOKING_FREQUENCY_COLORS[getBookingFrequency(customer.totalBookings) as keyof typeof BOOKING_FREQUENCY_COLORS]}
                        data-testid={`badge-frequency-${index}`}
                      >
                        {getBookingFrequency(customer.totalBookings)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewCustomer(customer)}
                        data-testid={`button-view-customer-${index}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Customer Detail Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-customer-detail-title">
              <User className="h-5 w-5" />
              {selectedCustomer?.name} - Customer Profile
            </DialogTitle>
            <DialogDescription>
              Complete customer information, booking history, and notes
            </DialogDescription>
          </DialogHeader>

          {customerDetailLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading customer details...</div>
            </div>
          ) : customerDetail ? (
            <div className="grid gap-6">
              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-customer-total-bookings">
                          {customerDetail.stats.totalBookings}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-customer-total-revenue">
                          {formatCurrency(customerDetail.stats.totalSpent)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold" data-testid="text-customer-avg-spend">
                          {formatCurrency(customerDetail.stats.averageSpend)}
                        </p>
                        <p className="text-sm text-muted-foreground">Avg. Spend</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${BOOKING_FREQUENCY_COLORS[customerDetail.stats.bookingFrequency as keyof typeof BOOKING_FREQUENCY_COLORS]} h-8 px-3`}
                        data-testid="badge-customer-frequency"
                      >
                        {customerDetail.stats.bookingFrequency}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Customer Type</p>
                  </CardContent>
                </Card>
              </div>

              {/* Favorite Services */}
              {customerDetail.stats.favoriteServices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Favorite Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {customerDetail.stats.favoriteServices.slice(0, 5).map((service, index) => (
                        <Badge key={service.serviceId} variant="secondary" data-testid={`badge-favorite-service-${index}`}>
                          <Scissors className="h-3 w-3 mr-1" />
                          {service.serviceName} ({service.count})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer Notes & Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Customer Notes & Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...notesForm}>
                    <form onSubmit={notesForm.handleSubmit(handleSaveNotes)} className="space-y-4">
                      <FormField
                        control={notesForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add notes about this customer..."
                                {...field}
                                data-testid="textarea-customer-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notesForm.control}
                        name="isVip"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                VIP Customer
                              </FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Mark this customer as VIP for special treatment
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-customer-vip"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updateCustomerMutation.isPending}
                          data-testid="button-save-customer-notes"
                        >
                          {updateCustomerMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Booking History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking History ({customerDetail.bookingHistory.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customerDetail.bookingHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No booking history available</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {customerDetail.bookingHistory.map((booking, index) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`booking-history-${index}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS]}
                                data-testid={`badge-booking-status-${index}`}
                              >
                                {booking.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDateTime(booking.bookingDate, booking.bookingTime)}
                              </span>
                            </div>
                            <div className="font-medium" data-testid={`text-booking-service-${index}`}>
                              {booking.serviceName || 'Unknown Service'}
                            </div>
                            {booking.staffName && (
                              <div className="text-sm text-muted-foreground">
                                with {booking.staffName}
                              </div>
                            )}
                            {booking.notes && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Note: {booking.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium" data-testid={`text-booking-amount-${index}`}>
                              {formatCurrency(booking.totalAmountPaisa, booking.currency)}
                            </div>
                            {booking.serviceDuration && (
                              <div className="text-sm text-muted-foreground">
                                {booking.serviceDuration} mins
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to load customer details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}