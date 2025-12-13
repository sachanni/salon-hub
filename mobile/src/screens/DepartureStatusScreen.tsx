import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { departureAPI } from '../services/api';
import type { DepartureStatus } from '../services/api';

export default function DepartureStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string | undefined;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<DepartureStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadDepartureStatus();
    }
  }, [bookingId]);

  const loadDepartureStatus = async () => {
    if (!bookingId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await departureAPI.getDepartureStatus(bookingId);
      if (response.success && response.status) {
        setStatus(response.status);
      } else {
        setError(response.error || 'Unable to load departure status');
      }
    } catch (err) {
      console.error('Error loading departure status:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDepartureStatus();
    setIsRefreshing(false);
  };

  const handleAcknowledge = async () => {
    if (!status?.alertId) {
      Alert.alert('Got it!', 'Thank you for confirming. Have a great appointment!');
      return;
    }
    
    try {
      const response = await departureAPI.acknowledgeAlert(status.alertId, {
        response: 'acknowledged',
      });
      if (response.success) {
        Alert.alert('Got it!', 'Thank you for confirming. Have a great appointment!');
      }
    } catch (err) {
      console.error('Error acknowledging:', err);
    }
  };

  const handleWillBeLate = async () => {
    if (!status?.alertId) {
      Alert.alert('Running Late', 'Please contact the salon directly to let them know.');
      return;
    }
    
    Alert.alert(
      'Running Late?',
      'Would you like us to notify the salon that you might be delayed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Notify Salon',
          onPress: async () => {
            try {
              const response = await departureAPI.acknowledgeAlert(status.alertId!, {
                response: 'will_be_late',
              });
              if (response.success) {
                Alert.alert('Notified', 'The salon has been informed. They will adjust your slot if possible.');
              }
            } catch (err) {
              console.error('Error notifying:', err);
            }
          },
        },
      ]
    );
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDelayColor = (minutes: number) => {
    if (minutes === 0) return '#10B981';
    if (minutes <= 10) return '#F59E0B';
    if (minutes <= 20) return '#F97316';
    return '#EF4444';
  };

  const getStatusIcon = (currentStatus?: string) => {
    switch (currentStatus) {
      case 'available': return { name: 'checkmark-circle', color: '#10B981' };
      case 'busy': return { name: 'time', color: '#F59E0B' };
      case 'break': return { name: 'cafe', color: '#3B82F6' };
      default: return { name: 'person', color: '#6B7280' };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Departure Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading departure info...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Departure Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadDepartureStatus}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!status) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Departure Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Departure Info</Text>
          <Text style={styles.emptyText}>
            Departure status is not yet available for this booking.
          </Text>
        </View>
      </View>
    );
  }

  const statusIcon = getStatusIcon(status.staffStatus?.currentStatus);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Departure Status</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.mainCard}>
          <View style={styles.departureTimeSection}>
            <Text style={styles.departureLabel}>Suggested Departure Time</Text>
            <Text style={styles.departureTime}>
              {formatTime(status.suggestedDeparture.time)}
            </Text>
            {status.suggestedDeparture.fromLocation && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.locationText}>
                  From {status.suggestedDeparture.fromLocation}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.appointmentSection}>
            <View style={styles.appointmentRow}>
              <View style={styles.appointmentItem}>
                <Text style={styles.appointmentLabel}>Scheduled</Text>
                <Text style={styles.appointmentValue}>
                  {formatTime(status.originalTime)}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#D1D5DB" />
              <View style={styles.appointmentItem}>
                <Text style={styles.appointmentLabel}>Likely Start</Text>
                <Text style={[styles.appointmentValue, { color: getDelayColor(status.delayMinutes) }]}>
                  {formatTime(status.predictedStartTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {status.delayMinutes > 0 && (
          <View style={[styles.delayCard, { borderColor: getDelayColor(status.delayMinutes) }]}>
            <View style={styles.delayHeader}>
              <Ionicons name="time-outline" size={24} color={getDelayColor(status.delayMinutes)} />
              <Text style={[styles.delayMinutes, { color: getDelayColor(status.delayMinutes) }]}>
                ~{status.delayMinutes} min delay
              </Text>
            </View>
            {status.delayReason && (
              <Text style={styles.delayReason}>{status.delayReason}</Text>
            )}
          </View>
        )}

        {status.delayMinutes === 0 && (
          <View style={styles.onTimeCard}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <View style={styles.onTimeContent}>
              <Text style={styles.onTimeTitle}>On Schedule</Text>
              <Text style={styles.onTimeText}>Your appointment is running on time!</Text>
            </View>
          </View>
        )}

        {status.staffStatus && (
          <View style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <View style={[styles.staffIcon, { backgroundColor: statusIcon.color + '15' }]}>
                <Ionicons name={statusIcon.name as any} size={24} color={statusIcon.color} />
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{status.staffStatus.name}</Text>
                <Text style={styles.staffStatus}>
                  {status.staffStatus.currentStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </View>
            </View>
            {status.staffStatus.appointmentsAhead > 0 && (
              <View style={styles.queueInfo}>
                <Ionicons name="people-outline" size={18} color="#6B7280" />
                <Text style={styles.queueText}>
                  {status.staffStatus.appointmentsAhead} appointment{status.staffStatus.appointmentsAhead > 1 ? 's' : ''} ahead of you
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.travelCard}>
          <Text style={styles.travelTitle}>Travel Details</Text>
          <View style={styles.travelRow}>
            <View style={styles.travelItem}>
              <Ionicons name="car-outline" size={20} color="#6B7280" />
              <Text style={styles.travelLabel}>Travel Time</Text>
              <Text style={styles.travelValue}>
                {status.suggestedDeparture.estimatedTravelMinutes || '--'} min
              </Text>
            </View>
            <View style={styles.travelItem}>
              <Ionicons name="add-circle-outline" size={20} color="#6B7280" />
              <Text style={styles.travelLabel}>Buffer</Text>
              <Text style={styles.travelValue}>
                {status.suggestedDeparture.bufferMinutes} min
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.lastUpdated}>
          <Ionicons name="refresh-circle-outline" size={14} color="#9CA3AF" />
          <Text style={styles.lastUpdatedText}>
            Last updated at {formatLastUpdated(status.lastUpdated)}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.lateButton} onPress={handleWillBeLate}>
          <Ionicons name="time-outline" size={18} color="#8B5CF6" />
          <Text style={styles.lateButtonText}>Running Late</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acknowledgeButton} onPress={handleAcknowledge}>
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.acknowledgeButtonText}>Got It</Text>
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
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  departureTimeSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  departureLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  departureTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  appointmentSection: {},
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  appointmentItem: {
    alignItems: 'center',
  },
  appointmentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  appointmentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  delayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  delayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  delayMinutes: {
    fontSize: 16,
    fontWeight: '600',
  },
  delayReason: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    marginLeft: 34,
  },
  onTimeCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  onTimeContent: {
    flex: 1,
  },
  onTimeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#065F46',
  },
  onTimeText: {
    fontSize: 13,
    color: '#047857',
    marginTop: 2,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  staffStatus: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  queueText: {
    fontSize: 13,
    color: '#6B7280',
  },
  travelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  travelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  travelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  travelItem: {
    alignItems: 'center',
    gap: 4,
  },
  travelLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  travelValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    gap: 12,
  },
  lateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    gap: 8,
  },
  lateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  acknowledgeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  acknowledgeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
