import type { FastifyPluginAsync } from "fastify";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { blogPosts } from "../../blogPosts/blogPosts.schema.js";
import { blogCategories } from "../../blogCategories/blogCategories.schema.js";
import { blogTags } from "../../blogTags/blogTags.schema.js";
import { blogPostTags } from "../../blogPosts/blogPostTags.schema.js";

export const publicSeoRoutes: FastifyPluginAsync = async (fastify) => {
    // 1) Sitemap data endpoint
    fastify.get("/sitemap", async () => {
        // Fetch published posts
        const posts = await db
            .select({
                slug: blogPosts.slug,
                updatedAt: blogPosts.updatedAt,
                publishedAt: blogPosts.publishedAt,
                createdAt: blogPosts.createdAt,
            })
            .from(blogPosts)
            .where(
                and(
                    eq(blogPosts.status, "published"),
                    sql`${blogPosts.publishedAt} IS NOT NULL`,
                    sql`${blogPosts.publishedAt} <= NOW()`
                )
            );

        // Fetch categories
        const categories = await db
            .select({
                slug: blogCategories.slug,
                updatedAt: blogCategories.updatedAt,
            })
            .from(blogCategories)
            .where(eq(blogCategories.status, "active"));

        // Fetch tags
        const tags = await db
            .select({
                slug: blogTags.slug,
                updatedAt: blogTags.updatedAt,
            })
            .from(blogTags)
            .where(eq(blogTags.status, "active"));

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
