import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Clock, DollarSign, Users } from "lucide-react";

interface BookingSettingsStepProps {
  salonId: string;
  initialData?: any;
  onComplete: (data: any) => void;
  isCompleted: boolean;
}

interface BookingFormData {
  advanceBookingDays: number;
  cancellationHours: number;
  requireDeposit: boolean;
  depositAmount: number;
  depositType: string;
  allowOnlineBooking: boolean;
  bookingBufferMinutes: number;
  maxConcurrentBookings: number;
  requireCustomerInfo: boolean;
}

export default function BookingSettingsStep({ 
  salonId, 
  initialData, 
  onComplete, 
  isCompleted 
}: BookingSettingsStepProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    advanceBookingDays: 30,
    cancellationHours: 24,
    requireDeposit: false,
    depositAmount: 0,
    depositType: "fixed",
    allowOnlineBooking: true,
    bookingBufferMinutes: 15,
    maxConcurrentBookings: 1,
    requireCustomerInfo: true,
    ...initialData
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing booking settings
  const { data: bookingSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/salons', salonId, 'booking-settings'],
    enabled: !!salonId,
  });

  // Mapping functions to convert between database and form formats
  const mapDatabaseToForm = (dbData: any): Partial<BookingFormData> => {
    if (!dbData) return {};
    
    return {
      advanceBookingDays: dbData.maxAdvanceBookingDays ?? 30,
      cancellationHours: dbData.cancelWindowMinutes ? Math.round(dbData.cancelWindowMinutes / 60) : 24,
      bookingBufferMinutes: dbData.bufferMinutes ?? 15,
      requireDeposit: (dbData.depositPercentage ?? 0) > 0,
      depositAmount: dbData.depositPercentage ?? 0,
      depositType: "percentage", // Default to percentage since DB stores depositPercentage
      allowOnlineBooking: dbData.autoConfirm === 1,
      maxConcurrentBookings: 1, // Not in DB schema, keep default
      requireCustomerInfo: true, // Not in DB schema, keep default
    };
  };

  const mapFormToDatabase = (formData: BookingFormData) => {
    return {
      maxAdvanceBookingDays: formData.advanceBookingDays,
      cancelWindowMinutes: formData.cancellationHours * 60, // Convert hours to minutes
      bufferMinutes: formData.bookingBufferMinutes,
      depositPercentage: formData.requireDeposit ? formData.depositAmount : 0,
      autoConfirm: formData.allowOnlineBooking ? 1 : 0,
      allowCancellation: 1, // Default to allowing cancellations
      allowRescheduling: 1, // Default to allowing rescheduling
    };
  };

  // Populate form with existing data
  useEffect(() => {
    if (bookingSettings) {
      const mappedData = mapDatabaseToForm(bookingSettings);
      setFormData((prev: BookingFormData) => ({
        ...prev,
        ...mappedData
      }));
    }
  }, [bookingSettings]);

  // Save booking settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const dbFormatData = mapFormToDatabase(data);
      const response = await apiRequest('POST', `/api/salons/${salonId}/booking-settings`, dbFormatData);
      return response.json();
    },
    onSuccess: (savedData) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/salons', salonId, 'booking-settings'] 
      });
      // Update local state with saved data mapped back to form format
      const mappedSavedData = mapDatabaseToForm(savedData);
      setFormData((prev: BookingFormData) => ({ ...prev, ...mappedSavedData }));
      onComplete(savedData);
      toast({
        title: "Booking Settings Saved",
        description: "Your booking policies have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save booking settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await saveSettingsMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Failed to save booking settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: BookingFormData) => ({ ...prev, [field]: value }));
  };

  if (isLoadingSettings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Set your booking policies</h3>
            <p className="text-muted-foreground">Loading your current settings...</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-48 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-32 bg-muted/50 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Set your booking policies</h3>
          <p className="text-muted-foreground">
            Configure how customers can book appointments with your business
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Online Booking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Allow Online Booking
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let customers book appointments through your online platform
                </p>
              </div>
              <Switch
                checked={formData.allowOnlineBooking}
                onCheckedChange={(checked) => handleInputChange('allowOnlineBooking', checked)}
                data-testid="switch-online-booking"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Require Customer Information
                </Label>
                <p className="text-sm text-muted-foreground">
                  Collect customer details for appointments
                </p>
              </div>
              <Switch
                checked={formData.requireCustomerInfo}
                onCheckedChange={(checked) => handleInputChange('requireCustomerInfo', checked)}
                data-testid="switch-customer-info"
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking Time Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time & Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="advance-booking" className="text-sm font-medium">
                  Advance Booking (Days)
                </Label>
                <Input
                  id="advance-booking"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.advanceBookingDays}
                  onChange={(e) => handleInputChange('advanceBookingDays', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-advance-booking"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How far in advance can customers book?
                </p>
              </div>

              <div>
                <Label htmlFor="cancellation-hours" className="text-sm font-medium">
                  Cancellation Notice (Hours)
                </Label>
                <Input
                  id="cancellation-hours"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.cancellationHours}
                  onChange={(e) => handleInputChange('cancellationHours', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-cancellation-hours"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum notice required for cancellations
                </p>
              </div>

              <div>
                <Label htmlFor="buffer-minutes" className="text-sm font-medium">
                  Booking Buffer (Minutes)
                </Label>
                <Input
                  id="buffer-minutes"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.bookingBufferMinutes}
                  onChange={(e) => handleInputChange('bookingBufferMinutes', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-buffer-minutes"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Buffer time between appointments
                </p>
              </div>

              <div>
                <Label htmlFor="max-concurrent" className="text-sm font-medium">
                  Max Concurrent Bookings
                </Label>
                <Input
                  id="max-concurrent"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxConcurrentBookings}
                  onChange={(e) => handleInputChange('maxConcurrentBookings', parseInt(e.target.value))}
                  className="mt-1"
                  data-testid="input-max-concurrent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum simultaneous appointments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Deposit & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Require Deposit
                </Label>
                <p className="text-sm text-muted-foreground">
                  Collect deposit when customers book appointments
                </p>
              </div>
              <Switch
                checked={formData.requireDeposit}
                onCheckedChange={(checked) => handleInputChange('requireDeposit', checked)}
                data-testid="switch-require-deposit"
              />
            </div>

            {formData.requireDeposit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="deposit-type" className="text-sm font-medium">
                    Deposit Type
                  </Label>
                  <Select 
                    value={formData.depositType} 
                    onValueChange={(value) => handleInputChange('depositType', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-deposit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                      <SelectItem value="percentage">Percentage of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deposit-amount" className="text-sm font-medium">
                    {formData.depositType === 'fixed' ? 'Deposit Amount ($)' : 'Deposit Percentage (%)'}
                  </Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    min="0"
                    max={formData.depositType === 'fixed' ? "1000" : "100"}
                    value={formData.depositAmount}
                    onChange={(e) => handleInputChange('depositAmount', parseFloat(e.target.value))}
                    className="mt-1"
                    data-testid="input-deposit-amount"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {isCompleted && (
              <span className="text-green-600 font-medium">✓ Completed</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || saveSettingsMutation.isPending}
            data-testid="button-save-booking-settings"
          >
            {isLoading || saveSettingsMutation.isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}