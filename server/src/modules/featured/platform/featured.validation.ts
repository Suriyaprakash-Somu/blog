import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { featuredCollections, featuredItems, entityTypeEnum } from "../featured.schema.js";

// Collection Schemas
export const selectFeaturedCollectionSchema = createSelectSchema(featuredCollections);

export const createFeaturedItemSchema = z.object({
  entityType: z.enum(entityTypeEnum.enumValues),
  entityId: z.string().uuid(),
  order: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const updateFeaturedItemSchema = createFeaturedItemSchema.partial();

export const createFeaturedCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(255),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  items: z.array(createFeaturedItemSchema.extend({
    id: z.string().uuid().optional()
  })).optional(),
});

export const updateFeaturedCollectionSchema = createFeaturedCollectionSchema.partial();

// Item Schemas
export const selectFeaturedItemSchema = createSelectSchema(featuredItems);

