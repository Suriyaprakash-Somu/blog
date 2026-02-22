import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createSchema } from "zod-openapi";
import { validateQuery } from "../../../core/validate.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import { AnalyticsService } from "../analytics.service.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

const analyticsService = new AnalyticsService();

const toJsonSchema = (schema: z.ZodTypeAny) => createSchema(schema).schema;

const dashboardQuerySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    tenantId: z.string().uuid().optional(),
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
    tenantId: z.string().uuid().optional(),
    eventType: z.string().min(1).optional(),
    path: z.string().min(1).optional(),
    userId: z.string().uuid().optional(),
    sessionId: z.string().min(1).optional(),
  })
  .strict();

export const platformAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", requirePlatformAuth());

  fastify.get(
    "/dashboard",
    {
      schema: { querystring: toJsonSchema(dashboardQuerySchema) },
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.ANALYTICS),
        validateQuery(dashboardQuerySchema),
      ],
    },
    async (request) => {
      const query = request.query as z.infer<typeof dashboardQuerySchema>;

      return analyticsService.getGlobalDashboard({
        start: query.startDate,
        end: query.endDate,
        tenantId: query.tenantId,
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
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.ANALYTICS),
        validateQuery(reportQuerySchema),
      ],
    },
    async (request) => {
      const query = request.query as z.infer<typeof reportQuerySchema>;
      const data = await analyticsService.getHeatmapData(null, {
        start: query.startDate,
        end: query.endDate,
        tenantId: query.tenantId,
        eventType: query.eventType,
        path: query.path,
        userId: query.userId,
        sessionId: query.sessionId,
      });
      return { data };
    },
  );

  fastify.get(
    "/reports/lead-time",
    {
      schema: { querystring: toJsonSchema(reportQuerySchema) },
      config: { rateLimit: rateLimitConfig.platform },
      preHandler: [
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.ANALYTICS),
        validateQuery(reportQuerySchema),
      ],
    },
    async (request) => {
      const query = request.query as z.infer<typeof reportQuerySchema>;
      const data = await analyticsService.getLeadTimeMetrics(null, {
        start: query.startDate,
        end: query.endDate,
        tenantId: query.tenantId,
        eventType: query.eventType,
        path: query.path,
        userId: query.userId,
        sessionId: query.sessionId,
      });
      return { data };
    },
  );
};
