import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema/index.js";

// Exported only to ensure the schema import is treated as a value import.
// Most code should use the Db* types below.
export const __dbSchema = schema;

export type DbClient = NodePgDatabase<typeof schema>;

export type DbTransaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];

export type DbConn = DbClient | DbTransaction;
