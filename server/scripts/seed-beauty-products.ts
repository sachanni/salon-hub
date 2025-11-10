import dotenv from 'dotenv';
dotenv.config({ override: true });

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { beautyProducts } from '../../shared/schema';
import { sql as sqlOperator, eq } from 'drizzle-orm';
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

interface SeedData {
  version: string;
  exportedAt: string;
  totalProducts: number;
  products: Array<{
    id: string;
    brand: string;
    productLine: string | null;
    name: string;
    category: string;
    shade: string | null;
    sku: string;
    finishType: string | null;
    skinToneCompatibility: string | null;
    price: number;
    imageUrl: string | null;
    description: string | null;
    gender: string | null;
  }>;
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function seedBeautyProducts(dryRun: boolean = false) {
  const mode = dryRun ? '🔍 DRY RUN MODE' : '🚀 LIVE EXECUTION';
  console.log(`\n${mode}`);
  console.log('═'.repeat(60));

  const seedFilePath = path.join(__dirname, '../data/beauty-products-seed.json');

  if (!fs.existsSync(seedFilePath)) {
    console.error(`\n❌ Seed file not found: ${seedFilePath}`);
    console.log('   Run: npm run db:export-products first');
    process.exit(1);
  }

  try {
    const seedData: SeedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));

    console.log(`\n📦 Seed File Information:`);
    console.log(`   - Version: ${seedData.version}`);
    console.log(`   - Exported: ${new Date(seedData.exportedAt).toLocaleString()}`);
    console.log(`   - Total Products: ${seedData.totalProducts}`);

    console.log(`\n🔍 Pre-flight checks...`);
    
    const existingProducts = await db.select().from(beautyProducts);
    console.log(`   - Current products in DB: ${existingProducts.length}`);

    const existingIds = new Set(existingProducts.map(p => p.id));
    const existingSkus = new Set(existingProducts.map(p => p.sku));
    
    const newProducts = seedData.products.filter(p => !existingIds.has(p.id));
    const updateProducts = seedData.products.filter(p => existingIds.has(p.id));
    const skuConflicts = seedData.products.filter(p => 
      !existingIds.has(p.id) && existingSkus.has(p.sku)
    );

    console.log(`\n📊 Operation Summary:`);
    console.log(`   - New products to insert: ${newProducts.length}`);
    console.log(`   - Existing products to update: ${updateProducts.length}`);
    if (skuConflicts.length > 0) {
      console.log(`   ⚠️  SKU conflicts detected: ${skuConflicts.length}`);
      console.log(`      (These will be skipped to prevent duplicates)`);
    }

    if (dryRun) {
      console.log(`\n✅ Dry run completed successfully!`);
      console.log(`   No changes were made to the database.`);
      console.log(`\n   To apply changes, run: npm run db:seed-products`);
      return;
    }

    console.log(`\n⚙️  Applying changes within transaction...`);

    await db.transaction(async (tx) => {
      let insertCount = 0;
      let updateCount = 0;
      let skipCount = 0;

      for (const product of seedData.products) {
        if (skuConflicts.some(p => p.sku === product.sku && p.id !== product.id)) {
          skipCount++;
          continue;
        }

        try {
          if (existingIds.has(product.id)) {
            await tx
              .update(beautyProducts)
              .set({
                brand: product.brand,
                productLine: product.productLine,
                name: product.name,
                category: product.category,
                shade: product.shade,
                sku: product.sku,
                finishType: product.finishType,
                skinToneCompatibility: product.skinToneCompatibility,
                price: product.price,
                imageUrl: product.imageUrl,
                description: product.description,
                gender: product.gender,
              })
              .where(eq(beautyProducts.id, product.id));
            updateCount++;
          } else {
            await tx.insert(beautyProducts).values({
              id: product.id,
              brand: product.brand,
              productLine: product.productLine,
              name: product.name,
              category: product.category,
              shade: product.shade,
              sku: product.sku,
              finishType: product.finishType,
              skinToneCompatibility: product.skinToneCompatibility,
              price: product.price,
              imageUrl: product.imageUrl,
              description: product.description,
              gender: product.gender,
            });
            insertCount++;
          }
        } catch (error: any) {
          console.error(`   ⚠️  Error processing ${product.name}:`, error.message);
          throw error;
        }
      }

      console.log(`\n✅ Transaction completed successfully!`);
      console.log(`   - Inserted: ${insertCount} new products`);
      console.log(`   - Updated: ${updateCount} existing products`);
      if (skipCount > 0) {
        console.log(`   - Skipped: ${skipCount} duplicate SKUs`);
      }
    });

    const finalCount = await db.select().from(beautyProducts);
    console.log(`\n📊 Final Database State:`);
    console.log(`   - Total products: ${finalCount.length}`);

    const brandCounts = finalCount.reduce((acc, p) => {
      acc[p.brand] = (acc[p.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`   - Brands: ${Object.keys(brandCounts).length}`);
    console.log(`\n✨ Production seeding completed successfully!`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const isDryRun = process.argv.includes('--dry-run');
seedBeautyProducts(isDryRun);
