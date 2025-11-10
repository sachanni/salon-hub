import { pool } from './db';

const EFFECT_PRESETS_SQL = `
CREATE TABLE IF NOT EXISTS effect_presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  deepar_effect_file VARCHAR(500),
  look_tags TEXT[],
  associated_products TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO effect_presets (name, category, deepar_effect_file, look_tags, associated_products) VALUES
('Natural Glow', 'makeup', 'natural-glow.deepar', ARRAY['natural', 'everyday', 'office'], ARRAY['foundation', 'blush', 'lipstick']),
('Smokey Eye', 'makeup', 'smokey-eye.deepar', ARRAY['evening', 'party', 'dramatic'], ARRAY['eyeshadow', 'eyeliner', 'mascara']),
('Bold Red Lip', 'makeup', 'bold-red-lip.deepar', ARRAY['bold', 'glamorous', 'party'], ARRAY['lipstick', 'lip liner', 'foundation']),
('Soft Bridal', 'makeup', 'soft-bridal.deepar', ARRAY['bridal', 'wedding', 'soft', 'romantic'], ARRAY['foundation', 'blush', 'eyeshadow', 'lipstick', 'highlighter']),
('Beach Waves', 'hairstyle', 'beach-waves.deepar', ARRAY['casual', 'summer', 'wavy'], ARRAY['texturizing spray', 'styling cream']),
('Sleek Straight', 'hairstyle', 'sleek-straight.deepar', ARRAY['professional', 'sleek', 'straight'], ARRAY['smoothing serum', 'heat protectant']),
('Romantic Updo', 'hairstyle', 'romantic-updo.deepar', ARRAY['bridal', 'wedding', 'formal', 'elegant'], ARRAY['hairspray', 'styling gel', 'accessories']),
('Dewy Fresh Face', 'makeup', 'dewy-fresh.deepar', ARRAY['dewy', 'fresh', 'natural', 'glowing'], ARRAY['primer', 'foundation', 'highlighter', 'setting spray']),
('Cat Eye Glam', 'makeup', 'cat-eye.deepar', ARRAY['cat eye', 'retro', 'glamorous'], ARRAY['eyeliner', 'mascara', 'eyeshadow']),
('Nude Look', 'makeup', 'nude-look.deepar', ARRAY['nude', 'minimal', 'everyday'], ARRAY['foundation', 'concealer', 'nude lipstick', 'mascara']),
('Messy Bun', 'hairstyle', 'messy-bun.deepar', ARRAY['casual', 'everyday', 'easy'], ARRAY['texturizing spray', 'bobby pins']),
('Voluminous Curls', 'hairstyle', 'voluminous-curls.deepar', ARRAY['curly', 'voluminous', 'glamorous'], ARRAY['curl cream', 'mousse', 'hairspray']),
('Festival Glitter', 'makeup', 'festival-glitter.deepar', ARRAY['festival', 'party', 'glitter', 'colorful'], ARRAY['glitter', 'face gems', 'eyeshadow', 'setting spray']),
('Classic Bob', 'hairstyle', 'classic-bob.deepar', ARRAY['bob', 'professional', 'classic'], ARRAY['smoothing cream', 'shine serum'])
ON CONFLICT DO NOTHING;
`;

async function bootstrap() {
  console.log('🚀 Bootstrapping effect_presets table...');
  
  try {
    await pool.query(EFFECT_PRESETS_SQL);
    
    const result = await pool.query('SELECT COUNT(*) as count FROM effect_presets');
    console.log(`✅ Success! effect_presets table has ${result.rows[0].count} rows`);
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

bootstrap();
