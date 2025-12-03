import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FilterOptions {
  priceRange?: { min: number; max: number };
  minRating?: number;
  brands?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc' | 'popularity';
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  availableBrands?: string[];
}

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 50000 },
  { label: '₹500 - ₹1000', min: 50000, max: 100000 },
  { label: '₹1000 - ₹2000', min: 100000, max: 200000 },
  { label: '₹2000 - ₹5000', min: 200000, max: 500000 },
  { label: 'Above ₹5000', min: 500000, max: Infinity },
];

const RATINGS = [
  { label: '4+ Stars', value: 4 },
  { label: '3+ Stars', value: 3 },
  { label: '2+ Stars', value: 2 },
  { label: '1+ Stars', value: 1 },
];

const SORT_OPTIONS = [
  { label: 'Price: Low to High', value: 'price_asc' as const },
  { label: 'Price: High to Low', value: 'price_desc' as const },
  { label: 'Highest Rated', value: 'rating_desc' as const },
  { label: 'Most Popular', value: 'popularity' as const },
];

export function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  initialFilters = {},
  availableBrands = [],
}: FilterBottomSheetProps) {
  const [slideAnim] = useState(new Animated.Value(0));
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | undefined>(
    initialFilters.priceRange
  );
  const [selectedRating, setSelectedRating] = useState<number | undefined>(initialFilters.minRating);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters.brands || []);
  const [selectedSort, setSelectedSort] = useState<FilterOptions['sortBy']>(initialFilters.sortBy);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      
      setSelectedPriceRange(initialFilters.priceRange);
      setSelectedRating(initialFilters.minRating);
      setSelectedBrands(initialFilters.brands || []);
      setSelectedSort(initialFilters.sortBy);
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialFilters]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleApply = () => {
    const filters: FilterOptions = {};
    
    if (selectedPriceRange) {
      filters.priceRange = selectedPriceRange;
    }
    if (selectedRating !== undefined) {
      filters.minRating = selectedRating;
    }
    if (selectedBrands.length > 0) {
      filters.brands = selectedBrands;
    }
    if (selectedSort) {
      filters.sortBy = selectedSort;
    }

    onApply(filters);
    handleClose();
  };

  const handleClearAll = () => {
    setSelectedPriceRange(undefined);
    setSelectedRating(undefined);
    setSelectedBrands([]);
    setSelectedSort(undefined);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Filters & Sort</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    selectedSort === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedSort(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedSort === option.value && styles.optionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedSort === option.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              {PRICE_RANGES.map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedPriceRange?.min === range.min &&
                      selectedPriceRange?.max === range.max &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedPriceRange?.min === range.min &&
                        selectedPriceRange?.max === range.max &&
                        styles.optionTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                  {selectedPriceRange?.min === range.min &&
                    selectedPriceRange?.max === range.max && (
                      <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                    )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Rating</Text>
              {RATINGS.map((rating) => (
                <TouchableOpacity
                  key={rating.value}
                  style={[
                    styles.optionButton,
                    selectedRating === rating.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedRating(rating.value)}
                >
                  <View style={styles.ratingOption}>
                    <Text
                      style={[
                        styles.optionText,
                        selectedRating === rating.value && styles.optionTextActive,
                      ]}
                    >
                      {rating.label}
                    </Text>
                    <View style={styles.stars}>
                      {Array.from({ length: rating.value }).map((_, i) => (
                        <Ionicons key={i} name="star" size={14} color="#FFA500" />
                      ))}
                    </View>
                  </View>
                  {selectedRating === rating.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {availableBrands.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Brands</Text>
                  <View style={styles.brandGrid}>
                    {availableBrands.map((brand) => (
                      <TouchableOpacity
                        key={brand}
                        style={[
                          styles.brandChip,
                          selectedBrands.includes(brand) && styles.brandChipActive,
                        ]}
                        onPress={() => toggleBrand(brand)}
                      >
                        <Text
                          style={[
                            styles.brandChipText,
                            selectedBrands.includes(brand) && styles.brandChipTextActive,
                          ]}
                        >
                          {brand}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  optionText: {
    fontSize: 15,
    color: '#4B5563',
  },
  optionTextActive: {
    color: '#6D28D9',
    fontWeight: '600',
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  brandChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#8B5CF6',
  },
  brandChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  brandChipTextActive: {
    color: '#6D28D9',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
