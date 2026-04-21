import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/* ------------------------------------------------------------------ */
/*  Table                                                             */
/* ------------------------------------------------------------------ */

export const prompts = pgTable("prompts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),

  module: varchar("module", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  
  // Template fields
  isTemplate: boolean("is_template").default(false),
  isDefault: boolean("is_default").default(false),
  templateName: varchar("template_name", { length: 255 }),
  defaultInstructions: text("default_instructions"),
  
  isActive: boolean("is_active").default(false).notNull(),
  version: integer("version").default(1).notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type Prompt = InferSelectModel<typeof prompts>;
export type NewPrompt = InferInsertModel<typeof prompts>;
