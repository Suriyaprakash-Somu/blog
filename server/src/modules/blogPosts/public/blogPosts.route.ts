import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db } from "../../../db/index.js";
import { blogPosts } from "../blogPosts.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { eq, and, desc } from "drizzle-orm";

export const publicBlogPostsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Get all published posts
  app.get("/", async (request, reply) => {
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
      })
      .from(blogPosts)
      .leftJoin(uploadedFiles, eq(blogPosts.featuredImageFileId, uploadedFiles.id))
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));

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
      })
      .from(blogPosts)
      .leftJoin(uploadedFiles, eq(blogPosts.featuredImageFileId, uploadedFiles.id))
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

    return { success: true, data: post };
  });
};
