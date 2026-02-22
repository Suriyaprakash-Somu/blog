import "dotenv/config";
import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function verifyConnection() {
  try {
    console.log("[Verify] Testing database connection...");
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log("[Verify] Connection successful:", result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error("[Verify] Connection failed:", error);
    process.exit(1);
  }
}

verifyConnection();
