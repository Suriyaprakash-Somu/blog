import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { db } from "../../../db/index.js";
import { blogTags } from "../blogTags.schema.js";
import { uploadedFiles } from "../../uploads/uploadedFiles.schema.js";
import { eq, desc, sql, and } from "drizzle-orm";

export const publicBlogTagsRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
    // Get all active tags
    app.get("/", async (request, reply) => {
        const query = (request.query ?? {}) as Record<string, unknown>;
        const pageRaw = typeof query.page === "string" ? Number.parseInt(query.page, 10) : null;
        const pageSizeRaw = typeof query.pageSize === "string" ? Number.parseInt(query.pageSize, 10) : null;
        const q = typeof query.q === "string" ? query.q.trim() : "";

        const page = Number.isFinite(pageRaw) && (pageRaw as number) > 0 ? (pageRaw as number) : 1;
        const pageSize = Number.isFinite(pageSizeRaw) && (pageSizeRaw as number) > 0
          ? Math.min(pageSizeRaw as number, 200)
          : 100;
        const offset = (page - 1) * pageSize;

        const where = and(
            eq(blogTags.status, "active"),
            ...(q
                ? [sql`${blogTags.name} ILIKE ${`%${q}%`}`]
                : []),
        );

        const [{ rowCount }] = await db
            .select({ rowCount: sql<number>`count(*)::int`.as("row_count") })
            .from(blogTags)
            .where(where);

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
            .where(where)
            .orderBy(desc(blogTags.createdAt))
            .limit(pageSize)
            .offset(offset);

        return { success: true, data: tags, pagination: { page, pageSize, rowCount: rowCount ?? 0 } };
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
