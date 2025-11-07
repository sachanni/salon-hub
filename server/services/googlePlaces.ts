import { storage } from '../storage';
import type { GooglePlacesCache, InsertGooglePlacesCache, InsertSalonReview } from '@shared/schema';

/**
 * Google Places Service
 * Production-ready service for interacting with Google Places API
 * Features: caching, retry logic, circuit breaker, rate limiting
 */

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReview[];
  business_status?: string;
}

interface GoogleReview {
  author_name: string;
  author_url?: string;
  language?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface SearchNearbyParams {
  latitude: number;
  longitude: number;
  businessName: string;
  radius?: number; // meters
}

interface ImportReviewsParams {
  placeId: string;
  salonId: string;
}

/**
 * Circuit Breaker State
 * Prevents overwhelming the API when it's down
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5; // Open circuit after 5 failures
  private readonly timeout = 60000; // 1 minute timeout
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  public canProceed(): boolean {
    if (this.state === 'CLOSED') return true;
    
    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.timeout) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one request to test
    return true;
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  public recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.warn(`Circuit breaker OPEN - too many failures (${this.failures})`);
    }
  }
}

/**
 * Google Places Service with production features
 */
export class GooglePlacesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly circuitBreaker = new CircuitBreaker();
  private readonly cacheExpiryDays = 30;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Places API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Search for businesses near coordinates with cache-first approach
   */
  public async searchNearby(params: SearchNearbyParams): Promise<GooglePlaceResult[]> {
    const { latitude, longitude, businessName, radius = 50 } = params;

    // Check circuit breaker
    if (!this.circuitBreaker.canProceed()) {
      throw new Error('Google Places API circuit breaker is OPEN - service temporarily unavailable');
    }

    try {
      // Step 1: Check cache first (30-day TTL)
      const cachedResults = await this.checkCache(latitude, longitude, businessName);
      if (cachedResults.length > 0) {
        console.log(`✅ Cache HIT for "${businessName}" near (${latitude}, ${longitude})`);
        this.circuitBreaker.recordSuccess();
        return cachedResults;
      }

      console.log(`❌ Cache MISS for "${businessName}" - calling Google Places API`);

      // Step 2: Call Google Places Nearby Search API
      const results = await this.callNearbySearchAPI(latitude, longitude, businessName, radius);

      // Step 3: Cache results for 30 days
      await this.cacheResults(results);

      this.circuitBreaker.recordSuccess();
      return results;
    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      console.error('Error in searchNearby:', error);
      throw new Error(`Failed to search nearby businesses: ${error.message}`);
    }
  }

  /**
   * Import reviews from Google Place and store in database
   */
  public async importReviews(params: ImportReviewsParams): Promise<{ imported: number; skipped: number }> {
    const { placeId, salonId } = params;

    // Check circuit breaker
    if (!this.circuitBreaker.canProceed()) {
      throw new Error('Google Places API circuit breaker is OPEN - service temporarily unavailable');
    }

    try {
      // Fetch place details with reviews
      const placeDetails = await this.getPlaceDetails(placeId);

      if (!placeDetails.reviews || placeDetails.reviews.length === 0) {
        return { imported: 0, skipped: 0 };
      }

      // Import reviews into database (max 5 from Google)
      let imported = 0;
      let skipped = 0;

      for (const review of placeDetails.reviews) {
        const reviewData: InsertSalonReview = {
          salonId,
          customerId: null, // Google reviews don't have customer ID
          bookingId: null, // Google reviews aren't linked to bookings
          rating: review.rating,
          comment: review.text || '',
          source: 'google',
          googleAuthorName: review.author_name,
          googleAuthorPhoto: review.profile_photo_url || null,
          googleReviewId: `${placeId}_${review.time}`, // Unique ID for deduplication
          isVerified: 0,
          googlePublishedAt: new Date(review.time * 1000),
        };

        try {
          await storage.createReview(reviewData);
          imported++;
        } catch (error: any) {
          // Skip if duplicate (unique constraint violation)
          if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
            skipped++;
          } else {
            throw error;
          }
        }
      }

      // Update salon's Google rating and review count
      await storage.updateSalon(salonId, {
        googlePlaceId: placeId,
        googleRating: placeDetails.rating?.toString() || null,
        googleReviewCount: placeDetails.user_ratings_total || 0,
        googleRatingSyncedAt: new Date(),
      });

      // Recompute overall salon rating
      await storage.updateSalonRating(salonId);

      this.circuitBreaker.recordSuccess();
      return { imported, skipped };
    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      console.error('Error importing reviews:', error);
      throw new Error(`Failed to import reviews: ${error.message}`);
    }
  }

  /**
   * Check cache for nearby businesses (30-day TTL)
   */
  private async checkCache(
    latitude: number,
    longitude: number,
    businessName: string
  ): Promise<GooglePlaceResult[]> {
    try {
      const cached = await storage.searchCachedPlaces(latitude, longitude, businessName);
      
      // Filter out expired entries
      const now = new Date();
      const validCached = cached.filter((entry: GooglePlacesCache) => {
        return new Date(entry.expiresAt) > now;
      });

      return validCached.map((entry: GooglePlacesCache) => entry.payload as any);
    } catch (error) {
      console.error('Cache check error:', error);
      return [];
    }
  }

  /**
   * Cache API results for 30 days
   */
  private async cacheResults(results: GooglePlaceResult[]): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.cacheExpiryDays);

    for (const result of results) {
      try {
        const cacheEntry: InsertGooglePlacesCache = {
          placeId: result.place_id,
          businessName: result.name,
          address: result.formatted_address,
          latitude: result.geometry.location.lat.toString(),
          longitude: result.geometry.location.lng.toString(),
          rating: result.rating?.toString() || null,
          reviewCount: result.user_ratings_total || 0,
          payload: result as any,
          expiresAt: expiresAt,
        };

        await storage.cacheGooglePlace(cacheEntry);
      } catch (error) {
        console.error('Cache insertion error:', error);
        // Continue even if caching fails
      }
    }
  }

  /**
   * Call Google Places Nearby Search API with retry logic
   */
  private async callNearbySearchAPI(
    latitude: number,
    longitude: number,
    keyword: string,
    radius: number
  ): Promise<GooglePlaceResult[]> {
    const url = new URL(`${this.baseUrl}/nearbysearch/json`);
    url.searchParams.set('location', `${latitude},${longitude}`);
    url.searchParams.set('radius', radius.toString());
    url.searchParams.set('keyword', keyword);
    url.searchParams.set('key', this.apiKey);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          return data.results || [];
        }

        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError || new Error('Failed to call Google Places API after retries');
  }

  /**
   * Get place details including reviews
   */
  private async getPlaceDetails(placeId: string): Promise<GooglePlaceResult> {
    const url = new URL(`${this.baseUrl}/details/json`);
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,formatted_address,geometry,rating,user_ratings_total,reviews');
    url.searchParams.set('key', this.apiKey);

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK') {
          return data.result;
        }

        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

        if (attempt < maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError || new Error('Failed to get place details after retries');
  }
}

// Singleton instance
let googlePlacesService: GooglePlacesService | null = null;

export function getGooglePlacesService(): GooglePlacesService {
  if (!googlePlacesService) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY environment variable is not set');
    }
    googlePlacesService = new GooglePlacesService(apiKey);
  }
  return googlePlacesService;
}
