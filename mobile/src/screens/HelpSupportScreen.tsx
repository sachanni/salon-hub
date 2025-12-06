import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I book a salon appointment?',
    answer: 'Simply browse salons near you, select your preferred services, choose a date and time, and confirm your booking. You can pay online or at the salon.',
  },
  {
    question: 'Can I cancel or reschedule my booking?',
    answer: 'Yes, you can cancel or reschedule your booking from the Booking History section in your profile. Cancellation policies vary by salon.',
  },
  {
    question: 'How do I add money to my wallet?',
    answer: 'Go to your Wallet section, tap "Add Money", enter the amount, and complete the payment using your preferred method.',
  },
  {
    question: 'How do I use wallet balance for bookings?',
    answer: 'During checkout, you can choose to pay using your wallet balance. If the balance is insufficient, you can pay the remaining amount online.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Go to your Payment History in the profile section and tap on any order to see its current status and tracking details.',
  },
  {
    question: 'What if I have a problem with a service?',
    answer: 'Please contact our support team through this Help section or email us at support@salonhub.in. We will resolve your issue promptly.',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const handleContactSupport = (method: string) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:support@salonhub.in?subject=Support Request');
        break;
      case 'phone':
        Linking.openURL('tel:+918888888888');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/918888888888');
        break;
    }
  };

  const handleSubmitFeedback = () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    Alert.alert(
      'Thank You!',
      'Your message has been received. We will get back to you soon.',
      [{ text: 'OK', onPress: () => setMessage('') }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactCards}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContactSupport('email')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="mail-outline" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.contactLabel}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContactSupport('phone')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="call-outline" size={24} color="#10B981" />
              </View>
              <Text style={styles.contactLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContactSupport('whatsapp')}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#22C55E" />
              </View>
              <Text style={styles.contactLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7280"
                />
              </View>
              {expandedFaq === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <View style={styles.feedbackCard}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback}>
              <Text style={styles.submitButtonText}>Send Message</Text>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Our support team is available Monday to Saturday, 9 AM to 7 PM IST
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  contactSection: {
    marginBottom: 24,
  },
  contactCards: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  messageInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#111827',
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoSection: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
