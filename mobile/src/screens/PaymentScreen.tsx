import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { bookingAPI, depositAPI, DepositCheckResult, giftCardAPI } from '../services/api';
import { SelectedService } from '../types/navigation';
import { DepositInfoCard } from '../components/DepositInfoCard';
import { CancellationPolicyModal } from '../components/CancellationPolicyModal';

type PaymentMethod = 'pay_now' | 'pay_at_salon' | 'pay_deposit';

interface AppliedGiftCard {
  id: string;
  code: string;
  balancePaisa: number;
  amountToApply: number;
}

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ salonId: string; salonName: string; selectedServices: string; bookingDate: string; bookingTime: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { salonId, salonName, bookingDate, bookingTime } = params;
  const selectedServices: SelectedService[] = JSON.parse(decodeURIComponent(params.selectedServices));

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pay_now');
  const [loading, setLoading] = useState(false);
  const [depositInfo, setDepositInfo] = useState<DepositCheckResult | null>(null);
  const [depositLoading, setDepositLoading] = useState(true);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);

  useEffect(() => {
    checkDepositRequirements();
  }, []);

  useEffect(() => {
    if (appliedGiftCard) {
      const currentOnlineDiscount = selectedPaymentMethod === 'pay_now' ? Math.floor(total * 0.05) : 0;
      const amountNeeded = total - currentOnlineDiscount;
      const newAmountToApply = Math.min(appliedGiftCard.balancePaisa, Math.max(0, amountNeeded));
      
      if (newAmountToApply !== appliedGiftCard.amountToApply) {
        setAppliedGiftCard({
          ...appliedGiftCard,
          amountToApply: newAmountToApply,
        });
      }
    }
  }, [selectedPaymentMethod]);

  const checkDepositRequirements = async () => {
    try {
      setDepositLoading(true);
      const result = await depositAPI.checkBookingDeposit({
        salonId,
        serviceIds: selectedServices.map(s => s.id),
        customerId: user?.id,
      });
      setDepositInfo(result);
      if (result.requiresDeposit && result.forceFullPayment) {
        setSelectedPaymentMethod('pay_deposit');
      }
    } catch (error) {
      console.error('Error checking deposit:', error);
    } finally {
      setDepositLoading(false);
    }
  };

  const subtotal = selectedServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
  const discount = Math.floor(subtotal * 0.05);
  const gst = Math.floor((subtotal - discount) * 0.18);
  const total = subtotal - discount + gst;
  const onlineDiscount = selectedPaymentMethod === 'pay_now' ? Math.floor(total * 0.05) : 0;
  const giftCardDiscount = appliedGiftCard?.amountToApply || 0;
  const finalTotal = Math.max(0, total - onlineDiscount - giftCardDiscount);

  const handleValidateGiftCard = async () => {
    if (!giftCardCode.trim()) {
      setGiftCardError('Please enter a gift card code');
      return;
    }

    try {
      setGiftCardLoading(true);
      setGiftCardError(null);

      const response = await giftCardAPI.validateCard(giftCardCode.trim().toUpperCase(), salonId);

      if (response.valid && response.card) {
        const availableBalance = response.card.balancePaisa;
        const amountNeeded = total - onlineDiscount;
        const amountToApply = Math.min(availableBalance, amountNeeded);

        setAppliedGiftCard({
          id: response.card.id,
          code: giftCardCode.trim().toUpperCase(),
          balancePaisa: availableBalance,
          amountToApply,
        });
        setGiftCardCode('');
      } else {
        setGiftCardError(response.error || 'Invalid gift card code');
      }
    } catch (error: any) {
      console.error('Error validating gift card:', error);
      setGiftCardError(error.response?.data?.message || 'Failed to validate gift card');
    } finally {
      setGiftCardLoading(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardError(null);
  };

  const formatPrice = (priceInPaisa: number) => {
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTotalDuration = () => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to complete your booking.');
      return;
    }

    try {
      setLoading(true);

      const bookingData = {
        salonId,
        serviceIds: selectedServices.map(s => s.id),
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Guest',
        customerEmail: user.email || 'guest@salonhub.com',
        customerPhone: user.phone || '+91-0000000000',
        bookingDate,
        bookingTime,
        paymentMethod: selectedPaymentMethod,
        depositAmountPaisa: selectedPaymentMethod === 'pay_deposit' && depositInfo ? depositInfo.totalDepositPaisa : undefined,
        giftCardId: appliedGiftCard?.id,
        giftCardAmountPaisa: appliedGiftCard?.amountToApply,
      };

      const response = await bookingAPI.createBooking(bookingData);
      
      if (response.success) {
        const depositParam = selectedPaymentMethod === 'pay_deposit' ? '&depositPaid=true' : '';
        router.replace(`/booking/confirmation?bookingId=${response.booking.id}${depositParam}`);
      } else {
        Alert.alert('Booking Failed', response.message || 'Something went wrong. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      Alert.alert(
        'Booking Failed',
        error.response?.data?.message || 'Unable to create booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Options</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.salonCard}>
          <View style={styles.salonInfo}>
            <Text style={styles.salonName}>{salonName}</Text>
            <View style={styles.salonMetaRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.salonMetaText}>Nearby</Text>
            </View>
          </View>
        </View>

        <View style={styles.appointmentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Appointment Details</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(bookingDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{bookingTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{getTotalDuration()} mins</Text>
          </View>
        </View>

        {!depositLoading && depositInfo && depositInfo.requiresDeposit && (
          <DepositInfoCard
            depositInfo={depositInfo}
            onViewPolicy={() => setPolicyModalVisible(true)}
          />
        )}

        <View style={styles.servicesCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="cut-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Selected Services</Text>
          </View>
          {selectedServices.map((service, index) => (
            <View key={service.id} style={[styles.serviceRow, index < selectedServices.length - 1 && styles.serviceRowBorder]}>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={styles.serviceMeta}>
                  <Ionicons name="time-outline" size={12} color="#6B7280" />
                  <Text style={styles.serviceMetaText}>{service.durationMinutes} mins</Text>
                </View>
              </View>
              <Text style={styles.servicePrice}>{formatPrice(service.priceInPaisa)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="receipt-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Price Breakdown</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal ({selectedServices.length} services)</Text>
            <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service Discount</Text>
            <Text style={styles.priceDiscount}>-{formatPrice(discount)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (18%)</Text>
            <Text style={styles.priceValue}>{formatPrice(gst)}</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total Amount</Text>
            <Text style={styles.priceTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Gift Card Section */}
        <View style={styles.giftCardCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="gift-outline" size={18} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Apply Gift Card</Text>
          </View>

          {appliedGiftCard ? (
            <View style={styles.appliedGiftCard}>
              <View style={styles.appliedGiftCardHeader}>
                <View style={styles.appliedGiftCardIcon}>
                  <Ionicons name="gift" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.appliedGiftCardInfo}>
                  <Text style={styles.appliedGiftCardCode}>{appliedGiftCard.code}</Text>
                  <Text style={styles.appliedGiftCardBalance}>
                    Balance: {formatPrice(appliedGiftCard.balancePaisa)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeGiftCardButton}
                  onPress={handleRemoveGiftCard}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.giftCardDiscountRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.giftCardDiscountText}>
                  {formatPrice(appliedGiftCard.amountToApply)} will be applied to this booking
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.giftCardInputContainer}>
              <View style={styles.giftCardInputRow}>
                <TextInput
                  style={styles.giftCardInput}
                  placeholder="Enter gift card code"
                  placeholderTextColor="#9CA3AF"
                  value={giftCardCode}
                  onChangeText={(text) => {
                    setGiftCardCode(text.toUpperCase());
                    setGiftCardError(null);
                  }}
                  autoCapitalize="characters"
                  maxLength={16}
                />
                <TouchableOpacity
                  style={[
                    styles.giftCardApplyButton,
                    (!giftCardCode.trim() || giftCardLoading) && styles.giftCardApplyButtonDisabled,
                  ]}
                  onPress={handleValidateGiftCard}
                  disabled={!giftCardCode.trim() || giftCardLoading}
                >
                  {giftCardLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.giftCardApplyButtonText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {giftCardError && (
                <View style={styles.giftCardErrorRow}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.giftCardErrorText}>{giftCardError}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Payment Method</Text>
          {depositLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Checking deposit requirements...</Text>
            </View>
          )}
        </View>

        <View style={styles.paymentOptions}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPaymentMethod === 'pay_now' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('pay_now')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentContent}>
              <View style={styles.paymentIconContainer}>
                <Ionicons name="card-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentTitle}>Pay Now</Text>
                <Text style={styles.paymentDescription}>Pay securely online and confirm booking instantly</Text>
                <View style={styles.paymentBadges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Instant Confirmation</Text>
                  </View>
                  <View style={styles.badgeSave}>
                    <Text style={styles.badgeSaveText}>Save 5%</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.radioButton, selectedPaymentMethod === 'pay_now' && styles.radioButtonSelected]}>
              {selectedPaymentMethod === 'pay_now' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>

          {selectedPaymentMethod === 'pay_now' && (
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>You Pay Now</Text>
                <Text style={styles.summaryAmount}>{formatPrice(finalTotal)}</Text>
              </View>
              <View style={styles.savingsRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.savingsText}>You save {formatPrice(onlineDiscount)} with online payment</Text>
              </View>
              {appliedGiftCard && (
                <View style={styles.savingsRow}>
                  <Ionicons name="gift" size={14} color="#8B5CF6" />
                  <Text style={styles.giftCardSavingsText}>
                    Gift card discount: -{formatPrice(appliedGiftCard.amountToApply)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPaymentMethod === 'pay_at_salon' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPaymentMethod('pay_at_salon')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentContent}>
              <View style={styles.paymentIconContainerAlt}>
                <Ionicons name="business-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentTitle}>Pay at Salon</Text>
                <Text style={styles.paymentDescription}>Pay in cash or card when you visit the salon</Text>
                <View style={styles.paymentBadges}>
                  <View style={styles.badgeInfo}>
                    <Text style={styles.badgeInfoText}>Flexible Payment</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.radioButton, selectedPaymentMethod === 'pay_at_salon' && styles.radioButtonSelected]}>
              {selectedPaymentMethod === 'pay_at_salon' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>

          {selectedPaymentMethod === 'pay_at_salon' && (
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>You Pay at Salon</Text>
                <Text style={styles.summaryAmount}>{formatPrice(total)}</Text>
              </View>
            </View>
          )}

          {!depositLoading && depositInfo && depositInfo.requiresDeposit && (
            <>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'pay_deposit' && styles.paymentOptionSelected,
                ]}
                onPress={() => setSelectedPaymentMethod('pay_deposit')}
                activeOpacity={0.7}
              >
                <View style={styles.paymentContent}>
                  <View style={styles.paymentIconContainerDeposit}>
                    <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={styles.paymentTitle}>Pay Deposit Only</Text>
                    <Text style={styles.paymentDescription}>
                      Secure your slot with a deposit, pay the rest at the salon
                    </Text>
                    <View style={styles.paymentBadges}>
                      <View style={styles.badgeDeposit}>
                        <Text style={styles.badgeDepositText}>Guaranteed Slot</Text>
                      </View>
                      <View style={styles.badgeInfo}>
                        <Text style={styles.badgeInfoText}>Refundable</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={[styles.radioButton, selectedPaymentMethod === 'pay_deposit' && styles.radioButtonSelected]}>
                  {selectedPaymentMethod === 'pay_deposit' && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>

              {selectedPaymentMethod === 'pay_deposit' && (
                <View style={styles.paymentSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Deposit Now</Text>
                    <Text style={styles.summaryAmount}>{formatPrice(depositInfo.totalDepositPaisa)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Balance at Salon</Text>
                    <Text style={styles.balanceText}>
                      {formatPrice((depositInfo.balanceDuePaisa ?? 0) || (depositInfo.totalServicePaisa - depositInfo.totalDepositPaisa))}
                    </Text>
                  </View>
                  <View style={styles.savingsRow}>
                    <Ionicons name="shield-checkmark" size={14} color="#D97706" />
                    <Text style={styles.depositNoteText}>Your slot is guaranteed once deposit is paid</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {selectedPaymentMethod === 'pay_deposit' && depositInfo ? 'Deposit Amount' : 'Total Amount'}
          </Text>
          <Text style={styles.totalAmount}>
            {formatPrice(
              selectedPaymentMethod === 'pay_now' 
                ? finalTotal 
                : selectedPaymentMethod === 'pay_deposit' && depositInfo
                  ? depositInfo.totalDepositPaisa
                  : total
            )}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.confirmButton, 
            (loading || (selectedPaymentMethod === 'pay_deposit' && !depositInfo)) && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirmBooking}
          disabled={loading || (selectedPaymentMethod === 'pay_deposit' && !depositInfo)}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmButtonText}>
                {selectedPaymentMethod === 'pay_deposit' ? 'Pay Deposit & Book' : 'Confirm Booking'}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <CancellationPolicyModal
        visible={policyModalVisible}
        onClose={() => setPolicyModalVisible(false)}
        policy={depositInfo?.cancellationPolicy || null}
        salonName={salonName}
      />
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
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  salonCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  salonInfo: {
    gap: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  salonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salonMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  appointmentCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  servicesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  serviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  priceCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  priceDiscount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  priceTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  giftCardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  giftCardInputContainer: {
    gap: 8,
  },
  giftCardInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  giftCardInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 1,
  },
  giftCardApplyButton: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftCardApplyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  giftCardApplyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  giftCardErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  giftCardErrorText: {
    fontSize: 12,
    color: '#EF4444',
  },
  appliedGiftCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  appliedGiftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appliedGiftCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedGiftCardInfo: {
    flex: 1,
    gap: 2,
  },
  appliedGiftCardCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 1,
  },
  appliedGiftCardBalance: {
    fontSize: 12,
    color: '#6B7280',
  },
  removeGiftCardButton: {
    padding: 4,
  },
  giftCardDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
  },
  giftCardDiscountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  giftCardSavingsText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentOptions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  paymentContent: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconContainerAlt: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  paymentBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  badgeSave: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
  },
  badgeSaveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  badgeInfo: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  badgeInfoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioButtonSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  paymentSummary: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: -8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingsText: {
    fontSize: 12,
    color: '#10B981',
  },
  paymentIconContainerDeposit: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDeposit: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  badgeDepositText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  depositNoteText: {
    fontSize: 12,
    color: '#D97706',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
