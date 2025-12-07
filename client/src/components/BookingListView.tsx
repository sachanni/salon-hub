import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
  User,
  Scissors,
  DollarSign,
  AlertCircle,
  Users,
  AlertTriangle,
  Heart,
  Coffee,
  FileText
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Booking {
  id: string;
  salonId: string;
  serviceId: string;
  staffId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  salonName?: string;
  bookingDate: string;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmountPaisa: number;
  currency: string;
  paymentMethod?: 'pay_now' | 'pay_at_salon';
  notes?: string;
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  priceInPaisa: number;
  category?: string;
}

const notesSchema = z.object({
  notes: z.string().max(500, "Notes cannot exceed 500 characters")
});

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
};

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle
};

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "bookingDate-desc", label: "Booking Date (Latest)" },
  { value: "bookingDate-asc", label: "Booking Date (Earliest)" },
  { value: "customerName-asc", label: "Customer Name (A-Z)" },
  { value: "customerName-desc", label: "Customer Name (Z-A)" },
  { value: "totalAmountPaisa-desc", label: "Amount (High to Low)" },
  { value: "totalAmountPaisa-asc", label: "Amount (Low to High)" }
];

interface BookingListViewProps {
  salonId: string;
}

export default function BookingListView({ salonId }: BookingListViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingProfileEmail, setViewingProfileEmail] = useState<string | null>(null);
  
  const itemsPerPage = 25;

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['/api/salons', salonId, 'bookings', { statusFilter, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/salons/${salonId}/bookings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json() as Promise<Booking[]>;
    },
    enabled: !!salonId && !!user
  });

  // Fetch services for filtering
  const { data: services = [] } = useQuery({
    queryKey: ['/api/salons', salonId, 'services'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/services/manage`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json() as Promise<Service[]>;
    },
    enabled: !!salonId && !!user
  });

  // Fetch client profile by email for popup
  const { data: customerProfileData, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/client-profiles', salonId, 'by-email', viewingProfileEmail],
    queryFn: async () => {
      const response = await fetch(`/api/client-profiles/${salonId}/clients/by-email/${encodeURIComponent(viewingProfileEmail!)}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch client profile');
      }
      return response.json();
    },
    enabled: !!salonId && !!viewingProfileEmail
  });

  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.customerName.toLowerCase().includes(term) ||
        booking.customerEmail.toLowerCase().includes(term) ||
        booking.customerPhone.includes(term) ||
        booking.notes?.toLowerCase().includes(term)
      );
    }

    // Apply service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(booking => booking.serviceId === serviceFilter);
    }

    // Sort bookings
    const [sortField, sortDirection] = sortBy.split('-');
    filtered.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'customerName') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      }
      
      if (sortField === 'bookingDate' || sortField === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bookings, searchTerm, serviceFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);
  const paginatedBookings = filteredAndSortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Mutations
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status, notes }: { bookingId: string; status: string; notes?: string }) => {
      return apiRequest(`/api/salons/${salonId}/bookings/${bookingId}`, 'PUT', { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      toast({ title: "Success", description: "Booking updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update booking", variant: "destructive" });
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ bookingIds, status }: { bookingIds: string[]; status: string }) => {
      return apiRequest(`/api/salons/${salonId}/bookings/bulk-update`, 'PUT', { bookingIds, status });
    },
    onSuccess: (_, { bookingIds, status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      setSelectedBookings([]);
      toast({ 
        title: "Success", 
        description: `${bookingIds.length} booking(s) updated to ${status}` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update bookings", variant: "destructive" });
    }
  });

  // Notes form
  const notesForm = useForm({
    resolver: zodResolver(notesSchema),
    defaultValues: { notes: "" }
  });

  // Helper functions
  const formatCurrency = (amountPaisa: number, currency: string = 'INR') => {
    const amount = amountPaisa / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = parseISO(`${date}T${time}`);
      return format(dateTime, 'MMM dd, yyyy h:mm a');
    } catch {
      return `${date} ${time}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS];
    return (
      <Badge className={STATUS_COLORS[status as keyof typeof STATUS_COLORS]} data-testid={`status-badge-${status}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const canProgressStatus = (currentStatus: string) => {
    const statusProgression = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    return statusProgression[currentStatus as keyof typeof statusProgression] || [];
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(paginatedBookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleBulkAction = (status: string) => {
    if (selectedBookings.length === 0) return;
    bulkUpdateMutation.mutate({ bookingIds: selectedBookings, status });
  };

  const handleUpdateStatus = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  const handleEditNotes = (booking: Booking) => {
    setEditingNotes(booking.id);
    notesForm.reset({ notes: booking.notes || "" });
  };

  const handleSaveNotes = (bookingId: string, data: { notes: string }) => {
    updateBookingMutation.mutate({ 
      bookingId, 
      status: bookings.find(b => b.id === bookingId)?.status || 'pending',
      notes: data.notes 
    });
    setEditingNotes(null);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csvData = filteredAndSortedBookings.map(booking => ({
        'Booking ID': booking.id,
        'Customer Name': booking.customerName,
        'Customer Email': booking.customerEmail,
        'Customer Phone': booking.customerPhone,
        'Service': getServiceName(booking.serviceId),
        'Date & Time': formatDateTime(booking.bookingDate, booking.bookingTime),
        'Status': booking.status,
        'Amount': formatCurrency(booking.totalAmountPaisa, booking.currency),
        'Notes': booking.notes || '',
        'Created': format(parseISO(booking.createdAt), 'MMM dd, yyyy h:mm a')
      }));

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `salon-bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Bookings exported successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export bookings", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleContactCustomer = (type: 'phone' | 'email', contact: string) => {
    if (type === 'phone') {
      window.open(`tel:${contact}`);
    } else if (type === 'email') {
      window.open(`mailto:${contact}`);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setServiceFilter("all");
    setStartDate("");
    setEndDate("");
    setSortBy("createdAt-desc");
    setCurrentPage(1);
  };

  if (bookingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <p>Failed to load bookings. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold" data-testid="stat-total-bookings">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-bookings">
                  {bookings.filter(b => b.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-confirmed-bookings">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600" data-testid="stat-completed-bookings">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Booking Management
              </CardTitle>
              <CardDescription>
                Manage all salon bookings with filtering, search, and bulk actions
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedBookings.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" data-testid="button-bulk-actions">
                      Bulk Actions ({selectedBookings.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('confirmed')} data-testid="bulk-action-confirm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('completed')} data-testid="bulk-action-complete">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('cancelled')} data-testid="bulk-action-cancel">
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || filteredAndSortedBookings.length === 0}
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search customers, emails, phones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger data-testid="select-service-filter">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="input-start-date"
            />
            
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              data-testid="input-end-date"
            />
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || startDate || endDate) && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedBookings.length} of {bookings.length} bookings
              </p>
              <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Calendar className="mx-auto h-12 w-12 mb-4" />
                        <p>No bookings found</p>
                        {(searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' || startDate || endDate) && (
                          <p className="text-sm mt-2">Try adjusting your filters</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBookings.map((booking) => (
                    <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedBookings.includes(booking.id)}
                          onCheckedChange={(checked) => handleSelectBooking(booking.id, checked as boolean)}
                          data-testid={`checkbox-booking-${booking.id}`}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium" data-testid={`customer-name-${booking.id}`}>
                            {booking.customerName}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:text-foreground"
                              onClick={() => handleContactCustomer('email', booking.customerEmail)}
                              data-testid={`contact-email-${booking.id}`}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              {booking.customerEmail}
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:text-foreground"
                              onClick={() => handleContactCustomer('phone', booking.customerPhone)}
                              data-testid={`contact-phone-${booking.id}`}
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              {booking.customerPhone}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-muted-foreground" />
                          <span data-testid={`service-name-${booking.id}`}>
                            {getServiceName(booking.serviceId)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell data-testid={`booking-datetime-${booking.id}`}>
                        {formatDateTime(booking.bookingDate, booking.bookingTime)}
                      </TableCell>
                      
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span data-testid={`booking-amount-${booking.id}`}>
                            {formatCurrency(booking.totalAmountPaisa, booking.currency)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {booking.paymentMethod === 'pay_at_salon' ? (
                            <>
                              <Clock className="w-4 h-4 text-amber-600" />
                              <Badge 
                                variant="outline" 
                                className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:text-amber-300"
                                data-testid={`payment-method-${booking.id}`}
                              >
                                Pay at Salon
                              </Badge>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <Badge 
                                variant="outline" 
                                className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950 dark:text-green-300"
                                data-testid={`payment-method-${booking.id}`}
                              >
                                Paid Online
                              </Badge>
                            </>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {editingNotes === booking.id ? (
                          <Form {...notesForm}>
                            <form 
                              onSubmit={notesForm.handleSubmit((data) => handleSaveNotes(booking.id, data))}
                              className="space-y-2"
                            >
                              <FormField
                                control={notesForm.control}
                                name="notes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        {...field}
                                        placeholder="Add notes..."
                                        className="min-h-[60px]"
                                        data-testid={`textarea-notes-${booking.id}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2">
                                <Button 
                                  type="submit" 
                                  size="sm"
                                  disabled={updateBookingMutation.isPending}
                                  data-testid={`button-save-notes-${booking.id}`}
                                >
                                  Save
                                </Button>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingNotes(null)}
                                  data-testid={`button-cancel-notes-${booking.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </Form>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground max-w-[200px] truncate" data-testid={`booking-notes-${booking.id}`}>
                              {booking.notes || "No notes"}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs"
                              onClick={() => handleEditNotes(booking)}
                              data-testid={`button-edit-notes-${booking.id}`}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-actions-${booking.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setViewingProfileEmail(booking.customerEmail)}
                              data-testid={`action-view-profile-${booking.id}`}
                            >
                              <User className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            {canProgressStatus(booking.status).map(status => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleUpdateStatus(booking.id, status)}
                                data-testid={`action-${status}-${booking.id}`}
                              >
                                {status === 'confirmed' && <CheckCircle className="w-4 h-4 mr-2" />}
                                {status === 'completed' && <CheckCircle className="w-4 h-4 mr-2" />}
                                {status === 'cancelled' && <XCircle className="w-4 h-4 mr-2" />}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedBookings.length)} of {filteredAndSortedBookings.length} results
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    data-testid={`button-page-${page}`}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Customer Profile Dialog */}
      <Dialog open={!!viewingProfileEmail} onOpenChange={(open) => !open && setViewingProfileEmail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Profile
            </DialogTitle>
            <DialogDescription>
              {customerProfileData?.customer ? 
                `${customerProfileData.customer.firstName || ''} ${customerProfileData.customer.lastName || ''}`.trim() || viewingProfileEmail :
                viewingProfileEmail
              }
            </DialogDescription>
          </DialogHeader>
          
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading profile...</div>
            </div>
          ) : customerProfileData?.profile ? (
            <div className="space-y-4">
              {/* Allergies & Sensitivities Alert */}
              {((customerProfileData.profile.allergies && customerProfileData.profile.allergies.length > 0) ||
                (customerProfileData.profile.sensitivities && customerProfileData.profile.sensitivities.length > 0)) && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Important Health Information
                  </div>
                  {customerProfileData.profile.allergies?.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Allergies: </span>
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {customerProfileData.profile.allergies.join(', ')}
                      </span>
                    </div>
                  )}
                  {customerProfileData.profile.sensitivities?.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">Sensitivities: </span>
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {customerProfileData.profile.sensitivities.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Preferences */}
              <div className="space-y-3">
                {customerProfileData.profile.preferredStylist && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium">Preferred Stylist:</span>
                    <span className="text-sm text-muted-foreground">
                      {customerProfileData.profile.preferredStylist.name}
                    </span>
                  </div>
                )}
                
                {customerProfileData.profile.beveragePreference && (
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium">Beverage:</span>
                    <span className="text-sm text-muted-foreground">
                      {customerProfileData.profile.beveragePreference}
                    </span>
                  </div>
                )}

                {customerProfileData.profile.specialRequirements && (
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Special Requirements:</span>
                      <p className="text-sm text-muted-foreground">
                        {customerProfileData.profile.specialRequirements}
                      </p>
                    </div>
                  </div>
                )}

                {customerProfileData.profile.hairType && (
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Hair Type:</span>
                    <span className="text-sm text-muted-foreground">
                      {customerProfileData.profile.hairType}
                    </span>
                  </div>
                )}
              </div>

              {/* Alert Notes */}
              {customerProfileData.alertNotes?.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Alert Notes
                  </h4>
                  <div className="space-y-2">
                    {customerProfileData.alertNotes.map((note: any) => (
                      <div key={note.id} className="bg-orange-50 dark:bg-orange-950 rounded p-2 text-sm">
                        {note.title && <p className="font-medium">{note.title}</p>}
                        <p className="text-muted-foreground">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIP Status */}
              {customerProfileData.profile.isVip === 1 && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <Badge className="bg-yellow-500 text-white">VIP Customer</Badge>
                  {customerProfileData.profile.vipNotes && (
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      {customerProfileData.profile.vipNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No profile found for this customer.</p>
              <p className="text-sm mt-2">They haven't been added to your client database yet.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}