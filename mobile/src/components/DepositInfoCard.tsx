import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { DepositCheckResult } from '../services/api';

interface DepositInfoCardProps {
  depositInfo: DepositCheckResult;
  onViewPolicy?: () => void;
}

export const DepositInfoCard: React.FC<DepositInfoCardProps> = ({
  depositInfo,
  onViewPolicy,
}) => {
  const formatPrice = (priceInPaisa: number) => {
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
  };

  if (!depositInfo.requiresDeposit) {
    return null;
  }

  const depositPercentage = depositInfo.totalServicePaisa > 0
    ? Math.round((depositInfo.totalDepositPaisa / depositInfo.totalServicePaisa) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FEF3C7', '#FDE68A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={24} color="#D97706" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Deposit Required</Text>
            <Text style={styles.subtitle}>
              {depositInfo.forceFullPayment
                ? 'Full payment required for this booking'
                : `Secure your booking with a ${depositPercentage}% deposit`}
            </Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Deposit Amount</Text>
            <Text style={styles.depositAmount}>{formatPrice(depositInfo.totalDepositPaisa)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Balance at Salon</Text>
            <Text style={styles.balanceAmount}>
              {formatPrice((depositInfo.balanceDuePaisa ?? 0) || (depositInfo.totalServicePaisa - depositInfo.totalDepositPaisa))}
            </Text>
          </View>
        </View>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.benefitText}>Guaranteed appointment slot</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.benefitText}>Refundable with timely cancellation</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.benefitText}>Applied to your final bill</Text>
          </View>
        </View>

        {depositInfo.cancellationPolicy && (
          <TouchableOpacity style={styles.policyButton} onPress={onViewPolicy}>
            <Ionicons name="information-circle-outline" size={18} color="#D97706" />
            <Text style={styles.policyButtonText}>View Cancellation Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#D97706" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
  },
  amountSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  amountLabel: {
    fontSize: 14,
    color: '#78350F',
  },
  depositAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#78350F',
  },
  benefitsList: {
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#78350F',
    marginLeft: 8,
  },
  policyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 10,
    gap: 6,
  },
  policyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
});

export default DepositInfoCard;
