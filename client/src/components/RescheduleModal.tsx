import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, Scissors, MapPin, Loader2, AlertCircle } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    salonId: string;
    salonName: string;
    serviceId: string;
    serviceName: string;
    staffId: string;
    staffName: string;
    bookingDate: string;
    bookingTime: string;
    duration: number;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function RescheduleModal({ isOpen, onClose, appointment }: RescheduleModalProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (selectedDate && appointment.salonId) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, appointment.salonId]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(
        `/api/salons/${appointment.salonId}/available-slots?date=${dateStr}&serviceId=${appointment.serviceId}${appointment.staffId ? `&staffId=${appointment.staffId}` : ""}`,
        { credentials: "include" }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Select date and time",
        description: "Please select a new date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    setRescheduling(true);
    try {
      const response = await fetch(
        `/api/salons/${appointment.salonId}/bookings/${appointment.id}/reschedule`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            newDate: format(selectedDate, "yyyy-MM-dd"),
            newTime: selectedTime,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Appointment rescheduled",
          description: `Your ${appointment.serviceName} appointment has been moved to ${format(selectedDate, "EEEE, MMMM d, yyyy")} at ${selectedTime}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/customer/appointments"] });
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: "Reschedule failed",
          description: error.error || "Could not reschedule your appointment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      toast({
        title: "Reschedule failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRescheduling(false);
    }
  };

  const disabledDays = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{appointment.serviceName}</span>
                <Badge variant="secondary" className="ml-auto">{appointment.duration} min</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.salonName}</span>
              </div>
              {appointment.staffName && appointment.staffName !== "Not assigned" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>with {appointment.staffName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t">
                <CalendarIcon className="h-4 w-4" />
                <span>Current: {appointment.bookingDate} at {appointment.bookingTime}</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-medium mb-2">Select New Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              className="rounded-md border"
              fromDate={new Date()}
              toDate={addDays(new Date(), 60)}
            />
          </div>

          {selectedDate && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Available Times for {format(selectedDate, "EEEE, MMM d")}
              </h3>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableSlots.length > 0 ? (
                <ScrollArea className="h-[120px]">
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          size="sm"
                          className="text-xs"
                          onClick={() => setSelectedTime(slot.time)}
                        >
                          {formatTime12Hour(slot.time)}
                        </Button>
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <AlertCircle className="h-4 w-4" />
                  No available slots on this date. Please select another date.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={rescheduling}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTime || rescheduling}
          >
            {rescheduling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rescheduling...
              </>
            ) : (
              "Confirm Reschedule"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
