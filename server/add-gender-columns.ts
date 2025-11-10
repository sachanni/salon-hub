import { pool } from './db';

async function addGenderColumns() {
  console.log('🔧 Adding gender columns to database tables...\n');
  
  try {
    console.log('1️⃣  Adding gender column to beauty_products table...');
    await pool.query(`
      ALTER TABLE beauty_products 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'unisex'
    `);
    console.log('  ✅ beauty_products.gender added\n');
    
    console.log('2️⃣  Adding gender column to ai_look_sessions table...');
    await pool.query(`
      ALTER TABLE ai_look_sessions 
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20)
    `);
    console.log('  ✅ ai_look_sessions.gender added\n');
    
    console.log('3️⃣  Verifying columns...');
    const productsResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'beauty_products' AND column_name = 'gender'
    `);
    
    const sessionsResult = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'ai_look_sessions' AND column_name = 'gender'
    `);
    
    if (productsResult.rows.length > 0) {
      console.log('  ✅ beauty_products.gender exists:', productsResult.rows[0]);
    }
    
    if (sessionsResult.rows.length > 0) {
      console.log('  ✅ ai_look_sessions.gender exists:', sessionsResult.rows[0]);
    }
    
    console.log('\n✅ Gender columns added successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

addGenderColumns();
