import { drizzle } from 'drizzle-orm/neon-http';
import { config } from 'dotenv';
import * as authSchema from './schema/auth';
import * as tweetsSchema from './schema/tweets';

config({ path: '.env.local' });

const schema = {
  ...authSchema,
  ...tweetsSchema,
};

export const db = drizzle(process.env.DATABASE_URL!, { schema });