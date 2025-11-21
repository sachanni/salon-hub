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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Package,
  ArrowLeft,
  Save,
  TrendingUp,
  Star,
  Eye,
  ShoppingCart,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const retailConfigSchema = z.object({
  availableForRetail: z.boolean(),
  retailPriceInPaisa: z.number().int().positive().optional(),
  retailStockAllocated: z.number().int().min(0).optional(),
  retailDescription: z.string().optional(),
  featured: z.boolean().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

type RetailConfigForm = z.infer<typeof retailConfigSchema>;

interface Product {
  id: string;
  name: string;
  sku: string | null;
  brand: string | null;
  imageUrl: string | null;
  stock: number;
  costPriceInPaisa: number | null;
  availableForRetail: boolean;
  retailPriceInPaisa: number | null;
  retailStockAllocated: number | null;
  retailDescription: string | null;
  featured: boolean | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: {
    id: string;
    name: string;
  } | null;
}

export default function ProductDetailAdmin() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/business/products/:productId');
  const { toast } = useToast();
  const { userSalons, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  
  const productId = params?.productId;
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
              You need to be associated with a salon to manage products
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

  // Fetch product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ['/api/products', productId],
    enabled: !!productId,
  });

  // Form setup
  const form = useForm<RetailConfigForm>({
    resolver: zodResolver(retailConfigSchema),
    values: product ? {
      availableForRetail: product.availableForRetail,
      retailPriceInPaisa: product.retailPriceInPaisa || undefined,
      retailStockAllocated: product.retailStockAllocated || undefined,
      retailDescription: product.retailDescription || undefined,
      featured: product.featured || false,
      metaTitle: product.metaTitle || undefined,
      metaDescription: product.metaDescription || undefined,
    } : undefined,
  });

  // Update retail config mutation with optimistic update
  const updateConfigMutation = useMutation({
    mutationFn: async (data: RetailConfigForm) => {
      const res = await fetch(`/api/admin/salons/${salonId}/products/${productId}/retail-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/products', productId] });
      
      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(['/api/products', productId]);
      
      // Optimistically update product
      queryClient.setQueryData(
        ['/api/products', productId],
        (old: Product | undefined) => {
          if (!old) return old;
          return { ...old, ...data };
        }
      );
      
      return { previousProduct };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salons', salonId, 'products/retail'] });
      toast({
        title: 'Success',
        description: 'Product retail configuration updated successfully',
      });
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(['/api/products', productId], context.previousProduct);
      }
      toast({
        title: 'Error',
        description: 'Failed to update product configuration',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: RetailConfigForm) => {
    updateConfigMutation.mutate(data);
  };

  const formatPrice = (paisa: number | null) => {
    if (!paisa) return '₹0';
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const calculateMargin = (cost: number | null, retail: number | null) => {
    if (!cost || !retail || cost === 0) return '0%';
    const margin = ((retail - cost) / retail) * 100;
    return `${margin.toFixed(2)}%`;
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Product not found</h3>
              <Button onClick={() => navigate('/business/products')} className="mt-4">
                Back to Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-1">
              {product.sku ? `SKU: ${product.sku}` : 'No SKU'}
              {product.brand && ` • ${product.brand}`}
            </p>
          </div>
          {product.availableForRetail && (
            <Badge variant="default" className="h-7">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Retail Enabled
            </Badge>
          )}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">
              Details
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">
              Reviews
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Image */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">Product Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {product.category && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Category</p>
                      <Badge variant="secondary">{product.category.name}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing & Stock Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing & Stock</CardTitle>
                    <CardDescription>View pricing details and stock allocation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Cost Price (Internal)</p>
                        <p className="text-2xl font-bold" data-testid="text-cost-price">
                          {formatPrice(product.costPriceInPaisa)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Retail Price</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-retail-price">
                          {formatPrice(product.retailPriceInPaisa)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Margin</p>
                        <p className="text-2xl font-bold" data-testid="text-margin">
                          {calculateMargin(product.costPriceInPaisa, product.retailPriceInPaisa)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Stock</p>
                        <p className="text-xl font-semibold" data-testid="text-total-stock">
                          {product.stock} units
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Reserved for Services</p>
                        <p className="text-xl font-semibold" data-testid="text-service-stock">
                          {product.stock - (product.retailStockAllocated || 0)} units
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Available for Retail</p>
                        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400" data-testid="text-retail-stock">
                          {product.retailStockAllocated || 0} units
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Retail Configuration Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Retail Settings</CardTitle>
                    <CardDescription>Configure how this product appears to customers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="availableForRetail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Available for Retail</FormLabel>
                                <FormDescription>
                                  Make this product available for online purchase
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-available-retail"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Featured Product</FormLabel>
                                <FormDescription>
                                  Display this product prominently to customers
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-featured"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="retailPriceInPaisa"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Retail Price (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="450.00"
                                    {...field}
                                    value={field.value ? field.value / 100 : ''}
                                    onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value || '0') * 100))}
                                    data-testid="input-retail-price"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="retailStockAllocated"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Retail Stock Allocation</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="15"
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(parseInt(e.target.value || '0'))}
                                    data-testid="input-retail-stock"
                                  />
                                </FormControl>
                                <FormDescription>
                                  Max: {product.stock} units available
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="retailDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Retail Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe this product for customers..."
                                  className="min-h-[100px]"
                                  {...field}
                                  data-testid="textarea-retail-description"
                                />
                              </FormControl>
                              <FormDescription>
                                Customer-facing product description
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="metaTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Product name - Category | Your Salon"
                                  {...field}
                                  data-testid="input-meta-title"
                                />
                              </FormControl>
                              <FormDescription>
                                Optimized title for search engines (max 200 chars)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="metaDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SEO Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Brief description for search results..."
                                  {...field}
                                  data-testid="textarea-meta-description"
                                />
                              </FormControl>
                              <FormDescription>
                                Meta description for search engines (max 500 chars)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={updateConfigMutation.isPending}
                            data-testid="button-save-config"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {updateConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹20,250</div>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-1">
                    4.5 <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">32 reviews</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Views</CardTitle>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">320</div>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Last 30 days performance</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                Chart will be implemented with recharts library
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
                <CardDescription>See what customers are saying about this product</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12 text-muted-foreground">
                Reviews integration coming soon
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
