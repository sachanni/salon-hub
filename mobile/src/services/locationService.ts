import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coords: LocationCoords;
  city: string;
  area: string;
  fullAddress: string;
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'LOCATION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private cachedLocation: LocationData | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Request location permissions with user-friendly prompts
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'SalonHub needs your location to show nearby salons and services. Please enable location access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  /**
   * Get current location with timeout and error handling
   */
  async getCurrentLocation(): Promise<LocationData> {
    // Return cached location if still valid
    if (this.cachedLocation && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cachedLocation;
    }

    // Check permissions first
    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw this.createError('PERMISSION_DENIED', 'Location permission denied');
      }
    }

    try {
      // Get location with timeout
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(this.createError('TIMEOUT', 'Location request timed out')), 15000);
      });

      const position = await Promise.race([locationPromise, timeoutPromise]);

      // Reverse geocode to get address
      const address = await this.reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );

      const locationData: LocationData = {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        city: address.city,
        area: address.area,
        fullAddress: address.fullAddress,
      };

      // Cache the location
      this.cachedLocation = locationData;
      this.cacheTimestamp = Date.now();

      return locationData;
    } catch (error: any) {
      if (error.code) {
        throw error; // Already formatted error
      }
      
      console.error('Error getting current location:', error);
      throw this.createError('LOCATION_UNAVAILABLE', 'Unable to get your location. Please check your GPS settings.');
    }
  }

  /**
   * Reverse geocode coordinates to human-readable address
   */
  private async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ city: string; area: string; fullAddress: string }> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const address = results[0];
        const city = address.city || address.subregion || address.region || 'Unknown City';
        const area = address.district || address.subregion || address.name || '';
        const country = address.country || '';

        const fullAddress = [area, city, country].filter(Boolean).join(', ');

        return { city, area, fullAddress };
      }

      return {
        city: 'Unknown Location',
        area: '',
        fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return {
        city: 'Unknown Location',
        area: '',
        fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      };
    }
  }

  /**
   * Watch for location changes (useful for real-time tracking)
   */
  async watchLocation(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: LocationError) => void
  ): Promise<void> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          onError?.(this.createError('PERMISSION_DENIED', 'Location permission denied'));
          return;
        }
      }

      // Stop any existing watch
      this.stopWatchingLocation();

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Or when user moves 100 meters
        },
        async (position) => {
          try {
            const address = await this.reverseGeocode(
              position.coords.latitude,
              position.coords.longitude
            );

            const locationData: LocationData = {
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
              city: address.city,
              area: address.area,
              fullAddress: address.fullAddress,
            };

            // Update cache
            this.cachedLocation = locationData;
            this.cacheTimestamp = Date.now();

            onLocationUpdate(locationData);
          } catch (error) {
            console.error('Error processing location update:', error);
            onError?.(this.createError('UNKNOWN', 'Error processing location update'));
          }
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      onError?.(this.createError('LOCATION_UNAVAILABLE', 'Unable to watch location'));
    }
  }

  /**
   * Stop watching location changes
   */
  stopWatchingLocation(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  /**
   * Clear cached location data
   */
  clearCache(): void {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create formatted error object
   */
  private createError(
    code: LocationError['code'],
    message: string
  ): LocationError {
    return { code, message };
  }

  /**
   * Get fallback location (default to major city if GPS fails)
   */
  getFallbackLocation(): LocationData {
    return {
      coords: {
        latitude: 28.7041, // Delhi coordinates as fallback
        longitude: 77.1025,
      },
      city: 'Delhi',
      area: 'India',
      fullAddress: 'Delhi, India',
    };
  }
}

export const locationService = new LocationService();
