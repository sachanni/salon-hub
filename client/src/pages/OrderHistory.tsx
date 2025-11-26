import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';

type OrderItem = {
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPriceInPaisa: number;
};

type ProductOrder = {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmountInPaisa: number;
  fulfillmentType: 'delivery' | 'pickup';
  createdAt: string;
  items: OrderItem[];
  itemCount: number;
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  confirmed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  processing: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
  shipped: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
  delivered: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
};

export default function OrderHistory() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('all');

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['/api/product-orders'],
  });

  // QueryClient auto-unwraps {success, data} response envelope
  const orders = ((ordersData as { orders?: ProductOrder[] })?.orders || []);

  // Filter orders by status
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return ['pending', 'confirmed', 'processing'].includes(order.status);
    if (activeTab === 'shipped') return order.status === 'shipped';
    if (activeTab === 'delivered') return order.status === 'delivered';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 bg-background border-b p-4">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Package className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 data-testid="text-empty-orders-title" className="text-2xl font-bold mb-2">
          No orders yet
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          You haven't placed any orders yet
        </p>
        <Button
          data-testid="button-start-shopping"
          onClick={() => navigate('/')}
        >
          Start Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b p-4">
        <h1 data-testid="text-orders-title" className="text-2xl font-bold">
          My Orders
        </h1>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-[73px] z-40 bg-background border-b">
          <TabsList className="w-full justify-start rounded-none bg-transparent h-auto p-0">
            <TabsTrigger
              data-testid="tab-all"
              value="all"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              All ({orders.length})
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-pending"
              value="pending"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Pending ({orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length})
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-shipped"
              value="shipped"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Shipped ({orders.filter(o => o.status === 'shipped').length})
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-delivered"
              value="delivered"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Delivered ({orders.filter(o => o.status === 'delivered').length})
            </TabsTrigger>
            <TabsTrigger
              data-testid="tab-cancelled"
              value="cancelled"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Cancelled ({orders.filter(o => o.status === 'cancelled').length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="p-4 space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No {activeTab} orders</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  data-testid={`order-card-${order.id}`}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p data-testid={`text-order-number-${order.id}`} className="font-semibold">
                          #{order.orderNumber}
                        </p>
                        <Badge
                          data-testid={`badge-status-${order.id}`}
                          className={STATUS_COLORS[order.status]}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex gap-2 mb-3 overflow-x-auto">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="w-16 h-16 bg-muted rounded-md flex-shrink-0 overflow-hidden">
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
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center text-xs font-medium">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} • {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'}
                      </p>
                      <p data-testid={`text-order-total-${order.id}`} className="font-bold text-lg">
                        ₹{(order.totalAmountInPaisa / 100).toFixed(0)}
                      </p>
                    </div>
                    <Button
                      data-testid={`button-view-details-${order.id}`}
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${order.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
