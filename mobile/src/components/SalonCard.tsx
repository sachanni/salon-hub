import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Salon } from '../types/salon';

interface SalonCardProps {
  salon: Salon;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export const SalonCard: React.FC<SalonCardProps> = ({ salon, onPress }) => {
  const placeholderImage = 'https://storage.googleapis.com/uxpilot-auth.appspot.com/d1691694cb-45ca30d524f1f5d3f50c.png';
  const imageUrl = salon.image || placeholderImage;

  const formatPriceRange = (range: string) => {
    const rupeeSymbol = '\u20B9';
    return range.replace(/\$/g, rupeeSymbol);
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {salon.name}
            </Text>
            <Text style={styles.heartIcon}>♡</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.ratingContainer}>
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.rating}>{salon.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({salon.reviewCount})</Text>
            </View>
            <Text style={styles.separator}>•</Text>
            {salon.distance_km && (
              <>
                <Text style={styles.distance}>{salon.distance_km.toFixed(1)} km</Text>
                <Text style={styles.separator}>•</Text>
              </>
            )}
            <Text style={styles.priceRange}>{formatPriceRange(salon.priceRange)}</Text>
          </View>

          <View style={styles.tagsContainer}>
            {salon.category && (
              <View style={styles.tagPurple}>
                <Text style={styles.tagTextPurple}>
                  {typeof salon.category === 'string' ? salon.category : 'Salon'}
                </Text>
              </View>
            )}
            {salon.hasPackages && (
              <View style={styles.tagPink}>
                <Text style={styles.tagTextPink}>Packages</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  heartIcon: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 14,
    color: '#FBBF24',
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 2,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  distance: {
    fontSize: 14,
    color: '#4B5563',
  },
  priceRange: {
    fontSize: 14,
    color: '#4B5563',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  tagTextPurple: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  tagPink: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  tagTextPink: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EC4899',
  },
});
