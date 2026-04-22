import type { FastifyPluginAsync } from "fastify";
import { eq, desc, and, sql, inArray, exists, or } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { blogPosts } from "../../blogPosts/blogPosts.schema.js";
import { blogCategories } from "../../blogCategories/blogCategories.schema.js";
import { blogTags } from "../../blogTags/blogTags.schema.js";
import { blogPostTags } from "../../blogPosts/blogPostTags.schema.js";
import { blogPostSecondaryCategories } from "../../blogPosts/blogPostSecondaryCategories.schema.js";

export const publicSeoRoutes: FastifyPluginAsync = async (fastify) => {
    // 1) Sitemap data endpoint
    fastify.get("/sitemap", async () => {
        const publishedWhere = and(
            eq(blogPosts.status, "published"),
            sql`${blogPosts.publishedAt} IS NOT NULL`,
            sql`${blogPosts.publishedAt} <= NOW()`,
        );

        // Fetch published posts
        const posts = await db
            .select({
                slug: blogPosts.slug,
                updatedAt: blogPosts.updatedAt,
                publishedAt: blogPosts.publishedAt,
                createdAt: blogPosts.createdAt,
            })
            .from(blogPosts)
            .where(publishedWhere);

        // Fetch categories
        const categories = await db
            .select({
                slug: blogCategories.slug,
                updatedAt: blogCategories.updatedAt,
                lastPostPublishedAt: sql<Date | null>`(
                    select max(p.published_at)
                    from blog_posts p
                    where p.status = 'published'
                      and p.published_at is not null
                      and p.published_at <= now()
                      and (
                        p.category_id = ${blogCategories.id}
                        or exists(
                          select 1
                          from blog_post_secondary_categories sc
                          where sc.post_id = p.id
                            and sc.category_id = ${blogCategories.id}
                        )
                      )
                )`.as("last_post_published_at"),
            })
            .from(blogCategories)
            .where(
                and(
                    eq(blogCategories.status, "active"),
                    sql`(
                      select 1
                      from blog_posts p
                      where p.status = 'published'
                        and p.published_at is not null
                        and p.published_at <= now()
                        and (
                          p.category_id = ${blogCategories.id}
                          or exists(
                            select 1
                            from blog_post_secondary_categories sc
                            where sc.post_id = p.id
                              and sc.category_id = ${blogCategories.id}
                          )
                        )
                      limit 1
                    ) is not null`,
                ),
            );

        // Fetch tags
        const tags = await db
            .select({
                slug: blogTags.slug,
                updatedAt: blogTags.updatedAt,
                lastPostPublishedAt: sql<Date | null>`(
                    select max(p.published_at)
                    from blog_posts p
                    inner join blog_post_tags pt on pt.post_id = p.id
                    where pt.tag_id = ${blogTags.id}
                      and p.status = 'published'
                      and p.published_at is not null
                      and p.published_at <= now()
                )`.as("last_post_published_at"),
            })
            .from(blogTags)
            .where(
                and(
                    eq(blogTags.status, "active"),
                    sql`(
                      select 1
                      from blog_posts p
                      inner join blog_post_tags pt on pt.post_id = p.id
                      where pt.tag_id = ${blogTags.id}
                        and p.status = 'published'
                        and p.published_at is not null
                        and p.published_at <= now()
                      limit 1
                    ) is not null`,
                ),
            );

        return {
            success: true,
            data: {
                posts,
                categories,
                tags,
            },
        };
    });

    // 2) RSS data endpoint
    fastify.get("/rss", async () => {
        const posts = await db
            .select({
                title: blogPosts.title,
                slug: blogPosts.slug,
                excerpt: blogPosts.excerpt,
                publishedAt: blogPosts.publishedAt,
                authorName: sql<string>`'Admin'`.as("authorName"), // Simplified for RSS
            })
            .from(blogPosts)
            .where(
                and(
                    eq(blogPosts.status, "published"),
                    sql`${blogPosts.publishedAt} IS NOT NULL`,
                    sql`${blogPosts.publishedAt} <= NOW()`
                )
            )
            .orderBy(desc(blogPosts.publishedAt))
            .limit(50);

        return {
            success: true,
            data: posts,
        };
    });

    // 3) LLM indexing endpoint (llms.txt source)
    fastify.get("/llms", async () => {
        const publishedWhere = and(
            eq(blogPosts.status, "published"),
            sql`${blogPosts.publishedAt} IS NOT NULL`,
            sql`${blogPosts.publishedAt} <= NOW()`,
        );

        const categories = await db
            .select({
                id: blogCategories.id,
                name: blogCategories.name,
                slug: blogCategories.slug,
                description: blogCategories.description,
                lastPostPublishedAt: sql<Date | null>`(
                    select max(p.published_at)
                    from blog_posts p
                    where p.status = 'published'
                      and p.published_at is not null
                      and p.published_at <= now()
                      and (
                        p.category_id = ${blogCategories.id}
                        or exists(
                          select 1
                          from blog_post_secondary_categories sc
                          where sc.post_id = p.id
                            and sc.category_id = ${blogCategories.id}
                        )
                      )
                )`.as("last_post_published_at"),
            })
            .from(blogCategories)
            .where(
                and(
                    eq(blogCategories.status, "active"),
                    sql`(
                      select 1
                      from blog_posts p
                      where p.status = 'published'
                        and p.published_at is not null
                        and p.published_at <= now()
                        and (
                          p.category_id = ${blogCategories.id}
                          or exists(
                            select 1
                            from blog_post_secondary_categories sc
                            where sc.post_id = p.id
                              and sc.category_id = ${blogCategories.id}
                          )
                        )
                      limit 1
                    ) is not null`,
                ),
            )
            .orderBy(desc(sql`last_post_published_at`), desc(blogCategories.updatedAt))
            .limit(30);

        const latestPosts = await db
            .select({
                id: blogPosts.id,
                title: blogPosts.title,
                slug: blogPosts.slug,
                excerpt: blogPosts.excerpt,
                publishedAt: blogPosts.publishedAt,
                updatedAt: blogPosts.updatedAt,
                isFeatured: blogPosts.isFeatured,
                categoryName: blogCategories.name,
                categorySlug: blogCategories.slug,
            })
            .from(blogPosts)
            .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
            .where(publishedWhere)
            .orderBy(desc(blogPosts.publishedAt))
            .limit(30);

        const categoryIds = categories.map((c) => c.id);
        let topPostsByCategory: Record<string, Array<(typeof latestPosts)[number]>> = {};
        if (categoryIds.length > 0) {
            const categoryMatchWhere = or(
                inArray(blogPosts.categoryId, categoryIds),
                exists(
                    db
                        .select({ one: sql<number>`1`.as("one") })
                        .from(blogPostSecondaryCategories)
                        .where(
                            and(
                                eq(blogPostSecondaryCategories.postId, blogPosts.id),
                                inArray(blogPostSecondaryCategories.categoryId, categoryIds),
                            ),
                        )
                        .limit(1),
                ),
            );

            const candidatePosts = await db
                .select({
                    id: blogPosts.id,
                    title: blogPosts.title,
                    slug: blogPosts.slug,
                    excerpt: blogPosts.excerpt,
                    publishedAt: blogPosts.publishedAt,
                    updatedAt: blogPosts.updatedAt,
                    isFeatured: blogPosts.isFeatured,
                    categoryId: blogPosts.categoryId,
                    categoryName: blogCategories.name,
                    categorySlug: blogCategories.slug,
                })
                .from(blogPosts)
                .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
                .where(and(publishedWhere, categoryMatchWhere))
                .orderBy(desc(blogPosts.isFeatured), desc(blogPosts.publishedAt))
                .limit(500);

            const postIds = candidatePosts.map((p) => p.id);
            const secondaryLinks = postIds.length > 0
                ? await db
                    .select({
                        postId: blogPostSecondaryCategories.postId,
                        categoryId: blogPostSecondaryCategories.categoryId,
                    })
                    .from(blogPostSecondaryCategories)
                    .where(
                        and(
                            inArray(blogPostSecondaryCategories.postId, postIds),
                            inArray(blogPostSecondaryCategories.categoryId, categoryIds),
                        ),
                    )
                : [];

            const byPostId = new Map(candidatePosts.map((p) => [p.id, p] as const));
            const categoryToPosts = new Map<string, Array<(typeof candidatePosts)[number]>>();
            for (const c of categories) categoryToPosts.set(c.id, []);

            // Primary category mapping
            for (const p of candidatePosts) {
                if (p.categoryId && categoryToPosts.has(p.categoryId)) {
                    categoryToPosts.get(p.categoryId)!.push(p);
                }
            }

            // Secondary category mapping
            for (const link of secondaryLinks) {
                const p = byPostId.get(link.postId);
                if (!p) continue;
                const list = categoryToPosts.get(link.categoryId);
                if (!list) continue;
                list.push(p);
            }

            // Dedup + slice per category
            topPostsByCategory = Object.fromEntries(
                categories.map((c) => {
                    const list = categoryToPosts.get(c.id) ?? [];
                    const seen = new Set<string>();
                    const deduped = list.filter((p) => {
                        if (seen.has(p.id)) return false;
                        seen.add(p.id);
                        return true;
                    });
                    deduped.sort((a, b) => {
                        const fa = a.isFeatured ? 1 : 0;
                        const fb = b.isFeatured ? 1 : 0;
                        if (fb !== fa) return fb - fa;
                        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                        return tb - ta;
                    });
                    return [c.slug, deduped.slice(0, 8)];
                }),
            );
        }

        return {
            success: true,
            data: {
                categories,
                latestPosts,
                topPostsByCategory,
            },
        };
    });
};
