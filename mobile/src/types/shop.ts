/**
 * Comprehensive TypeScript interfaces for the mobile shop module
 * Eliminates all 'any' types and provides proper type safety
 */

// ============= Product Types =============

export interface ProductMetadata {
  images?: string[];
  averageRating?: number;
  reviewCount?: number;
  tags?: string[];
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  ingredients?: string[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  options: string[];
  priceModifier?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  categoryId: string;
  salonId: string;
  retailPriceInPaisa: number;
  discountedPriceInPaisa?: number;
  stock?: number; // Optional - API might not include stock
  availableForRetail?: boolean; // Optional flag for retail availability
  metadata?: ProductMetadata | string; // Optional - may be absent in some responses
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithCategory extends Product {
  category?: Category;
}

// ============= Category Types =============

export interface Category {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
  imageUrl?: string;
  createdAt?: string; // Optional for synthetic categories like "All"
  updatedAt?: string; // Optional for synthetic categories like "All"
}

// Type for category chips that includes synthetic "All" category
export type CategoryChip = Category | { name: 'All'; id?: string };

// ============= Cart Types =============

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  addedAt: string;
  product: Product;
}

export interface Cart {
  id: string;
  userId: string;
  salonId?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  itemCount: number;
  subtotalInPaisa: number;
  discountInPaisa: number;
  taxInPaisa: number;
  totalInPaisa: number;
}

// ============= Wishlist Types =============

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: string;
  product: Product;
}

export interface Wishlist {
  items: WishlistItem[];
  totalItems: number;
}

// ============= Order Types =============

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type FulfillmentType = 'pickup' | 'delivery';

export type PaymentMethod = 'razorpay' | 'pay_at_salon' | 'cod';

export interface OrderAddress {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

// ============= Saved Address Types =============

export interface SavedAddress extends OrderAddress {
  id: string;
  userId: string;
  label?: string; // e.g., "Home", "Office", "Other"
  createdAt: string;
  updatedAt: string;
}

export interface SavedAddressFormData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  label?: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceInPaisa: number;
  discountInPaisa?: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  salonId?: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: OrderAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotalInPaisa: number;
  discountInPaisa: number;
  taxInPaisa: number;
  deliveryChargesInPaisa: number;
  totalInPaisa: number;
  items: OrderItem[];
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

// ============= Review Types =============

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  imageUrls?: string[];
  verified: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userInitials?: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ============= Payment Types =============

export interface RazorpayOrderResponse {
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  keyId: string;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ============= API Response Types =============

export interface ProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
}

export interface CartResponse {
  cart: Cart;
  items: CartItem[];
  summary: CartSummary;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  summary: ReviewSummary;
  total: number;
  limit: number;
  offset: number;
}

export interface WishlistResponse {
  items: WishlistItem[];
  totalItems: number;
}

// ============= Form Data Types =============

export interface CheckoutFormData {
  fulfillmentType: FulfillmentType;
  deliveryAddress?: OrderAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface ReviewFormData {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface AddressFormData {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefault?: boolean;
}

// ============= Validation Schemas (for Zod) =============

export interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  emptyCart: boolean;
  outOfStockItems: string[];
  changedPrices: Array<{
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

// ============= Filter & Search Types =============

export interface ProductFilters {
  category?: string;
  search?: string;
  salonId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  fulfillmentType?: FulfillmentType;
  dateFrom?: string;
  dateTo?: string;
}
