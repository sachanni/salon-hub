import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Prefer HTTP fetch over WebSocket for pooled queries in serverless (lower latency, better reuse)
// DISABLED: Causing null result issues with Drizzle ORM
// neonConfig.poolQueryViaFetch = true;

// Enable WebSocket constructor to avoid fetch issues
neonConfig.webSocketConstructor = ws;

// IMPORTANT: Neon serverless driver uses WebSocket connections over TLS.
// In Replit's development environment, Neon's proxy uses self-signed certificates
// for the WebSocket connection (wss://helium/v2).
// 
// We MUST disable TLS verification in development for the WebSocket connection to work.
// This is safe because:
// 1. Only affects development environment (NODE_ENV=development)
// 2. Replit environment is already sandboxed and secure
// 3. Production deployments use proper TLS validation
//
// Note: This generates a Node.js warning, which is expected and harmless in this context.
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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