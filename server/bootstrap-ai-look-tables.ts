import { pool } from './db';

const AI_LOOK_TABLES_SQL = `
-- 1. Beauty Products - Master product catalog
CREATE TABLE IF NOT EXISTS beauty_products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  product_line TEXT,
  name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  shade TEXT,
  sku TEXT NOT NULL UNIQUE,
  finish_type TEXT,
  skin_tone_compatibility TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Salon Inventory - Track product stock per salon
CREATE TABLE IF NOT EXISTS salon_inventory (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  product_id VARCHAR NOT NULL REFERENCES beauty_products(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, product_id)
);

-- 3. AI Look Sessions - Customer consultation history
CREATE TABLE IF NOT EXISTS ai_look_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  customer_name TEXT NOT NULL,
  customer_photo_url TEXT,
  event_type VARCHAR(50),
  weather VARCHAR(50),
  location VARCHAR(50),
  skin_tone VARCHAR(50),
  hair_type VARCHAR(50),
  staff_user_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. AI Look Options - Look variations per session
CREATE TABLE IF NOT EXISTS ai_look_options (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES ai_look_sessions(id),
  look_name TEXT NOT NULL,
  description TEXT,
  preset_ids TEXT,
  ai_confidence_score DECIMAL(5, 2),
  is_selected INTEGER NOT NULL DEFAULT 0,
  preview_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI Look Products - Product recommendations per look
CREATE TABLE IF NOT EXISTS ai_look_products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  look_option_id VARCHAR NOT NULL REFERENCES ai_look_options(id),
  product_id VARCHAR NOT NULL REFERENCES beauty_products(id),
  application_area TEXT,
  application_instructions TEXT,
  quantity_needed TEXT,
  is_in_stock INTEGER NOT NULL DEFAULT 1,
  substitute_product_id VARCHAR REFERENCES beauty_products(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Beauty Products (60+ premium products)
INSERT INTO beauty_products (brand, product_line, name, category, shade, sku, finish_type, skin_tone_compatibility, price, description) VALUES
-- FOUNDATIONS (12)
('MAC', 'Studio Fix Fluid', 'Studio Fix Fluid SPF 15 Foundation', 'foundation', 'NC15', 'MAC-SF-NC15', 'matte', 'fair', 3200, 'Medium to full coverage matte foundation'),
('MAC', 'Studio Fix Fluid', 'Studio Fix Fluid SPF 15 Foundation', 'foundation', 'NC25', 'MAC-SF-NC25', 'matte', 'light-medium', 3200, 'Medium to full coverage matte foundation'),
('MAC', 'Studio Fix Fluid', 'Studio Fix Fluid SPF 15 Foundation', 'foundation', 'NC35', 'MAC-SF-NC35', 'matte', 'medium', 3200, 'Medium to full coverage matte foundation'),
('MAC', 'Studio Fix Fluid', 'Studio Fix Fluid SPF 15 Foundation', 'foundation', 'NC42', 'MAC-SF-NC42', 'matte', 'deep', 3200, 'Medium to full coverage matte foundation'),
('NARS', 'Natural Radiant', 'Natural Radiant Longwear Foundation', 'foundation', 'Mont Blanc', 'NARS-NR-MB', 'satin', 'fair', 4500, 'Lightweight medium coverage foundation'),
('NARS', 'Natural Radiant', 'Natural Radiant Longwear Foundation', 'foundation', 'Stromboli', 'NARS-NR-ST', 'satin', 'medium', 4500, 'Lightweight medium coverage foundation'),
('Fenty Beauty', 'Pro Filt''r', 'Pro Filt''r Soft Matte Foundation', 'foundation', '150', 'FENTY-PF-150', 'matte', 'fair', 3800, 'Soft matte longwear foundation'),
('Fenty Beauty', 'Pro Filt''r', 'Pro Filt''r Soft Matte Foundation', 'foundation', '220', 'FENTY-PF-220', 'matte', 'light-medium', 3800, 'Soft matte longwear foundation'),
('Fenty Beauty', 'Pro Filt''r', 'Pro Filt''r Soft Matte Foundation', 'foundation', '290', 'FENTY-PF-290', 'matte', 'medium', 3800, 'Soft matte longwear foundation'),
('Fenty Beauty', 'Pro Filt''r', 'Pro Filt''r Soft Matte Foundation', 'foundation', '385', 'FENTY-PF-385', 'matte', 'deep', 3800, 'Soft matte longwear foundation'),
('Estée Lauder', 'Double Wear', 'Double Wear Stay-in-Place Foundation', 'foundation', '1N2 Ecru', 'EL-DW-1N2', 'matte', 'fair', 4200, 'Flawless all-day wear foundation'),
('Estée Lauder', 'Double Wear', 'Double Wear Stay-in-Place Foundation', 'foundation', '3W1 Tawny', 'EL-DW-3W1', 'matte', 'medium', 4200, 'Flawless all-day wear foundation'),

-- CONCEALERS (6)
('NARS', 'Radiant Creamy', 'Radiant Creamy Concealer', 'concealer', 'Vanilla', 'NARS-CC-VAN', 'satin', 'fair', 2800, 'Multi-action concealer'),
('NARS', 'Radiant Creamy', 'Radiant Creamy Concealer', 'concealer', 'Custard', 'NARS-CC-CUS', 'satin', 'light-medium', 2800, 'Multi-action concealer'),
('NARS', 'Radiant Creamy', 'Radiant Creamy Concealer', 'concealer', 'Ginger', 'NARS-CC-GIN', 'satin', 'medium', 2800, 'Multi-action concealer'),
('Tarte', 'Shape Tape', 'Shape Tape Contour Concealer', 'concealer', 'Light Sand', 'TARTE-ST-LS', 'matte', 'light', 2500, 'Full coverage concealer'),
('Tarte', 'Shape Tape', 'Shape Tape Contour Concealer', 'concealer', 'Light Medium', 'TARTE-ST-LM', 'matte', 'light-medium', 2500, 'Full coverage concealer'),
('Tarte', 'Shape Tape', 'Shape Tape Contour Concealer', 'concealer', 'Tan', 'TARTE-ST-TAN', 'matte', 'medium-deep', 2500, 'Full coverage concealer'),

-- LIPSTICKS (15)
('MAC', 'Retro Matte', 'Ruby Woo', 'lipstick', 'Red', 'MAC-RM-RW', 'matte', 'all', 1900, 'Iconic blue-red matte lipstick'),
('MAC', 'Amplified', 'Dubonnet', 'lipstick', 'Wine', 'MAC-AMP-DUB', 'cream', 'all', 1900, 'Deep wine red lipstick'),
('MAC', 'Lustre', 'Candy Yum-Yum', 'lipstick', 'Hot Pink', 'MAC-LST-CYY', 'lustre', 'all', 1900, 'Bright pink lipstick'),
('MAC', 'Satin', 'Twig', 'lipstick', 'Nude Mauve', 'MAC-SAT-TWIG', 'satin', 'all', 1900, 'Dirty pink nude lipstick'),
('Charlotte Tilbury', 'Matte Revolution', 'Pillow Talk', 'lipstick', 'Nude Pink', 'CT-MR-PT', 'matte', 'all', 3400, 'Best-selling nude pink lipstick'),
('Charlotte Tilbury', 'Matte Revolution', 'Red Carpet Red', 'lipstick', 'True Red', 'CT-MR-RCR', 'matte', 'all', 3400, 'Classic Hollywood red'),
('Maybelline', 'SuperStay Matte Ink', 'Voyager', 'lipstick', 'Nude', 'MAY-SSM-VOY', 'matte', 'all', 650, 'Long-lasting liquid lipstick'),
('Maybelline', 'SuperStay Matte Ink', 'Lover', 'lipstick', 'Coral', 'MAY-SSM-LOV', 'matte', 'all', 650, 'Long-lasting liquid lipstick'),
('NYX', 'Soft Matte Lip Cream', 'Abu Dhabi', 'lipstick', 'Nude Beige', 'NYX-SMLC-AD', 'matte', 'all', 550, 'Soft matte lip cream'),
('NYX', 'Soft Matte Lip Cream', 'Copenhagen', 'lipstick', 'Dusty Rose', 'NYX-SMLC-COP', 'matte', 'all', 550, 'Soft matte lip cream'),
('Huda Beauty', 'Liquid Matte', 'Bombshell', 'lipstick', 'Nude', 'HUDA-LM-BOM', 'matte', 'all', 1800, 'Ultra-pigmented liquid lipstick'),
('Huda Beauty', 'Liquid Matte', 'Venus', 'lipstick', 'Mauve', 'HUDA-LM-VEN', 'matte', 'all', 1800, 'Ultra-pigmented liquid lipstick'),
('Lakme', '9 to 5 Primer + Matte', 'Rosy Sunday', 'lipstick', 'Rose', 'LAKME-9T5-RS', 'matte', 'all', 450, 'Long-lasting matte lipstick'),
('Lakme', '9 to 5 Primer + Matte', 'Crimson Silk', 'lipstick', 'Red', 'LAKME-9T5-CS', 'matte', 'all', 450, 'Long-lasting matte lipstick'),
('Sugar', 'Smudge Me Not', 'Brazen Raisin', 'lipstick', 'Wine', 'SUGAR-SMN-BR', 'matte', 'all', 400, 'Transfer-proof liquid lipstick'),

-- EYESHADOWS (10)
('Urban Decay', 'Naked 3', 'Naked 3 Palette', 'eyeshadow', 'Rose Neutrals', 'UD-N3-PAL', 'shimmer', 'all', 5400, '12 rose-hued neutrals'),
('Anastasia Beverly Hills', 'Modern Renaissance', 'Modern Renaissance Palette', 'eyeshadow', 'Warm Neutrals', 'ABH-MR-PAL', 'matte', 'all', 4300, '14 warm neutrals'),
('Huda Beauty', 'Desert Dusk', 'Desert Dusk Palette', 'eyeshadow', 'Warm Browns', 'HUDA-DD-PAL', 'shimmer', 'all', 6500, '18 warm browns and oranges'),
('Morphe', '35O', '35O Nature Glow Palette', 'eyeshadow', 'Warm Tones', 'MORPHE-35O', 'shimmer', 'all', 2200, '35 warm eyeshadows'),
('Maybelline', 'The Nudes', 'The Nudes Palette', 'eyeshadow', 'Nude', 'MAY-TN-PAL', 'matte', 'all', 900, '12 nude shades'),
('NYX', 'Ultimate Shadow', 'Warm Neutrals Palette', 'eyeshadow', 'Warm Nude', 'NYX-US-WN', 'matte', 'all', 800, '16 warm neutrals'),
('Colorbar', 'Captivate', 'Captivate Eyeshadow Quad', 'eyeshadow', 'Bronze', 'CB-CAP-BRZ', 'shimmer', 'all', 650, '4 bronze shades'),
('Lakme', 'Eyeconic', 'Eyeconic Kajal', 'eyeliner', 'Black', 'LAKME-EYE-BLK', 'matte', 'all', 225, 'Smudge-proof kajal'),
('Sugar', 'Stroke of Genius', 'Intense Black Kohl', 'eyeliner', 'Black', 'SUGAR-SOG-BLK', 'matte', 'all', 300, 'Long-lasting kohl'),
('Faces Canada', 'Magneteyes', 'Magneteyes Kajal', 'eyeliner', 'Black', 'FACES-MAG-BLK', 'matte', 'all', 250, 'Magnetic black kajal'),

-- MASCARAS (5)
('Maybelline', 'Lash Sensational', 'Lash Sensational Mascara', 'mascara', 'Blackest Black', 'MAY-LS-BB', 'volumizing', 'all', 650, 'Volumizing mascara'),
('L''Oréal', 'Voluminous', 'Voluminous Lash Paradise', 'mascara', 'Blackest Black', 'LOR-VLP-BB', 'volumizing', 'all', 750, 'Volume and length mascara'),
('Benefit', 'They''re Real', 'They''re Real Lengthening Mascara', 'mascara', 'Black', 'BEN-TR-BLK', 'lengthening', 'all', 2600, 'Lengthening mascara'),
('Lakme', 'Eyeconic', 'Eyeconic Lash Curling Mascara', 'mascara', 'Black', 'LAKME-ELC-BLK', 'curling', 'all', 425, 'Lash curling mascara'),
('Sugar', 'Uptown Curl', 'Uptown Curl Mascara', 'mascara', 'Black', 'SUGAR-UC-BLK', 'curling', 'all', 500, 'Lengthening and curling'),

-- BLUSHES (8)
('NARS', 'Blush', 'Orgasm', 'blush', 'Peachy Pink', 'NARS-BL-ORG', 'shimmer', 'light-medium', 3000, 'Iconic peachy pink with gold shimmer'),
('NARS', 'Blush', 'Laguna', 'blush', 'Bronze', 'NARS-BL-LAG', 'matte', 'medium-deep', 3000, 'Bronzing blush'),
('Milani', 'Baked Blush', 'Luminoso', 'blush', 'Coral', 'MIL-BB-LUM', 'shimmer', 'all', 900, 'Peachy coral with shimmer'),
('Wet n Wild', 'Color Icon', 'Pearlescent Pink', 'blush', 'Pink', 'WNW-CI-PP', 'shimmer', 'fair-medium', 350, 'Soft pink blush'),
('Lakme', '9 to 5', 'Rose Touch Blush', 'blush', 'Rose', 'LAKME-9T5-RT', 'matte', 'all', 425, 'Natural rose blush'),
('Sugar', 'Contour De Force', 'Peach Peak', 'blush', 'Peach', 'SUGAR-CDF-PP', 'matte', 'light-medium', 550, 'Matte peach blush'),
('Maybelline', 'Fit Me', 'Pink', 'blush', 'Pink', 'MAY-FM-PNK', 'matte', 'all', 400, 'Lightweight pink blush'),
('Colorbar', 'Cheek Illusion', 'Pink Romance', 'blush', 'Pink', 'CB-CI-PR', 'shimmer', 'fair-medium', 550, 'Shimmery pink blush'),

-- HIGHLIGHTERS (6)
('Fenty Beauty', 'Killawatt', 'Trophy Wife', 'highlighter', 'Gold', 'FENTY-KW-TW', 'shimmer', 'all', 3400, 'Golden highlighter'),
('Anastasia Beverly Hills', 'Glow Kit', 'Moonchild', 'highlighter', 'Iridescent', 'ABH-GK-MC', 'shimmer', 'all', 4000, 'Holographic glow kit'),
('Wet n Wild', 'MegaGlo', 'Precious Petals', 'highlighter', 'Pink', 'WNW-MG-PP', 'shimmer', 'fair-medium', 350, 'Pink highlighter'),
('NYX', 'Born to Glow', 'Sunbeam', 'highlighter', 'Gold', 'NYX-BTG-SB', 'shimmer', 'medium', 650, 'Liquid illuminator'),
('Sugar', 'Uptown Girl', 'Bronze Glimmer', 'highlighter', 'Bronze', 'SUGAR-UG-BG', 'shimmer', 'medium-deep', 600, 'Bronze highlighter'),
('Lakme', 'Illuminating', 'Pearl Glow', 'highlighter', 'Pearl', 'LAKME-ILL-PG', 'shimmer', 'fair', 450, 'Pearl highlighter')

ON CONFLICT (sku) DO NOTHING;
`;

async function bootstrapAILookTables() {
  console.log('🚀 Bootstrapping AI Look feature tables...');
  
  try {
    // Execute all table creation and seed data
    await pool.query(AI_LOOK_TABLES_SQL);
    
    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('beauty_products', 'salon_inventory', 'ai_look_sessions', 'ai_look_options', 'ai_look_products')
      ORDER BY table_name;
    `);
    
    const productCount = await pool.query('SELECT COUNT(*) as count FROM beauty_products');
    
    console.log('\n✅ Success! Created tables:');
    tables.rows.forEach((row: any) => console.log(`   - ${row.table_name}`));
    console.log(`\n📦 Seeded ${productCount.rows[0].count} beauty products`);
    console.log('\n🎯 AI Look feature is now ready to use!');
    
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

bootstrapAILookTables();
