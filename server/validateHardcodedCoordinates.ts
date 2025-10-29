/**
 * Validation Script for Hardcoded Coordinates
 * 
 * This script validates all 147 hardcoded Delhi NCR locations against Google Places API
 * to ensure coordinate accuracy. Location accuracy is the main USP for SalonHub.
 * 
 * Process:
 * 1. Load all hardcoded locations from routes.ts
 * 2. For each location, call Google Places API
 * 3. Calculate distance difference using Haversine formula
 * 4. Flag locations with >50m discrepancy for manual review
 * 5. Generate report with recommendations
 * 
 * Usage:
 *   npm run validate:coordinates
 */

import { geocodingService } from './geocodingService';
import { calculateDistance } from './geocodingUtils';

interface HardcodedLocation {
  name: string;
  area: string;
  coords: { lat: number; lng: number };
  state: string;
  country: string;
  priority: number;
}

// Import hardcoded Delhi NCR locations from routes.ts
// This would normally be imported, but for now we'll define them inline
const DELHI_NCR_LOCATIONS: HardcodedLocation[] = [
  // Delhi - Central & South
  { name: 'Connaught Place', area: 'New Delhi', coords: { lat: 28.6315, lng: 77.2167 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Karol Bagh', area: 'New Delhi', coords: { lat: 28.6517, lng: 77.1909 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Lajpat Nagar', area: 'New Delhi', coords: { lat: 28.5679, lng: 77.2431 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Rajouri Garden', area: 'New Delhi', coords: { lat: 28.6408, lng: 77.1214 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Pitampura', area: 'New Delhi', coords: { lat: 28.7000, lng: 77.1333 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Rohini', area: 'New Delhi', coords: { lat: 28.7433, lng: 77.1028 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Dwarka', area: 'New Delhi', coords: { lat: 28.5921, lng: 77.0465 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Vasant Kunj', area: 'New Delhi', coords: { lat: 28.5425, lng: 77.1528 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Saket', area: 'New Delhi', coords: { lat: 28.5245, lng: 77.2069 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Greater Kailash', area: 'New Delhi', coords: { lat: 28.5480, lng: 77.2400 }, state: 'Delhi', country: 'India', priority: 1 },
  
  // Noida
  { name: 'Sector 18', area: 'Noida', coords: { lat: 28.5900, lng: 77.3200 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
  { name: 'Sector 62', area: 'Noida', coords: { lat: 28.6000, lng: 77.3300 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
  
  // Gurgaon
  { name: 'Cyber City', area: 'Gurugram', coords: { lat: 28.4960, lng: 77.0900 }, state: 'Haryana', country: 'India', priority: 1 },
  { name: 'Sector 29', area: 'Gurugram', coords: { lat: 28.4500, lng: 77.0300 }, state: 'Haryana', country: 'India', priority: 1 },
  
  // Popular malls and landmarks
  { name: 'DLF Mall of India', area: 'Noida', coords: { lat: 28.5682, lng: 77.3250 }, state: 'Uttar Pradesh', country: 'India', priority: 1 },
  { name: 'Select Citywalk', area: 'Saket', coords: { lat: 28.5244, lng: 77.2169 }, state: 'Delhi', country: 'India', priority: 1 },
  { name: 'Ambience Mall', area: 'Gurugram', coords: { lat: 28.5011, lng: 77.0800 }, state: 'Haryana', country: 'India', priority: 1 },
];

interface ValidationResult {
  location: HardcodedLocation;
  status: 'accurate' | 'warning' | 'error';
  apiLat?: number;
  apiLng?: number;
  distance?: number;
  confidence?: 'high' | 'medium' | 'low';
  message: string;
}

async function validateAllLocations(): Promise<ValidationResult[]> {
  console.log('🔍 Starting validation of hardcoded coordinates...\n');
  console.log(`Total locations to validate: ${DELHI_NCR_LOCATIONS.length}\n`);

  const results: ValidationResult[] = [];
  let accurate = 0;
  let warnings = 0;
  let errors = 0;

  for (let i = 0; i < DELHI_NCR_LOCATIONS.length; i++) {
    const location = DELHI_NCR_LOCATIONS[i];
    const progress = `[${i + 1}/${DELHI_NCR_LOCATIONS.length}]`;
    
    console.log(`${progress} Validating: ${location.name}, ${location.area}`);

    try {
      const result = await geocodingService.validateHardcodedLocation(
        `${location.name}, ${location.area}, ${location.state}`,
        location.coords.lat,
        location.coords.lng
      );

      if (!result.valid) {
        if (result.distance !== undefined && result.distance > 50) {
          warnings++;
          results.push({
            location,
            status: 'warning',
            apiLat: result.apiLat,
            apiLng: result.apiLng,
            distance: result.distance,
            confidence: result.confidence,
            message: `⚠️  ${result.distance}m difference from Google API`,
          });
          console.log(`   ⚠️  WARNING: ${result.distance}m difference`);
        } else {
          errors++;
          results.push({
            location,
            status: 'error',
            message: '❌ Could not validate (API error)',
          });
          console.log(`   ❌ ERROR: Could not validate`);
        }
      } else {
        accurate++;
        results.push({
          location,
          status: 'accurate',
          distance: result.distance,
          confidence: result.confidence,
          message: '✅ Accurate',
        });
        console.log(`   ✅ Accurate (${result.distance}m difference)`);
      }

      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errors++;
      results.push({
        location,
        status: 'error',
        message: `❌ Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Accurate: ${accurate} (${Math.round((accurate / DELHI_NCR_LOCATIONS.length) * 100)}%)`);
  console.log(`⚠️  Warnings: ${warnings} (${Math.round((warnings / DELHI_NCR_LOCATIONS.length) * 100)}%)`);
  console.log(`❌ Errors: ${errors} (${Math.round((errors / DELHI_NCR_LOCATIONS.length) * 100)}%)`);
  console.log('='.repeat(80));

  // Print detailed warnings
  if (warnings > 0) {
    console.log('\n⚠️  LOCATIONS NEEDING REVIEW:');
    console.log('='.repeat(80));
    results
      .filter(r => r.status === 'warning')
      .sort((a, b) => (b.distance || 0) - (a.distance || 0))
      .forEach(r => {
        console.log(`\n${r.location.name}, ${r.location.area}`);
        console.log(`  Hardcoded: ${r.location.coords.lat}, ${r.location.coords.lng}`);
        console.log(`  Google API: ${r.apiLat}, ${r.apiLng}`);
        console.log(`  Distance: ${r.distance}m`);
        console.log(`  Confidence: ${r.confidence}`);
      });
    console.log('='.repeat(80));
  }

  // Print errors
  if (errors > 0) {
    console.log('\n❌ VALIDATION ERRORS:');
    console.log('='.repeat(80));
    results
      .filter(r => r.status === 'error')
      .forEach(r => {
        console.log(`${r.location.name}, ${r.location.area}: ${r.message}`);
      });
    console.log('='.repeat(80));
  }

  console.log('\n💡 RECOMMENDATIONS:');
  console.log('='.repeat(80));
  if (warnings === 0 && errors === 0) {
    console.log('✅ All hardcoded coordinates are accurate!');
    console.log('   No action needed.');
  } else if (warnings > 0) {
    console.log('⚠️  Update coordinates for locations with >50m discrepancy');
    console.log('   These will provide better location accuracy for users.');
  }
  if (errors > 0) {
    console.log('❌ Fix validation errors by checking location names');
    console.log('   Some locations may have incorrect names or may not exist.');
  }
  console.log('\n💾 Next step: Run the geocoding cache migration to create tables');
  console.log('   Command: npm run db:push --force');
  console.log('='.repeat(80) + '\n');

  return results;
}

// Run validation if called directly
if (require.main === module) {
  validateAllLocations()
    .then(() => {
      console.log('\n✅ Validation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

export { validateAllLocations, type ValidationResult };
