import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const llmResponseCache = pgTable(
  "llm_response_cache",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),

    // Cache key
    cacheKey: varchar("cache_key", { length: 255 }).notNull(),
    promptHash: varchar("prompt_hash", { length: 64 }).notNull(),

    // Module context
    module: varchar("module", { length: 50 }).notNull(),

    // Input data (for reference)
    inputTitle: varchar("input_title", { length: 500 }),
    inputName: varchar("input_name", { length: 255 }),
    additionalInstructions: text("additional_instructions"),

    // Prompt data (for debugging/retry)
    systemPrompt: text("system_prompt").notNull(),
    userPrompt: text("user_prompt").notNull(),

    // LLM response
    rawResponse: text("raw_response").notNull(),
    parsedData: jsonb("parsed_data"),

    // Status
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    // Values: "pending", "success", "failed", "needs_review", "corrected"

    // LLM metadata
    model: varchar("model", { length: 100 }),
    temperature: varchar("temperature", { length: 10 }),
    tokenUsage: integer("token_usage"),

    // Error info (if failed)
    errorMessage: text("error_message"),
    errorStack: text("error_stack"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => ({
    cacheKeyUnique: uniqueIndex("llm_cache_key_idx").on(table.cacheKey),
    promptHashIdx: index("llm_prompt_hash_idx").on(table.promptHash),
    moduleIdx: index("llm_module_idx").on(table.module),
    statusIdx: index("llm_status_idx").on(table.status),
    createdAtIdx: index("llm_created_at_idx").on(table.createdAt),
  }),
);

export type LLMResponseCache = InferSelectModel<typeof llmResponseCache>;
export type NewLLMResponseCache = InferInsertModel<typeof llmResponseCache>;
