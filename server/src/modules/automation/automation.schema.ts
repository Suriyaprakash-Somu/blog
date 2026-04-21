import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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

export const automationTopicSessions = pgTable("automation_topic_sessions", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    status: text("status", {
        enum: ["pending", "selected", "generated", "categorizing", "tagging", "completed", "failed", "expired", "cancelled"],
    })
        .default("pending")
        .notNull(),
    workflowStep: text("workflow_step", {
        enum: ["topic_selection", "draft_generated", "category_selection", "tag_selection", "completed"],
    })
        .default("topic_selection")
        .notNull(),
    telegramChatId: text("telegram_chat_id"),
    telegramMessageId: integer("telegram_message_id"),
    selectedCandidateRank: integer("selected_candidate_rank"),
    generatedPostId: uuid("generated_post_id"),
    assignedCategoryId: uuid("assigned_category_id"),
    assignedSecondaryCategoryId: uuid("assigned_secondary_category_id"),
    selectedTagIds: jsonb("selected_tag_ids").$type<string[]>().default([]),
    errorMessage: text("error_message"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const automationTopicCandidates = pgTable("automation_topic_candidates", {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    sessionId: uuid("session_id")
        .references(() => automationTopicSessions.id, { onDelete: "cascade" })
        .notNull(),
    feedItemId: uuid("feed_item_id")
        .references(() => feedItems.id, { onDelete: "cascade" })
        .notNull(),
    rank: integer("rank").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    sourceUrl: text("source_url"),
    sourceAuthor: text("source_author"),
    sourcePublishedAt: timestamp("source_published_at"),
    reasoning: text("reasoning"),
    isSelected: boolean("is_selected").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
