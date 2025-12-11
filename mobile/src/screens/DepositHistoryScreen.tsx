import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { depositAPI, DepositTransaction } from '../services/api';

export default function DepositHistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<DepositTransaction[]>([]);
  const [stats, setStats] = useState<{
    totalDeposited: number;
    totalRefunded: number;
    totalForfeited: number;
    pendingDeposits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const data = await depositAPI.getMyDeposits();
      setTransactions(data.transactions || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeposits();
  };

  const formatPrice = (paisa: number) => `₹${(paisa / 100).toFixed(0)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit_collected':
        return { name: 'arrow-down-circle', color: '#10B981' };
      case 'deposit_refunded':
        return { name: 'arrow-up-circle', color: '#3B82F6' };
      case 'deposit_forfeited':
      case 'no_show_charged':
        return { name: 'close-circle', color: '#EF4444' };
      case 'deposit_applied':
        return { name: 'checkmark-circle', color: '#8B5CF6' };
      default:
        return { name: 'ellipse', color: '#6B7280' };
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit_collected':
        return 'Deposit Paid';
      case 'deposit_refunded':
        return 'Deposit Refunded';
      case 'deposit_forfeited':
        return 'Deposit Forfeited';
      case 'no_show_charged':
        return 'No-Show Charge';
      case 'deposit_applied':
        return 'Applied to Booking';
      default:
        return 'Transaction';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit_refunded':
        return '#10B981';
      case 'deposit_forfeited':
      case 'no_show_charged':
        return '#EF4444';
      default:
        return '#111827';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'deposit_refunded':
        return '+';
      case 'deposit_forfeited':
      case 'no_show_charged':
        return '-';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading deposit history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B5CF6" />
        }
      >
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatPrice(stats.totalDeposited || 0)}</Text>
              <Text style={styles.statLabel}>Total Deposited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {formatPrice(stats.totalRefunded || 0)}
              </Text>
              <Text style={styles.statLabel}>Refunded</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {formatPrice(stats.totalForfeited || 0)}
              </Text>
              <Text style={styles.statLabel}>Forfeited</Text>
            </View>
          </View>
        )}

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Deposit History</Text>
            <Text style={styles.emptyText}>
              Your deposit transactions will appear here when you make bookings with deposit requirements.
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {transactions.map((transaction) => {
              const icon = getTransactionIcon(transaction.transactionType);
              return (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionLabel}>
                      {getTransactionLabel(transaction.transactionType)}
                    </Text>
                    <Text style={styles.salonName}>{transaction.salonName || 'Salon'}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                    {transaction.reason && (
                      <Text style={styles.transactionReason}>{transaction.reason}</Text>
                    )}
                  </View>
                  <View style={styles.amountContainer}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getAmountColor(transaction.transactionType) },
                      ]}
                    >
                      {getAmountPrefix(transaction.transactionType)}
                      {formatPrice(transaction.amountPaisa)}
                    </Text>
                    <Text style={styles.statusText}>{transaction.status}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About Deposits</Text>
            <Text style={styles.infoText}>
              Deposits secure your booking and are applied to your final bill. Refunds are processed
              based on the salon's cancellation policy.
            </Text>
          </View>
        </View>

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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionsList: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  salonName: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionReason: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#3B82F6',
    lineHeight: 18,
  },
});
