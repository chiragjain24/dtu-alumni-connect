import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';
import * as schema from './schema/auth';

config({ path: '.env.local' });

export const db = drizzle(process.env.DATABASE_URL!, { schema });