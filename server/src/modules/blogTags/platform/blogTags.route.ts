import { and, eq, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { CRUD_ACCESS } from "../../../access/crudAccess.js";
import { createCrudRoutes, type HookContext } from "../../../core/crudFactory.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { createZodSchemas } from "../../../utils/schemaFactory.js";
import { db } from "../../../db/index.js";
import { prompts as promptsTable } from "../../prompts/prompts.schema.js";
import { platformSettings } from "../../../db/schema/settings.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { blogTags } from "../blogTags.schema.js";
import {
  generateWithCache,
  LLMGenerationError,
} from "../../settings/llm/completion.js";
import {
  buildBlogTagPrompt,
  blogTagGeneratedSchema,
  type BlogTagGenerated,
} from "../prompts/generate.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";

const COLUMN_MAP = {
  name: blogTags.name,
  slug: blogTags.slug,
  status: blogTags.status,
  createdAt: blogTags.createdAt,
};

const SEARCHABLE_COLUMNS = ["name", "slug", "description"];

const { insertSchema, updateSchema } = createZodSchemas(blogTags, {
  omit: ["createdAt", "updatedAt"],
  required: ["name", "slug"],
  strict: true,
  overrides: {
    imageFileId: z.string().uuid().optional().nullable().default(null),
    content: z.string().optional().nullable(),
    faq: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    ).optional().nullable(),
  },
});

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

function badRequest(message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = 400;
  return err;
}

async function assertPlatformUploadUsable(
  imageFileId: string,
  ctx: Pick<HookContext, "tx">
) {
  const [file] = await ctx.tx
    .select({ id: uploadedFiles.id, status: uploadedFiles.status })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, imageFileId))
    .limit(1);

  if (!file) throw badRequest("Invalid imageFileId");
  if (["DELETED", "PURGED"].includes(String(file.status))) throw badRequest("Image file is unavailable");
}

const crudRoutes = createCrudRoutes({
  table: blogTags,
  cache: {
    tag: "blogTags",
    keyPrefix: "blogTag",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,

  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: insertSchema,
    updateBody: updateSchema,
  },

  access: CRUD_ACCESS.platformBlogTags,

  rateLimit: {
    list: rateLimitConfig.tenant, 
    detail: rateLimitConfig.tenant,
    create: rateLimitConfig.user,
    update: rateLimitConfig.user,
    delete: rateLimitConfig.user,
  },

  openapi: {
    tag: "Platform Blog Tags",
    resourceName: "blogTag",
  },

  events: {
    resource: "blogTag",
    emitOn: ["create", "update", "delete"],
    enrichPayload: true,
    includeDiff: true,
  },

  beforeCreate: async (data, ctx) => {
    if (data.imageFileId) {
      await assertPlatformUploadUsable(String(data.imageFileId), ctx);
    }
    return data;
  },

  afterCreate: async (data, result, ctx) => {
    if (data.imageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "blogTag",
          attachedToId: result.id,
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(eq(uploadedFiles.id, data.imageFileId));
    }
  },

  beforeUpdate: async (data, existing, ctx) => {
    if (data.imageFileId && data.imageFileId !== existing.imageFileId) {
      await assertPlatformUploadUsable(String(data.imageFileId), ctx);

      if (existing.imageFileId) {
        await ctx.tx
          .update(uploadedFiles)
          .set({
            status: "UPLOADED",
            attachedToType: null,
            attachedToId: null,
            attachedAt: null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          })
          .where(eq(uploadedFiles.id, existing.imageFileId));
      }

      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "blogTag",
          attachedToId: existing.id,
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(eq(uploadedFiles.id, data.imageFileId));
    }
    return data;
  },

  beforeDelete: async (existing, ctx) => {
    if (existing.imageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "UPLOADED",
          attachedToType: null,
          attachedToId: null,
          attachedAt: null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .where(eq(uploadedFiles.id, existing.imageFileId));
    }
  },
});

/* ------------------------------------------------------------------ */
/*  AI Generate endpoint                                              */
/* ------------------------------------------------------------------ */

const generateBodySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  additionalInstructions: z.string().optional().nullable(),
  templateId: z.string().uuid().optional(),
});

const blogTagsGenerateRoute: FastifyPluginAsync = async (fastify) => {
  // GET /generation-templates
  fastify.get(
    "/generation-templates",
    {
      preHandler: [requirePlatformAuth()],
    },
    async (request, reply) => {
      const templates = await db
        .select({
          id: promptsTable.id,
          name: promptsTable.templateName,
          defaultInstructions: promptsTable.defaultInstructions,
        })
        .from(promptsTable)
        .where(and(
          eq(promptsTable.module, "prompt_blog_tag"),
          eq(promptsTable.isTemplate, true),
          eq(promptsTable.isActive, true),
          isNull(promptsTable.deletedAt)
        ))
        .orderBy(desc(promptsTable.createdAt));
      
      return { templates };
    }
  );

  // POST /generate
  fastify.post(
    "/generate",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.CREATE, SUBJECTS.BLOG_TAG),
      ],
      config: { rateLimit: rateLimitConfig.user },
    },
    async (request, reply) => {
      const { name, additionalInstructions, templateId } = generateBodySchema.parse(request.body);
      
      // Fetch system prompt (from template, default template, or active)
      let systemPrompt: string | null = null;
      let userPromptTemplate: string | null = null;

      if (templateId) {
        // Use selected template's system prompt
        const [template] = await db
          .select()
          .from(promptsTable)
          .where(and(
            eq(promptsTable.id, templateId),
            isNull(promptsTable.deletedAt)
          ))
          .limit(1);
        
        systemPrompt = template?.systemPrompt ?? null;
        userPromptTemplate = template?.userPromptTemplate ?? null;
      } else {
        // Try to get default template first
        const [defaultTemplate] = await db
          .select()
          .from(promptsTable)
          .where(and(
            eq(promptsTable.module, "prompt_blog_tag"),
            eq(promptsTable.isDefault, true),
            eq(promptsTable.isTemplate, true),
            isNull(promptsTable.deletedAt)
          ))
          .limit(1);
        
        if (defaultTemplate) {
          systemPrompt = defaultTemplate.systemPrompt;
          userPromptTemplate = defaultTemplate.userPromptTemplate;
        } else {
          // Fallback to active prompt for module
          const [activePrompt] = await db
            .select()
            .from(promptsTable)
            .where(and(
              eq(promptsTable.module, "prompt_blog_tag"),
              eq(promptsTable.isActive, true),
              isNull(promptsTable.deletedAt)
            ))
            .limit(1);
          
          systemPrompt = activePrompt?.systemPrompt ?? null;
          userPromptTemplate = activePrompt?.userPromptTemplate ?? null;
        }
      }

      const messages = buildBlogTagPrompt(
        name,
        systemPrompt,
        userPromptTemplate,
        additionalInstructions ?? null
      );

      try {
        const result = await generateWithCache({
          messages,
          temperature: 0.7,
          jsonMode: true,
          cacheKey: `blog_tag:${name}:${Date.now()}`,
          enableCache: true,
          module: "blog_tag",
          inputName: name,
          additionalInstructions: additionalInstructions ?? null,
          schema: blogTagGeneratedSchema,
        });

        return { success: true, data: result.data };
      } catch (err) {
        console.error("[GENERATION ERROR] Blog tag generation failed:", err);
        if (err instanceof LLMGenerationError) {
          return reply.status(400).send({
            success: false,
            error: { 
              message: "LLM response could not be parsed",
              cacheKey: err.cacheKey,
            },
          });
        }
        
        const message =
          err instanceof Error ? err.message : "AI generation failed";
        return reply.status(400).send({
          success: false,
          error: { message },
        });
      }
    },
  );
};

/* ------------------------------------------------------------------ */
/*  Combined export                                                   */
/* ------------------------------------------------------------------ */

export const platformBlogTagsRoutes: FastifyPluginAsync = async (
  fastify,
) => {
  fastify.get(
    "/options",
    {
      preHandler: [requirePlatformAuth()],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async () => {
      const rows = await db.query.blogTags.findMany({
        columns: { id: true, name: true, slug: true },
      });
      return rows;
    }
  );

  await fastify.register(crudRoutes);
  await fastify.register(blogTagsGenerateRoute);
};
