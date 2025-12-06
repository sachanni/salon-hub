import React, { memo, useCallback, useMemo } from 'react';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { View, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';

interface OptimizedListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  estimatedItemSize: number;
  numColumns?: number;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: object;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement;
  ItemSeparatorComponent?: React.ComponentType<any>;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  extraData?: any;
}

function OptimizedListInner<T>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize,
  numColumns = 1,
  horizontal = false,
  showsHorizontalScrollIndicator = false,
  showsVerticalScrollIndicator = false,
  contentContainerStyle,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  extraData,
}: OptimizedListProps<T>) {
  const renderItemCallback = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => renderItem(item, index),
    [renderItem]
  );

  const keyExtractorCallback = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  const footerComponent = useMemo(() => {
    if (isLoading && data.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#8B5CF6" />
        </View>
      );
    }
    return ListFooterComponent;
  }, [isLoading, data.length, ListFooterComponent]);

  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    return (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        tintColor="#8B5CF6"
        colors={['#8B5CF6']}
      />
    );
  }, [onRefresh, isRefreshing]);

  return (
    <FlashList
      data={data}
      renderItem={renderItemCallback}
      keyExtractor={keyExtractorCallback}
      estimatedItemSize={estimatedItemSize}
      numColumns={numColumns}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={footerComponent}
      ListEmptyComponent={ListEmptyComponent}
      ItemSeparatorComponent={ItemSeparatorComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={refreshControl}
      extraData={extraData}
      drawDistance={300}
    />
  );
}

export const OptimizedList = memo(OptimizedListInner) as typeof OptimizedListInner;

export const HorizontalList = memo(<T extends any>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize,
  contentContainerStyle,
  ...props
}: Omit<OptimizedListProps<T>, 'horizontal' | 'showsHorizontalScrollIndicator'>) => (
  <OptimizedList
    data={data}
    renderItem={renderItem}
    keyExtractor={keyExtractor}
    estimatedItemSize={estimatedItemSize}
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={[styles.horizontalList, contentContainerStyle]}
    {...props}
  />
)) as typeof OptimizedListInner;

export const GridList = memo(<T extends any>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize,
  numColumns = 2,
  ...props
}: Omit<OptimizedListProps<T>, 'numColumns'> & { numColumns?: number }) => (
  <OptimizedList
    data={data}
    renderItem={renderItem}
    keyExtractor={keyExtractor}
    estimatedItemSize={estimatedItemSize}
    numColumns={numColumns}
    {...props}
  />
)) as typeof OptimizedListInner;

const styles = StyleSheet.create({
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
});

export default OptimizedList;
