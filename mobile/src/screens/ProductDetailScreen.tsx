import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopAPI } from '../services/api';
import { Product, Review, ProductMetadata } from '../types/shop';
import { useToast } from '../components/Toast';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [id]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const [productData, reviewsData] = await Promise.all([
        shopAPI.getProductById(id as string),
        shopAPI.getProductReviews(id as string, { limit: 5 }),
      ]);
      setProduct(productData.product);
      setReviews(reviewsData.reviews || []);
    } catch (error) {
      console.error('Error loading product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load product details. Please check your connection.';
      toast.error('Loading Error', errorMessage);
    } finally{
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Stock availability check before adding to cart
    // Treat undefined/null stock as 0 (out of stock)
    const productStock = product.stock ?? 0;
    
    if (productStock === 0) {
      toast.warning('Out of Stock', 'This product is currently out of stock');
      return;
    }
    
    if (quantity > productStock) {
      toast.warning(
        'Insufficient Stock',
        `Only ${productStock} ${productStock === 1 ? 'item' : 'items'} available in stock. Please adjust the quantity.`
      );
      return;
    }
    
    try {
      setAddingToCart(true);
      await shopAPI.addToCart({
        productId: product.id,
        quantity,
        salonId: product.salonId,
      });
      toast.success('Added to Cart', 'Product added to cart successfully!');
    } catch (error) {
      console.error('Add to cart error:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null && 
        'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data !== null &&
        'error' in error.response.data
        ? String(error.response.data.error)
        : 'Failed to add to cart. Please try again.';
      toast.error('Add to Cart Failed', errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    
    // Optimistic update: Toggle UI immediately
    const previousState = isInWishlist;
    setIsInWishlist(!isInWishlist);
    
    try {
      setAddingToWishlist(true);
      if (previousState) {
        await shopAPI.removeFromWishlist(product.id);
        // Success - UI already updated optimistically
      } else {
        await shopAPI.addToWishlist(product.id);
        // Success - UI already updated optimistically
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      // Revert optimistic update on error
      setIsInWishlist(previousState);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update wishlist. Please try again.';
      toast.error('Wishlist Update Failed', errorMessage);
    } finally {
      setAddingToWishlist(false);
    }
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color="#FFA500"
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const metadata = typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata;
  const images = metadata?.images || [];
  const averageRating = metadata?.averageRating || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/shop/cart')} style={styles.iconButton}>
          <Ionicons name="cart-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setSelectedImageIndex(index);
              }}
            >
              {images.map((img: string, idx: number) => (
                <Image key={idx} source={{ uri: img }} style={styles.productImage} />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.imagePagination}>
                {images.map((_: any, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.paginationDot,
                      idx === selectedImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.productImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={64} color="#D1D5DB" />
          </View>
        )}

        <View style={styles.productInfoSection}>
          <View style={styles.productHeader}>
            <View style={styles.productTitleContainer}>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleWishlist}
              disabled={addingToWishlist}
              style={styles.wishlistButton}
            >
              <Ionicons
                name={isInWishlist ? 'heart' : 'heart-outline'}
                size={28}
                color={isInWishlist ? '#EF4444' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.productPrice}>{formatPrice(product.retailPriceInPaisa)}</Text>

          {averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>{renderStars(Math.round(averageRating))}</View>
              <Text style={styles.ratingText}>
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </Text>
            </View>
          )}

          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {reviews.slice(0, 3).map((review: any) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      <View style={styles.reviewAvatar}>
                        <Ionicons name="person" size={20} color="#8B5CF6" />
                      </View>
                      <View>
                        <Text style={styles.reviewAuthorName}>Customer</Text>
                        <View style={styles.reviewStars}>{renderStars(review.rating)}</View>
                      </View>
                    </View>
                  </View>
                  {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addToCartButton, addingToCart && styles.buttonDisabled]}
          onPress={handleAddToCart}
          disabled={addingToCart || !product.availableForRetail}
        >
          {addingToCart ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
              <Text style={styles.addToCartText}>
                {product.availableForRetail ? 'Add to Cart' : 'Not Available'}
              </Text>
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  productImage: {
    width,
    height: width,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
  },
  productInfoSection: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productTitleContainer: {
    flex: 1,
  },
  productBrand: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  wishlistButton: {
    marginLeft: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewAuthor: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  addToCartButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addToCartText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
