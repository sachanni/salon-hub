import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';

type WishlistItem = {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  brand: string | null;
  variantId: string | null;
  variantValue: string | null;
  retailPriceInPaisa: number;
  costPriceInPaisa: number;
  stock: number;
  isAvailable: boolean;
  addedAt: string;
};

export default function Wishlist() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch wishlist
  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['/api/wishlist'],
  });

  // QueryClient auto-unwraps {success, data} for useQuery responses
  const wishlist = ((wishlistData as { wishlist?: WishlistItem[] })?.wishlist || []);
  const availableItems = wishlist.filter(item => item.isAvailable);
  const unavailableItems = wishlist.filter(item => !item.isAvailable);

  // Remove from wishlist
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (wishlistId: string) => {
      return apiRequest('DELETE', `/api/wishlist/${wishlistId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: 'Removed from wishlist',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove from wishlist',
        variant: 'destructive',
      });
    },
  });

  // Add to cart
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, variantId }: { productId: string; variantId?: string | null }) => {
      return apiRequest('POST', '/api/cart/items', {
        productId,
        variantId,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Added to cart',
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
              <div className="flex gap-4">
                <Skeleton className="w-24 h-24" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Heart className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 data-testid="text-empty-wishlist-title" className="text-2xl font-bold mb-2">
          Your wishlist is empty
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Save your favorite products here
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
        <h1 data-testid="text-wishlist-title" className="text-2xl font-bold">
          My Wishlist ({wishlist.length})
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Available Items */}
        {availableItems.length > 0 && (
          <div className="space-y-3">
            {availableItems.map((item) => {
              const discountPercent = item.costPriceInPaisa > 0 
                ? Math.round(((item.costPriceInPaisa - item.retailPriceInPaisa) / item.costPriceInPaisa) * 100)
                : 0;

              return (
                <Card
                  key={item.id}
                  data-testid={`wishlist-item-${item.id}`}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => navigate(`/products/${item.productId}`)}
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      {item.brand && (
                        <p className="text-xs text-muted-foreground uppercase mb-1">
                          {item.brand}
                        </p>
                      )}
                      <h3 
                        data-testid={`text-item-name-${item.id}`}
                        className="font-medium line-clamp-2 mb-2"
                      >
                        {item.productName}
                      </h3>
                      {item.variantValue && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.variantValue}
                        </p>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-3">
                        <span 
                          data-testid={`text-item-price-${item.id}`}
                          className="font-bold text-lg"
                        >
                          ₹{(item.retailPriceInPaisa / 100).toFixed(0)}
                        </span>
                        {discountPercent > 0 && (
                          <>
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{(item.costPriceInPaisa / 100).toFixed(0)}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {discountPercent}% OFF
                            </Badge>
                          </>
                        )}
                      </div>

                      {/* Stock Status */}
                      {item.stock <= 5 && item.stock > 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                          Only {item.stock} left in stock
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          data-testid={`button-add-to-cart-${item.id}`}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCartMutation.mutate({
                              productId: item.productId,
                              variantId: item.variantId,
                            });
                          }}
                          disabled={item.stock === 0 || addToCartMutation.isPending}
                          className="flex-1"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                        <Button
                          data-testid={`button-remove-${item.id}`}
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWishlistMutation.mutate(item.id);
                          }}
                          disabled={removeFromWishlistMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Unavailable Items */}
        {unavailableItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Unavailable Items
            </h3>
            {unavailableItems.map((item) => (
              <Card 
                key={item.id} 
                data-testid={`unavailable-item-${item.id}`}
                className="p-4 opacity-60"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-2 mb-1">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-destructive mb-3">Out of Stock</p>
                    <Button
                      data-testid={`button-remove-unavailable-${item.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromWishlistMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Continue Shopping */}
        <Button
          data-testid="button-continue-shopping"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
