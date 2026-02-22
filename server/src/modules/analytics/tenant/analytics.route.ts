import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createSchema } from "zod-openapi";
import { validateBody, validateQuery } from "../../../core/validate.js";
import { requireTenantAuth } from "../../../middlewares/tenant.guard.js";
import { tenantAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import { AnalyticsService } from "../analytics.service.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

const analyticsService = new AnalyticsService();

const toJsonSchema = (schema: z.ZodTypeAny) => createSchema(schema).schema;

const trackBatchSchema = z.array(
  z
    .object({
      // Tenant-scoped ingestion: tenantId is forced from session server-side.
      eventType: z.string().min(1),
      eventData: z.record(z.string(), z.unknown()).default({}),
      userId: z.string().uuid().optional(),
      sessionId: z.string().optional(),
      ip: z.string().optional(),
      timestamp: z.coerce.date().optional(),
    })
    .strict(),
);

const dashboardQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    eventType: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
    userId: z.string().uuid().optional(),
    sessionId: z.string().min(1).optional(),
  })
  .strict();

const reportQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    eventType: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
    userId: z.string().uuid().optional(),
    sessionId: z.string().min(1).optional(),
  })
  .strict();

export const tenantAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/track-batch",
    {
      schema: { body: toJsonSchema(trackBatchSchema) },
      config: { rateLimit: rateLimitConfig.tenant },
      preHandler: [requireTenantAuth(), validateBody(trackBatchSchema)],
    },
    async (request) => {
      const tenantId = request.tenantSession!.user.tenantId;
      const events = (request.body as z.infer<typeof trackBatchSchema>).map((event) => ({
        ...event,
        tenantId,
        ip: request.ip,
      }));

      const tracked = await analyticsService.trackBatch(events);
      return { tracked };
    },
  );

  fastify.get(
    "/dashboard",
    {
      schema: { querystring: toJsonSchema(dashboardQuerySchema) },
      config: { rateLimit: rateLimitConfig.tenant },
      preHandler: [
        requireTenantAuth(),
        tenantAbilityGuard(ACTIONS.READ, SUBJECTS.ANALYTICS),
        validateQuery(dashboardQuerySchema),
      ],
    },
    async (request) => {
      const tenantId = request.tenantSession!.user.tenantId;
      const query = request.query as z.infer<typeof dashboardQuerySchema>;

      return analyticsService.getDashboardMetrics(tenantId, {
        start: query.startDate,
        end: query.endDate,
        eventType: query.eventType,
        path: query.path,
        userId: query.userId,
        sessionId: query.sessionId,
      });
    },
  );

  fastify.get(
    "/reports/heatmap",
    {
      schema: { querystring: toJsonSchema(reportQuerySchema) },
      config: { rateLimit: rateLimitConfig.tenant },
      preHandler: [
        requireTenantAuth(),
        tenantAbilityGuard(ACTIONS.READ, SUBJECTS.ANALYTICS),
        validateQuery(reportQuerySchema),
      ],
    },
    async (request) => {
      const tenantId = request.tenantSession!.user.tenantId;
      const query = request.query as z.infer<typeof reportQuerySchema>;
      const data = await analyticsService.getHeatmapData(tenantId, {
        start: query.startDate,
        end: query.endDate,
        eventType: query.eventType,
        path: query.path,
        userId: query.userId,
        sessionId: query.sessionId,
      });
      return { data };
    },
  );

  fastify.get(
    "/reports/funnel",
    {
      schema: { querystring: toJsonSchema(reportQuerySchema) },
      config: { rateLimit: rateLimitConfig.tenant },
      preHandler: [
        requireTenantAuth(),
        tenantAbilityGuard(ACTIONS.READ, SUBJECTS.ANALYTICS),
        validateQuery(reportQuerySchema),
      ],
    },
    async (request) => {
      const tenantId = request.tenantSession!.user.tenantId;
      const query = request.query as z.infer<typeof reportQuerySchema>;
      return analyticsService.getFunnelData(tenantId, {
        start: query.startDate,
        end: query.endDate,
        eventType: query.eventType,
        path: query.path,
        userId: query.userId,
        sessionId: query.sessionId,
      });
    },
  );

  fastify.get(
    "/reports/lead-time",
    {
      schema: { querystring: toJsonSchema(reportQuerySchema) },
      config: { rateLimit: rateLimitConfig.tenant },
      preHandler: [
        requireTenantAuth(),
        tenantAbilityGuard(ACTIONS.READ, SUBJECTS.ANALYTICS),
        validateQuery(reportQuerySchema),
      ],
    },
    async (request) => {
      const tenantId = request.tenantSession!.user.tenantId;
      const query = request.query as z.infer<typeof reportQuerySchema>;
      const data = await analyticsService.getLeadTimeMetrics(tenantId, {
        start: query.startDate,
        end: query.endDate,
        eventType: query.eventType,
        path: query.path,
        userId: query.userId,
        sessionId: query.sessionId,
      });
      return { data };
    },
  );
};
