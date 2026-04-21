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

async function runMigration() {
  console.log("[MIGRATION] Starting template columns migration...");
  
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Add template columns
    await client.query(`
      ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "is_template" boolean DEFAULT false;
      ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "template_name" varchar(255);
      ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "default_instructions" text;
    `);
    
    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "prompts_is_template_idx" ON "prompts" ("is_template");
      CREATE INDEX IF NOT EXISTS "prompts_module_template_idx" ON "prompts" ("module", "is_template");
    `);
    
    await client.query("COMMIT");
    
    console.log("[MIGRATION] ✅ Migration completed successfully!");
    console.log("[MIGRATION] Added columns: is_template, template_name, default_instructions");
    console.log("[MIGRATION] Created indexes: prompts_is_template_idx, prompts_module_template_idx");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[MIGRATION] ❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .catch((err) => {
    console.error("[MIGRATION] FAILED", err);
    process.exitCode = 1;
  });
