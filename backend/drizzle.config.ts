import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// For local development
if (typeof Bun !== 'undefined') {
  config({ path: '.env.local' });
}

export default defineConfig({
  schema: './src/db/schema',
  out: "./src/db/migrations",
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
