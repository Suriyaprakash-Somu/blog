-- Migration: Add template support to prompts table
-- Adds columns for generation templates with module-specific defaults

-- Add template columns
ALTER TABLE "prompts" ADD COLUMN "is_template" boolean DEFAULT false;
ALTER TABLE "prompts" ADD COLUMN "template_name" varchar(255);
ALTER TABLE "prompts" ADD COLUMN "default_instructions" text;

-- Indexes for template queries
CREATE INDEX IF NOT EXISTS "prompts_is_template_idx" ON "prompts" ("is_template");
CREATE INDEX IF NOT EXISTS "prompts_module_template_idx" ON "prompts" ("module", "is_template");
