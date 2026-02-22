import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createSchema } from "zod-openapi";
import { validateBody } from "../../../core/validate.js";
import { AnalyticsService } from "../analytics.service.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

const analyticsService = new AnalyticsService();

const toJsonSchema = (schema: z.ZodTypeAny) => createSchema(schema).schema;

const trackBatchSchema = z.array(
  z
    .object({
      // Public ingestion is intentionally anonymous:
      // - no tenant attribution (prevents cross-tenant poisoning)
      // - no user attribution (caller-controlled ids are not trustworthy)
      eventType: z.string().min(1),
      eventData: z.record(z.string(), z.unknown()).default({}),
      sessionId: z.string().optional(),
      ip: z.string().optional(),
      timestamp: z.coerce.date().optional(),
    })
    .strict(),
);

export const publicAnalyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/track-batch",
    {
      schema: { body: toJsonSchema(trackBatchSchema) },
      config: { rateLimit: rateLimitConfig.global },
      preHandler: [validateBody(trackBatchSchema)],
    },
    async (request) => {
      const events = (request.body as z.infer<typeof trackBatchSchema>).map((event) => ({
        ...event,
        tenantId: undefined,
        userId: undefined,
        ip: request.ip,
      }));
      const tracked = await analyticsService.trackBatch(events);
      return { tracked };
    },
  );
};
