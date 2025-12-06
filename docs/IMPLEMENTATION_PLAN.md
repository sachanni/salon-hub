# Mobile Shop - Industry-Standard Implementation Plan
**Goal:** Transform mobile shop into production-ready platform with top-notch UX  
**Timeline:** 3 phases over 2-3 weeks  
**Standards:** Industry best practices, WCAG accessibility, React Native patterns

---

## 📋 Overview

### Success Criteria
- ✅ Zero critical security vulnerabilities
- ✅ Full TypeScript type safety (no `any` types)
- ✅ Comprehensive error handling with user recovery
- ✅ Loading states on all async operations
- ✅ Empty states with actionable CTAs
- ✅ Optimistic UI updates for instant feedback
- ✅ Stock validation across the flow
- ✅ Accessible and delightful UX

### Implementation Strategy
- **Iterative approach:** Fix, test, review, iterate
- **User-centric:** Every change improves UX
- **Security first:** No shortcuts on validation
- **Performance:** Optimistic updates and caching
- **Maintainable:** Clean code, proper types, documentation

---

## 🔴 Phase 1: Critical Security & Stability (2-3 days)

### Objectives
Fix all critical security vulnerabilities and prevent app crashes. These are blockers for production deployment.

### Tasks Breakdown

#### 1.1 Fix XSS Vulnerability in RazorpayCheckout ⚠️ CRITICAL
**File:** `mobile/src/components/RazorpayCheckout.tsx`

**Current Issue:**
```tsx
// ❌ VULNERABLE - Direct interpolation
const html = `
  var options = {
    key: "${key}",
    prefill: {
      name: "${prefillData.name}",
      email: "${prefillData.email}",
      contact: "${prefillData.contact}"
    }
  };
`;
```

**Fix Strategy:**
1. Create `escapeHtml()` utility function
2. Escape all user-provided strings before interpolation
3. Validate Razorpay key format (test mode/live mode pattern)

**Expected Outcome:**
- All interpolated strings properly escaped
- No XSS vulnerability from user input
- Unit tests for escapeHtml function

---

#### 1.2 Add WebView Navigation Guards ⚠️ SECURITY
**File:** `mobile/src/components/RazorpayCheckout.tsx`

**Current Issue:**
- WebView can navigate to any URL
- No restrictions on external navigation

**Fix Strategy:**
1. Add `originWhitelist` prop to only allow Razorpay domains
2. Implement `onShouldStartLoadWithRequest` to block unauthorized navigation
3. Whitelist: `['razorpay.com', 'https://*.razorpay.com']`

**Expected Outcome:**
- WebView locked to Razorpay domains only
- Prevents phishing/redirect attacks

---

#### 1.3 Add JSON Validation for Route Parameters ⚠️ CRITICAL
**File:** `mobile/src/screens/ShopPaymentScreen.tsx`

**Current Issue:**
```tsx
// ❌ CRASHES if malformed
const orderData = JSON.parse(params.orderData);
```

**Fix Strategy:**
1. Create Zod schema for `orderData` structure
2. Wrap JSON.parse in try-catch
3. Validate with Zod, fallback to error state if invalid
4. Show user-friendly error if data is corrupt

**Schema:**
```typescript
const OrderDataSchema = z.object({
  salonId: z.string().uuid().optional(),
  fulfillmentType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.any().optional(),
  total: z.number().positive()
});
```

**Expected Outcome:**
- App never crashes from malformed params
- Clear error message if data is invalid
- Type-safe orderData object

---

#### 1.4 Implement Cart Validation Before Payment ⚠️ CRITICAL
**File:** `mobile/src/screens/ShopPaymentScreen.tsx`

**Current Issue:**
- Starts payment without checking cart state
- Cart could be empty, expired, or out of stock

**Fix Strategy:**
1. Fetch cart data on screen mount
2. Validate: cart exists, has items, items in stock, prices match
3. Show error + redirect to cart if validation fails
4. Re-validate before opening Razorpay WebView

**Validation Checklist:**
- ✅ Cart exists for user
- ✅ Cart has at least 1 item
- ✅ All items are in stock
- ✅ Prices haven't changed since cart creation
- ✅ Total matches expected amount

**Expected Outcome:**
- Cannot initiate payment with invalid cart
- User sees specific error message
- Redirected to fix issues before payment

---

#### 1.5 Prevent Double-Submit in Payment Flow ⚠️ HIGH
**File:** `mobile/src/screens/ShopPaymentScreen.tsx`

**Current Issue:**
```tsx
// ❌ User can tap multiple times
const [processing, setProcessing] = useState(false);
// Button not explicitly disabled
```

**Fix Strategy:**
1. Add `submitting` state separate from `processing`
2. Disable all payment buttons when `submitting || processing`
3. Add submission lock flag to prevent race conditions
4. Clear lock only on success or final error

**Expected Outcome:**
- Payment buttons visibly disabled during processing
- Cannot create duplicate orders
- Clear loading state for user

---

#### 1.6 Add Timeout & Offline Handling ⚠️ HIGH
**File:** `mobile/src/components/RazorpayCheckout.tsx`

**Current Issue:**
- WebView can hang indefinitely
- No offline detection before loading

**Fix Strategy:**
1. Check network connectivity with NetInfo before showing WebView
2. Add 60-second timeout for WebView initialization
3. Show timeout error with "Try Again" button
4. Add activity indicator while loading

**Expected Outcome:**
- User sees offline message if no network
- Timeout prevents indefinite hanging
- Clear feedback during loading

---

### Phase 1 Testing Checklist
- [ ] XSS test: Try name with `<script>alert('xss')</script>`
- [ ] JSON test: Navigate with malformed orderData param
- [ ] Cart test: Empty cart before payment
- [ ] Cart test: Out of stock item in cart
- [ ] Double-submit test: Rapid tapping payment button
- [ ] Timeout test: Slow network simulation
- [ ] Offline test: No network before payment

### Phase 1 Deliverables
- ✅ Zero XSS vulnerabilities
- ✅ Zero app crashes from invalid data
- ✅ Cart validation prevents invalid payments
- ✅ Double-submit protection working
- ✅ Timeout and offline handling
- ✅ All tests passing
- ✅ Architect approval

---

## 🟡 Phase 2: Type Safety & Robust Error Handling (Week 1)

### Objectives
Eliminate all `any` types, add proper TypeScript interfaces, implement stock checks, and create industry-standard error handling.

### Tasks Breakdown

#### 2.1 Create Comprehensive TypeScript Interfaces
**File:** `mobile/src/types/shop.ts` (NEW)

**Interfaces to Create:**
```typescript
// Product types
interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in paisa
  discountPrice?: number;
  images: string[];
  categoryId: string;
  salonId: string;
  stock: number;
  isActive: boolean;
  metadata: ProductMetadata;
  createdAt: string;
}

interface ProductMetadata {
  brand?: string;
  size?: string;
  color?: string;
  weight?: string;
  ingredients?: string[];
  variants?: ProductVariant[];
}

interface ProductVariant {
  id: string;
  name: string;
  options: VariantOption[];
}

interface VariantOption {
  value: string;
  priceAdjustment: number;
  stock: number;
}

// Category types
interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

// Cart types
interface Cart {
  id: string;
  userId: string;
  salonId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
  selectedVariants?: Record<string, string>;
}

// Order types
interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  salonId: string;
  status: OrderStatus;
  fulfillmentType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentTransactionId?: string;
  subtotalPaisa: number;
  taxPaisa: number;
  deliveryChargePaisa: number;
  totalPaisa: number;
  items: OrderItem[];
  createdAt: string;
}

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
type PaymentMethod = 'razorpay' | 'pay_at_salon' | 'cod';

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  pricePaisa: number;
  selectedVariants?: Record<string, string>;
}

// Wishlist types
interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

// Review types
interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

**Expected Outcome:**
- Complete type definitions for all shop entities
- Exported from centralized location
- Reusable across all screens

---

#### 2.2-2.5 Replace All `any` Types Across Screens
**Files:** All shop screens

**Strategy:**
1. Import proper interfaces from `types/shop.ts`
2. Replace `any[]` with `Product[]`, `Category[]`, etc.
3. Add type annotations to all function parameters
4. Fix any TypeScript errors that surface

**Before:**
```tsx
const [products, setProducts] = useState<any[]>([]);
const handleAddToCart = (product: any) => { ... }
```

**After:**
```tsx
const [products, setProducts] = useState<Product[]>([]);
const handleAddToCart = (product: Product) => { ... }
```

**Screens to Update:**
- ShopHomeScreen.tsx
- ProductListingScreen.tsx
- ProductDetailScreen.tsx
- ShoppingCartScreen.tsx
- CheckoutScreen.tsx
- OrdersListScreen.tsx
- OrderTrackingScreen.tsx
- WishlistScreen.tsx
- ProductReviewScreen.tsx

**Expected Outcome:**
- Zero `any` types in shop screens
- Full IntelliSense support
- Type errors caught at compile time

---

#### 2.6 Add Stock Availability Checks
**Files:** `ProductDetailScreen.tsx`, `ShoppingCartScreen.tsx`, `CheckoutScreen.tsx`

**Implementation:**

**ProductDetailScreen - Add to Cart:**
```tsx
const handleAddToCart = async () => {
  // Check stock before adding
  if (product.stock < 1) {
    showToast({
      type: 'error',
      text1: 'Out of Stock',
      text2: 'This product is currently unavailable'
    });
    return;
  }
  
  if (quantity > product.stock) {
    showToast({
      type: 'error',
      text1: 'Insufficient Stock',
      text2: `Only ${product.stock} items available`
    });
    return;
  }
  
  // Proceed with add to cart
  await shopAPI.addToCart({ productId, quantity });
};
```

**ShoppingCartScreen - Quantity Update:**
```tsx
const handleQuantityChange = async (itemId: string, newQuantity: number) => {
  const item = cartItems.find(i => i.id === itemId);
  
  if (newQuantity > item.product.stock) {
    showToast({
      type: 'error',
      text1: 'Stock Limit Reached',
      text2: `Only ${item.product.stock} available`
    });
    return;
  }
  
  await shopAPI.updateCartItem(itemId, { quantity: newQuantity });
};
```

**CheckoutScreen - Cart Validation:**
```tsx
const validateCart = async () => {
  const cart = await shopAPI.getCart();
  
  const outOfStockItems = cart.items.filter(
    item => item.product.stock < item.quantity
  );
  
  if (outOfStockItems.length > 0) {
    showToast({
      type: 'error',
      text1: 'Stock Unavailable',
      text2: 'Some items in your cart are out of stock'
    });
    
    // Navigate back to cart
    router.push('/shop/cart');
    return false;
  }
  
  return true;
};
```

**Expected Outcome:**
- Cannot add out-of-stock items to cart
- Cannot update quantity beyond stock
- Checkout validates stock before proceeding

---

#### 2.7 Cart Staleness Validation
**File:** `CheckoutScreen.tsx`, `ShopPaymentScreen.tsx`

**Implementation:**
```tsx
// CheckoutScreen.tsx
useFocusEffect(
  useCallback(() => {
    const validateCartFreshness = async () => {
      setValidating(true);
      
      try {
        const cart = await shopAPI.getCart();
        
        // Check for price changes
        const priceChanges = cart.items.filter(item => {
          const currentPrice = item.product.discountPrice || item.product.price;
          const cartPrice = item.pricePaisa;
          return currentPrice !== cartPrice;
        });
        
        if (priceChanges.length > 0) {
          Alert.alert(
            'Prices Updated',
            'Some prices in your cart have changed. Please review before checkout.',
            [
              { text: 'Review Cart', onPress: () => router.push('/shop/cart') },
              { text: 'Continue Anyway', style: 'cancel' }
            ]
          );
        }
        
        // Check for stock availability
        const outOfStock = cart.items.filter(
          item => item.product.stock < item.quantity
        );
        
        if (outOfStock.length > 0) {
          showToast({
            type: 'error',
            text1: 'Items Unavailable',
            text2: 'Some items are now out of stock'
          });
          router.push('/shop/cart');
          return;
        }
        
        setCartValid(true);
      } catch (error) {
        console.error('Cart validation error:', error);
      } finally {
        setValidating(false);
      }
    };
    
    validateCartFreshness();
  }, [])
);
```

**Expected Outcome:**
- Cart re-validated on checkout screen focus
- User alerted to price changes
- Blocked from checkout if stock unavailable

---

#### 2.8-2.9 Improve Error Handling & Install Toast Notifications

**Install react-native-toast-message:**
```bash
npm install react-native-toast-message
```

**Configure in App Root:**
```tsx
// mobile/app/_layout.tsx
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <>
      <Stack />
      <Toast />
    </>
  );
}
```

**Create Error Handling Utilities:**
```typescript
// mobile/src/utils/errorHandling.ts
import Toast from 'react-native-toast-message';

export const showErrorToast = (error: unknown) => {
  let message = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as any;
    message = apiError.response?.data?.error || apiError.message;
  }
  
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'bottom',
    visibilityTime: 4000,
  });
};

export const showSuccessToast = (message: string, subtitle?: string) => {
  Toast.show({
    type: 'success',
    text1: message,
    text2: subtitle,
    position: 'bottom',
    visibilityTime: 3000,
  });
};

export const showInfoToast = (message: string, subtitle?: string) => {
  Toast.show({
    type: 'info',
    text1: message,
    text2: subtitle,
    position: 'bottom',
  });
};
```

**Replace All Alert.alert with Toast:**
```tsx
// Before
Alert.alert('Error', 'Failed to add to cart');

// After
showErrorToast('Failed to add to cart');
```

**Add Retry CTAs:**
```tsx
// Error states with retry buttons
{error && (
  <View className="p-4 items-center">
    <Text className="text-gray-600 text-center mb-4">
      {error}
    </Text>
    <TouchableOpacity
      onPress={retryFetch}
      className="bg-purple-600 px-6 py-3 rounded-lg"
    >
      <Text className="text-white font-semibold">Try Again</Text>
    </TouchableOpacity>
  </View>
)}
```

**Expected Outcome:**
- All Alert.alert replaced with Toast
- Specific error messages for each error type
- Retry buttons on error states
- Better UX with non-blocking notifications

---

#### 2.10 Add Address Validation in CheckoutScreen
**File:** `CheckoutScreen.tsx`

**Validation Schema:**
```typescript
const addressSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});
```

**Implementation:**
```tsx
const handleSubmit = async () => {
  try {
    const validated = addressSchema.parse(formData);
    // Proceed with validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      showErrorToast(firstError.message);
    }
  }
};
```

**Expected Outcome:**
- Phone number validated (Indian format)
- Pincode validated (6 digits)
- All required fields enforced
- Clear inline error messages

---

### Phase 2 Testing Checklist
- [ ] TypeScript compiles with no errors
- [ ] IntelliSense works for all shop types
- [ ] Stock check prevents over-quantity add
- [ ] Cart validation catches stale prices
- [ ] Toast notifications show properly
- [ ] Error states have retry buttons
- [ ] Address validation catches invalid inputs
- [ ] All screens use proper types (no `any`)

### Phase 2 Deliverables
- ✅ Full TypeScript type safety
- ✅ Stock validation across all flows
- ✅ Cart staleness checks
- ✅ Toast notification system
- ✅ Comprehensive error handling with retry
- ✅ Address validation
- ✅ Architect approval

---

## 🟢 Phase 3: Polish UX & Advanced Features (Week 2+)

### Objectives
Transform functional screens into delightful experiences with loading states, empty states, optimistic updates, and advanced features.

### 3.1 Loading States with Skeletons

**Install Skeleton Dependency:**
```bash
npm install react-native-skeleton-content
```

**Create Reusable Skeleton Components:**
```tsx
// mobile/src/components/ProductSkeleton.tsx
export const ProductSkeleton = () => (
  <View className="bg-white rounded-lg p-4 mb-4">
    <SkeletonPlaceholder>
      <View>
        <View style={{ width: '100%', height: 150, borderRadius: 8 }} />
        <View style={{ marginTop: 12, width: '80%', height: 20 }} />
        <View style={{ marginTop: 8, width: '60%', height: 16 }} />
        <View style={{ marginTop: 12, width: 100, height: 24 }} />
      </View>
    </SkeletonPlaceholder>
  </View>
);
```

**Implement in Screens:**
```tsx
{loading ? (
  <View>
    <ProductSkeleton />
    <ProductSkeleton />
    <ProductSkeleton />
  </View>
) : (
  <FlatList data={products} ... />
)}
```

**Screens to Update:**
- ShopHomeScreen
- ProductListingScreen
- ShoppingCartScreen
- OrdersListScreen
- WishlistScreen

**Expected Outcome:**
- Smooth loading experience
- No jarring spinner-to-content transitions
- Perceived performance improvement

---

### 3.2 Empty States with Actionable CTAs

**Create Reusable Empty State Component:**
```tsx
// mobile/src/components/EmptyState.tsx
interface EmptyStateProps {
  icon: string; // Lucide icon name
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction
}) => (
  <View className="flex-1 items-center justify-center p-8">
    <Icon name={icon} size={64} color="#9CA3AF" />
    <Text className="text-xl font-bold text-gray-800 mt-6">
      {title}
    </Text>
    <Text className="text-gray-600 text-center mt-2 mb-6">
      {message}
    </Text>
    <TouchableOpacity
      onPress={onAction}
      className="bg-purple-600 px-8 py-3 rounded-lg"
    >
      <Text className="text-white font-semibold">{actionLabel}</Text>
    </TouchableOpacity>
  </View>
);
```

**Implementation Examples:**

**ShopHomeScreen:**
```tsx
{products.length === 0 && !loading && (
  <EmptyState
    icon="shopping-bag"
    title="No Products Available"
    message="Check back soon for new arrivals"
    actionLabel="Refresh"
    onAction={fetchProducts}
  />
)}
```

**ShoppingCartScreen:**
```tsx
{cart.items.length === 0 && (
  <EmptyState
    icon="shopping-cart"
    title="Your Cart is Empty"
    message="Add products to get started"
    actionLabel="Continue Shopping"
    onAction={() => router.push('/shop')}
  />
)}
```

**OrdersListScreen:**
```tsx
{orders.length === 0 && (
  <EmptyState
    icon="package"
    title="No Orders Yet"
    message="Your order history will appear here"
    actionLabel="Start Shopping"
    onAction={() => router.push('/shop')}
  />
)}
```

**WishlistScreen:**
```tsx
{wishlist.length === 0 && (
  <EmptyState
    icon="heart"
    title="No Wishlist Items"
    message="Save products to buy later"
    actionLabel="Browse Products"
    onAction={() => router.push('/shop')}
  />
)}
```

---

### 3.3 Pull-to-Refresh Functionality

**Implementation:**
```tsx
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await fetchProducts();
  setRefreshing(false);
};

<FlatList
  data={products}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#9333EA']} // Purple theme
    />
  }
  ...
/>
```

**Screens to Update:**
- ShopHomeScreen
- ProductListingScreen
- OrdersListScreen
- WishlistScreen

---

### 3.4 Optimistic UI Updates

**Install React Query (if not already):**
```bash
npm install @tanstack/react-query
```

**Configure Query Client:**
```tsx
// mobile/app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => showErrorToast(error),
    },
  },
});
```

**Optimistic Add to Cart:**
```tsx
const addToCartMutation = useMutation({
  mutationFn: (data: { productId: string; quantity: number }) =>
    shopAPI.addToCart(data),
  
  onMutate: async (newItem) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['cart'] });
    
    // Snapshot previous value
    const previousCart = queryClient.getQueryData(['cart']);
    
    // Optimistically update
    queryClient.setQueryData(['cart'], (old: any) => ({
      ...old,
      items: [...old.items, { ...newItem, id: 'temp-' + Date.now() }]
    }));
    
    // Show success immediately
    showSuccessToast('Added to cart');
    
    return { previousCart };
  },
  
  onError: (err, newItem, context) => {
    // Rollback on error
    queryClient.setQueryData(['cart'], context.previousCart);
    showErrorToast('Failed to add to cart');
  },
  
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  },
});
```

**Optimistic Quantity Update:**
```tsx
const updateQuantityMutation = useMutation({
  mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
    shopAPI.updateCartItem(itemId, { quantity }),
  
  onMutate: async ({ itemId, quantity }) => {
    await queryClient.cancelQueries({ queryKey: ['cart'] });
    const previousCart = queryClient.getQueryData(['cart']);
    
    queryClient.setQueryData(['cart'], (old: any) => ({
      ...old,
      items: old.items.map((item: any) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    }));
    
    return { previousCart };
  },
  
  onError: (err, variables, context) => {
    queryClient.setQueryData(['cart'], context.previousCart);
    showErrorToast('Failed to update quantity');
  },
  
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  },
});
```

**Optimistic Wishlist Toggle:**
```tsx
const toggleWishlistMutation = useMutation({
  mutationFn: (productId: string) =>
    isInWishlist
      ? shopAPI.removeFromWishlist(productId)
      : shopAPI.addToWishlist(productId),
  
  onMutate: async (productId) => {
    await queryClient.cancelQueries({ queryKey: ['wishlist'] });
    const previousWishlist = queryClient.getQueryData(['wishlist']);
    
    queryClient.setQueryData(['wishlist'], (old: any) => {
      if (isInWishlist) {
        return old.filter((item: any) => item.productId !== productId);
      } else {
        return [...old, { productId, product }];
      }
    });
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    return { previousWishlist };
  },
  
  onError: (err, productId, context) => {
    queryClient.setQueryData(['wishlist'], context.previousWishlist);
  },
  
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['wishlist'] });
  },
});
```

---

### 3.5 Advanced Features

#### 3.5.1 Saved Addresses

**Create AddressBookScreen:**
- List all saved addresses
- Add new address
- Edit existing address
- Delete address
- Set default address

**Update CheckoutScreen:**
- "Select from Address Book" button
- Quick add new address inline
- Display selected address details

#### 3.5.2 Order Status Filters

**OrdersListScreen Enhancement:**
```tsx
const filters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {filters.map(filter => (
    <TouchableOpacity
      key={filter.value}
      onPress={() => setActiveFilter(filter.value)}
      className={`px-4 py-2 rounded-full mr-2 ${
        activeFilter === filter.value
          ? 'bg-purple-600'
          : 'bg-gray-200'
      }`}
    >
      <Text className={activeFilter === filter.value ? 'text-white' : 'text-gray-700'}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

#### 3.5.3 Product Variants

**ProductDetailScreen Enhancement:**
```tsx
// Variant selector
{product.metadata.variants?.map(variant => (
  <View key={variant.id} className="mb-4">
    <Text className="font-semibold mb-2">{variant.name}</Text>
    <View className="flex-row flex-wrap">
      {variant.options.map(option => (
        <TouchableOpacity
          key={option.value}
          onPress={() => selectVariant(variant.id, option.value)}
          className={`px-4 py-2 rounded-lg mr-2 mb-2 border ${
            selectedVariants[variant.id] === option.value
              ? 'bg-purple-600 border-purple-600'
              : 'bg-white border-gray-300'
          }`}
        >
          <Text className={selectedVariants[variant.id] === option.value ? 'text-white' : 'text-gray-700'}>
            {option.value}
            {option.priceAdjustment > 0 && ` +₹${option.priceAdjustment / 100}`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
))}
```

#### 3.5.4 Image Gallery

**Install react-native-reanimated-carousel:**
```bash
npm install react-native-reanimated-carousel
```

**ProductDetailScreen:**
```tsx
<Carousel
  width={width}
  height={300}
  data={product.images}
  renderItem={({ item }) => (
    <Image
      source={{ uri: item }}
      className="w-full h-full"
      resizeMode="cover"
    />
  )}
  pagingEnabled
  snapEnabled
/>
```

#### 3.5.5 Stock & Price Badges

**ProductCard Component:**
```tsx
{product.stock < 5 && product.stock > 0 && (
  <View className="absolute top-2 right-2 bg-orange-500 px-2 py-1 rounded">
    <Text className="text-white text-xs font-bold">
      Only {product.stock} left
    </Text>
  </View>
)}

{product.stock === 0 && (
  <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded">
    <Text className="text-white text-xs font-bold">Out of Stock</Text>
  </View>
)}

{product.discountPrice && (
  <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded">
    <Text className="text-white text-xs font-bold">
      {Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
    </Text>
  </View>
)}
```

---

### Phase 3 Testing Checklist
- [ ] Loading skeletons display properly
- [ ] Empty states show with correct CTAs
- [ ] Pull-to-refresh works on all list screens
- [ ] Optimistic updates feel instant
- [ ] Optimistic rollback works on error
- [ ] Saved addresses can be managed
- [ ] Order filters work correctly
- [ ] Variant selection updates price
- [ ] Image gallery swipes smoothly
- [ ] Stock badges display accurately

### Phase 3 Deliverables
- ✅ All screens have loading skeletons
- ✅ All empty states implemented
- ✅ Pull-to-refresh on all lists
- ✅ Optimistic updates for cart/wishlist
- ✅ Saved addresses feature
- ✅ Order filters and search
- ✅ Product variants support
- ✅ Image gallery
- ✅ Stock and price badges
- ✅ Final architect review and approval

---

## 📊 Success Metrics

### Performance
- Initial load time < 2 seconds
- Add to cart feedback < 100ms (optimistic)
- Screen transitions smooth 60fps

### UX Quality
- Zero confusing error messages
- All loading states present
- All empty states have CTAs
- All errors have retry options

### Code Quality
- Zero `any` types in production code
- 100% TypeScript strict mode
- All user inputs validated
- Comprehensive error handling

### Security
- Zero XSS vulnerabilities
- All JSON parsing guarded
- All WebViews restricted
- Payment flow fully secure

---

## 🎯 Final Checklist

### Security ✅
- [ ] XSS vulnerability fixed
- [ ] WebView navigation restricted
- [ ] JSON parsing validated
- [ ] Cart validation before payment
- [ ] Double-submit prevented
- [ ] Timeout and offline handling

### Type Safety ✅
- [ ] All `any` types replaced
- [ ] Proper interfaces defined
- [ ] TypeScript strict mode enabled
- [ ] No type errors in build

### UX Excellence ✅
- [ ] Loading skeletons on all screens
- [ ] Empty states with CTAs
- [ ] Pull-to-refresh enabled
- [ ] Toast notifications instead of alerts
- [ ] Optimistic UI updates
- [ ] Error states with retry buttons

### Features ✅
- [ ] Stock validation working
- [ ] Cart staleness checks
- [ ] Address validation
- [ ] Saved addresses
- [ ] Order filters
- [ ] Product variants
- [ ] Image gallery
- [ ] Stock/price badges

### Testing ✅
- [ ] Manual testing of all flows
- [ ] Error scenarios tested
- [ ] Offline scenarios tested
- [ ] Architect approval received

---

## 🚀 Deployment Readiness

Once all phases complete:
1. Full regression testing
2. Performance profiling
3. Security audit
4. Accessibility review
5. Soft launch to beta users
6. Monitor analytics and errors
7. Production deployment

**Target:** Industry-leading mobile shopping experience that delights users and drives conversions.
