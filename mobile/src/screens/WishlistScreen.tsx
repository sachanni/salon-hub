import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopAPI } from '../services/api';

export default function WishlistScreen() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await shopAPI.getWishlist();
      setWishlistItems(data.wishlist || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await shopAPI.removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      Alert.alert('Error', 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (product: any) => {
    try {
      await shopAPI.addToCart({
        productId: product.id,
        quantity: 1,
        salonId: product.salonId,
      });
      Alert.alert('Success', 'Product added to cart!');
    } catch (error: any) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to add to cart');
    }
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const renderWishlistItem = ({ item }: { item: any }) => {
    const product = item.product;
    if (!product) return null;

    const metadata = typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata;
    const imageUrl = metadata?.images?.[0];
    const rating = metadata?.averageRating || 0;

    return (
      <View style={styles.wishlistItem}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => router.push(`/shop/product/${product.id}`)}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, styles.imagePlaceholder]}>
              <Ionicons name="image-outline" size={40} color="#D1D5DB" />
            </View>
          )}

          <View style={styles.itemDetails}>
            <Text style={styles.itemName} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.itemBrand}>{product.brand}</Text>
            {rating > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFA500" />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            )}
            <Text style={styles.itemPrice}>{formatPrice(product.retailPriceInPaisa)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => handleAddToCart(product)}
            disabled={!product.availableForRetail}
          >
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFromWishlist(product.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {wishlistItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyText}>Save your favorite products here</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => router.push('/shop')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.product.id}
          contentContainerStyle={styles.wishlistList}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadWishlist();
          }}
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
  wishlistList: {
    padding: 16,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
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
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemBrand: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  itemActions: {
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  addToCartButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
