import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Prefer HTTP fetch over WebSocket for pooled queries in serverless (lower latency, better reuse)
neonConfig.poolQueryViaFetch = true;
// Only enable WebSocket constructor if explicitly configured via env
if (process.env.NEON_USE_WEBSOCKETS === '1') {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Tighten timeouts to fail fast instead of hanging when cold
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
  max: 5,
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