import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Share,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { giftCardAPI } from '../services/api';
import { GiftCard, MyCardsResponse, OCCASION_OPTIONS } from '../types/giftCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

type TabType = 'purchased' | 'received';

export default function GiftCardWalletScreen() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('purchased');
  const [cards, setCards] = useState<MyCardsResponse>({ purchased: [], received: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await giftCardAPI.getMyCards();
      if (response.success) {
        setCards({
          purchased: response.purchased || [],
          received: response.received || [],
        });
      }
    } catch (err) {
      console.error('Error loading gift cards:', err);
      setError('Unable to load your gift cards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadCards();
    setIsRefreshing(false);
  }, []);

  const handleTabChange = (tab: TabType) => {
    Animated.timing(slideAnim, {
      toValue: tab === 'purchased' ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setActiveTab(tab);
  };

  const handleCardPress = (card: GiftCard) => {
    router.push({
      pathname: '/gift-cards/detail',
      params: { cardId: card.id },
    });
  };

  const handleShowQR = (card: GiftCard) => {
    setSelectedCard(card);
    setShowQRModal(true);
  };

  const handleShare = async (card: GiftCard) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: 'Expired', color: '#EF4444' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: '#EF4444' };
    if (daysLeft <= 30) return { text: `${daysLeft} days left`, color: '#F59E0B' };
    return null;
  };

  const activeCards = activeTab === 'purchased' ? cards.purchased : cards.received;
  const totalBalance = activeCards
    .filter((c) => c.status === 'active' || c.status === 'partially_redeemed')
    .reduce((sum, c) => sum + c.balancePaisa, 0);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Gift Cards</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading gift cards...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Gift Cards</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCards}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#A855F7', '#C084FC']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Gift Cards</Text>
          <TouchableOpacity
            onPress={() => router.push('/gift-cards')}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ₹{(totalBalance / 100).toLocaleString()}
          </Text>
          <Text style={styles.balanceSubtext}>
            {activeCards.filter((c) => c.status === 'active' || c.status === 'partially_redeemed').length} active card(s)
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchased' && styles.tabActive]}
          onPress={() => handleTabChange('purchased')}
        >
          <Ionicons
            name="gift-outline"
            size={18}
            color={activeTab === 'purchased' ? '#8B5CF6' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'purchased' && styles.tabTextActive]}>
            Purchased ({cards.purchased.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'received' && styles.tabActive]}
          onPress={() => handleTabChange('received')}
        >
          <Ionicons
            name="heart-outline"
            size={18}
            color={activeTab === 'received' ? '#8B5CF6' : '#6B7280'}
          />
          <Text style={[styles.tabText, activeTab === 'received' && styles.tabTextActive]}>
            Received ({cards.received.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {activeCards.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'purchased' ? 'No Gift Cards Purchased' : 'No Gift Cards Received'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'purchased'
                ? 'Purchase a gift card to brighten someone\'s day!'
                : 'When someone sends you a gift card, it will appear here'}
            </Text>
            {activeTab === 'purchased' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/gift-cards')}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyButtonGradient}
                >
                  <Ionicons name="gift" size={20} color="#FFFFFF" />
                  <Text style={styles.emptyButtonText}>Buy a Gift Card</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          activeCards.map((card) => {
            const expiryStatus = getExpiryStatus(card.expiresAt);
            const usagePercent = ((card.originalValuePaisa - card.balancePaisa) / card.originalValuePaisa) * 100;
            
            return (
              <TouchableOpacity
                key={card.id}
                style={styles.cardContainer}
                onPress={() => handleCardPress(card)}
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
                      <View style={styles.cardSalonInfo}>
                        <Text style={styles.cardSalonName}>{card.salonName}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(card.status)}20` }]}>
                          <View style={[styles.statusDot, { backgroundColor: getStatusColor(card.status) }]} />
                          <Text style={[styles.statusText, { color: getStatusColor(card.status) }]}>
                            {getStatusLabel(card.status)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.qrButton}
                        onPress={() => handleShowQR(card)}
                      >
                        <Ionicons name="qr-code" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardCode}>{card.code}</Text>
                      <View style={styles.balanceRow}>
                        <View>
                          <Text style={styles.balanceTextLabel}>Balance</Text>
                          <Text style={styles.cardBalance}>
                            ₹{(card.balancePaisa / 100).toLocaleString()}
                          </Text>
                        </View>
                        <View style={styles.originalValueContainer}>
                          <Text style={styles.originalValueLabel}>Original</Text>
                          <Text style={styles.originalValue}>
                            ₹{(card.originalValuePaisa / 100).toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {(card.status === 'active' || card.status === 'partially_redeemed') && (
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${100 - usagePercent}%` }]} />
                          </View>
                          <Text style={styles.progressText}>
                            {Math.round(100 - usagePercent)}% remaining
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.expiryInfo}>
                        <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.expiryText}>
                          {card.expiresAt ? `Expires: ${formatDate(card.expiresAt)}` : 'No expiry'}
                        </Text>
                      </View>
                      {expiryStatus && (
                        <View style={[styles.expiryBadge, { backgroundColor: expiryStatus.color }]}>
                          <Text style={styles.expiryBadgeText}>{expiryStatus.text}</Text>
                        </View>
                      )}
                    </View>

                    {activeTab === 'purchased' && card.recipientName && (
                      <View style={styles.recipientInfo}>
                        <Ionicons name="person-outline" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.recipientText}>Sent to: {card.recipientName}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleShare(card)}
                    >
                      <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.cardActionText}>Share</Text>
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity
                      style={styles.cardActionButton}
                      onPress={() => handleCardPress(card)}
                    >
                      <Ionicons name="receipt-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.cardActionText}>Details</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}

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

            {selectedCard && (
              <View style={styles.qrModalContent}>
                <View style={styles.qrContainer}>
                  <Ionicons name="qr-code" size={120} color="#8B5CF6" />
                </View>
                <Text style={styles.qrCode}>{selectedCard.code}</Text>
                <Text style={styles.qrBalance}>
                  Balance: ₹{(selectedCard.balancePaisa / 100).toLocaleString()}
                </Text>
                <Text style={styles.qrInstructions}>
                  Show this code at the salon to redeem your gift card
                </Text>
              </View>
            )}
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
  headerGradient: {
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#F3E8FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardContainer: {
    marginBottom: 16,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardSalonInfo: {},
  cardSalonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
  qrButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {},
  cardCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceTextLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  cardBalance: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  originalValueContainer: {
    alignItems: 'flex-end',
  },
  originalValueLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  originalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'line-through',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expiryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  expiryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recipientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  recipientText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  actionDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '500',
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
});
