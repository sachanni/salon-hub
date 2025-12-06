import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { loyaltyAPI } from '../services/api';

interface LoyaltyTier {
  id: string;
  name: string;
  displayName: string;
  minPoints: number;
  maxPoints: number | null;
  pointsMultiplier: string;
  discountPercentage: string;
  benefits: string[];
  iconUrl: string | null;
  colorHex: string;
  sortOrder: number;
}

interface UserPointsData {
  current: number;
  lifetime: number;
  lastEarnedAt: string | null;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  pointsCost: number;
  rewardType: string;
  rewardValue: number | null;
  rewardPercentage: string | null;
  category: string;
  imageUrl: string | null;
  validityDays: number;
  canAfford: boolean;
  tierEligible: boolean;
  isAvailable: boolean;
  quantityAvailable: number | null;
}

interface PointTransaction {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  source: string;
  description: string;
  createdAt: string;
}

interface RedeemedReward {
  id: string;
  rewardId: string;
  pointsSpent: number;
  redemptionCode: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  reward: Reward;
}

const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

const TIER_ICONS: Record<string, string> = {
  bronze: 'medal-outline',
  silver: 'medal',
  gold: 'trophy-outline',
  platinum: 'trophy',
};

export default function RewardsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'rewards' | 'history' | 'my-rewards'>('rewards');
  
  const [points, setPoints] = useState<UserPointsData | null>(null);
  const [currentTier, setCurrentTier] = useState<LoyaltyTier | null>(null);
  const [nextTier, setNextTier] = useState<LoyaltyTier | null>(null);
  const [pointsToNextTier, setPointsToNextTier] = useState(0);
  const [allTiers, setAllTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [showTiersModal, setShowTiersModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pointsRes, rewardsRes] = await Promise.all([
        loyaltyAPI.getPoints(),
        loyaltyAPI.getRewards(),
      ]);

      if (pointsRes.success) {
        setPoints(pointsRes.points);
        setCurrentTier(pointsRes.tier);
        setNextTier(pointsRes.nextTier);
        setPointsToNextTier(pointsRes.pointsToNextTier);
        setAllTiers(pointsRes.allTiers || []);
      }

      if (rewardsRes.success) {
        setRewards(rewardsRes.rewards);
      }
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await loyaltyAPI.getTransactions({ limit: 50 });
      if (res.success) {
        setTransactions(res.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);

  const fetchMyRewards = useCallback(async () => {
    try {
      const res = await loyaltyAPI.getMyRewards({ limit: 50 });
      if (res.success) {
        setRedeemedRewards(res.rewards);
      }
    } catch (error) {
      console.error('Error fetching my rewards:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions();
    } else if (activeTab === 'my-rewards') {
      fetchMyRewards();
    }
  }, [activeTab, fetchTransactions, fetchMyRewards]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    if (activeTab === 'history') fetchTransactions();
    if (activeTab === 'my-rewards') fetchMyRewards();
  }, [fetchData, activeTab, fetchTransactions, fetchMyRewards]);

  const handleRedeemReward = async () => {
    if (!selectedReward) return;

    setRedeeming(true);
    try {
      const res = await loyaltyAPI.redeemReward(selectedReward.id);
      if (res.success) {
        Alert.alert(
          'Reward Redeemed!',
          `Your redemption code is: ${res.redemption.redemptionCode}\n\nShow this code at the salon to claim your reward.`,
          [{ text: 'OK', onPress: () => {
            setRedeemModalVisible(false);
            setSelectedReward(null);
            fetchData();
            fetchMyRewards();
          }}]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  const getTierProgress = () => {
    if (!currentTier || !nextTier || !points) return 100;
    const currentMin = currentTier.minPoints;
    const nextMin = nextTier.minPoints;
    const progress = ((points.lifetime - currentMin) / (nextMin - currentMin)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Rewards</Text>
      <TouchableOpacity onPress={() => setShowTiersModal(true)} style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  const renderPointsCard = () => (
    <View style={[styles.pointsCard, { backgroundColor: TIER_COLORS[currentTier?.name || 'bronze'] + '20' }]}>
      <View style={styles.pointsCardHeader}>
        <View style={styles.tierBadge}>
          <Ionicons 
            name={(TIER_ICONS[currentTier?.name || 'bronze'] as any)} 
            size={28} 
            color={TIER_COLORS[currentTier?.name || 'bronze']} 
          />
          <Text style={[styles.tierName, { color: TIER_COLORS[currentTier?.name || 'bronze'] }]}>
            {currentTier?.displayName || 'Bronze'}
          </Text>
        </View>
        <View style={styles.pointsDisplay}>
          <Text style={styles.pointsValue}>{points?.current?.toLocaleString() || 0}</Text>
          <Text style={styles.pointsLabel}>Points Available</Text>
        </View>
      </View>

      {nextTier && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {pointsToNextTier.toLocaleString()} points to {nextTier.displayName}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${getTierProgress()}%`, backgroundColor: TIER_COLORS[currentTier?.name || 'bronze'] }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{currentTier?.displayName}</Text>
            <Text style={styles.progressLabel}>{nextTier.displayName}</Text>
          </View>
        </View>
      )}

      {currentTier && parseFloat(currentTier.discountPercentage) > 0 && (
        <View style={styles.benefitChip}>
          <Ionicons name="pricetag" size={16} color="#10B981" />
          <Text style={styles.benefitText}>
            {currentTier.discountPercentage}% discount on all bookings
          </Text>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
        onPress={() => setActiveTab('rewards')}
      >
        <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
          Rewards
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          History
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'my-rewards' && styles.activeTab]}
        onPress={() => setActiveTab('my-rewards')}
      >
        <Text style={[styles.tabText, activeTab === 'my-rewards' && styles.activeTabText]}>
          My Rewards
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRewardCard = (reward: Reward) => (
    <TouchableOpacity
      key={reward.id}
      style={[styles.rewardCard, !reward.isAvailable && styles.rewardCardDisabled]}
      onPress={() => {
        if (reward.isAvailable) {
          setSelectedReward(reward);
          setRedeemModalVisible(true);
        }
      }}
      disabled={!reward.isAvailable}
    >
      <View style={styles.rewardImageContainer}>
        {reward.imageUrl ? (
          <Image source={{ uri: reward.imageUrl }} style={styles.rewardImage} />
        ) : (
          <View style={styles.rewardImagePlaceholder}>
            <Ionicons name="gift" size={32} color="#E91E63" />
          </View>
        )}
        {reward.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{reward.category}</Text>
          </View>
        )}
      </View>
      <View style={styles.rewardContent}>
        <Text style={styles.rewardName} numberOfLines={2}>{reward.name}</Text>
        <Text style={styles.rewardDescription} numberOfLines={2}>
          {reward.shortDescription || reward.description}
        </Text>
        <View style={styles.rewardFooter}>
          <View style={styles.pointsCost}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.pointsCostText}>{reward.pointsCost.toLocaleString()}</Text>
          </View>
          {!reward.canAfford && (
            <Text style={styles.notEnoughPoints}>Need more points</Text>
          )}
          {reward.quantityAvailable !== null && reward.quantityAvailable <= 10 && (
            <Text style={styles.limitedQuantity}>Only {reward.quantityAvailable} left</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTransactionItem = (transaction: PointTransaction) => (
    <View key={transaction.id} style={styles.transactionItem}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: transaction.points > 0 ? '#10B98120' : '#EF444420' }
      ]}>
        <Ionicons 
          name={transaction.points > 0 ? 'add-circle' : 'remove-circle'} 
          size={24} 
          color={transaction.points > 0 ? '#10B981' : '#EF4444'} 
        />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription}>{transaction.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
      </View>
      <Text style={[
        styles.transactionPoints,
        { color: transaction.points > 0 ? '#10B981' : '#EF4444' }
      ]}>
        {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
      </Text>
    </View>
  );

  const renderRedeemedRewardItem = (item: RedeemedReward) => (
    <View key={item.id} style={styles.redeemedCard}>
      <View style={styles.redeemedHeader}>
        <Text style={styles.redeemedName}>{item.reward.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'active' ? '#10B98120' : '#6B728020' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'active' ? '#10B981' : '#6B7280' }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Redemption Code</Text>
        <Text style={styles.codeValue}>{item.redemptionCode}</Text>
      </View>
      <View style={styles.redeemedFooter}>
        <Text style={styles.redeemedDate}>
          Expires: {formatDate(item.expiresAt)}
        </Text>
        <Text style={styles.redeemedPoints}>
          -{item.pointsSpent.toLocaleString()} pts
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'rewards':
        return (
          <View style={styles.rewardsGrid}>
            {rewards.length > 0 ? (
              rewards.map(renderRewardCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No rewards available</Text>
                <Text style={styles.emptySubtext}>Check back later for new rewards</Text>
              </View>
            )}
          </View>
        );
      case 'history':
        return (
          <View style={styles.transactionsList}>
            {transactions.length > 0 ? (
              transactions.map(renderTransactionItem)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No transactions yet</Text>
                <Text style={styles.emptySubtext}>Earn points by booking services</Text>
              </View>
            )}
          </View>
        );
      case 'my-rewards':
        return (
          <View style={styles.redeemedList}>
            {redeemedRewards.length > 0 ? (
              redeemedRewards.map(renderRedeemedRewardItem)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="ribbon-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyText}>No redeemed rewards</Text>
                <Text style={styles.emptySubtext}>Redeem your points for exciting rewards</Text>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderPointsCard()}
        {renderTabs()}
        {renderContent()}
      </ScrollView>

      <Modal
        visible={redeemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRedeemModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setRedeemModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            {selectedReward && (
              <>
                <View style={styles.modalHeader}>
                  <Ionicons name="gift" size={48} color="#E91E63" />
                  <Text style={styles.modalTitle}>Redeem Reward</Text>
                </View>
                
                <Text style={styles.modalRewardName}>{selectedReward.name}</Text>
                <Text style={styles.modalRewardDescription}>{selectedReward.description}</Text>
                
                <View style={styles.modalPointsRow}>
                  <Text style={styles.modalPointsLabel}>Points Required</Text>
                  <Text style={styles.modalPointsValue}>
                    {selectedReward.pointsCost.toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.modalPointsRow}>
                  <Text style={styles.modalPointsLabel}>Your Balance</Text>
                  <Text style={styles.modalPointsValue}>
                    {points?.current?.toLocaleString() || 0}
                  </Text>
                </View>
                
                <View style={[styles.modalPointsRow, styles.modalPointsTotal]}>
                  <Text style={styles.modalPointsLabel}>After Redemption</Text>
                  <Text style={styles.modalPointsValue}>
                    {((points?.current || 0) - selectedReward.pointsCost).toLocaleString()}
                  </Text>
                </View>
                
                <Text style={styles.modalValidity}>
                  Valid for {selectedReward.validityDays} days after redemption
                </Text>
                
                <TouchableOpacity
                  style={styles.redeemButton}
                  onPress={handleRedeemReward}
                  disabled={redeeming}
                >
                  {redeeming ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.redeemButtonText}>Confirm Redemption</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showTiersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTiersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tiersModalContent}>
            <View style={styles.tiersModalHeader}>
              <Text style={styles.tiersModalTitle}>Loyalty Tiers</Text>
              <TouchableOpacity onPress={() => setShowTiersModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.tiersList}>
              {allTiers.map((tier) => (
                <View
                  key={tier.id}
                  style={[
                    styles.tierCard,
                    currentTier?.id === tier.id && styles.currentTierCard,
                    { borderLeftColor: TIER_COLORS[tier.name] || '#CD7F32' }
                  ]}
                >
                  <View style={styles.tierHeader}>
                    <Ionicons 
                      name={(TIER_ICONS[tier.name] as any) || 'medal-outline'} 
                      size={24} 
                      color={TIER_COLORS[tier.name] || '#CD7F32'} 
                    />
                    <Text style={[styles.tierDisplayName, { color: TIER_COLORS[tier.name] || '#CD7F32' }]}>
                      {tier.displayName}
                    </Text>
                    {currentTier?.id === tier.id && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tierRequirement}>
                    {tier.minPoints.toLocaleString()}+ lifetime points
                  </Text>
                  <View style={styles.tierBenefits}>
                    <View style={styles.benefitRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.benefitItemText}>
                        {tier.pointsMultiplier}x points on bookings
                      </Text>
                    </View>
                    {parseFloat(tier.discountPercentage) > 0 && (
                      <View style={styles.benefitRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.benefitItemText}>
                          {tier.discountPercentage}% discount on services
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  pointsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700',
  },
  pointsDisplay: {
    alignItems: 'flex-end',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#10B98110',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  benefitText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#E91E63',
    fontWeight: '600',
  },
  rewardsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardImageContainer: {
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  rewardImage: {
    width: '100%',
    height: '100%',
  },
  rewardImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  rewardContent: {
    padding: 12,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  rewardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsCostText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  notEnoughPoints: {
    fontSize: 12,
    color: '#EF4444',
  },
  limitedQuantity: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  transactionsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionContent: {
    flex: 1,
    marginLeft: 12,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionPoints: {
    fontSize: 16,
    fontWeight: '700',
  },
  redeemedList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  redeemedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  redeemedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  redeemedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  codeContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 2,
  },
  redeemedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redeemedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  redeemedPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  modalRewardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalRewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalPointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalPointsTotal: {
    borderBottomWidth: 0,
    marginBottom: 16,
  },
  modalPointsLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  modalPointsValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalValidity: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  redeemButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tiersModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  tiersModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tiersModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  tiersList: {
    flex: 1,
  },
  tierCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  currentTierCard: {
    backgroundColor: '#FDF2F8',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tierDisplayName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  tierRequirement: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  tierBenefits: {
    gap: 6,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitItemText: {
    fontSize: 13,
    color: '#374151',
  },
});