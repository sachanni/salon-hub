import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServicePackage, PackageService } from '../types/navigation';

const { width, height } = Dimensions.get('window');

interface PackageDetailModalProps {
  visible: boolean;
  package_: ServicePackage | null;
  salonName: string;
  onClose: () => void;
  onBookPackage: () => void;
}

export default function PackageDetailModal({
  visible,
  package_,
  salonName,
  onClose,
  onBookPackage,
}: PackageDetailModalProps) {
  if (!package_) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Package Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroSection}>
            <View style={styles.iconLarge}>
              <Ionicons name="gift" size={40} color="#8B5CF6" />
            </View>
            <Text style={styles.packageName}>{package_.name}</Text>
            <Text style={styles.salonName}>{salonName}</Text>
          </View>

          {package_.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this package</Text>
              <Text style={styles.description}>{package_.description}</Text>
            </View>
          )}

          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Regular Price</Text>
              <Text style={styles.regularPrice}>₹{package_.regularPrice}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Package Price</Text>
              <Text style={styles.packagePrice}>₹{package_.packagePrice}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.savingsLabel}>Your Savings</Text>
              <View style={styles.savingsValue}>
                <Text style={styles.savingsAmount}>₹{package_.savings}</Text>
                <View style={styles.savingsPercentBadge}>
                  <Text style={styles.savingsPercent}>{package_.savingsPercentage}% OFF</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Services Included</Text>
              <Text style={styles.serviceCount}>
                {package_.services?.length || package_.serviceCount || 0} services
              </Text>
            </View>

            {package_.services?.map((service, index) => (
              <View key={service.id} style={styles.serviceItem}>
                <View style={styles.serviceIndex}>
                  <Text style={styles.serviceIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <View style={styles.serviceMeta}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" />
                    <Text style={styles.serviceMetaText}>{service.durationMinutes} min</Text>
                    <Text style={styles.serviceDot}>•</Text>
                    <Text style={styles.serviceMetaText}>{service.category}</Text>
                  </View>
                </View>
                <Text style={styles.servicePrice}>₹{service.price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#8B5CF6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Duration</Text>
                <Text style={styles.infoValue}>{package_.totalDurationMinutes} minutes</Text>
              </View>
            </View>
            {package_.validUntil && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Valid Until</Text>
                  <Text style={styles.infoValue}>
                    {new Date(package_.validUntil).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerPriceLabel}>Package Price</Text>
            <Text style={styles.footerPriceValue}>₹{package_.packagePrice}</Text>
          </View>
          <TouchableOpacity style={styles.bookButton} onPress={onBookPackage}>
            <Text style={styles.bookButtonText}>Book This Package</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  iconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  salonName: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  serviceCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  regularPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  savingsValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  savingsPercentBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  savingsPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serviceIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIndexText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
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
  serviceDot: {
    color: '#D1D5DB',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  footerPrice: {},
  footerPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  footerPriceValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
