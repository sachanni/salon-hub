import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle,
  MapPin,
  Phone,
  Mail,
  Copy,
  ShoppingCart 
} from 'lucide-react';

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  variantValue: string | null;
  quantity: number;
  unitPriceInPaisa: number;
  totalPriceInPaisa: number;
};

type DeliveryAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
};

type ProductOrder = {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  fulfillmentType: 'delivery' | 'pickup';
  deliveryAddress: DeliveryAddress | null;
  paymentMethod: string;
  paymentStatus: string;
  subtotalInPaisa: number;
  discountInPaisa: number;
  deliveryChargeInPaisa: number;
  taxInPaisa: number;
  totalAmountInPaisa: number;
  trackingNumber: string | null;
  courierPartner: string | null;
  expectedDeliveryDate: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note: string | null;
  }>;
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  confirmed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  processing: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  shipped: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
  delivered: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
};

const STATUS_ICONS = {
  pending: Package,
  confirmed: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch order details
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['/api/product-orders', orderId],
    enabled: !!orderId,
  });

  // QueryClient auto-unwraps {success, data} response envelope
  const order = (orderData as { order?: ProductOrder })?.order;

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PUT', `/api/product-orders/${orderId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/product-orders'] });
      toast({
        title: 'Order cancelled',
        description: 'Your order has been cancelled successfully',
      });
      setShowCancelDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel order',
        variant: 'destructive',
      });
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background border-b p-4">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <Button onClick={() => navigate('/orders')}>View All Orders</Button>
      </div>
    );
  }

  const canCancel = ['pending', 'confirmed'].includes(order.status);
  const StatusIcon = STATUS_ICONS[order.status];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b p-4 flex items-center gap-3">
        <Button
          data-testid="button-back"
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 data-testid="text-order-number" className="text-xl font-bold">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${STATUS_COLORS[order.status]}`}>
                <StatusIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <Badge data-testid="badge-order-status" className={STATUS_COLORS[order.status]}>
                  {order.status.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.status === 'delivered' && order.deliveredAt && 
                    `Delivered on ${new Date(order.deliveredAt).toLocaleDateString('en-IN')}`
                  }
                  {order.status === 'shipped' && order.expectedDeliveryDate &&
                    `Expected by ${new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN')}`
                  }
                  {order.status === 'processing' && 'Your order is being prepared'}
                  {order.status === 'confirmed' && 'Your order has been confirmed'}
                  {order.status === 'pending' && 'Waiting for confirmation'}
                  {order.status === 'cancelled' && 'This order was cancelled'}
                </p>
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="p-3 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Tracking Number</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(order.trackingNumber!, 'Tracking number')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p data-testid="text-tracking-number" className="font-mono text-sm">
                  {order.trackingNumber}
                </p>
                {order.courierPartner && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Courier: {order.courierPartner}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.statusHistory.map((history, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                    {index < order.statusHistory.length - 1 && (
                      <div className="w-0.5 h-8 bg-muted mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="font-medium capitalize">{history.status.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(history.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {history.note && (
                      <p className="text-sm text-muted-foreground mt-1">{history.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Delivery Address */}
        {order.fulfillmentType === 'delivery' && order.deliveryAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p data-testid="text-delivery-name" className="font-medium">
                {order.deliveryAddress.fullName}
              </p>
              <p className="text-sm mt-1">
                {order.deliveryAddress.addressLine1}
              </p>
              {order.deliveryAddress.addressLine2 && (
                <p className="text-sm">{order.deliveryAddress.addressLine2}</p>
              )}
              <p className="text-sm">
                {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {order.deliveryAddress.phone}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => (
              <div 
                key={item.id} 
                data-testid={`order-item-${item.id}`}
                className="flex gap-3 pb-3 border-b last:border-0"
              >
                <div className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No Img
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium line-clamp-2 mb-1">{item.productName}</h4>
                  {item.variantValue && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {item.variantValue}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ₹{(item.unitPriceInPaisa / 100).toFixed(0)}
                    </p>
                    <p className="font-semibold">
                      ₹{(item.totalPriceInPaisa / 100).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span data-testid="text-subtotal">
                ₹{(order.subtotalInPaisa / 100).toFixed(0)}
              </span>
            </div>
            {order.discountInPaisa > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span data-testid="text-discount">
                  -₹{(order.discountInPaisa / 100).toFixed(0)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Delivery Charge</span>
              <span data-testid="text-delivery-charge">
                {order.deliveryChargeInPaisa === 0 ? (
                  <span className="text-green-600 dark:text-green-400">FREE</span>
                ) : (
                  `₹${(order.deliveryChargeInPaisa / 100).toFixed(0)}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (GST)</span>
              <span data-testid="text-tax">
                ₹{(order.taxInPaisa / 100).toFixed(0)}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Paid</span>
              <span data-testid="text-total">
                ₹{(order.totalAmountInPaisa / 100).toFixed(0)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Payment Method: {order.paymentMethod} • Status: {order.paymentStatus}
            </p>
          </CardContent>
        </Card>

        {/* Need Help */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Contact our support team for any assistance
            </p>
            <div className="flex gap-2">
              <Button
                data-testid="button-contact-support"
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
              <Button
                data-testid="button-call-support"
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="flex gap-3">
          {canCancel && (
            <Button
              data-testid="button-cancel-order"
              variant="outline"
              className="flex-1"
              onClick={() => setShowCancelDialog(true)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Order
            </Button>
          )}
          {order.status === 'delivered' && (
            <Button
              data-testid="button-reorder"
              className="flex-1"
              onClick={() => {
                // Add all items to cart
                toast({
                  title: 'Coming soon',
                  description: 'Reorder functionality will be available soon',
                });
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Reorder
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-dialog-no">
              No, Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-cancel-dialog-yes"
              onClick={() => cancelOrderMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
