import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
