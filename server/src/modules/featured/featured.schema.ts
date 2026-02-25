import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { platformUser } from "../users/platform/platform.schema.js";

export const featuredCollections = pgTable(
  "featured_collections",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    
    createdByAdminId: uuid("created_by_admin_id").references(() => platformUser.id, {
      onDelete: "set null",
    }),
    updatedByAdminId: uuid("updated_by_admin_id").references(() => platformUser.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    slugIndex: index("featured_collections_slug_idx").on(table.slug),
    activeIndex: index("featured_collections_active_idx").on(table.isActive),
  }),
);

export type FeaturedCollection = InferSelectModel<typeof featuredCollections>;
export type NewFeaturedCollection = InferInsertModel<typeof featuredCollections>;

export const entityTypeEnum = pgEnum("featured_entity_type", ["POST", "CATEGORY", "TAG"]);

export const featuredItems = pgTable(
  "featured_items",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => featuredCollections.id, { onDelete: "cascade" }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    order: integer("sort_order").notNull().default(0), // "order" is a reserved keyword in SQL sometimes, safer to use sort_order as column name
    isActive: boolean("is_active").notNull().default(true),
    
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    collectionIndex: index("featured_items_collection_idx").on(table.collectionId),
    entityIndex: index("featured_items_entity_idx").on(table.entityType, table.entityId),
    orderIndex: index("featured_items_order_idx").on(table.collectionId, table.order),
  }),
);

export type FeaturedItem = InferSelectModel<typeof featuredItems>;
export type NewFeaturedItem = InferInsertModel<typeof featuredItems>;
