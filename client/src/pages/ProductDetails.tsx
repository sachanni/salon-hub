import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronLeft, 
  Heart, 
  Share2, 
  Star, 
  Plus, 
  Minus,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  retailPriceInPaisa: number;
  costPriceInPaisa: number;
  retailImages: string[];
  stock: number;
  averageRating: number | null;
  reviewCount: number;
  categoryId: string;
  salonId: string;
  isWishlisted?: boolean;
};

type ProductVariant = {
  id: string;
  productId: string;
  variantType: string;
  variantValue: string;
  priceAdjustmentInPaisa: number;
  stock: number;
};

type Review = {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  reviewText: string;
  verifiedPurchase: boolean;
  createdAt: string;
};

export default function ProductDetails() {
  const { productId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // UI state
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('description');

  // Fetch product details
  const { data: productData, isLoading } = useQuery({
    queryKey: ['/api/products', productId],
    enabled: !!productId,
  });

  // Fetch product variants
  const { data: variantsData } = useQuery({
    queryKey: ['/api/products', productId, 'variants'],
    enabled: !!productId,
  });

  // Fetch product reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['/api/products', productId, 'reviews'],
    enabled: !!productId,
  });

  // QueryClient auto-unwraps {success, data} response envelope
  const product = (productData as { product?: Product })?.product;
  const variants = ((variantsData as { variants?: ProductVariant[] })?.variants || []);
  const reviews = ((reviewsData as { reviews?: Review[] })?.reviews || []);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('Product not found');
      
      return apiRequest('POST', '/api/cart/items', {
        salonId: product.salonId,
        productId,
        variantId: selectedVariant || undefined,
        quantity,
        priceAtAdd: product.retailPriceInPaisa,
      });
    },
    onSuccess: () => {
      // Invalidate cart query to update cart count badge and cart page
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      toast({
        title: 'Added to cart',
        description: `${quantity} item(s) added to your cart`,
      });
    },
    onError: (error: any) => {
      // Parse error message or response data
      let errorData;
      try {
        // Try to parse error response from API
        const errorMessage = error?.message || '';
        const jsonMatch = errorMessage.match(/\{.*\}/);
        if (jsonMatch) {
          errorData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        // Ignore parsing errors
      }

      // Check error types
      const isUnauthorized = error?.message?.includes('401') || error?.message?.includes('Unauthorized');
      const isStockError = errorData?.error?.includes('Insufficient stock') || errorData?.error?.includes('stock');
      
      // Build error message
      let title = 'Error';
      let description = 'Failed to add to cart';
      
      if (isUnauthorized) {
        title = 'Please login';
        description = 'You need to login to add items to your cart';
      } else if (isStockError) {
        title = 'Out of stock';
        const available = errorData?.available ?? 0;
        if (available > 0) {
          description = `Only ${available} item${available === 1 ? '' : 's'} available in stock`;
        } else {
          description = 'This product is currently out of stock';
        }
      }

      toast({
        title,
        description,
        variant: 'destructive',
      });

      // Redirect to login if unauthorized
      if (isUnauthorized) {
        setTimeout(() => navigate('/login'), 1500);
      }
    },
  });

  // Fetch user's wishlist to get wishlist item ID
  const { data: wishlistData, isLoading: wishlistLoading } = useQuery({
    queryKey: ['/api/wishlist'],
  });

  // QueryClient auto-unwraps {success, data} for useQuery responses
  const wishlistItems = ((wishlistData as { wishlist?: Array<{ id: string; productId: string }> })?.wishlist || []);
  const wishlistItem = wishlistItems.find(item => item.productId === productId);

  // Toggle wishlist mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (wishlistItem) {
        // Remove from wishlist using wishlist item ID
        return apiRequest('DELETE', `/api/wishlist/${wishlistItem.id}`, {});
      } else {
        // Add to wishlist
        return apiRequest('POST', '/api/wishlist', { productId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: wishlistItem ? 'Removed from wishlist' : 'Added to wishlist',
      });
    },
    onError: (error: any) => {
      // Check if it's an authentication error (401)
      const isUnauthorized = error?.message?.includes('401') || error?.message?.includes('Unauthorized');
      
      toast({
        title: isUnauthorized ? 'Please login' : 'Error',
        description: isUnauthorized 
          ? 'You need to login to manage your wishlist' 
          : 'Failed to update wishlist',
        variant: 'destructive',
      });

      // Redirect to login if unauthorized
      if (isUnauthorized) {
        setTimeout(() => navigate('/login'), 1500);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="w-full aspect-square" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const maxQuantity = Math.min(product.stock, 10);
  const discountPercent = product.costPriceInPaisa > 0 
    ? Math.round(((product.costPriceInPaisa - product.retailPriceInPaisa) / product.costPriceInPaisa) * 100)
    : 0;
  const totalPrice = product.retailPriceInPaisa * quantity;

  const handleAddToCart = () => {
    if (product.stock === 0) {
      toast({
        title: 'Out of stock',
        description: 'This product is currently unavailable',
        variant: 'destructive',
      });
      return;
    }
    addToCartMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Product link copied to clipboard',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b p-4 flex items-center justify-between">
        <Button
          data-testid="button-back"
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex gap-2">
          <Button
            data-testid="button-share"
            variant="ghost"
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            data-testid="button-wishlist"
            variant="ghost"
            size="icon"
            onClick={() => toggleWishlistMutation.mutate()}
            disabled={wishlistLoading || toggleWishlistMutation.isPending}
          >
            <Heart className={`w-5 h-5 ${wishlistItem ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="relative">
        {product.retailImages && product.retailImages.length > 0 ? (
          <Carousel className="w-full">
            <CarouselContent>
              {product.retailImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-square bg-muted">
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      data-testid={`image-product-${index}`}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {product.retailImages.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
        ) : (
          <div className="aspect-square bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No Image</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        {/* Brand */}
        {product.brand && (
          <p data-testid="text-brand" className="text-sm text-muted-foreground uppercase">
            {product.brand}
          </p>
        )}

        {/* Name and Rating */}
        <div>
          <h1 data-testid="text-product-name" className="text-2xl font-bold mb-2">
            {product.name}
          </h1>
          {product.averageRating && (
            <div 
              data-testid="button-view-reviews"
              className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md p-1 -ml-1"
              onClick={() => setExpandedSection('reviews')}
            >
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{product.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span data-testid="text-price" className="text-3xl font-bold">
            ₹{(product.retailPriceInPaisa / 100).toFixed(0)}
          </span>
          {discountPercent > 0 && (
            <>
              <span data-testid="text-original-price" className="text-lg text-muted-foreground line-through">
                ₹{(product.costPriceInPaisa / 100).toFixed(0)}
              </span>
              <Badge data-testid="badge-discount" variant="destructive">
                {discountPercent}% OFF
              </Badge>
            </>
          )}
        </div>

        {/* Variants */}
        {variants.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Variant</label>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <Button
                  key={variant.id}
                  data-testid={`button-variant-${variant.id}`}
                  variant={selectedVariant === variant.id ? 'default' : 'outline'}
                  onClick={() => setSelectedVariant(variant.id)}
                  className="toggle-elevate toggle-elevated"
                >
                  {variant.variantValue}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Stock Status */}
        <div>
          {product.stock === 0 ? (
            <Badge data-testid="badge-stock-status" variant="destructive">Out of Stock</Badge>
          ) : product.stock <= 5 ? (
            <Badge data-testid="badge-stock-status" variant="secondary" className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
              Only {product.stock} left
            </Badge>
          ) : (
            <Badge data-testid="badge-stock-status" variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              In Stock
            </Badge>
          )}
        </div>

        {/* Quantity Selector */}
        {product.stock > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                data-testid="button-decrease-quantity"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span data-testid="text-quantity" className="text-lg font-semibold w-12 text-center">
                {quantity}
              </span>
              <Button
                data-testid="button-increase-quantity"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                (Max: {maxQuantity})
              </span>
            </div>
          </div>
        )}

        {/* Expandable Sections */}
        <div className="space-y-2">
          {/* Description */}
          {product.description && (
            <Collapsible
              open={expandedSection === 'description'}
              onOpenChange={() => setExpandedSection(expandedSection === 'description' ? null : 'description')}
            >
              <Card>
                <CollapsibleTrigger data-testid="button-toggle-description" className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <CardTitle className="text-base">Description</CardTitle>
                    {expandedSection === 'description' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <p data-testid="text-description" className="text-sm whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Reviews */}
          <Collapsible
            open={expandedSection === 'reviews'}
            onOpenChange={() => setExpandedSection(expandedSection === 'reviews' ? null : 'reviews')}
          >
            <Card>
              <CollapsibleTrigger data-testid="button-toggle-reviews" className="w-full">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    Reviews ({reviews.length})
                  </CardTitle>
                  {expandedSection === 'reviews' ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No reviews yet
                    </p>
                  ) : (
                    reviews.slice(0, 3).map((review) => (
                      <div key={review.id} data-testid={`review-${review.id}`} className="border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{review.userName}</span>
                          {review.verifiedPurchase && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                        </div>
                        {review.title && (
                          <p className="font-semibold text-sm mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Price</p>
            <p data-testid="text-total-price" className="text-2xl font-bold">
              ₹{(totalPrice / 100).toFixed(0)}
            </p>
          </div>
          <Button
            data-testid="button-add-to-cart"
            size="lg"
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addToCartMutation.isPending}
            className="flex-1 max-w-xs"
          >
            {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
