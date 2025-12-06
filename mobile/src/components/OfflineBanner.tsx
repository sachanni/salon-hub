import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export const OfflineBanner = memo<OfflineBannerProps>(({ onRetry }) => {
  const { isConnected, isInternetReachable, refresh } = useNetworkStatus();
  const translateY = useSharedValue(-100);
  const pulseOpacity = useSharedValue(1);

  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        false
      );
    } else {
      translateY.value = withTiming(-100, { duration: 300, easing: Easing.in(Easing.ease) });
    }
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleRetry = async () => {
    await refresh();
    onRetry?.();
  };

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, pulseStyle]}>
          <Text style={styles.icon}>📡</Text>
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>Some features may be unavailable</Text>
        </View>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

OfflineBanner.displayName = 'OfflineBanner';

export const OfflineIndicator = memo(() => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.indicator}>
      <Text style={styles.indicatorText}>Offline</Text>
    </View>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#EF4444',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  indicator: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  indicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default OfflineBanner;
