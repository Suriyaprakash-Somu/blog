import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { platformSettings } from "../../../db/schema/settings.js";
import { prompts as promptsTable } from "../../prompts/prompts.schema.js";
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
import { requireTenantAuth } from "../../../middlewares/tenant.guard.js";
import { tenantAbilityGuard } from "../../../middlewares/ability.guard.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";

/* ------------------------------------------------------------------ */
/*  Utility: extract TOC from Markdown                                */
/* ------------------------------------------------------------------ */

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function extractTableOfContents(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const regex = /^(#{2,5})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length; // 2–5
    const text = match[2].trim();
    entries.push({
      id: slugify(text),
      text,
      level,
    });
  }

  return entries;
}

/* ------------------------------------------------------------------ */
/*  Utility: calculate read time (~200 words/min)                     */
/* ------------------------------------------------------------------ */

function calculateReadTime(markdown: string): number {
  const words = markdown
    .replace(/[#*_`>\[\]()!|-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/* ------------------------------------------------------------------ */
/*  Utility: extract image file IDs from Markdown                     */
/* ------------------------------------------------------------------ */

function extractContentImageIds(markdown: string): string[] {
  const ids: string[] = [];
  // Match ![alt](/api/uploads/{uuid}) or ![alt](/uploads/{uuid})
  const regex = /!\[.*?\]\(\/(?:api\/)?uploads\/([a-f0-9-]{36})\)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markdown)) !== null) {
    ids.push(match[1]);
  }

  return [...new Set(ids)];
}

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
    featuredImageFileId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    secondaryCategoryIds: z.array(z.string().uuid()).optional(),
    authorId: z.string().uuid().optional(),
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

async function assertTenantUploadUsable(
  imageFileId: string,
  ctx: Pick<HookContext, "tx" | "tenantId">,
) {
  const [file] = await ctx.tx
    .select({
      id: uploadedFiles.id,
      status: uploadedFiles.status,
      tenantId: uploadedFiles.tenantId,
      isPublic: uploadedFiles.isPublic
    })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, imageFileId))
    .limit(1);

  if (!file) throw badRequest("Invalid imageFileId");

  if (file.tenantId && file.tenantId !== ctx.tenantId) {
    throw badRequest("Invalid imageFileId");
  }

  if (!file.tenantId && !file.isPublic) {
    throw badRequest("Invalid imageFileId");
  }

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

  access: CRUD_ACCESS.tenantBlogPosts,

  rateLimit: {
    list: rateLimitConfig.tenant,
    detail: rateLimitConfig.tenant,
    create: rateLimitConfig.user,
    update: rateLimitConfig.user,
    delete: rateLimitConfig.user,
  },

  openapi: {
    tag: "Tenant Blog Posts",
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
      status?: string;
    };
    if (postData.featuredImageFileId) {
      await assertTenantUploadUsable(
        String(postData.featuredImageFileId),
        ctx,
      );
    }

    if (postData.status === "published") {
      postData.status = "draft";
    }

    // Assign author to current tenant user
    postData.authorId = ctx.req.tenantSession.user.id;
    postData.authorType = "tenant";

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
          tenantId: ctx.tenantId,
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
      status?: string;
    };

    // Handle featured image swap
    if (
      postData.featuredImageFileId &&
      postData.featuredImageFileId !== existing.featuredImageFileId
    ) {
      await assertTenantUploadUsable(
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
          .where(and(eq(uploadedFiles.id, existing.featuredImageFileId), eq(uploadedFiles.tenantId, ctx.tenantId)));
      }

      await ctx.tx
        .update(uploadedFiles)
        .set({
          status: "ATTACHED",
          attachedToType: "blogPost",
          attachedToId: existing.id,
          attachedAt: new Date(),
          expiresAt: null,
          tenantId: ctx.tenantId,
        })
        .where(eq(uploadedFiles.id, String(postData.featuredImageFileId)));
    }

    if (postData.status === "published") {
      postData.status = "draft";
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
        requireTenantAuth(),
        tenantAbilityGuard(ACTIONS.CREATE, SUBJECTS.BLOG_POST),
      ],
      config: { rateLimit: rateLimitConfig.user },
    },
    async (request, reply) => {
      const { title } = generateBodySchema.parse(request.body);
      try {
        console.log(`[GENERATION] Starting AI blog post generation for title: "${title}"`);
        request.log.info({ title }, "Starting AI blog post generation");
        
        const [promptSetting] = await db
          .select()
          .from(promptsTable)
          .where(
            and(
              eq(promptsTable.module, "prompt_blog_post"),
              eq(promptsTable.isActive, true),
              isNull(promptsTable.deletedAt)
            )
          )
          .limit(1);
        const customPrompt = promptSetting?.content ? promptSetting.content : null;

        const messages = buildBlogPostPrompt(title, customPrompt);

        console.log(`[GENERATION] Sending request to LLM (chatCompletion)...`);
        request.log.info("Sending request to LLM...");
        const rawText = await chatCompletion({
          messages,
          temperature: 0.7,
          maxTokens: 16000,
          jsonMode: true,
        });

        console.log(`[GENERATION] Raw text received. Length:`, rawText.length);

        let text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          text = text.substring(firstBrace, lastBrace + 1);
        }

        let parsedData: any = null;
        try {
          parsedData = JSON.parse(text);
          console.log(`[GENERATION] Strict JSON parse successful.`);
        } catch (e) {
          console.warn(`[GENERATION] Strict JSON parsing failed. Attempting regex fallback...`);

          const extractField = (fieldName: string) => {
            const regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)(?:"|$)`, 'i');
            const match = text.match(regex);
            if (match && match[1]) {
              return match[1]
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\');
            }
            return "";
          };

          const extractFaqList = () => {
            try {
              // Grab everything from "faq": [ ... up to the end of the text
              const faqMatch = text.match(/"faq"\s*:\s*(\[\s*\{[\s\S]*)/i);
              if (faqMatch && faqMatch[1]) {
                let faqStr = faqMatch[1];
                // Try to close JSON cleanly if truncated
                let bracketsCount = (faqStr.match(/\{/g) || []).length;
                let closingBracketsCount = (faqStr.match(/\}/g) || []).length;

                // If not balanced, try terminating gracefully
                if (bracketsCount > closingBracketsCount) {
                  faqStr = faqStr.substring(0, faqStr.lastIndexOf('}'));
                  faqStr += "}]";
                }

                // Strip trailing comma before list closure if any
                faqStr = faqStr.replace(/,\s*\]/, ']');

                try {
                  const parsed = JSON.parse(faqStr);
                  if (Array.isArray(parsed)) return parsed;
                } catch (fallbackParseErr) {
                  // If still malformed, just string match question/answer explicitly
                  const arr: any[] = [];
                  const qRegex = /"question"\s*:\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)"\s*,\s*"answer"\s*:\s*"((?:[^"\\\\]|\\\\[\\s\\S])*)"/gi;
                  let qMatch;
                  while ((qMatch = qRegex.exec(faqStr)) !== null) {
                    arr.push({
                      question: qMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
                      answer: qMatch[2].replace(/\\"/g, '"').replace(/\\n/g, '\n')
                    });
                  }
                  return arr;
                }
              }
            } catch (ignore) { }
            return [];
          };

          const extractedData = {
            slug: extractField("slug"),
            metaTitle: extractField("metaTitle"),
            metaDescription: extractField("metaDescription"),
            metaKeywords: extractField("metaKeywords"),
            excerpt: extractField("excerpt"),
            content: extractField("content"),
            faq: extractFaqList()
          };

          if (extractedData.content || extractedData.metaTitle) {
            console.log(`[GENERATION] Regex fallback extracted content!`);
            parsedData = extractedData;
          } else {
            console.log(`[GENERATION] Ultimate fallback: returning raw text as content.`);
            parsedData = {
              slug: "",
              metaTitle: "",
              metaDescription: "",
              metaKeywords: "",
              excerpt: "",
              content: text,
              faq: []
            };
          }
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

export const tenantBlogPostsRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(crudRoutes);
  await fastify.register(blogPostsGenerateRoute);
};
