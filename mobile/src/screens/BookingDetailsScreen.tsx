import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SelectedService } from '../types/navigation';

const { width } = Dimensions.get('window');

const TIME_SLOTS = {
  morning: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM'],
  afternoon: ['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'],
  evening: ['05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'],
};

interface PackageData {
  packageId: string;
  packageName: string;
  packagePriceInPaisa: number;
  regularPriceInPaisa: number;
  totalDurationMinutes: number;
  savingsPercentage: number;
}

export default function BookingDetailsScreen() {
  const params = useLocalSearchParams<{ 
    salonId: string; 
    salonName: string; 
    selectedServices: string;
    packageData?: string;
    isPackageBooking?: string;
  }>();
  const router = useRouter();
  const { salonId, salonName } = params;
  const selectedServices: SelectedService[] = JSON.parse(decodeURIComponent(params.selectedServices));
  const isPackageBooking = params.isPackageBooking === 'true';
  const packageData: PackageData | null = params.packageData 
    ? JSON.parse(decodeURIComponent(params.packageData)) 
    : null;

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const serviceTotalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const serviceTotalPrice = selectedServices.reduce((sum, s) => sum + s.priceInPaisa, 0);
  
  const totalDuration = isPackageBooking && packageData 
    ? packageData.totalDurationMinutes 
    : serviceTotalDuration;
  const totalPrice = isPackageBooking && packageData 
    ? packageData.packagePriceInPaisa 
    : serviceTotalPrice;
  const regularPrice = isPackageBooking && packageData 
    ? packageData.regularPriceInPaisa 
    : serviceTotalPrice;

  const formatPrice = (priceInPaisa: number) => {
    return `₹${(priceInPaisa / 100).toFixed(0)}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSameDay = (date1: Date | null, date2: Date | null) => {
    if (!date1 || !date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleContinue = () => {
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please select a date for your appointment');
      return;
    }

    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot for your appointment');
      return;
    }

    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    const servicesParam = encodeURIComponent(JSON.stringify(selectedServices));
    let paymentUrl = `/booking/payment?salonId=${salonId}&salonName=${encodeURIComponent(salonName)}&selectedServices=${servicesParam}&bookingDate=${formattedDate}&bookingTime=${encodeURIComponent(selectedTime)}`;
    
    if (isPackageBooking && packageData) {
      paymentUrl += `&packageData=${encodeURIComponent(JSON.stringify(packageData))}&isPackageBooking=true`;
    }
    
    router.push(paymentUrl);
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressStep}>
          <View style={styles.progressCircleDone}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.progressLabelDone}>Services</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={styles.progressCircleActive}>
            <Text style={styles.progressNumber}>2</Text>
          </View>
          <Text style={styles.progressLabelActive}>Date & Time</Text>
        </View>
        <View style={styles.progressLineInactive} />
        <View style={styles.progressStep}>
          <View style={styles.progressCircleInactive}>
            <Text style={styles.progressNumberInactive}>3</Text>
          </View>
          <Text style={styles.progressLabelInactive}>Payment</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>
              {isPackageBooking ? 'Package Booking' : 'Selected Services'}
            </Text>
            {!isPackageBooking && (
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {isPackageBooking && packageData && (
            <View style={styles.packageBadge}>
              <Ionicons name="gift" size={14} color="#059669" />
              <Text style={styles.packageBadgeText}>{packageData.packageName}</Text>
            </View>
          )}
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Ionicons name={isPackageBooking ? 'gift-outline' : 'cut-outline'} size={16} color="#8B5CF6" />
              <Text style={styles.summaryText}>{selectedServices.length} Services</Text>
            </View>
            <View style={styles.priceColumn}>
              <Text style={styles.summaryPrice}>{formatPrice(totalPrice)}</Text>
              {isPackageBooking && regularPrice > totalPrice && (
                <Text style={styles.regularPriceStruck}>{formatPrice(regularPrice)}</Text>
              )}
            </View>
          </View>
          <View style={styles.summaryMeta}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.summaryMetaText}>Total duration: {totalDuration} min</Text>
          </View>
          {isPackageBooking && packageData && packageData.savingsPercentage > 0 && (
            <View style={styles.savingsBanner}>
              <Ionicons name="pricetag" size={14} color="#059669" />
              <Text style={styles.savingsText}>
                You save {packageData.savingsPercentage}% with this package!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred appointment date</Text>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.monthButton} onPress={handlePrevMonth}>
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{formatMonthYear(currentMonth)}</Text>
            <TouchableOpacity style={styles.monthButton} onPress={handleNextMonth}>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {days.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }
              
              const isDisabled = isDateDisabled(date);
              const isSelected = isSameDay(date, selectedDate);
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isDisabled && styles.dayCellDisabled,
                  ]}
                  onPress={() => !isDisabled && setSelectedDate(date)}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isDisabled && styles.dayTextDisabled,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {selectedDate && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Time Slot</Text>
              <Text style={styles.sectionSubtitle}>
                Available slots for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>

            <View style={styles.timeSlotsSection}>
              <View style={styles.timeSlotGroup}>
                <View style={styles.timeSlotGroupHeader}>
                  <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
                  <Text style={styles.timeSlotGroupTitle}>Morning</Text>
                </View>
                <View style={styles.timeSlotGrid}>
                  {TIME_SLOTS.morning.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotSelected,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTime === time && styles.timeSlotTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.timeSlotGroup}>
                <View style={styles.timeSlotGroupHeader}>
                  <Ionicons name="partly-sunny-outline" size={16} color="#F97316" />
                  <Text style={styles.timeSlotGroupTitle}>Afternoon</Text>
                </View>
                <View style={styles.timeSlotGrid}>
                  {TIME_SLOTS.afternoon.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotSelected,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTime === time && styles.timeSlotTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.timeSlotGroup}>
                <View style={styles.timeSlotGroupHeader}>
                  <Ionicons name="moon-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.timeSlotGroupTitle}>Evening</Text>
                </View>
                <View style={styles.timeSlotGrid}>
                  {TIME_SLOTS.evening.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.timeSlotSelected,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTime === time && styles.timeSlotTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedDate && selectedTime && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue to Payment</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircleDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressCircleInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressNumberInactive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  progressLabelDone: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  progressLabelActive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  progressLabelInactive: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#8B5CF6',
    marginHorizontal: 8,
  },
  progressLineInactive: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  calendarCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dayCellSelected: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#D1D5DB',
  },
  timeSlotsSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  timeSlotGroup: {
    marginBottom: 16,
  },
  timeSlotGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timeSlotGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: (width - 64) / 3,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  packageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  regularPriceStruck: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
});
