import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Package, Home, ArrowRight } from 'lucide-react';

type ProductOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmountInPaisa: number;
  fulfillmentType: 'delivery' | 'pickup';
  expectedDeliveryDate: string | null;
  createdAt: string;
  itemCount: number;
};

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [, navigate] = useLocation();

  // Fetch order details
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['/api/product-orders', orderId],
    enabled: !!orderId,
  });

  // QueryClient auto-unwraps {success, data} response envelope
  const order = (orderData as { order?: ProductOrder })?.order;

  // Animation effect
  useEffect(() => {
    // Could add confetti or celebration animation here
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Skeleton className="w-20 h-20 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          {/* Success Icon with Animation */}
          <div className="mb-6 relative">
            <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle2 
                data-testid="icon-success"
                className="w-16 h-16 text-green-600 dark:text-green-400" 
              />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto bg-green-100 dark:bg-green-900 rounded-full animate-ping opacity-20" />
          </div>

          {/* Success Message */}
          <h1 
            data-testid="text-success-title"
            className="text-2xl font-bold mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            Order Placed Successfully!
          </h1>
          <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Thank you for your order. We'll send you updates about your delivery.
          </p>

          {/* Order Details Card */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <div className="flex justify-between mb-3">
              <span className="text-sm text-muted-foreground">Order Number</span>
              <span 
                data-testid="text-order-number"
                className="font-mono font-semibold"
              >
                #{order.orderNumber}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span 
                data-testid="text-total-amount"
                className="font-bold text-lg"
              >
                ₹{(order.totalAmountInPaisa / 100).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-sm text-muted-foreground">Delivery Type</span>
              <span className="font-medium capitalize">
                {order.fulfillmentType}
              </span>
            </div>
            {order.expectedDeliveryDate && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Expected Delivery</span>
                <span 
                  data-testid="text-expected-delivery"
                  className="font-medium"
                >
                  {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Email Confirmation Message */}
          <p className="text-sm text-muted-foreground mb-6 animate-in fade-in duration-700 delay-300">
            A confirmation email has been sent to your registered email address
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <Button
              data-testid="button-view-order"
              size="lg"
              className="w-full"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              View Order Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              data-testid="button-continue-shopping"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t text-sm text-muted-foreground animate-in fade-in duration-700 delay-500">
            <p>
              You can track your order status from <span className="font-medium">My Orders</span> section
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
