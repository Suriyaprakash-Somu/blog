import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { CRUD_ACCESS } from "../../../access/crudAccess.js";
import { createCrudRoutes, type HookContext } from "../../../core/crudFactory.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { createZodSchemas } from "../../../utils/schemaFactory.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { blogTags } from "../blogTags.schema.js";

const COLUMN_MAP = {
  name: blogTags.name,
  slug: blogTags.slug,
  status: blogTags.status,
  createdAt: blogTags.createdAt,
};

const SEARCHABLE_COLUMNS = ["name", "slug", "description"];

const { insertSchema, updateSchema } = createZodSchemas(blogTags, {
  omit: ["createdAt", "updatedAt"],
  required: ["name", "slug"],
  strict: true,
  overrides: {
    imageFileId: z.string().uuid().optional(),
  },
});

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

function badRequest(message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = 400;
  return err;
}

async function assertPlatformUploadUsable(
  imageFileId: string,
  ctx: Pick<HookContext, "tx">
) {
  const [file] = await ctx.tx
    .select({ id: uploadedFiles.id, status: uploadedFiles.status })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, imageFileId))
    .limit(1);

  if (!file) throw badRequest("Invalid imageFileId");
  if (["DELETED", "PURGED"].includes(String(file.status))) throw badRequest("Image file is unavailable");
}

export const platformBlogTagsRoutes = createCrudRoutes({
  table: blogTags,
  cache: {
    tag: "blogTags",
    keyPrefix: "blogTag",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,

  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: insertSchema,
    updateBody: updateSchema,
  },

  access: CRUD_ACCESS.platformBlogTags,

  rateLimit: {
    list: rateLimitConfig.tenant, 
    detail: rateLimitConfig.tenant,
    create: rateLimitConfig.user,
    update: rateLimitConfig.user,
    delete: rateLimitConfig.user,
  },

  openapi: {
    tag: "Platform Blog Tags",
    resourceName: "blogTag",
  },

  events: {
    resource: "blogTag",
    emitOn: ["create", "update", "delete"],
    enrichPayload: true,
    includeDiff: true,
  },

  beforeCreate: async (data, ctx) => {
    if (data.imageFileId) {
      await assertPlatformUploadUsable(String(data.imageFileId), ctx);
    }
    return data;
  },

  afterCreate: async (data, result, ctx) => {
    if (data.imageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "blogTag",
          attachedToId: result.id,
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(eq(uploadedFiles.id, data.imageFileId));
    }
  },

  beforeUpdate: async (data, existing, ctx) => {
    if (data.imageFileId && data.imageFileId !== existing.imageFileId) {
      await assertPlatformUploadUsable(String(data.imageFileId), ctx);

      if (existing.imageFileId) {
        await ctx.tx
          .update(uploadedFiles)
          .set({
            status: "UPLOADED",
            attachedToType: null,
            attachedToId: null,
            attachedAt: null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          })
          .where(eq(uploadedFiles.id, existing.imageFileId));
      }

      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "blogTag",
          attachedToId: existing.id,
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(eq(uploadedFiles.id, data.imageFileId));
    }
    return data;
  },

  beforeDelete: async (existing, ctx) => {
    if (existing.imageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "UPLOADED",
          attachedToType: null,
          attachedToId: null,
          attachedAt: null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .where(eq(uploadedFiles.id, existing.imageFileId));
    }
  },
});
