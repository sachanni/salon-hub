import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  ArrowLeft,
  Truck,
  Store,
  MapPin,
  DollarSign,
  Save,
  Plus,
  X,
  CheckCircle2
} from 'lucide-react';

const deliverySettingsSchema = z.object({
  enableHomeDelivery: z.boolean(),
  deliveryChargeInPaisa: z.number().int().min(0),
  freeDeliveryThresholdInPaisa: z.number().int().min(0).optional(),
  deliveryRadiusKm: z.number().min(0).max(100).optional(),
  estimatedDeliveryDays: z.number().int().min(1).max(30),
  enableSalonPickup: z.boolean(),
  pickupInstructions: z.string().max(500).optional(),
  returnPolicyDays: z.number().int().min(0).max(90),
  returnPolicyText: z.string().max(1000).optional(),
  refundProcessingDays: z.number().int().min(1).max(30),
});

type DeliverySettingsForm = z.infer<typeof deliverySettingsSchema>;

interface DeliverySettings extends DeliverySettingsForm {
  id: string;
  salonId: string;
  eligiblePincodes: string[];
  updatedAt: string;
}

export default function DeliverySettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { userSalons, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const salonId = userSalons?.[0]?.id;

  // Auth/salon loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // No salon access - redirect or show message
  if (!isAuthenticated || !salonId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Salon Access</CardTitle>
            <CardDescription>
              You need to be associated with a salon to manage delivery settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {!isAuthenticated 
                ? "Please log in to continue" 
                : "You don't have access to any salons. Please contact your administrator."}
            </p>
            <div className="flex gap-2">
              {!isAuthenticated ? (
                <Button onClick={() => navigate('/login')} data-testid="button-login">
                  Go to Login
                </Button>
              ) : (
                <Button onClick={() => navigate('/')} data-testid="button-home">
                  Go to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch delivery settings
  const { data: settings, isLoading } = useQuery<DeliverySettings>({
    queryKey: ['/api/admin/salons', salonId, 'delivery-settings'],
    enabled: !!salonId,
  });

  // Form setup
  const form = useForm<DeliverySettingsForm>({
    resolver: zodResolver(deliverySettingsSchema),
    values: settings ? {
      enableHomeDelivery: settings.enableHomeDelivery,
      deliveryChargeInPaisa: settings.deliveryChargeInPaisa,
      freeDeliveryThresholdInPaisa: settings.freeDeliveryThresholdInPaisa,
      deliveryRadiusKm: settings.deliveryRadiusKm,
      estimatedDeliveryDays: settings.estimatedDeliveryDays,
      enableSalonPickup: settings.enableSalonPickup,
      pickupInstructions: settings.pickupInstructions,
      returnPolicyDays: settings.returnPolicyDays,
      returnPolicyText: settings.returnPolicyText,
      refundProcessingDays: settings.refundProcessingDays,
    } : {
      enableHomeDelivery: true,
      deliveryChargeInPaisa: 5000, // ₹50
      freeDeliveryThresholdInPaisa: 99900, // ₹999
      deliveryRadiusKm: 10,
      estimatedDeliveryDays: 3,
      enableSalonPickup: true,
      pickupInstructions: '',
      returnPolicyDays: 7,
      returnPolicyText: '',
      refundProcessingDays: 7,
    },
  });

  // Update settings mutation with optimistic update
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: DeliverySettingsForm) => {
      const res = await fetch(`/api/admin/salons/${salonId}/delivery-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/admin/salons', salonId, 'delivery-settings'] });
      
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(['/api/admin/salons', salonId, 'delivery-settings']);
      
      // Optimistically update settings
      queryClient.setQueryData(
        ['/api/admin/salons', salonId, 'delivery-settings'],
        (old: DeliverySettings | undefined) => {
          if (!old) return old;
          return { ...old, ...data };
        }
      );
      
      return { previousSettings };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons', salonId, 'delivery-settings'] });
      toast({
        title: 'Success',
        description: 'Delivery settings updated successfully',
      });
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          ['/api/admin/salons', salonId, 'delivery-settings'],
          context.previousSettings
        );
      }
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: DeliverySettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  const formatPrice = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/business/products')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Delivery & Fulfillment Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure how customers receive their product orders
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Home Delivery Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Home Delivery
                </CardTitle>
                <CardDescription>
                  Configure delivery charges, radius, and estimated delivery time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="enableHomeDelivery"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Home Delivery</FormLabel>
                        <FormDescription>
                          Allow customers to get products delivered to their address
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-enable-delivery"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('enableHomeDelivery') && (
                  <>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deliveryChargeInPaisa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Charge (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50.00"
                                {...field}
                                value={field.value ? field.value / 100 : ''}
                                onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || '0') * 100))}
                                data-testid="input-delivery-charge"
                              />
                            </FormControl>
                            <FormDescription>
                              Standard delivery fee per order
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="freeDeliveryThresholdInPaisa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Free Delivery Above (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="999.00"
                                {...field}
                                value={field.value ? field.value / 100 : ''}
                                onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || '0') * 100))}
                                data-testid="input-free-delivery-threshold"
                              />
                            </FormControl>
                            <FormDescription>
                              Order value for free delivery (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryRadiusKm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Radius (km)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseFloat(e.target.value || '0'))}
                                data-testid="input-delivery-radius"
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum distance for delivery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estimatedDeliveryDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Delivery (days)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="3"
                                {...field}
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value || '1'))}
                                data-testid="input-estimated-days"
                              />
                            </FormControl>
                            <FormDescription>
                              Expected delivery timeframe
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Eligible Pincodes
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add pincodes where delivery is available (optional - leave empty for radius-based delivery)
                      </p>
                      {settings?.eligiblePincodes && settings.eligiblePincodes.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {settings.eligiblePincodes.map((pincode, index) => (
                            <Badge key={index} variant="secondary">
                              {pincode}
                              <button className="ml-2 hover:text-destructive" data-testid={`button-remove-pincode-${index}`}>
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-3">No pincodes configured</p>
                      )}
                      <Button type="button" variant="outline" size="sm" data-testid="button-add-pincode">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Pincode
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Salon Pickup Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Salon Pickup
                </CardTitle>
                <CardDescription>
                  Allow customers to pick up orders from your salon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="enableSalonPickup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Salon Pickup</FormLabel>
                        <FormDescription>
                          Let customers collect their orders from your salon
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-enable-pickup"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('enableSalonPickup') && (
                  <>
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="pickupInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g., Visit our reception desk with your order number..."
                              className="min-h-[100px]"
                              {...field}
                              data-testid="textarea-pickup-instructions"
                            />
                          </FormControl>
                          <FormDescription>
                            Instructions for customers picking up their orders (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">Pickup Benefits</p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            Save on delivery costs and offer instant availability for local customers. Great for building customer relationships!
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Return & Refund Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Return & Refund Policy
                </CardTitle>
                <CardDescription>
                  Configure your product return and refund policy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="returnPolicyDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Window (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="7"
                            {...field}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value || '0'))}
                            data-testid="input-return-days"
                          />
                        </FormControl>
                        <FormDescription>
                          Days allowed for returns (0 for no returns)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="refundProcessingDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refund Processing (days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="7"
                            {...field}
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value || '1'))}
                            data-testid="input-refund-days"
                          />
                        </FormControl>
                        <FormDescription>
                          Time to process refunds
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="returnPolicyText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Policy Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your return policy, conditions, and process..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-return-policy"
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed return policy text shown to customers (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                data-testid="button-reset-form"
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
