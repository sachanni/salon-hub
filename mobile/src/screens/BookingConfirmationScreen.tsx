import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bookingAPI, beautyProfileAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StylistPreferencesBadge from '../components/StylistPreferencesBadge';

interface BookingDetails {
  id: string;
  salonName: string;
  salonAddress: string;
  salonCity: string;
  salonPhone: string;
  bookingDate: string;
  bookingTime: string;
  services: Array<{
    name: string;
    durationMinutes: number;
    priceInPaisa: number;
  }>;
  totalAmountPaisa: number;
  paymentMethod: string;
  status: string;
}

export default function BookingConfirmationScreen() {
  const params = useLocalSearchParams<{ bookingId: string; depositPaid?: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const bookingId = params.bookingId;
  const depositPaid = params.depositPaid === 'true';

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [hasPreferences, setHasPreferences] = useState(false);
  const [staffName, setStaffName] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    if (booking) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [booking]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingAPI.getBookingById(bookingId);
      setBooking(data);
      
      if (isAuthenticated && data?.salonId) {
        try {
          const summaryResponse = await beautyProfileAPI.getBookingSummary(data.salonId);
          if (summaryResponse?.success && summaryResponse?.summary) {
            const hasSavedPreferences = 
              summaryResponse.summary.hairProfile?.type ||
              summaryResponse.summary.skinProfile?.type ||
              (summaryResponse.summary.allergies && summaryResponse.summary.allergies.length > 0);
            setHasPreferences(!!hasSavedPreferences);
          }
        } catch (prefError) {
          console.log('No preferences found for this salon');
        }
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('Unable to load booking details. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceInPaisa: number) => {
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCall = () => {
    if (booking?.salonPhone) {
      Linking.openURL(`tel:${booking.salonPhone}`);
    }
  };

  const handleDirections = () => {
    if (booking?.salonAddress) {
      const query = encodeURIComponent(`${booking.salonAddress}, ${booking.salonCity}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    }
  };

  const handleGoHome = () => {
    router.replace('/home');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookingDetails}>
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
          <Text style={styles.secondaryButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Not Found</Text>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleGoHome}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Confirmed</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.successSection,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.successIconContainer}>
            <View style={styles.successIcon}>
              <Animated.View style={styles.pulseCircle} />
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successMessage}>Your appointment has been successfully booked</Text>
          <Text style={styles.bookingId}>
            Booking ID: <Text style={styles.bookingIdValue}>#{booking.id.substring(0, 8).toUpperCase()}</Text>
          </Text>
        </Animated.View>

        <View style={styles.salonCard}>
          <Text style={styles.salonName}>{booking.salonName}</Text>
          <View style={styles.salonMeta}>
            <Ionicons name="location" size={14} color="#8B5CF6" />
            <Text style={styles.salonAddress} numberOfLines={2}>
              {booking.salonAddress}, {booking.salonCity}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={18} color="#8B5CF6" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
              <Ionicons name="navigate" size={18} color="#8B5CF6" />
              <Text style={styles.actionButtonText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {hasPreferences && (
          <StylistPreferencesBadge stylistName={staffName} />
        )}

        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Appointment Details</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(booking.bookingDate)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time" size={16} color="#EC4899" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{booking.bookingTime}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="hourglass" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {booking.services.reduce((sum, s) => sum + s.durationMinutes, 0)} minutes
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.servicesCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cut-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Selected Services</Text>
          </View>
          {booking.services.map((service, index) => (
            <View key={index} style={[styles.serviceRow, index < booking.services.length - 1 && styles.serviceRowBorder]}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceMeta}>
                  <Text style={styles.serviceMetaText}>{service.durationMinutes} min</Text>
                  <Text style={styles.serviceMetaSeparator}>•</Text>
                  <Text style={styles.servicePrice}>{formatPrice(service.priceInPaisa)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Amount</Text>
            <Text style={styles.paymentValue}>{formatPrice(booking.totalAmountPaisa)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentMethod}>
              {booking.paymentMethod === 'pay_now' 
                ? 'Paid Online' 
                : booking.paymentMethod === 'pay_deposit' || depositPaid
                  ? 'Deposit Paid'
                  : 'Pay at Salon'}
            </Text>
          </View>
          {(booking.paymentMethod === 'pay_deposit' || depositPaid) && (
            <View style={styles.depositInfoRow}>
              <Ionicons name="shield-checkmark" size={16} color="#D97706" />
              <Text style={styles.depositInfoText}>
                Deposit paid - balance due at salon
              </Text>
            </View>
          )}
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {booking.status === 'confirmed' ? 'Confirmed' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Important Information</Text>
            <Text style={styles.infoText}>
              • Please arrive 5 minutes before your appointment{'\n'}
              • Bring a valid ID for verification{'\n'}
              • Contact the salon if you need to reschedule
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.homeButtonFull} onPress={handleGoHome}>
          <Ionicons name="home" size={20} color="#FFFFFF" />
          <Text style={styles.homeButtonFullText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
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
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
    marginTop: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    fontWeight: '600',
  },
  homeButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
  },
  homeButtonText: {
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
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  pulseCircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#10B981',
    opacity: 0.2,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookingId: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookingIdValue: {
    fontWeight: '600',
    color: '#8B5CF6',
  },
  salonCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  salonMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 16,
  },
  salonAddress: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  servicesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  serviceRow: {
    paddingVertical: 12,
  },
  serviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceInfo: {
    gap: 4,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  serviceMetaSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  paymentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  paymentMethod: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  depositInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  depositInfoText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18,
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
  homeButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
  },
  homeButtonFullText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
