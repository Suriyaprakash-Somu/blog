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

async function verifyMigration() {
  console.log("[VERIFY] Checking migration...\n");
  
  const client = await pool.connect();
  
  try {
    // Check columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'prompts'
      AND column_name IN ('is_template', 'template_name', 'default_instructions')
      ORDER BY ordinal_position;
    `);
    
    console.log("✅ Template Columns:");
    console.log("─".repeat(80));
    columnsResult.rows.forEach((row) => {
      console.log(`  ${row.column_name.padEnd(25)} | ${row.data_type.padEnd(20)} | ${row.is_nullable.padEnd(10)} | ${row.column_default || 'NULL'}`);
    });
    
    // Check indexes
    const indexesResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'prompts'
      AND indexname LIKE 'prompts_%template%'
      ORDER BY indexname;
    `);
    
    console.log("\n✅ Template Indexes:");
    console.log("─".repeat(80));
    indexesResult.rows.forEach((row) => {
      console.log(`  ${row.indexname}`);
      console.log(`    ${row.indexdef}`);
    });
    
    console.log("\n✅ Migration verification complete!");
  } catch (error) {
    console.error("[VERIFY] Failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyMigration()
  .catch((err) => {
    console.error("[VERIFY] FAILED", err);
    process.exitCode = 1;
  });
