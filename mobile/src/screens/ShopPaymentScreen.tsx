import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopAPI } from '../services/api';
import { RazorpayCheckout } from '../components/RazorpayCheckout';
import { CartItem, OrderAddress, FulfillmentType } from '../types/shop';
import { z } from 'zod';

// Zod schema for order data validation
const OrderDataSchema = z.object({
  salonId: z.string().optional(),
  fulfillmentType: z.enum(['pickup', 'delivery']),
  deliveryAddress: z.object({
    fullName: z.string(),
    phone: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
  }).optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

type ValidatedOrderData = z.infer<typeof OrderDataSchema>;

interface RazorpayOrder {
  razorpayOrderId: string;
  amountInPaisa: number;
  currency: string;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export default function ShopPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'pay_at_salon'>('pay_at_salon');
  const [processing, setProcessing] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<RazorpayOrder | null>(null);
  const [cartValid, setCartValid] = useState(false);
  const [validatingCart, setValidatingCart] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false); // Submission lock to prevent double-submit

  // Safely parse and validate orderData
  let orderData: ValidatedOrderData | null = null;
  let total = 0;

  try {
    const parsedData = params.orderData ? JSON.parse(params.orderData as string) : {};
    const validated = OrderDataSchema.parse(parsedData);
    orderData = validated;
    total = parseInt(params.total as string || '0');
  } catch (error) {
    console.error('Order data validation error:', error);
    // Will show error state below
  }

  // Validate cart on mount
  useEffect(() => {
    const validateCart = async () => {
      try {
        setValidatingCart(true);
        const cart = await shopAPI.getCart();

        // Check if cart exists and has items
        if (!cart || !cart.items || cart.items.length === 0) {
          setCartError('Your cart is empty');
          setCartValid(false);
          return;
        }

        // Check for out of stock items
        const outOfStockItems = cart.items.filter(
          (item: CartItem) => {
            const stock = item.product?.stock ?? 0;
            return stock < item.quantity;
          }
        );

        if (outOfStockItems.length > 0) {
          setCartError('Some items in your cart are out of stock');
          setCartValid(false);
          return;
        }

        setCartValid(true);
        setCartError(null);
      } catch (error) {
        console.error('Cart validation error:', error);
        setCartError('Failed to validate cart');
        setCartValid(false);
      } finally {
        setValidatingCart(false);
      }
    };

    validateCart();
  }, []);

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const handleRazorpayPayment = async () => {
    // Prevent double-submit
    if (isSubmittingRef.current) {
      return;
    }

    // Validate orderData is present
    if (!orderData || !orderData.fulfillmentType) {
      Alert.alert('Error', 'Invalid order data. Please try again.');
      router.back();
      return;
    }

    // Re-validate cart before payment
    if (!cartValid) {
      Alert.alert('Cart Error', cartError || 'Please review your cart before proceeding');
      return;
    }

    try {
      isSubmittingRef.current = true;
      setProcessing(true);

      const razorpayOrder = await shopAPI.createRazorpayOrder({
        salonId: orderData.salonId,
        fulfillmentType: orderData.fulfillmentType,
      });

      setRazorpayOrderData(razorpayOrder);
      setShowRazorpay(true);
      setProcessing(false);
      isSubmittingRef.current = false;
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null && 
        'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data !== null &&
        'error' in error.response.data
        ? String(error.response.data.error)
        : 'Failed to initiate payment. Please try again.';
      Alert.alert('Payment Error', errorMessage);
      setProcessing(false);
      isSubmittingRef.current = false;
    }
  };

  const handleRazorpaySuccess = async (response: RazorpayResponse) => {
    // Prevent double-submit
    if (isSubmittingRef.current) {
      return;
    }

    // Defensive guard: Ensure orderData is valid
    if (!orderData || !orderData.fulfillmentType) {
      Alert.alert('Error', 'Invalid order data. Please try again.');
      setShowRazorpay(false);
      router.back();
      return;
    }

    try {
      isSubmittingRef.current = true;
      setShowRazorpay(false);
      setProcessing(true);

      const finalOrderData = {
        ...orderData,
        paymentMethod: 'razorpay' as const,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      };

      const orderResponse = await shopAPI.createOrder(finalOrderData);

      router.push({
        pathname: '/shop/order-confirmation',
        params: {
          orderId: orderResponse.order.id,
          orderNumber: orderResponse.order.orderNumber,
        },
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null && 
        'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data !== null &&
        'error' in error.response.data
        ? String(error.response.data.error)
        : 'Payment verification failed. Please contact support.';
      Alert.alert('Order Creation Failed', errorMessage);
      isSubmittingRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpayFailure = (error: unknown) => {
    setShowRazorpay(false);
    const errorMessage = typeof error === 'object' && error !== null && 'description' in error
      ? String(error.description)
      : 'Payment was unsuccessful. Please try again.';
    Alert.alert('Payment Failed', errorMessage);
  };

  const handleRazorpayDismiss = () => {
    setShowRazorpay(false);
    isSubmittingRef.current = false; // Reset submission lock
    Alert.alert(
      'Payment Cancelled',
      'You cancelled the payment. Your items are still in the cart.'
    );
  };

  // Show error state if cart validation failed
  if (validatingCart) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Validating cart...</Text>
        </View>
      </View>
    );
  }

  if (cartError || !cartValid) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorStateContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorStateTitle}>Cart Error</Text>
          <Text style={styles.errorStateMessage}>
            {cartError || 'Unable to proceed with payment'}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/shop/cart')}
            style={styles.errorStateButton}
          >
            <Text style={styles.errorStateButtonText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handlePlaceOrder = async () => {
    // Prevent double-submit
    if (isSubmittingRef.current) {
      return;
    }

    // Validate orderData is present
    if (!orderData || !orderData.fulfillmentType) {
      Alert.alert('Error', 'Invalid order data. Please try again.');
      router.back();
      return;
    }

    // Re-validate cart before placing order
    if (!cartValid) {
      Alert.alert('Cart Error', cartError || 'Please review your cart before proceeding');
      return;
    }

    if (selectedMethod === 'razorpay') {
      await handleRazorpayPayment();
      return;
    }

    try {
      isSubmittingRef.current = true;
      setProcessing(true);
      const finalOrderData = {
        ...orderData,
        paymentMethod: 'pay_at_salon' as const,
      };

      const response = await shopAPI.createOrder(finalOrderData);

      router.push({
        pathname: '/shop/order-confirmation',
        params: {
          orderId: response.order.id,
          orderNumber: response.order.orderNumber,
        },
      });
    } catch (error) {
      console.error('Place order error:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null && 
        'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data !== null &&
        'error' in error.response.data
        ? String(error.response.data.error)
        : 'Failed to place order. Please try again.';
      Alert.alert('Order Error', errorMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: handlePlaceOrder }
      ]);
      isSubmittingRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>{formatPrice(total)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'pay_at_salon' && styles.paymentOptionActive,
            ]}
            onPress={() => setSelectedMethod('pay_at_salon')}
          >
            <View style={styles.paymentIconContainer}>
              <Ionicons
                name="storefront"
                size={28}
                color={selectedMethod === 'pay_at_salon' ? '#8B5CF6' : '#6B7280'}
              />
            </View>
            <View style={styles.paymentDetails}>
              <Text
                style={[
                  styles.paymentTitle,
                  selectedMethod === 'pay_at_salon' && styles.paymentTitleActive,
                ]}
              >
                Pay at Salon
              </Text>
              <Text style={styles.paymentDescription}>
                Pay when you pick up or receive your order
              </Text>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            </View>
            {selectedMethod === 'pay_at_salon' && (
              <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'razorpay' && styles.paymentOptionActive,
            ]}
            onPress={() => setSelectedMethod('razorpay')}
          >
            <View style={styles.paymentIconContainer}>
              <Ionicons
                name="card"
                size={28}
                color={selectedMethod === 'razorpay' ? '#8B5CF6' : '#6B7280'}
              />
            </View>
            <View style={styles.paymentDetails}>
              <Text
                style={[
                  styles.paymentTitle,
                  selectedMethod === 'razorpay' && styles.paymentTitleActive,
                ]}
              >
                Pay Now
              </Text>
              <Text style={styles.paymentDescription}>
                UPI, Cards, Net Banking, Wallets
              </Text>
            </View>
            {selectedMethod === 'razorpay' && (
              <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>
                {orderData.fulfillmentType === 'delivery'
                  ? 'Home Delivery'
                  : 'Pickup from Salon'}
              </Text>
            </View>
            {orderData.deliveryAddress && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <Text style={styles.detailText}>
                  {orderData.deliveryAddress.addressLine1}, {orderData.deliveryAddress.city}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.secureInfo}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={styles.secureInfoText}>
            Your payment information is secure and encrypted
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, processing && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeOrderButtonText}>
                {selectedMethod === 'razorpay' ? 'Pay Now' : 'Place Order'}
              </Text>
              <Text style={styles.placeOrderAmount}>{formatPrice(total)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {razorpayOrderData && (
        <RazorpayCheckout
          visible={showRazorpay}
          orderId={razorpayOrderData.order.id}
          amount={razorpayOrderData.order.amount}
          currency={razorpayOrderData.order.currency}
          keyId={razorpayOrderData.keyId}
          prefill={{
            name: orderData.customerName || '',
            contact: orderData.customerPhone || '',
          }}
          onSuccess={handleRazorpaySuccess}
          onFailure={handleRazorpayFailure}
          onDismiss={handleRazorpayDismiss}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  amountCard: {
    backgroundColor: '#8B5CF6',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#E9D5FF',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  paymentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  paymentTitleActive: {
    color: '#8B5CF6',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  secureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  secureInfoText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  placeOrderButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  placeOrderButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeOrderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorStateMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorStateButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
