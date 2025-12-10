import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, X, Scissors, IndianRupee } from "lucide-react";
import { WalkInPhoneVerification } from "./WalkInPhoneVerification";

interface Service {
  id: string;
  name: string;
  category?: string;
  priceInPaisa: number;
  durationMinutes: number;
}

interface Staff {
  id: string;
  name: string;
  email: string;
}

interface WalkInDialogProps {
  salonId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (jobCardId: string) => void;
}

export default function WalkInDialog({ salonId, open, onOpenChange, onSuccess }: WalkInDialogProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/salons', salonId, 'services'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/services`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !!salonId && isAuthenticated && open,
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ['/api/salons', salonId, 'staff'],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/staff`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }
      return response.json();
    },
    enabled: !!salonId && isAuthenticated && open,
  });

  const walkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/salons/${salonId}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          checkInMethod: 'walk_in',
          serviceIds: selectedServiceIds.length > 0 ? selectedServiceIds : undefined,
          staffId: selectedStaffId || undefined,
          verificationSessionId: verificationSessionId || undefined,
        }),
      });
      if (!response.ok) {
        let errorMessage = 'Failed to check in walk-in customer';
        let sessionExpired = false;
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
          sessionExpired = error.sessionExpired === true;
        } catch (e) {
          // Response was not JSON (e.g., HTML error page)
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        const err = new Error(errorMessage);
        (err as any).sessionExpired = sessionExpired;
        throw err;
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'bookings'] });
      // Invalidate all client profile queries (list and detail)
      queryClient.invalidateQueries({ queryKey: ['/api/business', salonId, 'clients'], exact: false });
      toast({
        title: "Walk-in Checked In",
        description: `Job card ${data.jobCard.jobCardNumber} created successfully`
      });
      resetForm();
      onOpenChange(false);
      if (onSuccess && data.jobCard?.id) {
        onSuccess(data.jobCard.id);
      }
    },
    onError: (error: Error & { sessionExpired?: boolean }) => {
      // Handle session expiry by resetting phone verification
      if (error.sessionExpired) {
        setPhoneVerified(false);
        setVerificationSessionId(null);
        toast({
          title: "Verification Expired",
          description: "Please verify the phone number again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check-in Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setPhoneVerified(false);
    setVerificationSessionId(null);
    setSelectedServiceIds([]);
    setSelectedStaffId("");
  };

  const handlePhoneVerified = (data: { phone: string; verificationSessionId: string; userId?: number; alreadyVerified?: boolean }) => {
    setCustomerPhone(data.phone);
    setPhoneVerified(true);
    // Both new and returning customers now have a valid verificationSessionId
    setVerificationSessionId(data.verificationSessionId);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  const calculateTotal = () => {
    return selectedServiceIds.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.priceInPaisa || 0);
    }, 0);
  };

  const calculateDuration = () => {
    return selectedServiceIds.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.durationMinutes || 0);
    }, 0);
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const isValid = customerName.trim().length > 0 && phoneVerified;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Walk-in Customer
          </DialogTitle>
          <DialogDescription>
            Quick check-in for walk-in customers without prior booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              data-testid="walkin-customer-name"
            />
          </div>

          <WalkInPhoneVerification
            onVerified={handlePhoneVerified}
            initialPhone=""
            customerName={customerName}
          />

          <div className="space-y-2">
            <Label>Assign Staff (Optional)</Label>
            <Select 
              value={selectedStaffId || "__none__"} 
              onValueChange={(value) => setSelectedStaffId(value === "__none__" ? "" : value)}
            >
              <SelectTrigger data-testid="walkin-staff-select">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No specific staff</SelectItem>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Services (Optional)
              </Label>
              {selectedServiceIds.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setSelectedServiceIds([])}
                >
                  Clear all
                </Button>
              )}
            </div>
            
            {servicesLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Loading services...
              </div>
            ) : services.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No services available
              </div>
            ) : (
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-4">
                  {Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <div key={category}>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {categoryServices.map((service) => (
                          <div 
                            key={service.id}
                            className="flex items-center justify-between py-2 px-2 rounded hover:bg-accent cursor-pointer"
                            onClick={() => toggleService(service.id)}
                            data-testid={`walkin-service-${service.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={selectedServiceIds.includes(service.id)}
                                onCheckedChange={() => toggleService(service.id)}
                              />
                              <span className="text-sm">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{service.durationMinutes}m</span>
                              <span className="font-medium text-foreground">
                                {formatAmount(service.priceInPaisa)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedServiceIds.length > 0 && (
              <div className="flex items-center justify-between pt-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedServiceIds.length} selected</Badge>
                  <span className="text-muted-foreground">~{calculateDuration()} min</span>
                </div>
                <div className="flex items-center gap-1 font-medium">
                  <IndianRupee className="h-3 w-3" />
                  {formatAmount(calculateTotal()).replace('₹', '')}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() => walkInMutation.mutate()}
            disabled={!isValid || walkInMutation.isPending}
            className="w-full sm:w-auto"
            data-testid="walkin-submit"
          >
            {walkInMutation.isPending ? "Checking in..." : "Check In"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
