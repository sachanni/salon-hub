import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { format, addDays } from 'date-fns';
import { appointmentsAPI, salonAPI } from '../services/api';

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: {
    id: string;
    salonId: string;
    salonName: string;
    serviceId: string;
    serviceName: string;
    staffId?: string;
    staffName?: string;
    date: string;
    time: string;
    duration?: number;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  visible,
  onClose,
  onSuccess,
  appointment,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (selectedDate && appointment.salonId) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async (date: string) => {
    setLoadingSlots(true);
    setSelectedTime(null);
    try {
      const response = await salonAPI.getAvailableSlots(
        appointment.salonId,
        date,
        appointment.serviceId,
        appointment.staffId
      );
      setAvailableSlots(response.slots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Select Date & Time', 'Please select a new date and time for your appointment.');
      return;
    }

    setRescheduling(true);
    try {
      await appointmentsAPI.rescheduleAppointment(appointment.id, {
        date: selectedDate,
        time: selectedTime,
      });
      Alert.alert(
        'Rescheduled Successfully',
        `Your ${appointment.serviceName} appointment has been moved to ${selectedDate} at ${formatTime12Hour(selectedTime)}.`,
        [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]
      );
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      Alert.alert(
        'Reschedule Failed',
        error.response?.data?.error || 'Could not reschedule your appointment. Please try again.'
      );
    } finally {
      setRescheduling(false);
    }
  };

  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 60), 'yyyy-MM-dd');

  const markedDates: { [key: string]: any } = {};
  if (selectedDate) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: '#8B5CF6',
    };
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reschedule Appointment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.appointmentInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="cut" size={18} color="#8B5CF6" />
              <Text style={styles.infoText}>{appointment.serviceName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={18} color="#8B5CF6" />
              <Text style={styles.infoText}>{appointment.salonName}</Text>
            </View>
            {appointment.staffName && (
              <View style={styles.infoRow}>
                <Ionicons name="person" size={18} color="#8B5CF6" />
                <Text style={styles.infoText}>with {appointment.staffName}</Text>
              </View>
            )}
            <View style={styles.currentDateRow}>
              <Ionicons name="calendar" size={18} color="#9CA3AF" />
              <Text style={styles.currentDateText}>
                Current: {appointment.date} at {appointment.time}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Select New Date</Text>
          <Calendar
            style={styles.calendar}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#8B5CF6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#8B5CF6',
              dayTextColor: '#1F2937',
              textDisabledColor: '#D1D5DB',
              arrowColor: '#8B5CF6',
              monthTextColor: '#1F2937',
              textDayFontWeight: '500',
              textMonthFontWeight: '600',
            }}
            minDate={today}
            maxDate={maxDate}
            markedDates={markedDates}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
          />

          {selectedDate && (
            <View style={styles.timeSection}>
              <Text style={styles.sectionTitle}>
                Available Times for {format(new Date(selectedDate), 'EEE, MMM d')}
              </Text>
              
              {loadingSlots ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                </View>
              ) : availableSlots.filter(s => s.available).length > 0 ? (
                <View style={styles.timeGrid}>
                  {availableSlots
                    .filter((slot) => slot.available)
                    .map((slot) => (
                      <TouchableOpacity
                        key={slot.time}
                        style={[
                          styles.timeSlot,
                          selectedTime === slot.time && styles.selectedTimeSlot,
                        ]}
                        onPress={() => setSelectedTime(slot.time)}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            selectedTime === slot.time && styles.selectedTimeSlotText,
                          ]}
                        >
                          {formatTime12Hour(slot.time)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="alert-circle-outline" size={24} color="#9CA3AF" />
                  <Text style={styles.noSlotsText}>
                    No available slots on this date. Please select another date.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelActionButton} onPress={onClose}>
            <Text style={styles.cancelActionText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (!selectedDate || !selectedTime) && styles.confirmButtonDisabled,
            ]}
            onPress={handleReschedule}
            disabled={!selectedDate || !selectedTime || rescheduling}
          >
            {rescheduling ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Reschedule</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  appointmentInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 10,
    fontWeight: '500',
  },
  currentDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  currentDateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 12,
    marginBottom: 20,
  },
  timeSection: {
    marginTop: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  selectedTimeSlot: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
  },
  noSlotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RescheduleModal;
