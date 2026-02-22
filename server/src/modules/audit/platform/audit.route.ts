import { z } from "zod";
import { asc, count, desc, inArray, type SQL } from "drizzle-orm";
import { createCrudRoutes } from "../../../core/crudFactory.js";
import { auditLogs } from "../../../db/schema/auditLogs.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import type { FastifyPluginAsync } from "fastify";
import { CRUD_ACCESS } from "../../../access/crudAccess.js";
import { db } from "../../../db/index.js";
import { buildFilters, parseSorting } from "../../../core/filterBuilder.js";
import { validateQuery } from "../../../core/validate.js";
import { platformUser } from "../../users/platform/platform.schema.js";
import { platformRoles } from "../../roles/platform/platform.schema.js";
import { tenantUser } from "../../users/tenant/tenant.schema.js";
import { tenantRoles } from "../../roles/tenant/tenant.schema.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

const COLUMN_MAP = {
  action: auditLogs.action,
  resourceType: auditLogs.resourceType,
  resourceId: auditLogs.resourceId,
  actorId: auditLogs.actorId,
  actorType: auditLogs.actorType,
  impersonatedByAdminId: auditLogs.impersonatedByAdminId,
  tenantId: auditLogs.tenantId,
  createdAt: auditLogs.createdAt,
};

const SEARCHABLE_COLUMNS = [
  "action",
  "resourceType",
  "resourceId",
  "actorId",
];

const listQuerySchema = z
  .object({
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional(),
    filters: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    sorting: z.string().optional(),
  })
  .strict();

const idParamsSchema = z.object({ id: z.string().uuid() });

const toRoleName = (roleName: string | null | undefined, actorType: string) => {
  if (roleName) return roleName;
  if (actorType === "admin") return "Platform Admin";
  if (actorType === "user") return "Tenant User";
  return "System";
};

const auditCrudRoutes = createCrudRoutes({
  table: auditLogs,
  cache: {
    tag: "audit-logs",
    keyPrefix: "audit-log",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,
  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
  },
  access: CRUD_ACCESS.auditLogs,
  rateLimit: {
    detail: rateLimitConfig.platform,
  },
  routes: {
    list: false,
    create: false,
    update: false,
    delete: false,
  },
  openapi: {
    tag: "Audit Logs",
    resourceName: "audit log",
  },
  audit: {
    enabled: false,
  },
});

export const platformAuditLogsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    {
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.AUDIT_LOG),
        validateQuery(listQuerySchema),
      ],
    },
    async (request, reply) => {
      const query = request.query as {
        page?: string;
        pageSize?: string;
        filters?: string;
        sorting?: string;
      };

      const page = Math.max(1, parseInt(query.page || "1", 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || "10", 10)));
      const offset = (page - 1) * pageSize;

      const filterCondition = buildFilters(query.filters || null, {
        columnMap: COLUMN_MAP,
        searchableColumns: SEARCHABLE_COLUMNS,
      });

      const sorting = parseSorting(query.sorting || null);
      let orderBy: SQL = desc(auditLogs.createdAt);
      if (sorting && sorting.length > 0) {
        const firstSort = sorting[0];
        const column = COLUMN_MAP[firstSort.id as keyof typeof COLUMN_MAP];
        if (column) {
          orderBy = firstSort.desc ? desc(column) : asc(column);
        }
      }

      const countQuery = filterCondition
        ? db.select({ count: count() }).from(auditLogs).where(filterCondition)
        : db.select({ count: count() }).from(auditLogs);
      const [countResult] = await countQuery;
      const rowCount = Number(countResult?.count ?? 0);

      const rows = filterCondition
        ? await db
            .select()
            .from(auditLogs)
            .where(filterCondition)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(offset)
        : await db
            .select()
            .from(auditLogs)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(offset);

      const adminActorIds = Array.from(
        new Set(rows.filter((row) => row.actorType === "admin").map((row) => row.actorId)),
      );
      const tenantActorIds = Array.from(
        new Set(rows.filter((row) => row.actorType === "user").map((row) => row.actorId)),
      );
      const impersonatorIds = Array.from(
        new Set(rows.map((row) => row.impersonatedByAdminId).filter(Boolean) as string[]),
      );

      const allPlatformUserIds = Array.from(new Set([...adminActorIds, ...impersonatorIds]));

      const platformUsers = allPlatformUserIds.length
        ? await db
            .select({
              id: platformUser.id,
              name: platformUser.name,
              email: platformUser.email,
              roleId: platformUser.roleId,
            })
            .from(platformUser)
            .where(inArray(platformUser.id, allPlatformUserIds))
        : [];

      const tenantUsers = tenantActorIds.length
        ? await db
            .select({
              id: tenantUser.id,
              name: tenantUser.name,
              email: tenantUser.email,
              roleId: tenantUser.roleId,
            })
            .from(tenantUser)
            .where(inArray(tenantUser.id, tenantActorIds))
        : [];

      const platformRoleIds = Array.from(
        new Set(platformUsers.map((user) => user.roleId).filter(Boolean) as string[]),
      );
      const tenantRoleIds = Array.from(
        new Set(tenantUsers.map((user) => user.roleId).filter(Boolean) as string[]),
      );

      const platformRoleRows = platformRoleIds.length
        ? await db
            .select({ id: platformRoles.id, name: platformRoles.name })
            .from(platformRoles)
            .where(inArray(platformRoles.id, platformRoleIds))
        : [];

      const tenantRoleRows = tenantRoleIds.length
        ? await db
            .select({ id: tenantRoles.id, name: tenantRoles.name })
            .from(tenantRoles)
            .where(inArray(tenantRoles.id, tenantRoleIds))
        : [];

      const platformUsersById = new Map(platformUsers.map((user) => [user.id, user]));
      const tenantUsersById = new Map(tenantUsers.map((user) => [user.id, user]));
      const platformRoleById = new Map(platformRoleRows.map((role) => [role.id, role.name]));
      const tenantRoleById = new Map(tenantRoleRows.map((role) => [role.id, role.name]));

      const enrichedRows = rows.map((row) => {
        const actorPlatformUser = row.actorType === "admin" ? platformUsersById.get(row.actorId) : null;
        const actorTenantUser = row.actorType === "user" ? tenantUsersById.get(row.actorId) : null;
        const impersonator = row.impersonatedByAdminId
          ? platformUsersById.get(row.impersonatedByAdminId)
          : null;

        const actorRoleName = actorPlatformUser?.roleId
          ? platformRoleById.get(actorPlatformUser.roleId)
          : actorTenantUser?.roleId
            ? tenantRoleById.get(actorTenantUser.roleId)
            : null;

        return {
          ...row,
          actorName: actorPlatformUser?.name ?? actorTenantUser?.name ?? null,
          actorEmail: actorPlatformUser?.email ?? actorTenantUser?.email ?? null,
          actorRoleName: toRoleName(actorRoleName, row.actorType),
          impersonatorName: impersonator?.name ?? null,
          impersonatorEmail: impersonator?.email ?? null,
        };
      });

      return reply.send({
        rows: enrichedRows,
        rowCount,
        page,
        pageSize,
        pageCount: Math.ceil(rowCount / pageSize),
      });
    },
  );

  fastify.addHook("preHandler", platformAbilityGuard(ACTIONS.READ, SUBJECTS.AUDIT_LOG));
  await fastify.register(auditCrudRoutes);
};
