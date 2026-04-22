import type { FastifyPluginAsync } from "fastify";
import { eq, desc, and, sql } from "drizzle-orm";
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
};
