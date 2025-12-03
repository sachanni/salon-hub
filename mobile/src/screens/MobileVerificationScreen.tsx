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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';

export default function MobileVerificationScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  const validatePhoneNumber = (number: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(number);
  };

  const handleRequestOTP = async () => {
    setErrors(null);

    if (!validatePhoneNumber(phoneNumber)) {
      setErrors('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.requestOTP(phoneNumber);
      
      // Navigate to OTP screen
      router.push({
        pathname: '/onboarding/otp-verification',
        params: { phoneNumber },
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
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                style={[styles.input, errors && styles.inputError]}
                placeholder="10 Digit Mobile Number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
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
});
