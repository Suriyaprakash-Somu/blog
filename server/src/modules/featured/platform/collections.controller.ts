import { createCrudRoutes } from "../../../core/crudFactory.js";
import { featuredCollections, featuredItems } from "../featured.schema.js";
import { eq } from "drizzle-orm";
import {
  createFeaturedCollectionSchema,
  updateFeaturedCollectionSchema,
} from "./featured.validation.js";
import type { FastifyRequest } from "fastify";
import { z } from "zod";

// Define a local interface to extend FastifyRequest for the user context
interface RequestWithUser extends FastifyRequest {
  user?: { id: string };
}

const listQuerySchema = z
  .object({
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional(),
    filters: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    sorting: z.string().optional(),
  })
  .strict();

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

export const collectionsCrud = createCrudRoutes({
  table: featuredCollections,
  cache: {
    tag: "featuredCollections",
    keyPrefix: "collection",
  },
  columnMap: {
    name: featuredCollections.name,
    slug: featuredCollections.slug,
    description: featuredCollections.description,
    createdAt: featuredCollections.createdAt,
  },
  searchableColumns: ["name", "slug", "description"],
  
  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: createFeaturedCollectionSchema,
    updateBody: updateFeaturedCollectionSchema,
  },
  
  openapi: {
    tag: "Featured Collections",
    resourceName: "collection",
  },

  access: {
    mode: "platform",
    tenantScope: false,
    abilities: {
      list: { action: "read", subject: "PlatformSettings" },
      detail: { action: "read", subject: "PlatformSettings" },
      create: { action: "manage", subject: "PlatformSettings" },
      update: { action: "manage", subject: "PlatformSettings" },
      delete: { action: "manage", subject: "PlatformSettings" },
    },
  },

  beforeCreate: async (data: any, ctx: any) => {
    const user = ctx?.req?.user;
    const { items, ...rest } = data;
    // Stash items on ctx so afterCreate can access them
    ctx._pendingItems = items;
    if (user) {
      return { ...rest, createdByAdminId: user.id };
    }
    return rest;
  },
  afterCreate: async (_data: any, result: any, ctx: any) => {
    const items = ctx._pendingItems;
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        ...item,
        collectionId: result.id,
      }));
      await ctx.tx.insert(featuredItems).values(itemsToInsert);
    }
  },
  beforeUpdate: async (data: any, _existing: any, ctx: any) => {
    const user = ctx?.req?.user;
    const { items, ...rest } = data;
    // Stash items on ctx so afterUpdate can access them
    ctx._pendingItems = items;
    if (user) {
      return { ...rest, updatedByAdminId: user.id };
    }
    return rest;
  },
  afterUpdate: async (_data: any, _existing: any, result: any, ctx: any) => {
    const items = ctx._pendingItems;
    if (items !== undefined) {
      // Delete old items
      await ctx.tx.delete(featuredItems).where(eq(featuredItems.collectionId, result.id));
      
      // Insert new items
      if (items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          ...item,
          collectionId: result.id,
        }));
        await ctx.tx.insert(featuredItems).values(itemsToInsert);
      }
    }
  },
});
