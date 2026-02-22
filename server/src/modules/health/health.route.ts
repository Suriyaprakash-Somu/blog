import type { FastifyInstance } from "fastify";

import { db } from "../../db/index.js";
import { sql } from "drizzle-orm";
import { env } from "../../common/env.js";

export async function healthRoutes(app: FastifyInstance) {
  function buildBase() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      env: env.NODE_ENV,
      outboxEnabled: env.OUTBOX_ENABLED,
      memory: {
        rss: process.memoryUsage().rss,
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
      },
    };
  }

  app.get("/health/live", async () => {
    return {
      status: "ok",
      ...buildBase(),
    };
  });

  app.get("/health/ready", async (_request, reply) => {
    let database: "ok" | "down" = "ok";
    try {
      await db.execute(sql`select 1`);
    } catch {
      database = "down";
    }

    const status = database === "ok" ? "ok" : "degraded";
    if (database !== "ok") {
      reply.status(503);
    }

    return {
      status,
      database,
      ...buildBase(),
    };
  });

  // Backwards-compatible convenience endpoint.
  // Keep 200 OK to avoid breaking existing clients; use /health/ready for readiness probes.
  app.get("/health", async () => {
    let database: "ok" | "down" = "ok";
    try {
      await db.execute(sql`select 1`);
    } catch {
      database = "down";
    }

    return {
      status: database === "ok" ? "ok" : "degraded",
      database,
      ...buildBase(),
    };
  });
}
