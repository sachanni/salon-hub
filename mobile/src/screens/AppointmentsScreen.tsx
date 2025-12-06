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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProfileHeader } from '../components/ProfileHeader';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsAPI } from '../services/api';

type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
type TabType = 'upcoming' | 'past';

interface Appointment {
  id: string;
  salonName: string;
  salonImage: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  price: string;
  serviceType: 'salon' | 'home';
  staffName?: string;
  address?: string;
}

const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    salonName: 'Glow Studio',
    salonImage: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/688939e330-bad6a2b97e3779575df6.png',
    serviceName: 'Bridal Makeup',
    date: 'Dec 15, 2024',
    time: '2:00 PM',
    status: 'upcoming',
    price: '₹2,500',
    serviceType: 'salon',
    staffName: 'Priya',
    address: 'Sector 18, Noida',
  },
  {
    id: '2',
    salonName: 'Hair Masters',
    salonImage: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/35c073455d-437ad899247819ca011a.png',
    serviceName: 'Haircut & Styling',
    date: 'Dec 18, 2024',
    time: '11:00 AM',
    status: 'upcoming',
    price: '₹800',
    serviceType: 'home',
    staffName: 'Amit',
    address: 'Your Home',
  },
  {
    id: '3',
    salonName: 'Radiance Spa',
    salonImage: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/c40f3d6898-2d0b20b65119f03679e4.png',
    serviceName: 'Full Body Massage',
    date: 'Dec 10, 2024',
    time: '4:00 PM',
    status: 'completed',
    price: '₹1,500',
    serviceType: 'salon',
    staffName: 'Ritu',
    address: 'Connaught Place, Delhi',
  },
  {
    id: '4',
    salonName: 'Glamour Point',
    salonImage: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/4821e1e32d-b8db54dc8f6587c75e8d.png',
    serviceName: 'Facial Treatment',
    date: 'Dec 5, 2024',
    time: '3:00 PM',
    status: 'cancelled',
    price: '₹1,200',
    serviceType: 'home',
    address: 'Your Home',
  },
];

export const AppointmentsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setError(null);
      const response = await appointmentsAPI.getAppointments();
      if (response.bookings && response.bookings.length > 0) {
        setAppointments(response.bookings.map((booking: any) => ({
          id: booking.id,
          salonName: booking.salonName || 'Salon',
          salonImage: booking.salonImage || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/688939e330-bad6a2b97e3779575df6.png',
          serviceName: booking.serviceName || 'Service',
          date: booking.date,
          time: booking.time,
          status: booking.status,
          price: `₹${booking.price || 0}`,
          serviceType: booking.serviceType || 'salon',
          staffName: booking.staffName,
          address: booking.address,
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
            <TouchableOpacity style={styles.rescheduleButton}>
              <Ionicons name="calendar" size={16} color="#8B5CF6" />
              <Text style={styles.rescheduleText}>Reschedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {appointment.status === 'completed' && (
          <TouchableOpacity style={styles.reviewButton}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.reviewText}>Leave a Review</Text>
          </TouchableOpacity>
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
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
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
