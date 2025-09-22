import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Eye,
  Move,
  GripVertical
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
  staffId?: string;
  serviceDuration?: number; // Duration in minutes from service data
}

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  isActive: number;
}

interface TimeSlot {
  id: string;
  time: string;
  display: string;
  hour: number;
  minute: number;
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
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [bookingToMove, setBookingToMove] = useState<Booking | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState<string>('');
  const { toast } = useToast();

  // Helper functions for time-to-grid calculations
  const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const timeToGridRow = (timeStr: string, startHour = 9): number => {
    const timeMinutes = parseTimeToMinutes(timeStr);
    const startMinutes = startHour * 60;
    const slotIndex = Math.floor((timeMinutes - startMinutes) / 30);
    return Math.max(0, slotIndex); // Ensure non-negative
  };

  const durationToRowSpan = (durationMinutes: number): number => {
    // Each time slot is 30 minutes, so calculate how many slots to span
    return Math.ceil(durationMinutes / 30);
  };

  const getDefaultDuration = (serviceName?: string): number => {
    // Default durations based on service type
    if (!serviceName) return 60; // 1 hour default
    
    const serviceLower = serviceName.toLowerCase();
    if (serviceLower.includes('cut') || serviceLower.includes('trim')) return 45;
    if (serviceLower.includes('color') || serviceLower.includes('dye')) return 90;
    if (serviceLower.includes('massage')) return 60;
    if (serviceLower.includes('facial')) return 75;
    if (serviceLower.includes('manicure')) return 45;
    if (serviceLower.includes('pedicure')) return 60;
    if (serviceLower.includes('highlights')) return 120;
    
    return 60; // Default 1 hour
  };

  const getBookingDuration = (booking: Booking): number => {
    return booking.serviceDuration || getDefaultDuration(booking.serviceName);
  };

  const isTimeInBusinessHours = (timeStr: string, startHour = 9, endHour = 18): boolean => {
    const timeMinutes = parseTimeToMinutes(timeStr);
    return timeMinutes >= startHour * 60 && timeMinutes < endHour * 60;
  };

  // Helper function to detect overlapping bookings
  const detectOverlaps = (bookings: Booking[], targetBooking: Booking): Booking[] => {
    if (!targetBooking.staffId) return [];
    
    const targetStart = parseTimeToMinutes(targetBooking.bookingTime);
    const targetDuration = getBookingDuration(targetBooking);
    const targetEnd = targetStart + targetDuration;
    
    return bookings.filter(booking => {
      if (booking.id === targetBooking.id || booking.staffId !== targetBooking.staffId) return false;
      if (booking.bookingDate !== targetBooking.bookingDate) return false;
      
      const bookingStart = parseTimeToMinutes(booking.bookingTime);
      const bookingDuration = getBookingDuration(booking);
      const bookingEnd = bookingStart + bookingDuration;
      
      // Check if there's any overlap
      return !(targetEnd <= bookingStart || targetStart >= bookingEnd);
    });
  };

  // Helper function to generate time slots
  const generateTimeSlots = (startHour = 9, endHour = 18, intervalMinutes = 30): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour < 12 ? 'AM' : 'PM';
        const display = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
        
        slots.push({
          id: `${hour}-${minute}`,
          time,
          display,
          hour,
          minute
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'day') {
      // For day view, get just the selected day
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      return { rangeStart: dayStart, rangeEnd: dayEnd };
    } else if (viewMode === 'month') {
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

  // Fetch salon staff data
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'staff'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/staff`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      
      return response.json() as Promise<Staff[]>;
    },
    enabled: !!salonId
  });

  // Filter active staff members and add unassigned column
  const activeStaff = staff.filter(member => member.isActive === 1);
  
  // Check if there are any unassigned bookings
  const hasUnassignedBookings = bookings.some(booking => 
    booking.bookingDate >= startDate && booking.bookingDate <= endDate && !booking.staffId
  );
  
  // Create extended staff list with unassigned column if needed
  const extendedStaff = hasUnassignedBookings ? [
    ...activeStaff,
    { id: 'unassigned', name: 'Unassigned', specialties: [], isActive: 1 }
  ] : activeStaff;

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

  // Reschedule booking mutation
  const rescheduleBookingMutation = useMutation({
    mutationFn: async ({ bookingId, bookingDate, bookingTime }: { 
      bookingId: string; 
      bookingDate: string; 
      bookingTime: string;
    }) => {
      const response = await fetch(`/api/salons/${salonId}/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookingDate, 
          bookingTime 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to reschedule booking');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Rescheduled",
        description: "The appointment has been moved successfully.",
      });
      // Invalidate and refetch bookings
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Reschedule Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Navigation functions
  const goToPrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    } else if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, -1));
    } else {
      setCurrentDate(prev => addDays(prev, -7));
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 7));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    
    // Provide user feedback that we've navigated to today
    const todayStr = format(today, 'MMMM d, yyyy');
    toast({
      title: "Navigated to Today",
      description: `Showing calendar for ${todayStr}`,
      duration: 2000,
    });
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.bookingDate === dateStr)
                  .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
  };

  // Get bookings for a specific date and time slot
  const getBookingsForTimeSlot = (date: Date, timeSlot: TimeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => {
      return booking.bookingDate === dateStr && booking.bookingTime === timeSlot.time;
    });
  };

  // Get booking for specific staff and time slot
  const getBookingForStaffTimeSlot = (date: Date, timeSlot: TimeSlot, staffId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.find(booking => {
      return booking.bookingDate === dateStr && 
             booking.bookingTime === timeSlot.time && 
             booking.staffId === staffId;
    });
  };

  // Get all bookings for a specific staff member on a date
  const getStaffBookingsForDate = (date: Date, staffId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => {
      return booking.bookingDate === dateStr && 
             (booking.staffId === staffId || (!booking.staffId && staffId === 'unassigned'));
    }).sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
  };

  // Check if a time slot is occupied by a booking (considering duration)
  const isTimeSlotOccupied = (timeSlot: TimeSlot, staffId: string, date: Date): Booking | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotMinutes = parseTimeToMinutes(timeSlot.time);
    
    for (const booking of bookings) {
      if (booking.bookingDate !== dateStr) continue;
      if (booking.staffId !== staffId && !(staffId === 'unassigned' && !booking.staffId)) continue;
      
      const bookingStart = parseTimeToMinutes(booking.bookingTime);
      const bookingDuration = getBookingDuration(booking);
      const bookingEnd = bookingStart + bookingDuration;
      
      // Check if this time slot falls within the booking duration
      if (slotMinutes >= bookingStart && slotMinutes < bookingEnd) {
        return booking;
      }
    }
    return null;
  };

  // Get the primary booking that starts at this time slot
  const getPrimaryBookingAtTimeSlot = (timeSlot: TimeSlot, staffId: string, date: Date): Booking | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.find(booking => {
      return booking.bookingDate === dateStr && 
             booking.bookingTime === timeSlot.time && 
             (booking.staffId === staffId || (!booking.staffId && staffId === 'unassigned'));
    }) || null;
  };

  // Generate days for the current view
  const days = eachDayOfInterval({
    start: rangeStart,
    end: rangeEnd
  });

  // Calculate statistics for the current view
  const viewStats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    conflicts: bookings.reduce((count, booking) => {
      const overlaps = detectOverlaps(bookings, booking);
      return overlaps.length > 0 ? count + 1 : count;
    }, 0) / 2, // Divide by 2 since each conflict is counted twice
    unassignedBookings: bookings.filter(b => !b.staffId).length
  };

  const formatCurrency = (amountPaisa: number, currency: string) => {
    return `${currency === 'INR' ? '₹' : currency}${(amountPaisa / 100).toFixed(0)}`;
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    // Only allow dragging of pending/confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      e.preventDefault();
      return;
    }

    setDraggedBooking(booking);
    e.dataTransfer.setData('text/plain', booking.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a drag image with booking info
    const dragElement = e.currentTarget as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    e.dataTransfer.setDragImage(dragElement, rect.width / 2, rect.height / 2);
  };

  const handleDragEnd = () => {
    setDraggedBooking(null);
    setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, targetDate: Date) => {
    if (!draggedBooking) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    setDragOverDate(targetDateStr);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the drop zone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    
    if (!draggedBooking) return;

    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const currentDateStr = draggedBooking.bookingDate;
    
    // Don't do anything if dropped on the same date
    if (targetDateStr === currentDateStr) {
      setDraggedBooking(null);
      setDragOverDate(null);
      return;
    }

    // Prevent dropping on past dates
    const today = format(new Date(), 'yyyy-MM-dd');
    if (targetDateStr < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot reschedule appointments to past dates.",
        variant: "destructive",
      });
      setDraggedBooking(null);
      setDragOverDate(null);
      return;
    }

    // Reschedule the booking to the new date (keep same time initially)
    rescheduleBookingMutation.mutate({
      bookingId: draggedBooking.id,
      bookingDate: targetDateStr,
      bookingTime: draggedBooking.bookingTime
    });

    setDraggedBooking(null);
    setDragOverDate(null);
  };

  // Keyboard accessibility - Move booking function
  const handleMoveBooking = (booking: Booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) {
      toast({
        title: "Cannot Move Booking",
        description: `${booking.status} bookings cannot be rescheduled.`,
        variant: "destructive",
      });
      return;
    }

    setBookingToMove(booking);
    setMoveTargetDate(booking.bookingDate);
    setShowMoveDialog(true);
  };

  const confirmMoveBooking = () => {
    if (!bookingToMove || !moveTargetDate) return;

    // Don't do anything if target date is the same
    if (moveTargetDate === bookingToMove.bookingDate) {
      setShowMoveDialog(false);
      setBookingToMove(null);
      return;
    }

    // Prevent moving to past dates
    const today = format(new Date(), 'yyyy-MM-dd');
    if (moveTargetDate < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot reschedule appointments to past dates.",
        variant: "destructive",
      });
      return;
    }

    // Reschedule the booking
    rescheduleBookingMutation.mutate({
      bookingId: bookingToMove.id,
      bookingDate: moveTargetDate,
      bookingTime: bookingToMove.bookingTime
    });

    setShowMoveDialog(false);
    setBookingToMove(null);
    setSelectedBooking(null);
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
          
          {/* Accessibility Help */}
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded hidden md:block">
            💡 Tip: Use Tab to navigate, Enter to view details, Space to move appointments
          </div>
          
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

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'day' | 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="day" data-testid="tab-day">Day</TabsTrigger>
              <TabsTrigger value="week" data-testid="tab-week">Week</TabsTrigger>
              <TabsTrigger value="month" data-testid="tab-month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Current Period Display */}
      <div className="text-center">
        <h3 className="text-lg font-medium" data-testid="text-current-period">
          {viewMode === 'day'
            ? format(currentDate, 'EEEE, MMMM d, yyyy')
            : viewMode === 'month' 
            ? format(currentDate, 'MMMM yyyy')
            : `${format(rangeStart, 'MMM d')} - ${format(rangeEnd, 'MMM d, yyyy')}`
          }
        </h3>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'day' ? (
        /* Day View - Timeline Grid Layout */
        <div className="space-y-4" data-testid="day-view-container">
          {/* Timeline Header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold" data-testid="text-day-title">
                    {format(currentDate, 'EEEE, MMMM d')}
                  </h4>
                  <Badge variant="secondary" data-testid="badge-day-count">
                    {getBookingsForDate(currentDate).length} appointments
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{staffLoading ? 'Loading staff...' : `${extendedStaff.length} ${extendedStaff.length === 1 ? 'column' : 'columns'}`}</span>
                  {viewStats.totalBookings > 0 && (
                    <>
                      <span className="text-blue-600 dark:text-blue-400">{viewStats.confirmedBookings} confirmed</span>
                      {viewStats.pendingBookings > 0 && (
                        <span className="text-yellow-600 dark:text-yellow-400">{viewStats.pendingBookings} pending</span>
                      )}
                      {viewStats.conflicts > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-medium">{viewStats.conflicts} conflicts!</span>
                      )}
                      {viewStats.unassignedBookings > 0 && (
                        <span className="text-orange-600 dark:text-orange-400">{viewStats.unassignedBookings} unassigned</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Timeline Grid */}
          {staffLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-lg">Loading timeline...</div>
              </CardContent>
            </Card>
          ) : activeStaff.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No active staff members found</p>
                <p className="text-sm text-muted-foreground mt-2">Add staff members to see the timeline view</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto" data-testid="timeline-grid-container">
                <div 
                  className="min-w-fit relative"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `100px repeat(${extendedStaff.length}, minmax(200px, 1fr))`,
                    gridTemplateRows: `auto repeat(${timeSlots.length}, 64px)`, // 64px per time slot
                    minWidth: `${100 + extendedStaff.length * 200}px`
                  }}
                >
                  {/* Header Row */}
                  <div className="sticky top-0 z-20 bg-background border-b border-border p-3 flex items-center justify-center font-medium text-sm">
                    Time
                  </div>
                  {extendedStaff.map((staffMember) => (
                    <div 
                      key={staffMember.id}
                      className={`sticky top-0 z-20 bg-background border-b border-l border-border p-3 text-center ${
                        staffMember.id === 'unassigned' ? 'bg-orange-50 dark:bg-orange-950' : ''
                      }`}
                      data-testid={`staff-header-${staffMember.id}`}
                    >
                      <div className={`font-medium ${
                        staffMember.id === 'unassigned' ? 'text-orange-700 dark:text-orange-300' : ''
                      }`}>
                        {staffMember.name}
                        {staffMember.id === 'unassigned' && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">No staff assigned</div>
                        )}
                      </div>
                      {staffMember.specialties && staffMember.specialties.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {staffMember.specialties.slice(0, 2).join(', ')}
                          {staffMember.specialties.length > 2 && '...'}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Time Slots - Left Column */}
                  {timeSlots.map((timeSlot, timeIndex) => {
                    const isEvenRow = timeIndex % 2 === 0;
                    
                    return (
                      <div
                        key={`time-${timeSlot.id}`}
                        className={`border-b border-border p-3 flex items-center justify-center text-sm font-medium sticky left-0 z-10 ${
                          isEvenRow ? 'bg-muted/30' : 'bg-background'
                        }`}
                        style={{ gridRow: timeIndex + 2 }} // +2 to account for header row
                        data-testid={`time-slot-${timeSlot.id}`}
                      >
                        {timeSlot.display}
                      </div>
                    );
                  })}

                  {/* Staff Column Background Cells */}
                  {extendedStaff.map((staffMember) => (
                    timeSlots.map((timeSlot, timeIndex) => {
                      const isEvenRow = timeIndex % 2 === 0;
                      
                      return (
                        <div
                          key={`bg-cell-${timeSlot.id}-${staffMember.id}`}
                          className={`border-b border-l border-border relative ${
                            isEvenRow ? 'bg-muted/30' : 'bg-background'
                          } ${staffMember.id === 'unassigned' ? 'bg-orange-50/50 dark:bg-orange-950/30' : ''} hover:bg-muted/50 transition-colors duration-200`}
                          style={{ 
                            gridColumn: extendedStaff.findIndex(s => s.id === staffMember.id) + 2, // +2 for time column
                            gridRow: timeIndex + 2 // +2 for header row
                          }}
                          data-testid={`bg-cell-${timeSlot.id}-${staffMember.id}`}
                        >
                          <div className="absolute inset-1 flex items-center justify-center text-xs text-muted-foreground/20">
                            Available
                          </div>
                        </div>
                      );
                    })
                  )).flat()}

                  {/* Positioned Bookings */}
                  {extendedStaff.map((staffMember) => {
                    const staffBookings = getStaffBookingsForDate(currentDate, staffMember.id);
                    const processedBookings = new Set<string>();
                    
                    return staffBookings.map((booking) => {
                      if (processedBookings.has(booking.id)) return null;
                      processedBookings.add(booking.id);
                      
                      const bookingDuration = getBookingDuration(booking);
                      const startRowIndex = timeToGridRow(booking.bookingTime);
                      const rowSpan = durationToRowSpan(bookingDuration);
                      const overlaps = detectOverlaps(bookings, booking);
                      const hasConflicts = overlaps.length > 0;
                      
                      const StatusIcon = statusIcons[booking.status];
                      const isDraggable = ['pending', 'confirmed'].includes(booking.status);
                      const isBeingDragged = draggedBooking?.id === booking.id;
                      
                      // Skip if booking is outside business hours
                      if (startRowIndex < 0 || startRowIndex >= timeSlots.length) {
                        return null;
                      }
                      
                      const actualRowSpan = Math.min(rowSpan, timeSlots.length - startRowIndex);
                      
                      return (
                        <div
                          key={`booking-${booking.id}`}
                          draggable={isDraggable}
                          tabIndex={0}
                          role="button"
                          aria-label={`${booking.customerName}'s appointment at ${booking.bookingTime} with ${staffMember.name} for ${bookingDuration} minutes${isDraggable ? '. Press Enter to view details or Space to move appointment' : '. Press Enter to view details'}${hasConflicts ? '. Warning: scheduling conflict detected' : ''}`}
                          className={`absolute p-2 rounded-lg cursor-pointer hover:opacity-90 focus:ring-2 focus:ring-primary focus:ring-offset-1 shadow-sm border-l-4 ${
                            statusColors[booking.status]
                          } ${
                            isBeingDragged ? 'opacity-50 scale-95 shadow-xl z-50' : 'z-30'
                          } ${
                            isDraggable ? 'cursor-move hover:shadow-md' : ''
                          } ${
                            hasConflicts ? 'border-l-red-500 ring-2 ring-red-200 dark:ring-red-800' : 'border-l-primary'
                          } transition-all duration-200`}
                          style={{
                            gridColumn: extendedStaff.findIndex(s => s.id === staffMember.id) + 2,
                            gridRow: `${startRowIndex + 2} / span ${actualRowSpan}`,
                            margin: '2px',
                            minHeight: `${actualRowSpan * 64 - 4}px`, // 64px per row minus margin
                          }}
                          onClick={() => setSelectedBooking(booking)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setSelectedBooking(booking);
                            } else if (e.key === ' ' && isDraggable) {
                              e.preventDefault();
                              handleMoveBooking(booking);
                            }
                          }}
                          onDragStart={(e) => handleDragStart(e, booking)}
                          onDragEnd={handleDragEnd}
                          data-testid={`timeline-booking-${booking.id}`}
                          title={`${booking.customerName} - ${booking.serviceName || 'Service'} (${bookingDuration}min)${hasConflicts ? ' - CONFLICT!' : ''}${isDraggable ? ' - Drag to reschedule' : ' - Cannot be moved'}`}
                        >
                          {/* Booking Header */}
                          <div className="flex items-center gap-1 mb-2">
                            {hasConflicts && (
                              <div title="Scheduling conflict detected">
                                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                              </div>
                            )}
                            {StatusIcon && <StatusIcon className="h-3 w-3 flex-shrink-0" />}
                            {isDraggable && <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                            <span className="text-xs font-semibold truncate flex-1">
                              {booking.customerName}
                            </span>
                          </div>
                          
                          {/* Booking Details */}
                          <div className="space-y-1">
                            <div className="text-xs truncate font-medium">
                              {booking.serviceName || 'Service'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {booking.bookingTime} ({bookingDuration}min)
                            </div>
                            <div className="text-xs font-medium">
                              {formatCurrency(booking.totalAmountPaisa, booking.currency)}
                            </div>
                            {booking.notes && (
                              <div className="text-xs text-muted-foreground truncate" title={booking.notes}>
                                📝 {booking.notes}
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          {isDraggable && (
                            <div className="absolute top-1 right-1 flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-background/50 opacity-70 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveBooking(booking);
                                }}
                                aria-label={`Move ${booking.customerName}'s appointment`}
                                data-testid={`button-timeline-move-${booking.id}`}
                              >
                                <Move className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    }).filter(Boolean);
                  }).flat()}
                </div>
              </div>
            </Card>
          )}

          {/* Timeline Legend */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700"></div>
                    <span>Confirmed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700"></div>
                    <span>Cancelled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>Conflict</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300 dark:bg-orange-900 dark:border-orange-700"></div>
                    <span>Unassigned</span>
                  </div>
                </div>
                <div className="hidden lg:block text-right">
                  💡 Timeline shows exact appointment durations<br/>
                  <span className="text-xs">Click for details • Drag confirmed/pending to reschedule</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Week/Month View - Grid Layout */
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
            const dayStr = format(day, 'yyyy-MM-dd');
            const isDragOver = dragOverDate === dayStr;
            const isPastDate = dayStr < format(new Date(), 'yyyy-MM-dd');

            return (
              <Card 
                key={day.toISOString()} 
                className={`min-h-32 transition-all duration-200 ${
                  isToday ? 'ring-2 ring-primary' : ''
                } ${
                  !isCurrentMonth && viewMode === 'month' ? 'opacity-40 bg-muted/20' : ''
                } ${
                  isDragOver && draggedBooking ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950' : ''
                } ${
                  draggedBooking && !isPastDate ? 'hover:ring-1 hover:ring-blue-300' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                data-testid={`day-cell-${dayStr}`}
              >
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
                    const isDraggable = ['pending', 'confirmed'].includes(booking.status);
                    const isBeingDragged = draggedBooking?.id === booking.id;
                    
                    return (
                      <div
                        key={booking.id}
                        draggable={isDraggable}
                        tabIndex={0}
                        role="button"
                        aria-label={`${booking.customerName}'s appointment at ${booking.bookingTime}${isDraggable ? '. Press Enter to view details or Space to move appointment' : '. Press Enter to view details'}`}
                        className={`p-2 rounded-sm cursor-pointer hover:opacity-80 focus:ring-2 focus:ring-primary focus:ring-offset-1 ${statusColors[booking.status]} ${
                          isBeingDragged ? 'opacity-50 scale-95 shadow-lg' : ''
                        } ${isDraggable ? 'cursor-move' : ''} transition-all duration-200`}
                        onClick={() => setSelectedBooking(booking)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setSelectedBooking(booking);
                          } else if (e.key === ' ' && isDraggable) {
                            e.preventDefault();
                            handleMoveBooking(booking);
                          }
                        }}
                        onDragStart={(e) => handleDragStart(e, booking)}
                        onDragEnd={handleDragEnd}
                        data-testid={`booking-item-${booking.id}`}
                        title={isDraggable ? `Drag to reschedule ${booking.customerName}'s appointment` : `${booking.status} booking - cannot be moved`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs">
                            <StatusIcon className="h-3 w-3" />
                            {isDraggable && <GripVertical className="h-3 w-3 text-muted-foreground" />}
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">{booking.bookingTime}</span>
                          </div>
                          {isDraggable && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 hover:bg-background/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBooking(booking);
                              }}
                              aria-label={`Move ${booking.customerName}'s appointment`}
                              data-testid={`button-move-${booking.id}`}
                            >
                              <Move className="h-3 w-3" />
                            </Button>
                          )}
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
      )}

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
                <div className="border-t pt-4 space-y-3">
                  {/* Move/Reschedule Action */}
                  {['pending', 'confirmed'].includes(selectedBooking.status) && (
                    <div>
                      <p className="text-sm font-medium mb-2">Reschedule Appointment:</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMoveBooking(selectedBooking)}
                        data-testid="button-move-booking"
                        className="flex items-center gap-2"
                      >
                        <Move className="h-4 w-4" />
                        Move to Different Date
                      </Button>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Update Status:</p>
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
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Move Booking Dialog - Accessibility Support */}
      <Dialog open={showMoveDialog} onOpenChange={() => setShowMoveDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Move className="h-5 w-5" />
              Move Appointment
            </DialogTitle>
          </DialogHeader>
          
          {bookingToMove && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">{bookingToMove.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(bookingToMove.bookingDate), 'MMM d, yyyy')} at {bookingToMove.bookingTime}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="move-date" className="text-sm font-medium">
                  Select new date:
                </label>
                <input
                  id="move-date"
                  type="date"
                  value={moveTargetDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setMoveTargetDate(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-background"
                  data-testid="input-move-date"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Note: The appointment time ({bookingToMove.bookingTime}) will remain the same. 
                You can adjust the time after moving if needed.
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMoveDialog(false)}
                  data-testid="button-cancel-move"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmMoveBooking}
                  disabled={rescheduleBookingMutation.isPending}
                  data-testid="button-confirm-move"
                >
                  {rescheduleBookingMutation.isPending ? 'Moving...' : 'Move Appointment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}