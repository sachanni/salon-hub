/**
 * Production-Grade Geocoding Service
 * 
 * Implements place_id-based canonical caching to ensure location accuracy.
 * Prevents duplicate coordinates for same location with different search keywords.
 * 
 * Flow:
 * 1. Normalize search query
 * 2. Check location_aliases table
 * 3. If found → Fetch from geocode_locations (cache hit)
 * 4. If not found → Call Google Places API (cache miss)
 * 5. Save canonical location + Create alias mapping
 * 
 * This ensures "DLF Mall", "DLF Mall of India", "dlf mall noida" all return
 * the SAME accurate coordinates from ONE canonical record.
 */

import { storage } from './storage';
import {
  normalizeAddress,
  hashAddress,
  getConfidenceLevel,
  getExpirationDate,
  isValidCoordinate,
  calculateDistance,
  generateAliases,
  formatCoordinate,
} from './geocodingUtils';

export interface GeocodingResult {
  placeId: string | null;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  locationType?: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  viewport?: any;
  cacheHit: boolean;
}

export class GeocodingService {
  /**
   * Main geocoding method - checks cache first, falls back to API
   */
  async geocodeAddress(
    address: string,
    options?: {
      lat?: number;
      lng?: number;
      countrycode?: string;
    }
  ): Promise<GeocodingResult | null> {
    try {
      // Step 1: Normalize the query
      const normalized = normalizeAddress(address);
      
      if (normalized.length < 2) {
        return null;
      }

      // Step 2: Check alias table
      const alias = await this.findAlias(normalized);
      
      if (alias) {
        // Step 3: Fetch canonical location from cache
        const cached = await this.getCachedLocation(alias.placeId);
        
        if (cached) {
          // Update usage count
          await this.incrementUsageCount(alias.placeId, normalized);
          
          return {
            ...cached,
            cacheHit: true,
          };
        }
      }

      // Step 4: Cache miss - call Google Places API
      const apiResult = await this.callGeocodingAPI(address, options);
      
      if (!apiResult) {
        return null;
      }

      // Step 5: Save to cache
      await this.saveToCache(apiResult, normalized, address);
      
      return {
        ...apiResult,
        cacheHit: false,
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Find alias mapping for normalized query
   */
  private async findAlias(normalizedQuery: string): Promise<{ placeId: string } | null> {
    try {
      const alias = await storage.findLocationAlias(normalizedQuery);
      return alias;
    } catch (error) {
      console.error('Error finding alias:', error);
      return null;
    }
  }

  /**
   * Get cached location by place_id (checks TTL)
   */
  private async getCachedLocation(placeId: string): Promise<GeocodingResult | null> {
    try {
      const cached = await storage.getGeocodeLocation(placeId);
      
      if (!cached) {
        return null;
      }

      // Check if cache is still valid
      const now = new Date();
      const expiresAt = new Date(cached.expiresAt);
      
      if (expiresAt < now) {
        console.log(`Cache expired for place_id: ${placeId}`);
        return null; // Cache expired
      }

      return {
        placeId: cached.placeId || null,
        formattedAddress: cached.formattedAddress,
        latitude: parseFloat(cached.latitude as string),
        longitude: parseFloat(cached.longitude as string),
        locationType: cached.locationType || undefined,
        confidence: cached.confidence as 'high' | 'medium' | 'low',
        source: cached.source,
        viewport: cached.viewport || undefined,
        cacheHit: true,
      };
    } catch (error) {
      console.error('Error getting cached location:', error);
      return null;
    }
  }

  /**
   * Call Google Places API (with fallbacks)
   */
  private async callGeocodingAPI(
    address: string,
    options?: { lat?: number; lng?: number; countrycode?: string }
  ): Promise<GeocodingResult | null> {
    const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!googlePlacesKey) {
      console.log('Google Places API key not configured');
      return null;
    }

    try {
      // Build Google Places API request
      const params = new URLSearchParams({
        input: address,
        key: googlePlacesKey,
      });

      if (options?.lat && options?.lng) {
        params.append('location', `${options.lat},${options.lng}`);
        params.append('radius', '50000'); // 50km radius
      }

      if (options?.countrycode) {
        params.append('components', `country:${options.countrycode}`);
      }

      // Call Google Places Autocomplete API
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
      const autocompleteResponse = await fetch(autocompleteUrl);
      const autocompleteData = await autocompleteResponse.json();

      if (autocompleteData.status !== 'OK' || !autocompleteData.predictions?.[0]) {
        console.log(`Google Places API returned: ${autocompleteData.status}`);
        return null;
      }

      // Get place details for exact coordinates
      const placeId = autocompleteData.predictions[0].place_id;
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${googlePlacesKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status !== 'OK' || !detailsData.result) {
        return null;
      }

      const result = detailsData.result;
      const location = result.geometry?.location;

      if (!location || !isValidCoordinate(location.lat, location.lng)) {
        return null;
      }

      const locationType = result.geometry?.location_type;
      const confidence = getConfidenceLevel(locationType);

      return {
        placeId: placeId,
        formattedAddress: result.formatted_address,
        latitude: formatCoordinate(location.lat),
        longitude: formatCoordinate(location.lng),
        locationType: locationType,
        confidence: confidence,
        source: 'google_places',
        viewport: result.geometry?.viewport,
        cacheHit: false,
      };
    } catch (error) {
      console.error('Google Places API error:', error);
      return null;
    }
  }

  /**
   * Save geocoding result to cache (canonical location + aliases)
   */
  private async saveToCache(
    result: GeocodingResult,
    normalizedQuery: string,
    originalQuery: string
  ): Promise<void> {
    try {
      if (!result.placeId) {
        return; // Can't cache without place_id
      }

      const hash = hashAddress(result.formattedAddress);
      const expiresAt = getExpirationDate(result.confidence);

      // Save canonical location
      await storage.upsertGeocodeLocation({
        placeId: result.placeId,
        formattedAddress: result.formattedAddress,
        normalizedHash: hash,
        latitude: result.latitude.toString(),
        longitude: result.longitude.toString(),
        viewport: result.viewport,
        locationType: result.locationType || null,
        confidence: result.confidence,
        source: result.source,
        rawResponse: result,
        verifiedAt: new Date(),
        expiresAt: expiresAt,
        needsReview: result.confidence === 'low' ? 1 : 0,
        usageCount: 1,
      });

      // Create alias for the search query
      await storage.createLocationAlias({
        normalizedQuery: normalizedQuery,
        originalQuery: originalQuery,
        placeId: result.placeId,
        matchType: 'exact',
        usageCount: 1,
        locale: 'en',
      });

      // Generate and save common aliases
      const aliases = generateAliases(result.formattedAddress);
      for (const alias of aliases) {
        if (alias !== normalizedQuery) {
          await storage.createLocationAlias({
            normalizedQuery: alias,
            originalQuery: alias,
            placeId: result.placeId,
            matchType: 'alias',
            usageCount: 0,
            locale: 'en',
          }).catch(() => {}); // Ignore duplicates
        }
      }

      console.log(`✅ Cached location: ${result.formattedAddress} (${result.placeId})`);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  /**
   * Increment usage count for popular locations
   */
  private async incrementUsageCount(placeId: string, normalizedQuery: string): Promise<void> {
    try {
      await storage.incrementLocationUsage(placeId, normalizedQuery);
    } catch (error) {
      console.error('Error incrementing usage count:', error);
    }
  }

  /**
   * Validate hardcoded coordinates against Google Places API
   * Returns distance difference in meters
   */
  async validateHardcodedLocation(
    name: string,
    hardcodedLat: number,
    hardcodedLng: number
  ): Promise<{
    valid: boolean;
    apiLat?: number;
    apiLng?: number;
    distance?: number;
    confidence?: 'high' | 'medium' | 'low';
  }> {
    try {
      const result = await this.callGeocodingAPI(name);
      
      if (!result) {
        return { valid: false };
      }

      const distance = calculateDistance(
        hardcodedLat,
        hardcodedLng,
        result.latitude,
        result.longitude
      );

      // Threshold: 50 meters (typical GPS accuracy)
      const isValid = distance <= 50;

      if (!isValid) {
        console.warn(`⚠️ ${name}: ${Math.round(distance)}m difference from API`);
      }

      return {
        valid: isValid,
        apiLat: result.latitude,
        apiLng: result.longitude,
        distance: Math.round(distance),
        confidence: result.confidence,
      };
    } catch (error) {
      console.error(`Error validating ${name}:`, error);
      return { valid: false };
    }
  }

  /**
   * Reverse geocoding: coordinates → address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
    try {
      if (!isValidCoordinate(lat, lng)) {
        return null;
      }

      // Check if we have this location cached
      const cached = await storage.findLocationByCoordinates(lat, lng, 50); // 50m radius
      
      if (cached) {
        return {
          placeId: cached.placeId || null,
          formattedAddress: cached.formattedAddress,
          latitude: parseFloat(cached.latitude as string),
          longitude: parseFloat(cached.longitude as string),
          locationType: cached.locationType || undefined,
          confidence: cached.confidence as 'high' | 'medium' | 'low',
          source: cached.source,
          cacheHit: true,
        };
      }

      // Call Google Geocoding API
      const googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!googlePlacesKey) {
        return null;
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googlePlacesKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.[0]) {
        return null;
      }

      const result = data.results[0];
      const location = result.geometry?.location;
      const locationType = result.geometry?.location_type;
      const confidence = getConfidenceLevel(locationType);

      const geocodingResult: GeocodingResult = {
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        latitude: formatCoordinate(location.lat),
        longitude: formatCoordinate(location.lng),
        locationType: locationType,
        confidence: confidence,
        source: 'google_places',
        viewport: result.geometry?.viewport,
        cacheHit: false,
      };

      // Cache the reverse geocoding result
      await this.saveToCache(
        geocodingResult,
        normalizeAddress(`${lat},${lng}`),
        `${lat},${lng}`
      );

      return geocodingResult;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }
}

// Singleton instance
export const geocodingService = new GeocodingService();
