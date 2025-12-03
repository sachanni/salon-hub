import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

type LocationPrecision = 'precise' | 'approximate';
type PermissionType = 'while-using' | 'once' | 'deny';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const { updatePermissions } = useAuth();
  const [selectedPrecision, setSelectedPrecision] = useState<LocationPrecision>('precise');
  const [isRequesting, setIsRequesting] = useState(false);

  const handlePermissionRequest = async (type: PermissionType) => {
    if (type === 'deny') {
      await updatePermissions({ location: 'denied', locationPrecision: selectedPrecision });
      router.push('/onboarding/notification');
      return;
    }

    setIsRequesting(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        await updatePermissions({ location: 'granted', locationPrecision: selectedPrecision });
        
        // Get current location to cache it
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: selectedPrecision === 'precise' 
              ? Location.Accuracy.High 
              : Location.Accuracy.Balanced,
          });
          console.log('Location obtained:', location.coords);
        } catch (error) {
          console.error('Failed to get location:', error);
        }
        
        router.push('/onboarding/notification');
      } else {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to find salons near you. You can change this in settings later.',
          [{ text: 'OK', onPress: () => router.push('/onboarding/notification') }]
        );
        await updatePermissions({ location: 'denied', locationPrecision: selectedPrecision });
      }
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Failed to request location permission');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Map */}
      <Image
        source={require('../assets/map-bg.png')}
        style={styles.backgroundMap}
      />
      
      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      {/* Content Card */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          {/* Floating Icon */}
          <View style={styles.floatingIconContainer}>
            <View style={styles.iconBackground}>
              <View style={styles.pulseRing} />
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Text style={styles.iconText}>📍</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Allow <Text style={styles.brandName}>SalonHub</Text> to access this device's location?
            </Text>
            <Text style={styles.subtitle}>
              We use your location to find the nearest top-rated salons and exclusive offers around you.
            </Text>
          </View>

          {/* Precision Selection */}
          <View style={styles.precisionContainer}>
            <TouchableOpacity
              onPress={() => setSelectedPrecision('precise')}
              style={[
                styles.precisionOption,
                selectedPrecision === 'precise' && styles.precisionOptionActive,
              ]}
            >
              <View style={styles.mapPreview}>
                <Image
                  source={require('../assets/precise-map.png')}
                  style={styles.mapImage}
                />
                <View style={styles.preciseOverlay}>
                  <View style={styles.preciseDot} />
                </View>
              </View>
              <Text
                style={[
                  styles.precisionLabel,
                  selectedPrecision === 'precise' && styles.precisionLabelActive,
                ]}
              >
                Precise
              </Text>
              {selectedPrecision === 'precise' && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPrecision('approximate')}
              style={[
                styles.precisionOption,
                selectedPrecision === 'approximate' && styles.precisionOptionActive,
              ]}
            >
              <View style={styles.mapPreview}>
                <Image
                  source={require('../assets/approximate-map.png')}
                  style={[styles.mapImage, styles.mapImageFaded]}
                />
                <View style={styles.approximateOverlay}>
                  <View style={styles.approximateCircle} />
                </View>
              </View>
              <Text
                style={[
                  styles.precisionLabel,
                  selectedPrecision === 'approximate' && styles.precisionLabelActive,
                ]}
              >
                Approximate
              </Text>
              {selectedPrecision === 'approximate' && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() => handlePermissionRequest('while-using')}
              style={styles.primaryButton}
              disabled={isRequesting}
            >
              <Text style={styles.primaryButtonText}>
                {isRequesting ? 'Requesting...' : 'While using the app'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePermissionRequest('once')}
              style={styles.secondaryButton}
              disabled={isRequesting}
            >
              <Text style={styles.secondaryButtonText}>Only this time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePermissionRequest('deny')}
              style={styles.textButton}
            >
              <Text style={styles.textButtonText}>Don't allow</Text>
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
    backgroundColor: '#1F2937',
  },
  backgroundMap: {
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
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 10,
  },
  floatingIconContainer: {
    alignItems: 'center',
    marginTop: -48,
    marginBottom: 16,
    position: 'relative',
    zIndex: 30,
  },
  iconBackground: {
    width: 64,
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    // Animation would be added via Animated API
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 30,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  brandName: {
    color: '#8B5CF6',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  precisionContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
    justifyContent: 'center',
  },
  precisionOption: {
    width: 144,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  precisionOptionActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  mapPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapImageFaded: {
    opacity: 0.7,
  },
  preciseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preciseDot: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approximateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approximateCircle: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  precisionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  precisionLabelActive: {
    color: '#8B5CF6',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  buttonsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  textButton: {
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
