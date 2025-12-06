import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface EventDetails {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  image: string;
  salonName: string;
  salonVerified: boolean;
  salonImage: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  fullAddress: string;
  price: number;
  originalPrice?: number;
  isFree: boolean;
  category: string;
  spotsLeft: number;
  totalSpots: number;
  highlights: string[];
  whatToExpect: string[];
  includes: string[];
  instructors: { name: string; title: string; image: string }[];
  rating?: number;
  reviewCount?: number;
  reviews: { id: string; userName: string; rating: number; comment: string; date: string }[];
}

const SAMPLE_EVENT: EventDetails = {
  id: '1',
  title: 'Bridal Makeup Masterclass',
  description: 'Learn professional bridal makeup techniques from industry experts.',
  fullDescription: 'Join us for an exclusive hands-on masterclass where you will learn the art of bridal makeup from renowned makeup artists. This comprehensive workshop covers everything from skin prep to final touches, including the latest trends in bridal beauty.',
  image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/688939e330-bad6a2b97e3779575df6.png',
  salonName: 'Glow Studio',
  salonVerified: true,
  salonImage: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/35c073455d-437ad899247819ca011a.png',
  date: 'December 15, 2024',
  time: '2:00 PM - 5:00 PM',
  duration: '3 hours',
  location: 'Sector 18, Noida',
  fullAddress: 'Glow Studio, 2nd Floor, DLF Mall, Sector 18, Noida, UP 201301',
  price: 960,
  originalPrice: 1200,
  isFree: false,
  category: 'Workshops',
  spotsLeft: 8,
  totalSpots: 15,
  highlights: [
    'Hands-on practice with professional products',
    'Certificate of completion included',
    'Take-home makeup kit worth ₹500',
    'Small batch size for personalized attention',
  ],
  whatToExpect: [
    'Introduction to bridal skin preparation',
    'Foundation matching and application techniques',
    'Eye makeup for different eye shapes',
    'Long-lasting lip color application',
    'Setting and finishing touches',
    'Q&A with industry expert',
  ],
  includes: [
    'All makeup products and tools',
    'Refreshments and snacks',
    'Printed course materials',
    'Certificate of completion',
    'Take-home mini kit',
  ],
  instructors: [
    {
      name: 'Priya Sharma',
      title: 'Celebrity Makeup Artist',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/c40f3d6898-2d0b20b65119f03679e4.png',
    },
  ],
  rating: 4.8,
  reviewCount: 12,
  reviews: [
    {
      id: '1',
      userName: 'Ananya K.',
      rating: 5,
      comment: 'Amazing workshop! Learned so much about bridal makeup. Priya is an excellent teacher.',
      date: 'Nov 28, 2024',
    },
    {
      id: '2',
      userName: 'Ritu M.',
      rating: 4,
      comment: 'Great experience overall. The hands-on practice was very helpful.',
      date: 'Nov 15, 2024',
    },
  ],
};

export const EventDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = typeof id === 'string' ? id : id?.[0];
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setError('Event not found');
        setLoading(false);
        return;
      }

      try {
        const response = await eventsAPI.getEventById(eventId);
        if (response && response.event) {
          setEvent(response.event);
        } else {
          setEvent(SAMPLE_EVENT);
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setEvent(SAMPLE_EVENT);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discount = event.originalPrice 
    ? Math.round(((event.originalPrice - event.price) / event.originalPrice) * 100) 
    : 0;

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${event.title} at ${event.salonName}. ${event.date} - ${event.location}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  const handleRegister = () => {
    router.push(`/events/registration?id=${event.id}`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
        size={14}
        color="#F59E0B"
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header Image with Gradient */}
      <View style={styles.headerContainer}>
        <Image source={{ uri: event.image }} style={styles.headerImage} />
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.headerGradient}
        />
        
        {/* Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topNavRight}>
            <TouchableOpacity style={styles.navButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleSave}>
              <Ionicons 
                name={isSaved ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isSaved ? '#EF4444' : '#FFFFFF'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category & Date Badge */}
        <View style={styles.headerBadges}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{event.category}</Text>
          </View>
          {event.spotsLeft <= 10 && (
            <View style={styles.urgencyBadge}>
              <Ionicons name="flame" size={12} color="#FFFFFF" />
              <Text style={styles.urgencyBadgeText}>Only {event.spotsLeft} spots left!</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Info */}
        <View style={styles.mainContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          {/* Salon Info */}
          <TouchableOpacity style={styles.salonCard}>
            <Image source={{ uri: event.salonImage }} style={styles.salonImage} />
            <View style={styles.salonInfo}>
              <View style={styles.salonNameRow}>
                <Text style={styles.salonName}>{event.salonName}</Text>
                {event.salonVerified && (
                  <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
                )}
              </View>
              <Text style={styles.salonSubtext}>Event Organizer</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Quick Info Cards */}
          <View style={styles.quickInfoGrid}>
            <View style={styles.quickInfoCard}>
              <View style={[styles.quickInfoIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="calendar" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.quickInfoLabel}>Date</Text>
              <Text style={styles.quickInfoValue}>{event.date}</Text>
            </View>
            <View style={styles.quickInfoCard}>
              <View style={[styles.quickInfoIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="time" size={20} color="#10B981" />
              </View>
              <Text style={styles.quickInfoLabel}>Time</Text>
              <Text style={styles.quickInfoValue}>{event.time.split(' - ')[0]}</Text>
            </View>
            <View style={styles.quickInfoCard}>
              <View style={[styles.quickInfoIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="hourglass" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.quickInfoLabel}>Duration</Text>
              <Text style={styles.quickInfoValue}>{event.duration}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            <View style={styles.locationCard}>
              <Text style={styles.locationName}>{event.location}</Text>
              <Text style={styles.locationAddress}>{event.fullAddress}</Text>
              <TouchableOpacity style={styles.directionsButton}>
                <Ionicons name="navigate" size={16} color="#8B5CF6" />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>About This Event</Text>
            </View>
            <Text style={styles.descriptionText}>{event.fullDescription}</Text>
          </View>

          {/* Highlights */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Highlights</Text>
            </View>
            {event.highlights.map((highlight, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.listItemText}>{highlight}</Text>
              </View>
            ))}
          </View>

          {/* What to Expect */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>What to Expect</Text>
            </View>
            {event.whatToExpect.map((item, index) => (
              <View key={index} style={styles.numberListItem}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{index + 1}</Text>
                </View>
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* What's Included */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="gift" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>What's Included</Text>
            </View>
            <View style={styles.includesGrid}>
              {event.includes.map((item, index) => (
                <View key={index} style={styles.includesItem}>
                  <Ionicons name="checkmark" size={14} color="#10B981" />
                  <Text style={styles.includesText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructors */}
          {event.instructors.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Your Instructor</Text>
              </View>
              {event.instructors.map((instructor, index) => (
                <View key={index} style={styles.instructorCard}>
                  <Image source={{ uri: instructor.image }} style={styles.instructorImage} />
                  <View style={styles.instructorInfo}>
                    <Text style={styles.instructorName}>{instructor.name}</Text>
                    <Text style={styles.instructorTitle}>{instructor.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          {event.reviews.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Reviews</Text>
                {event.rating && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{event.rating}</Text>
                    <Text style={styles.reviewCountText}>({event.reviewCount})</Text>
                  </View>
                )}
              </View>
              {event.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
                    <View style={styles.reviewStars}>{renderStars(review.rating)}</View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Bottom Registration Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          {event.isFree ? (
            <Text style={styles.freeText}>FREE</Text>
          ) : (
            <>
              <Text style={styles.priceLabel}>Price</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>₹{event.price}</Text>
                {event.originalPrice && (
                  <>
                    <Text style={styles.originalPrice}>₹{event.originalPrice}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{discount}% OFF</Text>
                    </View>
                  </>
                )}
              </View>
            </>
          )}
        </View>
        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>Register Now</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topNav: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topNavRight: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadges: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  urgencyBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  salonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  salonImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  salonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  salonNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  salonSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  quickInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  locationCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directionsButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  numberListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  includesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  includesText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  instructorImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  instructorInfo: {
    marginLeft: 16,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  instructorTitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  reviewCountText: {
    fontSize: 12,
    color: '#92400E',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 6,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  freeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
  },
  registerButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
