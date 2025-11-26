import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, Heart, Filter, X, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  retailPriceInPaisa: number;
  retailImages: string[];
  categoryId: string;
  stock: number;
  averageRating: number | null;
  reviewCount: number;
  isWishlisted?: boolean;
};

type ProductCategory = {
  id: string;
  name: string;
};

export default function ProductsList({ salonId }: { salonId: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'products/retail', { 
      search: searchQuery, 
      categoryId: selectedCategory,
      minPrice: minPrice ? parseInt(minPrice) * 100 : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) * 100 : undefined,
    }],
  });

  // Fetch categories for filter (public endpoint)
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/salons', salonId, 'product-categories/public'],
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('POST', '/api/wishlist', { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'products/retail'] });
      toast({
        title: 'Added to wishlist',
        description: 'Product saved to your wishlist',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add to wishlist',
        variant: 'destructive',
      });
    },
  });

  // QueryClient auto-unwraps {success, data} response envelope
  const products = (productsData as { products?: Product[] })?.products || [];
  const categories = ((categoriesData as { categories?: ProductCategory[] })?.categories) || [];

  // Sort products client-side
  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.retailPriceInPaisa - b.retailPriceInPaisa;
    if (sortBy === 'price-high') return b.retailPriceInPaisa - a.retailPriceInPaisa;
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    return 0; // featured (default order)
  });

  const activeFiltersCount = [selectedCategory, minPrice, maxPrice].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with search */}
      <div className="sticky top-0 z-50 bg-background border-b p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search-products"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button 
                data-testid="button-open-filters"
                variant="outline" 
                size="icon" 
                className="relative"
              >
                <Filter className="w-4 h-4" />
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Refine your product search
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((cat: ProductCategory) => (
                        <SelectItem key={cat.id} value={cat.id} data-testid={`option-category-${cat.id}`}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range (₹)</label>
                  <div className="flex gap-2">
                    <Input
                      data-testid="input-min-price"
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span className="self-center text-muted-foreground">-</span>
                    <Input
                      data-testid="input-max-price"
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button 
                    data-testid="button-clear-filters"
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sort Bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {products.length} products
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger data-testid="select-sort" className="w-[160px] h-8">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured" data-testid="option-sort-featured">Featured</SelectItem>
              <SelectItem value="price-low" data-testid="option-sort-price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high" data-testid="option-sort-price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating" data-testid="option-sort-rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1">
                {categories.find((c: ProductCategory) => c.id === selectedCategory)?.name}
                <X 
                  data-testid="button-remove-category-filter"
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setSelectedCategory('')} 
                />
              </Badge>
            )}
            {minPrice && (
              <Badge variant="secondary" className="gap-1">
                Min: ₹{minPrice}
                <X 
                  data-testid="button-remove-min-price"
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setMinPrice('')} 
                />
              </Badge>
            )}
            {maxPrice && (
              <Badge variant="secondary" className="gap-1">
                Max: ₹{maxPrice}
                <X 
                  data-testid="button-remove-max-price"
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => setMaxPrice('')} 
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            {activeFiltersCount > 0 && (
              <Button 
                data-testid="button-clear-all-filters"
                variant="outline" 
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {sortedProducts.map((product) => (
              <Card 
                key={product.id}
                data-testid={`card-product-${product.id}`}
                className="overflow-hidden hover-elevate cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="relative aspect-square bg-muted">
                  {product.retailImages && product.retailImages.length > 0 ? (
                    <img
                      src={product.retailImages[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  
                  {/* Wishlist Heart */}
                  <Button
                    data-testid={`button-wishlist-${product.id}`}
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWishlistMutation.mutate(product.id);
                    }}
                  >
                    <Heart 
                      className={`w-4 h-4 ${product.isWishlisted ? 'fill-red-500 text-red-500' : ''}`} 
                    />
                  </Button>

                  {/* Out of Stock Overlay */}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  {product.brand && (
                    <p className="text-xs text-muted-foreground uppercase">
                      {product.brand}
                    </p>
                  )}
                  <h3 
                    data-testid={`text-product-name-${product.id}`}
                    className="font-medium text-sm line-clamp-2 leading-tight"
                  >
                    {product.name}
                  </h3>
                  <div 
                    data-testid={`text-product-price-${product.id}`}
                    className="font-bold text-base"
                  >
                    ₹{(product.retailPriceInPaisa / 100).toFixed(0)}
                  </div>
                  
                  {/* Rating */}
                  {product.averageRating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{product.averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({product.reviewCount})</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
