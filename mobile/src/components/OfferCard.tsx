import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { SpecialOffer } from '../types/salon';

interface OfferCardProps {
  offer: SpecialOffer;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onPress }) => {
  const isFirstOffer = offer.id === '1';
  const gradientColors = isFirstOffer
    ? ['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)']
    : ['rgba(236, 72, 153, 0.1)', 'rgba(139, 92, 246, 0.1)'];

  const iconBackgroundColors = isFirstOffer
    ? ['#8B5CF6', '#EC4899']
    : ['#EC4899', '#8B5CF6'];

  const badgeColor = isFirstOffer ? '#EC4899' : '#8B5CF6';
  const textColor = isFirstOffer ? '#8B5CF6' : '#EC4899';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { width: CARD_WIDTH }]}
      >
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{offer.badge}</Text>
        </View>

        <View style={styles.content}>
          <LinearGradient
            colors={iconBackgroundColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Text style={styles.icon}>{offer.icon}</Text>
          </LinearGradient>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{offer.title}</Text>
            <Text style={styles.description}>{offer.description}</Text>
            <View style={styles.footer}>
              <Text style={[styles.price, { color: textColor }]}>{offer.price}</Text>
              <TouchableOpacity onPress={onPress}>
                <Text style={[styles.actionText, { color: textColor }]}>Claim Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginRight: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
