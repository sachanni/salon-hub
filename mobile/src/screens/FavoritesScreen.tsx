import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { favoritesAPI } from '../services/api';

interface Salon {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  rating: string;
  reviewCount: number;
  imageUrl: string | null;
  category: string;
  priceRange: string;
  favoritedAt: string;
  isFavorite: boolean;
}

interface Stylist {
  id: string;
  name: string;
  title: string;
  bio: string;
  imageUrl: string | null;
  rating: string;
  reviewCount: number;
  specializations: string[];
  salon: {
    id: string;
    name: string;
    address: string;
    imageUrl: string | null;
  };
  favoritedAt: string;
  isFavorite: boolean;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'salons' | 'stylists'>('salons');
  
  const [salons, setSalons] = useState<Salon[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [counts, setCounts] = useState({ salons: 0, stylists: 0 });

  const fetchFavorites = useCallback(async () => {
    try {
      const [salonsRes, stylistsRes, countRes] = await Promise.all([
        favoritesAPI.getFavoriteSalons(),
        favoritesAPI.getFavoriteStylists(),
        favoritesAPI.getFavoritesCount(),
      ]);

      if (salonsRes.success) {
        setSalons(salonsRes.salons);
      }
      if (stylistsRes.success) {
        setStylists(stylistsRes.stylists);
      }
      if (countRes.success) {
        setCounts({ salons: countRes.salons, stylists: countRes.stylists });
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveSalon = async (salonId: string, salonName: string) => {
    Alert.alert(
      'Remove from Favorites',
      `Remove ${salonName} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoritesAPI.removeFavoriteSalon(salonId);
              setSalons(prev => prev.filter(s => s.id !== salonId));
              setCounts(prev => ({ ...prev, salons: prev.salons - 1 }));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const handleRemoveStylist = async (staffId: string, stylistName: string) => {
    Alert.alert(
      'Remove from Favorites',
      `Remove ${stylistName} from your favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoritesAPI.removeFavoriteStylist(staffId);
              setStylists(prev => prev.filter(s => s.id !== staffId));
              setCounts(prev => ({ ...prev, stylists: prev.stylists - 1 }));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const navigateToSalon = (salonId: string) => {
    router.push(`/salon/${salonId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Favorites</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'salons' && styles.activeTab]}
        onPress={() => setActiveTab('salons')}
      >
        <Ionicons 
          name="business-outline" 
          size={20} 
          color={activeTab === 'salons' ? '#E91E63' : '#6B7280'} 
        />
        <Text style={[styles.tabText, activeTab === 'salons' && styles.activeTabText]}>
          Salons ({counts.salons})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stylists' && styles.activeTab]}
        onPress={() => setActiveTab('stylists')}
      >
        <Ionicons 
          name="person-outline" 
          size={20} 
          color={activeTab === 'stylists' ? '#E91E63' : '#6B7280'} 
        />
        <Text style={[styles.tabText, activeTab === 'stylists' && styles.activeTabText]}>
          Stylists ({counts.stylists})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSalonCard = (salon: Salon) => (
    <TouchableOpacity
      key={salon.id}
      style={styles.card}
      onPress={() => navigateToSalon(salon.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardImageContainer}>
        {salon.imageUrl ? (
          <Image source={{ uri: salon.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="business" size={40} color="#D1D5DB" />
          </View>
        )}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveSalon(salon.id, salon.name);
          }}
        >
          <Ionicons name="heart" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{salon.name}</Text>
        
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{salon.rating || '4.5'}</Text>
          <Text style={styles.reviewCount}>({salon.reviewCount || 0} reviews)</Text>
          <View style={styles.priceRange}>
            <Text style={styles.priceRangeText}>{salon.priceRange || '$$'}</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText} numberOfLines={1}>
            {salon.address}, {salon.city}
          </Text>
        </View>
        
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{salon.category || 'Salon'}</Text>
          </View>
          <Text style={styles.savedDate}>
            Saved {formatDate(salon.favoritedAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStylistCard = (stylist: Stylist) => (
    <TouchableOpacity
      key={stylist.id}
      style={styles.card}
      onPress={() => navigateToSalon(stylist.salon.id)}
      activeOpacity={0.7}
    >
      <View style={styles.stylistCardHeader}>
        <View style={styles.stylistAvatarContainer}>
          {stylist.imageUrl ? (
            <Image source={{ uri: stylist.imageUrl }} style={styles.stylistAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color="#9CA3AF" />
            </View>
          )}
        </View>
        
        <View style={styles.stylistInfo}>
          <Text style={styles.stylistName}>{stylist.name}</Text>
          <Text style={styles.stylistTitle}>{stylist.title || 'Stylist'}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{stylist.rating || '4.5'}</Text>
            <Text style={styles.reviewCount}>({stylist.reviewCount || 0})</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.favoriteButtonStylist}
          onPress={() => handleRemoveStylist(stylist.id, stylist.name)}
        >
          <Ionicons name="heart" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      {stylist.specializations && stylist.specializations.length > 0 && (
        <View style={styles.specializationsRow}>
          {stylist.specializations.slice(0, 3).map((spec, index) => (
            <View key={index} style={styles.specializationBadge}>
              <Text style={styles.specializationText}>{spec}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.salonInfoRow}>
        <Ionicons name="business-outline" size={14} color="#6B7280" />
        <Text style={styles.salonInfoText} numberOfLines={1}>
          {stylist.salon.name}
        </Text>
      </View>
      
      <Text style={styles.savedDate}>
        Saved {formatDate(stylist.favoritedAt)}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (activeTab === 'salons') {
      if (salons.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No favorite salons yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the heart icon on any salon to save it here
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/at-salon')}
            >
              <Text style={styles.exploreButtonText}>Explore Salons</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return salons.map(renderSalonCard);
    } else {
      if (stylists.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No favorite stylists yet</Text>
            <Text style={styles.emptySubtitle}>
              Follow your favorite stylists to see their availability
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(tabs)/at-salon')}
            >
              <Text style={styles.exploreButtonText}>Find Stylists</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return stylists.map(renderStylistCard);
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderContent()}
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#FCE7F3',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#E91E63',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceRange: {
    marginLeft: 'auto',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceRangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
  },
  savedDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stylistCardHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  stylistAvatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  stylistAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylistInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  stylistName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  stylistTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 6,
  },
  favoriteButtonStylist: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specializationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  specializationBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  salonInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  salonInfoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});