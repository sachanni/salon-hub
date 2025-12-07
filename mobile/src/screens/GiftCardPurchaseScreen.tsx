import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { giftCardAPI } from '../services/api';
import { 
  PurchaseGiftCardData, 
  CreateOrderResponse, 
  OCCASION_OPTIONS, 
  PRESET_AMOUNTS_PAISA 
} from '../types/giftCard';
import RazorpayCheckout from '../components/RazorpayCheckout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DeliveryMethod = 'email' | 'sms' | 'whatsapp';

export default function GiftCardPurchaseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const salonId = params.salonId as string;
  const templateId = params.templateId as string;
  const templateName = params.templateName as string;
  const backgroundColor = params.backgroundColor as string || '#8B5CF6';
  const textColor = params.textColor as string || '#FFFFFF';
  const minValue = parseInt(params.minValue as string) || 50000;
  const maxValue = parseInt(params.maxValue as string) || 500000;
  
  let presetAmounts: number[] = PRESET_AMOUNTS_PAISA;
  try {
    const parsed = JSON.parse(params.presetAmounts as string);
    if (Array.isArray(parsed) && parsed.length > 0) {
      presetAmounts = parsed;
    }
  } catch (e) {}

  const [selectedAmount, setSelectedAmount] = useState<number>(presetAmounts[1] || 100000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('whatsapp');
  const [scheduledDelivery, setScheduledDelivery] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const formatAmount = (paisa: number) => {
    return `₹${(paisa / 100).toLocaleString()}`;
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCustomAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numericValue);
    
    if (numericValue) {
      const paisa = parseInt(numericValue) * 100;
      if (paisa >= minValue && paisa <= maxValue) {
        setSelectedAmount(paisa);
        setIsCustom(true);
      }
    }
  };

  const validateForm = (): boolean => {
    if (!recipientName.trim()) {
      Alert.alert('Error', 'Please enter recipient name');
      return false;
    }
    
    if (deliveryMethod === 'email' && !recipientEmail.trim()) {
      Alert.alert('Error', 'Please enter recipient email');
      return false;
    }
    
    if ((deliveryMethod === 'sms' || deliveryMethod === 'whatsapp') && !recipientPhone.trim()) {
      Alert.alert('Error', 'Please enter recipient phone number');
      return false;
    }
    
    if (recipientPhone && !/^[6-9]\d{9}$/.test(recipientPhone.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Please enter a valid 10-digit Indian phone number');
      return false;
    }
    
    if (recipientEmail && !/\S+@\S+\.\S+/.test(recipientEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (selectedAmount < minValue || selectedAmount > maxValue) {
      Alert.alert('Error', `Amount must be between ${formatAmount(minValue)} and ${formatAmount(maxValue)}`);
      return false;
    }
    
    return true;
  };

  const handlePurchase = async () => {
    if (!validateForm()) return;
    
    Keyboard.dismiss();
    setIsProcessing(true);
    
    try {
      const purchaseData: PurchaseGiftCardData = {
        salonId,
        valuePaisa: selectedAmount,
        templateId,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        recipientPhone: recipientPhone.trim() || undefined,
        personalMessage: personalMessage.trim() || undefined,
        deliveryMethod,
        scheduledDeliveryAt: scheduledDelivery?.toISOString(),
      };
      
      const response = await giftCardAPI.createOrder(purchaseData);
      
      if (response.success) {
        setOrderData(response);
        setShowPayment(true);
      } else {
        Alert.alert('Error', response.error || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const verifyData = {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        giftCardId: orderData?.giftCardId || '',
      };
      
      const response = await giftCardAPI.verifyPayment(verifyData);
      
      if (response.success) {
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
        
        Alert.alert(
          '🎉 Gift Card Purchased!',
          `Your gift card of ${formatAmount(selectedAmount)} has been sent to ${recipientName}.${scheduledDelivery ? `\n\nScheduled for: ${scheduledDelivery.toLocaleDateString()}` : ''}`,
          [
            {
              text: 'View My Cards',
              onPress: () => router.replace('/gift-cards/wallet'),
            },
            {
              text: 'Done',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      Alert.alert('Error', 'Failed to verify payment. Please contact support.');
    }
    
    setShowPayment(false);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    Alert.alert('Payment Failed', error.description || 'Payment was cancelled or failed');
    setShowPayment(false);
  };

  const getDeliveryMethodIcon = (method: DeliveryMethod) => {
    switch (method) {
      case 'whatsapp': return 'logo-whatsapp';
      case 'sms': return 'chatbubble';
      case 'email': return 'mail';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[backgroundColor, `${backgroundColor}DD`]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Purchase Gift Card</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.cardPreview}>
          <Animated.View style={[styles.cardPreviewInner, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.cardPreviewContent}>
              <Ionicons name="gift" size={32} color={textColor} />
              <Text style={[styles.cardPreviewAmount, { color: textColor }]}>
                {formatAmount(selectedAmount)}
              </Text>
              <Text style={[styles.cardPreviewName, { color: `${textColor}CC` }]}>
                {templateName || 'Gift Card'}
              </Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Amount</Text>
          
          <View style={styles.amountGrid}>
            {presetAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountChip,
                  selectedAmount === amount && !isCustom && styles.amountChipActive,
                ]}
                onPress={() => handleAmountSelect(amount)}
              >
                <Text
                  style={[
                    styles.amountChipText,
                    selectedAmount === amount && !isCustom && styles.amountChipTextActive,
                  ]}
                >
                  {formatAmount(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customAmountContainer}>
            <Text style={styles.customAmountLabel}>Or enter custom amount</Text>
            <View style={styles.customAmountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.customAmountInput}
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                placeholder={`${minValue / 100} - ${maxValue / 100}`}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={7}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Name *</Text>
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Enter recipient's name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Method</Text>
            <View style={styles.deliveryMethodRow}>
              {(['whatsapp', 'sms', 'email'] as DeliveryMethod[]).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.deliveryMethodButton,
                    deliveryMethod === method && styles.deliveryMethodButtonActive,
                  ]}
                  onPress={() => setDeliveryMethod(method)}
                >
                  <Ionicons
                    name={getDeliveryMethodIcon(method)}
                    size={20}
                    color={deliveryMethod === method ? '#8B5CF6' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.deliveryMethodText,
                      deliveryMethod === method && styles.deliveryMethodTextActive,
                    ]}
                  >
                    {method === 'whatsapp' ? 'WhatsApp' : method === 'sms' ? 'SMS' : 'Email'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(deliveryMethod === 'sms' || deliveryMethod === 'whatsapp') && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.phonePrefix}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={recipientPhone}
                  onChangeText={(text) => setRecipientPhone(text.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>
          )}

          {deliveryMethod === 'email' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                placeholder="Enter email address"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Personal Message (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={personalMessage}
              onChangeText={setPersonalMessage}
              placeholder="Add a personal message..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.charCount}>{personalMessage.length}/200</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Schedule</Text>
          
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#8B5CF6" />
            <View style={styles.scheduleButtonContent}>
              <Text style={styles.scheduleButtonTitle}>
                {scheduledDelivery ? 'Scheduled for' : 'Schedule for later'}
              </Text>
              <Text style={styles.scheduleButtonSubtitle}>
                {scheduledDelivery
                  ? scheduledDelivery.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Send immediately after purchase'}
              </Text>
            </View>
            {scheduledDelivery && (
              <TouchableOpacity
                onPress={() => setScheduledDelivery(null)}
                style={styles.clearSchedule}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gift Card Value</Text>
            <Text style={styles.summaryValue}>{formatAmount(selectedAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee</Text>
            <Text style={styles.summaryValueFree}>FREE</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total Amount</Text>
            <Text style={styles.summaryTotalValue}>{formatAmount(selectedAmount)}</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.bottomBarLabel}>Total</Text>
            <Text style={styles.bottomBarAmount}>{formatAmount(selectedAmount)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.purchaseButton, isProcessing && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.purchaseButtonGradient}
            >
              {isProcessing ? (
                <Text style={styles.purchaseButtonText}>Processing...</Text>
              ) : (
                <>
                  <Ionicons name="gift" size={20} color="#FFFFFF" />
                  <Text style={styles.purchaseButtonText}>Purchase Gift Card</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Schedule Delivery</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.datePickerContent}>
              {[...Array(30)].map((_, index) => {
                const date = new Date();
                date.setDate(date.getDate() + index + 1);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.dateOption}
                    onPress={() => {
                      setScheduledDelivery(date);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.dateOptionText}>
                      {date.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showPayment && orderData && (
        <RazorpayCheckout
          orderId={orderData.orderId}
          amount={orderData.amount}
          keyId={orderData.keyId}
          name="SalonHub Gift Card"
          description={`Gift Card for ${recipientName}`}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onDismiss={() => setShowPayment(false)}
        />
      )}
    </KeyboardAvoidingView>
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
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: '600',
  },
  cardPreview: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardPreviewInner: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  cardPreviewContent: {
    alignItems: 'center',
  },
  cardPreviewAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 8,
  },
  cardPreviewName: {
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amountChip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  amountChipActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  amountChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  amountChipTextActive: {
    color: '#8B5CF6',
  },
  customAmountContainer: {
    marginTop: 16,
  },
  customAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phonePrefix: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#6B7280',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  phoneInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  deliveryMethodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveryMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  deliveryMethodButtonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#8B5CF6',
  },
  deliveryMethodText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  deliveryMethodTextActive: {
    color: '#8B5CF6',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  scheduleButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  scheduleButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  clearSchedule: {
    padding: 4,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  summaryValueFree: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 32,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomBarAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  purchaseButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  datePickerContent: {
    paddingHorizontal: 16,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateOptionText: {
    fontSize: 15,
    color: '#374151',
  },
});
