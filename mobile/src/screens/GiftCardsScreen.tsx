import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { giftCardAPI, salonAPI } from '../services/api';
import { GiftCardTemplate, OCCASION_OPTIONS } from '../types/giftCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

interface Salon {
  id: string;
  name: string;
  imageUrl?: string;
  address?: string;
}

export default function GiftCardsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const salonId = params.salonId as string;

  const [templates, setTemplates] = useState<GiftCardTemplate[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (salonId) {
        const [templatesRes, salonRes] = await Promise.all([
          giftCardAPI.getTemplates(salonId),
          salonAPI.getSalonById(salonId),
        ]);
        
        if (templatesRes.success) {
          setTemplates(templatesRes.templates || []);
        }
        if (salonRes) {
          setSelectedSalon(salonRes);
        }
      } else {
        const salonsRes = await salonAPI.getAllSalons({ limit: 20 });
        if (salonsRes.salons) {
          setSalons(salonsRes.salons);
        }
      }
    } catch (err) {
      console.error('Error loading gift cards data:', err);
      setError('Unable to load gift cards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [salonId]);

  const handleSelectSalon = (salon: Salon) => {
    router.push(`/gift-cards?salonId=${salon.id}`);
  };

  const handleSelectTemplate = (template: GiftCardTemplate) => {
    router.push({
      pathname: '/gift-cards/purchase',
      params: {
        salonId: salonId,
        templateId: template.id,
        templateName: template.name,
        templateOccasion: template.occasion,
        minValue: template.minValuePaisa.toString(),
        maxValue: template.maxValuePaisa.toString(),
        presetAmounts: JSON.stringify(template.presetAmounts),
        backgroundColor: template.backgroundColor,
        textColor: template.textColor,
      },
    });
  };

  const getOccasionEmoji = (occasion: string) => {
    const found = OCCASION_OPTIONS.find((o) => o.value === occasion);
    return found?.emoji || '🎁';
  };

  const getOccasionLabel = (occasion: string) => {
    const found = OCCASION_OPTIONS.find((o) => o.value === occasion);
    return found?.label || 'Gift Card';
  };

  const filteredTemplates = selectedOccasion
    ? templates.filter((t) => t.occasion === selectedOccasion)
    : templates;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gift Cards</Text>
            <TouchableOpacity 
              onPress={() => router.push('/gift-cards/wallet')} 
              style={styles.walletButton}
            >
              <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading gift cards...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gift Cards</Text>
            <TouchableOpacity 
              onPress={() => router.push('/gift-cards/wallet')} 
              style={styles.walletButton}
            >
              <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!salonId) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gift Cards</Text>
            <TouchableOpacity 
              onPress={() => router.push('/gift-cards/wallet')} 
              style={styles.walletButton}
            >
              <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>Give the Gift of Beauty</Text>
            <Text style={styles.heroSubtitle}>
              Perfect for birthdays, anniversaries, or just because
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.sectionTitle}>Choose a Salon</Text>
          {salons.map((salon) => (
            <TouchableOpacity
              key={salon.id}
              style={styles.salonCard}
              onPress={() => handleSelectSalon(salon)}
              activeOpacity={0.7}
            >
              <View style={styles.salonImageContainer}>
                {salon.imageUrl ? (
                  <Image source={{ uri: salon.imageUrl }} style={styles.salonImage} />
                ) : (
                  <View style={styles.salonImagePlaceholder}>
                    <Ionicons name="storefront" size={32} color="#8B5CF6" />
                  </View>
                )}
              </View>
              <View style={styles.salonInfo}>
                <Text style={styles.salonName}>{salon.name}</Text>
                {salon.address && (
                  <Text style={styles.salonAddress} numberOfLines={1}>
                    {salon.address}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}

          {salons.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Salons Found</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for available gift cards
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#A855F7', '#C084FC']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gift Cards</Text>
          <TouchableOpacity 
            onPress={() => router.push('/gift-cards/wallet')} 
            style={styles.walletButton}
          >
            <Ionicons name="wallet-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {selectedSalon && (
          <View style={styles.salonBanner}>
            <View style={styles.salonBannerContent}>
              <Text style={styles.salonBannerName}>{selectedSalon.name}</Text>
              <Text style={styles.salonBannerSubtitle}>Select a gift card design</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.occasionFilter}
          contentContainerStyle={styles.occasionFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.occasionChip,
              !selectedOccasion && styles.occasionChipActive,
            ]}
            onPress={() => setSelectedOccasion(null)}
          >
            <Text
              style={[
                styles.occasionChipText,
                !selectedOccasion && styles.occasionChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {OCCASION_OPTIONS.slice(0, 8).map((occasion) => (
            <TouchableOpacity
              key={occasion.value}
              style={[
                styles.occasionChip,
                selectedOccasion === occasion.value && styles.occasionChipActive,
              ]}
              onPress={() => setSelectedOccasion(occasion.value)}
            >
              <Text style={styles.occasionEmoji}>{occasion.emoji}</Text>
              <Text
                style={[
                  styles.occasionChipText,
                  selectedOccasion === occasion.value && styles.occasionChipTextActive,
                ]}
              >
                {occasion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>
          {filteredTemplates.length} Template{filteredTemplates.length !== 1 ? 's' : ''} Available
        </Text>

        <Animated.View style={{ opacity: fadeAnim }}>
          {filteredTemplates.map((template, index) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => handleSelectTemplate(template)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[template.backgroundColor || '#8B5CF6', template.backgroundColor ? `${template.backgroundColor}CC` : '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.templateGradient}
              >
                <View style={styles.templateContent}>
                  <View style={styles.templateHeader}>
                    <View style={styles.templateOccasionBadge}>
                      <Text style={styles.templateOccasionEmoji}>
                        {getOccasionEmoji(template.occasion)}
                      </Text>
                      <Text style={[styles.templateOccasionText, { color: template.textColor || '#FFFFFF' }]}>
                        {getOccasionLabel(template.occasion)}
                      </Text>
                    </View>
                    <Ionicons name="gift" size={28} color={template.textColor || '#FFFFFF'} />
                  </View>
                  
                  <View style={styles.templateBody}>
                    <Text style={[styles.templateName, { color: template.textColor || '#FFFFFF' }]}>
                      {template.name}
                    </Text>
                    {template.description && (
                      <Text 
                        style={[styles.templateDescription, { color: `${template.textColor || '#FFFFFF'}CC` }]}
                        numberOfLines={2}
                      >
                        {template.description}
                      </Text>
                    )}
                  </View>

                  <View style={styles.templateFooter}>
                    <Text style={[styles.templateAmount, { color: template.textColor || '#FFFFFF' }]}>
                      ₹{(template.minValuePaisa / 100).toLocaleString()} - ₹{(template.maxValuePaisa / 100).toLocaleString()}
                    </Text>
                    <View style={[styles.selectButton, { backgroundColor: `${template.textColor || '#FFFFFF'}20` }]}>
                      <Text style={[styles.selectButtonText, { color: template.textColor || '#FFFFFF' }]}>
                        Select
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color={template.textColor || '#FFFFFF'} />
                    </View>
                  </View>
                </View>

                <View style={styles.templatePattern}>
                  <View style={[styles.patternCircle, styles.patternCircle1]} />
                  <View style={[styles.patternCircle, styles.patternCircle2]} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {filteredTemplates.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Templates Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedOccasion
                ? 'Try selecting a different occasion'
                : 'This salon has not set up gift card templates yet'}
            </Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Secure Payment</Text>
              <Text style={styles.infoCardText}>Your payment is protected with Razorpay</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="send" size={24} color="#8B5CF6" />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Instant Delivery</Text>
              <Text style={styles.infoCardText}>Send via WhatsApp, SMS, or Email</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="calendar" size={24} color="#F59E0B" />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Schedule Delivery</Text>
              <Text style={styles.infoCardText}>Pick a special date for delivery</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  walletButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
  salonBanner: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  salonBannerContent: {},
  salonBannerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  salonBannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
  },
  salonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  salonImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  salonImage: {
    width: '100%',
    height: '100%',
  },
  salonImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  salonAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  occasionFilter: {
    marginTop: 16,
    marginBottom: 8,
  },
  occasionFilterContent: {
    paddingRight: 16,
  },
  occasionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  occasionChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  occasionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  occasionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  occasionChipTextActive: {
    color: '#FFFFFF',
  },
  templateCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  templateGradient: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  templateContent: {
    padding: 20,
    zIndex: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  templateOccasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  templateOccasionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  templateOccasionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  templateBody: {
    marginBottom: 16,
  },
  templateName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  templateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 6,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  templatePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle1: {
    width: 200,
    height: 200,
    top: -80,
    right: -80,
  },
  patternCircle2: {
    width: 150,
    height: 150,
    bottom: -60,
    left: -60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  infoSection: {
    marginTop: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoCardContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  infoCardText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
