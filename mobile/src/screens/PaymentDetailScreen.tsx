import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopAPI } from '../services/api';

export default function PaymentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await shopAPI.getOrderById(orderId);
      if (response.success && response.order) {
        setOrder(response.order);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return { bg: '#ECFDF5', text: '#10B981', border: '#10B981' };
      case 'pending':
      case 'processing':
        return { bg: '#FFF7ED', text: '#F59E0B', border: '#F59E0B' };
      case 'shipped':
        return { bg: '#EFF6FF', text: '#3B82F6', border: '#3B82F6' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444', border: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#6B7280' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Receipt</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Receipt</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Order Not Found</Text>
          <Text style={styles.emptyStateText}>This order may have been deleted</Text>
        </View>
      </View>
    );
  }

  const statusColors = getStatusColor(order.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Receipt</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt Header */}
        <View style={styles.receiptHeader}>
          <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          <Text style={styles.receiptTitle}>Order Confirmed</Text>
          <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.bg, borderColor: statusColors.border },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Order Date */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Order Date</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location-outline" size={18} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.addressText}>{order.deliveryAddress}</Text>
            {order.fulfillmentType && (
              <View style={styles.fulfillmentBadge}>
                <Ionicons
                  name={order.fulfillmentType === 'delivery' ? 'bicycle-outline' : 'storefront-outline'}
                  size={14}
                  color="#6B7280"
                />
                <Text style={styles.fulfillmentText}>
                  {order.fulfillmentType === 'delivery' ? 'Home Delivery' : 'Pickup at Salon'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Order Items */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Order Items</Text>
          </View>
          {order.items && order.items.map((item: any, index: number) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName || 'Product'}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.pricePaisa / 100).toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{(order.subtotalPaisa / 100).toFixed(0)}</Text>
          </View>

          {order.taxPaisa > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (18% GST)</Text>
              <Text style={styles.summaryValue}>₹{(order.taxPaisa / 100).toFixed(0)}</Text>
            </View>
          )}

          {order.deliveryFeePaisa > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{(order.deliveryFeePaisa / 100).toFixed(0)}</Text>
            </View>
          )}

          {order.discountPaisa > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.discountLabel]}>Discount</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -₹{(order.discountPaisa / 100).toFixed(0)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{(order.totalAmountPaisa / 100).toFixed(0)}</Text>
          </View>

          <View style={styles.paymentMethodRow}>
            <Ionicons name="card-outline" size={16} color="#6B7280" />
            <Text style={styles.paymentMethodText}>
              {order.paymentMethod === 'razorpay' ? 'Paid Online' : 'Pay at Salon'}
            </Text>
          </View>
        </View>

        {/* Salon Info */}
        {order.salonName && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="business-outline" size={18} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Salon Details</Text>
            </View>
            <Text style={styles.salonName}>{order.salonName}</Text>
          </View>
        )}

        {/* Order ID */}
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderId}>{order.id}</Text>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#8B5CF6" />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  shareButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  orderNumber: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    marginBottom: 12,
  },
  fulfillmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  fulfillmentText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  discountLabel: {
    color: '#10B981',
  },
  discountValue: {
    color: '#10B981',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  paymentMethodText: {
    fontSize: 13,
    color: '#6B7280',
  },
  salonName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  orderIdContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  orderIdLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#111827',
  },
  helpSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
