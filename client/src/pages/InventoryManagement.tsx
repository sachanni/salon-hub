import { useState, useEffect } from 'react';
import * as React from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Package,
  Tags,
  Users,
  TrendingDown,
  FileText,
  Edit,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import { POListView } from '@/components/PurchaseOrders/POListView';
import { PODetailView } from '@/components/PurchaseOrders/PODetailView';
import { CreatePODialog } from '@/components/PurchaseOrders/CreatePODialog';

interface InventoryManagementProps {
  salonId?: string;
}

// Product form validation schema
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().nullable().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  // Vendor is optional - allow empty string and transform to null
  vendorId: z.union([
    z.literal('').transform(() => null),
    z.string().min(1)
  ]).nullable().optional(),
  brand: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  unitPrice: z.coerce.number().min(0, 'Unit price must be positive'),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock must be positive'),
  // Optional numeric fields that can be null or positive numbers
  maximumStock: z.union([
    z.literal('').transform(() => null),
    z.coerce.number().int().min(0, 'Maximum stock must be positive')
  ]).nullable().optional(),
  reorderPoint: z.union([
    z.literal('').transform(() => null),
    z.coerce.number().int().min(0, 'Reorder point must be positive')
  ]).nullable().optional(),
  isRetailItem: z.boolean(),
  retailPrice: z.union([
    z.literal('').transform(() => null),
    z.coerce.number().min(0, 'Retail price must be positive')
  ]).nullable().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function InventoryManagement({ salonId: propSalonId }: InventoryManagementProps) {
  const params = useParams();
  const salonId = propSalonId || params.salonId;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('products');

  // Categories
  const { data: categories = [], isLoading: loadingCategories } = useQuery<any[]>({
    queryKey: ['/api/salons', salonId, 'product-categories'],
    enabled: !!salonId,
  });

  const { data: vendors = [], isLoading: loadingVendors } = useQuery<any[]>({
    queryKey: ['/api/salons', salonId, 'vendors'],
    enabled: !!salonId,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ['/api/salons', salonId, 'products'],
    enabled: !!salonId,
  });

  const { data: stockMovements = [], isLoading: loadingMovements } = useQuery<any[]>({
    queryKey: ['/api/salons', salonId, 'stock-movements'],
    enabled: !!salonId,
  });

  const { data: purchaseOrders = [], isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: ['/api/salons', salonId, 'purchase-orders'],
    enabled: !!salonId,
  });

  if (!salonId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a Salon</CardTitle>
            <CardDescription>Please select a salon to manage its inventory</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const lowStockProducts = products.filter((p: any) => 
    p.currentStock <= (p.minimumStock || 0)
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage products, stock, vendors, and purchase orders</p>
        </div>
        
        {lowStockProducts.length > 0 && (
          <Badge variant="destructive" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            {lowStockProducts.length} Low Stock Alert{lowStockProducts.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter((p: any) => p.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              {categories.filter((c: any) => !c.parentId).length} parent categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground">
              {vendors.filter((v: any) => v.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <Tags className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="vendors" data-testid="tab-vendors">
            <Users className="h-4 w-4 mr-2" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">
            <BarChart3 className="h-4 w-4 mr-2" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Purchase Orders
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <ProductsTab 
            salonId={salonId} 
            products={products} 
            categories={categories}
            vendors={vendors}
            loading={loadingProducts}
          />
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <CategoriesTab 
            salonId={salonId} 
            categories={categories} 
            loading={loadingCategories}
          />
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <VendorsTab 
            salonId={salonId} 
            vendors={vendors} 
            loading={loadingVendors}
          />
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="stock" className="space-y-4">
          <StockMovementsTab 
            salonId={salonId} 
            products={products}
            movements={stockMovements}
            loading={loadingMovements}
          />
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <PurchaseOrdersTab 
            salonId={salonId} 
            vendors={vendors}
            products={products}
            orders={purchaseOrders}
            loading={loadingOrders}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Products Tab Component
function ProductsTab({ salonId, products, categories, vendors, loading }: any) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      vendorId: '',
      brand: '',
      description: '',
      unitPrice: 0,
      minimumStock: 0,
      maximumStock: null,
      reorderPoint: null,
      isRetailItem: false,
      retailPrice: null,
    },
  });

  // Reset form when editing product changes
  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        barcode: editingProduct.barcode || '',
        categoryId: editingProduct.categoryId || '',
        vendorId: editingProduct.vendorId || '',
        brand: editingProduct.brand || '',
        description: editingProduct.description || '',
        unitPrice: editingProduct.unitPrice ?? 0,
        minimumStock: editingProduct.minimumStock ?? 0,
        // Preserve null values for optional numeric fields
        maximumStock: editingProduct.maximumStock ?? null,
        reorderPoint: editingProduct.reorderPoint ?? null,
        isRetailItem: editingProduct.isRetailItem ?? false,
        retailPrice: editingProduct.retailPrice ?? null,
      });
    } else {
      form.reset({
        name: '',
        sku: '',
        barcode: '',
        categoryId: '',
        vendorId: '',
        brand: '',
        description: '',
        unitPrice: 0,
        minimumStock: 0,
        maximumStock: null,
        reorderPoint: null,
        isRetailItem: false,
        retailPrice: null,
      });
    }
  }, [editingProduct, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = `/api/salons/${salonId}/products`;
      return apiRequest('POST', url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'products'] });
      toast({ title: 'Product created successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const url = `/api/salons/${salonId}/products/${id}`;
      return apiRequest('PUT', url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'products'] });
      toast({ title: 'Product updated successfully' });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const url = `/api/salons/${salonId}/products/${productId}`;
      return apiRequest('DELETE', url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'products'] });
      toast({ title: 'Product deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    // Clean up empty strings to null for optional fields, preserving zero values
    const cleanedData = {
      ...data,
      barcode: data.barcode || null,
      vendorId: data.vendorId || null,
      brand: data.brand || null,
      description: data.description || null,
      // Preserve zero values for numeric fields
      maximumStock: typeof data.maximumStock === 'number' && data.maximumStock >= 0 ? data.maximumStock : null,
      reorderPoint: typeof data.reorderPoint === 'number' && data.reorderPoint >= 0 ? data.reorderPoint : null,
      retailPrice: typeof data.retailPrice === 'number' && data.retailPrice >= 0 ? data.retailPrice : null,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...cleanedData });
    } else {
      createProductMutation.mutate(cleanedData);
    }
  };

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory;
    const matchesVendor = filterVendor === 'all' || product.vendorId === filterVendor;
    const matchesLowStock = !showLowStock || product.currentStock <= (product.minimumStock || 0);
    
    return matchesSearch && matchesCategory && matchesVendor && matchesLowStock;
  });

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your inventory products</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingProduct(null);
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {editingProduct ? 'Update product details' : 'Create a new product in your inventory'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-product-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-product-sku" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat: any) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vendorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor">
                                  <SelectValue placeholder="Select vendor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">No vendor</SelectItem>
                                {vendors.filter((v: any) => v.status === 'active').map((vendor: any) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="brand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} data-testid="input-brand" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} data-testid="input-barcode" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} rows={3} data-testid="input-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price *</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" min="0" data-testid="input-unit-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minimumStock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Stock</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" min="0" data-testid="input-min-stock" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reorderPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reorder Point</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} type="number" min="0" data-testid="input-reorder-point" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isRetailItem"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Is Retail Item?</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value ? 'true' : 'false'}>
                              <FormControl>
                                <SelectTrigger data-testid="select-is-retail">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="false">No (Internal Use Only)</SelectItem>
                                <SelectItem value="true">Yes (Can be Sold to Customers)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="retailPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retail Price</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} type="number" step="0.01" min="0" data-testid="input-retail-price" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={form.formState.isSubmitting} data-testid="button-save-product">
                        {editingProduct ? 'Update Product' : 'Create Product'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-products"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterCategory">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filterCategory" data-testid="filter-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterVendor">Vendor</Label>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger id="filterVendor" data-testid="filter-vendor">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant={showLowStock ? 'default' : 'outline'}
                onClick={() => setShowLowStock(!showLowStock)}
                className="w-full"
                data-testid="button-filter-low-stock"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Low Stock Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No products found. Add your first product to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any) => {
                  const category = categories.find((c: any) => c.id === product.categoryId);
                  const vendor = vendors.find((v: any) => v.id === product.vendorId);
                  const isLowStock = product.currentStock <= (product.minimumStock || 0);

                  return (
                    <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{product.name}</div>
                          {product.brand && (
                            <div className="text-sm text-muted-foreground">{product.brand}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{category?.name || '-'}</TableCell>
                      <TableCell>{vendor?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? 'text-destructive font-bold' : ''}>
                            {product.currentStock}
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>₹{product.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsDialogOpen(true);
                            }}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product?')) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Categories Tab - Simplified version for brevity
function CategoriesTab({ salonId, categories, loading }: any) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const initDefaultsMutation = useMutation({
    mutationFn: async () => {
      const url = `/api/salons/${salonId}/product-categories/init-defaults`;
      return apiRequest('POST', url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'product-categories'] });
      toast({ title: 'Default categories created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = `/api/salons/${salonId}/product-categories`;
      return apiRequest('POST', url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'product-categories'] });
      toast({ title: 'Category created successfully' });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      parentId: formData.get('parentId') || null,
    };
    createCategoryMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Organize your products into categories</CardDescription>
            </div>
            <div className="flex gap-2">
              {categories.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => initDefaultsMutation.mutate()}
                  data-testid="button-init-defaults"
                >
                  <Tags className="h-4 w-4 mr-2" />
                  Initialize Defaults
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-category">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>Create a new product category</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Category Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        data-testid="input-category-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentId">Parent Category</Label>
                      <Select name="parentId">
                        <SelectTrigger data-testid="select-parent-category">
                          <SelectValue placeholder="None (Top Level)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None (Top Level)</SelectItem>
                          {categories.filter((c: any) => !c.parentId).map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={3}
                        data-testid="input-category-description"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" data-testid="button-save-category">
                        Create Category
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No categories found. Initialize default categories or create your own.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Products Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category: any) => {
                  const parent = categories.find((c: any) => c.id === category.parentId);
                  return (
                    <TableRow key={category.id} data-testid={`category-row-${category.id}`}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.description || '-'}</TableCell>
                      <TableCell>{parent?.name || 'Top Level'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.productsCount || 0}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Vendors, Stock Movements, and Purchase Orders tabs would follow similar patterns
// For brevity, I'll create simplified versions

function VendorsTab({ salonId, vendors, loading }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendors</CardTitle>
        <CardDescription>Manage your suppliers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground p-4">
          Vendor management UI - Similar pattern to products with create/edit/delete
        </div>
      </CardContent>
    </Card>
  );
}

function StockMovementsTab({ salonId, products, movements, loading }: any) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const stockMovementSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    type: z.enum(['receipt', 'adjustment', 'usage']),
    quantity: z.coerce.number().min(0.001, 'Quantity must be greater than 0'),
    reason: z.string().min(1, 'Reason is required'),
    notes: z.string().optional(),
  });

  const movementForm = useForm({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      productId: '',
      type: 'receipt' as const,
      quantity: 0,
      reason: '',
      notes: '',
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', `/api/salons/${salonId}/stock-movements`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'products'] });
      toast({ title: 'Stock movement recorded successfully' });
      setIsDialogOpen(false);
      movementForm.reset();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmitMovement = (data: any) => {
    createMovementMutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Stock Management</CardTitle>
              <CardDescription>Real-time stock tracking and movement history</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-stock-movement">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Movement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Record Stock Movement</DialogTitle>
                  <DialogDescription>
                    Add or adjust inventory stock levels
                  </DialogDescription>
                </DialogHeader>
                <Form {...movementForm}>
                  <form onSubmit={movementForm.handleSubmit(onSubmitMovement)} className="space-y-4">
                    <FormField
                      control={movementForm.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-movement-product">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product: any) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.sku}) - Current: {product.currentStock}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={movementForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Movement Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-movement-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="receipt">Receipt (Add Stock)</SelectItem>
                              <SelectItem value="adjustment">Adjustment (Correct Stock)</SelectItem>
                              <SelectItem value="usage">Usage (Remove Stock)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={movementForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.001" min="0" data-testid="input-movement-quantity" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={movementForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Initial stock, Vendor delivery, Damaged goods" data-testid="input-movement-reason" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={movementForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Additional details..." data-testid="input-movement-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={movementForm.formState.isSubmitting} data-testid="button-save-movement">
                        Record Movement
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground p-4">Loading stock movements...</div>
          ) : movements.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No stock movements yet</p>
              <p className="text-sm">Record your first stock movement to start tracking inventory changes</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement: any) => {
                  const product = products.find((p: any) => p.id === movement.productId);
                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product?.name || 'Unknown'}
                        <div className="text-xs text-muted-foreground">{product?.sku}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          movement.type === 'receipt' ? 'default' : 
                          movement.type === 'usage' ? 'destructive' : 
                          'secondary'
                        }>
                          {movement.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {movement.type === 'usage' ? '-' : '+'}{movement.quantity}
                      </TableCell>
                      <TableCell className="text-sm">{movement.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.notes || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PurchaseOrdersTab({ salonId, vendors, products, orders, loading }: any) {
  const [selectedPO, setSelectedPO] = React.useState(null);

  if (selectedPO) {
    return <PODetailView salonId={salonId} po={selectedPO} onBack={() => setSelectedPO(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreatePODialog salonId={salonId} onSuccess={() => {}} />
      </div>
      <POListView salonId={salonId} onSelectPO={setSelectedPO} />
    </div>
  );
}
