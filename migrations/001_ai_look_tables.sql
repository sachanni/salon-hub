-- Create beauty_products table
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

-- Create effect_presets table
CREATE TABLE IF NOT EXISTS effect_presets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  deepar_effect_file TEXT,
  look_tags TEXT,
  associated_products TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create salon_inventory table
CREATE TABLE IF NOT EXISTS salon_inventory (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id VARCHAR NOT NULL REFERENCES salons(id),
  product_id VARCHAR NOT NULL REFERENCES beauty_products(id),
  quantity INTEGER DEFAULT 0 NOT NULL,
  low_stock_threshold INTEGER DEFAULT 5,
  last_restocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(salon_id, product_id)
);

-- Create ai_look_sessions table
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

-- Create ai_look_options table
CREATE TABLE IF NOT EXISTS ai_look_options (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES ai_look_sessions(id),
  look_name TEXT NOT NULL,
  description TEXT,
  preset_ids TEXT,
  ai_confidence_score NUMERIC(5, 2),
  is_selected INTEGER DEFAULT 0 NOT NULL,
  preview_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_look_products table
CREATE TABLE IF NOT EXISTS ai_look_products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  look_option_id VARCHAR NOT NULL REFERENCES ai_look_options(id),
  product_id VARCHAR NOT NULL REFERENCES beauty_products(id),
  application_area TEXT,
  application_instructions TEXT,
  quantity_needed TEXT,
  is_in_stock INTEGER DEFAULT 1 NOT NULL,
  substitute_product_id VARCHAR REFERENCES beauty_products(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salon_inventory_salon ON salon_inventory(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_inventory_product ON salon_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_look_sessions_salon ON ai_look_sessions(salon_id);
CREATE INDEX IF NOT EXISTS idx_ai_look_options_session ON ai_look_options(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_look_products_look_option ON ai_look_products(look_option_id);
CREATE INDEX IF NOT EXISTS idx_ai_look_products_product ON ai_look_products(product_id);
