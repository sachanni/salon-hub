import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MembershipPlan } from '../types/navigation';
import { membershipAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface MembershipPlansCardProps {
  plans: MembershipPlan[];
  salonId: string;
  salonName: string;
  loading?: boolean;
  onPurchaseSuccess?: () => void;
}

const planTypeLabels: Record<string, string> = {
  discount: 'Discount Plan',
  credit: 'Beauty Bank',
  packaged: 'Service Package',
};

const planTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  discount: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  credit: { bg: '#E9D5FF', text: '#6B21A8', border: '#C4B5FD' },
  packaged: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
};

const formatCurrency = (paisa: number) => {
  return `₹${(paisa / 100).toLocaleString('en-IN')}`;
};

export default function MembershipPlansCard({
  plans,
  salonId,
  salonName,
  loading,
  onPurchaseSuccess,
}: MembershipPlansCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading membership plans...</Text>
      </View>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="card-outline" size={48} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Memberships Available</Text>
        <Text style={styles.emptyText}>
          This salon doesn't have any membership plans at the moment.
        </Text>
      </View>
    );
  }

  const handleSelectPlan = (plan: MembershipPlan) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to purchase a membership.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/onboarding/mobile-verification') },
        ]
      );
      return;
    }
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    
    setPurchasing(true);
    try {
      const response = await membershipAPI.purchaseMembership(selectedPlan.id);
      if (response.success) {
        setShowConfirmModal(false);
        setSelectedPlan(null);
        Alert.alert(
          'Membership Activated!',
          'Welcome! Your membership benefits are now active.',
          [{ text: 'OK' }]
        );
        onPurchaseSuccess?.();
      } else {
        Alert.alert('Purchase Failed', response.error || 'Could not complete your purchase.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'discount':
        return 'pricetag';
      case 'credit':
        return 'wallet';
      case 'packaged':
        return 'gift';
      default:
        return 'card';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="ribbon" size={24} color="#F59E0B" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Membership Plans</Text>
          <Text style={styles.headerSubtitle}>Join for exclusive benefits</Text>
        </View>
      </View>

      {plans.map((plan) => {
        const colors = planTypeColors[plan.planType] || planTypeColors.discount;
        return (
          <View key={plan.id} style={styles.planCard}>
            <View style={styles.planGradient} />
            
            <View style={styles.planHeader}>
              <View style={[styles.planBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <Ionicons name={getPlanIcon(plan.planType) as any} size={12} color={colors.text} />
                <Text style={[styles.planBadgeText, { color: colors.text }]}>
                  {planTypeLabels[plan.planType]}
                </Text>
              </View>
            </View>

            <Text style={styles.planName}>{plan.name}</Text>
            {plan.description && (
              <Text style={styles.planDescription}>{plan.description}</Text>
            )}

            <View style={styles.planPrice}>
              <Text style={styles.priceAmount}>{formatCurrency(plan.priceInPaisa)}</Text>
              <Text style={styles.priceDuration}>
                / {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.benefitsList}>
              {plan.planType === 'discount' && plan.discountPercentage && (
                <View style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.benefitText}>
                    {plan.discountPercentage}% off all services
                  </Text>
                </View>
              )}

              {plan.planType === 'credit' && plan.creditAmountInPaisa && (
                <>
                  <View style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.benefitText}>
                      {formatCurrency(plan.creditAmountInPaisa)}/month credits
                    </Text>
                  </View>
                  {plan.bonusPercentage && plan.bonusPercentage > 0 && (
                    <View style={styles.benefitRow}>
                      <Ionicons name="gift" size={16} color="#8B5CF6" />
                      <Text style={styles.benefitText}>
                        +{plan.bonusPercentage}% bonus credits
                      </Text>
                    </View>
                  )}
                </>
              )}

              {plan.planType === 'packaged' && plan.includedServices && (
                <>
                  {plan.includedServices.slice(0, 3).map((svc) => (
                    <View key={svc.id} style={styles.benefitRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.benefitText}>
                        {svc.serviceName} ({svc.isUnlimited ? 'Unlimited' : `${svc.quantityPerMonth}/mo`})
                      </Text>
                    </View>
                  ))}
                  {plan.includedServices.length > 3 && (
                    <Text style={styles.moreServices}>
                      +{plan.includedServices.length - 3} more services
                    </Text>
                  )}
                </>
              )}

              {plan.priorityBooking === 1 && (
                <View style={styles.benefitRow}>
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.benefitText}>Priority booking access</Text>
                </View>
              )}

              <View style={styles.benefitRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.benefitTextMuted}>
                  {plan.durationMonths}-month validity
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => handleSelectPlan(plan)}
            >
              <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Modal
        visible={showConfirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="ribbon" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.modalTitle}>Confirm Purchase</Text>
              <Text style={styles.modalSubtitle}>
                You're about to join {selectedPlan?.name} at {salonName}
              </Text>
            </View>

            {selectedPlan && (
              <View style={styles.modalDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Plan</Text>
                  <Text style={styles.detailValue}>{selectedPlan.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{selectedPlan.durationMonths} months</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: planTypeColors[selectedPlan.planType]?.bg }
                  ]}>
                    <Text style={[
                      styles.typeBadgeText,
                      { color: planTypeColors[selectedPlan.planType]?.text }
                    ]}>
                      {planTypeLabels[selectedPlan.planType]}
                    </Text>
                  </View>
                </View>
                <View style={styles.dividerModal} />
                <View style={styles.detailRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(selectedPlan.priceInPaisa)}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.modalNote}>
              Your membership will be active immediately after purchase. Benefits can be used for bookings at this salon.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, purchasing && styles.confirmButtonDisabled]}
                onPress={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
                )}
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
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  planGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#8B5CF6',
  },
  planHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  priceDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  benefitsList: {
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontWeight: '500',
  },
  benefitTextMuted: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  moreServices: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 24,
    fontStyle: 'italic',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  modalDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dividerModal: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  modalNote: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
