-- Custom SQL migration file

ALTER TABLE "automation_topic_sessions" ADD COLUMN IF NOT EXISTS "assigned_secondary_category_id" uuid;
