import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db } from "../../../db/index.js";
import { blogTags } from "../blogTags.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { eq, desc } from "drizzle-orm";

export const publicBlogTagsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
    // Get all active tags
    app.get("/", async (request, reply) => {
        const tags = await db
            .select({
                id: blogTags.id,
                name: blogTags.name,
                slug: blogTags.slug,
                description: blogTags.description,
                icon: blogTags.icon,
                imageUrl: uploadedFiles.storageKey,
            })
            .from(blogTags)
            .leftJoin(uploadedFiles, eq(blogTags.imageFileId, uploadedFiles.id))
            .where(eq(blogTags.status, "active"))
            .orderBy(desc(blogTags.createdAt));

        return { success: true, data: tags };
    });

    // Get a specific tag by slug
    app.get("/slug/:slug", async (request, reply) => {
        const { slug } = request.params as { slug: string };

        const [tag] = await db
            .select({
                id: blogTags.id,
                name: blogTags.name,
                slug: blogTags.slug,
                description: blogTags.description,
                icon: blogTags.icon,
                metaTitle: blogTags.metaTitle,
                metaDescription: blogTags.metaDescription,
                metaKeywords: blogTags.metaKeywords,
                status: blogTags.status,
                imageUrl: uploadedFiles.storageKey,
                content: blogTags.content,
                faq: blogTags.faq,
            })
            .from(blogTags)
            .leftJoin(uploadedFiles, eq(blogTags.imageFileId, uploadedFiles.id))
            .where(eq(blogTags.slug, slug))
            .limit(1);

        if (!tag || tag.status !== "active") {
            return reply.status(404).send({ success: false, error: { message: "Tag not found" } });
        }

        return { success: true, data: tag };
    });
};
