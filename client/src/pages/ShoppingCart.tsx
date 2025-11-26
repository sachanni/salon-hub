import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Minus, ShoppingBag, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  variantId: string | null;
  variantValue: string | null;
  quantity: number;
  unitPriceInPaisa: number;
  totalPriceInPaisa: number;
  stock: number;
  isAvailable: boolean;
};

type Cart = {
  id: string;
  items: CartItem[];
  subtotalInPaisa: number;
  discountInPaisa: number;
  deliveryChargeInPaisa: number;
  taxInPaisa: number;
  totalInPaisa: number;
  appliedCoupon: string | null;
};

export default function ShoppingCart() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');

  // Fetch cart
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['/api/cart'],
  });

  // QueryClient auto-unwraps {success, data} response envelope
  const cart = (cartData as { cart?: Cart })?.cart;
  const availableItems = cart?.items.filter(item => item.isAvailable) || [];
  const unavailableItems = cart?.items.filter(item => !item.isAvailable) || [];

  // Update cart item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return apiRequest('PUT', `/api/cart/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    },
  });

  // Remove item from cart
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest('DELETE', `/api/cart/items/${itemId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Item removed',
        description: 'Product removed from cart',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove item',
        variant: 'destructive',
      });
    },
  });

  // Apply coupon
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest('POST', '/api/cart/apply-coupon', { code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Coupon applied',
        description: 'Your discount has been applied',
      });
      setCouponCode('');
    },
    onError: () => {
      toast({
        title: 'Invalid coupon',
        description: 'This coupon code is not valid',
        variant: 'destructive',
      });
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-40 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 mb-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty cart state
  if (!cart || availableItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-24 h-24 text-muted-foreground mb-4" />
        <h2 data-testid="text-empty-cart-title" className="text-2xl font-bold mb-2">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          Looks like you haven't added any products yet
        </p>
        <Button
          data-testid="button-continue-shopping"
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b p-4">
        <h1 data-testid="text-cart-title" className="text-2xl font-bold">
          Cart ({availableItems.length})
        </h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Available Items */}
        <div className="space-y-3">
          {availableItems.map((item) => (
            <Card key={item.id} data-testid={`cart-item-${item.id}`} className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
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
                  <h3 
                    data-testid={`text-item-name-${item.id}`}
                    className="font-medium line-clamp-2 mb-1"
                  >
                    {item.productName}
                  </h3>
                  {item.variantValue && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Variant: {item.variantValue}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p 
                      data-testid={`text-item-price-${item.id}`}
                      className="font-bold text-lg"
                    >
                      ₹{(item.totalPriceInPaisa / 100).toFixed(0)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        data-testid={`button-decrease-${item.id}`}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantityMutation.mutate({ 
                              itemId: item.id, 
                              quantity: item.quantity - 1 
                            });
                          }
                        }}
                        disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span 
                        data-testid={`text-quantity-${item.id}`}
                        className="w-8 text-center font-medium"
                      >
                        {item.quantity}
                      </span>
                      <Button
                        data-testid={`button-increase-${item.id}`}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (item.quantity < Math.min(item.stock, 10)) {
                            updateQuantityMutation.mutate({ 
                              itemId: item.id, 
                              quantity: item.quantity + 1 
                            });
                          }
                        }}
                        disabled={
                          item.quantity >= Math.min(item.stock, 10) || 
                          updateQuantityMutation.isPending
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        data-testid={`button-remove-${item.id}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        disabled={removeItemMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ₹{(item.unitPriceInPaisa / 100).toFixed(0)} each
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

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
                  <div className="w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
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
                    <p className="text-sm text-destructive mb-2">Out of Stock</p>
                    <Button
                      data-testid={`button-remove-unavailable-${item.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => removeItemMutation.mutate(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Coupon Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4" />
            <h3 className="font-semibold">Apply Coupon</h3>
          </div>
          {cart.appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {cart.appliedCoupon}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Coupon applied successfully
                </p>
              </div>
              <Button
                data-testid="button-remove-coupon"
                variant="ghost"
                size="sm"
                onClick={() => applyCouponMutation.mutate('')}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                data-testid="input-coupon-code"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                data-testid="button-apply-coupon"
                onClick={() => applyCouponMutation.mutate(couponCode)}
                disabled={!couponCode || applyCouponMutation.isPending}
              >
                Apply
              </Button>
            </div>
          )}
        </Card>

        {/* Price Breakdown */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Price Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({availableItems.length} items)</span>
              <span data-testid="text-subtotal">
                ₹{(cart.subtotalInPaisa / 100).toFixed(0)}
              </span>
            </div>
            {cart.discountInPaisa > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Discount</span>
                <span data-testid="text-discount">
                  -₹{(cart.discountInPaisa / 100).toFixed(0)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Delivery Charge</span>
              <span data-testid="text-delivery-charge">
                {cart.deliveryChargeInPaisa === 0 ? (
                  <span className="text-green-600 dark:text-green-400">FREE</span>
                ) : (
                  `₹${(cart.deliveryChargeInPaisa / 100).toFixed(0)}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (GST 18%)</span>
              <span data-testid="text-tax">
                ₹{(cart.taxInPaisa / 100).toFixed(0)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span data-testid="text-total">
                ₹{(cart.totalInPaisa / 100).toFixed(0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Continue Shopping */}
        <Button
          data-testid="button-continue-shopping-bottom"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>
      </div>

      {/* Sticky Bottom Checkout */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p data-testid="text-total-bottom" className="text-2xl font-bold">
              ₹{(cart.totalInPaisa / 100).toFixed(0)}
            </p>
          </div>
          <Button
            data-testid="button-proceed-checkout"
            size="lg"
            onClick={() => navigate('/checkout')}
            className="flex-1 max-w-xs"
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
