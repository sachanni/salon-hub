import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { rebookingAPI } from '../services/api';

interface RebookingSuggestion {
  id: string;
  serviceId: string;
  serviceName: string;
  salonId: string;
  salonName: string;
  lastBookingDate: string;
  daysSinceLastBooking: number;
  recommendedDays: number;
  status: 'approaching' | 'due' | 'overdue';
  preferredStaffId?: string;
  preferredStaffName?: string;
  discountPercent?: number;
}

interface RebookingSuggestionsCardProps {
  onBookNow?: (suggestion: RebookingSuggestion) => void;
}

export const RebookingSuggestionsCard: React.FC<RebookingSuggestionsCardProps> = ({ onBookNow }) => {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<RebookingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const data = await rebookingAPI.getSuggestions();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rebooking suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (suggestion: RebookingSuggestion, reason: string, snoozeDays?: number) => {
    try {
      setDismissing(suggestion.id);
      await rebookingAPI.dismissSuggestion({
        serviceId: suggestion.serviceId,
        salonId: suggestion.salonId,
        reason,
        snoozeDays,
      });
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      Alert.alert('Error', 'Failed to dismiss suggestion. Please try again.');
    } finally {
      setDismissing(null);
    }
  };

  const showDismissOptions = (suggestion: RebookingSuggestion) => {
    Alert.alert(
      'Dismiss Reminder',
      'How would you like to handle this reminder?',
      [
        {
          text: 'Snooze 7 days',
          onPress: () => handleDismiss(suggestion, 'snoozed', 7),
        },
        {
          text: 'Snooze 14 days',
          onPress: () => handleDismiss(suggestion, 'snoozed', 14),
        },
        {
          text: 'Not interested',
          onPress: () => handleDismiss(suggestion, 'not_interested'),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleBookNow = (suggestion: RebookingSuggestion) => {
    if (onBookNow) {
      onBookNow(suggestion);
    } else {
      router.push({
        pathname: '/salon/[id]',
        params: {
          id: suggestion.salonId,
          preselectedServiceId: suggestion.serviceId,
          preferredStaffId: suggestion.preferredStaffId || '',
          fromRebooking: 'true',
        },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return '#EF4444';
      case 'due':
        return '#F59E0B';
      case 'approaching':
        return '#10B981';
      default:
        return '#8B5CF6';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due':
        return 'Due Now';
      case 'approaching':
        return 'Coming Up';
      default:
        return '';
    }
  };

  const formatDaysAgo = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 60) return '1 month ago';
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.clockIcon}>⏰</Text>
          <Text style={styles.title}>Time to Rebook</Text>
        </View>
        <TouchableOpacity onPress={fetchSuggestions}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.card}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(suggestion.status) + '20' },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(suggestion.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(suggestion.status) },
                    ]}
                  >
                    {getStatusLabel(suggestion.status)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => showDismissOptions(suggestion)}
                  disabled={dismissing === suggestion.id}
                >
                  {dismissing === suggestion.id ? (
                    <ActivityIndicator size="small" color="#9CA3AF" />
                  ) : (
                    <Text style={styles.dismissIcon}>✕</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.serviceName} numberOfLines={1}>
                {suggestion.serviceName}
              </Text>
              <Text style={styles.salonName} numberOfLines={1}>
                {suggestion.salonName}
              </Text>

              <View style={styles.timeInfo}>
                <Text style={styles.timeIcon}>📅</Text>
                <Text style={styles.timeText}>
                  Last visit: {formatDaysAgo(suggestion.daysSinceLastBooking)}
                </Text>
              </View>

              {suggestion.preferredStaffName && (
                <View style={styles.staffInfo}>
                  <Text style={styles.staffIcon}>👤</Text>
                  <Text style={styles.staffText} numberOfLines={1}>
                    {suggestion.preferredStaffName}
                  </Text>
                </View>
              )}

              {suggestion.discountPercent && suggestion.discountPercent > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    🎁 {suggestion.discountPercent}% OFF
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => handleBookNow(suggestion)}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bookButtonGradient}
                >
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  refreshIcon: {
    fontSize: 20,
    color: '#8B5CF6',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  card: {
    width: 220,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
  },
  dismissIcon: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  salonName: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  staffIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  staffText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  discountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  bookButton: {
    marginTop: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RebookingSuggestionsCard;
