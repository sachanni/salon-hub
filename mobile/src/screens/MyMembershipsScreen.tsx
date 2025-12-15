import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { membershipAPI } from '../services/api';
import { CustomerMembership } from '../types/navigation';

const formatCurrency = (paisa: number) => {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return { bg: '#D1FAE5', text: '#065F46' };
    case 'paused':
      return { bg: '#FEF3C7', text: '#92400E' };
    case 'cancelled':
      return { bg: '#FEE2E2', text: '#991B1B' };
    case 'expired':
      return { bg: '#E5E7EB', text: '#374151' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const planTypeLabels: Record<string, string> = {
  discount: 'Discount Plan',
  credit: 'Beauty Bank',
  packaged: 'Service Package',
};

export default function MyMembershipsScreen() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<CustomerMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMemberships = async () => {
    try {
      const response = await membershipAPI.getMyMemberships();
      if (response.success) {
        setMemberships(response.memberships || []);
      }
    } catch (error) {
      console.error('Failed to fetch memberships:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMemberships();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMemberships();
  }, []);

  const handlePause = async (membership: CustomerMembership) => {
    Alert.alert(
      'Pause Membership',
      'Are you sure you want to pause this membership? Your benefits will be suspended until you resume.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pause',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(membership.id);
            try {
              const response = await membershipAPI.pauseMembership(membership.id);
              if (response.success) {
                Alert.alert('Paused', 'Your membership has been paused.');
                fetchMemberships();
              } else {
                Alert.alert('Error', response.error || 'Failed to pause membership.');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleResume = async (membership: CustomerMembership) => {
    setActionLoading(membership.id);
    try {
      const response = await membershipAPI.resumeMembership(membership.id);
      if (response.success) {
        Alert.alert('Resumed', 'Your membership is now active again!');
        fetchMemberships();
      } else {
        Alert.alert('Error', response.error || 'Failed to resume membership.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (membership: CustomerMembership) => {
    Alert.alert(
      'Cancel Membership',
      'Are you sure you want to cancel this membership? This action cannot be undone.',
      [
        { text: 'Keep Membership', style: 'cancel' },
        {
          text: 'Cancel Membership',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(membership.id);
            try {
              const response = await membershipAPI.cancelMembership(membership.id);
              if (response.success) {
                Alert.alert('Cancelled', 'Your membership has been cancelled.');
                fetchMemberships();
              } else {
                Alert.alert('Error', response.error || 'Failed to cancel membership.');
              }
            } catch (error) {
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading your memberships...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Memberships</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
        }
      >
        {memberships.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="card-outline" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No Memberships Yet</Text>
            <Text style={styles.emptyText}>
              Join a salon's membership program to enjoy exclusive benefits and savings.
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.exploreButtonText}>Explore Salons</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {memberships.map((membership) => {
              const statusColor = getStatusColor(membership.status);
              const daysRemaining = getDaysRemaining(membership.endDate);
              const isActive = membership.status === 'active';
              const isPaused = membership.status === 'paused';

              return (
                <View key={membership.id} style={styles.membershipCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.salonInfo}>
                      {membership.salon?.imageUrl ? (
                        <Image
                          source={{ uri: membership.salon.imageUrl }}
                          style={styles.salonImage}
                        />
                      ) : (
                        <View style={styles.salonImagePlaceholder}>
                          <Ionicons name="business" size={20} color="#9CA3AF" />
                        </View>
                      )}
                      <View style={styles.salonDetails}>
                        <Text style={styles.salonName}>{membership.salon?.name}</Text>
                        <Text style={styles.planName}>{membership.plan?.name}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                      <Text style={[styles.statusText, { color: statusColor.text }]}>
                        {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.planTypeBadge}>
                      <Text style={styles.planTypeText}>
                        {planTypeLabels[membership.plan?.planType] || 'Membership'}
                      </Text>
                    </View>

                    {membership.plan?.planType === 'discount' && membership.plan?.discountPercentage && (
                      <View style={styles.benefitHighlight}>
                        <Ionicons name="pricetag" size={20} color="#8B5CF6" />
                        <Text style={styles.benefitValue}>
                          {membership.plan.discountPercentage}% off all services
                        </Text>
                      </View>
                    )}

                    {membership.plan?.planType === 'credit' && (
                      <View style={styles.benefitHighlight}>
                        <Ionicons name="wallet" size={20} color="#8B5CF6" />
                        <View>
                          <Text style={styles.benefitLabel}>Available Credits</Text>
                          <Text style={styles.benefitValue}>
                            {formatCurrency(membership.remainingCreditsInPaisa || 0)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {membership.plan?.planType === 'packaged' && membership.serviceUsage && (
                      <View style={styles.usageSection}>
                        <Text style={styles.usageTitle}>Service Usage This Month</Text>
                        {membership.serviceUsage.slice(0, 3).map((usage) => (
                          <View key={usage.serviceId} style={styles.usageRow}>
                            <Text style={styles.usageServiceName}>{usage.serviceName}</Text>
                            <Text style={styles.usageCount}>
                              {usage.isUnlimited
                                ? `${usage.usedThisMonth} used`
                                : `${usage.usedThisMonth}/${usage.quantityPerMonth}`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.validityInfo}>
                      <View style={styles.validityRow}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.validityText}>
                          Valid until {formatDate(membership.endDate)}
                        </Text>
                      </View>
                      {isActive && daysRemaining <= 30 && (
                        <View style={styles.expiryWarning}>
                          <Ionicons name="warning" size={14} color="#F59E0B" />
                          <Text style={styles.expiryText}>
                            {daysRemaining} days remaining
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {(isActive || isPaused) && (
                    <View style={styles.cardActions}>
                      {isActive && (
                        <>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handlePause(membership)}
                            disabled={actionLoading === membership.id}
                          >
                            {actionLoading === membership.id ? (
                              <ActivityIndicator size="small" color="#6B7280" />
                            ) : (
                              <>
                                <Ionicons name="pause-circle-outline" size={18} color="#6B7280" />
                                <Text style={styles.actionButtonText}>Pause</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.cancelAction]}
                            onPress={() => handleCancel(membership)}
                            disabled={actionLoading === membership.id}
                          >
                            <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                            <Text style={[styles.actionButtonText, styles.cancelText]}>Cancel</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {isPaused && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.resumeAction]}
                          onPress={() => handleResume(membership)}
                          disabled={actionLoading === membership.id}
                        >
                          {actionLoading === membership.id ? (
                            <ActivityIndicator size="small" color="#8B5CF6" />
                          ) : (
                            <>
                              <Ionicons name="play-circle-outline" size={18} color="#8B5CF6" />
                              <Text style={[styles.actionButtonText, styles.resumeText]}>Resume</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => router.push(`/salon/${membership.salonId}`)}
                      >
                        <Ionicons name="calendar" size={18} color="#FFFFFF" />
                        <Text style={styles.bookButtonText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
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
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  membershipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  salonInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  salonImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  salonImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  salonDetails: {
    flex: 1,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  planName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  planTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    marginBottom: 12,
  },
  planTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
  },
  benefitHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  benefitLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  benefitValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  usageSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  usageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  usageServiceName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  usageCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  validityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityText: {
    fontSize: 13,
    color: '#6B7280',
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
  },
  cardActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  cancelAction: {
    backgroundColor: '#FEF2F2',
  },
  cancelText: {
    color: '#DC2626',
  },
  resumeAction: {
    backgroundColor: '#EDE9FE',
  },
  resumeText: {
    color: '#8B5CF6',
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    gap: 6,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
