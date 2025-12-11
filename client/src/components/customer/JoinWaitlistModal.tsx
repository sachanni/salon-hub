import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, Users, Bell, CheckCircle } from "lucide-react";

interface JoinWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
  salonName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  requestedDate: string;
  staffId?: string | null;
  staffName?: string | null;
  onSuccess?: () => void;
}

export function JoinWaitlistModal({
  isOpen,
  onClose,
  salonId,
  salonName,
  serviceId,
  serviceName,
  servicePrice,
  requestedDate,
  staffId,
  staffName,
  onSuccess,
}: JoinWaitlistModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [timeWindowStart, setTimeWindowStart] = useState("09:00");
  const [timeWindowEnd, setTimeWindowEnd] = useState("18:00");
  const [flexibilityDays, setFlexibilityDays] = useState(0);
  const [step, setStep] = useState<"preferences" | "confirm" | "success">("preferences");
  const [waitlistEntry, setWaitlistEntry] = useState<any>(null);

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          salonId,
          serviceId,
          staffId: staffId || null,
          requestedDate,
          timeWindowStart,
          timeWindowEnd,
          flexibilityDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "SLOTS_AVAILABLE") {
          throw new Error("Slots are available! Please proceed to booking instead.");
        }
        throw new Error(data.error || "Failed to join waitlist");
      }

      return data;
    },
    onSuccess: (data) => {
      setWaitlistEntry(data.waitlistEntry);
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["my-waitlist"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Join Waitlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("preferences");
    setWaitlistEntry(null);
    onClose();
    if (step === "success") {
      onSuccess?.();
    }
  };

  const handleNext = () => {
    if (step === "preferences") {
      setStep("confirm");
    } else if (step === "confirm") {
      joinMutation.mutate();
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("preferences");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString("en-IN")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {step === "success" ? "You're on the Waitlist!" : "Join Waitlist"}
          </DialogTitle>
          <DialogDescription>
            {step === "preferences" && "Get notified when a slot becomes available."}
            {step === "confirm" && "Review your preferences before joining."}
            {step === "success" && "We'll notify you when a slot opens up."}
          </DialogDescription>
        </DialogHeader>

        {step === "preferences" && (
          <div className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">{serviceName}</p>
              <p className="text-sm text-muted-foreground">{salonName}</p>
              <p className="text-sm text-muted-foreground">{formatDate(requestedDate)}</p>
              {staffName && (
                <p className="text-sm text-muted-foreground">With: {staffName}</p>
              )}
              <p className="text-sm font-medium mt-1">{formatPrice(servicePrice)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  Preferred Time Window
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={timeWindowStart}
                    onChange={(e) => setTimeWindowStart(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={timeWindowEnd}
                    onChange={(e) => setTimeWindowEnd(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Date Flexibility: ±{flexibilityDays} day{flexibilityDays !== 1 ? "s" : ""}
                </Label>
                <Slider
                  value={[flexibilityDays]}
                  onValueChange={(value) => setFlexibilityDays(value[0])}
                  max={7}
                  step={1}
                  className="py-4"
                />
                <p className="text-xs text-muted-foreground">
                  Accept slots from {formatDate(
                    new Date(new Date(requestedDate).getTime() - flexibilityDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                  )} to {formatDate(
                    new Date(new Date(requestedDate).getTime() + flexibilityDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salon</span>
                <span className="font-medium">{salonName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{formatDate(requestedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Window</span>
                <span className="font-medium">{timeWindowStart} - {timeWindowEnd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flexibility</span>
                <span className="font-medium">±{flexibilityDays} days</span>
              </div>
              {staffName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staff</span>
                  <span className="font-medium">{staffName}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">How it works</p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                    <li>We'll notify you when a matching slot opens</li>
                    <li>You'll have 15 minutes to accept or decline</li>
                    <li>If you decline, the next person in line gets notified</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === "success" && waitlistEntry && (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-medium">Added to Waitlist</p>
              <p className="text-muted-foreground">
                You're #{waitlistEntry.position} in line
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Position in queue: <strong className="text-foreground">#{waitlistEntry.position}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Calendar className="h-4 w-4" />
                <span>Entry expires: <strong className="text-foreground">
                  {new Date(waitlistEntry.expiresAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong></span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              We'll send you a notification when a slot becomes available. Keep your notifications on!
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "preferences" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNext}>
                Continue
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={joinMutation.isPending}>
                {joinMutation.isPending ? "Joining..." : "Join Waitlist"}
              </Button>
            </>
          )}
          {step === "success" && (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
