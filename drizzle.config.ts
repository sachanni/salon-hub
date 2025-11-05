import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env file explicitly
config();

if (!process.env.EXTERNAL_DATABASE_URL) {
  throw new Error("EXTERNAL_DATABASE_URL must be set in .env file");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.EXTERNAL_DATABASE_URL,
  },
});
