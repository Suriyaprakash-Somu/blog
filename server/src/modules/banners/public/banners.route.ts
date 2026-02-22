import type { FastifyPluginAsync } from "fastify";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { banners } from "../banners.schema.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

const querySchema = z
  .object({
    type: z.enum(["HEADER", "CTA"]).optional(),
  })
  .strict();

function guestAudienceCondition() {
  return or(
    sql`${banners.targetSegments} IS NULL`,
    sql`jsonb_typeof(${banners.targetSegments}) <> 'array'`,
    sql`jsonb_array_length(${banners.targetSegments}) = 0`,
    sql`${banners.targetSegments} ? 'GUEST'`,
  );
}

export const publicBannersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/active",
    { config: { rateLimit: rateLimitConfig.global } },
    async (request, reply) => {
    const parsed = querySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid query" });
    }

    const now = new Date();
    const type = parsed.data.type;

    const rows = await db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          ...(type ? [eq(banners.type, type)] : []),
          or(sql`${banners.startDate} IS NULL`, sql`${banners.startDate} <= ${now}`),
          or(sql`${banners.endDate} IS NULL`, sql`${banners.endDate} >= ${now}`),
          guestAudienceCondition(),
        ),
      )
      .orderBy(desc(banners.createdAt));

    return { rows, rowCount: rows.length };
    }
  );
};
