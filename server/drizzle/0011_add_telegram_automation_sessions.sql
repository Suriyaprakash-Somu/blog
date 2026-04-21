-- Migration: Telegram automation topic review sessions
-- Stores RSS topic review sessions and candidate topics for Telegram approval flow

CREATE TABLE IF NOT EXISTS "automation_topic_sessions" (
  "id" uuid PRIMARY KEY NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "telegram_chat_id" text,
  "telegram_message_id" integer,
  "selected_candidate_rank" integer,
  "generated_post_id" uuid,
  "error_message" text,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "automation_topic_candidates" (
  "id" uuid PRIMARY KEY NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "automation_topic_sessions"("id") ON DELETE cascade,
  "feed_item_id" uuid NOT NULL REFERENCES "feed_items"("id") ON DELETE cascade,
  "rank" integer NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "source_url" text,
  "source_author" text,
  "source_published_at" timestamp,
  "reasoning" text,
  "is_selected" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "automation_topic_sessions_status_idx" ON "automation_topic_sessions" ("status");
CREATE INDEX IF NOT EXISTS "automation_topic_sessions_expires_at_idx" ON "automation_topic_sessions" ("expires_at");
CREATE INDEX IF NOT EXISTS "automation_topic_candidates_session_idx" ON "automation_topic_candidates" ("session_id");
CREATE UNIQUE INDEX IF NOT EXISTS "automation_topic_candidates_session_rank_idx" ON "automation_topic_candidates" ("session_id", "rank");
