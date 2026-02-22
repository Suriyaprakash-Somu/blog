import "dotenv/config";
import type { FastifyInstance } from "fastify";
import { createApp } from "./app.js";
import { env } from "./common/env.js";
import { logger } from "./core/logger.js";
import { closeDatabase } from "./db/index.js";

import { seedPlatformRoles } from "./modules/roles/platform/platform.seed.js";
import { seedTenantRoles } from "./modules/roles/tenant/tenant.seed.js";
import { seedPlatformOwner } from "./modules/users/platform/platform.seed.js";

const SHUTDOWN_TIMEOUT_MS = 30_000;

let appRef: FastifyInstance | null = null;
let shutdownRef: ((signal: string) => Promise<void>) | null = null;

function registerFatalProcessHandlers() {
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "[Process] Unhandled promise rejection");
    if (shutdownRef) {
      void shutdownRef("unhandledRejection");
      return;
    }
    process.exit(1);
  });

  process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "[Process] Uncaught exception");
    if (shutdownRef) {
      void shutdownRef("uncaughtException");
      return;
    }
    process.exit(1);
  });
}

async function main() {
  try {
    logger.info("[Server] Starting...");

    // Seed roles
    await seedPlatformRoles();
    await seedTenantRoles();
    await seedPlatformOwner();

    const app = await createApp();
    appRef = app;

    let activeRequests = 0;
    app.addHook("onRequest", async () => {
      activeRequests += 1;
    });
    app.addHook("onResponse", async () => {
      activeRequests = Math.max(0, activeRequests - 1);
    });

    const address = await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    logger.info(`🚀 Server running on ${address}`);
    logger.info(`📋 Health check: ${address}/health`);

    // Graceful shutdown
    let shuttingDown = false;
    const shutdown = async (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;

      logger.info({ signal, activeRequests }, "[Server] Shutdown requested");

      const timeout = new Promise<never>((_resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Shutdown timeout exceeded"));
        }, SHUTDOWN_TIMEOUT_MS);
        timer.unref();
      });

      try {
        await Promise.race([app.close(), timeout]);
        await closeDatabase();
        logger.info("[Server] Shutdown complete");
        process.exit(0);
      } catch (error) {
        logger.error(
          { err: error, activeRequests },
          "[Server] Forced shutdown (timeout or error)"
        );
        process.exit(1);
      }
    };

    shutdownRef = shutdown;

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
  } catch (error) {
    logger.error({ err: error }, "[Server] Failed to start");
    process.exit(1);
  }
}

registerFatalProcessHandlers();
void main();
