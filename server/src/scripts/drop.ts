import "dotenv/config";
import { db, closeDatabase } from "../db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const migrations = await db.execute(sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5`);
    console.log("MIGRATIONS:", migrations.rows);
  } catch (e: any) {
    console.log("No migrations table?", e.message);
  }
  
  closeDatabase();
}
main();
