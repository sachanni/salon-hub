import crypto from 'crypto';

/**
 * Address normalization utilities for geocoding cache system
 * Ensures consistent keyword matching across search variations
 */

/**
 * Normalize a search query for consistent cache lookups
 * Handles: "DLF Mall" vs "DLF Mall of India" vs "dlf mall india"
 */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

/**
 * Generate MD5 hash of normalized address for deduplication
 * Used to detect duplicate locations from different sources
 */
export function hashAddress(address: string): string {
  const normalized = normalizeAddress(address);
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Determine confidence level based on Google's location_type
 * Used for precision tracking and quality control
 */
export function getConfidenceLevel(locationType: string | undefined): 'high' | 'medium' | 'low' {
  if (!locationType) return 'low';
  
  switch (locationType.toUpperCase()) {
    case 'ROOFTOP':
      return 'high'; // Most precise - actual building
    case 'RANGE_INTERPOLATED':
    case 'GEOMETRIC_CENTER':
      return 'medium'; // Approximate location
    case 'APPROXIMATE':
    default:
      return 'low'; // City/region level only
  }
}

/**
 * Calculate TTL (time-to-live) in days based on precision
 * High precision = longer cache (90 days)
 * Low precision = shorter cache (30 days)
 */
export function calculateTTL(confidence: 'high' | 'medium' | 'low'): number {
  switch (confidence) {
    case 'high':
      return 90; // ROOFTOP precision - keep longer
    case 'medium':
      return 60; // Interpolated - medium duration
    case 'low':
      return 30; // Approximate - refresh sooner
  }
}

/**
 * Calculate expiration date based on confidence level
 */
export function getExpirationDate(confidence: 'high' | 'medium' | 'low'): Date {
  const ttlDays = calculateTTL(confidence);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);
  return expiresAt;
}

/**
 * Validate coordinates are within reasonable bounds
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculate distance between two coordinates in meters
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if two coordinates are essentially the same location
 * Threshold: 50 meters (typical GPS accuracy)
 */
export function isSameLocation(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  thresholdMeters: number = 50
): boolean {
  const distance = calculateDistance(lat1, lng1, lat2, lng2);
  return distance <= thresholdMeters;
}

/**
 * Extract popular abbreviations and variations from address
 * Examples: "Connaught Place" → ["cp", "connaught place", "connaught"]
 */
export function generateAliases(address: string): string[] {
  const normalized = normalizeAddress(address);
  const aliases: string[] = [normalized];
  
  // Common abbreviations for Delhi NCR
  const abbreviations: Record<string, string[]> = {
    'connaught place': ['cp', 'connaught', 'cp delhi'],
    'dlf mall of india': ['dlf mall', 'mall of india', 'dlf noida'],
    'cyber city': ['cybercity', 'cyber hub', 'dlf cyber city'],
    'select citywalk': ['select city', 'citywalk', 'saket mall'],
    'greater noida': ['gr noida', 'greater noida'],
    'gurgaon': ['gurugram', 'ggn'],
  };
  
  // Check if address matches any known abbreviations
  for (const [full, abbrevs] of Object.entries(abbreviations)) {
    if (normalized.includes(full)) {
      aliases.push(...abbrevs.map(a => normalizeAddress(a)));
    }
  }
  
  return Array.from(new Set(aliases)); // Remove duplicates
}

/**
 * Format coordinates to consistent precision (8 decimal places = 1.1mm)
 */
export function formatCoordinate(coord: number): number {
  return parseFloat(coord.toFixed(8));
}
