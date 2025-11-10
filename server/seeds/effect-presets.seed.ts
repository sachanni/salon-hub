import { db } from '../db';
import { effectPresets } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Canonical AR effect presets matching Gemini AI categories
const CANONICAL_PRESETS = [
  // Makeup effects
  { slug: 'makeup_natural', name: 'Natural Glow', category: 'makeup', deepar_effect_file: 'natural-glow.deepar', look_tags: 'natural,subtle,everyday' },
  { slug: 'makeup_glamorous', name: 'Cat Eye Glam', category: 'makeup', deepar_effect_file: 'cat-eye.deepar', look_tags: 'glamorous,dramatic,evening' },
  { slug: 'makeup_bridal', name: 'Soft Bridal', category: 'makeup', deepar_effect_file: 'soft-bridal.deepar', look_tags: 'bridal,elegant,romantic' },
  { slug: 'makeup_party', name: 'Festival Glitter', category: 'makeup', deepar_effect_file: 'festival-glitter.deepar', look_tags: 'party,bold,fun' },
  { slug: 'makeup_smokey', name: 'Smokey Eye', category: 'makeup', deepar_effect_file: 'smokey-eye.deepar', look_tags: 'smokey,sultry,nighttime' },

  // Hair color effects
  { slug: 'hair_brown', name: 'Rich Brown Hair', category: 'hairstyle', deepar_effect_file: 'hair-brown.deepar', look_tags: 'brown,natural,warm' },
  { slug: 'hair_blonde', name: 'Golden Blonde Hair', category: 'hairstyle', deepar_effect_file: 'hair-blonde.deepar', look_tags: 'blonde,bright,sun-kissed' },
  { slug: 'hair_red', name: 'Auburn Red Hair', category: 'hairstyle', deepar_effect_file: 'hair-red.deepar', look_tags: 'red,bold,fiery' },
  { slug: 'hair_black', name: 'Jet Black Hair', category: 'hairstyle', deepar_effect_file: 'hair-black.deepar', look_tags: 'black,classic,sleek' },
  { slug: 'hair_highlights', name: 'Caramel Highlights', category: 'hairstyle', deepar_effect_file: 'hair-highlights.deepar', look_tags: 'highlights,dimensional,trendy' },
  { slug: 'hair_ombre', name: 'Ombre Fade', category: 'hairstyle', deepar_effect_file: 'hair-ombre.deepar', look_tags: 'ombre,gradient,modern' },

  // Beard/grooming effects  
  { slug: 'beard_full', name: 'Full Beard', category: 'beard', deepar_effect_file: 'beard-full.deepar', look_tags: 'beard,masculine,groomed' },
  { slug: 'beard_stubble', name: 'Designer Stubble', category: 'beard', deepar_effect_file: 'beard-stubble.deepar', look_tags: 'stubble,rugged,casual' },
  { slug: 'beard_goatee', name: 'Classic Goatee', category: 'beard', deepar_effect_file: 'beard-goatee.deepar', look_tags: 'goatee,defined,stylish' },
];

export async function seedEffectPresets() {
  console.log('[Seed] Starting effect presets seed...');
  
  try {
    // Upsert each canonical preset (insert if doesn't exist, update if exists)
    for (const preset of CANONICAL_PRESETS) {
      const existing = await db
        .select()
        .from(effectPresets)
        .where(eq(effectPresets.slug, preset.slug))
        .limit(1);

      if (existing.length > 0) {
        // Update existing preset
        await db
          .update(effectPresets)
          .set({
            name: preset.name,
            category: preset.category,
            deeparEffectFile: preset.deepar_effect_file,
            lookTags: preset.look_tags,
          })
          .where(eq(effectPresets.slug, preset.slug));
        
        console.log(`[Seed] Updated preset: ${preset.slug}`);
      } else {
        // Insert new preset
        await db.insert(effectPresets).values({
          slug: preset.slug,
          name: preset.name,
          category: preset.category,
          deeparEffectFile: preset.deepar_effect_file,
          lookTags: preset.look_tags,
        });
        
        console.log(`[Seed] Inserted preset: ${preset.slug}`);
      }
    }

    console.log(`[Seed] Successfully seeded ${CANONICAL_PRESETS.length} effect presets`);
    return { success: true, count: CANONICAL_PRESETS.length };
  } catch (error) {
    console.error('[Seed] Error seeding effect presets:', error);
    throw error;
  }
}

// Run seed if executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  seedEffectPresets()
    .then(() => {
      console.log('[Seed] Effect presets seed complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Seed failed:', error);
      process.exit(1);
    });
}
