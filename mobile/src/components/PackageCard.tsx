import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServicePackage } from '../types/navigation';

const { width } = Dimensions.get('window');

interface PackageCardProps {
  package_: ServicePackage;
  onPress: () => void;
}

export default function PackageCard({ package_, onPress }: PackageCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={24} color="#8B5CF6" />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.packageName} numberOfLines={2}>{package_.name}</Text>
          {package_.serviceCount && (
            <Text style={styles.serviceCount}>
              {package_.serviceCount} service{package_.serviceCount > 1 ? 's' : ''} included
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      {package_.description && (
        <Text style={styles.description} numberOfLines={2}>
          {package_.description}
        </Text>
      )}

      <View style={styles.priceRow}>
        <View style={styles.priceContainer}>
          <Text style={styles.packagePrice}>₹{package_.packagePrice}</Text>
          <Text style={styles.regularPrice}>₹{package_.regularPrice}</Text>
        </View>
        <View style={styles.savingsBadge}>
          <Ionicons name="pricetag" size={12} color="#059669" />
          <Text style={styles.savingsText}>Save {package_.savingsPercentage}%</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.durationContainer}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.durationText}>{package_.totalDurationMinutes} min</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={onPress}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  regularPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 13,
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
