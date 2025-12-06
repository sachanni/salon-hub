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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { salonAPI } from '../services/api';
import { SalonCard } from '../components/SalonCard';
import { CategoryCard } from '../components/CategoryCard';
import { OfferCard } from '../components/OfferCard';
import { ProfileHeader } from '../components/ProfileHeader';
import { CategorySkeleton, OfferSkeleton, SalonSkeleton } from '../components/SkeletonLoader';
import { locationService, LocationData } from '../services/locationService';
import type { Salon, Category, SpecialOffer } from '../types/salon';

const { width } = Dimensions.get('window');

const HOME_CATEGORIES: Category[] = [
  { id: '1', name: 'Haircut', icon: '✂️', color: '#8B5CF6' },
  { id: '2', name: 'Facial', icon: '🧖', color: '#EC4899' },
  { id: '3', name: 'Massage', icon: '💆', color: '#8B5CF6' },
  { id: '4', name: 'Waxing', icon: '🌟', color: '#EC4899' },
  { id: '5', name: 'Makeup', icon: '💄', color: '#8B5CF6' },
  { id: '6', name: 'Mehendi', icon: '🎨', color: '#EC4899' },
];

const HOME_OFFERS: SpecialOffer[] = [
  {
    id: '1',
    title: 'Home Service Discount',
    description: 'Get 25% off on first home visit',
    price: '₹399',
    badge: 'HOME',
    badgeColor: '#10B981',
    icon: '🏠',
    iconColor: '#FFFFFF',
  },
  {
    id: '2',
    title: 'Combo Package',
    description: 'Facial + Massage at home',
    price: '₹799',
    badge: 'COMBO',
    badgeColor: '#F59E0B',
    icon: '💫',
    iconColor: '#FFFFFF',
  },
];

export const AtHomeScreen = () => {
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
  const [notificationCount, setNotificationCount] = useState(0);

  const normalizeSalonData = (data: any): Salon[] => {
    try {
      const salonsArray = Array.isArray(data) ? data : (data?.salons || []);
      return salonsArray
        .filter((salon: any) => salon.providesHomeService || salon.provides_home_service)
        .map((salon: any) => ({
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
      fetchServices(false, 0, location.coords);
    } catch (err: any) {
      console.error('Location detection error:', err);
      setLocationError(err.message || 'Unable to detect your location');
      const fallback = locationService.getFallbackLocation();
      setUserLocation(fallback);
      fetchServices(false, 0);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchServices = async (
    isRefreshing = false,
    retryCount = 0,
    coords?: { latitude: number; longitude: number }
  ) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const locationCoords = coords || userLocation?.coords;
      const params = locationCoords
        ? { lat: locationCoords.latitude, lng: locationCoords.longitude, radiusKm: 20, homeService: true }
        : { homeService: true };
      const response = await salonAPI.getAllSalons(params);
      const normalized = normalizeSalonData(response);
      setAllSalons(normalized);
      applyFilters(normalized, searchQuery, selectedCategory);
    } catch (err: any) {
      console.error('Error fetching services:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to load services';
      setError(errorMessage);
      if (retryCount < 2) {
        setTimeout(() => fetchServices(isRefreshing, retryCount + 1, coords), 2000 * (retryCount + 1));
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
    router.push(`/salon/${salonId}?serviceType=home`);
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="home" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Services at Your Doorstep</Text>
              <Text style={styles.heroSubtitle}>Professional beauticians come to your home</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search home services..."
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
          <Text style={styles.sectionTitle}>Popular Home Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {loading ? (
              Array(6).fill(0).map((_, i) => <CategorySkeleton key={i} />)
            ) : (
              HOME_CATEGORIES.map((category) => (
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
            <Text style={styles.sectionTitle}>Home Service Offers</Text>
            <TouchableOpacity onPress={() => router.push('/offers')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
            {loading ? (
              Array(2).fill(0).map((_, i) => <OfferSkeleton key={i} />)
            ) : (
              HOME_OFFERS.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onPress={() => handleOfferPress(offer.id)} />
              ))
            )}
          </ScrollView>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.howItWorksContainer}>
            <View style={styles.howItWorksStep}>
              <View style={[styles.stepIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.stepTitle}>Book</Text>
              <Text style={styles.stepDescription}>Choose service & time</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.howItWorksStep}>
              <View style={[styles.stepIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="person" size={24} color="#10B981" />
              </View>
              <Text style={styles.stepTitle}>Confirm</Text>
              <Text style={styles.stepDescription}>Expert assigned</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.howItWorksStep}>
              <View style={[styles.stepIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="sparkles" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.stepTitle}>Relax</Text>
              <Text style={styles.stepDescription}>Enjoy at home</Text>
            </View>
          </View>
        </View>

        {/* Available Services */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available in Your Area</Text>
            <Text style={styles.resultCount}>{filteredSalons.length} providers</Text>
          </View>

          {loading ? (
            Array(3).fill(0).map((_, i) => <SalonSkeleton key={i} />)
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchServices()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredSalons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No home services available</Text>
              <Text style={styles.emptySubtext}>We're expanding to your area soon!</Text>
            </View>
          ) : (
            filteredSalons.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onPress={() => handleSalonPress(salon.id)}
                badge="Home Service"
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
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
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
    color: '#10B981',
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
  howItWorksContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
  },
  howItWorksStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepConnector: {
    width: 32,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 27,
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
    backgroundColor: '#10B981',
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
