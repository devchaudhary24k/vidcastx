import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "./env";
import * as schema from "./schema";

/**
 * CACHE THE CONNECTION POOL
 * This prevents creating multiple connection pools during Next.js Hot Reloads.
 */
const globalForDb = globalThis as unknown as { conn: Pool | undefined };

const pool =
  globalForDb.conn ?? new Pool({ connectionString: env.DATABASE_URL });

if (env.NODE_ENV !== "production") {
  globalForDb.conn = pool;
}

/**
 * EXPORT THE DB CLIENT
 */
export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});
