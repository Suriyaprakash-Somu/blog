-- Migration: LLM Response Cache
-- Persistent storage for all LLM responses (success + failures)

CREATE TABLE IF NOT EXISTS "llm_response_cache" (
  "id" uuid PRIMARY KEY NOT NULL,
  "cache_key" varchar(255) NOT NULL,
  "prompt_hash" varchar(64) NOT NULL,
  "module" varchar(50) NOT NULL,
  "input_title" varchar(500),
  "input_name" varchar(255),
  "additional_instructions" text,
  "system_prompt" text NOT NULL,
  "user_prompt" text NOT NULL,
  "raw_response" text NOT NULL,
  "parsed_data" jsonb,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "model" varchar(100),
  "temperature" integer,
  "token_usage" integer,
  "error_message" text,
  "error_stack" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp,
  
  CONSTRAINT "llm_response_cache_cache_key_unique" UNIQUE ("cache_key")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "llm_prompt_hash_idx" ON "llm_response_cache" ("prompt_hash");
CREATE INDEX IF NOT EXISTS "llm_module_idx" ON "llm_response_cache" ("module");
CREATE INDEX IF NOT EXISTS "llm_status_idx" ON "llm_response_cache" ("status");
CREATE INDEX IF NOT EXISTS "llm_created_at_idx" ON "llm_response_cache" ("created_at");
