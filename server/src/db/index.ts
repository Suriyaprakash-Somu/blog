import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../common/env.js";

import * as schema from "./schema/index.js";

const { Pool } = pg;

const pool = new Pool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  ssl: env.DATABASE_SSL
    ? { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED }
    : false,
  max: env.DATABASE_POOL_MAX,
  min: env.DATABASE_POOL_MIN,
  idleTimeoutMillis: env.DATABASE_POOL_IDLE_TIMEOUT_MS,
  ...(env.DATABASE_POOL_MAX_USES > 0 ? { maxUses: env.DATABASE_POOL_MAX_USES } : {}),
  connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,
  statement_timeout: env.DATABASE_STATEMENT_TIMEOUT_MS,
});

export const db = drizzle(pool, { schema });

export async function closeDatabase() {
  await pool.end();
}
