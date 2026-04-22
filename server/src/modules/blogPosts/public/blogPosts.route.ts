import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db } from "../../../db/index.js";
import { blogPosts } from "../blogPosts.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { eq, and, desc, or, exists, sql, gte, inArray } from "drizzle-orm";
import { blogCategories } from "../../blogCategories/blogCategories.schema.js";
import { blogTags } from "../../blogTags/blogTags.schema.js";
import { blogPostTags } from "../blogPostTags.schema.js";
import { platformUser } from "../../users/platform/platform.schema.js";
import { tenantUser } from "../../users/tenant/tenant.schema.js";
import { blogPostSecondaryCategories } from "../blogPostSecondaryCategories.schema.js";
import { analyticsEvents } from "../../analytics/analytics.schema.js";

export const publicBlogPostsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Get all published posts
  app.get("/", async (request, reply) => {
    const query = (request.query ?? {}) as Record<string, unknown>;
    const categorySlug = typeof query.categorySlug === "string" ? query.categorySlug.trim() : "";
    const tagSlug = typeof query.tagSlug === "string" ? query.tagSlug.trim() : "";
    const featuredOnly =
      query.featuredOnly === true ||
      query.featuredOnly === "true" ||
      query.featuredOnly === "1";
    const limitRaw = typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : null;
    const limit = Number.isFinite(limitRaw) && (limitRaw as number) > 0 ? Math.min(limitRaw as number, 100) : null;

    const pageRaw = typeof query.page === "string" ? Number.parseInt(query.page, 10) : null;
    const pageSizeRaw = typeof query.pageSize === "string" ? Number.parseInt(query.pageSize, 10) : null;
    const page = Number.isFinite(pageRaw) && (pageRaw as number) > 0 ? (pageRaw as number) : null;
    const pageSize = Number.isFinite(pageSizeRaw) && (pageSizeRaw as number) > 0
      ? Math.min(pageSizeRaw as number, 100)
      : null;

    const baseWhere = [
      eq(blogPosts.status, "published"),
      sql`${blogPosts.publishedAt} IS NOT NULL`,
      sql`${blogPosts.publishedAt} <= NOW()`,
    ];
    if (featuredOnly) baseWhere.push(eq(blogPosts.isFeatured, true));

    const whereParts = [...baseWhere];

    if (categorySlug) {
      const categoryCond = or(
        exists(
          db
            .select({ one: sql<number>`1`.as("one") })
            .from(blogCategories)
            .where(and(eq(blogCategories.id, blogPosts.categoryId), eq(blogCategories.slug, categorySlug)))
            .limit(1),
        ),
        exists(
          db
            .select({ one: sql<number>`1`.as("one") })
            .from(blogPostSecondaryCategories)
            .innerJoin(blogCategories, eq(blogPostSecondaryCategories.categoryId, blogCategories.id))
            .where(and(eq(blogPostSecondaryCategories.postId, blogPosts.id), eq(blogCategories.slug, categorySlug)))
            .limit(1),
        ),
      );
      if (categoryCond) whereParts.push(categoryCond);
    }

    if (tagSlug) {
      whereParts.push(
        exists(
          db
            .select({ one: sql<number>`1`.as("one") })
            .from(blogPostTags)
            .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
            .where(and(eq(blogPostTags.postId, blogPosts.id), eq(blogTags.slug, tagSlug)))
            .limit(1),
        ),
      );
    }

    const where = and(...whereParts);

    const paginationEnabled = Boolean(page && pageSize);
    const effectivePage = paginationEnabled ? (page as number) : 1;
    const effectivePageSize = paginationEnabled ? (pageSize as number) : (limit ?? 24);
    const offset = (effectivePage - 1) * effectivePageSize;

    const [{ rowCount }] = await db
      .select({ rowCount: sql<number>`count(*)::int`.as("row_count") })
      .from(blogPosts)
      .where(where);

    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        publishedAt: blogPosts.publishedAt,
        readTimeMinutes: blogPosts.readTimeMinutes,
        isFeatured: blogPosts.isFeatured,
        featuredImageUrl: uploadedFiles.storageKey,
        authorName: sql<string>`COALESCE(${platformUser.name}, ${tenantUser.name})`.as("author_name"),
      })
      .from(blogPosts)
      .leftJoin(uploadedFiles, eq(blogPosts.featuredImageFileId, uploadedFiles.id))
      .leftJoin(platformUser, and(eq(blogPosts.authorId, platformUser.id), eq(blogPosts.authorType, "platform")))
      .leftJoin(tenantUser, and(eq(blogPosts.authorId, tenantUser.id), eq(blogPosts.authorType, "tenant")))
      .where(where)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(effectivePageSize)
      .offset(offset);

    return {
      success: true,
      data: posts,
      pagination: {
        page: effectivePage,
        pageSize: effectivePageSize,
        rowCount: rowCount ?? 0,
      },
    };
  });

  // Get a specific post by slug
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const [post] = await db
      .select({
        id: blogPosts.id,
        categoryId: blogPosts.categoryId,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        tableOfContents: blogPosts.tableOfContents,
        faq: blogPosts.faq,
        publishedAt: blogPosts.publishedAt,
        readTimeMinutes: blogPosts.readTimeMinutes,
        isFeatured: blogPosts.isFeatured,
        metaTitle: blogPosts.metaTitle,
        metaDescription: blogPosts.metaDescription,
        metaKeywords: blogPosts.metaKeywords,
        featuredImageUrl: uploadedFiles.storageKey,
        authorName: sql<string>`COALESCE(${platformUser.name}, ${tenantUser.name})`.as("author_name"),
        authorEmail: sql<string>`COALESCE(${platformUser.email}, ${tenantUser.email})`.as("author_email"),
        categoryName: blogCategories.name,
        categorySlug: blogCategories.slug,
      })
      .from(blogPosts)
      .leftJoin(uploadedFiles, eq(blogPosts.featuredImageFileId, uploadedFiles.id))
      .leftJoin(platformUser, and(eq(blogPosts.authorId, platformUser.id), eq(blogPosts.authorType, "platform")))
      .leftJoin(tenantUser, and(eq(blogPosts.authorId, tenantUser.id), eq(blogPosts.authorType, "tenant")))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(
        and(
          eq(blogPosts.status, "published"),
          sql`${blogPosts.publishedAt} IS NOT NULL`,
          sql`${blogPosts.publishedAt} <= NOW()`,
          eq(blogPosts.slug, slug)
        )
      )
      .limit(1);

    if (!post) {
      return reply.status(404).send({ success: false, error: { message: "Post not found" } });
    }

    // Fetch tags for this post
    const postTags = await db
      .select({
        id: blogTags.id,
        name: blogTags.name,
        slug: blogTags.slug,
      })
      .from(blogPostTags)
      .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(eq(blogPostTags.postId, post.id));

    // Fetch secondary categories for this post
    const secondaryCategories = await db
      .select({
        id: blogCategories.id,
        name: blogCategories.name,
        slug: blogCategories.slug,
      })
      .from(blogPostSecondaryCategories)
      .innerJoin(
        blogCategories,
        eq(blogPostSecondaryCategories.categoryId, blogCategories.id)
      )
      .where(eq(blogPostSecondaryCategories.postId, post.id));

    // Related posts (6): primary category > secondary categories > tags
    const tagIds = postTags.map((t) => t.id);
    const secondaryCategoryIds = secondaryCategories.map((c) => c.id);

    const tagJoinEnabled = tagIds.length > 0;
    const secondaryJoinEnabled = secondaryCategoryIds.length > 0;

    const categoryMatchExpr = post.categoryId
      ? sql<number>`case when ${blogPosts.categoryId} = ${post.categoryId} then 1 else 0 end`
      : sql<number>`0`;
    const tagCountExpr = tagJoinEnabled
      ? sql<number>`count(distinct ${blogPostTags.tagId})`
      : sql<number>`0`;
    const secondaryCountExpr = secondaryJoinEnabled
      ? sql<number>`count(distinct ${blogPostSecondaryCategories.categoryId})`
      : sql<number>`0`;
    const scoreExpr = sql<number>`(${categoryMatchExpr} * 100)
      + (case when ${secondaryCountExpr} > 0 then 60 else 0 end)
      + (least(${tagCountExpr}, 3) * 10)`;

    let relatedQuery = db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        score: scoreExpr.as("score"),
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          sql`${blogPosts.publishedAt} IS NOT NULL`,
          sql`${blogPosts.publishedAt} <= NOW()`,
          sql`${blogPosts.id} <> ${post.id}`,
        ),
      ) as any;

    if (tagJoinEnabled) {
      relatedQuery = relatedQuery.leftJoin(
        blogPostTags,
        and(eq(blogPostTags.postId, blogPosts.id), inArray(blogPostTags.tagId, tagIds)),
      );
    }

    if (secondaryJoinEnabled) {
      relatedQuery = relatedQuery.leftJoin(
        blogPostSecondaryCategories,
        and(
          eq(blogPostSecondaryCategories.postId, blogPosts.id),
          inArray(blogPostSecondaryCategories.categoryId, secondaryCategoryIds),
        ),
      );
    }

    const relatedRows = (await (relatedQuery as any)
      .groupBy(blogPosts.id, blogPosts.slug, blogPosts.title, blogPosts.publishedAt, blogPosts.categoryId)
      .orderBy(desc(scoreExpr), desc(blogPosts.publishedAt))
      .limit(6)) as Array<{ slug: string; title: string; score: number }>;

    const relatedPosts = relatedRows.map((r) => ({ slug: r.slug, title: r.title }));

    // Popular posts (6): last 30 days PAGE_VIEW + deep reads (SCROLL_DEPTH>=75), fallback to latest
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pathExpr = sql<string>`${analyticsEvents.eventData} ->> 'path'`;
    const depthExpr = sql<number>`nullif(${analyticsEvents.eventData} ->> 'depth', '')::int`;

    const popularPaths = await db
      .select({
        path: pathExpr.as("path"),
        pageViews: sql<number>`coalesce(count(*) filter (where ${analyticsEvents.eventType} = 'PAGE_VIEW'), 0)::int`.as("page_views"),
        deepReads: sql<number>`coalesce(count(distinct ${analyticsEvents.sessionId}) filter (where ${analyticsEvents.eventType} = 'SCROLL_DEPTH' and ${depthExpr} >= 75 and ${analyticsEvents.sessionId} is not null), 0)::int`.as("deep_reads"),
        score: sql<number>`(
          coalesce(count(*) filter (where ${analyticsEvents.eventType} = 'PAGE_VIEW'), 0)
          + (coalesce(count(distinct ${analyticsEvents.sessionId}) filter (where ${analyticsEvents.eventType} = 'SCROLL_DEPTH' and ${depthExpr} >= 75 and ${analyticsEvents.sessionId} is not null), 0) * 3)
        )::int`.as("score"),
      })
      .from(analyticsEvents)
      .where(
        and(
          inArray(analyticsEvents.eventType, ["PAGE_VIEW", "SCROLL_DEPTH"]),
          gte(analyticsEvents.timestamp, since),
          sql`${pathExpr} like '/blog/%'`,
        ),
      )
      .groupBy(pathExpr)
      .orderBy(desc(sql<number>`(
          coalesce(count(*) filter (where ${analyticsEvents.eventType} = 'PAGE_VIEW'), 0)
          + (coalesce(count(distinct ${analyticsEvents.sessionId}) filter (where ${analyticsEvents.eventType} = 'SCROLL_DEPTH' and ${depthExpr} >= 75 and ${analyticsEvents.sessionId} is not null), 0) * 3)
        )::int`))
      .limit(50);

    const popularSlugs: string[] = [];
    for (const row of popularPaths) {
      const p = row.path;
      if (!p || typeof p !== "string") continue;
      if (!p.startsWith("/blog/")) continue;
      const s = p.slice("/blog/".length);
      if (!s || s.includes("/") || s.includes("?") || s === slug) continue;
      if (!popularSlugs.includes(s)) popularSlugs.push(s);
      if (popularSlugs.length >= 12) break;
    }

    let popularPosts: Array<{ slug: string; title: string }> = [];
    if (popularSlugs.length > 0) {
      const popularRows = await db
        .select({ slug: blogPosts.slug, title: blogPosts.title })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.status, "published"),
            sql`${blogPosts.publishedAt} IS NOT NULL`,
            sql`${blogPosts.publishedAt} <= NOW()`,
            inArray(blogPosts.slug, popularSlugs),
          ),
        );

      const bySlug = new Map(popularRows.map((r) => [r.slug, r.title] as const));
      popularPosts = popularSlugs
        .map((s) => (bySlug.has(s) ? { slug: s, title: bySlug.get(s)! } : null))
        .filter(Boolean)
        .slice(0, 6) as Array<{ slug: string; title: string }>;
    }

    if (popularPosts.length === 0) {
      const fallback = await db
        .select({ slug: blogPosts.slug, title: blogPosts.title })
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.status, "published"),
            sql`${blogPosts.publishedAt} IS NOT NULL`,
            sql`${blogPosts.publishedAt} <= NOW()`,
            sql`${blogPosts.id} <> ${post.id}`,
          ),
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(6);
      popularPosts = fallback;
    }

    return {
      success: true,
      data: {
        ...post,
        tags: postTags,
        secondaryCategories,
        relatedPosts,
        popularPosts,
      }
    };
  });
};
