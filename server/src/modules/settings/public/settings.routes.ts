import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { platformSettings } from "../../../db/schema/settings.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";

export const publicSettingsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET all public settings
  fastify.get(
    "/",
    {
      config: { rateLimit: rateLimitConfig.public },
    },
    async () => {
      const rows = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.isPublic, true))
        .orderBy(platformSettings.key);
      return { success: true, rows, rowCount: rows.length };
    },
  );
};
