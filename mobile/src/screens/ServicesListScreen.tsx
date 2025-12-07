import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { salonAPI } from '../services/api';
import { Service, SelectedService } from '../types/navigation';

const CATEGORIES = ['All Services', 'Nails', 'Hair Services', 'Facials', 'Spa', 'Massage', 'Waxing', 'Makeup'];

export default function ServicesListScreen() {
  const params = useLocalSearchParams<{ 
    salonId: string; 
    salonName: string;
    preselectedServiceId?: string;
    preferredStaffId?: string;
    fromRebooking?: string;
  }>();
  const router = useRouter();
  const { salonId, salonName, preselectedServiceId, preferredStaffId, fromRebooking } = params;

  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [salonId]);

  useEffect(() => {
    if (!hasAutoSelected && preselectedServiceId && services.length > 0) {
      const serviceExists = services.some(s => s.id === preselectedServiceId);
      if (serviceExists) {
        setSelectedServices(new Set([preselectedServiceId]));
        setHasAutoSelected(true);
      }
    }
  }, [services, preselectedServiceId, hasAutoSelected]);

  useEffect(() => {
    filterServices();
  }, [services, selectedCategory, searchQuery]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await salonAPI.getSalonServices(salonId);
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    if (selectedCategory !== 'All Services') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }

    setFilteredServices(filtered);
  };

  const toggleService = (service: Service) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(service.id)) {
      newSelected.delete(service.id);
    } else {
      newSelected.add(service.id);
    }
    setSelectedServices(newSelected);
  };

  const formatPrice = (priceInPaisa: number) => {
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
  };

  const getTotalPrice = () => {
    const total = services
      .filter(s => selectedServices.has(s.id))
      .reduce((sum, s) => sum + s.priceInPaisa, 0);
    return formatPrice(total);
  };

  const getTotalDuration = () => {
    return services
      .filter(s => selectedServices.has(s.id))
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  };

  const handleContinue = () => {
    if (selectedServices.size === 0) {
      Alert.alert('No Services Selected', 'Please select at least one service to continue.');
      return;
    }

    const selectedServicesList: SelectedService[] = services
      .filter(s => selectedServices.has(s.id))
      .map(s => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        priceInPaisa: s.priceInPaisa,
        currency: s.currency,
        category: s.category,
      }));

    const servicesParam = encodeURIComponent(JSON.stringify(selectedServicesList));
    let bookingUrl = `/booking/details?salonId=${salonId}&salonName=${encodeURIComponent(salonName)}&selectedServices=${servicesParam}`;
    if (preferredStaffId) {
      bookingUrl += `&preferredStaffId=${preferredStaffId}`;
    }
    if (fromRebooking === 'true') {
      bookingUrl += `&fromRebooking=true`;
    }
    router.push(bookingUrl);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Services</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search services..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          <Text style={styles.countBold}>{filteredServices.length}</Text> services available
        </Text>
      </View>

      <ScrollView style={styles.servicesList} showsVerticalScrollIndicator={false}>
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const isSelected = selectedServices.has(service.id);
            return (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
                onPress={() => toggleService(service)}
                activeOpacity={0.7}
              >
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.description && (
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                    <View style={styles.serviceMetaRow}>
                      <View style={styles.serviceMeta}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.serviceMetaText}>{service.durationMinutes} mins</Text>
                      </View>
                    </View>
                    <Text style={styles.servicePrice}>{formatPrice(service.priceInPaisa)}</Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No services found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or search</Text>
          </View>
        )}
      </ScrollView>

      {selectedServices.size > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.summaryContainer}>
            <View>
              <Text style={styles.summaryLabel}>{selectedServices.size} services selected</Text>
              <Text style={styles.summaryDetail}>
                {getTotalDuration()} mins • {getTotalPrice()}
              </Text>
            </View>
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 0,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
  },
  categoryChipActive: {
    backgroundColor: '#111827',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
  },
  countBold: {
    fontWeight: '700',
    color: '#111827',
  },
  servicesList: {
    flex: 1,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  serviceCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  serviceContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  summaryDetail: {
    fontSize: 12,
    color: '#6B7280',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
