import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '../components/ProfileHeader';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsAPI } from '../services/api';
import { RescheduleModal } from '../components/RescheduleModal';

type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
type TabType = 'upcoming' | 'past';

interface Appointment {
  id: string;
  salonId: string;
  salonName: string;
  salonImage: string;
  serviceId: string;
  serviceName: string;
  staffId?: string;
  staffName?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  price: string;
  serviceType: 'salon' | 'home';
  address?: string;
  duration?: number;
}

const SAMPLE_APPOINTMENTS: Appointment[] = [];

export const AppointmentsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setError(null);
      const response = await appointmentsAPI.getAppointments();
      if (response.bookings && response.bookings.length > 0) {
        setAppointments(response.bookings.map((booking: any) => ({
          id: booking.id,
          salonId: booking.salonId || '',
          salonName: booking.salonName || 'Salon',
          salonImage: booking.salonImage || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/688939e330-bad6a2b97e3779575df6.png',
          serviceId: booking.serviceId || '',
          serviceName: booking.serviceName || 'Service',
          staffId: booking.staffId,
          staffName: booking.staffName,
          date: booking.date,
          time: booking.time,
          status: booking.status,
          price: `₹${booking.price || 0}`,
          serviceType: booking.serviceType || 'salon',
          address: booking.address,
          duration: booking.duration,
        })));
      } else {
        setAppointments(SAMPLE_APPOINTMENTS);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments(SAMPLE_APPOINTMENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalVisible(true);
  };

  const handleCancel = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your ${appointment.serviceName} appointment at ${appointment.salonName}?`,
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => confirmCancel(appointment),
        },
      ]
    );
  };

  const confirmCancel = async (appointment: Appointment) => {
    setCancelling(appointment.id);
    try {
      await appointmentsAPI.cancelAppointment(appointment.id, { reason: 'Customer requested cancellation' });
      Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled successfully.');
      fetchAppointments();
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      Alert.alert('Cancellation Failed', err.response?.data?.error || 'Could not cancel your appointment. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const handleRebook = (appointment: Appointment) => {
    router.push({
      pathname: '/salon/[id]',
      params: {
        id: appointment.salonId,
        preselectedServiceId: appointment.serviceId,
        preferredStaffId: appointment.staffId || '',
        fromRebooking: 'true',
      },
    });
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const upcomingAppointments = appointments.filter((a) => a.status === 'upcoming');
  const pastAppointments = appointments.filter((a) => a.status !== 'upcoming');

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments().finally(() => setRefreshing(false));
  }, []);

  const handleAppointmentPress = (appointmentId: string) => {
    router.push(`/booking-detail?id=${appointmentId}`);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'upcoming':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'completed':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const statusColors = getStatusColor(appointment.status);
    
    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => handleAppointmentPress(appointment.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Image source={{ uri: appointment.salonImage }} style={styles.salonImage} />
          <View style={styles.cardHeaderInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.salonName}>{appointment.salonName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {getStatusLabel(appointment.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.serviceName}>{appointment.serviceName}</Text>
            <View style={styles.serviceTypeBadge}>
              <Ionicons 
                name={appointment.serviceType === 'home' ? 'home' : 'storefront'} 
                size={12} 
                color="#6B7280" 
              />
              <Text style={styles.serviceTypeText}>
                {appointment.serviceType === 'home' ? 'At Home' : 'At Salon'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
            <Text style={styles.detailText}>{appointment.date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#8B5CF6" />
            <Text style={styles.detailText}>{appointment.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#8B5CF6" />
            <Text style={styles.detailText}>{appointment.price}</Text>
          </View>
        </View>

        {appointment.status === 'upcoming' && (
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.rescheduleButton}
              onPress={() => handleReschedule(appointment)}
            >
              <Ionicons name="calendar" size={16} color="#8B5CF6" />
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancel(appointment)}
              disabled={cancelling === appointment.id}
            >
              {cancelling === appointment.id ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.cancelText}>Cancel</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {appointment.status === 'completed' && (
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.rebookButton}
              onPress={() => handleRebook(appointment)}
            >
              <Ionicons name="refresh" size={16} color="#059669" />
              <Text style={styles.rebookText}>Book Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reviewButton}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.reviewText}>Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ProfileHeader title="My Appointments" />

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past ({pastAppointments.length})
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : displayedAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'} 
              size={64} 
              color="#D1D5DB" 
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming' 
                ? 'Book a service to see your appointments here' 
                : 'Your completed appointments will appear here'}
            </Text>
            {activeTab === 'upcoming' && (
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => router.push('/(tabs)/at-salon')}
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayedAppointments.map(renderAppointmentCard)
        )}
      </ScrollView>

      {selectedAppointment && (
        <RescheduleModal
          visible={rescheduleModalVisible}
          onClose={() => {
            setRescheduleModalVisible(false);
            setSelectedAppointment(null);
          }}
          onSuccess={() => fetchAppointments()}
          appointment={{
            id: selectedAppointment.id,
            salonId: selectedAppointment.salonId,
            salonName: selectedAppointment.salonName,
            serviceId: selectedAppointment.serviceId,
            serviceName: selectedAppointment.serviceName,
            staffId: selectedAppointment.staffId,
            staffName: selectedAppointment.staffName,
            date: selectedAppointment.date,
            time: selectedAppointment.time,
            duration: selectedAppointment.duration,
          }}
        />
      )}
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
    paddingVertical: 12,
    alignItems: 'center',
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
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  salonImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  serviceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceTypeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 6,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  rescheduleText: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  cancelText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  rebookText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
  },
  reviewText: {
    color: '#D97706',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 24,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
