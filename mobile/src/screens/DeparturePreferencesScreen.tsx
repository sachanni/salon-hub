import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { departureAPI, DeparturePreferences } from '../services/api';

const REMINDER_TIMING_OPTIONS = [
  { value: '30_minutes', label: '30 minutes before' },
  { value: '60_minutes', label: '1 hour before' },
  { value: '90_minutes', label: '1.5 hours before' },
  { value: '2_hours', label: '2 hours before' },
] as const;

const LOCATION_OPTIONS = [
  { value: 'home', label: 'Home', icon: 'home-outline' },
  { value: 'office', label: 'Office', icon: 'briefcase-outline' },
  { value: 'ask_each_time', label: 'Ask each time', icon: 'help-circle-outline' },
] as const;

const CHANNEL_OPTIONS = [
  { value: 'push', label: 'Push Notification', icon: 'notifications-outline' },
  { value: 'sms', label: 'SMS', icon: 'chatbox-outline' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { value: 'all', label: 'All Channels', icon: 'radio-outline' },
] as const;

const BUFFER_OPTIONS = [5, 10, 15, 20, 30];

export default function DeparturePreferencesScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<DeparturePreferences>({
    receiveAlerts: true,
    defaultLocationLabel: 'home',
    preferredBufferMinutes: 15,
    reminderTimingPreference: '60_minutes',
    preferredChannel: 'push',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await departureAPI.getPreferences();
      if (response.success && response.preferences) {
        setPreferences(response.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = <K extends keyof DeparturePreferences>(
    key: K,
    value: DeparturePreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await departureAPI.updatePreferences(preferences);
      if (response.success) {
        setHasChanges(false);
        Alert.alert('Success', 'Your departure preferences have been saved.');
      } else {
        Alert.alert('Error', response.error || 'Failed to save preferences.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Departure Alerts</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Departure Alerts</Text>
        {hasChanges ? (
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#8B5CF6" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="car-outline" size={24} color="#8B5CF6" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Smart Departure Notifications</Text>
            <Text style={styles.infoText}>
              Get notified when it's time to leave for your appointment based on real-time queue status at the salon.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Departure Alerts</Text>
              <Text style={styles.settingDescription}>
                Receive smart notifications about when to leave
              </Text>
            </View>
            <Switch
              value={preferences.receiveAlerts}
              onValueChange={(value) => updatePreference('receiveAlerts', value)}
              trackColor={{ false: '#E5E7EB', true: '#DDD6FE' }}
              thumbColor={preferences.receiveAlerts ? '#8B5CF6' : '#9CA3AF'}
            />
          </View>
        </View>

        {preferences.receiveAlerts && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Departure Location</Text>
              <Text style={styles.sectionSubtitle}>
                Where should we calculate travel time from?
              </Text>
              <View style={styles.optionsContainer}>
                {LOCATION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      preferences.defaultLocationLabel === option.value && styles.optionCardActive,
                    ]}
                    onPress={() => updatePreference('defaultLocationLabel', option.value)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={preferences.defaultLocationLabel === option.value ? '#8B5CF6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        preferences.defaultLocationLabel === option.value && styles.optionLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {preferences.defaultLocationLabel === option.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminder Timing</Text>
              <Text style={styles.sectionSubtitle}>
                How far in advance should we send the first alert?
              </Text>
              <View style={styles.pillsContainer}>
                {REMINDER_TIMING_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.pill,
                      preferences.reminderTimingPreference === option.value && styles.pillActive,
                    ]}
                    onPress={() => updatePreference('reminderTimingPreference', option.value)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        preferences.reminderTimingPreference === option.value && styles.pillTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buffer Time</Text>
              <Text style={styles.sectionSubtitle}>
                Extra time added to your departure suggestion
              </Text>
              <View style={styles.pillsContainer}>
                {BUFFER_OPTIONS.map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.bufferPill,
                      preferences.preferredBufferMinutes === minutes && styles.pillActive,
                    ]}
                    onPress={() => updatePreference('preferredBufferMinutes', minutes)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        preferences.preferredBufferMinutes === minutes && styles.pillTextActive,
                      ]}
                    >
                      {minutes} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Channel</Text>
              <Text style={styles.sectionSubtitle}>
                How would you like to receive departure alerts?
              </Text>
              <View style={styles.optionsContainer}>
                {CHANNEL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionCard,
                      preferences.preferredChannel === option.value && styles.optionCardActive,
                    ]}
                    onPress={() => updatePreference('preferredChannel', option.value)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={preferences.preferredChannel === option.value ? '#8B5CF6' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.optionLabel,
                        preferences.preferredChannel === option.value && styles.optionLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {preferences.preferredChannel === option.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
              <Text style={styles.tipText}>
                Tip: We'll analyze your salon's queue status and notify you of the best time to leave, so you don't have to wait.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {hasChanges && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveButtonLarge}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Preferences</Text>
              </>
            )}
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
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  infoCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  optionCardActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#8B5CF6',
  },
  optionLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  optionLabelActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bufferPill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saveButtonLarge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
