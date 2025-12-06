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
import { useAuth } from '../../contexts/AuthContext';
import { eventsAPI } from '../../services/api';

interface RegistrationForm {
  name: string;
  phone: string;
  email: string;
  numberOfTickets: number;
  specialRequirements: string;
}

export const EventRegistrationScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const eventId = typeof id === 'string' ? id : id?.[0];
  const { user } = useAuth();
  
  const [form, setForm] = useState<RegistrationForm>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: '',
    numberOfTickets: 1,
    specialRequirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<RegistrationForm>>({});
  const [eventDetails, setEventDetails] = useState({
    title: 'Bridal Makeup Masterclass',
    date: 'December 15, 2024',
    time: '2:00 PM - 5:00 PM',
    location: 'Sector 18, Noida',
    pricePerTicket: 960,
    spotsLeft: 8,
  });

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setEventLoading(false);
        return;
      }
      try {
        const response = await eventsAPI.getEventById(eventId);
        if (response && response.event) {
          setEventDetails({
            title: response.event.title,
            date: response.event.date,
            time: response.event.time,
            location: response.event.location,
            pricePerTicket: response.event.price,
            spotsLeft: response.event.spotsLeft,
          });
        }
      } catch (err) {
        console.error('Error fetching event:', err);
      } finally {
        setEventLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const totalAmount = eventDetails.pricePerTicket * form.numberOfTickets;

  const handleBack = () => {
    router.back();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationForm> = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = 'Enter valid 10-digit mobile number';
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter valid email address';
    }
    
    if (form.numberOfTickets < 1 || form.numberOfTickets > eventDetails.spotsLeft) {
      newErrors.numberOfTickets = `Select between 1 and ${eventDetails.spotsLeft} tickets`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) {
      return;
    }

    if (!eventId) {
      Alert.alert('Error', 'Event not found');
      return;
    }

    setLoading(true);
    
    try {
      const response = await eventsAPI.registerForEvent({
        eventId,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        numberOfTickets: form.numberOfTickets,
        specialRequirements: form.specialRequirements || undefined,
      });

      if (response.success && response.registration) {
        router.push({
          pathname: '/events/ticket',
          params: {
            id: response.registration.id,
            eventId: eventId,
            tickets: form.numberOfTickets.toString(),
          },
        });
      } else {
        Alert.alert('Registration Failed', response.error || 'Unable to complete registration');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      Alert.alert('Error', 'Unable to complete registration. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketCount = (delta: number) => {
    const newCount = form.numberOfTickets + delta;
    if (newCount >= 1 && newCount <= eventDetails.spotsLeft) {
      setForm({ ...form, numberOfTickets: newCount });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registration</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Event Summary */}
        <View style={styles.eventSummary}>
          <View style={styles.eventSummaryHeader}>
            <Ionicons name="ticket" size={20} color="#8B5CF6" />
            <Text style={styles.eventSummaryTitle}>Event Summary</Text>
          </View>
          <View style={styles.eventSummaryContent}>
            <Text style={styles.eventName}>{eventDetails.title}</Text>
            <View style={styles.eventMeta}>
              <View style={styles.eventMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.eventMetaText}>{eventDetails.date}</Text>
              </View>
              <View style={styles.eventMetaItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.eventMetaText}>{eventDetails.time}</Text>
              </View>
              <View style={styles.eventMetaItem}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.eventMetaText}>{eventDetails.location}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Registration Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={form.name}
              onChangeText={(text) => {
                setForm({ ...form, name: text });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <View style={styles.phoneInputContainer}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+91</Text>
              </View>
              <TextInput
                style={[styles.phoneInput, errors.phone && styles.inputError]}
                placeholder="10-digit mobile number"
                placeholderTextColor="#9CA3AF"
                value={form.phone}
                onChangeText={(text) => {
                  setForm({ ...form, phone: text.replace(/\D/g, '').slice(0, 10) });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address (Optional)</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="For ticket confirmation"
              placeholderTextColor="#9CA3AF"
              value={form.email}
              onChangeText={(text) => {
                setForm({ ...form, email: text });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
        </View>

        {/* Ticket Selection */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Number of Tickets</Text>
          <View style={styles.ticketSelector}>
            <TouchableOpacity
              style={[styles.ticketButton, form.numberOfTickets <= 1 && styles.ticketButtonDisabled]}
              onPress={() => updateTicketCount(-1)}
              disabled={form.numberOfTickets <= 1}
            >
              <Ionicons name="remove" size={24} color={form.numberOfTickets <= 1 ? '#D1D5DB' : '#8B5CF6'} />
            </TouchableOpacity>
            <View style={styles.ticketCount}>
              <Text style={styles.ticketCountText}>{form.numberOfTickets}</Text>
              <Text style={styles.ticketCountLabel}>ticket{form.numberOfTickets > 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity
              style={[styles.ticketButton, form.numberOfTickets >= eventDetails.spotsLeft && styles.ticketButtonDisabled]}
              onPress={() => updateTicketCount(1)}
              disabled={form.numberOfTickets >= eventDetails.spotsLeft}
            >
              <Ionicons name="add" size={24} color={form.numberOfTickets >= eventDetails.spotsLeft ? '#D1D5DB' : '#8B5CF6'} />
            </TouchableOpacity>
          </View>
          <Text style={styles.spotsLeftText}>
            {eventDetails.spotsLeft} spots left
          </Text>
        </View>

        {/* Special Requirements */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Special Requirements (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Any dietary restrictions, accessibility needs, etc."
            placeholderTextColor="#9CA3AF"
            value={form.specialRequirements}
            onChangeText={(text) => setForm({ ...form, specialRequirements: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Price Breakdown */}
        <View style={styles.priceBreakdown}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Ticket Price</Text>
            <Text style={styles.priceValue}>₹{eventDetails.pricePerTicket} x {form.numberOfTickets}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Convenience Fee</Text>
            <Text style={styles.priceValue}>₹0</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Ionicons name="information-circle" size={16} color="#6B7280" />
          <Text style={styles.termsText}>
            By registering, you agree to our Terms of Service and cancellation policy.
            Tickets are non-refundable within 24 hours of the event.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{totalAmount}</Text>
        </View>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Proceed to Pay</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </>
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
  eventSummary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  eventSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  eventSummaryContent: {},
  eventName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  eventMeta: {
    gap: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  phonePrefix: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  ticketSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  ticketButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  ticketCount: {
    alignItems: 'center',
  },
  ticketCountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  ticketCountLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  spotsLeftText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
    height: 100,
  },
  priceBreakdown: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  totalContainer: {},
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  payButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
