import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Clock,
  Bell,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MessageSquare,
  Siren,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface LateArrivalNotification {
  id: string;
  bookingId: string;
  estimatedDelayMinutes: number;
  originalBookingTime: string;
  estimatedArrivalTime: string;
  customerMessage: string | null;
  salonNotified: number;
  salonAcknowledged: number;
  salonResponse: string | null;
  salonResponseNote: string | null;
  createdAt: string;
  booking?: {
    id: string;
    customerName: string;
    bookingDate: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface LateArrivalDashboardProps {
  salonId: string;
}

export function LateArrivalDashboard({ salonId }: LateArrivalDashboardProps) {
  const [selectedNotification, setSelectedNotification] = useState<LateArrivalNotification | null>(null);
  const [isAcknowledgeDialogOpen, setIsAcknowledgeDialogOpen] = useState(false);
  const [response, setResponse] = useState<"acknowledged" | "rescheduled" | "cancelled">("acknowledged");
  const [responseNote, setResponseNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingData, isLoading: loadingPending, refetch: refetchPending } = useQuery({
    queryKey: ["late-arrival-pending", salonId],
    queryFn: async () => {
      const res = await fetch(`/api/late-arrival/salons/${salonId}/pending`);
      if (!res.ok) throw new Error("Failed to fetch pending notifications");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["late-arrival-history", salonId],
    queryFn: async () => {
      const res = await fetch(`/api/late-arrival/salons/${salonId}/history?limit=50`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ notificationId, response, responseNote }: { 
      notificationId: string; 
      response: string; 
      responseNote?: string;
    }) => {
      const res = await fetch(`/api/late-arrival/${notificationId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, responseNote }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to acknowledge");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Response Sent",
        description: "Customer has been notified of your response.",
      });
      queryClient.invalidateQueries({ queryKey: ["late-arrival-pending", salonId] });
      queryClient.invalidateQueries({ queryKey: ["late-arrival-history", salonId] });
      setIsAcknowledgeDialogOpen(false);
      setSelectedNotification(null);
      setResponse("acknowledged");
      setResponseNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to respond",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const getCustomerName = (notification: LateArrivalNotification): string => {
    if (notification.user) {
      return `${notification.user.firstName} ${notification.user.lastName || ""}`.trim();
    }
    return notification.booking?.customerName || "Customer";
  };

  const handleAcknowledge = () => {
    if (!selectedNotification) return;
    acknowledgeMutation.mutate({
      notificationId: selectedNotification.id,
      response,
      responseNote: responseNote || undefined,
    });
  };

  const pendingNotifications: LateArrivalNotification[] = pendingData?.notifications || [];
  const historyNotifications: LateArrivalNotification[] = historyData?.notifications || [];

  const getStatusBadge = (notification: LateArrivalNotification) => {
    if (notification.salonAcknowledged) {
      switch (notification.salonResponse) {
        case "acknowledged":
          return <Badge variant="default" className="bg-green-500">Acknowledged</Badge>;
        case "rescheduled":
          return <Badge variant="secondary" className="bg-blue-500 text-white">Rescheduled</Badge>;
        case "cancelled":
          return <Badge variant="destructive">Cancelled</Badge>;
        default:
          return <Badge>Responded</Badge>;
      }
    }
    return <Badge variant="outline" className="border-amber-500 text-amber-600">Pending Response</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Late Arrival Notifications
            </CardTitle>
            <CardDescription>
              Manage notifications from customers running late for appointments
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPending()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Siren className="h-4 w-4" />
              Active Alerts
              {pendingNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {loadingPending ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : pendingNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 opacity-50" />
                <p className="mt-2 text-muted-foreground">No active late arrival alerts</p>
                <p className="text-sm text-muted-foreground">All customers are on time!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingNotifications.map((notification) => (
                  <Alert
                    key={notification.id}
                    className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                  >
                    <Bell className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {getCustomerName(notification)} is running late
                      </span>
                      <Badge variant="outline" className="bg-amber-100">
                        +{notification.estimatedDelayMinutes} min
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Original: <strong>{formatTime(notification.originalBookingTime)}</strong>
                          </span>
                          <span className="text-amber-600 font-medium">
                            → New ETA: {formatTime(notification.estimatedArrivalTime)}
                          </span>
                        </div>
                        {notification.customerMessage && (
                          <div className="flex items-start gap-1 text-sm bg-white/50 rounded p-2 dark:bg-black/20">
                            <MessageSquare className="h-3 w-3 mt-0.5" />
                            <span>"{notification.customerMessage}"</span>
                          </div>
                        )}
                        <div className="flex justify-end pt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedNotification(notification);
                              setIsAcknowledgeDialogOpen(true);
                            }}
                          >
                            Respond
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loadingHistory ? (
              <Skeleton className="h-64 w-full" />
            ) : historyNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-2 text-muted-foreground">No late arrival history yet</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Original Time</TableHead>
                      <TableHead>Delay</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">
                          {getCustomerName(notification)}
                        </TableCell>
                        <TableCell>
                          {notification.booking?.bookingDate ? 
                            format(parseISO(notification.booking.bookingDate), "MMM d, yyyy") :
                            format(parseISO(notification.createdAt), "MMM d, yyyy")
                          }
                        </TableCell>
                        <TableCell>{formatTime(notification.originalBookingTime)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">+{notification.estimatedDelayMinutes} min</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(notification)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={isAcknowledgeDialogOpen} onOpenChange={setIsAcknowledgeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Respond to Late Arrival</DialogTitle>
              <DialogDescription>
                {selectedNotification && (
                  <>
                    {getCustomerName(selectedNotification)} will arrive {selectedNotification.estimatedDelayMinutes} minutes late 
                    (ETA: {formatTime(selectedNotification.estimatedArrivalTime)})
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <RadioGroup
                value={response}
                onValueChange={(value) => setResponse(value as typeof response)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="acknowledged" id="acknowledged" />
                  <Label htmlFor="acknowledged" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Acknowledge & Wait</div>
                      <div className="text-sm text-muted-foreground">Customer can proceed with booking</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="rescheduled" id="rescheduled" />
                  <Label htmlFor="rescheduled" className="flex items-center gap-2 cursor-pointer">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Suggest Reschedule</div>
                      <div className="text-sm text-muted-foreground">Ask customer to book a new time</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="cancelled" id="cancelled" />
                  <Label htmlFor="cancelled" className="flex items-center gap-2 cursor-pointer">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium">Cannot Accommodate</div>
                      <div className="text-sm text-muted-foreground">Delay is too long to proceed</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="note">Add a message (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="e.g., No problem, see you soon!"
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAcknowledgeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAcknowledge} disabled={acknowledgeMutation.isPending}>
                {acknowledgeMutation.isPending ? "Sending..." : "Send Response"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
