import React, { useEffect, memo } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

interface ShimmerProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const NativeShimmer = memo<ShimmerProps>(({ width, height, borderRadius = 8, style }) => {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [-1, 1],
            [-100, typeof width === 'number' ? width + 100 : 200]
          ),
        },
      ],
    };
  });

  return (
    <View
      style={[
        styles.shimmerContainer,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerGradient, animatedStyle]} />
    </View>
  );
});

NativeShimmer.displayName = 'NativeShimmer';

interface PulseProps {
  children: React.ReactNode;
  duration?: number;
  minOpacity?: number;
  style?: StyleProp<ViewStyle>;
}

export const NativePulse = memo<PulseProps>(({ children, duration = 1000, minOpacity = 0.6, style }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(minOpacity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [duration, minOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
});

NativePulse.displayName = 'NativePulse';

interface ScaleOnPressProps {
  children: React.ReactNode;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}

export const ScaleOnPress = memo<ScaleOnPressProps>(({ children, scale = 0.95, style }) => {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const onPressIn = () => {
    scaleValue.value = withTiming(scale, { duration: 100 });
  };

  const onPressOut = () => {
    scaleValue.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View
      style={[animatedStyle, style]}
      onTouchStart={onPressIn}
      onTouchEnd={onPressOut}
      onTouchCancel={onPressOut}
    >
      {children}
    </Animated.View>
  );
});

ScaleOnPress.displayName = 'ScaleOnPress';

interface StaggeredListProps {
  children: React.ReactNode[];
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export const StaggeredList = memo<StaggeredListProps>(({ children, delay = 100, style }) => {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <Animated.View
          key={index}
          entering={FadeIn.delay(index * delay).duration(300)}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
});

StaggeredList.displayName = 'StaggeredList';

export const AnimatedView = Animated.View;

export const animations = {
  fadeIn: FadeIn.duration(300),
  fadeOut: FadeOut.duration(300),
  slideInRight: SlideInRight.duration(300),
  slideOutLeft: SlideOutLeft.duration(300),
  zoomIn: ZoomIn.duration(300),
  zoomOut: ZoomOut.duration(300),
  fadeInDelay: (delay: number) => FadeIn.delay(delay).duration(300),
  slideInDelayed: (delay: number) => SlideInRight.delay(delay).duration(300),
};

export const NativeSkeletonCard = memo<{
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
}>(({ width = '100%', height = 200, style }) => {
  return (
    <View style={[styles.skeletonCard, { width, height }, style]}>
      <NativeShimmer width="100%" height={height * 0.6} borderRadius={12} />
      <View style={styles.skeletonContent}>
        <NativeShimmer width="80%" height={16} borderRadius={4} />
        <View style={{ height: 8 }} />
        <NativeShimmer width="60%" height={12} borderRadius={4} />
        <View style={{ height: 8 }} />
        <NativeShimmer width="40%" height={12} borderRadius={4} />
      </View>
    </View>
  );
});

NativeSkeletonCard.displayName = 'NativeSkeletonCard';

export const NativeSkeletonRow = memo<{
  width?: DimensionValue;
  height?: number;
  style?: StyleProp<ViewStyle>;
}>(({ width = '100%', height = 60, style }) => {
  return (
    <View style={[styles.skeletonRow, { width, height }, style]}>
      <NativeShimmer width={height - 16} height={height - 16} borderRadius={(height - 16) / 2} />
      <View style={styles.skeletonRowContent}>
        <NativeShimmer width="70%" height={14} borderRadius={4} />
        <View style={{ height: 6 }} />
        <NativeShimmer width="50%" height={10} borderRadius={4} />
      </View>
    </View>
  );
});

NativeSkeletonRow.displayName = 'NativeSkeletonRow';

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  skeletonCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
  },
  skeletonContent: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
  },
  skeletonRowContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default {
  NativeShimmer,
  NativePulse,
  ScaleOnPress,
  StaggeredList,
  AnimatedView,
  animations,
  NativeSkeletonCard,
  NativeSkeletonRow,
};
