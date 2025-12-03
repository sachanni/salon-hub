import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { shopAPI } from '../services/api';
import { Product, Category, ProductMetadata, CategoryChip } from '../types/shop';
import { ProductListSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { FilterBottomSheet, FilterOptions } from '../components/FilterBottomSheet';

export default function ProductListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState((params.search as string) || '');
  const [selectedCategory, setSelectedCategory] = useState((params.category as string) || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [selectedCategory, searchQuery]);

  const loadCategories = async () => {
    try {
      const data = await shopAPI.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await shopAPI.getProducts({
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        limit: 50,
      });
      setAllProducts(data.products || []);
      applyFilters(data.products || [], activeFilters);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (productList: Product[], filters: FilterOptions) => {
    let filtered = [...productList];

    if (filters.priceRange) {
      filtered = filtered.filter(
        (p) =>
          p.retailPriceInPaisa >= filters.priceRange!.min &&
          p.retailPriceInPaisa <= filters.priceRange!.max
      );
    }

    if (filters.minRating) {
      filtered = filtered.filter((p) => {
        const metadata = p.metadata as ProductMetadata | null;
        const rating = metadata?.averageRating ?? 0;
        return rating >= filters.minRating!;
      });
    }

    if (filters.brands && filters.brands.length > 0) {
      filtered = filtered.filter((p) => filters.brands!.includes(p.brand));
    }

    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          filtered.sort((a, b) => a.retailPriceInPaisa - b.retailPriceInPaisa);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.retailPriceInPaisa - a.retailPriceInPaisa);
          break;
        case 'rating_desc':
          filtered.sort((a, b) => {
            const aRating = (a.metadata as ProductMetadata | null)?.averageRating ?? 0;
            const bRating = (b.metadata as ProductMetadata | null)?.averageRating ?? 0;
            return bRating - aRating;
          });
          break;
        case 'popularity':
          filtered.sort((a, b) => {
            const aReviews = (a.metadata as ProductMetadata | null)?.reviewCount ?? 0;
            const bReviews = (b.metadata as ProductMetadata | null)?.reviewCount ?? 0;
            return bReviews - aReviews;
          });
          break;
      }
    }

    setProducts(filtered);
  };

  const handleApplyFilters = (filters: FilterOptions) => {
    setActiveFilters(filters);
    applyFilters(allProducts, filters);
  };

  const getAvailableBrands = (): string[] => {
    const brands = new Set(allProducts.map((p) => p.brand));
    return Array.from(brands).sort();
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (activeFilters.priceRange) count++;
    if (activeFilters.minRating) count++;
    if (activeFilters.brands && activeFilters.brands.length > 0) count++;
    if (activeFilters.sortBy) count++;
    return count;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const formatPrice = (paisa: number) => {
    return `₹${(paisa / 100).toFixed(2)}`;
  };

  const renderProduct = ({ item }: { item: Product }) => {
    // Safely parse metadata with fallback
    const metadata: ProductMetadata = item.metadata 
      ? (typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata)
      : {};
    const imageUrl = metadata?.images?.[0];
    const rating = metadata?.averageRating || 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/shop/product/${item.id}`)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.productPlaceholder]}>
            <Ionicons name="image-outline" size={40} color="#999" />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productBrand}>{item.brand}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>{formatPrice(item.retailPriceInPaisa)}</Text>
            {rating > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFA500" />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          {!item.availableForRetail && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>Not available for retail</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products</Text>
          <TouchableOpacity onPress={() => router.push('/shop/cart')} style={styles.cartButton}>
            <Ionicons name="cart-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color="#8B5CF6" />
            {getActiveFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {categories.length > 0 && (
          <FlatList<CategoryChip>
            horizontal
            data={[{ name: 'All' }, ...categories]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  (item.name === 'All' && !selectedCategory) || selectedCategory === item.name
                    ? styles.categoryChipActive
                    : null,
                ]}
                onPress={() => setSelectedCategory(item.name === 'All' ? '' : item.name)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    (item.name === 'All' && !selectedCategory) || selectedCategory === item.name
                      ? styles.categoryChipTextActive
                      : null,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.name}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          />
        )}
      </View>

      {loading && !refreshing ? (
        <ProductListSkeleton count={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No Products Found"
          message={searchQuery ? `No results for "${searchQuery}". Try different keywords or filters.` : "We couldn't find any products matching your criteria."}
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('');
          }}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          columnWrapperStyle={styles.productRow}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
        availableBrands={getAvailableBrands()}
      />
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
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  cartButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#8B5CF6',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  productList: {
    padding: 16,
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
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: '#9CA3AF',
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
  unavailableBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  unavailableText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
});
