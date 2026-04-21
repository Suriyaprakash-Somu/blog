-- Migration: add category and tag assignment state to Telegram automation sessions

ALTER TABLE "automation_topic_sessions"
ADD COLUMN IF NOT EXISTS "workflow_step" text NOT NULL DEFAULT 'topic_selection',
ADD COLUMN IF NOT EXISTS "assigned_category_id" uuid,
ADD COLUMN IF NOT EXISTS "selected_tag_ids" jsonb DEFAULT '[]'::jsonb;

ALTER TABLE "automation_topic_sessions"
ALTER COLUMN "status" TYPE text;

CREATE INDEX IF NOT EXISTS "automation_topic_sessions_workflow_step_idx" ON "automation_topic_sessions" ("workflow_step");
