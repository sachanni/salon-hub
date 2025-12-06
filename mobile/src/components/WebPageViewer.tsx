import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface WebPageViewerProps {
  title?: string;
  content?: string;
}

export default function WebPageViewer({ title, content }: WebPageViewerProps) {
  const router = useRouter();
  const params = useLocalSearchParams();

  const pageTitle = title || (params.title as string) || 'Page';
  const pageType = params.type as string;

  const getContent = () => {
    if (content) return content;

    switch (pageType) {
      case 'privacy':
        return privacyPolicyContent;
      case 'terms':
        return termsOfServiceContent;
      case 'about':
        return aboutUsContent;
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pageTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageContent}>{getContent()}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const privacyPolicyContent = `Privacy Policy

Last Updated: December 2024

1. Information We Collect
We collect information you provide directly to us, including your name, phone number, email address, and booking preferences. We also collect information about your device and how you use our app.

2. How We Use Your Information
We use your information to:
- Process your salon bookings and payments
- Send you booking confirmations and reminders
- Improve our services and user experience
- Send promotional offers (with your consent)

3. Information Sharing
We share your information with salon partners only as necessary to fulfill your bookings. We do not sell your personal information to third parties.

4. Data Security
We implement appropriate security measures to protect your personal information. All payment transactions are encrypted using industry-standard protocols.

5. Your Rights
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Opt-out of marketing communications

6. Contact Us
If you have questions about this Privacy Policy, please contact us at privacy@salonhub.in`;

const termsOfServiceContent = `Terms of Service

Last Updated: December 2024

1. Acceptance of Terms
By using SalonHub, you agree to these Terms of Service. If you do not agree, please do not use our services.

2. Services
SalonHub provides a platform connecting customers with salon and beauty service providers. We are not responsible for the quality of services provided by individual salons.

3. User Accounts
You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.

4. Bookings
- Bookings are subject to availability
- Cancellation policies vary by salon
- We may charge a cancellation fee for late cancellations

5. Payments
- All payments are processed securely
- Wallet balance is non-refundable but can be used for future bookings
- We do not store your payment card details

6. Wallet Terms
- Wallet balance can be used for booking payments
- Cashback rewards are credited to your wallet
- Wallet balance expires after 12 months of inactivity

7. User Conduct
You agree not to:
- Use the service for any unlawful purpose
- Attempt to interfere with the service
- Create multiple accounts

8. Limitation of Liability
SalonHub is not liable for any indirect, incidental, or consequential damages arising from your use of our services.

9. Changes to Terms
We may update these terms from time to time. Continued use of the service constitutes acceptance of updated terms.

10. Contact
For questions about these Terms, contact us at legal@salonhub.in`;

const aboutUsContent = `About SalonHub

SalonHub is India's leading beauty services booking platform, connecting customers with the best salons and beauty professionals.

Our Mission
To make beauty services accessible, convenient, and delightful for everyone.

What We Offer
- Easy online booking for salon appointments
- Wide selection of verified salons
- Exclusive offers and rewards
- Secure payments with wallet cashback
- Real-time booking management

Our Story
Founded in 2024, SalonHub started with a simple idea: make booking beauty services as easy as ordering food online. Today, we serve thousands of customers across India, helping them discover and book the best salons in their area.

Our Team
We are a passionate team of technology and beauty enthusiasts dedicated to transforming the salon industry through innovation.

Contact Us
Email: hello@salonhub.in
Phone: +91 8888888888
Address: Bangalore, India`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  pageContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
  },
});
