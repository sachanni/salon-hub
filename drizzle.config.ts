import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env file explicitly
config();

// Prefer EXTERNAL_DATABASE_URL (persistent Neon DB)
const databaseUrl = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("EXTERNAL_DATABASE_URL or DATABASE_URL must be set");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
