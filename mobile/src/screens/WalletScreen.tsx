import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { walletAPI } from '../services/api';

interface WalletData {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  bookingId?: string;
  createdAt: string;
}

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const [walletResponse, transactionsResponse] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions({ limit: 20 }),
      ]);

      if (walletResponse.success) {
        setWallet(walletResponse.wallet);
      }
      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.transactions);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadWalletData();
    setIsRefreshing(false);
  };

  const handleAddMoney = async () => {
    const amount = parseInt(addAmount);
    if (isNaN(amount) || amount < 1) {
      Alert.alert('Error', 'Please enter a valid amount (minimum ₹1)');
      return;
    }
    if (amount > 10000) {
      Alert.alert('Error', 'Maximum amount is ₹10,000');
      return;
    }

    setIsProcessing(true);
    try {
      const orderResponse = await walletAPI.createAddMoneyOrder(amount * 100);
      if (orderResponse.success) {
        Alert.alert(
          'Payment Order Created',
          `Order ID: ${orderResponse.orderId}\nAmount: ₹${amount}\n\nPayment integration will be completed in the native app.`,
          [{ text: 'OK', onPress: () => setShowAddMoney(false) }]
        );
        setAddAmount('');
        loadWalletData();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create payment order');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (type: string, reason: string) => {
    if (type === 'credit') {
      switch (reason) {
        case 'wallet_topup': return 'add-circle';
        case 'cashback': return 'gift';
        case 'referral_reward': return 'people';
        case 'signup_bonus': return 'star';
        default: return 'arrow-down-circle';
      }
    }
    return 'arrow-up-circle';
  };

  const getTransactionColor = (type: string) => {
    return type === 'credit' ? '#10B981' : '#EF4444';
  };

  const formatReason = (reason: string) => {
    switch (reason) {
      case 'wallet_topup': return 'Added Money';
      case 'cashback': return 'Cashback Reward';
      case 'booking_payment': return 'Booking Payment';
      case 'referral_reward': return 'Referral Bonus';
      case 'signup_bonus': return 'Welcome Bonus';
      case 'payment': return 'Payment';
      default: return reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{((wallet?.balance || 0) / 100).toFixed(2)}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{((wallet?.lifetimeEarned || 0) / 100).toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{((wallet?.lifetimeSpent || 0) / 100).toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addMoneyButton}
            onPress={() => setShowAddMoney(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        {showAddMoney && (
          <View style={styles.addMoneyCard}>
            <Text style={styles.addMoneyTitle}>Add Money to Wallet</Text>
            <View style={styles.quickAmounts}>
              {[100, 200, 500, 1000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.quickAmount, addAmount === amount.toString() && styles.quickAmountActive]}
                  onPress={() => setAddAmount(amount.toString())}
                >
                  <Text style={[styles.quickAmountText, addAmount === amount.toString() && styles.quickAmountTextActive]}>
                    ₹{amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.amountInputContainer}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={styles.addMoneyActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setShowAddMoney(false); setAddAmount(''); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleAddMoney}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyStateText}>Your wallet transactions will appear here</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(transaction.type) + '15' }]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type, transaction.reason) as any}
                    size={24}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionReason}>{formatReason(transaction.reason)}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
                </View>
                <Text style={[styles.transactionAmount, { color: getTransactionColor(transaction.type) }]}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{(transaction.amount / 100).toFixed(0)}
                </Text>
              </View>
            ))
          )}
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
  balanceCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  addMoneyButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addMoneyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addMoneyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  addMoneyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickAmount: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickAmountActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickAmountTextActive: {
    color: '#8B5CF6',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 14,
    paddingLeft: 8,
  },
  addMoneyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  proceedButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
