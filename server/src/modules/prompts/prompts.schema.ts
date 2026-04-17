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

  module: varchar("module", { length: 50 }).notNull(), // 'blogPosts', 'blogCategories', 'blogTags', 'rssTopic'
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
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
