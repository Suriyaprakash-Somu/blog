import { createCrudRoutes } from "../../core/crudFactory.js";
import { branches } from "./branches.schema.js";
import { uploadedFiles } from "../uploads/uploadedFiles.schema.js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { rateLimitConfig } from "../../core/rateLimit.js";
import { createZodSchemas } from "../../utils/schemaFactory.js";
import { CRUD_ACCESS } from "../../access/crudAccess.js";
import type { HookContext } from "../../core/crudFactory.js";

// Column map for filtering
const COLUMN_MAP = {
  name: branches.name,
  code: branches.code,
  type: branches.type,
  status: branches.status,
  city: branches.city,
  state: branches.state,
  createdAt: branches.createdAt,
};

// Searchable columns for global search
const SEARCHABLE_COLUMNS = ["name", "code", "city"];

const { insertSchema: branchCreateSchema, updateSchema: branchUpdateSchema } =
  createZodSchemas(branches, {
    omit: ["tenantId", "createdAt", "updatedAt"],
    required: ["name"],
    strict: true,
    overrides: {
      email: z.string().email(),
      imageFileId: z.string().uuid().optional(),
      managerId: z.string().uuid().optional(),
      latitude: z.coerce.number().optional(),
      longitude: z.coerce.number().optional(),
      isHeadquarters: z.coerce.boolean().optional(),
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

async function assertTenantUploadUsable(
  imageFileId: string,
  ctx: Pick<HookContext, "tx" | "tenantId">
) {
  const [file] = await ctx.tx
    .select({ id: uploadedFiles.id, status: uploadedFiles.status })
    .from(uploadedFiles)
    .where(and(eq(uploadedFiles.id, imageFileId), eq(uploadedFiles.tenantId, ctx.tenantId)))
    .limit(1);

  if (!file) throw badRequest("Invalid imageFileId");
  if (["DELETED", "PURGED"].includes(String(file.status))) throw badRequest("Image file is unavailable");
}


export const tenantBranchesRoutes = createCrudRoutes({
  table: branches,
  cache: {
    tag: "branches",
    keyPrefix: "branch",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,

  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: branchCreateSchema,
    updateBody: branchUpdateSchema,
  },

  access: CRUD_ACCESS.branches,


  rateLimit: {
    list: rateLimitConfig.tenant,
    detail: rateLimitConfig.tenant,
    create: rateLimitConfig.user,
    update: rateLimitConfig.user,
    delete: rateLimitConfig.user,
  },

  openapi: {
    tag: "Branches",
    resourceName: "branch",
  },

  // Event configuration - emits branch.created, branch.updated, branch.deleted
  events: {
    resource: "branch",
    emitOn: ["create", "update", "delete"],
    enrichPayload: true, // Include full entity in event
    includeDiff: true, // Include changes in update events
  },

  // Hooks
  beforeCreate: async (data, ctx) => {
    if (data.imageFileId) {
      await assertTenantUploadUsable(String(data.imageFileId), ctx);
    }
    return data;
  },

  afterCreate: async (data, result, ctx) => {
    // Attach the image file to this branch
    if (data.imageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "branch",
          attachedToId: result.id,
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(and(eq(uploadedFiles.id, data.imageFileId), eq(uploadedFiles.tenantId, ctx.tenantId)));
    }
  },

  beforeUpdate: async (data, existing, ctx) => {
    // Handle image change
    if (data.imageFileId && data.imageFileId !== existing.imageFileId) {
      await assertTenantUploadUsable(String(data.imageFileId), ctx);

      // Detach old image
      if (existing.imageFileId) {
        await ctx.tx
          .update(uploadedFiles)
          .set({
            status: "UPLOADED",
            attachedToType: null,
            attachedToId: null,
            attachedAt: null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr TTL
          })
          .where(and(eq(uploadedFiles.id, existing.imageFileId), eq(uploadedFiles.tenantId, ctx.tenantId)));
      }

      // Attach new image
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "branch",
          attachedToId: existing.id, // Using existing ID as it matches the record being updated
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(and(eq(uploadedFiles.id, data.imageFileId), eq(uploadedFiles.tenantId, ctx.tenantId)));
    }
    return data;
  },

  beforeDelete: async (existing, ctx) => {
    // Detach image before deleting
    if (existing.imageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "UPLOADED",
          attachedToType: null,
          attachedToId: null,
          attachedAt: null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr TTL
        })
        .where(and(eq(uploadedFiles.id, existing.imageFileId), eq(uploadedFiles.tenantId, ctx.tenantId)));
    }
  },
});
