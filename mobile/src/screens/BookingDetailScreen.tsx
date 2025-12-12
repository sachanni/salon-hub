import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { bookingAPI } from '../services/api';
import LateArrivalButton from '../components/LateArrivalButton';

export default function BookingDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadBookingDetails();
    }
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true);
      const response = await bookingAPI.getBookingById(bookingId);
      if (response.success && response.booking) {
        setBooking(response.booking);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: confirmCancelBooking,
        },
      ]
    );
  };

  const confirmCancelBooking = async () => {
    try {
      setIsCancelling(true);
      await bookingAPI.cancelBooking(bookingId, 'Cancelled by user');
      Alert.alert('Success', 'Booking cancelled successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#ECFDF5', text: '#10B981', border: '#10B981' };
      case 'pending':
        return { bg: '#FFF7ED', text: '#F59E0B', border: '#F59E0B' };
      case 'completed':
        return { bg: '#EFF6FF', text: '#3B82F6', border: '#3B82F6' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444', border: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#6B7280' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading booking...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Booking Not Found</Text>
          <Text style={styles.emptyStateText}>This booking may have been deleted</Text>
        </View>
      </View>
    );
  }

  const statusColors = getStatusColor(booking.status);
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors.bg, borderColor: statusColors.border },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>

        {/* Salon Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Salon Details</Text>
          </View>
          <Text style={styles.salonName}>{booking.salonName || 'Salon'}</Text>
        </View>

        {/* Service Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cut-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Service</Text>
          </View>
          <Text style={styles.serviceName}>{booking.serviceName || 'Service'}</Text>
        </View>

        {/* Date & Time */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Date & Time</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(booking.bookingDate)}</Text>
          <Text style={styles.timeText}>at {booking.bookingTime}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Customer Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{booking.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{booking.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{booking.customerEmail}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={20} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Method:</Text>
            <Text style={styles.infoValue}>
              {booking.paymentMethod === 'pay_now' ? 'Paid Online' : 'Pay at Salon'}
            </Text>
          </View>
          {booking.originalAmountPaisa && booking.originalAmountPaisa !== booking.finalAmountPaisa && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Original Amount:</Text>
              <Text style={[styles.infoValue, styles.strikethrough]}>
                ₹{(booking.originalAmountPaisa / 100).toFixed(0)}
              </Text>
            </View>
          )}
          {booking.discountAmountPaisa > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Discount:</Text>
              <Text style={[styles.infoValue, styles.discountText]}>
                -₹{(booking.discountAmountPaisa / 100).toFixed(0)}
              </Text>
            </View>
          )}
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>
              ₹{((booking.finalAmountPaisa || booking.totalAmountPaisa) / 100).toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={20} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* Late Arrival Button - Only for today's active bookings */}
        <LateArrivalButton
          bookingId={booking.id}
          bookingTime={booking.bookingTime}
          bookingDate={booking.bookingDate}
          salonName={booking.salonName || 'the salon'}
          bookingStatus={booking.status}
          onSuccess={loadBookingDetails}
          style={styles.lateArrivalButton}
        />

        {/* Booking ID */}
        <View style={styles.bookingIdContainer}>
          <Text style={styles.bookingIdLabel}>Booking ID</Text>
          <Text style={styles.bookingId}>{booking.id}</Text>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelBooking}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salonName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  discountText: {
    color: '#10B981',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    flex: 1,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bookingIdContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bookingIdLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#111827',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lateArrivalButton: {
    marginBottom: 16,
  },
});
