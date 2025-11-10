import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Check, Package, Filter, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface BeautyProduct {
  id: string;
  brand: string;
  productLine: string | null;
  name: string;
  category: string;
  shade: string | null;
  sku: string;
  finishType: string | null;
  price: number;
  imageUrl: string | null;
  description: string | null;
  gender: string;
}

interface BeautyProductsResponse {
  products: BeautyProduct[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

interface SalonInventoryItem {
  inventoryId: string;
  productId: string;
  quantity: number;
  lowStockThreshold: number;
  product: BeautyProduct;
}

const BRANDS = ['Lakme', "l'oreal", 'maybelline', 'MAC', 'nyx', 'Sugar', 'Faces Canada'];

const CATEGORIES = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'concealer', label: 'Concealer' },
  { value: 'lipstick', label: 'Lipstick' },
  { value: 'lip_gloss', label: 'Lip Gloss' },
  { value: 'eyeliner', label: 'Eyeliner' },
  { value: 'mascara', label: 'Mascara' },
  { value: 'eyeshadow', label: 'Eyeshadow' },
  { value: 'blush', label: 'Blush' },
  { value: 'highlighter', label: 'Highlighter' },
  { value: 'bronzer', label: 'Bronzer' },
  { value: 'powder', label: 'Powder' },
  { value: 'eyebrow_pencil', label: 'Eyebrow Pencil' },
  { value: 'nail_polish', label: 'Nail Polish' },
  { value: 'lip_liner', label: 'Lip Liner' },
];

export default function BeautyProductCatalog({ salonId }: { salonId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filters state
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  
  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<BeautyProduct | null>(null);
  const [quantity, setQuantity] = useState('10');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch beauty products with infinite scroll
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<BeautyProductsResponse>({
    queryKey: ['beauty-products', salonId, selectedBrands.join(','), selectedCategory, debouncedSearch, showInStockOnly],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      if (selectedBrands.length > 0) params.append('brand', selectedBrands.join(','));
      if (selectedCategory) params.append('category', selectedCategory);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('limit', '50');
      params.append('offset', String(pageParam));
      
      const response = await apiRequest('GET', `/api/beauty-products?${params.toString()}`);
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.offset + lastPage.pagination.limit
        : undefined;
    },
    initialPageParam: 0,
  });

  // Fetch salon inventory
  const { data: inventory = [], isLoading: isLoadingInventory } = useQuery<SalonInventoryItem[]>({
    queryKey: ['salon-inventory', salonId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/salons/${salonId}/inventory`);
      return response.json();
    },
    enabled: !!salonId,
  });

  // Add to inventory mutation
  const addToInventoryMutation = useMutation({
    mutationFn: async ({ productId, quantity, lowStockThreshold }: { productId: string; quantity: number; lowStockThreshold: number }) => {
      if (!salonId) {
        throw new Error('Salon ID is required to add inventory');
      }
      const response = await apiRequest('POST', `/api/salons/${salonId}/inventory`, {
        productId,
        quantity,
        lowStockThreshold,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salon-inventory', salonId] });
      toast({
        title: 'Success',
        description: data.message || 'Product added to inventory',
      });
      setIsAddModalOpen(false);
      setSelectedProduct(null);
      setQuantity('10');
      setLowStockThreshold('5');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product to inventory',
        variant: 'destructive',
      });
    },
  });

  // Create inventory map for quick lookup
  const inventoryMap = useMemo(() => {
    const map = new Map<string, SalonInventoryItem>();
    inventory.forEach(item => map.set(item.productId, item));
    return map;
  }, [inventory]);

  // Flatten all products from pages
  const allProducts = useMemo(() => {
    if (!productsData?.pages) return [];
    return productsData.pages.flatMap(page => page.products);
  }, [productsData]);

  // Filter products to show only in-stock if toggle is on
  const filteredProducts = useMemo(() => {
    if (!showInStockOnly) return allProducts;
    
    return allProducts.filter(product => 
      inventoryMap.has(product.id) && (inventoryMap.get(product.id)?.quantity || 0) > 0
    );
  }, [allProducts, showInStockOnly, inventoryMap]);

  // Total count for display
  const totalCount = productsData?.pages[0]?.pagination.total || 0;

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleAddToInventory = (product: BeautyProduct) => {
    setSelectedProduct(product);
    
    // Pre-fill quantity if product already in inventory
    const existingInventory = inventoryMap.get(product.id);
    if (existingInventory) {
      setQuantity(String(existingInventory.quantity));
      setLowStockThreshold(String(existingInventory.lowStockThreshold));
    }
    
    setIsAddModalOpen(true);
  };

  const handleSubmitInventory = () => {
    if (!selectedProduct) return;
    
    const quantityNum = parseInt(quantity);
    const thresholdNum = parseInt(lowStockThreshold);
    
    if (isNaN(quantityNum) || quantityNum < 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }
    
    addToInventoryMutation.mutate({
      productId: selectedProduct.id,
      quantity: quantityNum,
      lowStockThreshold: thresholdNum,
    });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedCategory('');
    setSearchQuery('');
    setShowInStockOnly(false);
  };

  // Clear category when empty to reset filter
  useEffect(() => {
    if (selectedCategory === '') {
      setSelectedCategory('');
    }
  }, [selectedCategory]);

  const hasFilters = selectedBrands.length > 0 || selectedCategory || searchQuery || showInStockOnly;

  // Guard: Show loading state if salonId not available
  if (!salonId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Beauty Products Catalog</h1>
        <p className="text-muted-foreground">
          Browse and add premium beauty products to your salon inventory
        </p>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Filters</h2>
            </div>
            {hasFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, brand, or line..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Separator />

          {/* Brand Pills */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Brands</Label>
            <div className="flex flex-wrap gap-2">
              {BRANDS.map((brand) => (
                <Button
                  key={brand}
                  variant={selectedBrands.includes(brand) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleBrand(brand)}
                  className="rounded-full"
                >
                  {selectedBrands.includes(brand) && <Check className="h-3 w-3 mr-1" />}
                  {brand}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block text-sm font-medium">Category</Label>
              <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show In Stock Toggle */}
            <div className="flex items-center gap-2 pt-6">
              <Button
                variant={showInStockOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowInStockOnly(!showInStockOnly)}
              >
                <Package className="h-4 w-4 mr-2" />
                {showInStockOnly ? 'Showing My Inventory' : 'Show My Inventory Only'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {filteredProducts.length} {showInStockOnly ? 'Products in Stock' : 'Products'}
          </h2>
          <Badge variant="secondary">
            {inventory.length} in your inventory
          </Badge>
        </div>

        {isLoadingProducts || isLoadingInventory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-48 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {hasFilters
                  ? 'Try adjusting your filters or search query'
                  : 'No products available in the catalog'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const inInventory = inventoryMap.get(product.id);
              const isInStock = inInventory && inInventory.quantity > 0;

              return (
                <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-lg overflow-hidden relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-purple-200" />
                        </div>
                      )}
                      {isInStock && (
                        <Badge className="absolute top-2 right-2 bg-green-500">
                          In Stock: {inInventory.quantity}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {product.brand}
                    </Badge>
                    <h3 className="font-semibold line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    {product.shade && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Shade: {product.shade}
                      </p>
                    )}
                    {product.finishType && (
                      <Badge variant="secondary" className="text-xs">
                        {product.finishType}
                      </Badge>
                    )}
                    <p className="text-lg font-bold mt-2">
                      ₹{(product.price / 100).toFixed(2)}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleAddToInventory(product)}
                      variant={isInStock ? 'outline' : 'default'}
                    >
                      {isInStock ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Update Stock
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Inventory
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Load More / Infinite Scroll Trigger */}
        {!isLoadingProducts && filteredProducts.length > 0 && (
          <div ref={loadMoreRef} className="mt-8 text-center">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading more products...
              </div>
            ) : hasNextPage ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchNextPage()}
                className="min-w-[200px]"
              >
                Load More Products
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Showing all {filteredProducts.length} of {totalCount} products
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add to Inventory Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Inventory</DialogTitle>
            <DialogDescription>
              Set the quantity and low stock threshold for this product
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              {/* Product Preview */}
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded flex-shrink-0 overflow-hidden">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-purple-200" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{selectedProduct.brand}</p>
                  <p className="font-semibold line-clamp-2">{selectedProduct.name}</p>
                  {selectedProduct.shade && (
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.shade}
                    </p>
                  )}
                  <p className="text-sm font-bold mt-1">
                    ₹{(selectedProduct.price / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                />
              </div>

              {/* Low Stock Threshold */}
              <div className="space-y-2">
                <Label htmlFor="threshold">Low Stock Alert Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  placeholder="Alert when stock falls below"
                />
                <p className="text-xs text-muted-foreground">
                  You'll be notified when stock falls below this number
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={addToInventoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInventory}
              disabled={addToInventoryMutation.isPending}
            >
              {addToInventoryMutation.isPending ? 'Adding...' : 'Add to Inventory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
