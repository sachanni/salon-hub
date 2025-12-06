import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '../../components/ProfileHeader';
import { useAuth } from '../../contexts/AuthContext';
import { eventsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

type EventCategory = 'All' | 'Workshops' | 'Product Launch' | 'Sales' | 'Group Events' | 'Celebrity';
type EventTab = 'discover' | 'myEvents';

interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  salonName: string;
  salonVerified: boolean;
  date: string;
  time: string;
  location: string;
  price: number;
  originalPrice?: number;
  isFree: boolean;
  category: EventCategory;
  spotsLeft: number;
  totalSpots: number;
  isFeatured: boolean;
  badge?: string;
  rating?: number;
  reviewCount?: number;
}

interface MyEvent extends Event {
  registrationId: string;
  registrationDate: string;
  ticketCode: string;
  status: 'upcoming' | 'attended' | 'cancelled';
  canCancel: boolean;
  canReview: boolean;
}

const CATEGORIES: { id: EventCategory; label: string; icon: string }[] = [
  { id: 'All', label: 'All Events', icon: '🎉' },
  { id: 'Workshops', label: 'Workshops', icon: '🎨' },
  { id: 'Product Launch', label: 'Product Launches', icon: '✨' },
  { id: 'Sales', label: 'Seasonal Sales', icon: '💄' },
  { id: 'Group Events', label: 'Group Events', icon: '👯' },
  { id: 'Celebrity', label: 'Celebrity Events', icon: '⭐' },
];

const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Bridal Makeup Masterclass',
    description: 'Learn professional bridal makeup techniques from industry experts.',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/688939e330-bad6a2b97e3779575df6.png',
    salonName: 'Glow Studio',
    salonVerified: true,
    date: 'Dec 15, 2024',
    time: '2:00 PM - 5:00 PM',
    location: 'Sector 18, Noida',
    price: 960,
    originalPrice: 1200,
    isFree: false,
    category: 'Workshops',
    spotsLeft: 8,
    totalSpots: 15,
    isFeatured: true,
    badge: 'Early Bird',
    rating: 4.8,
    reviewCount: 12,
  },
  {
    id: '2',
    title: 'Winter Skincare Collection Launch',
    description: 'Be the first to experience our new winter skincare range.',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/c40f3d6898-2d0b20b65119f03679e4.png',
    salonName: 'Radiance Spa',
    salonVerified: true,
    date: 'Dec 18, 2024',
    time: '6:00 PM - 8:00 PM',
    location: 'Connaught Place, Delhi',
    price: 0,
    isFree: true,
    category: 'Product Launch',
    spotsLeft: 25,
    totalSpots: 50,
    isFeatured: true,
    badge: 'Free Entry',
  },
  {
    id: '3',
    title: 'Hair Styling with Celebrity Expert',
    description: 'Exclusive workshop with renowned celebrity hairstylist.',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4821e1e32d-b8db54dc8f6587c75e8d.png',
    salonName: 'Glam House',
    salonVerified: true,
    date: 'Dec 20, 2024',
    time: '3:00 PM - 6:00 PM',
    location: 'South Extension, Delhi',
    price: 1499,
    isFree: false,
    category: 'Celebrity',
    spotsLeft: 3,
    totalSpots: 20,
    isFeatured: true,
    badge: 'Last 24h',
    rating: 4.9,
    reviewCount: 28,
  },
  {
    id: '4',
    title: 'Nail Art Workshop',
    description: 'Learn trendy nail art techniques from professionals.',
    image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/35c073455d-437ad899247819ca011a.png',
    salonName: 'Nail Paradise',
    salonVerified: true,
    date: 'Dec 22, 2024',
    time: '11:00 AM - 2:00 PM',
    location: 'Gurgaon',
    price: 599,
    originalPrice: 799,
    isFree: false,
    category: 'Workshops',
    spotsLeft: 12,
    totalSpots: 15,
    isFeatured: false,
    rating: 4.5,
    reviewCount: 8,
  },
];

const SAMPLE_MY_EVENTS: MyEvent[] = [
  {
    ...SAMPLE_EVENTS[0],
    registrationId: 'REG-2024-001',
    registrationDate: 'Dec 2, 2024',
    ticketCode: 'TKT-BRM-15789',
    status: 'upcoming',
    canCancel: true,
    canReview: false,
  },
];

export const EventsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<EventTab>('discover');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [myEventsLoading, setMyEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setError(null);
      const response = await eventsAPI.getEvents({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
      });
      if (response.events && response.events.length > 0) {
        setEvents(response.events);
      } else {
        setEvents(SAMPLE_EVENTS);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents(SAMPLE_EVENTS);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const response = await eventsAPI.getMyRegistrations();
      if (response.registrations && response.registrations.length > 0) {
        setMyEvents(response.registrations);
      } else {
        setMyEvents(SAMPLE_MY_EVENTS);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setMyEvents(SAMPLE_MY_EVENTS);
    } finally {
      setMyEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchMyRegistrations();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchEvents();
    }
  }, [selectedCategory, searchQuery]);

  const featuredEvents = events.filter((e) => e.isFeatured);
  const filteredEvents = events.filter((e) => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.salonName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchEvents(), fetchMyRegistrations()]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  const handleEventPress = (eventId: string) => {
    router.push(`/events/details?id=${eventId}`);
  };

  const handleMyEventPress = (event: MyEvent) => {
    if (event.status === 'upcoming') {
      router.push(`/events/ticket?id=${event.registrationId}`);
    } else {
      router.push(`/events/details?id=${event.id}`);
    }
  };

  const renderFeaturedEvent = (event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.featuredCard}
      onPress={() => handleEventPress(event.id)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: event.image }} style={styles.featuredImage} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      />
      {event.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>FEATURED</Text>
        </View>
      )}
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeText}>{event.category}</Text>
      </View>
      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.featuredSalon}>
          <Text style={styles.featuredSalonName}>{event.salonName}</Text>
          {event.salonVerified && (
            <Ionicons name="checkmark-circle" size={14} color="#60A5FA" />
          )}
        </View>
        <View style={styles.featuredMeta}>
          <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
          <Text style={styles.featuredMetaText}>{event.date} • {event.time.split(' - ')[0]}</Text>
        </View>
        <View style={styles.featuredFooter}>
          <View style={event.isFree ? styles.freeBadge : styles.priceBadge}>
            <Text style={styles.priceText}>
              {event.isFree ? 'FREE' : `From ₹${event.price}`}
            </Text>
          </View>
          {event.spotsLeft <= 10 && (
            <View style={styles.spotsLeftBadge}>
              <Text style={styles.spotsLeftText}>
                🔥 {event.spotsLeft}/{event.totalSpots} spots left
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerButtonText}>Register Now →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEventCard = (event: Event) => (
    <TouchableOpacity
      key={event.id}
      style={styles.eventCard}
      onPress={() => handleEventPress(event.id)}
      activeOpacity={0.8}
    >
      <View style={styles.eventImageContainer}>
        <Image source={{ uri: event.image }} style={styles.eventImage} />
        <View style={styles.eventDateBadge}>
          <Text style={styles.eventDateMonth}>{event.date.split(' ')[0]}</Text>
          <Text style={styles.eventDateDay}>{event.date.split(' ')[1].replace(',', '')}</Text>
        </View>
        {event.badge && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>{event.badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.eventInfo}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          <View style={styles.eventCategoryChip}>
            <Text style={styles.eventCategoryText}>{event.category}</Text>
          </View>
        </View>
        <View style={styles.eventSalon}>
          <View style={styles.salonIcon}>
            <Ionicons name="storefront" size={12} color="#6B7280" />
          </View>
          <Text style={styles.eventSalonName}>{event.salonName}</Text>
          {event.salonVerified && (
            <Ionicons name="checkmark-circle" size={12} color="#3B82F6" />
          )}
        </View>
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailItem}>
            <Ionicons name="time-outline" size={14} color="#8B5CF6" />
            <Text style={styles.eventDetailText}>{event.time.split(' - ')[0]}</Text>
          </View>
          <View style={styles.eventDetailItem}>
            <Ionicons name="location-outline" size={14} color="#8B5CF6" />
            <Text style={styles.eventDetailText} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>
        <View style={styles.eventFooter}>
          <View style={styles.eventPriceContainer}>
            {event.isFree ? (
              <Text style={styles.eventFreeText}>FREE</Text>
            ) : (
              <>
                <Text style={styles.eventPrice}>₹{event.price}</Text>
                {event.originalPrice && (
                  <Text style={styles.eventOriginalPrice}>₹{event.originalPrice}</Text>
                )}
              </>
            )}
          </View>
          {event.rating && (
            <View style={styles.eventRating}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.eventRatingText}>{event.rating}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMyEventCard = (event: MyEvent) => (
    <TouchableOpacity
      key={event.registrationId}
      style={styles.myEventCard}
      onPress={() => handleMyEventPress(event)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: event.image }} style={styles.myEventImage} />
      <View style={styles.myEventInfo}>
        <View style={styles.myEventHeader}>
          <Text style={styles.myEventTitle} numberOfLines={1}>{event.title}</Text>
          <View style={[
            styles.myEventStatus,
            event.status === 'upcoming' && styles.statusUpcoming,
            event.status === 'attended' && styles.statusAttended,
            event.status === 'cancelled' && styles.statusCancelled,
          ]}>
            <Text style={[
              styles.myEventStatusText,
              event.status === 'upcoming' && styles.statusUpcomingText,
              event.status === 'attended' && styles.statusAttendedText,
              event.status === 'cancelled' && styles.statusCancelledText,
            ]}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.myEventSalon}>{event.salonName}</Text>
        <View style={styles.myEventMeta}>
          <Ionicons name="calendar-outline" size={14} color="#8B5CF6" />
          <Text style={styles.myEventMetaText}>{event.date} • {event.time.split(' - ')[0]}</Text>
        </View>
        <View style={styles.myEventMeta}>
          <Ionicons name="ticket-outline" size={14} color="#8B5CF6" />
          <Text style={styles.myEventMetaText}>{event.ticketCode}</Text>
        </View>
        <View style={styles.myEventActions}>
          {event.status === 'upcoming' && (
            <>
              <TouchableOpacity style={styles.viewTicketButton}>
                <Ionicons name="qr-code" size={14} color="#8B5CF6" />
                <Text style={styles.viewTicketText}>View Ticket</Text>
              </TouchableOpacity>
              {event.canCancel && (
                <TouchableOpacity style={styles.cancelEventButton}>
                  <Text style={styles.cancelEventText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {event.status === 'attended' && event.canReview && (
            <TouchableOpacity style={styles.reviewEventButton}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.reviewEventText}>Leave Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ProfileHeader title="Events" />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Ionicons 
            name="compass" 
            size={18} 
            color={activeTab === 'discover' ? '#8B5CF6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myEvents' && styles.activeTab]}
          onPress={() => setActiveTab('myEvents')}
        >
          <Ionicons 
            name="ticket" 
            size={18} 
            color={activeTab === 'myEvents' ? '#8B5CF6' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'myEvents' && styles.activeTabText]}>
            My Events ({myEvents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'discover' ? (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search events..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={styles.filterButton}>
                <Ionicons name="options-outline" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Featured Events Carousel */}
            <View style={styles.section}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.featuredScroll}
                contentContainerStyle={styles.featuredScrollContent}
              >
                {featuredEvents.map(renderFeaturedEvent)}
              </ScrollView>
            </View>

            {/* Categories */}
            <View style={styles.categoriesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryChipIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.categoryChipTextSelected,
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Events List */}
            <View style={styles.eventsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{filteredEvents.length} Events Found</Text>
                <TouchableOpacity style={styles.sortButton}>
                  <Text style={styles.sortButtonText}>Newest First</Text>
                  <Ionicons name="chevron-down" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
              {filteredEvents.map(renderEventCard)}
            </View>
          </>
        ) : (
          <View style={styles.myEventsSection}>
            {myEvents.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Events Yet</Text>
                <Text style={styles.emptySubtitle}>Register for events to see them here</Text>
                <TouchableOpacity
                  style={styles.discoverButton}
                  onPress={() => setActiveTab('discover')}
                >
                  <Text style={styles.discoverButtonText}>Discover Events</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myEvents.map(renderMyEventCard)
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#111827',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    marginBottom: 16,
  },
  featuredScroll: {
    paddingLeft: 16,
  },
  featuredScrollContent: {
    paddingRight: 16,
    gap: 16,
  },
  featuredCard: {
    width: width * 0.85,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredSalon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  featuredSalonName: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  featuredMetaText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  priceBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  spotsLeftBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spotsLeftText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#8B5CF6',
  },
  categoryChipIcon: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  eventsSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImageContainer: {
    width: 100,
    height: 120,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventDateBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  eventDateMonth: {
    fontSize: 8,
    fontWeight: '600',
    color: '#8B5CF6',
    textTransform: 'uppercase',
  },
  eventDateDay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
    lineHeight: 18,
  },
  eventBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    transform: [{ rotate: '-12deg' }],
  },
  eventBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  eventInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  eventCategoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventCategoryText: {
    fontSize: 9,
    color: '#6B7280',
  },
  eventSalon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  salonIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventSalonName: {
    fontSize: 12,
    color: '#6B7280',
  },
  eventDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  eventDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDetailText: {
    fontSize: 11,
    color: '#6B7280',
    maxWidth: 80,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  eventOriginalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  eventFreeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  eventRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  eventRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  myEventsSection: {
    padding: 16,
  },
  myEventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  myEventImage: {
    width: 80,
    height: 140,
  },
  myEventInfo: {
    flex: 1,
    padding: 12,
  },
  myEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  myEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  myEventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusUpcoming: {
    backgroundColor: '#DBEAFE',
  },
  statusAttended: {
    backgroundColor: '#D1FAE5',
  },
  statusCancelled: {
    backgroundColor: '#FEE2E2',
  },
  myEventStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusUpcomingText: {
    color: '#1D4ED8',
  },
  statusAttendedText: {
    color: '#059669',
  },
  statusCancelledText: {
    color: '#DC2626',
  },
  myEventSalon: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  myEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  myEventMetaText: {
    fontSize: 12,
    color: '#374151',
  },
  myEventActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  viewTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewTicketText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  cancelEventButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cancelEventText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  reviewEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewEventText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  discoverButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  discoverButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
