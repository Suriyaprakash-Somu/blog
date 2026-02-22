import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { createCrudRoutes } from "../../../core/crudFactory.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { CRUD_ACCESS } from "../../../access/crudAccess.js";
import { getSupportEndpointRequirements } from "../../../access/modulePolicies.js";
import { db } from "../../../db/index.js";
import { ConflictError, BadRequestError } from "../../../errors/AppError.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformPermissionGuard } from "../../../middlewares/ability.guard.js";
import { platformRoles, PLATFORM_ROLES } from "../../roles/platform/platform.schema.js";
import { platformUser, platformUserAccount } from "./platform.schema.js";
import { env } from "../../../common/env.js";
import { passwordSchema } from "../../../core/password.js";

const COLUMN_MAP = {
  name: platformUser.name,
  email: platformUser.email,
  roleId: platformUser.roleId,
  emailVerified: platformUser.emailVerified,
  createdAt: platformUser.createdAt,
};

const SEARCHABLE_COLUMNS = ["name", "email"];

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

const createBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: passwordSchema(),
    roleSlug: z.enum([
      PLATFORM_ROLES.OWNER,
      PLATFORM_ROLES.ADMIN,
      PLATFORM_ROLES.MANAGER,
      PLATFORM_ROLES.MEMBER,
    ]),
    emailVerified: z.boolean().optional(),
  })
  .strict();

const updateBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    password: passwordSchema().optional(),
    roleSlug: z
      .enum([
        PLATFORM_ROLES.OWNER,
        PLATFORM_ROLES.ADMIN,
        PLATFORM_ROLES.MANAGER,
        PLATFORM_ROLES.MEMBER,
      ])
      .optional(),
    emailVerified: z.boolean().optional(),
  })
  .strict();

const usersCrudRoutes = createCrudRoutes({
  table: platformUser,
  cache: {
    tag: "platform-users",
    keyPrefix: "platform-user",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,
  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: createBodySchema,
    updateBody: updateBodySchema,
  },
  access: CRUD_ACCESS.platformUsers,
  rateLimit: {
    list: rateLimitConfig.platform,
    detail: rateLimitConfig.platform,
    create: rateLimitConfig.platform,
    update: rateLimitConfig.platform,
    delete: rateLimitConfig.platform,
  },
  openapi: {
    tag: "Platform Users",
    resourceName: "platform user",
  },
  events: {
    resource: "platform-user",
    emitOn: ["create", "update", "delete"],
  },
  beforeCreate: async (data, ctx) => {
    const body = ctx.req.body as z.infer<typeof createBodySchema>;
    const email = body.email.toLowerCase();

    const existing = await db.query.platformUser.findFirst({
      where: eq(platformUser.email, email),
    });
    if (existing) {
      throw new ConflictError("Email is already registered");
    }

    const role = await db.query.platformRoles.findFirst({
      where: eq(platformRoles.slug, body.roleSlug),
    });
    if (!role) {
      throw new BadRequestError("Invalid role selected");
    }

    return {
      ...data,
      name: body.name,
      email,
      roleId: role.id,
      emailVerified: body.emailVerified ?? false,
    };
  },
  afterCreate: async (_data, created, ctx) => {
    const body = ctx.req.body as z.infer<typeof createBodySchema>;
    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);

    await ctx.tx.insert(platformUserAccount).values({
      userId: created.id,
      accountId: created.id,
      providerId: "credential",
      password: passwordHash,
    });
  },
  beforeUpdate: async (data, existing, ctx) => {
    const body = ctx.req.body as z.infer<typeof updateBodySchema>;
    const updates = { ...data } as Record<string, unknown>;
    delete updates.password;
    delete updates.roleSlug;

    if (body.email) {
      const normalizedEmail = body.email.toLowerCase();
      const duplicate = await db.query.platformUser.findFirst({
        where: and(
          eq(platformUser.email, normalizedEmail),
          ne(platformUser.id, existing.id)
        ),
      });
      if (duplicate) {
        throw new ConflictError("Email is already registered");
      }
      updates.email = normalizedEmail;
    }

    if (body.roleSlug) {
      const role = await db.query.platformRoles.findFirst({
        where: eq(platformRoles.slug, body.roleSlug),
      });
      if (!role) {
        throw new BadRequestError("Invalid role selected");
      }
      updates.roleId = role.id;
    }

    return updates as typeof data;
  },
  afterUpdate: async (_data, _existing, updated, ctx) => {
    const body = ctx.req.body as z.infer<typeof updateBodySchema>;
    if (!body.password) {
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);
    const existingAccount = await db.query.platformUserAccount.findFirst({
      where: eq(platformUserAccount.userId, updated.id),
    });

    if (existingAccount) {
      await ctx.tx
        .update(platformUserAccount)
        .set({ password: passwordHash })
        .where(eq(platformUserAccount.userId, updated.id));
      return;
    }

    await ctx.tx.insert(platformUserAccount).values({
      userId: updated.id,
      accountId: updated.id,
      providerId: "credential",
      password: passwordHash,
    });
  },
  beforeDelete: async (existing) => {
    if (!existing.roleId) return;
    const role = await db.query.platformRoles.findFirst({
      where: eq(platformRoles.id, existing.roleId),
    });
    if (role?.slug === PLATFORM_ROLES.OWNER) {
      throw new BadRequestError("Owner users cannot be deleted");
    }
  },
});

export const platformUsersRoutes: FastifyPluginAsync = async (fastify) => {
  const rolesEndpointPermission = getSupportEndpointRequirements(
    "platform.users",
    "roles-options",
  );

  if (!rolesEndpointPermission) {
    throw new Error("Missing support endpoint policy: platform.users roles-options");
  }

  fastify.get(
    "/roles",
    {
      preHandler: [
        requirePlatformAuth(),
        platformPermissionGuard(rolesEndpointPermission),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async () => {
      const rows = await db.query.platformRoles.findMany();
      return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
    }
  );

  await fastify.register(usersCrudRoutes);
};
