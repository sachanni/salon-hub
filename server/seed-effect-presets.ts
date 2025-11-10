import { db } from './db';
import { effectPresets } from '@shared/schema';

const EFFECT_PRESETS_DATA = [
  {
    name: 'Natural Glow',
    category: 'makeup',
    deeparEffectFile: 'natural-glow.deepar',
    lookTags: ['natural', 'everyday', 'office'],
    associatedProducts: ['foundation', 'blush', 'lipstick'],
  },
  {
    name: 'Smokey Eye',
    category: 'makeup',
    deeparEffectFile: 'smokey-eye.deepar',
    lookTags: ['evening', 'party', 'dramatic'],
    associatedProducts: ['eyeshadow', 'eyeliner', 'mascara'],
  },
  {
    name: 'Bold Red Lip',
    category: 'makeup',
    deeparEffectFile: 'bold-red-lip.deepar',
    lookTags: ['bold', 'glamorous', 'party'],
    associatedProducts: ['lipstick', 'lip liner', 'foundation'],
  },
  {
    name: 'Soft Bridal',
    category: 'makeup',
    deeparEffectFile: 'soft-bridal.deepar',
    lookTags: ['bridal', 'wedding', 'soft', 'romantic'],
    associatedProducts: ['foundation', 'blush', 'eyeshadow', 'lipstick', 'highlighter'],
  },
  {
    name: 'Beach Waves',
    category: 'hairstyle',
    deeparEffectFile: 'beach-waves.deepar',
    lookTags: ['casual', 'summer', 'wavy'],
    associatedProducts: ['texturizing spray', 'styling cream'],
  },
  {
    name: 'Sleek Straight',
    category: 'hairstyle',
    deeparEffectFile: 'sleek-straight.deepar',
    lookTags: ['professional', 'sleek', 'straight'],
    associatedProducts: ['smoothing serum', 'heat protectant'],
  },
  {
    name: 'Romantic Updo',
    category: 'hairstyle',
    deeparEffectFile: 'romantic-updo.deepar',
    lookTags: ['bridal', 'wedding', 'formal', 'elegant'],
    associatedProducts: ['hairspray', 'styling gel', 'accessories'],
  },
  {
    name: 'Dewy Fresh Face',
    category: 'makeup',
    deeparEffectFile: 'dewy-fresh.deepar',
    lookTags: ['dewy', 'fresh', 'natural', 'glowing'],
    associatedProducts: ['primer', 'foundation', 'highlighter', 'setting spray'],
  },
  {
    name: 'Cat Eye Glam',
    category: 'makeup',
    deeparEffectFile: 'cat-eye.deepar',
    lookTags: ['cat eye', 'retro', 'glamorous'],
    associatedProducts: ['eyeliner', 'mascara', 'eyeshadow'],
  },
  {
    name: 'Nude Look',
    category: 'makeup',
    deeparEffectFile: 'nude-look.deepar',
    lookTags: ['nude', 'minimal', 'everyday'],
    associatedProducts: ['foundation', 'concealer', 'nude lipstick', 'mascara'],
  },
  {
    name: 'Messy Bun',
    category: 'hairstyle',
    deeparEffectFile: 'messy-bun.deepar',
    lookTags: ['casual', 'everyday', 'easy'],
    associatedProducts: ['texturizing spray', 'bobby pins'],
  },
  {
    name: 'Voluminous Curls',
    category: 'hairstyle',
    deeparEffectFile: 'voluminous-curls.deepar',
    lookTags: ['curly', 'voluminous', 'glamorous'],
    associatedProducts: ['curl cream', 'mousse', 'hairspray'],
  },
  {
    name: 'Festival Glitter',
    category: 'makeup',
    deeparEffectFile: 'festival-glitter.deepar',
    lookTags: ['festival', 'party', 'glitter', 'colorful'],
    associatedProducts: ['glitter', 'face gems', 'eyeshadow', 'setting spray'],
  },
  {
    name: 'Classic Bob',
    category: 'hairstyle',
    deeparEffectFile: 'classic-bob.deepar',
    lookTags: ['bob', 'professional', 'classic'],
    associatedProducts: ['smoothing cream', 'shine serum'],
  },
];

async function seedEffectPresets() {
  console.log('🌱 Seeding effect presets...');
  
  try {
    // Check if table has data
    const existing = await db.select().from(effectPresets).limit(1);
    
    if (existing.length > 0) {
      console.log('✅ Effect presets already seeded, skipping...');
      return;
    }

    // Insert all presets
    await db.insert(effectPresets).values(EFFECT_PRESETS_DATA);
    
    console.log(`✅ Successfully seeded ${EFFECT_PRESETS_DATA.length} effect presets!`);
  } catch (error) {
    console.error('❌ Error seeding effect presets:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedEffectPresets();
