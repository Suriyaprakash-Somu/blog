import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const rssSources = pgTable("rss_sources", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    name: text("name").notNull(),
    url: text("url").notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedItems = pgTable("feed_items", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    sourceId: uuid("source_id")
        .references(() => rssSources.id, { onDelete: "cascade" })
        .notNull(),
    guid: text("guid").notNull(), // Unique ID from RSS feed
    url: text("url").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content"),
    author: text("author"),
    publishedAt: timestamp("published_at"),
    processingStatus: text("processing_status", {
        enum: ["unprocessed", "ignored", "processed", "failed"],
    })
        .default("unprocessed")
        .notNull(),
    processingError: text("processing_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
