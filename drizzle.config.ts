import { type Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  out: './src/database/migrations',
} satisfies Config;
