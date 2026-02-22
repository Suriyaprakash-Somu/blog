import bcrypt from "bcryptjs";
import { and, eq, isNull, ne, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { CRUD_ACCESS } from "../../../access/crudAccess.js";
import { getSupportEndpointRequirements } from "../../../access/modulePolicies.js";
import { env } from "../../../common/env.js";
import { createCrudRoutes } from "../../../core/crudFactory.js";
import { passwordSchema } from "../../../core/password.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { db } from "../../../db/index.js";
import { BadRequestError, ConflictError } from "../../../errors/AppError.js";
import { tenantPermissionGuard } from "../../../middlewares/ability.guard.js";
import { requireTenantAuth } from "../../../middlewares/tenant.guard.js";
import { TENANT_ROLES, tenantRoles } from "../../roles/tenant/tenant.schema.js";
import { tenantUser, tenantUserAccount } from "./tenant.schema.js";

const COLUMN_MAP = {
  name: tenantUser.name,
  email: tenantUser.email,
  roleId: tenantUser.roleId,
  status: tenantUser.status,
  createdAt: tenantUser.createdAt,
};

const SEARCHABLE_COLUMNS = ["name", "email", "phone"];

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
    phone: z.string().max(20).optional(),
    password: passwordSchema(),
    roleSlug: z.enum([
      TENANT_ROLES.OWNER,
      TENANT_ROLES.ADMIN,
      TENANT_ROLES.MANAGER,
      TENANT_ROLES.MEMBER,
    ]),
    status: z.enum(["active", "inactive"]).optional(),
    emailVerified: z.boolean().optional(),
  })
  .strict();

const updateBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    password: passwordSchema().optional(),
    roleSlug: z
      .enum([
        TENANT_ROLES.OWNER,
        TENANT_ROLES.ADMIN,
        TENANT_ROLES.MANAGER,
        TENANT_ROLES.MEMBER,
      ])
      .optional(),
    status: z.enum(["active", "inactive"]).optional(),
    emailVerified: z.boolean().optional(),
  })
  .strict();

const usersCrudRoutes = createCrudRoutes({
  table: tenantUser,
  cache: {
    tag: "tenant-users",
    keyPrefix: "tenant-user",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,
  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: createBodySchema,
    updateBody: updateBodySchema,
  },
  access: CRUD_ACCESS.tenantUsers,
  rateLimit: {
    list: rateLimitConfig.tenant,
    detail: rateLimitConfig.tenant,
    create: rateLimitConfig.user,
    update: rateLimitConfig.user,
    delete: rateLimitConfig.user,
  },
  openapi: {
    tag: "Tenant Users",
    resourceName: "tenant user",
  },
  events: {
    resource: "tenant-user",
    emitOn: ["create", "update", "delete"],
  },
  beforeCreate: async (data, ctx) => {
    const body = ctx.req.body as z.infer<typeof createBodySchema>;
    const email = body.email.toLowerCase();

    const existing = await db.query.tenantUser.findFirst({
      where: eq(tenantUser.email, email),
    });
    if (existing) {
      throw new ConflictError("Email is already registered");
    }

    const role = await db.query.tenantRoles.findFirst({
      where: eq(tenantRoles.slug, body.roleSlug),
    });
    if (!role) {
      throw new BadRequestError("Invalid role selected");
    }

    return {
      ...data,
      name: body.name,
      email,
      phone: body.phone ?? null,
      roleId: role.id,
      status: body.status ?? "active",
      emailVerified: body.emailVerified ?? false,
    };
  },
  afterCreate: async (_data, created, ctx) => {
    const body = ctx.req.body as z.infer<typeof createBodySchema>;
    const passwordHash = await bcrypt.hash(body.password, env.BCRYPT_ROUNDS);

    await ctx.tx.insert(tenantUserAccount).values({
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
      const duplicate = await db.query.tenantUser.findFirst({
        where: and(eq(tenantUser.email, normalizedEmail), ne(tenantUser.id, existing.id)),
      });
      if (duplicate) {
        throw new ConflictError("Email is already registered");
      }
      updates.email = normalizedEmail;
    }

    if (body.roleSlug) {
      const role = await db.query.tenantRoles.findFirst({
        where: eq(tenantRoles.slug, body.roleSlug),
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
    const existingAccount = await db.query.tenantUserAccount.findFirst({
      where: eq(tenantUserAccount.userId, updated.id),
    });

    if (existingAccount) {
      await ctx.tx
        .update(tenantUserAccount)
        .set({ password: passwordHash })
        .where(eq(tenantUserAccount.userId, updated.id));
      return;
    }

    await ctx.tx.insert(tenantUserAccount).values({
      userId: updated.id,
      accountId: updated.id,
      providerId: "credential",
      password: passwordHash,
    });
  },
  beforeDelete: async (existing) => {
    if (!existing.roleId) return;
    const role = await db.query.tenantRoles.findFirst({
      where: eq(tenantRoles.id, existing.roleId),
    });
    if (role?.slug === TENANT_ROLES.OWNER) {
      throw new BadRequestError("Owner users cannot be deleted");
    }
  },
});

export const tenantUsersRoutes: FastifyPluginAsync = async (fastify) => {
  const rolesEndpointPermission = getSupportEndpointRequirements(
    "tenant.users",
    "roles-options",
  );

  if (!rolesEndpointPermission) {
    throw new Error("Missing support endpoint policy: tenant.users roles-options");
  }

  fastify.get(
    "/roles",
    {
      preHandler: [
        requireTenantAuth(),
        tenantPermissionGuard(rolesEndpointPermission),
      ],
      config: { rateLimit: rateLimitConfig.tenant },
    },
    async (request) => {
      const tenantId = request.tenantSession?.user.tenantId;
      if (!tenantId) return [];

      const rows = await db.query.tenantRoles.findMany({
        where: or(isNull(tenantRoles.tenantId), eq(tenantRoles.tenantId, tenantId)),
      });
      return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug }));
    }
  );

  await fastify.register(usersCrudRoutes);
};
