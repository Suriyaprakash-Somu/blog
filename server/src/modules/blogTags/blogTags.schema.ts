import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

import { uploadedFiles } from "../uploads/uploadedFiles.schema.js";
import { relations } from "drizzle-orm";

/**
 * Blog Tags - Platform-level global tags for blogs
 */
export const blogTags = pgTable(
  "blog_tags",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),

    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive

    // Image (optional feature image)
    imageFileId: uuid("image_file_id").references(() => uploadedFiles.id, {
      onDelete: "set null",
    }),

    // SEO
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugUnique: uniqueIndex("blog_tags_slug_unique").on(table.slug),
  }),
);

// Relations
export const blogTagsRelations = relations(blogTags, ({ one }) => ({
  image: one(uploadedFiles, {
    fields: [blogTags.imageFileId],
    references: [uploadedFiles.id],
  }),
}));

// Types
export type BlogTag = InferSelectModel<typeof blogTags>;
export type NewBlogTag = InferInsertModel<typeof blogTags>;
