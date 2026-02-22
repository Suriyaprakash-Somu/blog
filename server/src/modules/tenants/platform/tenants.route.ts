import type { FastifyPluginAsync } from "fastify";
import { and, eq, desc, asc, count, inArray, type SQL } from "drizzle-orm";
import { z } from "zod";
import { createSchema } from "zod-openapi";
import { db } from "../../../db/index.js";
import { tenants } from "../tenants.schema.js";
import { tenantUser } from "../../users/tenant/tenant.schema.js";
import { tenantRoles } from "../../roles/tenant/tenant.schema.js";
import { buildFilters, parseSorting } from "../../../core/filterBuilder.js";
import { validateBody, validateParams, validateQuery } from "../../../core/validate.js";
import { createZodSchemas } from "../../../utils/schemaFactory.js";
import { logAudit } from "../../../audit/auditLogger.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

// Column map for filtering
const COLUMN_MAP = {
  name: tenants.name,
  slug: tenants.slug,
  status: tenants.status,
  createdAt: tenants.createdAt,
};

// Searchable columns for global search
const SEARCHABLE_COLUMNS = ["name", "slug"];

const listQuerySchema = z
  .object({
    page: z.coerce.number().min(1).optional(),
    pageSize: z.coerce.number().min(1).max(100).optional(),
    sorting: z.string().optional(),
    filters: z.string().optional(),
  })
  .strict();

const idParamsSchema = z.object({
  id: z.string().uuid(),
});

const { insertSchema: tenantInsertSchema, updateSchema: tenantUpdateSchema } =
  createZodSchemas(tenants, {
    pick: ["name", "status"],
    required: ["name"],
    strict: true,
    overrides: {
      status: z.enum(["active", "suspended", "pending"]),
    },
  });

const updateStatusSchema = tenantInsertSchema.pick({ status: true }).strict();
const updateTenantSchema = tenantUpdateSchema;

const toJsonSchema = (schema: z.ZodTypeAny) => createSchema(schema).schema;

export const platformTenantsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/platform/tenants - List all tenants with pagination, filtering, sorting
  fastify.get(
    "/",
    {
      schema: {
        querystring: toJsonSchema(listQuerySchema),
      },
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.TENANT),
        validateQuery(listQuerySchema),
      ],
    },
    async (request, reply) => {
    try {
      const query = request.query as {
        page?: string;
        pageSize?: string;
        sorting?: string;
        filters?: string;
      };

      // Parse pagination
      const page = Math.max(1, parseInt(query.page || "1", 10));
      const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize || "10", 10)));
      const offset = (page - 1) * pageSize;

      // Build filter conditions
      const filterCondition = buildFilters(query.filters || null, {
        columnMap: COLUMN_MAP,
        searchableColumns: SEARCHABLE_COLUMNS,
      });

      // Parse sorting
      const sorting = parseSorting(query.sorting || null);
      let orderBy: SQL = desc(tenants.createdAt); // Default

      if (sorting && sorting.length > 0) {
        const firstSort = sorting[0];
        const column = COLUMN_MAP[firstSort.id as keyof typeof COLUMN_MAP];
        if (column) {
          orderBy = firstSort.desc ? desc(column) : asc(column);
        }
      }

      // Build base query
      const baseQuery = db.select().from(tenants);

      // Apply filter if exists
      const filteredQuery = filterCondition 
        ? baseQuery.where(filterCondition)
        : baseQuery;

      // Get total count (for pagination)
      const countQuery = filterCondition
        ? db.select({ count: count() }).from(tenants).where(filterCondition)
        : db.select({ count: count() }).from(tenants);
      
      const [countResult] = await countQuery;
      const rowCount = countResult?.count || 0;

      // Get paginated rows
      const rows = await filteredQuery
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);

      const tenantIds = rows.map((row) => row.id);
      const ownerRows = tenantIds.length
        ? await db
            .select({
              tenantId: tenantUser.tenantId,
              ownerId: tenantUser.id,
              ownerName: tenantUser.name,
              ownerEmail: tenantUser.email,
            })
            .from(tenantUser)
            .innerJoin(
              tenantRoles,
              and(eq(tenantRoles.id, tenantUser.roleId), eq(tenantRoles.slug, "owner")),
            )
            .where(and(inArray(tenantUser.tenantId, tenantIds), eq(tenantUser.status, "active")))
        : [];

      const ownerByTenantId = new Map<string, (typeof ownerRows)[number]>();
      for (const owner of ownerRows) {
        if (!ownerByTenantId.has(owner.tenantId)) {
          ownerByTenantId.set(owner.tenantId, owner);
        }
      }

      const enrichedRows = rows.map((row) => {
        const owner = ownerByTenantId.get(row.id);
        return {
          ...row,
          ownerId: owner?.ownerId ?? null,
          ownerName: owner?.ownerName ?? null,
          ownerEmail: owner?.ownerEmail ?? null,
        };
      });

      return reply.send({
        rows: enrichedRows,
        rowCount,
        page,
        pageSize,
        pageCount: Math.ceil(rowCount / pageSize),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      fastify.log.error(error);
      return reply.status(500).send({ error: "Server error", message });
    }
    }
  );

  // PATCH /api/platform/tenants/:id/status - Update status only
  fastify.patch(
    "/:id/status",
    {
      schema: {
        params: toJsonSchema(idParamsSchema),
        body: toJsonSchema(updateStatusSchema),
      },
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.TENANT),
        validateParams(idParamsSchema),
        validateBody(updateStatusSchema),
      ],
    },
    async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };

      if (!status || !["active", "suspended", "pending"].includes(status)) {
         return reply.status(400).send({ error: "Invalid status" });
      }

      const [updated] = await db.update(tenants)
        .set({ status })
        .where(eq(tenants.id, id))
        .returning();

      if (updated) {
        await logAudit({
          db,
          ctx: request,
          action: "tenant.status.updated",
          resourceType: "tenant",
          resourceId: id,
          tenantId: id,
          oldValue: null,
          newValue: updated as Record<string, unknown>,
          metadata: { status },
        });
      }

      return reply.send(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      fastify.log.error(error);
      return reply.status(500).send({ error: "Server error", message });
    }
    }
  );

  // PATCH /api/platform/tenants/:id - General update (name, status, etc.)
  fastify.patch(
    "/:id",
    {
      schema: {
        params: toJsonSchema(idParamsSchema),
        body: toJsonSchema(updateTenantSchema),
      },
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.TENANT),
        validateParams(idParamsSchema),
        validateBody(updateTenantSchema),
      ],
    },
    async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { name, status } = request.body as { name?: string; status?: string };

      const updateData: Partial<{ name: string; status: string }> = {};
      if (name) updateData.name = name;
      if (status && ["active", "suspended", "pending"].includes(status)) {
        updateData.status = status;
      }

      if (Object.keys(updateData).length === 0) {
        return reply.status(400).send({ error: "No valid fields to update" });
      }

      const [updated] = await db.update(tenants)
        .set(updateData)
        .where(eq(tenants.id, id))
        .returning();

      if (!updated) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      await logAudit({
        db,
        ctx: request,
        action: "tenant.updated",
        resourceType: "tenant",
        resourceId: id,
        tenantId: id,
        oldValue: null,
        newValue: updated as Record<string, unknown>,
        metadata: updateData,
      });

      return reply.send(updated);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      fastify.log.error(error);
      return reply.status(500).send({ error: "Server error", message });
    }
    }
  );

  // DELETE /api/platform/tenants/:id - Delete a tenant
  fastify.delete(
    "/:id",
    {
      schema: {
        params: toJsonSchema(idParamsSchema),
      },
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.DELETE, SUBJECTS.TENANT),
        validateParams(idParamsSchema),
      ],
    },
    async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const [deleted] = await db.delete(tenants)
        .where(eq(tenants.id, id))
        .returning();

      if (!deleted) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      await logAudit({
        db,
        ctx: request,
        action: "tenant.deleted",
        resourceType: "tenant",
        resourceId: id,
        tenantId: id,
        oldValue: deleted as Record<string, unknown>,
        newValue: null,
      });

      return reply.send({ message: "Tenant deleted successfully", id: deleted.id });
    } catch (error: unknown) {
      fastify.log.error(error);

      const errorRecord = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
      const cause = errorRecord?.cause;
      const causeRecord = cause && typeof cause === "object" ? (cause as Record<string, unknown>) : null;
      const errorString = String(errorRecord?.message ?? causeRecord?.message ?? error);
      if (errorString.includes("foreign key constraint") || 
          errorString.includes("violates foreign key")) {
        return reply.status(409).send({ 
          error: "Cannot delete tenant", 
          message: "This tenant has associated users. Please remove all users first before deleting the tenant." 
        });
      }
      
      return reply.status(500).send({ error: "Server error" });
    }
    }
  );
};
