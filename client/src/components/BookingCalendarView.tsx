import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  serviceDuration?: number;
  jobCardId?: string | null;
  jobCardStatus?: 'open' | 'in_service' | 'pending_checkout' | 'completed' | 'cancelled' | 'no_show' | null;
}

type DisplayStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'arrived' 
  | 'in_service' 
  | 'pending_checkout' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

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
  defaultViewMode?: 'day' | 'week' | 'month';
}

const statusColors: Record<DisplayStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
  arrived: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  in_service: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending_checkout: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
};

const statusIcons: Record<DisplayStatus, typeof CheckCircle> = {
  pending: AlertCircle,
  confirmed: CheckCircle,
  arrived: Clock,
  in_service: User,
  pending_checkout: Clock,
  completed: CheckCircle,
  cancelled: XCircle,
  no_show: XCircle
};

const statusLabels: Record<DisplayStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  arrived: "Arrived",
  in_service: "In Service",
  pending_checkout: "Checkout",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show"
};

const getDisplayStatus = (booking: Booking): DisplayStatus => {
  if (booking.jobCardStatus) {
    if (booking.jobCardStatus === 'open') return 'arrived';
    if (booking.jobCardStatus === 'in_service') return 'in_service';
    if (booking.jobCardStatus === 'pending_checkout') return 'pending_checkout';
    if (booking.jobCardStatus === 'completed') return 'completed';
    if (booking.jobCardStatus === 'cancelled') return 'cancelled';
    if (booking.jobCardStatus === 'no_show') return 'no_show';
  }
  return booking.status as DisplayStatus;
};

export default function BookingCalendarView({ salonId, defaultViewMode = 'week' }: BookingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>(defaultViewMode);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [bookingToMove, setBookingToMove] = useState<Booking | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState<string>('');
  
  // Timeline-specific drag state
  const [timelineDragState, setTimelineDragState] = useState<{
    isDragging: boolean;
    dragOverTimeSlot: string | null;
    dragOverStaffId: string | null;
    validDropZone: boolean;
    conflicts: Booking[];
    dragPreview: { time: string; staffId: string } | null;
  }>({ 
    isDragging: false, 
    dragOverTimeSlot: null, 
    dragOverStaffId: null, 
    validDropZone: false, 
    conflicts: [], 
    dragPreview: null 
  });

  // Performance optimization: throttle drag over operations
  const dragThrottleRef = useRef<number | null>(null);
  const lastDragPositionRef = useRef<{ timeSlot: string | null; staffId: string | null }>({ 
    timeSlot: null, 
    staffId: null 
  });
  const { toast } = useToast();

  // Helper functions for time-to-grid calculations
  const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const timeToGridRow = (timeStr: string, startHour = businessStartHour): number => {
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

  // Fetch salon business hours (with fallback to default 9-18)
  const { data: salonSettings } = useQuery({
    queryKey: ['/api/salons', salonId, 'settings'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/settings`);
      if (!response.ok) {
        // Fallback to default business hours if API fails
        return { businessStartHour: 9, businessEndHour: 18 };
      }
      return response.json();
    },
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  const businessStartHour = salonSettings?.businessStartHour || 9;
  const businessEndHour = salonSettings?.businessEndHour || 18;

  const isTimeInBusinessHours = (timeStr: string, durationMinutes?: number): boolean => {
    const timeMinutes = parseTimeToMinutes(timeStr);
    const startValid = timeMinutes >= businessStartHour * 60;
    
    if (!durationMinutes) {
      // If no duration provided, only check start time (backwards compatibility)
      return startValid && timeMinutes < businessEndHour * 60;
    }
    
    // Check both start and end times are within business hours
    const endTimeMinutes = timeMinutes + durationMinutes;
    const endValid = endTimeMinutes <= businessEndHour * 60;
    
    return startValid && endValid;
  };

  // Optimized overlap detection with binary search for better performance
  const detectOverlaps = useCallback((bookings: Booking[], targetBooking: Booking, staffBookingsMapRef?: Map<string, Booking[]>): Booking[] => {
    if (!targetBooking.staffId) return [];
    
    // Use memoized staffBookingsMap for O(1) lookup when available
    let relevantBookings: Booking[];
    
    if (staffBookingsMapRef && staffBookingsMapRef.has(targetBooking.staffId)) {
      // Get bookings from memoized map and filter by date and exclude self
      relevantBookings = staffBookingsMapRef.get(targetBooking.staffId)!.filter(booking => 
        booking.id !== targetBooking.id && 
        booking.bookingDate === targetBooking.bookingDate
      );
    } else {
      // Fallback to traditional filtering if map not available
      relevantBookings = bookings.filter(booking => 
        booking.id !== targetBooking.id && 
        booking.staffId === targetBooking.staffId && 
        booking.bookingDate === targetBooking.bookingDate
      );
    }
    
    if (relevantBookings.length === 0) return [];
    
    const targetStart = parseTimeToMinutes(targetBooking.bookingTime);
    const targetDuration = getBookingDuration(targetBooking);
    const targetEnd = targetStart + targetDuration;
    
    // Sort by start time for binary search optimization
    const sortedBookings = relevantBookings.sort((a, b) => 
      parseTimeToMinutes(a.bookingTime) - parseTimeToMinutes(b.bookingTime)
    );
    
    return sortedBookings.filter(booking => {
      const bookingStart = parseTimeToMinutes(booking.bookingTime);
      const bookingDuration = getBookingDuration(booking);
      const bookingEnd = bookingStart + bookingDuration;
      
      // Check if there's any overlap
      return !(targetEnd <= bookingStart || targetStart >= bookingEnd);
    });
  }, []);

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
  
  // Helper function to check if a time slot can accommodate a service duration
  const canTimeSlotAccommodateService = (timeSlot: string, durationMinutes: number): boolean => {
    return isTimeInBusinessHours(timeSlot, durationMinutes);
  };
  
  // Filter time slots that can accommodate a specific service duration
  const getValidTimeSlotsForDuration = (durationMinutes: number): TimeSlot[] => {
    return timeSlots.filter(slot => canTimeSlotAccommodateService(slot.time, durationMinutes));
  };

  const timeSlots = generateTimeSlots(businessStartHour, businessEndHour);

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

  // Memoized staff calculations for better performance
  const { activeStaff, extendedStaff, staffBookingsMap } = useMemo(() => {
    const active = staff.filter(member => member.isActive === 1);
    
    // Check if there are any unassigned bookings
    const hasUnassigned = bookings.some(booking => 
      booking.bookingDate >= startDate && booking.bookingDate <= endDate && !booking.staffId
    );
    
    // Create extended staff list with unassigned column if needed
    const extended = hasUnassigned ? [
      ...active,
      { id: 'unassigned', name: 'Unassigned', specialties: [], isActive: 1 }
    ] : active;
    
    // Create staff-to-bookings map for O(1) lookups
    const staffMap = new Map<string, Booking[]>();
    extended.forEach(staffMember => {
      const staffBookings = bookings.filter(booking => 
        booking.staffId === staffMember.id || 
        (!booking.staffId && staffMember.id === 'unassigned')
      );
      staffMap.set(staffMember.id, staffBookings);
    });
    
    return {
      activeStaff: active,
      extendedStaff: extended,
      staffBookingsMap: staffMap
    };
  }, [staff, bookings, startDate, endDate]);

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

  // Reschedule booking mutation with staff assignment support
  const rescheduleBookingMutation = useMutation({
    mutationFn: async ({ bookingId, bookingDate, bookingTime, staffId }: { 
      bookingId: string; 
      bookingDate: string; 
      bookingTime: string;
      staffId?: string;
    }) => {
      const response = await fetch(`/api/salons/${salonId}/bookings/${bookingId}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookingDate, 
          bookingTime,
          ...(staffId !== undefined && { staffId: staffId === 'unassigned' ? null : staffId })
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
      const overlaps = detectOverlaps(bookings, booking, staffBookingsMap);
      return overlaps.length > 0 ? count + 1 : count;
    }, 0) / 2, // Divide by 2 since each conflict is counted twice
    unassignedBookings: bookings.filter(b => !b.staffId).length
  };

  const formatCurrency = (amountPaisa: number, currency: string) => {
    return `${currency === 'INR' ? '₹' : currency}${(amountPaisa / 100).toFixed(0)}`;
  };

  // Helper functions for timeline drag calculations
  const calculateTimeSlotFromPosition = (y: number, containerRect: DOMRect): string | null => {
    const HEADER_HEIGHT = 52; // Height of timeline header
    const ROW_HEIGHT = 64; // Height of each time slot row
    
    const relativeY = y - containerRect.top - HEADER_HEIGHT;
    const slotIndex = Math.floor(relativeY / ROW_HEIGHT);
    
    if (slotIndex >= 0 && slotIndex < timeSlots.length) {
      return timeSlots[slotIndex].time;
    }
    
    return null;
  };
  
  const calculateStaffIdFromPosition = (x: number, containerRect: DOMRect): string | null => {
    // Guard against division by zero when no staff members exist
    if (extendedStaff.length === 0) {
      return null;
    }
    
    const TIME_COLUMN_WIDTH = 100; // Width of time column
    const staffColumnWidth = (containerRect.width - TIME_COLUMN_WIDTH) / extendedStaff.length;
    
    const relativeX = x - containerRect.left - TIME_COLUMN_WIDTH;
    const staffIndex = Math.floor(relativeX / staffColumnWidth);
    
    if (staffIndex >= 0 && staffIndex < extendedStaff.length) {
      return extendedStaff[staffIndex].id;
    }
    
    return null;
  };
  
  const validateTimelineDropZone = (timeSlot: string, staffId: string, draggedBooking: Booking): { valid: boolean; conflicts: Booking[]; reason?: string } => {
    if (!timeSlot || !staffId) {
      return { valid: false, conflicts: [], reason: 'Invalid time slot or staff' };
    }
    
    // Get booking duration for business hours validation
    const bookingDuration = getBookingDuration(draggedBooking);
    
    // Check if appointment (start + duration) fits within business hours
    if (!isTimeInBusinessHours(timeSlot, bookingDuration)) {
      return { valid: false, conflicts: [], reason: 'Appointment would extend past closing hours' };
    }
    
    // Create temporary booking for conflict detection
    const tempBooking: Booking = {
      ...draggedBooking,
      bookingTime: timeSlot,
      staffId: staffId === 'unassigned' ? undefined : staffId
    };
    
    const conflicts = detectOverlaps(bookings, tempBooking, staffBookingsMap);
    
    return {
      valid: conflicts.length === 0,
      conflicts,
      reason: conflicts.length > 0 ? `Conflicts with ${conflicts.length} existing appointment${conflicts.length > 1 ? 's' : ''}` : undefined
    };
  };

  // Enhanced drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, booking: Booking) => {
    // Only allow dragging of pending/confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      e.preventDefault();
      return;
    }

    setDraggedBooking(booking);
    setTimelineDragState(prev => ({ ...prev, isDragging: true }));
    e.dataTransfer.setData('text/plain', booking.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a drag image with booking info
    const dragElement = e.currentTarget as HTMLElement;
    const rect = dragElement.getBoundingClientRect();
    e.dataTransfer.setDragImage(dragElement, rect.width / 2, rect.height / 2);
    
    // Add drag cursor style to body and visual feedback
    document.body.style.cursor = 'grabbing';
    document.body.classList.add('timeline-dragging');
  };

  const handleDragEnd = () => {
    // Clean up throttling to prevent memory leaks
    if (dragThrottleRef.current) {
      cancelAnimationFrame(dragThrottleRef.current);
      dragThrottleRef.current = null;
    }
    lastDragPositionRef.current = { timeSlot: null, staffId: null };
    
    setDraggedBooking(null);
    setDragOverDate(null);
    setTimelineDragState({
      isDragging: false,
      dragOverTimeSlot: null,
      dragOverStaffId: null,
      validDropZone: false,
      conflicts: [],
      dragPreview: null
    });
    
    // Reset cursor and visual feedback
    document.body.style.cursor = '';
    document.body.classList.remove('timeline-dragging');
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

  // Optimized timeline drag handler with throttling and state change detection
  const handleTimelineDragOver = useCallback((e: React.DragEvent, timelineContainer: HTMLElement) => {
    if (!draggedBooking || viewMode !== 'day') return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Cancel any pending throttled update
    if (dragThrottleRef.current) {
      cancelAnimationFrame(dragThrottleRef.current);
    }
    
    // Throttle with requestAnimationFrame for smooth performance
    dragThrottleRef.current = requestAnimationFrame(() => {
      const containerRect = timelineContainer.getBoundingClientRect();
      const timeSlot = calculateTimeSlotFromPosition(e.clientY, containerRect);
      const staffId = calculateStaffIdFromPosition(e.clientX, containerRect);
      
      // Only update state if position actually changed (prevent state churn)
      const lastPosition = lastDragPositionRef.current;
      if (lastPosition.timeSlot === timeSlot && lastPosition.staffId === staffId) {
        return; // No change, skip expensive validation and state update
      }
      
      // Update position tracking
      lastDragPositionRef.current = { timeSlot, staffId };
      
      if (timeSlot && staffId) {
        const { valid, conflicts } = validateTimelineDropZone(timeSlot, staffId, draggedBooking);
        
        setTimelineDragState({
          isDragging: true,
          dragOverTimeSlot: timeSlot,
          dragOverStaffId: staffId,
          validDropZone: valid,
          conflicts,
          dragPreview: { time: timeSlot, staffId }
        });
      } else {
        // Clear drag state if position is invalid
        setTimelineDragState(prev => ({
          ...prev,
          dragOverTimeSlot: null,
          dragOverStaffId: null,
          validDropZone: false,
          conflicts: [],
          dragPreview: null
        }));
      }
    });
  }, [draggedBooking, viewMode]);
  
  const handleTimelineDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Only clear if truly leaving the timeline container
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setTimelineDragState(prev => ({
        ...prev,
        dragOverTimeSlot: null,
        dragOverStaffId: null,
        validDropZone: false,
        conflicts: [],
        dragPreview: null
      }));
    }
  };
  
  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedBooking || !timelineDragState.dragOverTimeSlot || !timelineDragState.dragOverStaffId) {
      handleDragEnd();
      return;
    }
    
    const { dragOverTimeSlot, dragOverStaffId, validDropZone, conflicts } = timelineDragState;
    
    // Check if it's the same position
    const isSameTime = draggedBooking.bookingTime === dragOverTimeSlot;
    const isSameStaff = (draggedBooking.staffId || 'unassigned') === dragOverStaffId;
    
    if (isSameTime && isSameStaff) {
      handleDragEnd();
      return;
    }
    
    // Validate drop zone with enhanced business hours checking
    if (!validDropZone) {
      const dropValidation = validateTimelineDropZone(dragOverTimeSlot, dragOverStaffId, draggedBooking);
      const errorMessage = dropValidation.reason || 'Invalid drop zone';
        
      toast({
        title: "Cannot Move Appointment",
        description: errorMessage,
        variant: "destructive",
      });
      
      handleDragEnd();
      return;
    }
    
    // Prevent dropping on past times
    const currentDateStr = format(currentDate, 'yyyy-MM-dd');
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = new Date();
    const dropDateTime = new Date(`${format(currentDate, 'yyyy-MM-dd')}T${dragOverTimeSlot}:00`);
    
    if (currentDateStr === today && dropDateTime < now) {
      toast({
        title: "Invalid Time",
        description: "Cannot reschedule appointments to past times.",
        variant: "destructive",
      });
      
      handleDragEnd();
      return;
    }
    
    // Execute the reschedule
    const staffIdForApi = dragOverStaffId === 'unassigned' ? undefined : dragOverStaffId;
    
    rescheduleBookingMutation.mutate({
      bookingId: draggedBooking.id,
      bookingDate: format(currentDate, 'yyyy-MM-dd'),
      bookingTime: dragOverTimeSlot,
      staffId: staffIdForApi
    });
    
    handleDragEnd();
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
  
  // Enhanced Accessibility: Keyboard navigation for timeline
  const handleKeyboardMove = (booking: Booking, direction: string) => {
    if (!['pending', 'confirmed'].includes(booking.status)) return;
    
    const currentTimeIndex = timeSlots.findIndex(slot => slot.time === booking.bookingTime);
    const currentStaffIndex = extendedStaff.findIndex(staff => 
      staff.id === (booking.staffId || 'unassigned')
    );
    
    let newTimeIndex = currentTimeIndex;
    let newStaffIndex = currentStaffIndex;
    
    switch (direction) {
      case 'ArrowUp':
        newTimeIndex = Math.max(0, currentTimeIndex - 1);
        break;
      case 'ArrowDown':
        newTimeIndex = Math.min(timeSlots.length - 1, currentTimeIndex + 1);
        break;
      case 'ArrowLeft':
        newStaffIndex = Math.max(0, currentStaffIndex - 1);
        break;
      case 'ArrowRight':
        newStaffIndex = Math.min(extendedStaff.length - 1, currentStaffIndex + 1);
        break;
    }
    
    if (newTimeIndex !== currentTimeIndex || newStaffIndex !== currentStaffIndex) {
      const newTime = timeSlots[newTimeIndex].time;
      const newStaffId = extendedStaff[newStaffIndex].id;
      
      // Validate the move with enhanced business hours checking
      const moveValidation = validateTimelineDropZone(newTime, newStaffId, booking);
      
      if (moveValidation.valid) {
        rescheduleBookingMutation.mutate({
          bookingId: booking.id,
          bookingDate: format(currentDate, 'yyyy-MM-dd'),
          bookingTime: newTime,
          staffId: newStaffId === 'unassigned' ? undefined : newStaffId
        });
        
        // Announce to screen reader
        const announcement = `Moved ${booking.customerName}'s appointment to ${newTime} with ${extendedStaff[newStaffIndex].name}`;
        announceToScreenReader(announcement);
      } else {
        const errorMessage = moveValidation.reason || 'Cannot move to this time slot';
        
        toast({
          title: "Cannot Move Appointment",
          description: errorMessage,
          variant: "destructive",
        });
        
        announceToScreenReader(errorMessage);
      }
    }
  };
  
  // Touch device support
  const [touchState, setTouchState] = useState<{
    isDragging: boolean;
    startPosition: { x: number; y: number } | null;
    currentPosition: { x: number; y: number } | null;
    draggedBooking: Booking | null;
  }>({ isDragging: false, startPosition: null, currentPosition: null, draggedBooking: null });
  
  const handleTouchStart = (e: React.TouchEvent, booking: Booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) return;
    
    const touch = e.touches[0];
    setTouchState({
      isDragging: true,
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY },
      draggedBooking: booking
    });
    
    setDraggedBooking(booking);
    setTimelineDragState(prev => ({ ...prev, isDragging: true }));
    
    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Prevent scrolling during drag
    e.preventDefault();
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.isDragging || !touchState.draggedBooking) return;
    
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      currentPosition: { x: touch.clientX, y: touch.clientY }
    }));
    
    // Find timeline container and calculate drop position
    const timelineContainer = document.querySelector('[data-testid="timeline-grid-container"] > div');
    if (timelineContainer) {
      const containerRect = timelineContainer.getBoundingClientRect();
      const timeSlot = calculateTimeSlotFromPosition(touch.clientY, containerRect);
      const staffId = calculateStaffIdFromPosition(touch.clientX, containerRect);
      
      if (timeSlot && staffId) {
        const { valid, conflicts } = validateTimelineDropZone(timeSlot, staffId, touchState.draggedBooking);
        
        setTimelineDragState({
          isDragging: true,
          dragOverTimeSlot: timeSlot,
          dragOverStaffId: staffId,
          validDropZone: valid,
          conflicts,
          dragPreview: { time: timeSlot, staffId }
        });
      }
    }
    
    // Prevent scrolling during drag
    e.preventDefault();
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchState.isDragging || !touchState.draggedBooking) {
      resetTouchState();
      return;
    }
    
    const { dragOverTimeSlot, dragOverStaffId, validDropZone } = timelineDragState;
    
    if (dragOverTimeSlot && dragOverStaffId && validDropZone) {
      // Haptic feedback for successful drop
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
      
      const staffIdForApi = dragOverStaffId === 'unassigned' ? undefined : dragOverStaffId;
      
      rescheduleBookingMutation.mutate({
        bookingId: touchState.draggedBooking.id,
        bookingDate: format(currentDate, 'yyyy-MM-dd'),
        bookingTime: dragOverTimeSlot,
        staffId: staffIdForApi
      });
    } else if (dragOverTimeSlot && dragOverStaffId && !validDropZone) {
      // Haptic feedback for invalid drop
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      toast({
        title: "Cannot Move Appointment",
        description: "Invalid drop zone or scheduling conflicts detected.",
        variant: "destructive",
      });
    }
    
    resetTouchState();
  };
  
  const resetTouchState = () => {
    setTouchState({ isDragging: false, startPosition: null, currentPosition: null, draggedBooking: null });
    handleDragEnd();
  };
  
  // Safe screen reader announcements with error boundary
  const announceToScreenReader = useCallback((message: string) => {
    try {
      const liveRegion = document.getElementById('drag-feedback-region');
      if (liveRegion) {
        liveRegion.textContent = message;
        // Clear after a delay to allow for new announcements
        setTimeout(() => {
          if (liveRegion && liveRegion.textContent === message) {
            liveRegion.textContent = '';
          }
        }, 1000);
      }
    } catch (error) {
      // Fail silently for accessibility features to prevent breaking the app
      console.warn('Screen reader announcement failed:', error);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom CSS for drag enhancements */}
      <style>{`
        .timeline-dragging {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .timeline-dragging * {
          cursor: grabbing !important;
        }
        
        .booking-drag-preview {
          transform: scale(1.05);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 2px solid hsl(var(--primary));
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }
        
        .drop-zone-valid {
          animation: pulse-green 1s ease-in-out infinite;
        }
        
        .drop-zone-invalid {
          animation: pulse-red 1s ease-in-out infinite;
        }
        
        @keyframes pulse-green {
          0%, 100% { 
            background-color: rgba(34, 197, 94, 0.1); 
            border-color: rgba(34, 197, 94, 0.3);
          }
          50% { 
            background-color: rgba(34, 197, 94, 0.2); 
            border-color: rgba(34, 197, 94, 0.5);
          }
        }
        
        @keyframes pulse-red {
          0%, 100% { 
            background-color: rgba(239, 68, 68, 0.1); 
            border-color: rgba(239, 68, 68, 0.3);
          }
          50% { 
            background-color: rgba(239, 68, 68, 0.2); 
            border-color: rgba(239, 68, 68, 0.5);
          }
        }
        
        .booking-draggable {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .booking-draggable:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .timeline-grid {
          position: relative;
        }
        
        .timeline-grid::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, 
            transparent 100px, 
            rgba(var(--muted), 0.3) 100px, 
            rgba(var(--muted), 0.3) 101px, 
            transparent 101px
          );
          pointer-events: none;
          z-index: 1;
        }

        /* Enhanced responsive design */
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar {
          height: 6px;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        
        .dark .scrollbar-thumb-gray-700::-webkit-scrollbar-thumb {
          background-color: #374151;
        }
        
        /* Mobile-friendly touch targets */
        @media (max-width: 768px) {
          .booking-draggable {
            min-height: 48px; /* WCAG touch target size */
            touch-action: manipulation;
          }
          
          .timeline-grid {
            font-size: 0.875rem; /* Smaller text on mobile */
          }
          
          /* Increase tap target size for mobile */
          .timeline-cell {
            min-height: 56px;
          }
        }
        
        /* High contrast for accessibility */
        @media (prefers-contrast: high) {
          .drop-zone-valid {
            border: 3px solid #22c55e !important;
            background-color: rgba(34, 197, 94, 0.3) !important;
          }
          
          .drop-zone-invalid {
            border: 3px solid #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.3) !important;
          }
        }
        
        .drag-ghost {
          opacity: 0.7;
          transform: rotate(3deg);
          filter: blur(0.5px);
        }
        
        .conflict-indicator {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        
        /* Mobile touch feedback */
        @media (hover: none) {
          .booking-draggable:active {
            transform: scale(1.02);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          }
        }
      `}</style>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-calendar-title">
            <Calendar className="h-6 w-6" />
            Booking Calendar
          </h2>
          
          {/* Enhanced Accessibility Help */}
          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded hidden md:block">
            💡 Tip: Use Tab to navigate, Enter to view details, Space to move appointments, Arrow keys to navigate timeline
          </div>
          
          {/* Screen Reader Live Region for Drag Feedback */}
          <div 
            id="drag-feedback-region" 
            aria-live="polite" 
            aria-atomic="true" 
            className="sr-only"
          >
            {timelineDragState.isDragging && timelineDragState.dragPreview && (
              <span>
                {timelineDragState.validDropZone 
                  ? `Moving appointment to ${timelineDragState.dragPreview.time} with ${extendedStaff.find(s => s.id === timelineDragState.dragPreview?.staffId)?.name || 'unassigned'}. Drop zone is available.`
                  : `Cannot move appointment to ${timelineDragState.dragPreview.time} with ${extendedStaff.find(s => s.id === timelineDragState.dragPreview?.staffId)?.name || 'unassigned'}. ${timelineDragState.conflicts.length > 0 ? `${timelineDragState.conflicts.length} conflict${timelineDragState.conflicts.length > 1 ? 's' : ''} detected.` : 'Invalid drop zone.'}`
                }
              </span>
            )}
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
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700" data-testid="timeline-grid-container">
                <div 
                  className={`min-w-fit relative timeline-grid ${timelineDragState.isDragging ? 'timeline-dragging' : ''}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `100px repeat(${extendedStaff.length}, minmax(160px, 1fr))`, // Reduced min-width for mobile
                    gridTemplateRows: `auto repeat(${timeSlots.length}, 64px)`,
                    minWidth: `${100 + extendedStaff.length * 160}px`, // Better mobile responsiveness
                    maxWidth: '100vw' // Prevent overflow on small screens
                  }}
                  onDragOver={(e) => handleTimelineDragOver(e, e.currentTarget)}
                  onDragLeave={handleTimelineDragLeave}
                  onDrop={handleTimelineDrop}
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
                        className={`border-b border-border p-3 flex items-center justify-center text-sm font-medium sticky left-0 z-10 bg-white dark:bg-gray-900`}
                        style={{ gridRow: timeIndex + 2 }} // +2 to account for header row
                        data-testid={`time-slot-${timeSlot.id}`}
                      >
                        {timeSlot.display}
                      </div>
                    );
                  })}

                  {/* Staff Column Background Cells with Drop Zone Highlighting */}
                  {extendedStaff.map((staffMember) => (
                    timeSlots.map((timeSlot, timeIndex) => {
                      const isEvenRow = timeIndex % 2 === 0;
                      const isDropZone = timelineDragState.isDragging && 
                                        timelineDragState.dragOverTimeSlot === timeSlot.time && 
                                        timelineDragState.dragOverStaffId === staffMember.id;
                      const isValidDropZone = isDropZone && timelineDragState.validDropZone;
                      const isInvalidDropZone = isDropZone && !timelineDragState.validDropZone;
                      
                      // Check if this time slot can accommodate the dragged booking's duration
                      const draggedDuration = draggedBooking ? getBookingDuration(draggedBooking) : 0;
                      const canAccommodateService = !timelineDragState.isDragging || canTimeSlotAccommodateService(timeSlot.time, draggedDuration);
                      const isBusinessHoursInvalid = timelineDragState.isDragging && !canAccommodateService;
                      
                      return (
                        <div
                          key={`bg-cell-${timeSlot.id}-${staffMember.id}`}
                          className={`border-b border-l border-border relative transition-all duration-200 focus-within:ring-2 focus-within:ring-primary bg-white dark:bg-gray-900 ${
                            staffMember.id === 'unassigned' ? 'bg-orange-50/50 dark:bg-orange-950/30' : ''
                          } ${
                            isValidDropZone ? 'bg-green-100 dark:bg-green-900/50 ring-2 ring-green-400 dark:ring-green-600' : ''
                          } ${
                            isInvalidDropZone ? 'bg-red-100 dark:bg-red-900/50 ring-2 ring-red-400 dark:ring-red-600' : ''
                          } ${
                            isBusinessHoursInvalid ? 'bg-gray-200/70 dark:bg-gray-800/70 opacity-60' : ''
                          } ${
                            !isDropZone && !timelineDragState.isDragging ? 'hover:bg-muted/50' : ''
                          }`}
                          style={{ 
                            gridColumn: extendedStaff.findIndex(s => s.id === staffMember.id) + 2, // +2 for time column
                            gridRow: timeIndex + 2, // +2 for header row
                            minHeight: '64px'
                          }}
                          data-testid={`bg-cell-${timeSlot.id}-${staffMember.id}`}
                          role="gridcell"
                          tabIndex={-1}
                          aria-label={`Time slot ${timeSlot.display} for ${staffMember.name === 'Unassigned' ? 'unassigned bookings' : staffMember.name}${isDropZone ? (isValidDropZone ? ' - valid drop zone' : ' - invalid drop zone with conflicts') : ''}${isBusinessHoursInvalid ? ' - service would extend past closing hours' : ''}`}
                        >
                          {/* Enhanced Drop Zone Visual Feedback */}
                          {isDropZone && (
                            <div className={`absolute inset-0 pointer-events-none z-10 ${
                              isValidDropZone 
                                ? 'bg-green-200/40 dark:bg-green-800/40 border-2 border-dashed border-green-400 dark:border-green-600 drop-zone-valid' 
                                : 'bg-red-200/40 dark:bg-red-800/40 border-2 border-dashed border-red-400 dark:border-red-600 drop-zone-invalid'
                            }`}>
                              <div className={`flex items-center justify-center h-full text-xs font-bold ${
                                isValidDropZone 
                                  ? 'text-green-800 dark:text-green-200' 
                                  : 'text-red-800 dark:text-red-200'
                              }`}>
                                <div className="bg-white/90 dark:bg-black/90 px-2 py-1 rounded-full shadow-lg border">
                                  {isValidDropZone ? '✓ Drop here' : '✗ Conflict'}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Enhanced Conflict Warning for Drag Preview */}
                          {timelineDragState.isDragging && isInvalidDropZone && timelineDragState.conflicts.length > 0 && (
                            <div className="absolute top-1 right-1 z-20 conflict-indicator">
                              <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg border-2 border-red-400 font-bold">
                                ⚠ {timelineDragState.conflicts.length} conflict{timelineDragState.conflicts.length > 1 ? 's' : ''}
                              </div>
                            </div>
                          )}
                          
                          {/* Enhanced Available/Unavailable State */}
                          {!isDropZone && (
                            <div className={`absolute inset-1 flex items-center justify-center text-xs ${
                              isBusinessHoursInvalid 
                                ? 'text-gray-500 dark:text-gray-400 font-medium' 
                                : 'text-muted-foreground/20'
                            }`}>
                              {isBusinessHoursInvalid ? 'Service too long' : 'Available'}
                            </div>
                          )}
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
                      const overlaps = detectOverlaps(bookings, booking, staffBookingsMap);
                      const hasConflicts = overlaps.length > 0;
                      
                      const displayStatus = getDisplayStatus(booking);
                      const StatusIcon = statusIcons[displayStatus];
                      const isDraggable = ['pending', 'confirmed'].includes(booking.status) && !booking.jobCardId;
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
                          aria-label={`${booking.customerName}'s appointment at ${booking.bookingTime} with ${staffMember.name} for ${bookingDuration} minutes. Status: ${statusLabels[displayStatus]}. ${isDraggable ? 'Draggable. Press Enter to view details, Space to move appointment, or drag to reschedule.' : 'Press Enter to view details.'}${hasConflicts ? ' Warning: scheduling conflict detected with other appointments.' : ''}`}
                          aria-describedby={hasConflicts ? `conflict-description-${booking.id}` : undefined}
                          aria-pressed={isBeingDragged}
                          className={`p-2 rounded-lg focus:ring-2 focus:ring-primary focus:ring-offset-1 shadow-sm border-l-4 touch-manipulation ${
                            statusColors[displayStatus]
                          } ${
                            isBeingDragged ? 'booking-drag-preview z-50' : 'z-30 booking-draggable'
                          } ${
                            isDraggable ? 'cursor-grab hover:cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                          } ${
                            hasConflicts ? 'border-l-red-500 ring-2 ring-red-200 dark:ring-red-800 conflict-indicator' : 'border-l-primary'
                          } transition-all duration-200`}
                          style={{
                            gridColumn: extendedStaff.findIndex(s => s.id === (booking.staffId || 'unassigned')) + 2,
                            gridRow: `${startRowIndex + 2} / span ${actualRowSpan}`,
                            margin: '1px',
                            boxSizing: 'border-box'
                          }}
                          onClick={() => setSelectedBooking(booking)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setSelectedBooking(booking);
                            } else if (e.key === ' ' && isDraggable) {
                              e.preventDefault();
                              handleMoveBooking(booking);
                            } else if (isDraggable && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                              e.preventDefault();
                              handleKeyboardMove(booking, e.key);
                            }
                          }}
                          onTouchStart={isDraggable ? (e) => handleTouchStart(e, booking) : undefined}
                          onTouchMove={isDraggable ? handleTouchMove : undefined}
                          onTouchEnd={isDraggable ? handleTouchEnd : undefined}
                          onDragStart={(e) => handleDragStart(e, booking)}
                          onDragEnd={handleDragEnd}
                          data-testid={`timeline-booking-${booking.id}`}
                          title={`${booking.customerName} - ${booking.serviceName || 'Service'} (${bookingDuration}min)${hasConflicts ? ' - CONFLICT!' : ''}${isDraggable ? ' - Drag to reschedule' : ' - Cannot be moved'}`}
                        >
                          {/* Enhanced Booking Header */}
                          <div className="flex items-center gap-1 mb-1">
                            {hasConflicts && (
                              <div title="Scheduling conflict detected" className="conflict-indicator">
                                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0 animate-pulse" />
                              </div>
                            )}
                            {StatusIcon && <StatusIcon className="h-3 w-3 flex-shrink-0" />}
                            {isDraggable && (
                              <GripVertical className="h-3 w-3 text-muted-foreground/70 ml-auto flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Hidden conflict description for screen readers */}
                          {hasConflicts && (
                            <div id={`conflict-description-${booking.id}`} className="sr-only">
                              This appointment conflicts with {overlaps.map(o => `${o.customerName} at ${o.bookingTime}`).join(', ')}. Please reschedule to resolve conflicts.
                            </div>
                          )}
                          
                          {/* Main Booking Content */}
                          <div className="space-y-1 text-xs">
                            {/* Customer Name */}
                            <div className="font-bold text-foreground truncate" title={booking.customerName}>
                              👤 {booking.customerName}
                            </div>
                            
                            {/* Service Name */}
                            <div className="font-semibold text-primary truncate" title={booking.serviceName || 'Service'}>
                              ✂️ {booking.serviceName || 'Service'}
                            </div>
                            
                            {/* Time and Duration */}
                            <div className="text-muted-foreground font-medium">
                              🕐 {booking.bookingTime} ({bookingDuration}min)
                            </div>
                            
                            {/* Price */}
                            <div className="font-bold text-green-600 dark:text-green-400">
                              💰 {formatCurrency(booking.totalAmountPaisa, booking.currency)}
                            </div>
                            
                            {/* Customer Phone (useful for salon staff to call) */}
                            {booking.customerPhone && (
                              <div className="text-muted-foreground truncate" title={`Call: ${booking.customerPhone}`}>
                                📞 {booking.customerPhone}
                              </div>
                            )}
                            
                            {/* Notes */}
                            {booking.notes && (
                              <div className="text-muted-foreground italic truncate" title={booking.notes}>
                                📝 {booking.notes}
                              </div>
                            )}
                            
                            {/* Status Badge with Label */}
                            <Badge 
                              variant="secondary" 
                              className={`text-[10px] px-1.5 py-0 h-4 font-medium ${
                                displayStatus === 'pending' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                displayStatus === 'confirmed' ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                displayStatus === 'arrived' ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200' :
                                displayStatus === 'in_service' ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                displayStatus === 'pending_checkout' ? 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                displayStatus === 'completed' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                                displayStatus === 'no_show' ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
                                'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                              title={`Status: ${statusLabels[displayStatus]}`}
                            >
                              {statusLabels[displayStatus]}
                            </Badge>
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
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300 dark:bg-blue-900 dark:border-blue-700"></div>
                    <span>Confirmed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300 dark:bg-amber-900 dark:border-amber-700"></div>
                    <span>Arrived</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-300 dark:bg-green-900 dark:border-green-700"></div>
                    <span>In Service</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-100 border border-orange-300 dark:bg-orange-900 dark:border-orange-700"></div>
                    <span>Checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-600"></div>
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-300 dark:bg-red-900 dark:border-red-700"></div>
                    <span>Cancelled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300 dark:bg-slate-900 dark:border-slate-700"></div>
                    <span>No Show</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span>Conflict</span>
                  </div>
                </div>
                <div className="hidden xl:block text-right">
                  Timeline shows exact appointment durations<br/>
                  <span className="text-xs">Click for details - Drag confirmed/pending to reschedule</span>
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
                    const displayStatus = getDisplayStatus(booking);
                    const StatusIcon = statusIcons[displayStatus];
                    const isDraggable = ['pending', 'confirmed'].includes(booking.status) && !booking.jobCardId;
                    const isBeingDragged = draggedBooking?.id === booking.id;
                    
                    return (
                      <div
                        key={booking.id}
                        draggable={isDraggable}
                        tabIndex={0}
                        role="button"
                        aria-label={`${booking.customerName}'s appointment at ${booking.bookingTime}. Status: ${statusLabels[displayStatus]}${isDraggable ? '. Press Enter to view details or Space to move appointment' : '. Press Enter to view details'}`}
                        className={`p-2 rounded-sm cursor-pointer hover:opacity-80 focus:ring-2 focus:ring-primary focus:ring-offset-1 ${statusColors[displayStatus]} ${
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
          
          {selectedBooking && (() => {
            const displayStatus = getDisplayStatus(selectedBooking);
            return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={statusColors[displayStatus]}>
                  {statusLabels[displayStatus]}
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
          );
          })()}
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