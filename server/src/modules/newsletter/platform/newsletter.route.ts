import type { FastifyPluginAsync } from "fastify";
import { desc, count } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { newsletterSubscribers } from "../newsletter.schema.js";
import { requirePlatformAuth } from "../../../middlewares/auth.guard.js";

const querySchema = z
    .object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(100).default(10),
    })
    .strict();

export const platformNewsletterRoutes: FastifyPluginAsync = async (fastify) => {
    fastify.addHook("preHandler", requirePlatformAuth());

    fastify.get("/", async (request, reply) => {
        const parsed = querySchema.safeParse(request.query ?? {});
        if (!parsed.success) {
            return reply.status(400).send({ error: "Invalid pagination parameters" });
        }

        const { page, pageSize } = parsed.data;
        const offset = (page - 1) * pageSize;

        const [totalCountResult] = await db
            .select({ count: count() })
            .from(newsletterSubscribers);

        const totalCount = totalCountResult?.count ?? 0;

        const rows = await db
            .select()
            .from(newsletterSubscribers)
            .orderBy(desc(newsletterSubscribers.createdAt))
            .limit(pageSize)
            .offset(offset);

        return {
            rows,
            rowCount: totalCount,
            pagination: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
            },
        };
    });
};
