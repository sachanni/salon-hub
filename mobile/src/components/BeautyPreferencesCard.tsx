import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { beautyProfileAPI, BookingSummary } from '../services/api';

interface BeautyPreferencesCardProps {
  salonId: string;
  onPress?: () => void;
}

export default function BeautyPreferencesCard({ salonId, onPress }: BeautyPreferencesCardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [salonId]);

  const fetchSummary = async () => {
    try {
      setError(false);
      const response = await beautyProfileAPI.getBookingSummary(salonId);
      if (response.success && response.summary) {
        setSummary(response.summary);
      }
    } catch (err) {
      console.error('Error fetching booking summary:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#8B5CF6" />
      </View>
    );
  }

  if (error || !summary || (!summary.hairProfile && !summary.skinProfile && !summary.allergies?.length && !summary.preferences)) {
    return null;
  }

  const hasHairProfile = summary.hairProfile?.type || summary.hairProfile?.texture || summary.hairProfile?.color;
  const hasSkinProfile = summary.skinProfile?.type || summary.skinProfile?.tone || (summary.skinProfile?.concerns?.length || 0) > 0;
  const hasAllergies = (summary.allergies?.length || 0) > 0;
  const hasPreferences = summary.preferences?.beverage || summary.preferences?.music || summary.preferences?.communication;

  const handlePress = () => {
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={16} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.title}>Your Beauty Profile</Text>
            <Text style={styles.subtitle}>Preferences on file for this salon</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={handlePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6B7280" 
          />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.content}>
          {hasHairProfile && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="brush-outline" size={14} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Hair</Text>
              </View>
              <View style={styles.badges}>
                {summary.hairProfile?.type && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{summary.hairProfile.type}</Text>
                  </View>
                )}
                {summary.hairProfile?.texture && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{summary.hairProfile.texture}</Text>
                  </View>
                )}
                {summary.hairProfile?.color && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{summary.hairProfile.color}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {hasSkinProfile && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="happy-outline" size={14} color="#EC4899" />
                <Text style={styles.sectionTitle}>Skin</Text>
              </View>
              <View style={styles.badges}>
                {summary.skinProfile?.type && (
                  <View style={[styles.badge, styles.badgePink]}>
                    <Text style={[styles.badgeText, styles.badgeTextPink]}>{summary.skinProfile.type}</Text>
                  </View>
                )}
                {summary.skinProfile?.tone && (
                  <View style={[styles.badge, styles.badgePink]}>
                    <Text style={[styles.badgeText, styles.badgeTextPink]}>{summary.skinProfile.tone}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {hasAllergies && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="warning-outline" size={14} color="#EF4444" />
                <Text style={styles.sectionTitle}>Allergies</Text>
              </View>
              <View style={styles.badges}>
                {summary.allergies?.map((allergy, index) => (
                  <View key={index} style={[styles.badge, styles.badgeRed]}>
                    <Text style={[styles.badgeText, styles.badgeTextRed]}>{allergy}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {hasPreferences && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="heart-outline" size={14} color="#10B981" />
                <Text style={styles.sectionTitle}>Preferences</Text>
              </View>
              <View style={styles.preferencesList}>
                {summary.preferences?.beverage && (
                  <View style={styles.preferenceRow}>
                    <Ionicons name="cafe-outline" size={12} color="#6B7280" />
                    <Text style={styles.preferenceText}>{summary.preferences.beverage}</Text>
                  </View>
                )}
                {summary.preferences?.music && (
                  <View style={styles.preferenceRow}>
                    <Ionicons name="musical-notes-outline" size={12} color="#6B7280" />
                    <Text style={styles.preferenceText}>{summary.preferences.music}</Text>
                  </View>
                )}
                {summary.preferences?.communication && (
                  <View style={styles.preferenceRow}>
                    <Ionicons name="chatbubbles-outline" size={12} color="#6B7280" />
                    <Text style={styles.preferenceText}>{summary.preferences.communication}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {summary.additionalNotes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{summary.additionalNotes}</Text>
            </View>
          )}

          {onPress && (
            <TouchableOpacity style={styles.editButton} onPress={onPress}>
              <Ionicons name="create-outline" size={14} color="#8B5CF6" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  badgePink: {
    backgroundColor: '#FDF2F8',
  },
  badgeTextPink: {
    color: '#EC4899',
  },
  badgeRed: {
    backgroundColor: '#FEF2F2',
  },
  badgeTextRed: {
    color: '#EF4444',
  },
  preferencesList: {
    gap: 6,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preferenceText: {
    fontSize: 12,
    color: '#4B5563',
  },
  notesSection: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B5CF6',
  },
});
