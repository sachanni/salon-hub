import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { login, completeOnboarding } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(27);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Start resend timer
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (value: string) => {
    const pastedOtp = value.slice(0, 4).split('');
    const newOtp = [...otp];

    pastedOtp.forEach((digit, index) => {
      if (index < 4 && /^\d$/.test(digit)) {
        newOtp[index] = digit;
      }
    });

    setOtp(newOtp);

    // Focus last filled input
    const lastIndex = Math.min(pastedOtp.length - 1, 3);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await authAPI.verifyOTP(phoneNumber, otpString);

      // Save user data with tokens and complete onboarding
      await login(response.user, response.accessToken, response.refreshToken);
      await completeOnboarding();

      // Navigate to home screen
      router.replace('/home');
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      Alert.alert(
        'Verification Failed',
        error.response?.data?.message || 'Invalid OTP. Please try again.'
      );
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setIsResending(true);

    try {
      await authAPI.resendOTP(phoneNumber);
      setResendTimer(27);
      Alert.alert('OTP Sent', 'A new verification code has been sent to your phone');
    } catch (error: any) {
      console.error('Resend OTP failed:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Ambient Background Blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />
      <View style={[styles.blob, styles.blob4]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>SH</Text>
            </LinearGradient>
            <View style={styles.decorativeDot} />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a 4-digit verification code to{'\n'}
            <Text style={styles.phoneNumber}>+91 {phoneNumber}</Text>
          </Text>
        </View>

        {/* OTP Inputs */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOTPChange(value.replace(/[^0-9]/g, ''), index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              onPaste={(e) => index === 0 && handlePaste(e.nativeEvent.data)}
            />
          ))}
        </View>
        <Text style={styles.otpHint}>Enter the code to verify your number</Text>

        {/* Verify Button */}
        <TouchableOpacity
          onPress={handleVerify}
          disabled={isVerifying}
          style={styles.verifyButton}
        >
          {isVerifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0 || isResending}
            style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}
          >
            {isResending ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <Text
                style={[styles.resendButtonText, resendTimer > 0 && styles.resendButtonTextDisabled]}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.footer}>
          <View style={styles.securityDivider} />
          <View style={styles.securityNote}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.securityText}>Your information is secure and encrypted</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.7,
  },
  blob1: {
    top: 0,
    right: 0,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    transform: [{ translateY: -128 }, { translateX: 64 }],
  },
  blob2: {
    top: 80,
    left: 0,
    width: 288,
    height: 288,
    backgroundColor: 'rgba(255, 251, 235, 0.8)',
    transform: [{ translateX: -128 }],
  },
  blob3: {
    bottom: 160,
    right: 40,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(240, 253, 250, 0.7)',
  },
  blob4: {
    bottom: 0,
    left: 40,
    width: 256,
    height: 256,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 32,
    position: 'relative',
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    backgroundColor: '#fff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
  },
  decorativeDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(236, 72, 153, 0.2)',
    borderRadius: 8,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    color: '#EC4899',
    fontWeight: '700',
    fontSize: 18,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  otpInput: {
    width: 64,
    height: 64,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  otpHint: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 32,
  },
  verifyButton: {
    backgroundColor: '#374151',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  resendButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  resendButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  resendButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  footer: {
    marginTop: 'auto',
  },
  securityDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 24,
  },
  securityNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  lockIcon: {
    fontSize: 12,
  },
  securityText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
});
