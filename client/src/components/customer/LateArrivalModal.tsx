import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Car,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DelayOption {
  value: number;
  label: string;
}

interface LateArrivalModalProps {
  bookingId: string;
  bookingTime: string;
  salonName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LateArrivalModal({
  bookingId,
  bookingTime,
  salonName,
  isOpen,
  onClose,
  onSuccess,
}: LateArrivalModalProps) {
  const [selectedDelay, setSelectedDelay] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: optionsData, isLoading: loadingOptions } = useQuery({
    queryKey: ["late-arrival-options"],
    queryFn: async () => {
      const res = await fetch("/api/late-arrival/delay-options");
      if (!res.ok) throw new Error("Failed to fetch options");
      return res.json();
    },
    enabled: isOpen,
    staleTime: 60 * 60 * 1000,
  });

  const { data: eligibilityData, isLoading: loadingEligibility } = useQuery({
    queryKey: ["late-arrival-eligibility", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/late-arrival/bookings/${bookingId}/can-notify`);
      if (!res.ok) throw new Error("Failed to check eligibility");
      return res.json();
    },
    enabled: isOpen,
    staleTime: 30 * 1000,
  });

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/late-arrival/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          estimatedDelayMinutes: selectedDelay,
          customerMessage: message || undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send notification");
      }
      return res.json();
    },
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Notification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("select");
    setSelectedDelay(null);
    setMessage("");
    onClose();
    if (step === "success") {
      onSuccess?.();
    }
  };

  const handleSend = () => {
    if (!selectedDelay) {
      toast({
        title: "Select delay time",
        description: "Please select how late you'll be.",
        variant: "destructive",
      });
      return;
    }
    notifyMutation.mutate();
  };

  const formatTimeWithDelay = (time: string, delayMinutes: number): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + delayMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    const period = newHours >= 12 ? "PM" : "AM";
    const displayHours = newHours % 12 || 12;
    return `${displayHours}:${newMinutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const options: DelayOption[] = optionsData?.options || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Running Late?
          </DialogTitle>
          <DialogDescription>
            Let {salonName} know you're on your way
          </DialogDescription>
        </DialogHeader>

        {step === "success" ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Notification Sent!</h3>
            <p className="text-muted-foreground">
              {salonName} has been notified that you'll arrive around{" "}
              {selectedDelay ? formatTimeWithDelay(bookingTime, selectedDelay) : ""}.
            </p>
            <Button onClick={handleClose} className="mt-6">
              Done
            </Button>
          </div>
        ) : loadingOptions || loadingEligibility ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !eligibilityData?.canSend ? (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {eligibilityData?.reason || "Cannot send late notification for this booking."}
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Original appointment: <span className="font-medium text-foreground">{formatTime(bookingTime)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">How late will you be?</Label>
                <RadioGroup
                  value={selectedDelay?.toString() || ""}
                  onValueChange={(value) => setSelectedDelay(parseInt(value))}
                  className="grid grid-cols-2 gap-2"
                >
                  {options.map((option: DelayOption) => (
                    <div key={option.value} className="relative">
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`delay-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`delay-${option.value}`}
                        className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span className="text-lg font-semibold">{option.label}</span>
                        {selectedDelay === option.value && (
                          <span className="mt-1 text-xs text-muted-foreground">
                            ETA: {formatTimeWithDelay(bookingTime, option.value)}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {selectedDelay && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      New estimated arrival: {formatTimeWithDelay(bookingTime, selectedDelay)}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  Add a message (optional)
                </Label>
                <Textarea
                  id="message"
                  placeholder="e.g., Stuck in traffic, on my way!"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  className="resize-none"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/500
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!selectedDelay || notifyMutation.isPending}
                className="gap-2"
              >
                {notifyMutation.isPending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Notify Salon
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
