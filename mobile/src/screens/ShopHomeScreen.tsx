import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Pressable,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Category, Product, ProductMetadata } from '../types/shop';
import { ProductListSkeleton, CategoryChipSkeleton } from '../components/LoadingSkeleton';
import { useShopCategories, useShopProducts, useCart, queryKeys } from '../hooks/useQueries';
import CachedImage from '../components/CachedImage';
import { shopAPI } from '../services/api';

const CategoryItem = memo(({ item, onPress }: { item: Category; onPress: () => void }) => (
  <Pressable 
    style={styles.categoryCard}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${item.name} category with ${item.productCount || 0} items`}
  >
    <View style={styles.categoryIcon}>
      <Ionicons name="pricetag" size={24} color="#8B5CF6" />
    </View>
    <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
    <Text style={styles.categoryCount}>{item.productCount || 0} items</Text>
  </Pressable>
));

const ProductItem = memo(({ item, onPress, formatPrice }: { item: Product; onPress: () => void; formatPrice: (paisa: number) => string }) => {
  const metadata: ProductMetadata = useMemo(() => 
    item.metadata 
      ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata)
      : {},
    [item.metadata]
  );
  const imageUrl = metadata?.images?.[0];
  const rating = metadata?.averageRating || 0;

  return (
    <Pressable 
      style={styles.productCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name} by ${item.brand}, ${formatPrice(item.retailPriceInPaisa)}`}
    >
      {imageUrl ? (
        <CachedImage 
          source={{ uri: imageUrl }} 
          style={styles.productImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.productImage, styles.productPlaceholder]}>
          <Ionicons name="image-outline" size={40} color="#999" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{formatPrice(item.retailPriceInPaisa)}</Text>
          {rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFA500" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const ErrorState = memo(({ onRetry }: { onRetry: () => void }) => (
  <View style={errorStyles.container}>
    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
    <Text style={errorStyles.title}>Failed to load shop</Text>
    <Text style={errorStyles.message}>Please check your connection and try again</Text>
    <Pressable style={errorStyles.retryButton} onPress={onRetry}>
      <Ionicons name="refresh" size={20} color="#FFFFFF" />
      <Text style={errorStyles.retryButtonText}>Retry</Text>
    </Pressable>
  </View>
));

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function ShopHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading, 
    isError: categoriesError,
    refetch: refetchCategories 
  } = useShopCategories();
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    isError: productsError,
    refetch: refetchProducts 
  } = useShopProducts({ limit: 10 });
  const { data: cartData, refetch: refetchCart } = useCart();

  const categories = useMemo(() => categoriesData?.categories || [], [categoriesData]);
  const featuredProducts = useMemo(() => productsData?.products || [], [productsData]);
  const cartItemCount = useMemo(() => cartData?.items?.length || 0, [cartData]);
  
  const loading = categoriesLoading || productsLoading;
  const hasError = categoriesError || productsError;

  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.shop.wishlist,
      queryFn: () => shopAPI.getWishlist(),
    });
  }, [queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchProducts(), refetchCart()]);
    setRefreshing(false);
  }, [refetchCategories, refetchProducts, refetchCart]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/shop/products?search=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, router]);

  const formatPrice = useCallback((paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  }, []);

  const renderCategory = useCallback((item: Category) => (
    <CategoryItem 
      item={item} 
      onPress={() => router.push(`/shop/products?category=${item.name}`)} 
    />
  ), [router]);

  const renderProduct = useCallback((item: Product) => (
    <ProductItem 
      item={item} 
      onPress={() => router.push(`/shop/product/${item.id}`)} 
      formatPrice={formatPrice}
    />
  ), [router, formatPrice]);

  const categoryKeyExtractor = useCallback((item: Category) => item.name, []);
  const productKeyExtractor = useCallback((item: Product) => item.id, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Shop</Text>
            <View style={styles.headerActions}>
              <View style={styles.iconButton} />
              <View style={styles.iconButton} />
            </View>
          </View>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <CategoryChipSkeleton count={5} />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <ProductListSkeleton count={6} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Shop</Text>
          </View>
        </View>
        <ErrorState onRetry={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Shop</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/shop/wishlist')} style={styles.iconButton}>
              <Ionicons name="heart-outline" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/shop/cart')} style={styles.iconButton}>
              <Ionicons name="cart-outline" size={24} color="#333" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <TouchableOpacity onPress={() => router.push('/shop/products')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList<Category>
            horizontal
            data={categories}
            renderItem={({ item }) => renderCategory(item)}
            keyExtractor={categoryKeyExtractor}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => router.push('/shop/products')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList<Product>
            data={featuredProducts}
            renderItem={({ item }) => renderProduct(item)}
            keyExtractor={productKeyExtractor}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
          />
        </View>

        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => router.push('/shop/orders')}
        >
          <Ionicons name="receipt-outline" size={24} color="#8B5CF6" />
          <Text style={styles.ordersButtonText}>View My Orders</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  categoriesList: {
    paddingVertical: 8,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    width: '48%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  productPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
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
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  ordersButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
