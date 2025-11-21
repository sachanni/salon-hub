import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  MapPin,
  Package,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Store
} from 'lucide-react';
import { format } from 'date-fns';

const updateStatusSchema = z.object({
  status: z.enum(['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']),
  trackingNumber: z.string().max(100).optional(),
  courierPartner: z.string().max(100).optional(),
  notes: z.string().optional(),
});

type UpdateStatusForm = z.infer<typeof updateStatusSchema>;

const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

type CancelOrderForm = z.infer<typeof cancelOrderSchema>;

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPricePaisa: number;
  totalPaisa: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  fulfillmentType: 'delivery' | 'pickup';
  status: string;
  deliveryAddress: string | null;
  totalPaisa: number;
  subtotalPaisa: number;
  deliveryChargePaisa: number;
  taxPaisa: number;
  discountPaisa: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string | null;
  trackingNumber: string | null;
  courierPartner: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailAdmin() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/business/orders/:orderId');
  const { toast } = useToast();
  const { userSalons, isLoading: authLoading, isAuthenticated } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const orderId = params?.orderId;
  const salonId = userSalons?.[0]?.id;

  // Auth/salon loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-96" />
            <Skeleton className="h-96" />
          </div>
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
              You need to be associated with a salon to view order details
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

  // Fetch order details
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['/api/product-orders', orderId],
    enabled: !!orderId,
  });

  // Update status form
  const statusForm = useForm<UpdateStatusForm>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: 'confirmed',
      trackingNumber: '',
      courierPartner: '',
      notes: '',
    },
  });

  // Cancel form
  const cancelForm = useForm<CancelOrderForm>({
    resolver: zodResolver(cancelOrderSchema),
    defaultValues: {
      reason: '',
    },
  });

  // Update order status mutation with optimistic update
  const updateStatusMutation = useMutation({
    mutationFn: async (data: UpdateStatusForm) => {
      const res = await fetch(`/api/admin/salons/${salonId}/product-orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update order status');
      return res.json();
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/product-orders', orderId] });
      
      // Snapshot previous value
      const previousOrder = queryClient.getQueryData(['/api/product-orders', orderId]);
      
      // Optimistically update order status
      queryClient.setQueryData(
        ['/api/product-orders', orderId],
        (old: Order | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: data.status,
            trackingNumber: data.trackingNumber || old.trackingNumber,
            courierPartner: data.courierPartner || old.courierPartner,
          };
        }
      );
      
      return { previousOrder };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons', salonId, 'product-orders'] });
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });
      statusForm.reset();
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(['/api/product-orders', orderId], context.previousOrder);
      }
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    },
  });

  // Cancel order mutation with optimistic update
  const cancelOrderMutation = useMutation({
    mutationFn: async (data: CancelOrderForm) => {
      const res = await fetch(`/api/admin/salons/${salonId}/product-orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel order');
      return res.json();
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/product-orders', orderId] });
      
      // Snapshot previous value
      const previousOrder = queryClient.getQueryData(['/api/product-orders', orderId]);
      
      // Optimistically update order to cancelled
      queryClient.setQueryData(
        ['/api/product-orders', orderId],
        (old: Order | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: 'cancelled',
          };
        }
      );
      
      return { previousOrder };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons', salonId, 'product-orders'] });
      toast({
        title: 'Success',
        description: 'Order cancelled successfully',
      });
      setShowCancelDialog(false);
      cancelForm.reset();
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(['/api/product-orders', orderId], context.previousOrder);
      }
      toast({
        title: 'Error',
        description: 'Failed to cancel order',
        variant: 'destructive',
      });
    },
  });

  const onUpdateStatus = (data: UpdateStatusForm) => {
    updateStatusMutation.mutate(data);
  };

  const onCancelOrder = (data: CancelOrderForm) => {
    cancelOrderMutation.mutate(data);
  };

  const formatPrice = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;

  const calculateCommission = (total: number) => {
    const platformFee = Math.round(total * 0.10); // 10% platform fee
    const earnings = total - platformFee;
    return { platformFee, earnings };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order not found</h3>
              <Button onClick={() => navigate('/business/orders')} className="mt-4">
                Back to Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const commission = calculateCommission(order.totalPaisa);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/business/orders')}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
            <p className="text-muted-foreground mt-1">
              Placed {format(new Date(order.createdAt), 'PPp')}
            </p>
          </div>
          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="h-7">
            {order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Customer Details
                  <div className="flex gap-2">
                    {order.customerPhone && (
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{order.customerName || 'Guest Customer'}</p>
                </div>
                {order.customerPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fulfillment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {order.fulfillmentType === 'delivery' ? (
                    <>
                      <Truck className="w-5 h-5" />
                      Delivery Details
                    </>
                  ) : (
                    <>
                      <Store className="w-5 h-5" />
                      Pickup Details
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.fulfillmentType === 'delivery' ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <p className="font-medium">{order.deliveryAddress || 'Not provided'}</p>
                      </div>
                    </div>
                    {order.trackingNumber && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tracking Number</p>
                        <p className="font-medium font-mono">{order.trackingNumber}</p>
                      </div>
                    )}
                    {order.courierPartner && (
                      <div>
                        <p className="text-sm text-muted-foreground">Courier Partner</p>
                        <p className="font-medium">{order.courierPartner}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">Customer will pick up from your salon</p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium">Pickup Code: {order.orderNumber.substring(0, 6)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask customer for this code at pickup
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.totalPaisa)}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(item.unitPricePaisa)} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(order.subtotalPaisa)}</span>
                  </div>
                  {order.deliveryChargePaisa > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Charge</span>
                      <span>{formatPrice(order.deliveryChargePaisa)}</span>
                    </div>
                  )}
                  {order.taxPaisa > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatPrice(order.taxPaisa)}</span>
                    </div>
                  )}
                  {order.discountPaisa > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discountPaisa)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{formatPrice(order.totalPaisa)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium uppercase">{order.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                {order.transactionId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction ID</p>
                    <p className="font-medium font-mono text-sm">{order.transactionId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions & Commission */}
          <div className="space-y-6">
            {/* Commission */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Order Total</p>
                  <p className="text-2xl font-bold">{formatPrice(order.totalPaisa)}</p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Platform Fee (10%)</p>
                  <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    -{formatPrice(commission.platformFee)}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Your Earnings</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatPrice(commission.earnings)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Update Status */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...statusForm}>
                    <form onSubmit={statusForm.handleSubmit(onUpdateStatus)} className="space-y-4">
                      <FormField
                        control={statusForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="confirmed" data-testid="option-status-confirmed">Confirmed</SelectItem>
                                <SelectItem value="processing" data-testid="option-status-processing">Processing</SelectItem>
                                <SelectItem value="shipped" data-testid="option-status-shipped">Shipped</SelectItem>
                                <SelectItem value="out_for_delivery" data-testid="option-status-out-for-delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered" data-testid="option-status-delivered">Delivered</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {statusForm.watch('status') === 'shipped' && (
                        <>
                          <FormField
                            control={statusForm.control}
                            name="trackingNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tracking Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter tracking number" {...field} data-testid="input-tracking" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={statusForm.control}
                            name="courierPartner"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Courier Partner</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., DHL, FedEx" {...field} data-testid="input-courier" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      <FormField
                        control={statusForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Add any notes..." {...field} data-testid="textarea-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={updateStatusMutation.isPending}
                        data-testid="button-update-status"
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Cancel Order */}
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" data-testid="button-cancel-order-trigger">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please provide a reason for cancelling this order.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Form {...cancelForm}>
                    <form onSubmit={cancelForm.handleSubmit(onCancelOrder)} className="space-y-4">
                      <FormField
                        control={cancelForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cancellation Reason</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Explain why this order is being cancelled..."
                                {...field}
                                data-testid="textarea-cancel-reason"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-dialog-close">Close</AlertDialogCancel>
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={cancelOrderMutation.isPending}
                          data-testid="button-confirm-cancel"
                        >
                          {cancelOrderMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
                        </Button>
                      </AlertDialogFooter>
                    </form>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
