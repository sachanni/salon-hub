import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('appLanguage');
      if (saved) {
        setSelectedLanguage(saved);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const handleSelectLanguage = async (code: string) => {
    try {
      setSelectedLanguage(code);
      await AsyncStorage.setItem('appLanguage', code);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Select App Language</Text>
        <Text style={styles.sectionSubtitle}>
          Choose your preferred language for the app interface
        </Text>

        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                selectedLanguage === language.code && styles.languageItemSelected,
              ]}
              onPress={() => handleSelectLanguage(language.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.code && styles.languageNameSelected,
                ]}>
                  {language.name}
                </Text>
                <Text style={styles.languageNative}>{language.nativeName}</Text>
              </View>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteSection}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.noteText}>
            Language support for content may vary. Interface elements will be translated where available.
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  languageList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  languageItemSelected: {
    backgroundColor: '#F5F3FF',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
