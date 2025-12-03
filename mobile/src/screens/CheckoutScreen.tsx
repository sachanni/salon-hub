import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { shopAPI } from '../services/api';
import { CartItem, OrderAddress } from '../types/shop';
import { useToast } from '../components/Toast';

export default function CheckoutScreen() {
  const router = useRouter();
  const toast = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<OrderAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    loadCart();
  }, []);

  // Re-validate cart when screen comes into focus (cart staleness validation)
  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        loadCart(); // Re-fetch cart to validate prices and stock
      }
    }, [loading])
  );

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await shopAPI.getCart();
      if (!data.items || data.items.length === 0) {
        toast.warning('Empty Cart', 'Please add items to your cart before checkout');
        return;
      }
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast.error('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.product?.retailPriceInPaisa || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.18);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const delivery = fulfillmentType === 'delivery' ? 5000 : 0;
    return subtotal + tax + delivery;
  };

  const validateDeliveryAddress = (): boolean => {
    if (fulfillmentType === 'pickup') return true;

    const { fullName, phone, addressLine1, city, state, pincode } = deliveryAddress;
    
    // Check required fields
    if (!fullName.trim()) {
      toast.warning('Validation Error', 'Please enter your full name');
      return false;
    }

    if (!phone.trim()) {
      toast.warning('Validation Error', 'Please enter your phone number');
      return false;
    }

    if (!addressLine1.trim()) {
      toast.warning('Validation Error', 'Please enter your address');
      return false;
    }

    if (!city.trim()) {
      toast.warning('Validation Error', 'Please enter your city');
      return false;
    }

    if (!state.trim()) {
      toast.warning('Validation Error', 'Please enter your state');
      return false;
    }

    if (!pincode.trim()) {
      toast.warning('Validation Error', 'Please enter your pincode');
      return false;
    }

    // Validate phone number format (Indian mobile numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      toast.warning(
        'Invalid Phone Number',
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
      );
      return false;
    }

    // Validate pincode format (Indian pincodes)
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(pincode)) {
      toast.warning(
        'Invalid Pincode',
        'Please enter a valid 6-digit Indian pincode (cannot start with 0)'
      );
      return false;
    }

    return true;
  };

  const handleProceedToPayment = async () => {
    // Validate cart is not empty
    if (cartItems.length === 0) {
      toast.warning('Empty Cart', 'Your cart is empty. Please add items before checkout.');
      return;
    }

    // Validate address before proceeding
    if (!validateDeliveryAddress()) return;

    // Validate stock availability for all items
    const outOfStockItems = cartItems.filter(item => {
      const stock = item.product?.stock ?? 0;
      return stock === 0 || item.quantity > stock;
    });

    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(item => item.product?.name).join(', ');
      toast.error(
        'Stock Unavailable',
        `Some items are out of stock: ${itemNames}. Please update quantities in your cart.`
      );
      return;
    }

    try {
      setProcessing(true);
      
      const salonId = cartItems[0]?.product?.salonId;

      if (!salonId) {
        throw new Error('Invalid cart data - salon ID missing');
      }

      const orderData: {
        salonId: string;
        fulfillmentType: 'pickup' | 'delivery';
        deliveryAddress?: OrderAddress;
      } = {
        salonId,
        fulfillmentType,
      };

      if (fulfillmentType === 'delivery') {
        orderData.deliveryAddress = deliveryAddress;
      }

      router.push({
        pathname: '/shop/payment',
        params: {
          orderData: JSON.stringify(orderData),
          total: calculateTotal().toString(),
        },
      });
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to proceed to payment';
      toast.error('Checkout Error', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fulfillment Type</Text>
          <View style={styles.fulfillmentOptions}>
            <TouchableOpacity
              style={[
                styles.fulfillmentOption,
                fulfillmentType === 'pickup' && styles.fulfillmentOptionActive,
              ]}
              onPress={() => setFulfillmentType('pickup')}
            >
              <Ionicons
                name="storefront"
                size={24}
                color={fulfillmentType === 'pickup' ? '#8B5CF6' : '#6B7280'}
              />
              <Text
                style={[
                  styles.fulfillmentOptionText,
                  fulfillmentType === 'pickup' && styles.fulfillmentOptionTextActive,
                ]}
              >
                Pickup from Salon
              </Text>
              {fulfillmentType === 'pickup' && (
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fulfillmentOption,
                fulfillmentType === 'delivery' && styles.fulfillmentOptionActive,
              ]}
              onPress={() => setFulfillmentType('delivery')}
            >
              <Ionicons
                name="bicycle"
                size={24}
                color={fulfillmentType === 'delivery' ? '#8B5CF6' : '#6B7280'}
              />
              <Text
                style={[
                  styles.fulfillmentOptionText,
                  fulfillmentType === 'delivery' && styles.fulfillmentOptionTextActive,
                ]}
              >
                Home Delivery
              </Text>
              {fulfillmentType === 'delivery' && (
                <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {fulfillmentType === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={deliveryAddress.fullName}
              onChangeText={(text) =>
                setDeliveryAddress({ ...deliveryAddress, fullName: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={deliveryAddress.phone}
              onChangeText={(text) =>
                setDeliveryAddress({ ...deliveryAddress, phone: text })
              }
              keyboardType="phone-pad"
              maxLength={10}
            />
            <TextInput
              style={styles.input}
              placeholder="Address Line 1 *"
              value={deliveryAddress.addressLine1}
              onChangeText={(text) =>
                setDeliveryAddress({ ...deliveryAddress, addressLine1: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Address Line 2 (Optional)"
              value={deliveryAddress.addressLine2}
              onChangeText={(text) =>
                setDeliveryAddress({ ...deliveryAddress, addressLine2: text })
              }
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City *"
                value={deliveryAddress.city}
                onChangeText={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, city: text })
                }
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="State *"
                value={deliveryAddress.state}
                onChangeText={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, state: text })
                }
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Pincode *"
              value={deliveryAddress.pincode}
              onChangeText={(text) =>
                setDeliveryAddress({ ...deliveryAddress, pincode: text })
              }
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({cartItems.length})</Text>
              <Text style={styles.summaryValue}>{formatPrice(calculateSubtotal())}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18%)</Text>
              <Text style={styles.summaryValue}>{formatPrice(calculateTax())}</Text>
            </View>
            {fulfillmentType === 'delivery' && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charges</Text>
                <Text style={styles.summaryValue}>{formatPrice(5000)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatPrice(calculateTotal())}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>{formatPrice(calculateTotal())}</Text>
        </View>
        <TouchableOpacity
          style={[styles.proceedButton, processing && styles.buttonDisabled]}
          onPress={handleProceedToPayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  fulfillmentOptions: {
    gap: 12,
  },
  fulfillmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 12,
  },
  fulfillmentOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  fulfillmentOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  fulfillmentOptionTextActive: {
    color: '#8B5CF6',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerTotalLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
