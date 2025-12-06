import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsAPI } from '../../services/api';

const CANCELLATION_REASONS = [
  { id: 'schedule', label: 'Schedule conflict', icon: 'calendar-outline' },
  { id: 'emergency', label: 'Personal emergency', icon: 'alert-circle-outline' },
  { id: 'health', label: 'Health reasons', icon: 'medkit-outline' },
  { id: 'travel', label: 'Travel issues', icon: 'airplane-outline' },
  { id: 'financial', label: 'Financial reasons', icon: 'wallet-outline' },
  { id: 'other', label: 'Other reason', icon: 'ellipsis-horizontal-outline' },
];

export const EventCancelScreen = () => {
  const router = useRouter();
  const { id, eventId } = useLocalSearchParams();
  const registrationId = typeof id === 'string' ? id : id?.[0];
  
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingRefund, setFetchingRefund] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const [ticketDetails, setTicketDetails] = useState({
    eventTitle: 'Bridal Makeup Masterclass',
    eventDate: 'December 15, 2024',
    ticketCode: 'TKT-BRM-15789',
    amountPaid: 960,
    refundAmount: 768,
    refundPercentage: 80,
    cancellationDeadline: 'December 13, 2024',
  });

  useEffect(() => {
    const fetchRefundEstimate = async () => {
      if (!registrationId) {
        setFetchingRefund(false);
        return;
      }

      try {
        const response = await eventsAPI.getRefundEstimate(registrationId);
        if (response) {
          setTicketDetails(prev => ({
            eventTitle: response.eventTitle || prev.eventTitle,
            eventDate: response.eventDate || prev.eventDate,
            ticketCode: response.ticketCode || prev.ticketCode,
            amountPaid: response.amountPaid ?? prev.amountPaid,
            refundAmount: response.refundAmount ?? prev.refundAmount,
            refundPercentage: response.refundPercentage ?? prev.refundPercentage,
            cancellationDeadline: response.cancellationDeadline || prev.cancellationDeadline,
          }));
        }
      } catch (err) {
        console.error('Error fetching refund estimate:', err);
      } finally {
        setFetchingRefund(false);
      }
    };

    fetchRefundEstimate();
  }, [registrationId]);

  const handleBack = () => {
    router.back();
  };

  const handleConfirmCancel = () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a reason for cancellation');
      return;
    }

    if (selectedReason === 'other' && !otherReason.trim()) {
      Alert.alert('Provide Details', 'Please provide details for your cancellation');
      return;
    }

    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to cancel your registration? You will receive a refund of ₹${ticketDetails.refundAmount}.`,
      [
        { text: 'Keep Ticket', style: 'cancel' },
        { 
          text: 'Cancel Registration', 
          style: 'destructive',
          onPress: processCancellation,
        },
      ]
    );
  };

  const processCancellation = async () => {
    if (!registrationId) {
      Alert.alert('Error', 'Registration not found');
      return;
    }

    setLoading(true);
    
    try {
      const reasonText = selectedReason === 'other' ? otherReason : selectedReason;
      const response = await eventsAPI.cancelRegistration(registrationId, {
        reason: reasonText,
        reasonDetails: selectedReason === 'other' ? otherReason : undefined,
      });
      
      if (response.success) {
        if (response.refundDetails) {
          setTicketDetails(prev => ({
            ...prev,
            refundAmount: response.refundDetails.refundAmount ?? prev.refundAmount,
            refundPercentage: response.refundDetails.refundPercentage ?? prev.refundPercentage,
          }));
        } else if (response.refundAmount !== undefined || response.refundPercentage !== undefined) {
          setTicketDetails(prev => ({
            ...prev,
            refundAmount: response.refundAmount ?? prev.refundAmount,
            refundPercentage: response.refundPercentage ?? prev.refundPercentage,
          }));
        }
        setConfirmed(true);
      } else {
        Alert.alert('Cancellation Failed', response.error || 'Unable to cancel registration');
      }
    } catch (err: any) {
      console.error('Cancellation error:', err);
      Alert.alert('Error', 'Unable to cancel registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    router.replace('/(tabs)/events');
  };

  if (confirmed) {
    return (
      <View style={styles.container}>
        <View style={styles.confirmationContainer}>
          <View style={styles.confirmationIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          <Text style={styles.confirmationTitle}>Registration Cancelled</Text>
          <Text style={styles.confirmationSubtitle}>
            Your ticket has been cancelled successfully
          </Text>

          <View style={styles.refundCard}>
            <View style={styles.refundHeader}>
              <Ionicons name="wallet-outline" size={24} color="#8B5CF6" />
              <Text style={styles.refundTitle}>Refund Details</Text>
            </View>
            <View style={styles.refundDetails}>
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Refund Amount</Text>
                <Text style={styles.refundValue}>₹{ticketDetails.refundAmount}</Text>
              </View>
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Processing Time</Text>
                <Text style={styles.refundValue}>5-7 business days</Text>
              </View>
              <View style={styles.refundRow}>
                <Text style={styles.refundLabel}>Refund Method</Text>
                <Text style={styles.refundValue}>Original payment method</Text>
              </View>
            </View>
          </View>

          <Text style={styles.noteText}>
            You will receive an email confirmation shortly with complete refund details.
          </Text>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cancel Registration</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Cancellation Policy</Text>
            <Text style={styles.warningText}>
              You can cancel until {ticketDetails.cancellationDeadline} for an {ticketDetails.refundPercentage}% refund.
            </Text>
          </View>
        </View>

        {/* Ticket Summary */}
        <View style={styles.ticketSummary}>
          <Text style={styles.sectionTitle}>Your Ticket</Text>
          <View style={styles.ticketCard}>
            <Text style={styles.ticketEventTitle}>{ticketDetails.eventTitle}</Text>
            <Text style={styles.ticketEventDate}>{ticketDetails.eventDate}</Text>
            <View style={styles.ticketCodeRow}>
              <Text style={styles.ticketCodeLabel}>Ticket Code:</Text>
              <Text style={styles.ticketCodeValue}>{ticketDetails.ticketCode}</Text>
            </View>
          </View>
        </View>

        {/* Refund Estimate */}
        <View style={styles.refundEstimate}>
          <Text style={styles.sectionTitle}>Refund Estimate</Text>
          <View style={styles.refundEstimateCard}>
            <View style={styles.refundEstimateRow}>
              <Text style={styles.refundEstimateLabel}>Amount Paid</Text>
              <Text style={styles.refundEstimateValue}>₹{ticketDetails.amountPaid}</Text>
            </View>
            <View style={styles.refundEstimateRow}>
              <Text style={styles.refundEstimateLabel}>Cancellation Fee (20%)</Text>
              <Text style={styles.refundEstimateFee}>-₹{ticketDetails.amountPaid - ticketDetails.refundAmount}</Text>
            </View>
            <View style={styles.refundDivider} />
            <View style={styles.refundEstimateRow}>
              <Text style={styles.refundEstimateTotal}>You will receive</Text>
              <Text style={styles.refundEstimateTotalValue}>₹{ticketDetails.refundAmount}</Text>
            </View>
          </View>
        </View>

        {/* Cancellation Reason */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>Reason for Cancellation</Text>
          <Text style={styles.sectionSubtitle}>Help us improve by sharing your reason</Text>
          
          <View style={styles.reasonGrid}>
            {CANCELLATION_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.id && styles.reasonCardSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <Ionicons 
                  name={reason.icon as any} 
                  size={24} 
                  color={selectedReason === reason.id ? '#8B5CF6' : '#6B7280'} 
                />
                <Text style={[
                  styles.reasonLabel,
                  selectedReason === reason.id && styles.reasonLabelSelected,
                ]}>
                  {reason.label}
                </Text>
                {selectedReason === reason.id && (
                  <View style={styles.reasonCheck}>
                    <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {selectedReason === 'other' && (
            <TextInput
              style={styles.otherReasonInput}
              placeholder="Please provide more details..."
              placeholderTextColor="#9CA3AF"
              value={otherReason}
              onChangeText={setOtherReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.keepButton} onPress={handleBack}>
          <Text style={styles.keepButtonText}>Keep My Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.cancelButtonDisabled]}
          onPress={handleConfirmCancel}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.cancelButtonText}>Cancel Registration</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
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
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
  ticketSummary: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 12,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketEventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  ticketEventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  ticketCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketCodeLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  ticketCodeValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    fontFamily: 'monospace',
  },
  refundEstimate: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  refundEstimateCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  refundEstimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  refundEstimateLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  refundEstimateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  refundEstimateFee: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  refundDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  refundEstimateTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  refundEstimateTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  reasonSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  reasonGrid: {
    gap: 12,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  reasonCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#EDE9FE',
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  reasonLabelSelected: {
    color: '#8B5CF6',
  },
  reasonCheck: {
    marginLeft: 'auto',
  },
  otherReasonInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    fontSize: 15,
    color: '#111827',
    height: 100,
  },
  bottomPadding: {
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  keepButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  keepButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  confirmationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmationIcon: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmationSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  refundCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  refundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  refundTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  refundDetails: {},
  refundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  refundLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  refundValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  noteText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
