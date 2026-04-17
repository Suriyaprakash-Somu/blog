import crypto from "crypto";
import {
  and,
  asc,
  type Column,
  count,
  desc,
  eq,
  getTableColumns,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from "drizzle-orm";
import type { PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core";
import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type FastifySchema,
} from "fastify";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { createSchema } from "zod-openapi";
import { logAudit } from "../audit/auditLogger.js";
import { db } from "../db/index.js";
import { type EventContext, type EventMetadata, getEventBus } from "../events/index.js";
import { platformAbilityGuard, tenantAbilityGuard } from "../middlewares/ability.guard.js";
import { requirePlatformAuth } from "../middlewares/auth.guard.js";
import {
  requireTenantAuth,
  type TenantSessionData,
} from "../middlewares/tenant.guard.js";
import type { Action, Subject } from "../modules/rbac/public/permissions.js";
import { computeDiff } from "../utils/objectUtils.js";
import { buildKey, getCache, tenantTags } from "./cache.js";
import { buildFilters, type FilterGroup, parseSorting } from "./filterBuilder.js";
import { validateBody, validateParams, validateQuery } from "./validate.js";

// Type for request with tenant session
type AuthenticatedRequest = FastifyRequest & {
  tenantSession: TenantSessionData;
};

// Generic type for Drizzle Table
type DrizzleTable<TConfig extends TableConfig> = PgTableWithColumns<TConfig>;

// Extended Hook Context with Event Support
export interface HookContext extends EventContext {
  req: AuthenticatedRequest;
  reply: FastifyReply;
  tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
  tenantId: string;
  correlationId: string;
}

// Event configuration for CRUD operations
export interface EventConfig {
  resource: string; // e.g., 'branch'
  emitOn: ('create' | 'update' | 'delete')[];
  useOutbox?: boolean; // Use outbox for async processing
  enrichPayload?: boolean; // Include full entity in event payload
  includeDiff?: boolean; // Include changes in update events
}

export interface CrudValidation {
  listQuery?: z.ZodTypeAny;
  idParams?: z.ZodTypeAny;
  createBody?: z.ZodTypeAny;
  updateBody?: z.ZodTypeAny;
}

export interface CrudRateLimit {
  list?: Record<string, unknown>;
  detail?: Record<string, unknown>;
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
  delete?: Record<string, unknown>;
}

export interface CrudOpenApi {
  tag: string;
  resourceName?: string;
  description?: string;
}

export interface CrudAuditConfig {
  enabled?: boolean; // default true
  resource?: string; // default: events.resource or cache.keyPrefix
  emitOn?: ("create" | "update" | "delete")[]; // default: all
  includeValues?: boolean; // default true
}

export interface CrudRoutesConfig {
  list?: boolean;
  detail?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

export interface CrudAccessConfig {
  mode?: "tenant" | "platform" | "public"; // default tenant
  tenantScope?: boolean; // default true
  abilities?: {
    list?: { action: Action | Action[]; subject: Subject };
    detail?: { action: Action | Action[]; subject: Subject };
    create?: { action: Action | Action[]; subject: Subject };
    update?: { action: Action | Action[]; subject: Subject };
    delete?: { action: Action | Action[]; subject: Subject };
  };
}

// Configuration for the CRUD Factory
export interface CrudOptions<TConfig extends TableConfig> {
  // Database table
  table: DrizzleTable<TConfig>;

  // Cache settings
  cache: {
    tag: string; // e.g., 'branches'
    keyPrefix: string; // e.g., 'branch'
  };

  // Search and Filter configuration
  searchableColumns: string[];
  columnMap: Record<string, Column>;

  // Event configuration
  events?: EventConfig;

  // Validation schemas (Zod)
  validation?: CrudValidation;

  // Rate limit configuration
  rateLimit?: CrudRateLimit;

  // OpenAPI metadata
  openapi?: CrudOpenApi;

  // Audit logging (default: enabled)
  audit?: CrudAuditConfig;

  // Access control
  access?: CrudAccessConfig;

  // Enable/disable routes
  routes?: CrudRoutesConfig;

  // Hooks
  beforeCreate?: (
    data: InferInsertModel<DrizzleTable<TConfig>>,
    ctx: HookContext
  ) => Promise<InferInsertModel<DrizzleTable<TConfig>>>;
  afterCreate?: (
    data: InferInsertModel<DrizzleTable<TConfig>>,
    result: InferSelectModel<DrizzleTable<TConfig>>,
    ctx: HookContext
  ) => Promise<void>;
  beforeUpdate?: (
    data: Partial<InferInsertModel<DrizzleTable<TConfig>>>,
    existing: InferSelectModel<DrizzleTable<TConfig>>,
    ctx: HookContext
  ) => Promise<Partial<InferInsertModel<DrizzleTable<TConfig>>>>;
  afterUpdate?: (
    data: Partial<InferInsertModel<DrizzleTable<TConfig>>>,
    existing: InferSelectModel<DrizzleTable<TConfig>>,
    result: InferSelectModel<DrizzleTable<TConfig>>,
    ctx: HookContext
  ) => Promise<void>;
  beforeDelete?: (existing: InferSelectModel<DrizzleTable<TConfig>>, ctx: HookContext) => Promise<void>;
  afterDelete?: (existing: InferSelectModel<DrizzleTable<TConfig>>, ctx: HookContext) => Promise<void>;

  // Custom schemas for Fastify validation
  schemas?: {
    create?: FastifySchema;
    update?: FastifySchema;
    list?: FastifySchema;
    detail?: FastifySchema;
    delete?: FastifySchema;
  };
}

interface ListQuery {
  page?: string;
  pageSize?: string;
  filters?: string | FilterGroup;
  sorting?: string;
}

function mergeSchema(base: FastifySchema | undefined, extra: FastifySchema): FastifySchema {
  if (!base) return extra;
  return {
    ...extra,
    ...base,
    tags: base.tags ?? extra.tags,
    summary: base.summary ?? extra.summary,
    description: base.description ?? extra.description,
    body: base.body ?? extra.body,
    params: base.params ?? extra.params,
    querystring: base.querystring ?? extra.querystring,
    response: base.response ?? extra.response,
  };
}

function toJsonSchema(schema: z.ZodTypeAny | undefined) {
  if (!schema) return undefined;
  return createSchema(schema).schema;
}

function getEntityId(entity: unknown): string | undefined {
  const record = entity as { id?: string } | null;
  return record?.id;
}

function buildOpenApiMeta<TConfig extends TableConfig>(options: CrudOptions<TConfig>) {
  const tag = options.openapi?.tag || options.events?.resource || "resource";
  const resourceName = options.openapi?.resourceName || options.events?.resource || "resource";
  return { tag, resourceName };
}

function getAuditConfig<TConfig extends TableConfig>(options: CrudOptions<TConfig>) {
  const resource =
    options.audit?.resource ||
    options.events?.resource ||
    options.cache?.keyPrefix ||
    "resource";

  return {
    enabled: options.audit?.enabled !== false,
    resource,
    emitOn: options.audit?.emitOn ?? ["create", "update", "delete"],
    includeValues: options.audit?.includeValues !== false,
  };
}

function getAccessConfig<TConfig extends TableConfig>(options: CrudOptions<TConfig>) {
  return {
    mode: options.access?.mode ?? "tenant",
    tenantScope: options.access?.tenantScope !== false,
    abilities: options.access?.abilities ?? {},
  };
}

export function createCrudRoutes<TConfig extends TableConfig>(
  options: CrudOptions<TConfig>
) {
  type TTable = DrizzleTable<TConfig>;
  type TInsert = InferInsertModel<TTable>;
  type TSelect = InferSelectModel<TTable>;

  return async (fastify: FastifyInstance) => {
    const accessConfig = getAccessConfig(options);
    // Apply access guard
    if (accessConfig.mode === "tenant") {
      fastify.addHook("preHandler", requireTenantAuth());
    } else if (accessConfig.mode === "platform") {
      fastify.addHook("preHandler", requirePlatformAuth());
    }

    const { table, cache: cacheConfig, columnMap, searchableColumns } = options;
    const tableForDb = table as unknown as PgTableWithColumns<TableConfig>;
    const columns = getTableColumns(table);
    const { tag, resourceName } = buildOpenApiMeta(options);
    const validation = options.validation;
    const rateLimit = options.rateLimit;
    const auditConfig = getAuditConfig(options);
    const defaultIdParams = z.object({ id: z.string().min(1) }).strict();
    const routes = {
      list: options.routes?.list !== false,
      detail: options.routes?.detail !== false,
      create: options.routes?.create !== false,
      update: options.routes?.update !== false,
      delete: options.routes?.delete !== false,
    };

    const abilities = accessConfig.abilities;
    if (accessConfig.mode !== "public") {
      const requiredAbilities: Array<keyof typeof routes> = [
        "list",
        "detail",
        "create",
        "update",
        "delete",
      ];

      for (const key of requiredAbilities) {
        if (routes[key] && !abilities?.[key]) {
          throw new Error(`Missing ability config for CRUD route: ${String(key)}`);
        }
      }
    }

    const resolveAbilityGuard = (key: keyof typeof routes) => {
      const ability = abilities?.[key];
      if (!ability) return undefined;
      const actions = Array.isArray(ability.action)
        ? ability.action
        : [ability.action];

      if (accessConfig.mode === "platform") {
        return async (request: FastifyRequest, reply: FastifyReply) => {
          let allowed = false;
          for (const action of actions) {
            const guard = platformAbilityGuard(action, ability.subject);
            await guard(request, reply);
            if (!reply.sent) {
              allowed = true;
              break;
            }
          }
          if (!allowed && !reply.sent) {
            reply.status(403).send({ error: "Forbidden" });
          }
        };
      }

      if (accessConfig.mode === "tenant") {
        return async (request: FastifyRequest, reply: FastifyReply) => {
          let allowed = false;
          for (const action of actions) {
            const guard = tenantAbilityGuard(action, ability.subject);
            await guard(request, reply);
            if (!reply.sent) {
              allowed = true;
              break;
            }
          }
          if (!allowed && !reply.sent) {
            reply.status(403).send({ error: "Forbidden" });
          }
        };
      }

      return undefined;
    };

    const resolveTenantId = (req: AuthenticatedRequest): string => {
      if (!accessConfig.tenantScope) return "global";
      if (accessConfig.mode === "tenant") {
        return req.tenantSession.tenant.id;
      }
      return "global";
    };

    // Helper to ensure tenantId exists on the table
    if (accessConfig.tenantScope && !("tenantId" in columns)) {
      throw new Error(`Table does not have a tenantId column`);
    }

    // GET / - List
    if (routes.list) {
      const listSchema = mergeSchema(options.schemas?.list, {
        tags: [tag],
        summary: `List ${resourceName}`,
        querystring: toJsonSchema(validation?.listQuery),
      });

      const listPreHandlers = [] as Array<
        (request: FastifyRequest, reply: FastifyReply) => Promise<void>
      >;
      const listAbilityGuard = resolveAbilityGuard("list");
      if (listAbilityGuard) listPreHandlers.push(listAbilityGuard);

      if (validation?.listQuery) {
        listPreHandlers.push(validateQuery(validation.listQuery));
      }

      fastify.get(
        "/",
        {
          schema: listSchema,
          preHandler: listPreHandlers.length > 0 ? listPreHandlers : undefined,
          config: rateLimit?.list ? { rateLimit: rateLimit.list } : undefined,
        },
        async (request, reply) => {
          const req = request as AuthenticatedRequest;
          const tenantId = resolveTenantId(req);
          const query = req.query as ListQuery;

          const cache = getCache();
          // Generate stable hash for the query to use as part of cache key
          const queryHash = crypto
            .createHash("md5")
            .update(JSON.stringify(query))
            .digest("hex");
          const cacheKey = buildKey(
            cacheConfig.keyPrefix,
            tenantId,
            "list",
            queryHash
          );

          return await cache.getOrSet(
            cacheKey,
            async () => {
              // Pagination
              const page = Math.max(1, parseInt(query.page || "1", 10));
              const pageSize = Math.min(
                100,
                Math.max(1, parseInt(query.pageSize || "10", 10))
              );
              const offset = (page - 1) * pageSize;

              // Filtering
              const filterCondition = buildFilters(query.filters || null, {
                columnMap,
                searchableColumns,
              });

              // Tenant isolation
              const tenantFilter = accessConfig.tenantScope
                ? eq(columns.tenantId, tenantId)
                : undefined;
              const whereClause = filterCondition
                ? tenantFilter
                  ? and(tenantFilter, filterCondition)
                  : filterCondition
                : tenantFilter;

              // Sorting
              const sorting = parseSorting(query.sorting || null);
              const orderByParts: SQL[] = [];

              if (sorting && sorting.length > 0) {
                for (const s of sorting) {
                  const column = columnMap[s.id];
                  if (!column) continue;
                  orderByParts.push(s.desc ? desc(column) : asc(column));
                }
              }

              if (orderByParts.length === 0) {
                orderByParts.push(desc(columns.createdAt || columns.id));
              }

              // Count
              const [countResult] = await db
                .select({ count: count() })
                .from(tableForDb)
                .where(whereClause);
              const rowCount = countResult?.count || 0;

              // Rows
              const rows = await db
                .select()
                .from(tableForDb)
                .where(whereClause)
                .orderBy(...orderByParts)
                .limit(pageSize)
                .offset(offset);

              return {
                rows,
                rowCount: Number(rowCount),
                page,
                pageSize,
                pageCount: Math.ceil(Number(rowCount) / pageSize),
              };
            },
            tenantTags(cacheConfig.tag, tenantId)
          );
        }
      );
    }

    // GET /:id - Detail
    if (routes.detail) {
      const detailSchema = mergeSchema(options.schemas?.detail, {
        tags: [tag],
        summary: `Get ${resourceName}`,
        params: toJsonSchema(validation?.idParams || defaultIdParams),
      });

      const detailPreHandlers = [] as Array<
        (request: FastifyRequest, reply: FastifyReply) => Promise<void>
      >;
      const detailAbilityGuard = resolveAbilityGuard("detail");
      if (detailAbilityGuard) detailPreHandlers.push(detailAbilityGuard);

      if (validation?.idParams) {
        detailPreHandlers.push(validateParams(validation.idParams));
      } else {
        detailPreHandlers.push(validateParams(defaultIdParams));
      }

      fastify.get(
        "/:id",
        {
          schema: detailSchema,
          preHandler: detailPreHandlers,
          config: rateLimit?.detail ? { rateLimit: rateLimit.detail } : undefined,
        },
        async (request, reply) => {
        const req = request as AuthenticatedRequest;
        const tenantId = resolveTenantId(req);
        const { id } = req.params as { id: string };

        const cache = getCache();
        const cacheKey = buildKey(cacheConfig.keyPrefix, tenantId, id);

        const row = await cache.getOrSet(
          cacheKey,
          async () => {
            const [result] = await db
              .select()
              .from(tableForDb)
              .where(
                accessConfig.tenantScope
                  ? and(eq(columns.id, id), eq(columns.tenantId, tenantId))
                  : eq(columns.id, id)
              )
              .limit(1);
            return result;
          },
          tenantTags(cacheConfig.tag, tenantId)
        );

        if (!row) {
          return reply.status(404).send({ error: "Resource not found" });
        }

        return reply.send(row);
        }
      );
    }

    // POST / - Create
    if (routes.create) {
      const createSchema = mergeSchema(options.schemas?.create, {
        tags: [tag],
        summary: `Create ${resourceName}`,
        body: toJsonSchema(validation?.createBody),
      });

      const createPreHandlers = [] as Array<
        (request: FastifyRequest, reply: FastifyReply) => Promise<void>
      >;
      const createAbilityGuard = resolveAbilityGuard("create");
      if (createAbilityGuard) createPreHandlers.push(createAbilityGuard);

      if (validation?.createBody) {
        createPreHandlers.push(validateBody(validation.createBody));
      }

      fastify.post(
        "/",
        {
          schema: createSchema,
          preHandler: createPreHandlers.length > 0 ? createPreHandlers : undefined,
          config: rateLimit?.create ? { rateLimit: rateLimit.create } : undefined,
        },
        async (request, reply) => {
          const req = request as AuthenticatedRequest;
          const tenantId = resolveTenantId(req);
          const body = req.body as TInsert;
          const correlationId = uuidv7();
          const eventBus = getEventBus();

        const ctx: HookContext = {
          req,
          reply,
          tx: db,
          tenantId,
          correlationId,
        };

          try {
            const created = await db.transaction(async (tx) => {
              ctx.tx = tx;

              // Prepare data
              const dataToInsert = accessConfig.tenantScope
                ? ({ ...body, tenantId } as unknown as TInsert)
                : (body as TInsert);

              // Before Create Hook (inside transaction)
              let finalData = dataToInsert;
              if (options.beforeCreate) {
                finalData = await options.beforeCreate(dataToInsert, ctx);
              }

              // Insert
              const inserted = (await tx
                .insert(tableForDb)
                .values(finalData)
                .returning()) as TSelect[];

              const created = inserted[0];
              if (!created) {
                throw new Error("Insert failed");
              }
            
            // After Create Hook
            if (options.afterCreate) {
              await options.afterCreate(finalData, created, ctx);
            }

            // Emit event if configured
            if (options.events?.emitOn.includes('create')) {
              const eventType = `${options.events.resource}.created`;
              const eventData = options.events.enrichPayload
                ? created
                : { id: getEntityId(created), tenantId };
              const meta: EventMetadata = {
                aggregateType: options.events.resource,
                aggregateId: getEntityId(created),
              };

               if (options.events.useOutbox) {
                 await eventBus.enqueueOutbox(
                   eventType,
                   eventData,
                   ctx,
                   meta
                 );
               } else {
                 await eventBus.emitStrict(
                   eventType,
                   eventData,
                   ctx,
                   meta
                 );
               }
             }

            // Audit logging (default: enabled)
            if (auditConfig.enabled && auditConfig.emitOn.includes("create")) {
              await logAudit({
                db: ctx.tx,
                ctx,
                action: `${auditConfig.resource}.created`,
                resourceType: auditConfig.resource,
                resourceId: String(getEntityId(created) ?? "unknown"),
                tenantId: tenantId === "global" ? null : tenantId,
                oldValue: null,
                newValue: auditConfig.includeValues
                  ? (created as Record<string, unknown>)
                  : null,
              });
            }

            // Invalidate cache
            const cache = getCache();
            await cache.invalidateTag(`${cacheConfig.tag}:${tenantId}`);

             return created;
           });

           return reply.status(201).send(created);
         } catch (error: unknown) {
           const err = error as { statusCode?: number; message?: string };
           if (err.statusCode) throw error;
           fastify.log.error({ err: error }, "[crudFactory] Create failed");
           throw error;
         }
         }
       );
     }

    // PUT /:id - Update
    if (routes.update) {
      const updateSchema = mergeSchema(options.schemas?.update, {
        tags: [tag],
        summary: `Update ${resourceName}`,
        params: toJsonSchema(validation?.idParams || defaultIdParams),
        body: toJsonSchema(validation?.updateBody),
      });

      const updatePreHandlers = [] as Array<
        (request: FastifyRequest, reply: FastifyReply) => Promise<void>
      >;
      const updateAbilityGuard = resolveAbilityGuard("update");
      if (updateAbilityGuard) updatePreHandlers.push(updateAbilityGuard);

      if (validation?.idParams) {
        updatePreHandlers.push(validateParams(validation.idParams));
      } else {
        updatePreHandlers.push(validateParams(defaultIdParams));
      }

      if (validation?.updateBody) {
        updatePreHandlers.push(validateBody(validation.updateBody));
      }

      fastify.put(
        "/:id",
        {
          schema: updateSchema,
          preHandler: updatePreHandlers,
          config: rateLimit?.update ? { rateLimit: rateLimit.update } : undefined,
        },
        async (request, reply) => {
        const req = request as AuthenticatedRequest;
        const tenantId = resolveTenantId(req);
        const { id } = req.params as { id: string };
        const body = req.body as Partial<TInsert>;
        const correlationId = uuidv7();
        const eventBus = getEventBus();

        const ctx: HookContext = {
          req,
          reply,
          tx: db,
          tenantId,
          correlationId,
        };

        const scopedWhere = accessConfig.tenantScope
          ? and(eq(columns.id, id), eq(columns.tenantId, tenantId))
          : eq(columns.id, id);

        try {
          const updated = await db.transaction(async (tx) => {
            ctx.tx = tx;

            // Check existence (inside transaction)
            const [existing] = await tx
              .select()
              .from(tableForDb)
              .where(scopedWhere)
              .limit(1);

            if (!existing) {
              return null;
            }

            let updates = { ...body };

            // Before Update Hook (inside transaction)
            if (options.beforeUpdate) {
              updates = await options.beforeUpdate(updates, existing as TSelect, ctx);
            }

            // Update
            const updatedRows = (await tx
              .update(tableForDb)
              .set(updates)
              .where(scopedWhere)
              .returning()) as TSelect[];

            const updated = updatedRows[0];
            if (!updated) {
              return null;
            }

            // After Update Hook
            if (options.afterUpdate) {
              await options.afterUpdate(updates, existing as TSelect, updated, ctx);
            }

            // Emit event if configured
            if (options.events?.emitOn.includes('update')) {
              const eventType = `${options.events.resource}.updated`;
               const diff = options.events.includeDiff
                 ? computeDiff(existing as Record<string, unknown>, updates)
                 : undefined;

               const eventData: Record<string, unknown> | { id: string; tenantId: string } =
                 options.events.enrichPayload
                  ? {
                      ...updated,
                      ...(diff && Object.keys(diff).length > 0 ? { _diff: diff } : {}),
                    }
                  : { id, tenantId };

               if (options.events.includeDiff && !options.events.enrichPayload) {
                 (eventData as Record<string, unknown>).changes = diff;
               }

              const meta: EventMetadata = {
                aggregateType: options.events.resource,
                aggregateId: id,
              };

              if (options.events.useOutbox) {
                await eventBus.enqueueOutbox(eventType, eventData, ctx, meta);
              } else {
                await eventBus.emitStrict(eventType, eventData, ctx, meta);
              }
            }

            // Audit logging (default: enabled)
            if (auditConfig.enabled && auditConfig.emitOn.includes("update")) {
              await logAudit({
                db: ctx.tx,
                ctx,
                action: `${auditConfig.resource}.updated`,
                resourceType: auditConfig.resource,
                resourceId: String(id),
                tenantId: tenantId === "global" ? null : tenantId,
                oldValue: auditConfig.includeValues
                  ? (existing as Record<string, unknown>)
                  : null,
                newValue: auditConfig.includeValues
                  ? (updated as Record<string, unknown>)
                  : null,
              });
            }

            // Invalidate cache
            const cache = getCache();
            await cache.invalidateTag(`${cacheConfig.tag}:${tenantId}`);
            await cache.delete(buildKey(cacheConfig.keyPrefix, tenantId, id));

            return updated;
          });

          if (!updated) {
            return reply.status(404).send({ error: "Resource not found" });
          }

          return reply.send(updated);
        } catch (error: unknown) {
          const err = error as { statusCode?: number; message?: string };
          if (err.statusCode) throw error;
          fastify.log.error({ err: error }, "[crudFactory] Update failed");
          throw error;
        }
        }
      );
    }

    // DELETE /:id - Delete
    if (routes.delete) {
      const deleteSchema = mergeSchema(options.schemas?.delete, {
        tags: [tag],
        summary: `Delete ${resourceName}`,
        params: toJsonSchema(validation?.idParams || defaultIdParams),
      });

      const deletePreHandlers = [] as Array<
        (request: FastifyRequest, reply: FastifyReply) => Promise<void>
      >;
      const deleteAbilityGuard = resolveAbilityGuard("delete");
      if (deleteAbilityGuard) deletePreHandlers.push(deleteAbilityGuard);

      if (validation?.idParams) {
        deletePreHandlers.push(validateParams(validation.idParams));
      } else {
        deletePreHandlers.push(validateParams(defaultIdParams));
      }

      fastify.delete(
        "/:id",
        {
          schema: deleteSchema,
          preHandler: deletePreHandlers,
          config: rateLimit?.delete ? { rateLimit: rateLimit.delete } : undefined,
        },
        async (request, reply) => {
          const req = request as AuthenticatedRequest;
          const tenantId = resolveTenantId(req);
          const { id } = req.params as { id: string };
          const correlationId = uuidv7();
          const eventBus = getEventBus();

          const ctx: HookContext = {
            req,
            reply,
            tx: db,
            tenantId,
            correlationId,
          };

          const scopedWhere = accessConfig.tenantScope
            ? and(eq(columns.id, id), eq(columns.tenantId, tenantId))
            : eq(columns.id, id);

          try {
            const deleted = await db.transaction(async (tx) => {
              ctx.tx = tx;

              const [existing] = await tx
                .select()
                .from(tableForDb)
                .where(scopedWhere)
                .limit(1);

              if (!existing) {
                return null;
              }

              // Before Delete Hook (inside transaction)
              if (options.beforeDelete) {
                await options.beforeDelete(existing as TSelect, ctx);
              }

              // Delete
              await tx.delete(tableForDb).where(scopedWhere);

              // After Delete Hook
              if (options.afterDelete) {
                await options.afterDelete(existing as TSelect, ctx);
              }

              // Emit event if configured
              if (options.events?.emitOn.includes("delete")) {
                const eventType = `${options.events.resource}.deleted`;
                const eventData = options.events.enrichPayload
                  ? existing
                  : { id, tenantId };
                const meta: EventMetadata = {
                  aggregateType: options.events.resource,
                  aggregateId: id,
                };

                if (options.events.useOutbox) {
                  await eventBus.enqueueOutbox(eventType, eventData, ctx, meta);
                } else {
                  await eventBus.emitStrict(eventType, eventData, ctx, meta);
                }
              }

              // Audit logging (default: enabled)
              if (auditConfig.enabled && auditConfig.emitOn.includes("delete")) {
                await logAudit({
                  db: ctx.tx,
                  ctx,
                  action: `${auditConfig.resource}.deleted`,
                  resourceType: auditConfig.resource,
                  resourceId: String(id),
                  tenantId: tenantId === "global" ? null : tenantId,
                  oldValue: auditConfig.includeValues
                    ? (existing as Record<string, unknown>)
                    : null,
                  newValue: null,
                });
              }

              // Invalidate cache
              const cache = getCache();
              await cache.invalidateTag(`${cacheConfig.tag}:${tenantId}`);
              await cache.delete(buildKey(cacheConfig.keyPrefix, tenantId, id));
              return existing;
            });

            if (!deleted) {
              return reply.status(404).send({ error: "Resource not found" });
            }

            return reply.send({ ok: true, id });
          } catch (error: unknown) {
            const err = error as { statusCode?: number; message?: string };
            if (err.statusCode) throw error;
            fastify.log.error({ err: error }, "[crudFactory] Delete failed");
            throw error;
          }
        }
      );
    }
  };
}
