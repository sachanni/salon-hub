import React, { useState, useEffect } from 'react';
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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { salonAPI } from '../services/api';
import { SalonCard } from '../components/SalonCard';
import { CategoryCard } from '../components/CategoryCard';
import { OfferCard } from '../components/OfferCard';
import { CategorySkeleton, OfferSkeleton, SalonSkeleton } from '../components/SkeletonLoader';
import { locationService, LocationData, LocationError } from '../services/locationService';
import SideMenu from '../components/SideMenu';
import type { Salon, Category, SpecialOffer } from '../types/salon';

const { width } = Dimensions.get('window');

const CATEGORIES: Category[] = [
  { id: '1', name: 'Hair', icon: '✂️', color: '#8B5CF6' },
  { id: '2', name: 'Nails', icon: '💅', color: '#EC4899' },
  { id: '3', name: 'Spa', icon: '🧖', color: '#8B5CF6' },
  { id: '4', name: 'Skin', icon: '😊', color: '#EC4899' },
  { id: '5', name: 'Makeup', icon: '✨', color: '#8B5CF6' },
  { id: '6', name: 'Home', icon: '🏠', color: '#EC4899' },
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

export const HomeScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [allSalons, setAllSalons] = useState<Salon[]>([]);
  const [filteredSalons, setFilteredSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // GPS Location state
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(10); // Default 10km (optimal for salon services)
  const [radiusExpanded, setRadiusExpanded] = useState<boolean>(false);

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

  // Auto-detect GPS location on mount
  const detectLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const location = await locationService.getCurrentLocation();
      setUserLocation(location);
      
      // Fetch salons with location coordinates
      fetchSalons(false, 0, location.coords);
    } catch (err: any) {
      console.error('Location detection error:', err);
      const errorMsg = err.message || 'Unable to detect your location';
      setLocationError(errorMsg);
      
      // Use fallback location
      const fallback = locationService.getFallbackLocation();
      setUserLocation(fallback);
      
      // Fetch salons without location (fallback)
      fetchSalons(false, 0);
      
      // Show user-friendly error
      if (err.code === 'PERMISSION_DENIED') {
        Alert.alert(
          'Location Access',
          'Enable location access to find nearby salons. You can change this in Settings.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchSalons = async (
    isRefreshing = false,
    retryCount = 0,
    coords?: { latitude: number; longitude: number },
    radiusKm?: number
  ) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      // Use provided coords or current user location
      const locationCoords = coords || userLocation?.coords;
      const currentRadius = radiusKm || searchRadius;

      // Pass coordinates as query params for location-based filtering
      const params = locationCoords
        ? {
            lat: locationCoords.latitude,
            lng: locationCoords.longitude,
            radiusKm: currentRadius,
          }
        : undefined;

      const response = await salonAPI.getAllSalons(params);
      const normalized = normalizeSalonData(response);
      
      // Smart auto-expansion: If too few results with default 10km, try 20km
      if (normalized.length < 8 && currentRadius === 10 && !radiusExpanded) {
        console.log(`📍 Only ${normalized.length} salons found within ${currentRadius}km. Expanding to 20km...`);
        setRadiusExpanded(true);
        setSearchRadius(20);
        // Retry with expanded radius
        return fetchSalons(isRefreshing, retryCount, coords, 20);
      }
      
      setAllSalons(normalized);
      applyClientSideFilters(normalized);
    } catch (err: any) {
      console.error('Error fetching salons:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to load salons';
      setError(errorMessage);
      
      if (retryCount < 2) {
        setTimeout(() => fetchSalons(isRefreshing, retryCount + 1, coords), 2000 * (retryCount + 1));
      } else {
        Alert.alert(
          'Error Loading Salons',
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => fetchSalons(false, 0, coords, radiusKm) },
          ]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-detect location on mount (mobile-specific)
  useEffect(() => {
    detectLocation();
  }, []);

  // Debounced filter application
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      applyClientSideFilters();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory, selectedDate, selectedTime, allSalons]);

  const applyClientSideFilters = (salons: Salon[] = allSalons) => {
    let filtered = [...salons];

    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (salon) =>
          salon.name.toLowerCase().includes(query) ||
          salon.category.toLowerCase().includes(query) ||
          salon.location.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((salon) =>
        salon.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Date filter - for now, we just acknowledge the filter is active
    // TODO: Backend integration needed for actual date-based availability filtering
    
    // Time filter - for now, we just acknowledge the filter is active  
    // TODO: Backend integration needed for actual time-based availability filtering

    setFilteredSalons(filtered);
  };

  const applyFilters = () => {
    applyClientSideFilters();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSalons(true);
  };

  const handleSalonPress = (salon: Salon) => {
    router.push(`/salon/${salon.id}`);
  };

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category.name === selectedCategory ? '' : category.name);
  };

  const handleOfferPress = (offer: SpecialOffer) => {
    Alert.alert('Special Offer', offer.title);
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.phoneNumber) return user.phoneNumber.slice(-4);
    return 'Guest';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>Hi,</Text>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{getUserDisplayName()}</Text>
              <Text style={styles.chevronIcon}>▼</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.referButton}>
            <Text style={styles.referText}>REFER{'\n'}& EARN</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/shop')}>
            <Text style={styles.icon}>🛒</Text>
            <View style={styles.badge} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.icon}>🔔</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => setShowSideMenu(true)}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Side Menu */}
      <SideMenu
        visible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        userName={getUserDisplayName()}
        userEmail={getUserEmail()}
      />

      {/* Location Display Section */}
      <View style={styles.locationSection}>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationTextContainer}>
            {locationLoading ? (
              <View style={styles.locationLoadingRow}>
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text style={styles.locationLoadingText}>Detecting location...</Text>
              </View>
            ) : locationError ? (
              <TouchableOpacity onPress={detectLocation} style={styles.locationErrorRow}>
                <Text style={styles.locationErrorText}>Tap to enable location</Text>
                <Text style={styles.locationRefreshIcon}>↻</Text>
              </TouchableOpacity>
            ) : userLocation ? (
              <TouchableOpacity onPress={detectLocation} style={styles.locationActiveRow}>
                <View>
                  <Text style={styles.locationCity}>{userLocation.city}</Text>
                  {userLocation.area && (
                    <Text style={styles.locationArea}>{userLocation.area}</Text>
                  )}
                </View>
                <Text style={styles.chevronIcon}>▼</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.locationDefaultText}>Location unavailable</Text>
            )}
          </View>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'rgba(236, 72, 153, 0.25)', 'rgba(139, 92, 246, 0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <View style={styles.heroBlob3} />

          <TouchableOpacity style={styles.heartButton}>
            <Text style={styles.heartIcon}>♡</Text>
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Book local beauty &{'\n'}wellness services</Text>
            <Text style={styles.heroSubtitle}>Discover top salons, spas & therapists near you</Text>
            <TouchableOpacity style={styles.bookNowButton}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookNowGradient}
              >
                <Text style={styles.bookNowText}>Book Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.carouselDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotInactive]} />
            <View style={[styles.dot, styles.dotInactive]} />
          </View>
        </LinearGradient>
      </View>

      {/* Search & Filter Section */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.05)', 'rgba(139, 92, 246, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.searchSection}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search salons, services..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
          <TouchableOpacity 
            style={selectedDate ? styles.filterPillActive : styles.filterPill}
            onPress={() => setShowFilterModal(true)}
          >
            {selectedDate ? (
              <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterPillActiveGradient}
              >
                <Text style={styles.pillIcon}>📅</Text>
                <Text style={styles.filterPillActiveText}>
                  {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </LinearGradient>
            ) : (
              <>
                <Text style={styles.pillIcon}>📅</Text>
                <Text style={styles.filterPillText}>Date</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={selectedTime ? styles.filterPillActive : styles.filterPill}
            onPress={() => setShowFilterModal(true)}
          >
            {selectedTime ? (
              <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterPillActiveGradient}
              >
                <Text style={styles.pillIcon}>🕐</Text>
                <Text style={styles.filterPillActiveText}>{selectedTime}</Text>
              </LinearGradient>
            ) : (
              <>
                <Text style={styles.pillIcon}>🕐</Text>
                <Text style={styles.filterPillText}>Time</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={selectedCategory ? styles.filterPillActive : styles.filterPill}
            onPress={() => setShowFilterModal(true)}
          >
            {selectedCategory ? (
              <LinearGradient
                colors={['#8B5CF6', '#EC4899', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.filterPillActiveGradient}
              >
                <Text style={styles.pillIcon}>🏷️</Text>
                <Text style={styles.filterPillActiveText}>{selectedCategory}</Text>
              </LinearGradient>
            ) : (
              <>
                <Text style={styles.pillIcon}>🏷️</Text>
                <Text style={styles.filterPillText}>Category</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.genderToggle}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                selectedGender === 'female' && styles.genderButtonActive,
              ]}
              onPress={() => setSelectedGender('female')}
            >
              {selectedGender === 'female' ? (
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.genderButtonGradient}
                >
                  <Text style={styles.genderButtonActiveText}>Female</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.genderButtonText}>Female</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                selectedGender === 'male' && styles.genderButtonActive,
              ]}
              onPress={() => setSelectedGender('male')}
            >
              {selectedGender === 'male' ? (
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.genderButtonGradient}
                >
                  <Text style={styles.genderButtonActiveText}>Male</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.genderButtonText}>Male</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category) => (
            <View key={category.id} style={styles.categoryItem}>
              <CategoryCard category={category} onPress={() => handleCategoryPress(category)} />
            </View>
          ))}
        </View>
      </View>

      {/* Special Offers Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
            <OfferSkeleton />
            <OfferSkeleton />
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.offersScroll}>
            {SPECIAL_OFFERS.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onPress={() => handleOfferPress(offer)} />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Salons Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {loading && !refreshing 
              ? 'Loading Salons...' 
              : (searchQuery || selectedCategory || selectedDate || selectedTime)
                ? `Found ${filteredSalons.length} salons`
                : 'Recently viewed'}
          </Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salonsScroll}>
            <SalonSkeleton />
            <SalonSkeleton />
            <SalonSkeleton />
          </ScrollView>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchSalons()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSalons.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salonsScroll}>
            {filteredSalons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} onPress={() => handleSalonPress(salon)} />
            ))}
          </ScrollView>
        ) : (searchQuery || selectedCategory || selectedDate || selectedTime) ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No salons match your search</Text>
            <Text style={styles.emptySubtext}>
              Try different keywords or clear filters
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedDate(null);
                setSelectedTime('');
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>No salons found nearby</Text>
            <Text style={styles.emptySubtext}>
              We couldn't find any salons in your area
            </Text>
            <TouchableOpacity onPress={() => fetchSalons()} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recommended Section */}
      {!loading && allSalons.length > 0 && (
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.salonsScroll}>
            {allSalons.slice(0, 3).map((salon) => (
              <SalonCard key={`rec-${salon.id}`} salon={salon} onPress={() => handleSalonPress(salon)} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Salons</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Date Selection */}
              <Text style={styles.filterLabel}>Select Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {[...Array(7)].map((_, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() + index);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dateCard, isSelected && styles.dateCardActive]}
                      onPress={() => setSelectedDate(date)}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={['#8B5CF6', '#EC4899']}
                          style={styles.dateCardGradient}
                        >
                          <Text style={styles.dateCardActiveDay}>
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </Text>
                          <Text style={styles.dateCardActiveDate}>
                            {date.getDate()}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <>
                          <Text style={styles.dateCardDay}>
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </Text>
                          <Text style={styles.dateCardDate}>{date.getDate()}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Time Selection */}
              <Text style={styles.filterLabel}>Select Time</Text>
              <View style={styles.timeGrid}>
                {['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM'].map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[styles.timeChip, isSelected && styles.timeChipActive]}
                      onPress={() => setSelectedTime(time)}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={['#8B5CF6', '#EC4899']}
                          style={styles.timeChipGradient}
                        >
                          <Text style={styles.timeChipActiveText}>{time}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.timeChipText}>{time}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category Selection */}
              <Text style={styles.filterLabel}>Select Category</Text>
              <View style={styles.categoryChips}>
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategory === category.name;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(isSelected ? '' : category.name)}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={['#8B5CF6', '#EC4899']}
                          style={styles.categoryChipGradient}
                        >
                          <Text style={styles.categoryChipActiveIcon}>{category.icon}</Text>
                          <Text style={styles.categoryChipActiveText}>{category.name}</Text>
                        </LinearGradient>
                      ) : (
                        <>
                          <Text style={styles.categoryChipIcon}>{category.icon}</Text>
                          <Text style={styles.categoryChipText}>{category.name}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Radius Selection (Mobile-Specific GPS Feature) */}
              <Text style={styles.filterLabel}>Search Radius</Text>
              <View style={styles.radiusChips}>
                {[5, 10, 20].map((radius) => {
                  const isSelected = searchRadius === radius;
                  return (
                    <TouchableOpacity
                      key={radius}
                      style={[styles.radiusChip, isSelected && styles.radiusChipActive]}
                      onPress={() => {
                        setSearchRadius(radius);
                        setRadiusExpanded(false); // Reset expansion flag when manually changed
                      }}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={['#8B5CF6', '#EC4899']}
                          style={styles.radiusChipGradient}
                        >
                          <Text style={styles.radiusChipActiveText}>{radius}km</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.radiusChipText}>{radius}km</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {radiusExpanded && (
                <View style={styles.radiusExpandedNotice}>
                  <Text style={styles.radiusExpandedIcon}>📍</Text>
                  <Text style={styles.radiusExpandedText}>
                    Expanded to {searchRadius}km to show more options
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSelectedDate(null);
                  setSelectedTime('');
                  setSelectedCategory('');
                  setSearchRadius(10); // Reset to default 10km
                  setRadiusExpanded(false);
                  applyFilters();
                  // Refetch salons with default 10km radius
                  if (userLocation) {
                    fetchSalons(false, 0, userLocation.coords, 10);
                  }
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => {
                  applyFilters();
                  // Refetch salons with new radius if location available
                  if (userLocation) {
                    fetchSalons(false, 0, userLocation.coords, searchRadius);
                  }
                  setShowFilterModal(false);
                }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.applyFiltersGradient}
                >
                  <Text style={styles.applyFiltersText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#D1D5DB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 22,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nameText: {
    fontSize: 14,
    color: '#6B7280',
  },
  chevronIcon: {
    fontSize: 10,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  referButton: {
    borderWidth: 1,
    borderColor: '#EC4899',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  referText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EC4899',
    textAlign: 'center',
    lineHeight: 12,
  },
  iconButton: {
    position: 'relative',
  },
  icon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    backgroundColor: '#EC4899',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  pointsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pointsText: {
    fontSize: 6,
    fontWeight: '700',
    color: '#EC4899',
    position: 'absolute',
    top: 4,
  },
  pointsIcon: {
    fontSize: 14,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: '#6B7280',
    borderRadius: 1,
  },
  locationSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationIcon: {
    fontSize: 20,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  locationErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationErrorText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  locationRefreshIcon: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  locationActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationCity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  locationArea: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  locationDefaultText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  heroCard: {
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroBlob1: {
    position: 'absolute',
    top: -24,
    left: -24,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 48,
  },
  heroBlob2: {
    position: 'absolute',
    bottom: -32,
    right: -32,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderRadius: 64,
  },
  heroBlob3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 40,
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heartIcon: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  heroContent: {
    zIndex: 5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 26,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 16,
  },
  bookNowButton: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bookNowGradient: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  bookNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    zIndex: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#8B5CF6',
  },
  dotInactive: {
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterButton: {
    width: 56,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filterIcon: {
    fontSize: 18,
  },
  filterPills: {
    marginTop: 20,
  },
  filterPillActive: {
    borderRadius: 9999,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterPillActiveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  filterPillActiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    marginRight: 12,
    gap: 8,
    borderWidth: 3,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pillIcon: {
    fontSize: 14,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  section: {
    paddingTop: 24,
  },
  lastSection: {
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  genderButtonActive: {
    overflow: 'hidden',
  },
  genderButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  genderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  genderButtonActiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoriesGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: (width - 64) / 3,
  },
  offersScroll: {
    paddingLeft: 20,
  },
  salonsScroll: {
    paddingLeft: 20,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearButton: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '400',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginTop: 8,
  },
  dateScroll: {
    marginBottom: 20,
  },
  dateCard: {
    width: 70,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dateCardActive: {
    borderColor: '#8B5CF6',
  },
  dateCardGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCardDay: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateCardDate: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '700',
    marginTop: 4,
  },
  dateCardActiveDay: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dateCardActiveDate: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 4,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  timeChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  timeChipActive: {
    borderColor: '#8B5CF6',
  },
  timeChipGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  timeChipActiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  categoryChipActive: {
    borderColor: '#8B5CF6',
  },
  categoryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryChipActiveIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipActiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    overflow: 'hidden',
  },
  radiusChipActive: {
    borderColor: '#8B5CF6',
  },
  radiusChipGradient: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  radiusChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  radiusChipActiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  radiusExpandedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  radiusExpandedIcon: {
    fontSize: 16,
  },
  radiusExpandedText: {
    flex: 1,
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  applyFiltersButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyFiltersGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
