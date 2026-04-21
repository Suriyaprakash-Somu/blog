import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import {
  getCacheEntries,
  getCacheEntry,
  updateCacheEntry,
  removeFromCache,
} from "../../../core/llmResponseStorage.js";
import { db } from "../../../db/index.js";
import { llmResponseCache } from "../../llmCache/llmCache.schema.js";
import { eq } from "drizzle-orm";
import { chatCompletion } from "../../settings/llm/completion.js";
import { parseAndStoreResponse } from "../../../core/llmResponseParser.js";
import { createPromptHash } from "../../../core/llmResponseStorage.js";

const listQuerySchema = z.object({
  module: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
});

const idParam = z.object({
  id: z.string().uuid(),
});

const correctBodySchema = z.object({
  correctedJson: z.string().min(1, "Corrected JSON is required"),
});

export const llmCacheRoutes: FastifyPluginAsync = async (fastify) => {
  // GET / - List all cache entries
  fastify.get(
    "/",
    {
      preHandler: [requirePlatformAuth()],
    },
    async (request, reply) => {
      const filters = listQuerySchema.parse(request.query);

      const { rows, rowCount } = await getCacheEntries(filters);

      return { rows, rowCount };
    }
  );

  // GET /:id - Get single entry
  fastify.get(
    "/:id",
    {
      preHandler: [requirePlatformAuth()],
    },
    async (request, reply) => {
      const { id } = idParam.parse(request.params);

      const entry = await getCacheEntry(id);

      if (!entry) {
        return reply.status(404).send({ error: { message: "Cache entry not found" } });
      }

      return entry;
    }
  );

  // PUT /:id/correct - Manually correct failed response
  fastify.put(
    "/:id/correct",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.PLATFORM_SETTINGS),
      ],
      config: { rateLimit: rateLimitConfig.user },
    },
    async (request, reply) => {
      const { id } = idParam.parse(request.params);
      const { correctedJson } = correctBodySchema.parse(request.body);

      const entry = await getCacheEntry(id);
      if (!entry) {
        return reply.status(404).send({ error: { message: "Cache entry not found" } });
      }

      // Get appropriate schema based on module
      let schema: z.ZodSchema<unknown>;
      
      if (entry.module === "blog_post") {
        const { blogPostGeneratedSchema } = await import("../../blogPosts/prompts/generate.js");
        schema = blogPostGeneratedSchema;
      } else if (entry.module === "blog_tag") {
        const { blogTagGeneratedSchema } = await import("../../blogTags/prompts/generate.js");
        schema = blogTagGeneratedSchema;
      } else if (entry.module === "blog_category") {
        const { blogCategoryGeneratedSchema } = await import("../../blogCategories/prompts/generate.js");
        schema = blogCategoryGeneratedSchema;
      } else {
        // Generic JSON validation
        schema = z.any();
      }

      try {
        const parsed = JSON.parse(correctedJson);
        const validated = schema.parse(parsed);

        await updateCacheEntry(id, {
          parsedData: validated as unknown,
          status: "corrected",
        });

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid JSON";
        return reply.status(400).send({ error: { message } });
      }
    }
  );

  // PUT /:id/retry - Retry LLM generation
  fastify.put(
    "/:id/retry",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.PLATFORM_SETTINGS),
      ],
      config: { rateLimit: rateLimitConfig.user },
    },
    async (request, reply) => {
      const { id } = idParam.parse(request.params);

      const entry = await getCacheEntry(id);
      if (!entry) {
        return reply.status(404).send({ error: { message: "Cache entry not found" } });
      }

      // Rebuild messages
      const messages = [
        { role: "system" as const, content: entry.systemPrompt },
        { role: "user" as const, content: entry.userPrompt },
      ];

      try {
        const rawResponse = await chatCompletion({
          messages,
          temperature: entry.temperature ? parseFloat(entry.temperature) : 0.7,
          maxTokens: 16000,
          jsonMode: true,
        });

        // Get appropriate schema
        let schema: z.ZodSchema<unknown>;
        
        if (entry.module === "blog_post") {
          const { blogPostGeneratedSchema } = await import("../../blogPosts/prompts/generate.js");
          schema = blogPostGeneratedSchema;
        } else if (entry.module === "blog_tag") {
          const { blogTagGeneratedSchema } = await import("../../blogTags/prompts/generate.js");
          schema = blogTagGeneratedSchema;
        } else if (entry.module === "blog_category") {
          const { blogCategoryGeneratedSchema } = await import("../../blogCategories/prompts/generate.js");
          schema = blogCategoryGeneratedSchema;
        } else {
          schema = z.any();
        }

        const promptHash = createPromptHash(entry.systemPrompt, entry.userPrompt);

        const result = await parseAndStoreResponse({
          cacheKey: entry.cacheKey,
          promptHash,
          module: entry.module,
          rawResponse,
          schema,
          inputTitle: entry.inputTitle ?? undefined,
          inputName: entry.inputName ?? undefined,
          additionalInstructions: entry.additionalInstructions,
          systemPrompt: entry.systemPrompt,
          userPrompt: entry.userPrompt,
          model: undefined,
          temperature: entry.temperature ? parseFloat(entry.temperature) : undefined,
          tokenUsage: undefined,
        });

        if (!result.success) {
          return reply.status(400).send({
            success: false,
            error: { message: result.errorMessage ?? "Retry failed" },
          });
        }

        return { success: true, data: result.data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Retry failed";
        return reply.status(500).send({ error: { message } });
      }
    }
  );

  // DELETE /:id - Delete cache entry
  fastify.delete(
    "/:id",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.PLATFORM_SETTINGS),
      ],
    },
    async (request, reply) => {
      const { id } = idParam.parse(request.params);

      const entry = await getCacheEntry(id);
      if (!entry) {
        return reply.status(404).send({ error: { message: "Cache entry not found" } });
      }

      await removeFromCache(entry.cacheKey);

      return { success: true };
    }
  );
};
