import dotenv from 'dotenv';
// Load .env file first before accessing environment variables
dotenv.config({ override: true });

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Prefer HTTP fetch over WebSocket for pooled queries in serverless (lower latency, better reuse)
// DISABLED: Causing null result issues with Drizzle ORM
// neonConfig.poolQueryViaFetch = true;

// Enable WebSocket constructor to avoid fetch issues
neonConfig.webSocketConstructor = ws;

// Prefer EXTERNAL_DATABASE_URL (persistent Neon DB), fallback to built-in DATABASE_URL
const databaseUrl = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "EXTERNAL_DATABASE_URL or DATABASE_URL must be set. Please add your database connection string.",
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