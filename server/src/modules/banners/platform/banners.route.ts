import type { FastifyPluginAsync } from "fastify";
import { and, eq, or, sql, isNull } from "drizzle-orm";
import { z } from "zod";
import { createCrudRoutes } from "../../../core/crudFactory.js";
import { createZodSchemas } from "../../../utils/schemaFactory.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { CRUD_ACCESS } from "../../../access/crudAccess.js";
import { db } from "../../../db/index.js";
import { banners } from "../banners.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import type { HookContext } from "../../../core/crudFactory.js";

function badRequest(message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = 400;
  return err;
}

async function assertPlatformUploadUsable(imageFileId: string, ctx: Pick<HookContext, "tx">) {
  const [file] = await ctx.tx
    .select({ id: uploadedFiles.id, status: uploadedFiles.status })
    .from(uploadedFiles)
    .where(and(eq(uploadedFiles.id, imageFileId), isNull(uploadedFiles.tenantId)))
    .limit(1);

  if (!file) throw badRequest("Invalid imageFileId");
  if (["DELETED", "PURGED"].includes(String(file.status))) throw badRequest("Image file is unavailable");
}

const COLUMN_MAP = {
  title: banners.title,
  pathPattern: banners.pathPattern,
  type: banners.type,
  slot: banners.slot,
  isActive: banners.isActive,
  startDate: banners.startDate,
  endDate: banners.endDate,
  createdAt: banners.createdAt,
};

const SEARCHABLE_COLUMNS = ["title", "description", "pathPattern", "slot"];

const listQuerySchema = z
  .object({
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional(),
    filters: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    sorting: z.string().optional(),
  })
  .strict();

const idParamsSchema = z.object({ id: z.string().uuid() });

const { insertSchema, updateSchema } = createZodSchemas(banners, {
  omit: ["createdAt", "updatedAt", "createdByAdminId", "updatedByAdminId"],
  required: ["title", "pathPattern"],
  strict: true,
  overrides: {
    props: z.record(z.string(), z.unknown()).optional(),
    targetSegments: z.array(z.enum(["GUEST", "USER"])).optional(),
  },
});

const createBodySchema = insertSchema.extend({
  title: z.string().min(1),
  pathPattern: z.string().min(1),
  slot: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().optional(),
  ),
  startDate: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  endDate: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
});

const updateBodySchema = updateSchema.extend({
  slot: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().optional(),
  ),
  startDate: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
  endDate: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.coerce.date().optional(),
  ),
});

const platformBannersCrudRoutes = createCrudRoutes({
  table: banners,
  cache: {
    tag: "platform-banners",
    keyPrefix: "platform-banner",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,
  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: createBodySchema,
    updateBody: updateBodySchema,
  },
  access: CRUD_ACCESS.bannersPlatform,
  rateLimit: {
    list: rateLimitConfig.platform,
    detail: rateLimitConfig.platform,
    create: rateLimitConfig.platform,
    update: rateLimitConfig.platform,
    delete: rateLimitConfig.platform,
  },
  openapi: {
    tag: "Platform Banners",
    resourceName: "platform banner",
  },
  beforeCreate: async (data, ctx) => {
    const adminId = ctx.req.platformUser?.user.id ?? null;

    if (data.imageFileId) {
      await assertPlatformUploadUsable(String(data.imageFileId), ctx);
    }

    return {
      ...data,
      createdByAdminId: adminId,
      updatedByAdminId: adminId,
    };
  },
  afterCreate: async (data, created, ctx) => {
    if (!data.imageFileId) return;

    const targetSegments = Array.isArray(data.targetSegments) ? data.targetSegments : [];
    const shouldPublish = targetSegments.includes("GUEST");

    const setValues: Record<string, unknown> = {
      status: "ATTACHED",
      attachedToType: "platform_banner",
      attachedToId: created.id,
      attachedAt: new Date(),
      expiresAt: null,
      ...(shouldPublish ? { isPublic: true } : {}),
    };

    await ctx.tx
      .update(uploadedFiles)
      .set(setValues)
      .where(and(eq(uploadedFiles.id, data.imageFileId), isNull(uploadedFiles.tenantId)));
  },
  beforeUpdate: async (data, existing, ctx) => {
    const updates = {
      ...data,
      updatedByAdminId: ctx.req.platformUser?.user.id ?? null,
    } as typeof data;

    const targetSegments = Array.isArray(updates.targetSegments)
      ? updates.targetSegments
      : Array.isArray(existing.targetSegments)
        ? existing.targetSegments
        : [];
    const shouldPublish = targetSegments.includes("GUEST");

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
          .where(and(eq(uploadedFiles.id, existing.imageFileId), isNull(uploadedFiles.tenantId)));
      }

      const attachSet: Record<string, unknown> = {
        status: "ATTACHED",
        attachedToType: "platform_banner",
        attachedToId: existing.id,
        attachedAt: new Date(),
        expiresAt: null,
        ...(shouldPublish ? { isPublic: true } : {}),
      };

      await ctx.tx
        .update(uploadedFiles)
        .set(attachSet)
        .where(and(eq(uploadedFiles.id, data.imageFileId), isNull(uploadedFiles.tenantId)));
    } else if (shouldPublish && existing.imageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({ isPublic: true })
        .where(and(eq(uploadedFiles.id, existing.imageFileId), isNull(uploadedFiles.tenantId)));
    }

    return updates;
  },
  beforeDelete: async (existing, ctx) => {
    if (!existing.imageFileId) return;
    await ctx.tx
      .update(uploadedFiles)
      .set({
        status: "UPLOADED",
        attachedToType: null,
        attachedToId: null,
        attachedAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .where(and(eq(uploadedFiles.id, existing.imageFileId), isNull(uploadedFiles.tenantId)));
  },
});

export const platformBannersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/active",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.BANNER),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async () => {
      const now = new Date();
      const rows = await db
        .select()
        .from(banners)
        .where(
          and(
            eq(banners.isActive, true),
            or(sql`${banners.startDate} IS NULL`, sql`${banners.startDate} <= ${now}`),
            or(sql`${banners.endDate} IS NULL`, sql`${banners.endDate} >= ${now}`),
          ),
        )
        .orderBy(sql`${banners.createdAt} desc`);

      return { rows, rowCount: rows.length };
    },
  );

  await fastify.register(platformBannersCrudRoutes);
};
