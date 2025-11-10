import { pool } from './db';

interface MakeupAPIProduct {
  id: number;
  brand: string;
  name: string;
  price: string;
  price_sign: string;
  currency: string;
  image_link: string;
  product_link: string;
  website_link: string;
  description: string;
  rating: number | null;
  category: string;
  product_type: string;
  tag_list: string[];
  created_at: string;
  updated_at: string;
  product_api_url: string;
  api_featured_image: string;
  product_colors: Array<{
    hex_value: string;
    colour_name: string;
  }>;
}

const MAKEUP_API_BASE = 'http://makeup-api.herokuapp.com/api/v1/products.json';

const BRANDS_TO_IMPORT = ['maybelline', 'nyx', 'l\'oreal', 'revlon', 'covergirl'];

const CATEGORY_MAP: Record<string, string> = {
  'lipstick': 'lipstick',
  'lip_liner': 'lip_liner',
  'lip_gloss': 'lip_gloss',
  'foundation': 'foundation',
  'concealer': 'concealer',
  'powder': 'powder',
  'blush': 'blush',
  'bronzer': 'bronzer',
  'highlighter': 'highlighter',
  'eyeshadow': 'eyeshadow',
  'eyeliner': 'eyeliner',
  'mascara': 'mascara',
  'eyebrow': 'eyebrow_pencil',
  'nail_polish': 'nail_polish'
};

function mapProductType(productType: string): string {
  return CATEGORY_MAP[productType] || productType;
}

function extractShade(product: MakeupAPIProduct): string | null {
  if (product.product_colors && product.product_colors.length > 0) {
    return product.product_colors[0].colour_name || null;
  }
  return null;
}

function extractFinish(product: MakeupAPIProduct): string | null {
  const description = product.description?.toLowerCase() || '';
  const tags = product.tag_list?.map(t => t.toLowerCase()) || [];
  
  if (tags.includes('matte') || description.includes('matte')) return 'matte';
  if (tags.includes('glossy') || description.includes('glossy')) return 'glossy';
  if (tags.includes('shimmer') || description.includes('shimmer')) return 'shimmer';
  if (tags.includes('dewy') || description.includes('dewy')) return 'dewy';
  if (tags.includes('natural') || description.includes('natural')) return 'natural';
  
  return null;
}

function determineSkinToneCompatibility(product: MakeupAPIProduct): string {
  const category = product.product_type;
  const shade = extractShade(product);
  
  if (!shade) return 'all';
  
  const shadeLower = shade.toLowerCase();
  
  if (category === 'foundation' || category === 'concealer' || category === 'powder') {
    if (shadeLower.includes('fair') || shadeLower.includes('ivory') || shadeLower.includes('porcelain')) {
      return 'fair';
    }
    if (shadeLower.includes('light') || shadeLower.includes('beige')) {
      return 'light';
    }
    if (shadeLower.includes('medium') || shadeLower.includes('tan') || shadeLower.includes('golden')) {
      return 'medium';
    }
    if (shadeLower.includes('deep') || shadeLower.includes('dark') || shadeLower.includes('espresso') || shadeLower.includes('mocha')) {
      return 'deep';
    }
  }
  
  return 'all';
}

function generateSKU(product: MakeupAPIProduct): string {
  const brand = product.brand.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
  const type = product.product_type.toUpperCase().substring(0, 3);
  const id = product.id.toString().padStart(4, '0');
  return `${brand}-${type}-${id}`;
}

function priceToInteger(priceStr: string): number {
  if (!priceStr || priceStr === '0.0') return 0;
  
  const price = parseFloat(priceStr);
  if (isNaN(price)) return 0;
  
  return Math.round(price * 100);
}

async function fetchProductsFromAPI(brand: string): Promise<MakeupAPIProduct[]> {
  try {
    console.log(`Fetching ${brand} products from Makeup API...`);
    const response = await fetch(`${MAKEUP_API_BASE}?brand=${encodeURIComponent(brand)}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch ${brand}: ${response.status}`);
      return [];
    }
    
    const products = await response.json();
    console.log(`  ✓ Found ${products.length} ${brand} products`);
    return products;
  } catch (error) {
    console.error(`Error fetching ${brand}:`, error);
    return [];
  }
}

async function importProducts() {
  console.log('🚀 Starting Makeup API product import...\n');
  
  let totalImported = 0;
  let totalSkipped = 0;
  
  for (const brand of BRANDS_TO_IMPORT) {
    const products = await fetchProductsFromAPI(brand);
    
    if (products.length === 0) {
      console.log(`  ⚠️  No products found for ${brand}\n`);
      continue;
    }
    
    for (const product of products) {
      try {
        const sku = generateSKU(product);
        const category = mapProductType(product.product_type);
        const shade = extractShade(product);
        const finish = extractFinish(product);
        const skinTone = determineSkinToneCompatibility(product);
        const price = priceToInteger(product.price);
        
        const imageUrl = product.api_featured_image || product.image_link;
        
        if (!imageUrl || imageUrl.trim() === '') {
          console.log(`  ⚠️  Skipping ${product.name} - no image`);
          totalSkipped++;
          continue;
        }
        
        const insertQuery = `
          INSERT INTO beauty_products (
            brand, product_line, name, category, shade, sku, 
            finish_type, skin_tone_compatibility, price, image_url, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (sku) DO NOTHING
        `;
        
        await pool.query(insertQuery, [
          product.brand,
          null,
          product.name,
          category,
          shade,
          sku,
          finish,
          skinTone,
          price,
          imageUrl,
          product.description || null
        ]);
        
        totalImported++;
        
        if (totalImported % 50 === 0) {
          console.log(`  📦 Imported ${totalImported} products...`);
        }
      } catch (error: any) {
        if (!error.message.includes('duplicate key')) {
          console.error(`  ❌ Error importing ${product.name}:`, error.message);
        }
        totalSkipped++;
      }
    }
    
    console.log(`  ✅ Completed ${brand}\n`);
  }
  
  const countResult = await pool.query('SELECT COUNT(*) as total FROM beauty_products');
  const totalProducts = countResult.rows[0].total;
  
  console.log('\n📊 Import Summary:');
  console.log(`  • Total products imported: ${totalImported}`);
  console.log(`  • Total skipped/duplicates: ${totalSkipped}`);
  console.log(`  • Total in database: ${totalProducts}`);
  console.log('\n✅ Import complete!');
}

importProducts()
  .catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
    process.exit(0);
  });
