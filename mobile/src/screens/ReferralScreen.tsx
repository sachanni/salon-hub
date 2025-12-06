import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
  Clipboard,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { referralAPI } from '../services/api';

interface ReferralCode {
  id: string;
  code: string;
  referrerRewardPoints: number;
  refereeRewardPoints: number;
  refereeDiscountPercentage: string;
  usedCount: number;
  maxUses: number | null;
  isActive: number;
}

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  pointsEarned: number;
}

interface Referral {
  id: string;
  status: string;
  referrerPointsAwarded: number;
  refereePointsAwarded: number;
  createdAt: string;
  rewardedAt: string | null;
  referee: {
    name: string;
    phone: string;
    createdAt: string;
  };
}

export default function ReferralScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [codeRes, statsRes, historyRes] = await Promise.all([
        referralAPI.getMyCode(),
        referralAPI.getStats(),
        referralAPI.getHistory(),
      ]);

      if (codeRes.success) {
        setReferralCode(codeRes.referralCode);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
      if (historyRes.success) {
        setReferrals(historyRes.referrals);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCopyCode = () => {
    if (referralCode) {
      Clipboard.setString(referralCode.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    try {
      await Share.share({
        message: `Join me on SalonHub and get ${referralCode.refereeRewardPoints} bonus points on your first booking! Use my referral code: ${referralCode.code}\n\nDownload the app now!`,
        title: 'Join SalonHub',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleApplyCode = async () => {
    if (!applyCode.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    setApplying(true);
    try {
      const res = await referralAPI.applyCode(applyCode.trim());
      if (res.success) {
        Alert.alert(
          'Success!',
          `Referral code applied! You earned ${res.pointsEarned} bonus points.`,
          [{ text: 'OK', onPress: () => {
            setShowApplyModal(false);
            setApplyCode('');
            fetchData();
          }}]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid referral code');
    } finally {
      setApplying(false);
    }
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
      case 'rewarded': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'completed': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
        <Text style={styles.loadingText}>Loading referrals...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Refer & Earn</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderHeroSection = () => (
    <View style={styles.heroSection}>
      <View style={styles.heroIcon}>
        <Ionicons name="gift" size={48} color="#E91E63" />
      </View>
      <Text style={styles.heroTitle}>Invite Friends, Earn Rewards</Text>
      <Text style={styles.heroSubtitle}>
        Share your code with friends. When they book, you both earn points!
      </Text>
      
      <View style={styles.rewardsRow}>
        <View style={styles.rewardBox}>
          <Ionicons name="person-add" size={24} color="#10B981" />
          <Text style={styles.rewardValue}>{referralCode?.referrerRewardPoints || 200}</Text>
          <Text style={styles.rewardLabel}>Points for you</Text>
        </View>
        <View style={styles.rewardDivider} />
        <View style={styles.rewardBox}>
          <Ionicons name="person" size={24} color="#6366F1" />
          <Text style={styles.rewardValue}>{referralCode?.refereeRewardPoints || 100}</Text>
          <Text style={styles.rewardLabel}>Points for friend</Text>
        </View>
      </View>
    </View>
  );

  const renderCodeCard = () => (
    <View style={styles.codeCard}>
      <Text style={styles.codeLabel}>Your Referral Code</Text>
      <View style={styles.codeRow}>
        <Text style={styles.codeValue}>{referralCode?.code || '---'}</Text>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
          <Ionicons 
            name={copiedCode ? 'checkmark' : 'copy-outline'} 
            size={20} 
            color={copiedCode ? '#10B981' : '#6B7280'} 
          />
          <Text style={[styles.copyText, copiedCode && styles.copiedText]}>
            {copiedCode ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Ionicons name="share-social" size={20} color="#fff" />
        <Text style={styles.shareButtonText}>Share with Friends</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.sectionTitle}>Your Referral Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>Total Invites</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.successfulReferrals || 0}</Text>
          <Text style={styles.statLabel}>Successful</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.pendingReferrals || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.pointsValue]}>
            {stats?.pointsEarned?.toLocaleString() || 0}
          </Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
      </View>
    </View>
  );

  const renderHowItWorks = () => (
    <View style={styles.howItWorksCard}>
      <Text style={styles.sectionTitle}>How It Works</Text>
      <View style={styles.stepsContainer}>
        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: '#FCE7F3' }]}>
            <Text style={[styles.stepNumberText, { color: '#E91E63' }]}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Share Your Code</Text>
            <Text style={styles.stepDescription}>
              Send your unique referral code to friends via WhatsApp, SMS, or social media
            </Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: '#E0E7FF' }]}>
            <Text style={[styles.stepNumberText, { color: '#6366F1' }]}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Friend Signs Up</Text>
            <Text style={styles.stepDescription}>
              Your friend downloads the app and enters your code during signup
            </Text>
          </View>
        </View>
        
        <View style={styles.stepConnector} />
        
        <View style={styles.step}>
          <View style={[styles.stepNumber, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.stepNumberText, { color: '#10B981' }]}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Both Get Rewarded</Text>
            <Text style={styles.stepDescription}>
              When they complete their first booking, you both earn bonus points!
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderReferralHistory = () => (
    <View style={styles.historyCard}>
      <Text style={styles.sectionTitle}>Recent Referrals</Text>
      {referrals.length > 0 ? (
        referrals.map((referral) => (
          <View key={referral.id} style={styles.referralItem}>
            <View style={styles.referralAvatar}>
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
            <View style={styles.referralInfo}>
              <Text style={styles.referralName}>{referral.referee.name || 'Friend'}</Text>
              <Text style={styles.referralDate}>
                Joined {formatDate(referral.createdAt)}
              </Text>
            </View>
            <View style={styles.referralStatus}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(referral.status) + '20' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(referral.status) }
                ]}>
                  {referral.status.toUpperCase()}
                </Text>
              </View>
              {referral.referrerPointsAwarded > 0 && (
                <Text style={styles.pointsEarned}>
                  +{referral.referrerPointsAwarded} pts
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyHistory}>
          <Ionicons name="people-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyHistoryText}>No referrals yet</Text>
          <Text style={styles.emptyHistorySubtext}>
            Start sharing your code to earn rewards!
          </Text>
        </View>
      )}
    </View>
  );

  const renderApplyCodeSection = () => (
    <View style={styles.applyCodeCard}>
      <Text style={styles.applyCodeTitle}>Have a referral code?</Text>
      <Text style={styles.applyCodeSubtitle}>
        Enter a friend's code to get bonus points on signup
      </Text>
      <TouchableOpacity
        style={styles.applyCodeButton}
        onPress={() => setShowApplyModal(true)}
      >
        <Ionicons name="ticket-outline" size={20} color="#E91E63" />
        <Text style={styles.applyCodeButtonText}>Apply Referral Code</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeroSection()}
        {renderCodeCard()}
        {renderStatsCard()}
        {renderHowItWorks()}
        {renderReferralHistory()}
        {renderApplyCodeSection()}
      </ScrollView>

      {showApplyModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowApplyModal(false)}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Apply Referral Code</Text>
            <Text style={styles.modalSubtitle}>
              Enter a friend's referral code to earn bonus points
            </Text>
            
            <TextInput
              style={styles.codeInput}
              value={applyCode}
              onChangeText={setApplyCode}
              placeholder="Enter code (e.g., JOHN2024)"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              maxLength={20}
            />
            
            <TouchableOpacity
              style={[styles.applyButton, applying && styles.applyButtonDisabled]}
              onPress={handleApplyCode}
              disabled={applying}
            >
              {applying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.applyButtonText}>Apply Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  rewardBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  rewardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  rewardLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  rewardDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
  },
  codeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  codeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  codeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  copyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  copiedText: {
    color: '#10B981',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E91E63',
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  pointsValue: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  howItWorksCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  stepsContainer: {
    gap: 8,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 15,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  referralAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralInfo: {
    flex: 1,
    marginLeft: 12,
  },
  referralName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  referralDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  referralStatus: {
    alignItems: 'flex-end',
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
  pointsEarned: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  applyCodeCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  applyCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  applyCodeSubtitle: {
    fontSize: 14,
    color: '#15803D',
    marginBottom: 16,
    textAlign: 'center',
  },
  applyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  applyCodeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E91E63',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  codeInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
  },
  applyButton: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.7,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});