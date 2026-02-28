import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db } from "../../../db/index.js";
import { blogCategories } from "../blogCategories.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { eq, desc } from "drizzle-orm";

export const publicBlogCategoriesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
    // Get all active categories
    app.get("/", async (request, reply) => {
        const categories = await db
            .select({
                id: blogCategories.id,
                name: blogCategories.name,
                slug: blogCategories.slug,
                description: blogCategories.description,
                icon: blogCategories.icon,
                imageUrl: uploadedFiles.storageKey,
            })
            .from(blogCategories)
            .leftJoin(uploadedFiles, eq(blogCategories.imageFileId, uploadedFiles.id))
            .where(eq(blogCategories.status, "active"))
            .orderBy(desc(blogCategories.createdAt));

        return { success: true, data: categories };
    });

    // Get a specific category by slug
    app.get("/slug/:slug", async (request, reply) => {
        const { slug } = request.params as { slug: string };

        const [category] = await db
            .select({
                id: blogCategories.id,
                name: blogCategories.name,
                slug: blogCategories.slug,
                description: blogCategories.description,
                icon: blogCategories.icon,
                metaTitle: blogCategories.metaTitle,
                metaDescription: blogCategories.metaDescription,
                metaKeywords: blogCategories.metaKeywords,
                status: blogCategories.status,
                imageUrl: uploadedFiles.storageKey,
            })
            .from(blogCategories)
            .leftJoin(uploadedFiles, eq(blogCategories.imageFileId, uploadedFiles.id))
            .where(eq(blogCategories.slug, slug))
            .limit(1);

        if (!category || category.status !== "active") {
            return reply.status(404).send({ success: false, error: { message: "Category not found" } });
        }

        return { success: true, data: category };
    });
};
