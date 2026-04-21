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

async function addIsDefaultColumn() {
  console.log("[MIGRATION] Adding is_default column to prompts table...");
  
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Add is_default column
    await client.query(`
      ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "is_default" boolean DEFAULT false;
    `);
    
    console.log("[MIGRATION] Added is_default column");
    
    // Create unique index to enforce one default per module
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "prompts_module_default_idx" 
      ON "prompts" (module, is_default) 
      WHERE is_default = true AND deleted_at IS NULL;
    `);
    
    console.log("[MIGRATION] Created unique index for one default per module");
    
    // If there are existing templates, mark the first one as default
    await client.query(`
      UPDATE "prompts" 
      SET is_default = true 
      WHERE id IN (
        SELECT id FROM (
          SELECT id, module, 
                 ROW_NUMBER() OVER (PARTITION BY module ORDER BY created_at DESC) as rn
          FROM "prompts"
          WHERE is_template = true 
            AND deleted_at IS NULL
        ) ranked
        WHERE rn = 1
      )
      AND is_default = false;
    `);
    
    console.log("[MIGRATION] Marked first template per module as default");
    
    await client.query("COMMIT");
    
    console.log("[MIGRATION] ✅ is_default migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[MIGRATION] ❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addIsDefaultColumn()
  .catch((err) => {
    console.error("[MIGRATION] FAILED", err);
    process.exitCode = 1;
  });
