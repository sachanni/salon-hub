import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopAPI } from '../services/api';
import { CartItem, ProductMetadata } from '../types/shop';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';

export default function ShoppingCartScreen() {
  const router = useRouter();
  const toast = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await shopAPI.getCart();
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load cart. Please check your connection.';
      toast.error('Cart Loading Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await handleRemoveItem(itemId);
      return;
    }

    // Optimistic update: Update UI immediately for better UX
    const previousCartItems = [...cartItems];
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );

    try {
      await shopAPI.updateCartItem(itemId, newQuantity);
      // Success - UI already updated optimistically
    } catch (error) {
      console.error('Update quantity error:', error);
      // Revert optimistic update on error
      setCartItems(previousCartItems);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quantity. Please try again.';
      toast.error('Update Failed', errorMessage);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    // Optimistic update: Remove from UI immediately
    const previousCartItems = [...cartItems];
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));

    try {
      await shopAPI.removeCartItem(itemId);
      // Success - UI already updated optimistically
    } catch (error) {
      console.error('Remove item error:', error);
      // Revert optimistic update on error
      setCartItems(previousCartItems);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item from cart. Please try again.';
      toast.error('Removal Failed', errorMessage);
    }
  };

  const handleClearCart = () => {
    toast.show({
      type: 'warning',
      title: 'Clear Cart?',
      message: 'This will remove all items from your cart',
      duration: 5000,
      action: {
        label: 'Clear All',
        onPress: async () => {
          try {
            await shopAPI.clearCart();
            setCartItems([]);
            toast.success('Cart Cleared', 'All items removed from cart');
          } catch (error) {
            console.error('Clear cart error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to clear cart. Please try again.';
            toast.error('Clear Cart Failed', errorMessage);
          }
        },
      },
    });
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning('Empty Cart', 'Please add items to cart before checkout');
      return;
    }
    router.push('/shop/checkout');
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = item.product?.retailPriceInPaisa || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const product = item.product;
    if (!product) return null;

    // Safely parse metadata with fallback
    const metadata: ProductMetadata = product.metadata 
      ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata)
      : {};
    const imageUrl = metadata?.images?.[0];

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity onPress={() => router.push(`/shop/product/${product.id}`)}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={32} color="#D1D5DB" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.itemBrand}>{product.brand}</Text>
          <Text style={styles.itemPrice}>{formatPrice(product.retailPriceInPaisa)}</Text>

          <View style={styles.itemActions}>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#111827" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => handleRemoveItem(item.id)}
              style={styles.removeButton}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
        {cartItems.length === 0 && <View style={{ width: 60 }} />}
      </View>

      {cartItems.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Browse our collection and add products to your cart"
          actionLabel="Start Shopping"
          onAction={() => router.push('/shop')}
        />
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cartList}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCart();
            }}
          />

          <View style={styles.footer}>
            <View style={styles.totalSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatPrice(calculateTotal())}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax (18%)</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(Math.round(calculateTotal() * 0.18))}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>
                  {formatPrice(calculateTotal() + Math.round(calculateTotal() * 0.18))}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleProceedToCheckout}
            >
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
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
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  totalSection: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  checkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
