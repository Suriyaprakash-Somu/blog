import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { healthRoutes } from "../modules/health/index.js";

export async function registerCoreRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  app.get("/ready", async (_request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return reply.send({ status: "ready" });
    } catch {
      return reply.status(503).send({ status: "not_ready" });
    }
  });

  app.get("/", async () => ({
    message: "Blog Manager API",
    version: "1.0.0",
  }));
}
