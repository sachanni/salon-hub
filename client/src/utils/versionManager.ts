/**
 * Version Manager - Industry Standard localStorage Cache Busting
 * 
 * Handles localStorage versioning to prevent stale data issues:
 * - Clears old data on app updates
 * - Preserves critical user preferences
 * - Provides migration path for schema changes
 */

const APP_VERSION = '1.0.0'; // Increment this on breaking localStorage changes
const VERSION_KEY = 'app_version';
const LOCATION_VERSION = '1'; // Separate version for location data

// Keys that should be preserved across version updates
const PRESERVE_KEYS = [
  'selectedSalonId', // Business dashboard selection
  // Add other critical keys here
];

export class VersionManager {
  /**
   * Check version and handle cache invalidation
   * Call this on app initialization
   */
  static check(): void {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (!storedVersion) {
      // First time user - just set version
      this.setVersion();
      return;
    }

    if (storedVersion !== APP_VERSION) {
      console.log(`🔄 Version mismatch: ${storedVersion} → ${APP_VERSION}`);
      this.handleVersionMismatch();
    }
  }

  /**
   * Clear stale data while preserving critical keys
   */
  private static handleVersionMismatch(): void {
    // Save critical data
    const preserved: Record<string, string | null> = {};
    PRESERVE_KEYS.forEach(key => {
      preserved[key] = localStorage.getItem(key);
    });

    // Clear everything
    localStorage.clear();

    // Restore preserved data
    Object.entries(preserved).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value);
      }
    });

    // Set new version
    this.setVersion();
    
    console.log('✅ localStorage cleared and migrated to new version');
  }

  private static setVersion(): void {
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  }

  /**
   * Get versioned key for location data
   * Usage: localStorage.setItem(VersionManager.getLocationKey('search'), data)
   */
  static getLocationKey(type: 'search' | 'user'): string {
    return `${type}_location_v${LOCATION_VERSION}`;
  }

  /**
   * Get versioned key for recent searches
   */
  static getRecentSearchesKey(): string {
    return `recent_searches_v${LOCATION_VERSION}`;
  }

  /**
   * Clean up old versioned keys (garbage collection)
   */
  static cleanupOldVersions(): void {
    const oldLocationKeys = [
      'lastSearchLocation', // Old non-versioned key
      'user_location',      // Old non-versioned key
      'fresha-recent-searches', // Old key name
    ];

    oldLocationKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

/**
 * TTL-based storage for location data
 * Automatically expires after specified duration
 */
export interface LocationDataWithTTL {
  coords: { lat: number; lng: number };
  name?: string;
  timestamp: number;
  ttl: number; // milliseconds
}

export class LocationStorage {
  private static readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save location with TTL
   */
  static save(
    type: 'search' | 'user',
    coords: { lat: number; lng: number },
    name?: string,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const data: LocationDataWithTTL = {
      coords,
      name,
      timestamp: Date.now(),
      ttl
    };

    const key = VersionManager.getLocationKey(type);
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved ${type} location:`, coords, name || '');
  }

  /**
   * Get location if not expired
   */
  static get(type: 'search' | 'user'): LocationDataWithTTL | null {
    const key = VersionManager.getLocationKey(type);
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    try {
      const data: LocationDataWithTTL = JSON.parse(stored);
      const age = Date.now() - data.timestamp;

      // Check if expired
      if (age > data.ttl) {
        console.log(`⏰ ${type} location expired (${Math.round(age / 3600000)}h old)`);
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (e) {
      console.error('Failed to parse location data:', e);
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Clear location
   */
  static clear(type: 'search' | 'user'): void {
    const key = VersionManager.getLocationKey(type);
    localStorage.removeItem(key);
  }
}
