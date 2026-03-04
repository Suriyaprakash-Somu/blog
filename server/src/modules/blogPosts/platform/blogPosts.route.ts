import { eq } from "drizzle-orm";
import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { CRUD_ACCESS } from "../../../access/crudAccess.js";
import { createCrudRoutes, type HookContext } from "../../../core/crudFactory.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { createZodSchemas } from "../../../utils/schemaFactory.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { blogPosts } from "../blogPosts.schema.js";
import { blogPostTags } from "../blogPostTags.schema.js";
import { blogPostSecondaryCategories } from "../blogPostSecondaryCategories.schema.js";
import { chatCompletion } from "../../settings/llm/completion.js";
import {
  buildBlogPostPrompt,
  blogPostGeneratedSchema,
  type BlogPostGenerated,
} from "../prompts/generate.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import {
  slugify,
  extractTableOfContents,
  calculateReadTime,
  extractContentImageIds,
  robustJsonParse,
  extractListFromTruncatedJson
} from "../../../utils/text.js";


/* ------------------------------------------------------------------ */
/*  Schemas                                                           */
/* ------------------------------------------------------------------ */

const COLUMN_MAP = {
  title: blogPosts.title,
  slug: blogPosts.slug,
  status: blogPosts.status,
  publishedAt: blogPosts.publishedAt,
  isFeatured: blogPosts.isFeatured,
  createdAt: blogPosts.createdAt,
};

const SEARCHABLE_COLUMNS = ["title", "slug", "excerpt"];

const { insertSchema, updateSchema } = createZodSchemas(blogPosts, {
  omit: [
    "createdAt",
    "updatedAt",
    "tableOfContents",
    "readTimeMinutes",
    "contentImageFileIds",
  ],
  required: ["title", "slug"],
  strict: true,
  overrides: {
    featuredImageFileId: z.string().uuid().nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    secondaryCategoryIds: z.array(z.string().uuid()).optional(),
    authorId: z.string().uuid().nullable().optional(),
    faq: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .optional(),
    tagIds: z.array(z.string().uuid()).optional(),
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

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function badRequest(message: string) {
  const err = new Error(message) as Error & { statusCode?: number };
  err.statusCode = 400;
  return err;
}

async function assertPlatformUploadUsable(
  imageFileId: string,
  ctx: Pick<HookContext, "tx">,
) {
  const [file] = await ctx.tx
    .select({ id: uploadedFiles.id, status: uploadedFiles.status })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, imageFileId))
    .limit(1);

  if (!file) throw badRequest("Invalid imageFileId");
  if (["DELETED", "PURGED"].includes(String(file.status)))
    throw badRequest("Image file is unavailable");
}

function enrichWithComputed(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const content = (data.content as string) ?? "";
  return {
    ...data,
    tableOfContents: extractTableOfContents(content),
    readTimeMinutes: calculateReadTime(content),
    contentImageFileIds: extractContentImageIds(content),
  };
}

async function syncTags(
  postId: string,
  tagIds: string[] | undefined,
  ctx: Pick<HookContext, "tx">,
) {
  if (!tagIds) return;

  // Delete existing
  await ctx.tx.delete(blogPostTags).where(eq(blogPostTags.postId, postId));

  // Insert new
  if (tagIds.length > 0) {
    await ctx.tx.insert(blogPostTags).values(
      tagIds.map((tagId) => ({ postId, tagId })),
    );
  }
}

async function syncSecondaryCategories(
  postId: string,
  categoryIds: string[] | undefined,
  ctx: Pick<HookContext, "tx">,
) {
  if (!categoryIds) return;

  // Delete existing
  await ctx.tx
    .delete(blogPostSecondaryCategories)
    .where(eq(blogPostSecondaryCategories.postId, postId));

  // Insert new
  if (categoryIds.length > 0) {
    await ctx.tx.insert(blogPostSecondaryCategories).values(
      categoryIds.map((categoryId) => ({ postId, categoryId })),
    );
  }
}

/* ------------------------------------------------------------------ */
/*  CRUD routes                                                       */
/* ------------------------------------------------------------------ */

const crudRoutes = createCrudRoutes({
  table: blogPosts,
  cache: {
    tag: "blogPosts",
    keyPrefix: "blogPost",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,

  validation: {
    listQuery: listQuerySchema,
    idParams: idParamsSchema,
    createBody: insertSchema,
    updateBody: updateSchema,
  },

  access: CRUD_ACCESS.platformBlogPosts,

  rateLimit: {
    list: rateLimitConfig.tenant,
    detail: rateLimitConfig.tenant,
    create: rateLimitConfig.user,
    update: rateLimitConfig.user,
    delete: rateLimitConfig.user,
  },

  openapi: {
    tag: "Platform Blog Posts",
    resourceName: "blogPost",
  },

  events: {
    resource: "blogPost",
    emitOn: ["create", "update", "delete"],
    enrichPayload: true,
    includeDiff: true,
  },

  beforeCreate: async (data, ctx) => {
    // Strip tagIds and secondaryCategoryIds before insert (handled separately)
    const { tagIds, secondaryCategoryIds, ...postData } = data as Record<string, unknown> & {
      tagIds?: string[];
      secondaryCategoryIds?: string[];
    };
    if (postData.featuredImageFileId) {
      await assertPlatformUploadUsable(
        String(postData.featuredImageFileId),
        ctx,
      );
    }

    // Assign author to current platform user
    postData.authorId = (ctx.req as any).platformUser?.user?.id;
    postData.authorType = "platform";

    return enrichWithComputed(postData) as typeof data;
  },

  afterCreate: async (data, result, ctx) => {
    // Attach featured image
    if (data.featuredImageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "blogPost",
          attachedToId: result.id,
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(eq(uploadedFiles.id, data.featuredImageFileId));
    }

    // Sync tags
    const tagIds = (data as Record<string, unknown>).tagIds as
      | string[]
      | undefined;
    await syncTags(result.id, tagIds, ctx);

    // Sync secondary categories
    const secondaryCategoryIds = (data as Record<string, unknown>)
      .secondaryCategoryIds as string[] | undefined;
    await syncSecondaryCategories(result.id, secondaryCategoryIds, ctx);
  },

  beforeUpdate: async (data, existing, ctx) => {
    const { tagIds, secondaryCategoryIds, ...postData } = data as Record<string, unknown> & {
      tagIds?: string[];
      secondaryCategoryIds?: string[];
    };

    // Handle featured image swap
    if (
      postData.featuredImageFileId &&
      postData.featuredImageFileId !== existing.featuredImageFileId
    ) {
      await assertPlatformUploadUsable(
        String(postData.featuredImageFileId),
        ctx,
      );

      if (existing.featuredImageFileId) {
        await ctx.tx
          .update(uploadedFiles)
          .set({
            status: "UPLOADED",
            attachedToType: null,
            attachedToId: null,
            attachedAt: null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          })
          .where(eq(uploadedFiles.id, existing.featuredImageFileId));
      }

      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "blogPost",
          attachedToId: existing.id,
          attachedAt: new Date(),
          expiresAt: null,
        })
        .where(eq(uploadedFiles.id, String(postData.featuredImageFileId)));
    }

    // Sync tags
    await syncTags(existing.id, tagIds, ctx);

    // Sync secondary categories
    await syncSecondaryCategories(existing.id, secondaryCategoryIds, ctx);

    return enrichWithComputed(postData) as typeof data;
  },

  beforeDelete: async (existing, ctx) => {
    // Detach featured image
    if (existing.featuredImageFileId) {
      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "UPLOADED",
          attachedToType: null,
          attachedToId: null,
          attachedAt: null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .where(eq(uploadedFiles.id, existing.featuredImageFileId));
    }

    // Delete tag associations
    await ctx.tx
      .delete(blogPostTags)
      .where(eq(blogPostTags.postId, existing.id));

    // Delete secondary category associations
    await ctx.tx
      .delete(blogPostSecondaryCategories)
      .where(eq(blogPostSecondaryCategories.postId, existing.id));
  },
});

/* ------------------------------------------------------------------ */
/*  AI Generate endpoint                                              */
/* ------------------------------------------------------------------ */

const generateBodySchema = z.object({
  title: z.string().min(1, "Post title is required"),
});

const blogPostsGenerateRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/generate",
    {
      preHandler: [
        requirePlatformAuth(),
        platformAbilityGuard(ACTIONS.CREATE, SUBJECTS.BLOG_POST),
      ],
      config: { rateLimit: rateLimitConfig.user },
    },
    async (request, reply) => {
      const { title } = generateBodySchema.parse(request.body);
      try {
        console.log(`[GENERATION] Starting AI blog post generation for title: "${title}"`);
        request.log.info({ title }, "Starting AI blog post generation");
        const messages = buildBlogPostPrompt(title);

        console.log(`[GENERATION] Sending request to LLM (chatCompletion)...`);
        request.log.info("Sending request to LLM...");
        const rawText = await chatCompletion({
          messages,
          temperature: 0.7,
          maxTokens: 16000,
          jsonMode: true,
        });

        console.log(`[GENERATION] Raw text received. Length:`, rawText.length);
        console.log(`[GENERATION] Raw LLM response (first 1000 chars):`, rawText.slice(0, 1000));

        let text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          text = text.substring(firstBrace, lastBrace + 1);
        }
        const parsedData = robustJsonParse<any>(text, {
          slug: "",
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          excerpt: "",
          content: text
        });

        // Only use specialized list extractor as fallback if FAQ is missing
        if (!parsedData.faq || !Array.isArray(parsedData.faq) || parsedData.faq.length === 0) {
          console.log(`[GENERATION] FAQ not found in parsed data, trying extractListFromTruncatedJson...`);
          parsedData.faq = extractListFromTruncatedJson(text, "faq");
        }

        console.log(`[GENERATION] Parsed data keys:`, Object.keys(parsedData));
        console.log(`[GENERATION] FAQ items found:`, parsedData.faq?.length || 0);
        if (parsedData.faq?.length > 0) {
          console.log(`[GENERATION] First FAQ:`, JSON.stringify(parsedData.faq[0]));
        }

        console.log(`[GENERATION] Schema validation running...`);
        request.log.info("Validating schema...");
        const validated = blogPostGeneratedSchema.parse(parsedData);

        console.log(`[GENERATION] Schema validation successful.`);
        request.log.info("AI generation successful");
        return { success: true, data: validated };
      } catch (err) {
        console.error(`[GENERATION ERROR] Request failed:`, err);
        request.log.error({ err }, "AI generation failed");
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

export const platformBlogPostsRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(crudRoutes);
  await fastify.register(blogPostsGenerateRoute);
};
