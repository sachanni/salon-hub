import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface StylistPreferencesBadgeProps {
  stylistName?: string;
  compact?: boolean;
}

export const StylistPreferencesBadge: React.FC<StylistPreferencesBadgeProps> = ({
  stylistName,
  compact = false,
}) => {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="heart" size={12} color="#EC4899" />
        <Text style={styles.compactText}>Preferences saved</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={20} color="#8B5CF6" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>
          {stylistName ? `${stylistName} knows your preferences` : 'Your stylist knows your preferences'}
        </Text>
        <Text style={styles.subtitle}>
          Hair type, allergies & favorites on file
        </Text>
      </View>
      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#EC4899',
  },
});

export default StylistPreferencesBadge;
