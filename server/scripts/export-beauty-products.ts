import dotenv from 'dotenv';
dotenv.config({ override: true });

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { beautyProducts } from '../../shared/schema';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL or EXTERNAL_DATABASE_URL is required');
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function exportBeautyProducts() {
  console.log('🔍 Exporting beauty products from development database...\n');

  try {
    const products = await db.select().from(beautyProducts);

    if (products.length === 0) {
      console.log('⚠️  No products found in database');
      return;
    }

    console.log(`✅ Found ${products.length} beauty products`);

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${dataDir}`);
    }

    const outputPath = path.join(dataDir, 'beauty-products-seed.json');
    
    const seedData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalProducts: products.length,
      products: products.map(p => ({
        id: p.id,
        brand: p.brand,
        productLine: p.productLine,
        name: p.name,
        category: p.category,
        shade: p.shade,
        sku: p.sku,
        finishType: p.finishType,
        skinToneCompatibility: p.skinToneCompatibility,
        price: p.price,
        imageUrl: p.imageUrl,
        description: p.description,
        gender: p.gender,
      }))
    };

    fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));

    console.log(`\n✅ Successfully exported products to: ${outputPath}`);
    console.log(`\n📊 Export Summary:`);
    console.log(`   - Total products: ${products.length}`);
    
    const brandCounts = products.reduce((acc, p) => {
      acc[p.brand] = (acc[p.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`   - Brands: ${Object.keys(brandCounts).length}`);
    Object.entries(brandCounts).forEach(([brand, count]) => {
      console.log(`     • ${brand}: ${count} products`);
    });

    const categoryCounts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`   - Categories: ${Object.keys(categoryCounts).length}`);
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`     • ${category}: ${count} products`);
    });

    console.log(`\n✨ Ready for production seeding!`);
    console.log(`   Run: npm run db:seed-products`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportBeautyProducts();
