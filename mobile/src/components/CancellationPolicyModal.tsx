import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CancellationPolicy {
  windowHours: number;
  withinWindowAction: string;
  partialForfeitPercentage?: number;
  noShowAction: string;
  noShowGraceMinutes?: number;
  policyText?: string;
}

interface CancellationPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  policy: CancellationPolicy | null;
  salonName?: string;
}

export const CancellationPolicyModal: React.FC<CancellationPolicyModalProps> = ({
  visible,
  onClose,
  policy,
  salonName,
}) => {
  if (!policy) return null;

  const getActionText = (action: string, percentage?: number) => {
    switch (action) {
      case 'forfeit_full':
        return 'Full deposit will be forfeited';
      case 'forfeit_partial':
        return `${percentage || 50}% of deposit will be forfeited`;
      case 'no_penalty':
        return 'No penalty - full refund';
      case 'charge_full_service':
        return 'Full service amount will be charged';
      default:
        return 'Standard policy applies';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="document-text" size={24} color="#8B5CF6" />
              <Text style={styles.title}>Cancellation Policy</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {salonName && (
            <Text style={styles.salonName}>{salonName}</Text>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.sectionTitle}>Cancellation Window</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoValue}>{policy.windowHours} hours</Text>
                <Text style={styles.infoDescription}>
                  Cancel at least {policy.windowHours} hours before your appointment to avoid any charges
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="alert-circle-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.sectionTitle}>Late Cancellation</Text>
              </View>
              <View style={[styles.infoCard, styles.warningCard]}>
                <Text style={styles.warningText}>
                  {getActionText(policy.withinWindowAction, policy.partialForfeitPercentage)}
                </Text>
                <Text style={styles.infoDescription}>
                  If you cancel within {policy.windowHours} hours of your appointment
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                </View>
                <Text style={styles.sectionTitle}>No-Show Policy</Text>
              </View>
              <View style={[styles.infoCard, styles.dangerCard]}>
                <Text style={styles.dangerText}>
                  {getActionText(policy.noShowAction)}
                </Text>
                {policy.noShowGraceMinutes && (
                  <Text style={styles.infoDescription}>
                    You have a {policy.noShowGraceMinutes}-minute grace period after your appointment time
                  </Text>
                )}
              </View>
            </View>

            {policy.policyText && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="information-circle-outline" size={20} color="#4F46E5" />
                  </View>
                  <Text style={styles.sectionTitle}>Additional Terms</Text>
                </View>
                <View style={styles.policyTextCard}>
                  <Text style={styles.policyText}>{policy.policyText}</Text>
                </View>
              </View>
            )}

            <View style={styles.tipSection}>
              <Ionicons name="bulb-outline" size={20} color="#10B981" />
              <Text style={styles.tipText}>
                Tip: Set a reminder to cancel early if your plans change. Your deposit is fully refundable when you cancel on time!
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.acknowledgeButton} onPress={onClose}>
              <Text style={styles.acknowledgeButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  salonName: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 8,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  policyTextCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  policyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  tipSection: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  acknowledgeButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CancellationPolicyModal;
