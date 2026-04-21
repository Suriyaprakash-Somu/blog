import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  user: process.env.DATABASE_USER || "postgres",
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || "blog",
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
});

async function checkSchema() {
  console.log("[CHECK] Checking prompts table schema...\n");
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'prompts'
      ORDER BY ordinal_position;
    `);
    
    console.log("📊 Prompts Table Columns:");
    console.log("─".repeat(80));
    console.log(`  ${"Column Name".padEnd(30)} | ${"Data Type".padEnd(20)} | Nullable`);
    console.log("─".repeat(80));
    result.rows.forEach((row) => {
      console.log(`  ${row.column_name.padEnd(30)} | ${row.data_type.padEnd(20)} | ${row.is_nullable}`);
    });
  } catch (error) {
    console.error("[CHECK] Failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema()
  .catch((err) => {
    console.error("[CHECK] FAILED", err);
    process.exitCode = 1;
  });
