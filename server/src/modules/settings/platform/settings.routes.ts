import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { platformSettings } from "../../../db/schema/settings.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

const settingKeyParamSchema = z.object({
  key: z.string().min(1),
});

const putSettingBodySchema = z.object({
  value: z.any(),
  isPublic: z.boolean().optional(),
  description: z.string().optional(),
});

export const platformSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET all settings
  fastify.get(
    "/",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.PLATFORM_SETTINGS || "platform_settings"),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async () => {
      const rows = await db.select().from(platformSettings).orderBy(platformSettings.key);
      return { success: true, rows, rowCount: rows.length };
    },
  );

  // GET specific setting
  fastify.get(
    "/:key",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.PLATFORM_SETTINGS || "platform_settings"),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async (request, reply) => {
      const { key } = settingKeyParamSchema.parse(request.params);
      const [setting] = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.key, key))
        .limit(1);

      if (!setting) {
        return reply.status(404).send({ success: false, error: { message: "Setting not found" } });
      }

      return { success: true, data: setting };
    },
  );

  // PUT create or update setting
  fastify.put(
    "/:key",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.PLATFORM_SETTINGS || "platform_settings"),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async (request) => {
      const { key } = settingKeyParamSchema.parse(request.params);
      const body = putSettingBodySchema.parse(request.body);

      const [setting] = await db
        .insert(platformSettings)
        .values({
          key,
          value: body.value,
          isPublic: body.isPublic ?? false,
          description: body.description,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: {
            value: body.value,
            isPublic: body.isPublic !== undefined ? body.isPublic : undefined,
            description: body.description,
            updatedAt: new Date(),
          },
        })
        .returning();

      return { success: true, data: setting };
    },
  );

  // GET available LLM providers (metadata only — no API key needed)
  fastify.get(
    "/llm/providers",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.PLATFORM_SETTINGS),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async () => {
      const { getAllProvidersMeta } = await import("../llm/providers.js");
      return { success: true, data: getAllProvidersMeta() };
    },
  );

  // POST fetch models for a given provider using the supplied API key
  fastify.post(
    "/llm/models",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.READ, SUBJECTS.PLATFORM_SETTINGS),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async (request, reply) => {
      const { listModelsBodySchema, listModelsForProvider } = await import(
        "../llm/providers.js"
      );
      const { provider, apiKey } = listModelsBodySchema.parse(request.body);
      try {
        const models = await listModelsForProvider(provider, apiKey);
        return { success: true, data: models };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch models";
        return reply.status(400).send({
          success: false,
          error: { message },
        });
      }
    },
  );
};
