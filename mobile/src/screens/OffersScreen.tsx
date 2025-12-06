import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { offersAPI } from '../services/api';
import type { DetailedOffer, OfferCategory } from '../types/salon';

const { width } = Dimensions.get('window');

const OFFER_CATEGORIES: { id: OfferCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Offers', icon: 'pricetags' },
  { id: 'hair', label: 'Hair Care', icon: 'cut' },
  { id: 'spa', label: 'Spa & Massage', icon: 'leaf' },
  { id: 'nails', label: 'Nails', icon: 'color-palette' },
  { id: 'makeup', label: 'Makeup', icon: 'sparkles' },
  { id: 'skin', label: 'Skin Care', icon: 'sunny' },
];

const SAMPLE_OFFERS: DetailedOffer[] = [
  {
    id: '1',
    title: 'Haircut & Styling Package',
    description: 'Premium haircut with wash & blow dry',
    originalPrice: 999,
    discountedPrice: 499,
    discountPercent: 50,
    category: 'hair',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    salon: { id: 's1', name: 'Glamour Studio', rating: 4.8, distance: 1.2 },
    validTill: '2024-12-31',
    isTrending: true,
    isNew: false,
    isSaved: false,
  },
  {
    id: '2',
    title: 'Full Body Massage',
    description: '90-minute relaxing aromatherapy massage',
    originalPrice: 2499,
    discountedPrice: 1499,
    discountPercent: 40,
    category: 'spa',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
    salon: { id: 's2', name: 'Serenity Spa', rating: 4.9, distance: 0.8 },
    validTill: '2024-12-25',
    isTrending: true,
    isNew: false,
    isSaved: true,
  },
  {
    id: '3',
    title: 'Gel Manicure + Pedicure',
    description: 'Long-lasting gel polish with spa treatment',
    originalPrice: 1599,
    discountedPrice: 799,
    discountPercent: 50,
    category: 'nails',
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
    salon: { id: 's3', name: 'Nail Art Studio', rating: 4.7, distance: 2.1 },
    validTill: '2024-12-20',
    isTrending: false,
    isNew: true,
    isSaved: false,
  },
  {
    id: '4',
    title: 'Bridal Makeup Package',
    description: 'Complete bridal look with HD makeup & hair styling',
    originalPrice: 15000,
    discountedPrice: 9999,
    discountPercent: 33,
    category: 'makeup',
    imageUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
    salon: { id: 's4', name: 'Bridal Beauty Lounge', rating: 4.9, distance: 3.5 },
    validTill: '2024-12-31',
    isTrending: true,
    isNew: false,
    isSaved: false,
  },
  {
    id: '5',
    title: 'Hydra Facial Treatment',
    description: 'Deep cleansing facial with hydration boost',
    originalPrice: 3500,
    discountedPrice: 1999,
    discountPercent: 43,
    category: 'skin',
    imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
    salon: { id: 's5', name: 'Glow Skin Clinic', rating: 4.6, distance: 1.8 },
    validTill: '2024-12-28',
    isTrending: false,
    isNew: true,
    isSaved: false,
  },
  {
    id: '6',
    title: 'Hair Color + Treatment',
    description: 'Global color with L\'Oreal products + deep conditioning',
    originalPrice: 4500,
    discountedPrice: 2499,
    discountPercent: 44,
    category: 'hair',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    salon: { id: 's6', name: 'Color Lab Salon', rating: 4.8, distance: 2.5 },
    validTill: '2024-12-30',
    isTrending: true,
    isNew: false,
    isSaved: false,
  },
];

export default function OffersScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<OfferCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState<DetailedOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<DetailedOffer[]>([]);
  const [savedOffers, setSavedOffers] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingOffers, setSavingOffers] = useState<Set<string>>(new Set());

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState({ hours: 12, minutes: 34, seconds: 56 });

  useEffect(() => {
    fetchOffers();
    fetchSavedOffers();
  }, []);

  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    filterOffers();
  }, [selectedCategory, searchQuery, offers]);

  const fetchOffers = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);
      
      const response = await offersAPI.getOffers({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      
      if (response.success && response.offers) {
        setOffers(response.offers);
      } else {
        setOffers(SAMPLE_OFFERS);
      }
    } catch (err: any) {
      console.log('Using sample offers (API not available)');
      setOffers(SAMPLE_OFFERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSavedOffers = async () => {
    try {
      const response = await offersAPI.getSavedOffers();
      if (response.success && response.savedOfferIds) {
        setSavedOffers(new Set(response.savedOfferIds));
      }
    } catch (err) {
      console.log('Saved offers not available');
    }
  };

  const filterOffers = () => {
    let filtered = [...offers];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((offer) => offer.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (offer) =>
          offer.title.toLowerCase().includes(query) ||
          offer.description.toLowerCase().includes(query) ||
          offer.salon.name.toLowerCase().includes(query)
      );
    }

    setFilteredOffers(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOffers();
    fetchSavedOffers();
  }, []);

  const toggleSaveOffer = async (offerId: string) => {
    if (savingOffers.has(offerId)) return;

    const wasSaved = savedOffers.has(offerId);
    
    setSavingOffers((prev) => new Set(prev).add(offerId));
    setSavedOffers((prev) => {
      const newSet = new Set(prev);
      if (wasSaved) {
        newSet.delete(offerId);
      } else {
        newSet.add(offerId);
      }
      return newSet;
    });

    try {
      if (wasSaved) {
        await offersAPI.unsaveOffer(offerId);
      } else {
        await offersAPI.saveOffer(offerId);
      }
    } catch (err) {
      setSavedOffers((prev) => {
        const newSet = new Set(prev);
        if (wasSaved) {
          newSet.add(offerId);
        } else {
          newSet.delete(offerId);
        }
        return newSet;
      });
      Alert.alert('Error', 'Failed to update saved offers. Please try again.');
    } finally {
      setSavingOffers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(offerId);
        return newSet;
      });
    }
  };

  const handleOfferPress = (offer: DetailedOffer) => {
    router.push(`/salon/${offer.salon.id}`);
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const formatCountdown = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`;
  };

  const trendingOffers = filteredOffers.filter((o) => o.isTrending);
  const regularOffers = filteredOffers.filter((o) => !o.isTrending);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers & Deals</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        <LinearGradient
          colors={['#8B5CF6', '#EC4899', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <View style={styles.heroBlob3} />

          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.heroIconRow}>
                <View style={styles.heroIconBg}>
                  <Ionicons name="gift" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.heroTitle}>Save Big Today!</Text>
              </View>
              <Text style={styles.heroSubtitle}>Exclusive deals on beauty & wellness services</Text>
              <View style={styles.countdownContainer}>
                <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                <Text style={styles.countdownLabel}>Ends in</Text>
                <Text style={styles.countdownValue}>{formatCountdown()}</Text>
              </View>
            </View>

            <View style={styles.heroRight}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountValue}>50</Text>
                <Text style={styles.discountPercent}>% OFF</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {OFFER_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              {selectedCategory === category.id ? (
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.categoryTabGradient}
                >
                  <Text style={styles.categoryTabTextActive}>{category.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.categoryTabText}>{category.label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {trendingOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Offers</Text>
              <View style={styles.hotDealsLabel}>
                <Ionicons name="flame" size={16} color="#F97316" />
                <Text style={styles.hotDealsText}>Hot Deals</Text>
              </View>
            </View>

            {trendingOffers.map((offer) => (
              <OfferListCard
                key={offer.id}
                offer={offer}
                isSaved={savedOffers.has(offer.id)}
                onPress={() => handleOfferPress(offer)}
                onToggleSave={() => toggleSaveOffer(offer.id)}
                formatPrice={formatPrice}
              />
            ))}
          </View>
        )}

        {regularOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' ? 'All Offers' : `${OFFER_CATEGORIES.find(c => c.id === selectedCategory)?.label} Offers`}
              </Text>
              <Text style={styles.offerCount}>{regularOffers.length} offers</Text>
            </View>

            {regularOffers.map((offer) => (
              <OfferListCard
                key={offer.id}
                offer={offer}
                isSaved={savedOffers.has(offer.id)}
                onPress={() => handleOfferPress(offer)}
                onToggleSave={() => toggleSaveOffer(offer.id)}
                formatPrice={formatPrice}
              />
            ))}
          </View>
        )}

        {filteredOffers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No offers found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? `No offers matching "${searchQuery}"`
                : 'No offers available in this category'}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.emptyStateButtonText}>View All Offers</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

interface OfferListCardProps {
  offer: DetailedOffer;
  isSaved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
  formatPrice: (price: number) => string;
}

const OfferListCard: React.FC<OfferListCardProps> = ({
  offer,
  isSaved,
  onPress,
  onToggleSave,
  formatPrice,
}) => {
  const savings = offer.originalPrice - offer.discountedPrice;

  return (
    <TouchableOpacity style={styles.offerCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.offerImageContainer}>
        <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} />
        <View
          style={[
            styles.discountTag,
            { backgroundColor: offer.discountPercent >= 40 ? '#EC4899' : '#8B5CF6' },
          ]}
        >
          <Text style={styles.discountTagText}>{offer.discountPercent}% OFF</Text>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={onToggleSave}>
          <Ionicons
            name={isSaved ? 'heart' : 'heart-outline'}
            size={20}
            color={isSaved ? '#EC4899' : '#6B7280'}
          />
        </TouchableOpacity>
        {offer.isNew && (
          <View style={styles.newTag}>
            <Text style={styles.newTagText}>NEW</Text>
          </View>
        )}
      </View>

      <View style={styles.offerContent}>
        <Text style={styles.offerTitle} numberOfLines={1}>
          {offer.title}
        </Text>
        <Text style={styles.offerDescription} numberOfLines={1}>
          {offer.description}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>{formatPrice(offer.originalPrice)}</Text>
          <Text style={styles.discountedPrice}>{formatPrice(offer.discountedPrice)}</Text>
          <View style={styles.savingsTag}>
            <Text style={styles.savingsText}>Save {formatPrice(savings)}</Text>
          </View>
        </View>

        <View style={styles.salonRow}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.ratingText}>{offer.salon.rating}</Text>
          </View>
          <Text style={styles.salonDot}>•</Text>
          <Text style={styles.salonName} numberOfLines={1}>
            {offer.salon.name}
          </Text>
          {offer.salon.distance !== undefined && (
            <>
              <Text style={styles.salonDot}>•</Text>
              <Text style={styles.distanceText}>{offer.salon.distance} km</Text>
            </>
          )}
        </View>

        <View style={styles.validityRow}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.validityText}>
            Valid till: {new Date(offer.validTill).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={onPress}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButtonGradient}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

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
  searchButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  heroBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    height: 180,
    overflow: 'hidden',
  },
  heroBlob1: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroBlob2: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
  },
  heroBlob3: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
  },
  heroIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    lineHeight: 18,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  countdownLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countdownValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  heroRight: {
    marginLeft: 16,
  },
  discountBadge: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  discountValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  discountPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryTabs: {
    marginTop: 16,
    paddingBottom: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  categoryTabActive: {
    borderWidth: 0,
    padding: 0,
    overflow: 'hidden',
  },
  categoryTabGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  categoryTabTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  hotDealsLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hotDealsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  offerCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerImageContainer: {
    height: 140,
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  discountTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  discountTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  newTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  offerContent: {
    padding: 16,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  savingsTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#DCFCE7',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  salonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  salonDot: {
    marginHorizontal: 6,
    color: '#9CA3AF',
  },
  salonName: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  validityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#8B5CF6',
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
