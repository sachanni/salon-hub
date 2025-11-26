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
import { useAuth } from '@/contexts/AuthContext';
import { Search, Heart, Filter, ShoppingCart, Star, Store } from 'lucide-react';
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
  stock: number;
  averageRating: number | null;
  reviewCount: number;
  isWishlisted?: boolean;
  salonId?: string;
};

export default function Shop() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const isCustomer = user?.roles?.includes('customer');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['/api/products/search', { 
      query: searchQuery, 
      minPrice: minPrice ? parseInt(minPrice) * 100 : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) * 100 : undefined,
    }],
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('POST', '/api/wishlist', { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products/search'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
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

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('POST', '/api/cart', { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Added to cart',
        description: 'Product added to your shopping cart',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive',
      });
    },
  });

  // QueryClient auto-unwraps {success, data} response envelope to just the data object
  const products = (productsData as any)?.products || [];

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.retailPriceInPaisa - b.retailPriceInPaisa;
    if (sortBy === 'price-high') return b.retailPriceInPaisa - a.retailPriceInPaisa;
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    return 0;
  });

  const activeFiltersCount = [minPrice, maxPrice].filter(Boolean).length;

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-50 bg-background border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            Shop
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button 
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range (₹)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
          {searchQuery && (
            <Badge variant="secondary">{sortedProducts.length} results</Badge>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedProducts.map((product: Product) => (
              <Card 
                key={product.id} 
                className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {product.retailImages?.[0] ? (
                    <img 
                      src={product.retailImages[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {isAuthenticated && isCustomer && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToWishlistMutation.mutate(product.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${product.isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  )}
                  {product.stock <= 0 && (
                    <Badge className="absolute bottom-2 left-2" variant="destructive">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    )}
                  </div>
                  
                  {product.averageRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{product.averageRating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="font-bold">₹{(product.retailPriceInPaisa / 100).toFixed(2)}</p>
                  </div>

                  {isAuthenticated && isCustomer && product.stock > 0 && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCartMutation.mutate(product.id);
                      }}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add to Cart
                    </Button>
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
