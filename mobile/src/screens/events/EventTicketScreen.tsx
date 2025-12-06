import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

interface TicketDetails {
  registrationId: string;
  ticketCode: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventAddress: string;
  salonName: string;
  attendeeName: string;
  numberOfTickets: number;
  totalPaid: number;
  registrationDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  qrCodeData: string;
}

const SAMPLE_TICKET: TicketDetails = {
  registrationId: 'REG-2024-001',
  ticketCode: 'TKT-BRM-15789',
  eventTitle: 'Bridal Makeup Masterclass',
  eventDate: 'December 15, 2024',
  eventTime: '2:00 PM - 5:00 PM',
  eventLocation: 'Sector 18, Noida',
  eventAddress: 'Glow Studio, 2nd Floor, DLF Mall, Sector 18, Noida, UP 201301',
  salonName: 'Glow Studio',
  attendeeName: 'Priya Sharma',
  numberOfTickets: 1,
  totalPaid: 960,
  registrationDate: 'December 3, 2024',
  status: 'confirmed',
  qrCodeData: 'TKT-BRM-15789-2024',
};

export const EventTicketScreen = () => {
  const router = useRouter();
  const { id, eventId, tickets } = useLocalSearchParams();
  const registrationId = typeof id === 'string' ? id : id?.[0];
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!registrationId) {
        setError('No registration ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await eventsAPI.getRegistrationById(registrationId);
        if (response && response.registration) {
          setTicket({
            registrationId: response.registration.id,
            ticketCode: response.registration.ticketCode || `TKT-${Date.now()}`,
            eventTitle: response.registration.eventTitle,
            eventDate: response.registration.eventDate,
            eventTime: response.registration.eventTime,
            eventLocation: response.registration.eventLocation,
            eventAddress: response.registration.eventAddress,
            salonName: response.registration.salonName,
            attendeeName: response.registration.attendeeName,
            numberOfTickets: response.registration.numberOfTickets,
            totalPaid: response.registration.totalPaid,
            registrationDate: response.registration.registrationDate,
            status: response.registration.status,
            qrCodeData: response.registration.qrCodeData || registrationId,
          });
        } else {
          setError('Registration not found. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError('Unable to load ticket. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [registrationId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading your ticket...</Text>
      </View>
    );
  }

  if (error || !ticket) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>{error || 'Ticket not found'}</Text>
        {registrationId && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              setLoading(true);
              eventsAPI.getRegistrationById(registrationId)
                .then(response => {
                  if (response && response.registration) {
                    setTicket({
                      registrationId: response.registration.id,
                      ticketCode: response.registration.ticketCode || `TKT-${Date.now()}`,
                      eventTitle: response.registration.eventTitle,
                      eventDate: response.registration.eventDate,
                      eventTime: response.registration.eventTime,
                      eventLocation: response.registration.eventLocation,
                      eventAddress: response.registration.eventAddress,
                      salonName: response.registration.salonName,
                      attendeeName: response.registration.attendeeName,
                      numberOfTickets: response.registration.numberOfTickets,
                      totalPaid: response.registration.totalPaid,
                      registrationDate: response.registration.registrationDate,
                      status: response.registration.status,
                      qrCodeData: response.registration.qrCodeData || registrationId,
                    });
                  } else {
                    setError('Ticket not found');
                  }
                })
                .catch(() => setError('Unable to load ticket'))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.retryButton, { marginTop: 12, backgroundColor: '#6B7280' }]} 
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My ticket for ${ticket.eventTitle} at ${ticket.salonName}\n\nDate: ${ticket.eventDate}\nTime: ${ticket.eventTime}\nTicket Code: ${ticket.ticketCode}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleAddToCalendar = () => {
    console.log('Add to calendar');
  };

  const handleGetDirections = () => {
    console.log('Get directions');
  };

  const handleCancelRegistration = () => {
    router.push(`/events/cancel?id=${ticket.registrationId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#D1FAE5', text: '#059669' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#E5E7EB', text: '#6B7280' };
    }
  };

  const statusColors = getStatusColor(ticket.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Ticket</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Ticket Card */}
        <View style={styles.ticketCard}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Ionicons 
                name={ticket.status === 'confirmed' ? 'checkmark-circle' : 'time'} 
                size={14} 
                color={statusColors.text} 
              />
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.ticketCode}>{ticket.ticketCode}</Text>
          </View>

          {/* Event Info */}
          <View style={styles.eventSection}>
            <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>
            <Text style={styles.salonName}>by {ticket.salonName}</Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code" size={120} color="#8B5CF6" />
              </View>
              <Text style={styles.qrHint}>Show this QR code at the venue</Text>
            </View>
          </View>

          {/* Ticket Divider */}
          <View style={styles.ticketDivider}>
            <View style={styles.dividerCircleLeft} />
            <View style={styles.dividerLine} />
            <View style={styles.dividerCircleRight} />
          </View>

          {/* Ticket Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar" size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{ticket.eventDate}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="time" size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{ticket.eventTime.split(' - ')[0]}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="person" size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Attendee</Text>
                  <Text style={styles.detailValue}>{ticket.attendeeName}</Text>
                </View>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="ticket" size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Tickets</Text>
                  <Text style={styles.detailValue}>{ticket.numberOfTickets}</Text>
                </View>
              </View>
            </View>

            <View style={styles.locationDetail}>
              <View style={styles.detailIcon}>
                <Ionicons name="location" size={18} color="#8B5CF6" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.detailLabel}>Venue</Text>
                <Text style={styles.detailValue}>{ticket.eventLocation}</Text>
                <Text style={styles.addressText}>{ticket.eventAddress}</Text>
              </View>
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentSection}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Paid</Text>
              <Text style={styles.paymentValue}>₹{ticket.totalPaid}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Registration ID</Text>
              <Text style={styles.paymentId}>{ticket.registrationId}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Booked On</Text>
              <Text style={styles.paymentId}>{ticket.registrationDate}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleAddToCalendar}>
            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Add to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
            <Ionicons name="navigate-outline" size={20} color="#8B5CF6" />
            <Text style={styles.actionButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Registration */}
        {ticket.status === 'confirmed' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRegistration}>
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Cancel Registration</Text>
          </TouchableOpacity>
        )}

        {/* Help */}
        <View style={styles.helpSection}>
          <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.helpText}>
            Having issues? Contact the organizer or reach out to our support team.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    marginTop: -10,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  eventSection: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  salonName: {
    fontSize: 14,
    color: '#6B7280',
  },
  qrSection: {
    padding: 24,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  qrHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
  ticketDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -16,
  },
  dividerCircleLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    marginLeft: -16,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  dividerCircleRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F7',
    marginRight: -16,
  },
  detailsSection: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  paymentSection: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  paymentId: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F7',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
