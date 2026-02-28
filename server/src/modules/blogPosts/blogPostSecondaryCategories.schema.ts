import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { blogPosts } from "./blogPosts.schema.js";
import { blogCategories } from "../blogCategories/blogCategories.schema.js";

/**
 * Blog Post ↔ Secondary Category junction table (many-to-many)
 */
export const blogPostSecondaryCategories = pgTable(
  "blog_post_secondary_categories",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => blogCategories.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.categoryId] }),
  }),
);

export const blogPostSecondaryCategoriesRelations = relations(
  blogPostSecondaryCategories,
  ({ one }) => ({
    post: one(blogPosts, {
      fields: [blogPostSecondaryCategories.postId],
      references: [blogPosts.id],
    }),
    category: one(blogCategories, {
      fields: [blogPostSecondaryCategories.categoryId],
      references: [blogCategories.id],
    }),
  }),
);
