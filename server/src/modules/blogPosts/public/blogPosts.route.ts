import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db } from "../../../db/index.js";
import { blogPosts } from "../blogPosts.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { eq, and, desc, or, exists, sql } from "drizzle-orm";
import { blogCategories } from "../../blogCategories/blogCategories.schema.js";
import { blogTags } from "../../blogTags/blogTags.schema.js";
import { blogPostTags } from "../blogPostTags.schema.js";
import { platformUser } from "../../users/platform/platform.schema.js";
import { tenantUser } from "../../users/tenant/tenant.schema.js";
import { blogPostSecondaryCategories } from "../blogPostSecondaryCategories.schema.js";

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

    const needsCategoryJoin = Boolean(categorySlug);
    const needsTagJoin = Boolean(tagSlug);

    const baseWhere = [eq(blogPosts.status, "published")];
    if (featuredOnly) baseWhere.push(eq(blogPosts.isFeatured, true));

    const where = and(
      ...baseWhere,
      ...(needsCategoryJoin
        ? [
          or(
            eq(blogCategories.slug, categorySlug),
            exists(
              db
                .select()
                .from(blogPostSecondaryCategories)
                .innerJoin(
                  blogCategories,
                  eq(blogPostSecondaryCategories.categoryId, blogCategories.id),
                )
                .where(
                  and(
                    eq(blogPostSecondaryCategories.postId, blogPosts.id),
                    eq(blogCategories.slug, categorySlug),
                  ),
                ),
            ),
          ),
        ]
        : []),
      ...(needsTagJoin ? [eq(blogTags.slug, tagSlug)] : []),
    );

    // Drizzle's query builder type changes when joins are added; for this public
    // route we keep it simple and treat the builder as an untyped chain.
    let queryBuilder = db
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
      .from(blogPosts) as any;

    if (needsCategoryJoin) {
      queryBuilder = queryBuilder.leftJoin(
        blogCategories,
        eq(blogPosts.categoryId, blogCategories.id),
      );
    }

    if (needsTagJoin) {
      queryBuilder = queryBuilder
        .leftJoin(blogPostTags, eq(blogPostTags.postId, blogPosts.id))
        .leftJoin(blogTags, eq(blogPostTags.tagId, blogTags.id));
    }

    queryBuilder = (
      queryBuilder
        .leftJoin(uploadedFiles, eq(blogPosts.featuredImageFileId, uploadedFiles.id))
        .leftJoin(platformUser, and(eq(blogPosts.authorId, platformUser.id), eq(blogPosts.authorType, "platform")))
        .leftJoin(tenantUser, and(eq(blogPosts.authorId, tenantUser.id), eq(blogPosts.authorType, "tenant")))
        .where(where)
        .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
    ) as any;

    if (limit) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const posts = await queryBuilder;

    return { success: true, data: posts };
  });

  // Get a specific post by slug
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const [post] = await db
      .select({
        id: blogPosts.id,
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

    return {
      success: true,
      data: {
        ...post,
        tags: postTags,
        secondaryCategories
      }
    };
  });
};
