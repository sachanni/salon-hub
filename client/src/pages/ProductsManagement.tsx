import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  TrendingUp,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Settings
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  imageUrl: string | null;
  stock: number;
  availableForRetail: boolean;
  retailPriceInPaisa: number | null;
  retailStockAllocated: number | null;
  category: {
    id: string;
    name: string;
  } | null;
}

interface ProductsStats {
  totalProducts: number;
  retailEnabled: number;
  lowStock: number;
  ordersToday: number;
}

export default function ProductsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { userSalons, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Get salon ID from user's first salon (or allow selection if multiple)
  const salonId = userSalons?.[0]?.id;

  // Auth/salon loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // No salon access - redirect to salon setup or show message
  if (!isAuthenticated || !salonId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>No Salon Access</CardTitle>
            <CardDescription>
              You need to be associated with a salon to access product management
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

  // Fetch product stats
  const { data: stats, isLoading: statsLoading } = useQuery<ProductsStats>({
    queryKey: ['/api/admin/salons', salonId, 'products/stats'],
    enabled: !!salonId,
  });

  // Fetch products list
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/salons', salonId, 'products/retail', { tab: activeTab, search: searchQuery }],
    enabled: !!salonId,
  });

  // Toggle retail availability mutation with optimistic update
  const toggleRetailMutation = useMutation({
    mutationFn: async ({ productId, enabled }: { productId: string; enabled: boolean }) => {
      const res = await fetch(`/api/admin/salons/${salonId}/products/${productId}/retail-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableForRetail: enabled }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    onMutate: async ({ productId, enabled }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/admin/salons', salonId, 'products/retail'] });
      
      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(['/api/admin/salons', salonId, 'products/retail', { tab: activeTab, search: searchQuery }]);
      
      // Optimistically update product
      queryClient.setQueryData(
        ['/api/admin/salons', salonId, 'products/retail', { tab: activeTab, search: searchQuery }],
        (old: Product[] | undefined) => {
          if (!old) return old;
          return old.map(p => p.id === productId ? { ...p, availableForRetail: enabled } : p);
        }
      );
      
      return { previousProducts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons', salonId, 'products/retail'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons', salonId, 'products/stats'] });
      toast({
        title: 'Success',
        description: 'Product retail status updated',
      });
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(
          ['/api/admin/salons', salonId, 'products/retail', { tab: activeTab, search: searchQuery }],
          context.previousProducts
        );
      }
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (paisa: number | null) => {
    if (!paisa) return '₹0';
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', variant: 'destructive' as const };
    if (stock < 10) return { text: 'Low Stock', variant: 'secondary' as const };
    return { text: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Products Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your retail product catalog and inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/business/orders')}
              data-testid="button-view-orders"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Orders
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/business/settings/${salonId}`)}
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => navigate('/inventory')}
              data-testid="button-add-product"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="stat-total-products">
                    {stats?.totalProducts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    In your inventory
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retail Enabled</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="stat-retail-enabled">
                    {stats?.retailEnabled || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available for online sale
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="stat-low-stock">
                    {stats?.lowStock || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Need restocking
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="stat-orders-today">
                    {stats?.ordersToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Product orders
                  </p>
                </>
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
                placeholder="Search products by name, SKU, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-products"
              />
            </div>
            <Button variant="outline" data-testid="button-filter">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" data-testid="tab-all-products">
                All Products
              </TabsTrigger>
              <TabsTrigger value="retail-enabled" data-testid="tab-retail-enabled">
                Retail Enabled
              </TabsTrigger>
              <TabsTrigger value="retail-disabled" data-testid="tab-retail-disabled">
                Retail Disabled
              </TabsTrigger>
              <TabsTrigger value="out-of-stock" data-testid="tab-out-of-stock">
                Out of Stock
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-48 w-full mb-4" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : products && products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.retailStockAllocated || 0);
                    return (
                      <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.id}`}>
                        <CardContent className="p-4">
                          <div className="aspect-square relative mb-4 rounded-md overflow-hidden bg-muted">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-muted-foreground" />
                              </div>
                            )}
                            {product.category && (
                              <Badge className="absolute top-2 right-2" variant="secondary">
                                {product.category.name}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold line-clamp-1" data-testid={`text-product-name-${product.id}`}>
                                {product.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {product.sku ? `SKU: ${product.sku}` : 'No SKU'}
                                {product.brand && ` • ${product.brand}`}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-lg font-bold" data-testid={`text-price-${product.id}`}>
                                  {formatPrice(product.retailPriceInPaisa)}
                                </div>
                                <Badge variant={stockStatus.variant} className="text-xs">
                                  {product.retailStockAllocated || 0} units
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Retail:</span>
                                <Switch
                                  checked={product.availableForRetail}
                                  onCheckedChange={(enabled) =>
                                    toggleRetailMutation.mutate({
                                      productId: product.id,
                                      enabled,
                                    })
                                  }
                                  disabled={toggleRetailMutation.isPending}
                                  data-testid={`switch-retail-${product.id}`}
                                />
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/business/products/${product.id}`)}
                                  data-testid={`button-view-${product.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/inventory/products/${product.id}`)}
                                  data-testid={`button-edit-${product.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products found</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'Start by adding products to your inventory'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => navigate('/inventory')} data-testid="button-add-first-product">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Product
                      </Button>
                    )}
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
