import { createCrudRoutes } from "../../../core/crudFactory.js";
import { featuredItems } from "../featured.schema.js";
import {
  createFeaturedItemSchema,
  updateFeaturedItemSchema,
} from "./featured.validation.js";
import { z } from "zod";

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

export const itemsCrud = createCrudRoutes({
  table: featuredItems,
  cache: {
    tag: "featuredItems",
    keyPrefix: "item",
  },
  columnMap: {
    order: featuredItems.order,
    createdAt: featuredItems.createdAt,
    collectionId: featuredItems.collectionId,
  },
  searchableColumns: [],
  
  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: createFeaturedItemSchema,
    updateBody: updateFeaturedItemSchema,
  },
  
  openapi: {
    tag: "Featured Items",
    resourceName: "item",
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
});
