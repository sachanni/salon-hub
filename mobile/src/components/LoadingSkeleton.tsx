import React from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function LoadingSkeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}: LoadingSkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <LoadingSkeleton width="100%" height={150} borderRadius={12} />
      <View style={styles.productInfo}>
        <LoadingSkeleton width="80%" height={16} style={{ marginBottom: 8 }} />
        <LoadingSkeleton width="60%" height={14} style={{ marginBottom: 8 }} />
        <LoadingSkeleton width="40%" height={18} />
      </View>
    </View>
  );
}

export function ProductListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function CategoryChipSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.chipContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          width={80}
          height={36}
          borderRadius={18}
          style={{ marginRight: 8 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  productInfo: {
    padding: 12,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
});
