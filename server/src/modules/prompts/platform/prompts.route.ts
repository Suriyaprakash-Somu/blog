import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { prompts as promptsTable } from "../prompts.schema.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";

const getPromptsQuery = z.object({
  module: z.string().optional(),
});

const createPromptBody = z.object({
  module: z.string().min(1),
  name: z.string().min(1),
  content: z.string().min(1),
});

const idParam = z.object({
  id: z.string().uuid(),
});

export const promptsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET / -> List all prompts
  fastify.get(
    "/",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.DISPLAY_LINK, SUBJECTS.PLATFORM_SETTINGS),
      ],
    },
    async (request, reply) => {
      const { module } = getPromptsQuery.parse(request.query);
      
      const conditions = [isNull(promptsTable.deletedAt)];
      if (module) {
        conditions.push(eq(promptsTable.module, module));
      }

      const rows = await db
        .select()
        .from(promptsTable)
        .where(and(...conditions))
        .orderBy(desc(promptsTable.createdAt));
      
      return { rows, rowCount: rows.length };
    }
  );

  // POST / -> Create new version
  fastify.post(
    "/",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.PLATFORM_SETTINGS),
      ],
      config: { rateLimit: rateLimitConfig.user },
    },
    async (request, reply) => {
      const { module, name, content } = createPromptBody.parse(request.body);

      // Find max version
      const [maxVerRow] = await db
        .select({ version: promptsTable.version })
        .from(promptsTable)
        .where(eq(promptsTable.module, module))
        .orderBy(desc(promptsTable.version))
        .limit(1);

      const nextVersion = maxVerRow ? maxVerRow.version + 1 : 1;

      const [newPrompt] = await db
        .insert(promptsTable)
        .values({
          module,
          name,
          content,
          version: nextVersion,
          isActive: false, // Explicitly not active, user must manually activate
        })
        .returning();

      return { data: newPrompt };
    }
  );

  // PUT /:id/activate -> Make prompt active
  fastify.put(
    "/:id/activate",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.PLATFORM_SETTINGS),
      ],
      config: { rateLimit: rateLimitConfig.user },
    },
    async (request, reply) => {
      const { id } = idParam.parse(request.params);

      // Verify the prompt exists and get its module
      const [prompt] = await db
        .select()
        .from(promptsTable)
        .where(and(eq(promptsTable.id, id), isNull(promptsTable.deletedAt)))
        .limit(1);

      if (!prompt) {
        return reply.status(404).send({ error: { message: "Prompt not found" } });
      }

      await db.transaction(async (tx) => {
        // Deactivate all prompts in this module
        await tx
          .update(promptsTable)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(promptsTable.module, prompt.module));

        // Activate the target prompt
        await tx
          .update(promptsTable)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(promptsTable.id, id));
      });

      return { success: true };
    }
  );

  // DELETE /:id -> Soft delete
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

      const [prompt] = await db
        .select()
        .from(promptsTable)
        .where(eq(promptsTable.id, id))
        .limit(1);

      if (!prompt) {
        return reply.status(404).send({ error: { message: "Prompt not found" } });
      }

      if (prompt.isActive) {
        return reply.status(400).send({ 
          error: { message: "Cannot delete an active prompt. Make another prompt active first." } 
        });
      }

      await db
        .update(promptsTable)
        .set({ deletedAt: new Date() })
        .where(eq(promptsTable.id, id));

      return { success: true };
    }
  );
};
