import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { salonAPI, offersAPI } from '../services/api';
import { SalonCard } from '../components/SalonCard';
import { CategoryCard } from '../components/CategoryCard';
import { OfferCard } from '../components/OfferCard';
import { ProfileHeader } from '../components/ProfileHeader';
import { CategorySkeleton, OfferSkeleton, SalonSkeleton } from '../components/SkeletonLoader';
import { locationService, LocationData } from '../services/locationService';
import type { Salon, Category, SpecialOffer } from '../types/salon';

const { width } = Dimensions.get('window');

const CATEGORIES: Category[] = [
  { id: '1', name: 'Hair', icon: '✂️', color: '#8B5CF6' },
  { id: '2', name: 'Nails', icon: '💅', color: '#EC4899' },
  { id: '3', name: 'Spa', icon: '🧖', color: '#8B5CF6' },
  { id: '4', name: 'Skin', icon: '😊', color: '#EC4899' },
  { id: '5', name: 'Makeup', icon: '✨', color: '#8B5CF6' },
  { id: '6', name: 'Bridal', icon: '👰', color: '#EC4899' },
];

const SPECIAL_OFFERS: SpecialOffer[] = [
  {
    id: '1',
    title: 'First Visit Discount',
    description: 'Get 30% off on your first booking',
    price: '₹299',
    badge: 'NEW',
    badgeColor: '#EC4899',
    icon: '%',
    iconColor: '#FFFFFF',
  },
  {
    id: '2',
    title: 'Weekend Special',
    description: 'Spa packages at half price',
    price: '₹499',
    badge: '50% OFF',
    badgeColor: '#8B5CF6',
    icon: '🎁',
    iconColor: '#FFFFFF',
  },
];

export const AtSalonScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(10);
  const [notificationCount, setNotificationCount] = useState(0);

  const normalizeSalonData = (data: any): Salon[] => {
    try {
      const salonsArray = Array.isArray(data) ? data : (data?.salons || []);
      return salonsArray.map((salon: any) => ({
        id: salon.id || '',
        name: salon.name || 'Unnamed Salon',
        rating: parseFloat(salon.rating?.toString() || '0') || 0,
        reviewCount: parseInt(salon.reviewCount?.toString() || '0', 10) || 0,
        location: salon.location || salon.address || '',
        address: salon.address || '',
        category: salon.category || 'Beauty Services',
        priceRange: salon.priceRange || salon.price_range || '₹₹',
        openTime: salon.openTime || salon.open_time || '',
        image: salon.image || '',
        imageUrls: Array.isArray(salon.imageUrls) ? salon.imageUrls : [],
        latitude: parseFloat(salon.latitude?.toString() || '0') || 0,
        longitude: parseFloat(salon.longitude?.toString() || '0') || 0,
        services: Array.isArray(salon.services) ? salon.services : [],
        distance_km: salon.distance_km ? parseFloat(salon.distance_km.toString()) : undefined,
        hasPackages: Boolean(salon.hasPackages || salon.has_packages),
        hasGoogleReviews: Boolean(salon.hasGoogleReviews || salon.has_google_reviews),
      }));
    } catch (err) {
      console.error('Error normalizing salon data:', err);
      return [];
    }
  };

  const detectLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      fetchSalons(false, 0, location.coords);
    } catch (err: any) {
      console.error('Location detection error:', err);
      const errorMsg = err.message || 'Unable to detect your location';
      setLocationError(errorMsg);
      const fallback = locationService.getFallbackLocation();
      setUserLocation(fallback);
      fetchSalons(false, 0);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchSalons = async (
    isRefreshing = false,
    retryCount = 0,
    coords?: { latitude: number; longitude: number }
  ) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const locationCoords = coords || userLocation?.coords;
      const params = locationCoords
        ? { lat: locationCoords.latitude, lng: locationCoords.longitude, radiusKm: searchRadius }
        : undefined;
      const response = await salonAPI.getAllSalons(params);
      const normalized = normalizeSalonData(response);
      setAllSalons(normalized);
      applyFilters(normalized, searchQuery, selectedCategory);
    } catch (err: any) {
      console.error('Error fetching salons:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to load salons';
      setError(errorMessage);
      if (retryCount < 2) {
        setTimeout(() => fetchSalons(isRefreshing, retryCount + 1, coords), 2000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (salons: Salon[], query: string, category: string) => {
    let filtered = [...salons];
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (salon) =>
          salon.name.toLowerCase().includes(lowerQuery) ||
          salon.location.toLowerCase().includes(lowerQuery) ||
          salon.category.toLowerCase().includes(lowerQuery)
      );
    }
    if (category) {
      filtered = filtered.filter((salon) =>
        salon.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    setFilteredSalons(filtered);
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    applyFilters(allSalons, searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    detectLocation();
  }, []);

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(selectedCategory === categoryName ? '' : categoryName);
  };

  const handleSalonPress = (salonId: string) => {
    router.push(`/salon/${salonId}`);
  };

  const handleOfferPress = (offerId: string) => {
    router.push('/offers');
  };

  const locationDisplayText = userLocation?.displayName || 
    (locationLoading ? 'Detecting...' : locationError ? 'Location unavailable' : 'Delhi NCR');

  return (
    <View style={styles.container}>
      <ProfileHeader
        showLocation
        location={locationDisplayText}
        onLocationPress={detectLocation}
        showNotificationBadge
        notificationCount={notificationCount}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <Text style={styles.heroTitle}>Visit a Salon</Text>
          <Text style={styles.heroSubtitle}>Book appointments at top-rated salons near you</Text>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search salons, services..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {loading ? (
              Array(6).fill(0).map((_, i) => <CategorySkeleton key={i} />)
            ) : (
              CATEGORIES.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.name}
                  onPress={() => handleCategorySelect(category.name)}
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* Special Offers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <TouchableOpacity onPress={() => router.push('/offers')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
            {loading ? (
              Array(2).fill(0).map((_, i) => <OfferSkeleton key={i} />)
            ) : (
              SPECIAL_OFFERS.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onPress={() => handleOfferPress(offer.id)} />
              ))
            )}
          </ScrollView>
        </View>

        {/* Nearby Salons */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Salons</Text>
            <Text style={styles.resultCount}>
              {filteredSalons.length} found within {searchRadius}km
            </Text>
          </View>

          {loading ? (
            Array(3).fill(0).map((_, i) => <SalonSkeleton key={i} />)
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchSalons()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredSalons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No salons found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : (
            filteredSalons.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onPress={() => handleSalonPress(salon.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#111827',
  },
  section: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  resultCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoriesScroll: {
    paddingLeft: 16,
  },
  offersScroll: {
    paddingLeft: 16,
  },
  lastSection: {
    paddingBottom: 80,
    paddingHorizontal: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
