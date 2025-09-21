import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmountPaisa: number;
  currency: string;
  notes?: string;
  serviceName?: string;
  staffName?: string;
}

interface BookingCalendarViewProps {
  salonId: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
};

const statusIcons = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  cancelled: XCircle,
  completed: CheckCircle
};

export default function BookingCalendarView({ salonId }: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'month') {
      // For month view, get the full month plus leading/trailing days to fill weeks
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
      const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return { rangeStart, rangeEnd };
    } else {
      // For week view, get the current week
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return { rangeStart: weekStart, rangeEnd: weekEnd };
    }
  };
  
  const { rangeStart, rangeEnd } = getDateRange();
  const startDate = format(rangeStart, 'yyyy-MM-dd');
  const endDate = format(rangeEnd, 'yyyy-MM-dd');

  // Fetch bookings for the current period
  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/salons', salonId, 'bookings', startDate, endDate, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });
      
      const response = await fetch(`/api/salons/${salonId}/bookings?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      return response.json() as Promise<Booking[]>;
    },
    enabled: !!salonId
  });

  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/salons/${salonId}/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        refetch();
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  // Navigation functions
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else {
      setCurrentDate(prev => addDays(prev, -7));
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 7));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.bookingDate === dateStr)
                  .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
  };

  // Generate days for the current view
  const days = eachDayOfInterval({
    start: rangeStart,
    end: rangeEnd
  });

  const formatCurrency = (amountPaisa: number, currency: string) => {
    return `${currency === 'INR' ? '₹' : currency}${(amountPaisa / 100).toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-calendar-title">
            <Calendar className="h-6 w-6" />
            Booking Calendar
          </h2>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevious} data-testid="button-previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToNext} data-testid="button-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} data-testid="button-today">
              Today
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="week" data-testid="tab-week">Week</TabsTrigger>
              <TabsTrigger value="month" data-testid="tab-month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Current Period Display */}
      <div className="text-center">
        <h3 className="text-lg font-medium" data-testid="text-current-period">
          {viewMode === 'month' 
            ? format(currentDate, 'MMMM yyyy')
            : `${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')}`
          }
        </h3>
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 gap-4 ${viewMode === 'month' ? 'grid-rows-6' : ''}`}>
        {/* Day Headers */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {/* Day Cells */}
        {days.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = viewMode === 'month' ? day.getMonth() === currentDate.getMonth() : true;

          return (
            <Card key={day.toISOString()} className={`min-h-32 ${isToday ? 'ring-2 ring-primary' : ''} ${!isCurrentMonth && viewMode === 'month' ? 'opacity-40 bg-muted/20' : ''}`}>
              <CardHeader className="p-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-primary' : 
                    (!isCurrentMonth && viewMode === 'month') ? 'text-muted-foreground' : ''
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayBookings.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {dayBookings.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {dayBookings.slice(0, 3).map((booking) => {
                  const StatusIcon = statusIcons[booking.status];
                  return (
                    <div
                      key={booking.id}
                      className={`p-2 rounded-sm cursor-pointer hover:opacity-80 ${statusColors[booking.status]}`}
                      onClick={() => setSelectedBooking(booking)}
                      data-testid={`booking-item-${booking.id}`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <StatusIcon className="h-3 w-3" />
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">{booking.bookingTime}</span>
                      </div>
                      <div className="text-xs truncate">{booking.customerName}</div>
                      <div className="text-xs truncate">{booking.serviceName || 'Service'}</div>
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayBookings.length - 3} more
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Booking Details Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Booking Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={statusColors[selectedBooking.status]}>
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">#{selectedBooking.id.slice(0, 8)}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedBooking.customerName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedBooking.customerEmail}</span>
                </div>
                
                {selectedBooking.customerPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedBooking.customerPhone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(parseISO(selectedBooking.bookingDate), 'MMM d, yyyy')} at {selectedBooking.bookingTime}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(selectedBooking.totalAmountPaisa, selectedBooking.currency)}
                  </span>
                </div>

                {selectedBooking.notes && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground">Notes:</p>
                    <p className="text-sm">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                <div className="border-t pt-4 space-y-2">
                  <p className="text-sm font-medium">Update Status:</p>
                  <div className="flex gap-2">
                    {selectedBooking.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                        data-testid="button-confirm-booking"
                      >
                        Confirm
                      </Button>
                    )}
                    
                    {selectedBooking.status === 'confirmed' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                        data-testid="button-complete-booking"
                      >
                        Mark Complete
                      </Button>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                      data-testid="button-cancel-booking"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}