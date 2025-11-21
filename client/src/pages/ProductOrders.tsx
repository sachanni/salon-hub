import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package2,
  ArrowLeft,
  Search,
  Filter,
  Phone,
  MapPin,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  Truck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderSummary {
  new: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  fulfillmentType: 'delivery' | 'pickup';
  status: string;
  totalPaisa: number;
  itemCount: number;
  createdAt: string;
  deliveryAddress: string | null;
}

export default function ProductOrders() {
  const [, navigate] = useLocation();
  const { userSalons, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const salonId = userSalons?.[0]?.id;

  // Auth/salon loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
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
              You need to be associated with a salon to view orders
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

  // Fetch order summary
  const { data: summary, isLoading: summaryLoading } = useQuery<OrderSummary>({
    queryKey: ['/api/admin/salons', salonId, 'product-orders/summary'],
    enabled: !!salonId,
  });

  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/salons', salonId, 'product-orders', { status: activeTab, search: searchQuery }],
    enabled: !!salonId,
  });

  const formatPrice = (paisa: number) => `₹${(paisa / 100).toFixed(2)}`;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      pending: { label: 'New', variant: 'default' },
      confirmed: { label: 'Confirmed', variant: 'default' },
      processing: { label: 'Preparing', variant: 'secondary' },
      shipped: { label: 'Shipped', variant: 'secondary' },
      out_for_delivery: { label: 'Out for Delivery', variant: 'secondary' },
      delivered: { label: 'Delivered', variant: 'default' },
      cancelled: { label: 'Cancelled', variant: 'destructive' },
      refunded: { label: 'Refunded', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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
          <div>
            <h1 className="text-3xl font-bold">Product Orders</h1>
            <p className="text-muted-foreground mt-1">
              Manage customer product orders and fulfillment
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="hover-elevate">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="summary-new">
                  {summary?.new || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Preparing</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="summary-preparing">
                  {summary?.preparing || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ready</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid="summary-ready">
                  {summary?.ready || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="summary-delivered">
                  {summary?.delivered || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-muted-foreground" data-testid="summary-cancelled">
                  {summary?.cancelled || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number, customer name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-orders"
              />
            </div>
            <Button variant="outline" data-testid="button-filter">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="new" data-testid="tab-new">New</TabsTrigger>
              <TabsTrigger value="in-progress" data-testid="tab-in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="delivered" data-testid="tab-delivered">Delivered</TabsTrigger>
              <TabsTrigger value="cancelled" data-testid="tab-cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card 
                      key={order.id} 
                      className="hover-elevate cursor-pointer"
                      onClick={() => navigate(`/business/orders/${order.id}`)}
                      data-testid={`card-order-${order.id}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold" data-testid={`text-order-number-${order.id}`}>
                                Order #{order.orderNumber}
                              </h3>
                              {getStatusBadge(order.status)}
                              {order.fulfillmentType === 'delivery' ? (
                                <Badge variant="outline">
                                  <Truck className="w-3 h-3 mr-1" />
                                  Delivery
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Store className="w-3 h-3 mr-1" />
                                  Pickup
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">{order.customerName || 'Guest'}</span>
                              </div>
                              {order.customerPhone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {order.customerPhone}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                              </div>
                            </div>

                            {order.fulfillmentType === 'delivery' && order.deliveryAddress && (
                              <div className="flex items-start gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{order.deliveryAddress}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                              </div>
                              <div className="text-lg font-bold" data-testid={`text-order-total-${order.id}`}>
                                {formatPrice(order.totalPaisa)}
                              </div>
                            </div>

                            {order.status === 'pending' && (
                              <Button size="sm" data-testid={`button-accept-${order.id}`}>
                                Accept
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package2 className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                    <p className="text-muted-foreground text-center">
                      {searchQuery
                        ? 'No orders match your search'
                        : 'Orders will appear here once customers start purchasing'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
