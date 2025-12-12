import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lateArrivalAPI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DelayOption {
  value: number;
  label: string;
}

interface LateArrivalModalProps {
  bookingId: string;
  bookingTime: string;
  salonName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'select' | 'confirm' | 'success' | 'error';

export default function LateArrivalModal({
  bookingId,
  bookingTime,
  salonName,
  isOpen,
  onClose,
  onSuccess,
}: LateArrivalModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedDelay, setSelectedDelay] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<DelayOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(true);
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      resetState();
    }
  }, [isOpen, bookingId]);

  const resetState = () => {
    setStep('select');
    setSelectedDelay(null);
    setMessage('');
    setError(null);
    setIsLoading(true);
    setLoadFailed(false);
    setCanSend(true);
    setEligibilityReason(null);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setLoadFailed(false);
    
    try {
      const [optionsRes, eligibilityRes] = await Promise.all([
        lateArrivalAPI.getDelayOptions(),
        lateArrivalAPI.canNotify(bookingId),
      ]);

      if (!optionsRes.success || !optionsRes.options?.length) {
        setLoadFailed(true);
        setError(optionsRes.error || 'Failed to load options');
        return;
      }
      
      setOptions(optionsRes.options);

      if (eligibilityRes.success === false) {
        setLoadFailed(true);
        setError(eligibilityRes.error || 'Failed to check eligibility');
      } else if (!eligibilityRes.canSend) {
        setCanSend(false);
        setEligibilityReason(eligibilityRes.reason || 'Cannot send notification for this booking');
      } else {
        setCanSend(true);
        setEligibilityReason(null);
      }
    } catch (err) {
      console.error('Error loading late arrival data:', err);
      setLoadFailed(true);
      setError('Failed to load options. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedDelay) {
      setError('Please select how late you will be');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await lateArrivalAPI.sendNotification({
        bookingId,
        estimatedDelayMinutes: selectedDelay,
        customerMessage: message.trim() || undefined,
      });

      if (result.success) {
        setStep('success');
      } else {
        setError(result.error || 'Failed to send notification');
        setStep('error');
      }
    } catch (err: any) {
      console.error('Error sending late notification:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      onSuccess?.();
    }
    onClose();
  };

  const formatTimeWithDelay = (time: string, delayMinutes: number): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + delayMinutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    const period = newHours >= 12 ? 'PM' : 'AM';
    const displayHours = newHours % 12 || 12;
    return `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (loadFailed) {
      return (
        <View style={styles.centerContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="wifi-outline" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error || 'Failed to load. Please try again.'}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!canSend) {
      return (
        <View style={styles.centerContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Cannot Send Notification</Text>
          <Text style={styles.errorMessage}>{eligibilityReason}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'success') {
      return (
        <View style={styles.centerContent}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Notification Sent!</Text>
          <Text style={styles.successMessage}>
            {salonName} has been notified that you'll arrive around{' '}
            {selectedDelay ? formatTimeWithDelay(bookingTime, selectedDelay) : ''}.
          </Text>
          <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'error') {
      return (
        <View style={styles.centerContent}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="close-circle" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Failed to Send</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                setStep('select');
                setError(null);
              }}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.appointmentInfo}>
          <Ionicons name="time-outline" size={18} color="#6B7280" />
          <Text style={styles.appointmentText}>
            Original appointment: <Text style={styles.appointmentTime}>{formatTime(bookingTime)}</Text>
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How late will you be?</Text>
        
        <View style={styles.optionsGrid}>
          {options.map((option) => {
            const isSelected = selectedDelay === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedDelay(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <Text style={styles.optionETA}>
                    ETA: {formatTimeWithDelay(bookingTime, option.value)}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDelay && (
          <View style={styles.etaBanner}>
            <Ionicons name="car-outline" size={20} color="#D97706" />
            <Text style={styles.etaBannerText}>
              New estimated arrival: {formatTimeWithDelay(bookingTime, selectedDelay)}
            </Text>
          </View>
        )}

        <Text style={styles.messageLabel}>Add a message (optional)</Text>
        <TextInput
          style={styles.messageInput}
          placeholder="e.g., Stuck in traffic, on my way!"
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
          maxLength={500}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{message.length}/500</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelActionButton} 
            onPress={handleClose}
          >
            <Text style={styles.cancelActionText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!selectedDelay || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!selectedDelay || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Notify Salon</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="time" size={24} color="#F59E0B" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Running Late?</Text>
              <Text style={styles.headerSubtitle}>
                Let {salonName} know you're on your way
              </Text>
            </View>
            <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {renderContent()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerContent: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  appointmentText: {
    fontSize: 14,
    color: '#6B7280',
  },
  appointmentTime: {
    fontWeight: '600',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  optionLabelSelected: {
    color: '#8B5CF6',
  },
  optionETA: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  etaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
  },
  etaBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelActionButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
