import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({ width, height, borderRadius = 8, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]} />
  );
};

export const CategorySkeleton = () => (
  <View style={styles.categoryContainer}>
    <SkeletonBox width={90} height={90} borderRadius={16} />
    <SkeletonBox width={60} height={12} borderRadius={6} style={styles.categoryLabel} />
  </View>
);

export const OfferSkeleton = () => (
  <View style={styles.offerCard}>
    <LinearGradient
      colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)']}
      style={styles.offerCardGradient}
    >
      <View style={styles.offerHeader}>
        <SkeletonBox width={60} height={24} borderRadius={12} />
        <SkeletonBox width={40} height={40} borderRadius={20} />
      </View>
      <SkeletonBox width="80%" height={18} borderRadius={4} style={styles.offerTitle} />
      <SkeletonBox width="60%" height={14} borderRadius={4} style={styles.offerDesc} />
      <View style={styles.offerFooter}>
        <SkeletonBox width={60} height={20} borderRadius={4} />
        <SkeletonBox width={80} height={36} borderRadius={18} />
      </View>
    </LinearGradient>
  </View>
);

export const SalonSkeleton = () => (
  <View style={styles.salonCard}>
    <SkeletonBox width={280} height={160} borderRadius={12} />
    <View style={styles.salonInfo}>
      <SkeletonBox width="70%" height={18} borderRadius={4} style={styles.salonName} />
      <SkeletonBox width="50%" height={14} borderRadius={4} style={styles.salonMeta} />
      <View style={styles.salonTags}>
        <SkeletonBox width={60} height={20} borderRadius={10} />
        <SkeletonBox width={50} height={20} borderRadius={10} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  categoryContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  categoryLabel: {
    marginTop: 8,
  },
  offerCard: {
    width: 280,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  offerCardGradient: {
    padding: 20,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerTitle: {
    marginBottom: 8,
  },
  offerDesc: {
    marginBottom: 16,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salonCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  salonInfo: {
    padding: 12,
  },
  salonName: {
    marginBottom: 6,
  },
  salonMeta: {
    marginBottom: 8,
  },
  salonTags: {
    flexDirection: 'row',
    gap: 8,
  },
});
