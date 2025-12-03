import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const { updatePermissions } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for bell icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Ring animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(ringAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    ).start();
  }, []);

  const handlePermission = async (action: 'allow' | 'deny') => {
    if (action === 'deny') {
      await updatePermissions({ notifications: 'denied' });
      router.push('/onboarding/mobile-verification');
      return;
    }

    setIsRequesting(true);

    try {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        await updatePermissions({ notifications: 'granted' });
        
        // Get push token for later use
        const token = await Notifications.getExpoPushTokenAsync();
        console.log('Push token:', token);
        
        router.push('/onboarding/mobile-verification');
      } else {
        Alert.alert(
          'Permission Denied',
          'You won\'t receive notifications about appointments and offers. You can change this in settings later.',
          [{ text: 'OK', onPress: () => router.push('/onboarding/mobile-verification') }]
        );
        await updatePermissions({ notifications: 'denied' });
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      Alert.alert('Error', 'Failed to request notification permission');
    } finally {
      setIsRequesting(false);
    }
  };

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.75, 0.3, 0],
  });

  return (
    <View style={styles.container}>
      {/* Background Carousel (Dimmed) */}
      <Image
        source={require('../assets/splash1.png')}
        style={styles.backgroundImage}
      />
      
      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      {/* Modal */}
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          {/* Bell Icon with Animation */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: ringScale }],
                  opacity: ringOpacity,
                },
              ]}
            />
            <View style={styles.iconBackground}>
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Text style={styles.bellIcon}>🔔</Text>
                </LinearGradient>
              </Animated.View>
            </View>
            <View style={styles.notificationBadge} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Don't Miss Out!</Text>

          {/* Description */}
          <Text style={styles.description}>
            Allow <Text style={styles.brandName}>SalonHub</Text> to send you notifications about
            appointment reminders, exclusive offers, and top salon deals near you.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => handlePermission('allow')}
              disabled={isRequesting}
              style={styles.primaryButtonContainer}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {isRequesting ? 'Requesting...' : 'Allow Notifications'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePermission('deny')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.4,
    resizeMode: 'cover',
  },
  darkOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    position: 'relative',
    zIndex: 50,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  iconBackground: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 30,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 36,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 16,
    height: 16,
    backgroundColor: '#EC4899',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  brandName: {
    fontWeight: '700',
    color: '#111827',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
