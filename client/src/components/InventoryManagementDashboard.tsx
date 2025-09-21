import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Barcode,
  Calculator,
  Clock,
  DollarSign,
  Truck,
  AlertCircle,
  FileText,
  Settings,
  Boxes,
  Building,
  ChevronRight,
  Minus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface InventoryManagementDashboardProps {
  salonId: string;
}

// Type definitions for inventory data
interface Vendor {
  id: string;
  salonId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  website?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  status: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductCategory {
  id: string;
  salonId: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  isActive: number;
  sortOrder: number;
  createdAt: Date;
}

interface Product {
  id: string;
  salonId: string;
  categoryId?: string;
  vendorId?: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  size?: string;
  unit: string;
  costPriceInPaisa: number;
  sellingPriceInPaisa?: number;
  currency: string;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  leadTimeDays: number;
  expiryDate?: Date;
  batchNumber?: string;
  barcode?: string;
  location?: string;
  isActive: number;
  isRetailItem: number;
  trackStock: number;
  lowStockAlert: number;
  notes?: string;
  tags: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface StockMovement {
  id: string;
  salonId: string;
  productId: string;
  type: string;
  quantity: number;
  unit: string;
  unitCostInPaisa?: number;
  totalCostInPaisa?: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  referenceId?: string;
  referenceType?: string;
  staffId?: string;
  notes?: string;
  batchNumber?: string;
  expiryDate?: Date;
  createdAt: Date;
}

interface PurchaseOrder {
  id: string;
  salonId: string;
  vendorId: string;
  orderNumber: string;
  status: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  subtotalInPaisa: number;
  taxInPaisa: number;
  shippingInPaisa: number;
  discountInPaisa: number;
  totalInPaisa: number;
  currency: string;
  paymentTerms?: string;
  paymentStatus: string;
  createdBy: string;
  approvedBy?: string;
  receivedBy?: string;
  notes?: string;
  internalNotes?: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryDashboardMetrics {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  reorderRequiredCount: number;
  expiringProductsCount: number;
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    stockValue: number;
  }>;
  recentMovements: Array<{
    id: string;
    productName: string;
    type: string;
    quantity: number;
    date: Date;
    staffName?: string;
  }>;
  monthlyUsageTrends: Array<{ month: string; usageValue: number; count: number }>;
  vendorPerformance: Array<{
    vendorId: string;
    vendorName: string;
    orderCount: number;
    totalValue: number;
    avgDeliveryTime: number;
    rating: number;
  }>;
}

// Form schemas
const vendorFormSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  website: z.string().optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

const productCategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  parentCategoryId: z.string().optional(),
  sortOrder: z.number().default(0),
});

const productFormSchema = z.object({
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  brand: z.string().optional(),
  size: z.string().optional(),
  unit: z.string().default("piece"),
  costPriceInPaisa: z.number().min(0, "Cost price must be 0 or greater"),
  sellingPriceInPaisa: z.number().optional(),
  minimumStock: z.number().min(0, "Minimum stock must be 0 or greater"),
  maximumStock: z.number().optional(),
  reorderPoint: z.number().optional(),
  reorderQuantity: z.number().optional(),
  leadTimeDays: z.number().default(7),
  location: z.string().optional(),
  isRetailItem: z.boolean().default(false),
  trackStock: z.boolean().default(true),
  lowStockAlert: z.boolean().default(true),
  notes: z.string().optional(),
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const formatCurrency = (paisa: number) => {
  const rupees = paisa / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(rupees);
};

const getStockLevelColor = (currentStock: number, minimumStock: number) => {
  if (currentStock <= 0) return 'text-red-600';
  if (currentStock <= minimumStock) return 'text-orange-600';
  return 'text-green-600';
};

const getStockLevelBadge = (currentStock: number, minimumStock: number) => {
  if (currentStock <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (currentStock <= minimumStock) return <Badge variant="secondary">Low Stock</Badge>;
  return <Badge variant="default">In Stock</Badge>;
};

export default function InventoryManagementDashboard({ salonId }: InventoryManagementDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dashboard metrics query
  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery<InventoryDashboardMetrics>({
    queryKey: ['/api/salons', salonId, 'inventory/dashboard'],
    staleTime: 30000
  });

  // Vendors query
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ['/api/salons', salonId, 'vendors'],
    staleTime: 60000
  });

  // Product categories query
  const { data: categories, isLoading: categoriesLoading } = useQuery<ProductCategory[]>({
    queryKey: ['/api/salons', salonId, 'product-categories'],
    staleTime: 60000
  });

  // Products query with filters
  const productsFilters = {
    ...(selectedCategory !== "all" && { categoryId: selectedCategory }),
    ...(selectedVendor !== "all" && { vendorId: selectedVendor }),
    ...(showLowStockOnly && { lowStock: true }),
    ...(searchTerm && { search: searchTerm }),
  };

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/salons', salonId, 'products', productsFilters],
    staleTime: 30000
  });

  // Low stock products query
  const { data: lowStockProducts } = useQuery<Product[]>({
    queryKey: ['/api/salons', salonId, 'products/low-stock'],
    staleTime: 30000
  });

  // Purchase orders query
  const { data: purchaseOrders, isLoading: ordersLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['/api/salons', salonId, 'purchase-orders'],
    staleTime: 60000
  });

  // Mutations
  const createVendorMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/salons/${salonId}/vendors`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'vendors'] });
      setIsVendorDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Vendor created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create vendor", variant: "destructive" });
    }
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: string; data: any }) => 
      apiRequest(`/api/salons/${salonId}/vendors/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'vendors'] });
      setIsVendorDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Vendor updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update vendor", variant: "destructive" });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/salons/${salonId}/product-categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'product-categories'] });
      setIsCategoryDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create category", variant: "destructive" });
    }
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/salons/${salonId}/products`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'inventory/dashboard'] });
      setIsProductDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Product created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) => 
      apiRequest(`/api/salons/${salonId}/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'inventory/dashboard'] });
      setIsProductDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Success", description: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    }
  });

  const createDefaultCategoriesMutation = useMutation({
    mutationFn: () => apiRequest(`/api/salons/${salonId}/product-categories/default`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'product-categories'] });
      toast({ title: "Success", description: "Default categories created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create default categories", variant: "destructive" });
    }
  });

  // Forms
  const vendorForm = useForm({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      website: "",
      taxId: "",
      paymentTerms: "",
      notes: "",
    }
  });

  const categoryForm = useForm({
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      parentCategoryId: "",
      sortOrder: 0,
    }
  });

  const productForm = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      categoryId: "",
      vendorId: "",
      sku: "",
      name: "",
      description: "",
      brand: "",
      size: "",
      unit: "piece",
      costPriceInPaisa: 0,
      sellingPriceInPaisa: 0,
      minimumStock: 0,
      maximumStock: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
      leadTimeDays: 7,
      location: "",
      isRetailItem: false,
      trackStock: true,
      lowStockAlert: true,
      notes: "",
    }
  });

  // Form handlers
  const handleVendorSubmit = (data: any) => {
    if (editingItem) {
      updateVendorMutation.mutate({ vendorId: editingItem.id, data });
    } else {
      createVendorMutation.mutate(data);
    }
  };

  const handleCategorySubmit = (data: any) => {
    if (editingItem) {
      // Handle category update
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleProductSubmit = (data: any) => {
    // Convert price from rupees to paisa
    const formattedData = {
      ...data,
      costPriceInPaisa: Math.round(data.costPriceInPaisa * 100),
      sellingPriceInPaisa: data.sellingPriceInPaisa ? Math.round(data.sellingPriceInPaisa * 100) : undefined,
      isRetailItem: data.isRetailItem ? 1 : 0,
      trackStock: data.trackStock ? 1 : 0,
      lowStockAlert: data.lowStockAlert ? 1 : 0,
    };

    if (editingItem) {
      updateProductMutation.mutate({ productId: editingItem.id, data: formattedData });
    } else {
      createProductMutation.mutate(formattedData);
    }
  };

  // Effect to populate form when editing
  useEffect(() => {
    if (editingItem) {
      if (isVendorDialogOpen) {
        vendorForm.reset(editingItem);
      } else if (isCategoryDialogOpen) {
        categoryForm.reset(editingItem);
      } else if (isProductDialogOpen) {
        productForm.reset({
          ...editingItem,
          costPriceInPaisa: editingItem.costPriceInPaisa / 100,
          sellingPriceInPaisa: editingItem.sellingPriceInPaisa ? editingItem.sellingPriceInPaisa / 100 : 0,
          isRetailItem: Boolean(editingItem.isRetailItem),
          trackStock: Boolean(editingItem.trackStock),
          lowStockAlert: Boolean(editingItem.lowStockAlert),
        });
      }
    }
  }, [editingItem, isVendorDialogOpen, isCategoryDialogOpen, isProductDialogOpen]);

  // Reset forms when dialogs close
  useEffect(() => {
    if (!isVendorDialogOpen) vendorForm.reset();
    if (!isCategoryDialogOpen) categoryForm.reset();
    if (!isProductDialogOpen) productForm.reset();
    if (!isVendorDialogOpen && !isCategoryDialogOpen && !isProductDialogOpen) setEditingItem(null);
  }, [isVendorDialogOpen, isCategoryDialogOpen, isProductDialogOpen]);

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const metrics = dashboardMetrics || {
    totalProducts: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    reorderRequiredCount: 0,
    expiringProductsCount: 0,
    topCategories: [],
    recentMovements: [],
    monthlyUsageTrends: [],
    vendorPerformance: []
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage products, track stock levels, and optimize inventory operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId] })}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card data-testid="card-total-products">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-products">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card data-testid="card-stock-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-stock-value">
              {formatCurrency(metrics.totalStockValue)}
            </div>
            <p className="text-xs text-muted-foreground">Total inventory value</p>
          </CardContent>
        </Card>

        <Card data-testid="card-low-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" data-testid="text-low-stock">
              {metrics.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-reorder-required">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Required</CardTitle>
            <ShoppingCart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-reorder-required">
              {metrics.reorderRequiredCount}
            </div>
            <p className="text-xs text-muted-foreground">Items to reorder</p>
          </CardContent>
        </Card>

        <Card data-testid="card-expiring-products">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-expiring-products">
              {metrics.expiringProductsCount}
            </div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="stock" data-testid="tab-stock">Stock</TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="vendors" data-testid="tab-vendors">Vendors</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Top Categories */}
            <Card data-testid="card-top-categories">
              <CardHeader>
                <CardTitle className="text-lg">Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.topCategories.slice(0, 5).map((category, index) => (
                    <div key={category.categoryId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{category.categoryName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{category.productCount} items</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(category.stockValue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Stock Movements */}
            <Card data-testid="card-recent-movements">
              <CardHeader>
                <CardTitle className="text-lg">Recent Movements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.recentMovements.slice(0, 5).map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{movement.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {movement.type} • {new Date(movement.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {movement.type === 'usage' ? '-' : '+'}{movement.quantity}
                        </div>
                        {movement.staffName && (
                          <div className="text-xs text-muted-foreground">{movement.staffName}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Usage Trends */}
            <Card data-testid="card-usage-trends">
              <CardHeader>
                <CardTitle className="text-lg">Usage Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metrics.monthlyUsageTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        name === 'usageValue' ? formatCurrency(value) : value,
                        name === 'usageValue' ? 'Usage Value' : 'Item Count'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="usageValue" 
                      stackId="1" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alerts and Notifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Alerts & Notifications</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {metrics.lowStockCount > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{metrics.lowStockCount} products</strong> are running low on stock and need attention.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal"
                      onClick={() => {
                        setActiveTab("products");
                        setShowLowStockOnly(true);
                      }}
                    >
                      View low stock items
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {metrics.reorderRequiredCount > 0 && (
                <Alert>
                  <ShoppingCart className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{metrics.reorderRequiredCount} products</strong> have reached their reorder point.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal"
                      onClick={() => setActiveTab("orders")}
                    >
                      Create purchase orders
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {metrics.expiringProductsCount > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{metrics.expiringProductsCount} products</strong> are expiring in the next 30 days.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-normal"
                      onClick={() => setActiveTab("products")}
                    >
                      Review expiring items
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-products"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-48" data-testid="select-vendor-filter">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showLowStockOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                data-testid="button-filter-low-stock"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Low Stock Only
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-add-category">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit' : 'Add'} Product Category</DialogTitle>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-category-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-category-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={categoryForm.control}
                        name="parentCategoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-parent-category">
                                  <SelectValue placeholder="Select parent category (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCategoryDialogOpen(false)}
                          data-testid="button-cancel-category"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createCategoryMutation.isPending}
                          data-testid="button-save-category"
                        >
                          {editingItem ? 'Update' : 'Create'} Category
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {(!categories || categories.length === 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createDefaultCategoriesMutation.mutate()}
                  disabled={createDefaultCategoriesMutation.isPending}
                  data-testid="button-create-default-categories"
                >
                  <Boxes className="h-4 w-4 mr-2" />
                  Create Default Categories
                </Button>
              )}

              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-product">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit' : 'Add'} Product</DialogTitle>
                  </DialogHeader>
                  <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={productForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-product-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SKU</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-product-sku" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={productForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-product-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={productForm.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-product-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="vendorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-product-vendor">
                                    <SelectValue placeholder="Select vendor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {vendors?.map((vendor) => (
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

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={productForm.control}
                          name="brand"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Brand</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-product-brand" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., 500ml, 1L" data-testid="input-product-size" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-product-unit">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="piece">Piece</SelectItem>
                                  <SelectItem value="ml">Milliliter (ml)</SelectItem>
                                  <SelectItem value="g">Gram (g)</SelectItem>
                                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                  <SelectItem value="l">Liter (L)</SelectItem>
                                  <SelectItem value="bottle">Bottle</SelectItem>
                                  <SelectItem value="pack">Pack</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={productForm.control}
                          name="costPriceInPaisa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cost Price (₹)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-product-cost-price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="sellingPriceInPaisa"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Selling Price (₹)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-product-selling-price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={productForm.control}
                          name="minimumStock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum Stock</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-product-minimum-stock"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="reorderPoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reorder Point</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-product-reorder-point"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="reorderQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reorder Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-product-reorder-quantity"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={productForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Storage Location</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Shelf A1, Room 2" data-testid="input-product-location" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="leadTimeDays"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lead Time (Days)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  data-testid="input-product-lead-time"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center space-x-6">
                        <FormField
                          control={productForm.control}
                          name="isRetailItem"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded border border-input"
                                  data-testid="checkbox-product-retail"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Retail Item
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="trackStock"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded border border-input"
                                  data-testid="checkbox-product-track-stock"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Track Stock
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="lowStockAlert"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="rounded border border-input"
                                  data-testid="checkbox-product-low-stock-alert"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                Low Stock Alert
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={productForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-product-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsProductDialogOpen(false)}
                          data-testid="button-cancel-product"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createProductMutation.isPending || updateProductMutation.isPending}
                          data-testid="button-save-product"
                        >
                          {editingItem ? 'Update' : 'Create'} Product
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Products Table */}
          <Card data-testid="card-products-table">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    ) : products && products.length > 0 ? (
                      products.map((product) => {
                        const category = categories?.find(c => c.id === product.categoryId);
                        const vendor = vendors?.find(v => v.id === product.vendorId);
                        
                        return (
                          <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{product.name}</div>
                                {product.brand && (
                                  <div className="text-sm text-muted-foreground">{product.brand}</div>
                                )}
                                {product.size && (
                                  <div className="text-xs text-muted-foreground">{product.size}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono">{product.sku}</TableCell>
                            <TableCell>{category?.name || '-'}</TableCell>
                            <TableCell>{vendor?.name || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className={getStockLevelColor(product.currentStock, product.minimumStock)}>
                                  {product.currentStock} {product.unit}
                                </span>
                                {product.minimumStock && (
                                  <span className="text-xs text-muted-foreground">
                                    (min: {product.minimumStock})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStockLevelBadge(product.currentStock, product.minimumStock)}
                            </TableCell>
                            <TableCell>{formatCurrency(product.costPriceInPaisa)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(product);
                                    setIsProductDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-product-${product.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-view-product-${product.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Package className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No products found</p>
                            <Button
                              onClick={() => setIsProductDialogOpen(true)}
                              data-testid="button-add-first-product"
                            >
                              Add your first product
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Vendor Management</h3>
              <p className="text-sm text-muted-foreground">Manage your suppliers and vendor relationships</p>
            </div>
            <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-vendor">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit' : 'Add'} Vendor</DialogTitle>
                </DialogHeader>
                <Form {...vendorForm}>
                  <form onSubmit={vendorForm.handleSubmit(handleVendorSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={vendorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vendorForm.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-contact" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={vendorForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-vendor-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vendorForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={vendorForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="textarea-vendor-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={vendorForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vendorForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vendorForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={vendorForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-website" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={vendorForm.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID / GST Number</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-vendor-tax-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={vendorForm.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Terms</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Net 30, COD, Advance" data-testid="input-vendor-payment-terms" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={vendorForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="textarea-vendor-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsVendorDialogOpen(false)}
                        data-testid="button-cancel-vendor"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createVendorMutation.isPending || updateVendorMutation.isPending}
                        data-testid="button-save-vendor"
                      >
                        {editingItem ? 'Update' : 'Create'} Vendor
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Vendors Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vendorsLoading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : vendors && vendors.length > 0 ? (
              vendors.map((vendor) => (
                <Card key={vendor.id} data-testid={`card-vendor-${vendor.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{vendor.name}</CardTitle>
                        {vendor.contactPerson && (
                          <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(vendor);
                            setIsVendorDialogOpen(true);
                          }}
                          data-testid={`button-edit-vendor-${vendor.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {vendor.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.city && vendor.state && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{vendor.city}, {vendor.state}</span>
                      </div>
                    )}
                    {vendor.paymentTerms && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-muted-foreground">Terms:</span>
                        <span>{vendor.paymentTerms}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                        {vendor.status}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-xs ${i < vendor.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="flex flex-col items-center space-y-2">
                  <Building className="h-8 w-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No vendors found</p>
                  <Button onClick={() => setIsVendorDialogOpen(true)} data-testid="button-add-first-vendor">
                    Add your first vendor
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Placeholder tabs for now */}
        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Real-time stock tracking and movement history
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Stock management features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create and manage purchase orders with vendors
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Purchase order management features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Usage analytics, cost optimization, and profitability reports
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Advanced analytics features coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}