import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Modal,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { giftCardAPI } from '../services/api';
import { GiftCard, GiftCardTransaction } from '../types/giftCard';

export default function GiftCardDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadCardDetails();
  }, [cardId]);

  const loadCardDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCard(null);
      setTransactions([]);
      
      const [cardsResponse, transactionsResponse] = await Promise.all([
        giftCardAPI.getMyCards(),
        giftCardAPI.getTransactions(cardId),
      ]);

      if (!cardsResponse.success || !transactionsResponse.success) {
        setError('Failed to load gift card details. Please try again.');
      } else {
        const allCards = [...(cardsResponse.purchased || []), ...(cardsResponse.received || [])];
        const foundCard = allCards.find((c: GiftCard) => c.id === cardId);
        if (foundCard) {
          setCard(foundCard);
        }
        setTransactions(transactionsResponse.transactions || []);
      }
    } catch (err) {
      console.error('Error loading card details:', err);
      setError('Failed to load gift card details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCardDetails();
    setIsRefreshing(false);
  }, [cardId]);

  const handleShare = async () => {
    if (!card) return;

    try {
      const message = `I'm sending you a SalonHub Gift Card worth ₹${(card.balancePaisa / 100).toLocaleString()}!\n\nCode: ${card.code}\n\nRedeem it at ${card.salonName}.\n\nDownload SalonHub to use your gift card!`;

      await Share.share({
        message,
        title: 'SalonHub Gift Card',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = async () => {
    if (!card) return;
    await Clipboard.setStringAsync(card.code);
    Alert.alert('Copied!', 'Gift card code copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'partially_redeemed':
        return '#F59E0B';
      case 'fully_redeemed':
        return '#6B7280';
      case 'expired':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'partially_redeemed':
        return 'Partially Used';
      case 'fully_redeemed':
        return 'Fully Redeemed';
      case 'expired':
        return 'Expired';
      case 'pending_payment':
        return 'Pending';
      default:
        return status;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchased';
      case 'redemption':
        return 'Redeemed';
      case 'partial_redemption':
        return 'Partially Redeemed';
      case 'refund':
        return 'Refunded';
      default:
        return type;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'add-circle';
      case 'redemption':
      case 'partial_redemption':
        return 'remove-circle';
      case 'refund':
        return 'refresh-circle';
      default:
        return 'ellipse';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return '#10B981';
      case 'redemption':
      case 'partial_redemption':
        return '#EF4444';
      case 'refund':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSimpleDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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
          <Text style={styles.headerTitle}>Gift Card Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading details...</Text>
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
          <Text style={styles.headerTitle}>Gift Card Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCardDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gift Card Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Card Not Found</Text>
          <Text style={styles.emptySubtitle}>
            This gift card could not be found
          </Text>
        </View>
      </View>
    );
  }

  const usagePercent = ((card.originalValuePaisa - card.balancePaisa) / card.originalValuePaisa) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gift Card Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => setShowQRModal(true)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#8B5CF6', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardPattern}>
              <View style={[styles.patternCircle, styles.patternCircle1]} />
              <View style={[styles.patternCircle, styles.patternCircle2]} />
            </View>

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardSalonName}>{card.salonName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(card.status)}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(card.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(card.status) }]}>
                    {getStatusLabel(card.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.codeRow}>
                  <Text style={styles.cardCode}>{card.code}</Text>
                  <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                    <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.balanceSection}>
                  <View>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceAmount}>
                      ₹{(card.balancePaisa / 100).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.qrPreview}>
                    <Ionicons name="qr-code" size={32} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.qrPreviewText}>Tap to view QR</Text>
                  </View>
                </View>

                {(card.status === 'active' || card.status === 'partially_redeemed') && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${100 - usagePercent}%` }]} />
                    </View>
                    <View style={styles.progressLabels}>
                      <Text style={styles.progressText}>
                        ₹{((card.originalValuePaisa - card.balancePaisa) / 100).toLocaleString()} used
                      </Text>
                      <Text style={styles.progressText}>
                        ₹{(card.originalValuePaisa / 100).toLocaleString()} total
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Card Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="gift-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Original Value</Text>
              <Text style={styles.detailValue}>
                ₹{(card.originalValuePaisa / 100).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Purchased On</Text>
              <Text style={styles.detailValue}>{formatSimpleDate(card.purchasedAt)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Expires On</Text>
              <Text style={styles.detailValue}>
                {card.expiresAt ? formatSimpleDate(card.expiresAt) : 'No Expiry'}
              </Text>
            </View>
          </View>

          {card.recipientName && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="person-outline" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{card.recipientName}</Text>
              </View>
            </View>
          )}

          {card.personalMessage && (
            <View style={styles.messageContainer}>
              <View style={styles.messageHeader}>
                <Ionicons name="chatbubble-outline" size={16} color="#8B5CF6" />
                <Text style={styles.messageLabel}>Personal Message</Text>
              </View>
              <Text style={styles.messageText}>{card.personalMessage}</Text>
            </View>
          )}
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>

          {transactions.length === 0 ? (
            <View style={styles.noTransactions}>
              <Text style={styles.noTransactionsText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor(transaction.transactionType)}15` }]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.transactionType)}
                    size={24}
                    color={getTransactionColor(transaction.transactionType)}
                  />
                </View>
                <View style={styles.transactionContent}>
                  <Text style={styles.transactionType}>
                    {getTransactionTypeLabel(transaction.transactionType)}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.createdAt)}
                  </Text>
                  {transaction.notes && (
                    <Text style={styles.transactionNotes}>{transaction.notes}</Text>
                  )}
                </View>
                <View style={styles.transactionAmountContainer}>
                  <Text style={[styles.transactionAmount, { color: getTransactionColor(transaction.transactionType) }]}>
                    {transaction.transactionType === 'purchase' ? '+' : '-'}
                    ₹{(transaction.amountPaisa / 100).toLocaleString()}
                  </Text>
                  <Text style={styles.transactionBalance}>
                    Bal: ₹{(transaction.balanceAfterPaisa / 100).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <LinearGradient
              colors={['#8B5CF6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Share Gift Card</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Gift Card QR Code</Text>
              <TouchableOpacity
                onPress={() => setShowQRModal(false)}
                style={styles.qrModalClose}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrModalContent}>
              <View style={styles.qrContainer}>
                <Ionicons name="qr-code" size={120} color="#8B5CF6" />
              </View>
              <Text style={styles.qrCode}>{card.code}</Text>
              <Text style={styles.qrBalance}>
                Balance: ₹{(card.balancePaisa / 100).toLocaleString()}
              </Text>
              <Text style={styles.qrInstructions}>
                Show this code at the salon to redeem your gift card
              </Text>

              <TouchableOpacity style={styles.copyCodeButton} onPress={handleCopyCode}>
                <Ionicons name="copy-outline" size={18} color="#8B5CF6" />
                <Text style={styles.copyCodeButtonText}>Copy Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
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
    fontWeight: '600',
    color: '#111827',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle1: {
    width: 200,
    height: 200,
    top: -80,
    right: -80,
  },
  patternCircle2: {
    width: 150,
    height: 150,
    bottom: -60,
    left: -60,
  },
  cardContent: {
    padding: 20,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardSalonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {},
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardCode: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qrPreview: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  qrPreviewText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  messageContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  messageText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  transactionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  noTransactions: {
    padding: 24,
    alignItems: 'center',
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionNotes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionBalance: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionsSection: {
    marginHorizontal: 16,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  qrModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  qrModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  qrModalClose: {
    padding: 4,
  },
  qrModalContent: {
    alignItems: 'center',
    padding: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 2,
    marginTop: 20,
  },
  qrBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginTop: 8,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
  },
  copyCodeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
