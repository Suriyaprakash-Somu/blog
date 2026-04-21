-- Migration: Split prompts into system_prompt and user_prompt_template
-- This migration adds new columns and removes the old content column

-- Add new columns
ALTER TABLE "prompts" ADD COLUMN "system_prompt" text NOT NULL;
ALTER TABLE "prompts" ADD COLUMN "user_prompt_template" text NOT NULL;

-- Drop old content column
ALTER TABLE "prompts" DROP COLUMN "content";
