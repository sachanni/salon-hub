import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Calendar, MapPin, Trash2, Bell, CheckCircle, X, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface WaitlistEntry {
  id: string;
  salon: { id: string; name: string; imageUrl?: string };
  service: { id: string; name: string; priceInPaisa: number | null };
  staff?: { id: string; name: string } | null;
  requestedDate: string;
  timeWindow: string;
  flexibilityDays: number;
  priority: number;
  position: number;
  status: string;
  notifiedAt?: string;
  responseDeadline?: string;
  expiresAt: string;
  createdAt: string;
}

export function MyWaitlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{ entries: WaitlistEntry[] }>({
    queryKey: ["my-waitlist"],
    queryFn: async () => {
      const res = await fetch("/api/waitlist/my-entries", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch waitlist");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (waitlistId: string) => {
      const res = await fetch(`/api/waitlist/${waitlistId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Removed from Waitlist" });
      queryClient.invalidateQueries({ queryKey: ["my-waitlist"] });
      setCancellingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Remove",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ waitlistId, response }: { waitlistId: string; response: "accepted" | "declined" }) => {
      const res = await fetch(`/api/waitlist/${waitlistId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ response }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to respond");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.response === "accepted") {
        toast({
          title: "Booking Confirmed!",
          description: "Your appointment has been booked successfully.",
        });
      } else {
        toast({ title: "Slot Declined" });
      }
      queryClient.invalidateQueries({ queryKey: ["my-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setRespondingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Respond",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString("en-IN")}`;
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 60) return `${minutes}m remaining`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m remaining`;
  };

  const getStatusBadge = (entry: WaitlistEntry) => {
    switch (entry.status) {
      case "waiting":
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Waiting</Badge>;
      case "notified":
        return <Badge variant="default" className="bg-green-600">Slot Available!</Badge>;
      case "booked":
        return <Badge variant="default" className="bg-purple-600">Booked</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{entry.status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            My Waitlist
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            My Waitlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Failed to load waitlist entries</p>
        </CardContent>
      </Card>
    );
  }

  const entries = data?.entries || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          My Waitlist
        </CardTitle>
        <CardDescription>
          Get notified when slots become available at your favorite salons
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>You're not on any waitlists</p>
            <p className="text-sm mt-1">
              When a service is fully booked, you can join the waitlist to get notified when a slot opens up.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`border rounded-lg p-4 ${
                  entry.status === "notified" ? "border-green-500 bg-green-50 dark:bg-green-950" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{entry.service.name}</h4>
                      {getStatusBadge(entry)}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {entry.salon.name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.requestedDate)}
                        {entry.flexibilityDays > 0 && ` (±${entry.flexibilityDays}d)`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {entry.timeWindow}
                      </span>
                    </div>
                    {entry.staff && (
                      <p className="text-sm text-muted-foreground mt-1">
                        With: {entry.staff.name}
                      </p>
                    )}
                    {entry.service.priceInPaisa && (
                      <p className="text-sm font-medium mt-1">
                        {formatPrice(entry.service.priceInPaisa)}
                      </p>
                    )}
                  </div>

                  {entry.status === "waiting" && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-2">
                        #{entry.position} in queue
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCancellingId(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {entry.status === "notified" && entry.responseDeadline && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        A slot is available for you!
                      </span>
                      <span className="text-sm text-amber-600 dark:text-amber-400">
                        {getTimeRemaining(entry.responseDeadline)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setRespondingId(entry.id);
                          respondMutation.mutate({ waitlistId: entry.id, response: "accepted" });
                        }}
                        disabled={respondMutation.isPending}
                      >
                        {respondMutation.isPending && respondingId === entry.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Book Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRespondingId(entry.id);
                          respondMutation.mutate({ waitlistId: entry.id, response: "declined" });
                        }}
                        disabled={respondMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!cancellingId} onOpenChange={() => setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Waitlist?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer be notified when a slot becomes available.
              You can rejoin the waitlist anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep on Waitlist</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellingId && cancelMutation.mutate(cancellingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
