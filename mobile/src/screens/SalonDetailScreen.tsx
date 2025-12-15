import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { salonAPI, membershipAPI } from '../services/api';
import { Salon, Service, StaffMember, SalonReview, ServicePackage, MembershipPlan } from '../types/navigation';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import DepositBadge from '../components/DepositBadge';
import PackageCard from '../components/PackageCard';
import PackageDetailModal from '../components/PackageDetailModal';
import MembershipPlansCard from '../components/MembershipPlansCard';

const { width } = Dimensions.get('window');

const TABS = ['Photos', 'Packages', 'Services', 'Memberships', 'Team', 'Reviews', 'About'] as const;
type TabType = typeof TABS[number];

export default function SalonDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const salonId = params.id as string;
  const preselectedServiceId = params.preselectedServiceId as string | undefined;
  const preferredStaffId = params.preferredStaffId as string | undefined;
  const fromRebooking = params.fromRebooking === 'true';
  const { isAuthenticated } = useAuth();
  const { startConversation, setActiveConversation } = useChat();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [reviews, setReviews] = useState<SalonReview[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('Photos');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [startingChat, setStartingChat] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchSalonData();
  }, [salonId]);

  useEffect(() => {
    if (fromRebooking || preselectedServiceId) {
      setActiveTab('Services');
    }
  }, [fromRebooking, preselectedServiceId]);

  const fetchSalonData = async () => {
    try {
      setLoading(true);
      setMembershipLoading(true);
      const [salonData, servicesData, staffData, reviewsData, packagesData, membershipsData] = await Promise.all([
        salonAPI.getSalonById(salonId),
        salonAPI.getSalonServices(salonId),
        salonAPI.getSalonStaff(salonId),
        salonAPI.getSalonReviews(salonId, { limit: 5 }),
        salonAPI.getSalonPackages(salonId).catch(() => ({ packages: [] })),
        membershipAPI.getAvailablePlans(salonId).catch(() => ({ plans: [] })),
      ]);
      
      setSalon(salonData);
      setServices(servicesData || []);
      setStaff(staffData || []);
      setReviews(reviewsData || []);
      setPackages(packagesData?.packages || []);
      setMembershipPlans(membershipsData?.plans || []);
    } catch (error) {
      console.error('Error fetching salon data:', error);
      Alert.alert('Error', 'Failed to load salon details. Please try again.');
    } finally {
      setLoading(false);
      setMembershipLoading(false);
    }
  };

  const handlePackagePress = async (pkg: ServicePackage) => {
    try {
      const response = await salonAPI.getPackageDetails(salonId, pkg.id);
      if (response?.package) {
        setSelectedPackage(response.package);
        setPackageModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching package details:', error);
      Alert.alert('Error', 'Failed to load package details. Please try again.');
    }
  };

  const handleBookPackage = () => {
    if (!selectedPackage || !salon) return;

    setPackageModalVisible(false);
    
    const packageServices = selectedPackage.services?.map(s => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      priceInPaisa: s.priceInPaisa,
      currency: 'INR',
      category: s.category,
    })) || [];

    const servicesParam = encodeURIComponent(JSON.stringify(packageServices));
    const packageData = encodeURIComponent(JSON.stringify({
      packageId: selectedPackage.id,
      packageName: selectedPackage.name,
      packagePriceInPaisa: selectedPackage.packagePriceInPaisa,
      regularPriceInPaisa: selectedPackage.regularPriceInPaisa,
      totalDurationMinutes: selectedPackage.totalDurationMinutes,
      savingsPercentage: selectedPackage.savingsPercentage,
    }));
    
    router.push(`/booking/details?salonId=${salonId}&salonName=${encodeURIComponent(salon.name)}&selectedServices=${servicesParam}&packageData=${packageData}&isPackageBooking=true`);
  };

  const handleCall = () => {
    if (salon?.phone) {
      Linking.openURL(`tel:${salon.phone}`);
    }
  };

  const handleDirections = () => {
    if (salon?.latitude && salon?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to chat with this salon.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/onboarding/mobile-verification') },
        ]
      );
      return;
    }

    if (!salonId) return;

    setStartingChat(true);
    try {
      const existingConversation = await chatService.getConversationForSalon(salonId);
      
      if (existingConversation) {
        setActiveConversation(existingConversation);
        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId: existingConversation.id },
        });
      } else {
        const conversation = await startConversation({ salonId });
        router.push({
          pathname: '/chat/[conversationId]',
          params: { conversationId: conversation.id },
        });
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  const formatPrice = (priceInPaisa: number) => {
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
  };

  const buildServicesUrl = (specificServiceId?: string) => {
    let url = `/salon/services?salonId=${salonId}&salonName=${encodeURIComponent(salon?.name || '')}`;
    const serviceToPreselect = specificServiceId || preselectedServiceId;
    if (serviceToPreselect) {
      url += `&preselectedServiceId=${serviceToPreselect}`;
    }
    if (preferredStaffId) {
      url += `&preferredStaffId=${preferredStaffId}`;
    }
    if (fromRebooking) {
      url += `&fromRebooking=true`;
    }
    return url;
  };

  const images = salon?.imageUrls || (salon?.imageUrl ? [salon.imageUrl] : [
    'https://storage.googleapis.com/uxpilot-auth.appspot.com/d1691694cb-45ca30d524f1f5d3f50c.png'
  ]);

  const nextImage = () => {
    setCarouselIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCarouselIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading salon details...</Text>
      </View>
    );
  }

  if (!salon) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorText}>Salon not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{salon.name}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="heart-outline" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Photos' && (
          <View style={styles.photosSection}>
            <View style={styles.carouselContainer}>
              <Image source={{ uri: images[carouselIndex] }} style={styles.carouselImage} />
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={styles.ratingText}>{salon.rating}</Text>
                <Text style={styles.ratingCount}>({salon.reviewCount})</Text>
              </View>
              {images.length > 1 && (
                <>
                  <TouchableOpacity style={styles.prevButton} onPress={prevImage}>
                    <Ionicons name="chevron-back" size={20} color="#111827" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextButton} onPress={nextImage}>
                    <Ionicons name="chevron-forward" size={20} color="#111827" />
                  </TouchableOpacity>
                  <View style={styles.dotsContainer}>
                    {images.map((_, index) => (
                      <View
                        key={index}
                        style={[styles.dot, index === carouselIndex && styles.activeDot]}
                      />
                    ))}
                  </View>
                </>
              )}
            </View>

            <View style={styles.salonInfoCard}>
              <Text style={styles.salonName}>{salon.name}</Text>
              <View style={styles.salonMetaRow}>
                <View style={styles.ratingInfo}>
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text style={styles.metaText}>{salon.rating}</Text>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Text style={styles.metaText}>{salon.distance ? `${salon.distance.toFixed(1)} km` : salon.city}</Text>
                </View>
              </View>
              <View style={styles.addressRow}>
                <Ionicons name="location" size={14} color="#8B5CF6" />
                <Text style={styles.addressText}>{salon.address}, {salon.city}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                  <Ionicons name="call" size={18} color="#8B5CF6" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.chatButton} 
                  onPress={handleChat}
                  disabled={startingChat}
                >
                  {startingChat ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="chatbubble" size={18} color="#FFFFFF" />
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.directionsButton} onPress={handleDirections}>
                  <Ionicons name="navigate" size={18} color="#8B5CF6" />
                  <Text style={styles.directionsButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'Packages' && (
          <View style={styles.packagesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Service Packages</Text>
            </View>
            {packages.length > 0 ? (
              <>
                <Text style={styles.packagesSubtitle}>
                  Save more with our bundled service packages
                </Text>
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    package_={pkg}
                    onPress={() => handlePackagePress(pkg)}
                  />
                ))}
              </>
            ) : (
              <View style={styles.emptyPackages}>
                <Ionicons name="gift-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyPackagesTitle}>No Packages Available</Text>
                <Text style={styles.emptyPackagesText}>
                  This salon doesn't have any packages at the moment. Check out individual services instead.
                </Text>
                <TouchableOpacity
                  style={styles.viewServicesButton}
                  onPress={() => setActiveTab('Services')}
                >
                  <Text style={styles.viewServicesButtonText}>View Services</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'Services' && (
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services</Text>
              <TouchableOpacity onPress={() => router.push(buildServicesUrl())}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.bookServicesButton}
              onPress={() => router.push(buildServicesUrl())}
            >
              <Text style={styles.bookServicesButtonText}>Book Services</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            {services.slice(0, 5).map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceNameRow}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    {service.depositPercentage && service.depositPercentage > 0 && (
                      <DepositBadge size="small" />
                    )}
                  </View>
                  <Text style={styles.serviceDuration}>{service.durationMinutes} mins</Text>
                  <Text style={styles.servicePrice}>{formatPrice(service.priceInPaisa)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookServiceButton}
                  onPress={() => router.push(buildServicesUrl(service.id))}
                >
                  <Text style={styles.bookServiceText}>Book</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.seeAllServicesButton}
              onPress={() => router.push(buildServicesUrl())}
            >
              <Text style={styles.seeAllServicesText}>See all services</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Memberships' && (
          <MembershipPlansCard
            plans={membershipPlans}
            salonId={salonId}
            salonName={salon?.name || ''}
            loading={membershipLoading}
            onPurchaseSuccess={fetchSalonData}
          />
        )}

        {activeTab === 'Team' && (
          <View style={styles.teamSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Team</Text>
            </View>
            {staff.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamList}>
                {staff.map((member) => (
                  <View key={member.id} style={styles.teamCard}>
                    <View style={styles.avatarContainer}>
                      {member.profilePicture ? (
                        <Image source={{ uri: member.profilePicture }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      {member.rating && (
                        <View style={styles.teamRatingBadge}>
                          <Text style={styles.teamRatingText}>{member.rating}</Text>
                          <Ionicons name="star" size={8} color="#FBBF24" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamTitle}>{member.title || 'Stylist'}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No team members available</Text>
            )}
          </View>
        )}

        {activeTab === 'Reviews' && (
          <View style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews ({salon.reviewCount})</Text>
            </View>
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      {review.googleAuthorPhoto ? (
                        <Image source={{ uri: review.googleAuthorPhoto }} style={styles.reviewAvatar} />
                      ) : (
                        <View style={styles.reviewAvatarPlaceholder}>
                          <Text style={styles.reviewAvatarText}>
                            {(review.googleAuthorName || review.customerName || 'A').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={styles.reviewAuthorName}>{review.googleAuthorName || review.customerName || 'Anonymous'}</Text>
                        <View style={styles.reviewRating}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.rating ? 'star' : 'star-outline'}
                              size={12}
                              color="#FBBF24"
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    {review.isVerified === 1 && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      </View>
                    )}
                  </View>
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No reviews yet</Text>
            )}
          </View>
        )}

        {activeTab === 'About' && (
          <View style={styles.aboutSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <Text style={styles.aboutDescription}>{salon.description || 'No description available'}</Text>
            <View style={styles.aboutInfo}>
              <View style={styles.aboutRow}>
                <Ionicons name="pricetag-outline" size={20} color="#6B7280" />
                <Text style={styles.aboutLabel}>Price Range:</Text>
                <Text style={styles.aboutValue}>{salon.priceRange || 'Not specified'}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <Text style={styles.aboutLabel}>Venue Type:</Text>
                <Text style={styles.aboutValue}>{salon.venueType || 'Everyone'}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.aboutLabel}>Hours:</Text>
                <Text style={styles.aboutValue}>
                  {salon.openTime && salon.closeTime ? `${salon.openTime} - ${salon.closeTime}` : 'Not specified'}
                </Text>
              </View>
              <View style={styles.aboutRow}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.aboutLabel}>Phone:</Text>
                <Text style={styles.aboutValue}>{salon.phone}</Text>
              </View>
              <View style={styles.aboutRow}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.aboutLabel}>Email:</Text>
                <Text style={styles.aboutValue}>{salon.email}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <PackageDetailModal
        visible={packageModalVisible}
        package_={selectedPackage}
        salonName={salon?.name || ''}
        onClose={() => setPackageModalVisible(false)}
        onBookPackage={handleBookPackage}
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  photosSection: {
    paddingTop: 8,
  },
  carouselContainer: {
    position: 'relative',
    paddingHorizontal: 16,
  },
  carouselImage: {
    width: width - 32,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  ratingCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  prevButton: {
    position: 'absolute',
    left: 24,
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  nextButton: {
    position: 'absolute',
    right: 24,
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  activeDot: {
    backgroundColor: '#111827',
  },
  salonInfoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  salonName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  salonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  metaSeparator: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#9333EA',
    borderRadius: 12,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  servicesSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  bookServiceButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
  },
  bookServiceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  bookServicesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
  },
  bookServicesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllServicesButton: {
    marginTop: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    alignItems: 'center',
  },
  seeAllServicesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  teamSection: {
    padding: 16,
  },
  teamList: {
    gap: 16,
    paddingBottom: 8,
  },
  teamCard: {
    alignItems: 'center',
    width: 80,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  teamRatingBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  teamRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#111827',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  teamTitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 32,
  },
  reviewsSection: {
    padding: 16,
  },
  reviewCard: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  reviewAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  reviewAuthorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  verifiedBadge: {
    padding: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  aboutSection: {
    padding: 16,
  },
  aboutDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  aboutInfo: {
    gap: 16,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    width: 100,
  },
  aboutValue: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  packagesSection: {
    padding: 16,
  },
  packagesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyPackages: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyPackagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPackagesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  viewServicesButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  viewServicesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
