import { pool } from './db';

async function verifyTables() {
  console.log('🔍 Verifying AI Look tables in server database...\n');
  
  try {
    const tables = [
      'effect_presets',
      'beauty_products',
      'salon_inventory',
      'ai_look_sessions',
      'ai_look_options',
      'ai_look_products'
    ];
    
    for (const tableName of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = result.rows[0].count;
        const status = count > 0 ? '✅' : '⚪';
        console.log(`${status} ${tableName.padEnd(25)} ${count} rows`);
      } catch (error: any) {
        console.log(`❌ ${tableName.padEnd(25)} ERROR: ${error.message}`);
      }
    }
    
    // Sample a few products
    console.log('\n📦 Sample products:');
    const products = await pool.query('SELECT brand, name, category, shade, sku FROM beauty_products LIMIT 5');
    products.rows.forEach((p: any) => {
      console.log(`   - ${p.brand} ${p.name} (${p.shade || p.category})`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verifyTables();
