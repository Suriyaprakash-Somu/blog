import type { FastifyPluginAsync } from "fastify";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { requireTenantAuth } from "../../../middlewares/tenant.guard.js";
import { banners } from "../banners.schema.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

function userAudienceCondition() {
  return or(
    sql`${banners.targetSegments} IS NULL`,
    sql`jsonb_typeof(${banners.targetSegments}) <> 'array'`,
    sql`jsonb_array_length(${banners.targetSegments}) = 0`,
    sql`${banners.targetSegments} ? 'USER'`,
  );
}

export const tenantBannersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", requireTenantAuth());

  fastify.get(
    "/active",
    { config: { rateLimit: rateLimitConfig.tenant } },
    async () => {
    const now = new Date();

    const rows = await db
      .select()
      .from(banners)
      .where(
        and(
          eq(banners.isActive, true),
          or(sql`${banners.startDate} IS NULL`, sql`${banners.startDate} <= ${now}`),
          or(sql`${banners.endDate} IS NULL`, sql`${banners.endDate} >= ${now}`),
          userAudienceCondition(),
        ),
      )
      .orderBy(desc(banners.createdAt));

    return { rows, rowCount: rows.length };
    }
  );

  fastify.get(
    "/",
    { config: { rateLimit: rateLimitConfig.tenant } },
    async () => {
    return { rows: [], rowCount: 0 };
    }
  );
};
