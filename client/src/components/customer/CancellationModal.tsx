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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CancellationReason {
  code: string;
  label: string;
  category: string;
}

interface CancellationPreview {
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  hoursBeforeAppointment: number;
  cancellationFee: number;
  cancellationFeePaisa: number;
  refundAmount: number;
  refundAmountPaisa: number;
  feePercentage: number;
  policy: { tier: string; description: string }[];
  canCancel: boolean;
  cancelError?: string;
}

interface CancellationModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancellationModal({
  bookingId,
  isOpen,
  onClose,
  onSuccess,
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [requestRefund, setRequestRefund] = useState(true);
  const [step, setStep] = useState<"reason" | "preview" | "confirm">("reason");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reasonsData, isLoading: loadingReasons } = useQuery({
    queryKey: ["cancellation-reasons"],
    queryFn: async () => {
      const res = await fetch("/api/cancellation/reasons?type=customer");
      if (!res.ok) throw new Error("Failed to fetch reasons");
      return res.json();
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: previewData, isLoading: loadingPreview } = useQuery({
    queryKey: ["cancellation-preview", bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}/cancellation-preview`);
      if (!res.ok) throw new Error("Failed to fetch preview");
      return res.json();
    },
    enabled: isOpen && step !== "reason",
    staleTime: 30 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reasonCode: selectedReason,
          additionalComments: additionalComments || undefined,
          requestRefund,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel booking");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const showRefundMessage = requestRefund && data.cancellation.refundAmountPaisa > 0;
      toast({
        title: "Booking Cancelled",
        description: showRefundMessage
          ? `Your refund of ₹${data.cancellation.refundAmount} will be processed within 5-7 business days.`
          : "Your booking has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      onSuccess?.();
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("reason");
    setSelectedReason("");
    setAdditionalComments("");
    setRequestRefund(true);
    onClose();
  };

  const handleNext = () => {
    if (step === "reason" && selectedReason) {
      setStep("preview");
    } else if (step === "preview" && preview?.canCancel) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "preview") {
      setStep("reason");
    } else if (step === "confirm") {
      setStep("preview");
    }
  };

  const getFeeAlertVariant = (percentage: number) => {
    if (percentage === 0) return "success";
    if (percentage <= 25) return "warning";
    if (percentage <= 50) return "warning";
    return "destructive";
  };

  const preview: CancellationPreview | undefined = previewData?.preview;

  const groupedReasons = reasonsData?.byCategory || {};

  const categoryLabels: Record<string, string> = {
    scheduling: "Schedule Issues",
    pricing: "Pricing Concerns",
    changed_mind: "Changed My Mind",
    emergency: "Emergency",
    salon_issue: "Salon Related",
    trust: "Trust & Reviews",
    user_error: "Booking Error",
    external: "External Factors",
    other: "Other",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            {step === "reason" && "Please let us know why you're cancelling."}
            {step === "preview" && "Review cancellation details and fees."}
            {step === "confirm" && "Confirm your cancellation."}
          </DialogDescription>
        </DialogHeader>

        {step === "reason" && (
          <div className="space-y-4 py-4">
            {loadingReasons ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {Object.entries(groupedReasons).map(([category, reasons]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {categoryLabels[category] || category}
                    </h4>
                    {(reasons as { code: string; label: string }[]).map((reason) => (
                      <div
                        key={reason.code}
                        className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedReason(reason.code)}
                      >
                        <RadioGroupItem value={reason.code} id={reason.code} />
                        <Label htmlFor={reason.code} className="flex-1 cursor-pointer">
                          {reason.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                ))}
              </RadioGroup>
            )}

            {selectedReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="comments">Please specify</Label>
                <Textarea
                  id="comments"
                  placeholder="Tell us more about why you're cancelling..."
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  className="min-h-[80px]"
                  maxLength={1000}
                />
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4 py-4">
            {loadingPreview ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : preview && !preview.canCancel ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{preview.cancelError || "This booking cannot be cancelled."}</AlertDescription>
              </Alert>
            ) : preview ? (
              <>
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Appointment</span>
                    </div>
                    <span className="font-medium">
                      {new Date(preview.bookingDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      at {preview.bookingTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Time until appointment</span>
                    </div>
                    <Badge variant={preview.hoursBeforeAppointment > 24 ? "secondary" : "destructive"}>
                      {preview.hoursBeforeAppointment}h before
                    </Badge>
                  </div>
                </div>

                <Separator />

                <Alert
                  variant={preview.feePercentage === 0 ? "default" : "destructive"}
                  className={preview.feePercentage === 0 ? "border-green-500 bg-green-50" : ""}
                >
                  {preview.feePercentage === 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription className="ml-2">
                    {preview.feePercentage === 0 ? (
                      <span className="text-green-700">
                        Free cancellation! You're cancelling more than 24 hours in advance.
                      </span>
                    ) : (
                      <span>
                        A {preview.feePercentage}% cancellation fee applies for cancellations made{" "}
                        {preview.hoursBeforeAppointment < 12
                          ? "less than 12 hours"
                          : "12-24 hours"}{" "}
                        before the appointment.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cancellation fee</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {preview.cancellationFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span>Refund amount</span>
                    <span className="flex items-center text-green-600">
                      <IndianRupee className="h-4 w-4" />
                      {preview.refundAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {preview.refundAmountPaisa > 0 && (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="request-refund" className="text-sm font-medium">
                        Request refund
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Refund will be processed to your original payment method
                      </p>
                    </div>
                    <Switch
                      id="request-refund"
                      checked={requestRefund}
                      onCheckedChange={setRequestRefund}
                    />
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Cancellation Policy:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {preview.policy.map((p, i) => (
                      <li key={i}>
                        {p.tier}: {p.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load cancellation preview.</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. Are you sure you want to cancel this booking?
              </AlertDescription>
            </Alert>

            {preview && preview.refundAmountPaisa > 0 && requestRefund && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-700">
                  Your refund of{" "}
                  <span className="font-semibold">₹{preview.refundAmount.toFixed(2)}</span> will be
                  processed to your original payment method within 5-7 business days.
                </p>
              </div>
            )}

            {preview && preview.refundAmountPaisa > 0 && !requestRefund && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm text-amber-700">
                  You have chosen not to request a refund. The booking amount will not be refunded.
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p>Selected reason: {reasonsData?.reasons?.find((r: CancellationReason) => r.code === selectedReason)?.label}</p>
              {additionalComments && (
                <p className="mt-1">Comments: {additionalComments}</p>
              )}
              {requestRefund && preview && preview.refundAmountPaisa > 0 && (
                <p className="mt-1">Refund requested: Yes</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step !== "reason" && (
            <Button variant="outline" onClick={handleBack} disabled={cancelMutation.isPending}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} disabled={cancelMutation.isPending}>
            Keep Booking
          </Button>
          {step === "confirm" ? (
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          ) : (
            <Button 
              onClick={handleNext} 
              disabled={!selectedReason || loadingPreview || (step === "preview" && preview && !preview.canCancel)}
            >
              {step === "reason" ? "Next" : "Continue"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CancellationModal;
