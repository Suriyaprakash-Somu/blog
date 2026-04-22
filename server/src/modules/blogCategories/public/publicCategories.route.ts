import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db } from "../../../db/index.js";
import { blogCategories } from "../blogCategories.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { eq, desc, sql, and } from "drizzle-orm";

export const publicBlogCategoriesRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
    // Get all active categories
    app.get("/", async (request, reply) => {
        const query = (request.query ?? {}) as Record<string, unknown>;
        const pageRaw = typeof query.page === "string" ? Number.parseInt(query.page, 10) : null;
        const pageSizeRaw = typeof query.pageSize === "string" ? Number.parseInt(query.pageSize, 10) : null;
        const q = typeof query.q === "string" ? query.q.trim() : "";

        const page = Number.isFinite(pageRaw) && (pageRaw as number) > 0 ? (pageRaw as number) : 1;
        const pageSize = Number.isFinite(pageSizeRaw) && (pageSizeRaw as number) > 0
          ? Math.min(pageSizeRaw as number, 200)
          : 60;
        const offset = (page - 1) * pageSize;

        const where = and(
            eq(blogCategories.status, "active"),
            ...(q
                ? [sql`${blogCategories.name} ILIKE ${`%${q}%`}`]
                : []),
        );

        const [{ rowCount }] = await db
            .select({ rowCount: sql<number>`count(*)::int`.as("row_count") })
            .from(blogCategories)
            .where(where);

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
            .where(where)
            .orderBy(desc(blogCategories.createdAt))
            .limit(pageSize)
            .offset(offset);

        return { success: true, data: categories, pagination: { page, pageSize, rowCount: rowCount ?? 0 } };
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
                content: blogCategories.content,
                faq: blogCategories.faq,
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
