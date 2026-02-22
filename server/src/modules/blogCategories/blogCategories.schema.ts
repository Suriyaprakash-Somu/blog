import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
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

/**
 * Blog Categories - Platform-level global categories for blogs
 */
export const blogCategories = pgTable(
  "blog_categories",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),

    // Core
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive

    // Image (optional feature image)
    imageFileId: uuid("image_file_id").references(() => uploadedFiles.id, {
      onDelete: "set null",
    }),

    // SEO
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords"),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugUnique: uniqueIndex("blog_categories_slug_unique").on(table.slug),
  }),
);

// Relations
export const blogCategoriesRelations = relations(blogCategories, ({ one }) => ({
  image: one(uploadedFiles, {
    fields: [blogCategories.imageFileId],
    references: [uploadedFiles.id],
  }),
}));

// Types
export type BlogCategory = InferSelectModel<typeof blogCategories>;
export type NewBlogCategory = InferInsertModel<typeof blogCategories>;
