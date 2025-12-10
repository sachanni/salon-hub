import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authAPI } from '../services/api';

const COUNTRIES = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', minLength: 10, maxLength: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', minLength: 10, maxLength: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', minLength: 10, maxLength: 10 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', minLength: 9, maxLength: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', minLength: 8, maxLength: 8 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', minLength: 9, maxLength: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', minLength: 10, maxLength: 10 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', minLength: 10, maxLength: 11 },
];

export default function MobileVerificationScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  const validatePhoneNumber = (number: string): boolean => {
    const len = number.length;
    return len >= selectedCountry.minLength && len <= selectedCountry.maxLength;
  };

  const handleRequestOTP = async () => {
    setErrors(null);

    if (!validatePhoneNumber(phoneNumber)) {
      setErrors(`Please enter a valid ${selectedCountry.minLength}-digit mobile number`);
      return;
    }

    setIsLoading(true);
    const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;

    try {
      await authAPI.requestOTP(fullPhone);
      
      router.push({
        pathname: '/onboarding/otp-verification',
        params: { phoneNumber: fullPhone },
      });
    } catch (error: any) {
      console.error('OTP request failed:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background Image Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
        
        {/* Logo Circle */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>SH</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Welcome Text */}
        <Text style={styles.welcomeTitle}>Welcome to SalonHub</Text>
        <Text style={styles.welcomeSubtitle}>Your beauty & wellness destination</Text>
      </View>

      {/* White Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Let's Get Started</Text>
            <Text style={styles.subtitle}>Enter your mobile number to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.phoneInputRow}>
              <TouchableOpacity 
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
                disabled={isLoading}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
              </TouchableOpacity>
              <TextInput
                style={[styles.phoneInput, errors && styles.inputError]}
                placeholder={`${selectedCountry.minLength} Digit Number`}
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={selectedCountry.maxLength}
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text.replace(/[^0-9]/g, ''));
                  setErrors(null);
                }}
                editable={!isLoading}
              />
            </View>
            {errors && <Text style={styles.errorText}>{errors}</Text>}

            <TouchableOpacity
              onPress={handleRequestOTP}
              disabled={isLoading}
              style={styles.buttonContainer}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Request OTP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer Terms */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <Text style={styles.termsText}>
              By continuing, you agree to our{'\n'}
              <Text style={styles.termsLink}>Terms of Services</Text>,{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text> &{' '}
              <Text style={styles.termsLink}>Content Policy</Text>.
            </Text>
          </View>
        </View>
      </View>
      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    selectedCountry.code === item.code && styles.countryItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCountry(item);
                    setPhoneNumber('');
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemDialCode}>{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroSection: {
    height: '50%',
    backgroundColor: '#1F2937',
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    marginBottom: 24,
    position: 'relative',
    zIndex: 20,
  },
  logoCircle: {
    width: 112,
    height: 112,
    backgroundColor: '#fff',
    borderRadius: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    position: 'relative',
    zIndex: 20,
  },
  formContainer: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    flex: 1,
    gap: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: -16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    padding: 0,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -16,
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  termsLink: {
    color: '#6B7280',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 6,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryDialCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  countryItemSelected: {
    backgroundColor: '#F3E8FF',
  },
  countryItemFlag: {
    fontSize: 24,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  countryItemDialCode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
