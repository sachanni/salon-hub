import { pool } from './db';

const GENDER_RULES = {
  female: ['lipstick', 'lip_liner', 'lip_gloss', 'eyeshadow', 'blush', 'highlighter', 'nail_polish'],
  male: ['beard_oil', 'beard_balm', 'beard_wash', 'shaving_cream', 'aftershave'],
  unisex: ['foundation', 'concealer', 'powder', 'bronzer', 'eyeliner', 'mascara', 'eyebrow_pencil', 'primer', 'setting_spray', 'hair_color']
};

async function tagProductsByGender() {
  console.log('🏷️  Tagging products by gender...\n');
  
  let femaleCount = 0;
  let maleCount = 0;
  let unisexCount = 0;
  
  try {
    console.log('1️⃣  Tagging female products...');
    for (const category of GENDER_RULES.female) {
      const result = await pool.query(`
        UPDATE beauty_products 
        SET gender = 'female' 
        WHERE category = $1
      `, [category]);
      femaleCount += result.rowCount || 0;
      console.log(`  ✓ ${category}: ${result.rowCount} products`);
    }
    
    console.log(`\n2️⃣  Tagging male products...`);
    for (const category of GENDER_RULES.male) {
      const result = await pool.query(`
        UPDATE beauty_products 
        SET gender = 'male' 
        WHERE category = $1
      `, [category]);
      maleCount += result.rowCount || 0;
      if (result.rowCount && result.rowCount > 0) {
        console.log(`  ✓ ${category}: ${result.rowCount} products`);
      }
    }
    
    console.log(`\n3️⃣  Tagging unisex products...`);
    for (const category of GENDER_RULES.unisex) {
      const result = await pool.query(`
        UPDATE beauty_products 
        SET gender = 'unisex' 
        WHERE category = $1
      `, [category]);
      unisexCount += result.rowCount || 0;
      console.log(`  ✓ ${category}: ${result.rowCount} products`);
    }
    
    const summaryResult = await pool.query(`
      SELECT gender, COUNT(*) as count 
      FROM beauty_products 
      GROUP BY gender 
      ORDER BY gender
    `);
    
    console.log('\n📊 Gender Distribution:');
    summaryResult.rows.forEach((row: any) => {
      console.log(`  • ${row.gender}: ${row.count} products`);
    });
    
    console.log('\n✅ Product tagging complete!');
    
  } catch (error) {
    console.error('❌ Tagging failed:', error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

tagProductsByGender();
