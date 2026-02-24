import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  boolean,
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

import { blogCategories } from "../blogCategories/blogCategories.schema.js";
import { uploadedFiles } from "../uploads/uploadedFiles.schema.js";
import { platformUser } from "../users/platform/platform.schema.js";

/* ------------------------------------------------------------------ */
/*  Types for JSONB columns                                           */
/* ------------------------------------------------------------------ */

export interface TocEntry {
  id: string;
  text: string;
  level: number; // 2–5
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/* ------------------------------------------------------------------ */
/*  Table                                                             */
/* ------------------------------------------------------------------ */

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),

    // Core content
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content"),

    // Auto-extracted
    tableOfContents: jsonb("table_of_contents").$type<TocEntry[]>().default([]),
    readTimeMinutes: integer("read_time_minutes").default(0),

    // SEO
    faq: jsonb("faq").$type<FaqEntry[]>().default([]),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),

    // Status & publishing
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, published, archived
    publishedAt: timestamp("published_at"),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Relations
    categoryId: uuid("category_id").references(() => blogCategories.id, {
      onDelete: "set null",
    }),
    featuredImageFileId: uuid("featured_image_file_id").references(
      () => uploadedFiles.id,
      { onDelete: "set null" },
    ),
    contentImageFileIds: text("content_image_file_ids")
      .array()
      .default([]),
    authorId: uuid("author_id").references(() => platformUser.id, {
      onDelete: "set null",
    }),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugUnique: uniqueIndex("blog_posts_slug_unique").on(table.slug),
  }),
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  featuredImage: one(uploadedFiles, {
    fields: [blogPosts.featuredImageFileId],
    references: [uploadedFiles.id],
  }),
  author: one(platformUser, {
    fields: [blogPosts.authorId],
    references: [platformUser.id],
  }),
}));

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type BlogPost = InferSelectModel<typeof blogPosts>;
export type NewBlogPost = InferInsertModel<typeof blogPosts>;
