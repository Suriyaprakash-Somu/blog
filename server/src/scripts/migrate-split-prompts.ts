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

async function runSplitPromptsMigration() {
  console.log("[MIGRATION 0007] Starting split prompts migration...");
  
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Add new columns (allow NULL temporarily)
    await client.query(`
      ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "system_prompt" text;
      ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "user_prompt_template" text;
    `);
    
    console.log("[MIGRATION 0007] Added system_prompt and user_prompt_template columns");
    
    // Migrate existing content to system_prompt (if any old data exists)
    await client.query(`
      UPDATE "prompts" 
      SET "system_prompt" = "content", 
          "user_prompt_template" = 'Please generate the content for: "{{title}}". {{additionalInstructions}}'
      WHERE "content" IS NOT NULL AND "system_prompt" IS NULL;
    `);
    
    console.log("[MIGRATION 0007] Migrated existing content to system_prompt");
    
    // Make columns NOT NULL
    await client.query(`
      ALTER TABLE "prompts" ALTER COLUMN "system_prompt" SET NOT NULL;
      ALTER TABLE "prompts" ALTER COLUMN "user_prompt_template" SET NOT NULL;
    `);
    
    // Drop old content column
    await client.query(`
      ALTER TABLE "prompts" DROP COLUMN IF EXISTS "content";
    `);
    
    console.log("[MIGRATION 0007] Dropped old content column");
    
    await client.query("COMMIT");
    
    console.log("[MIGRATION 0007] ✅ Split prompts migration completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[MIGRATION 0007] ❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runSplitPromptsMigration()
  .catch((err) => {
    console.error("[MIGRATION 0007] FAILED", err);
    process.exitCode = 1;
  });
