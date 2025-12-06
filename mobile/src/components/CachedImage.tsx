import React, { memo } from 'react';
import { Image, ImageProps, ImageContentFit } from 'expo-image';
import { StyleSheet, View, StyleProp, ViewStyle, ImageStyle } from 'react-native';

interface CachedImageProps {
  source: string | { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  placeholder?: string | { uri: string };
  placeholderContentFit?: ImageContentFit;
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  recyclingKey?: string;
  onLoad?: () => void;
  onError?: () => void;
  accessibilityLabel?: string;
}

const blurhashPlaceholder = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const CachedImage = memo<CachedImageProps>(({
  source,
  style,
  containerStyle,
  contentFit = 'cover',
  placeholder,
  placeholderContentFit = 'cover',
  transition = 200,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  recyclingKey,
  onLoad,
  onError,
  accessibilityLabel,
}) => {
  const imageSource = typeof source === 'string' ? { uri: source } : source;
  const placeholderSource = placeholder || blurhashPlaceholder;

  return (
    <View style={containerStyle}>
      <Image
        source={imageSource}
        style={style}
        contentFit={contentFit}
        placeholder={typeof placeholderSource === 'string' ? placeholderSource : placeholderSource}
        placeholderContentFit={placeholderContentFit}
        transition={transition}
        priority={priority}
        cachePolicy={cachePolicy}
        recyclingKey={recyclingKey}
        onLoad={onLoad}
        onError={onError}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
});

CachedImage.displayName = 'CachedImage';

export const ProductImage = memo<{
  uri: string;
  style?: StyleProp<ImageStyle>;
  size?: 'small' | 'medium' | 'large';
}>(({ uri, style, size = 'medium' }) => {
  const sizeStyles = {
    small: styles.smallImage,
    medium: styles.mediumImage,
    large: styles.largeImage,
  };

  return (
    <CachedImage
      source={uri}
      style={[sizeStyles[size], style]}
      contentFit="cover"
      priority={size === 'large' ? 'high' : 'normal'}
    />
  );
});

ProductImage.displayName = 'ProductImage';

export const AvatarImage = memo<{
  uri?: string;
  style?: StyleProp<ImageStyle>;
  size?: number;
  fallback?: React.ReactNode;
}>(({ uri, style, size = 40, fallback }) => {
  if (!uri && fallback) {
    return <>{fallback}</>;
  }

  return (
    <CachedImage
      source={uri || 'https://via.placeholder.com/100'}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      contentFit="cover"
      priority="high"
    />
  );
});

AvatarImage.displayName = 'AvatarImage';

export const BannerImage = memo<{
  uri: string;
  style?: StyleProp<ImageStyle>;
  aspectRatio?: number;
}>(({ uri, style, aspectRatio = 16 / 9 }) => {
  return (
    <CachedImage
      source={uri}
      style={[styles.bannerImage, { aspectRatio }, style]}
      contentFit="cover"
      priority="high"
      transition={300}
    />
  );
});

BannerImage.displayName = 'BannerImage';

const styles = StyleSheet.create({
  smallImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  mediumImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  largeImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  bannerImage: {
    width: '100%',
    borderRadius: 12,
  },
});

export default CachedImage;
