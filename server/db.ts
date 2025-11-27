import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Enable WebSocket constructor to avoid fetch issues
neonConfig.webSocketConstructor = ws;

// Use Replit's DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Please add your database connection string.",
  );
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  // Tighten timeouts to fail fast instead of hanging when cold
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
  max: 30,
});
export const db = drizzle({ client: pool, schema });

// Best-effort creation of performance indexes. Runs once per boot, fast no-ops on subsequent boots
(async () => {
  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS services_salon_active_idx ON services (salon_id, is_active)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS bookings_salon_time_idx ON bookings (salon_id, booking_date, booking_time)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments (razorpay_order_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS bookings_service_idx ON bookings (service_id)`);
  } catch (e) {
    // Non-fatal; continue without blocking startup
    console.warn('Index ensure failed (non-fatal):', e);
  }
})();