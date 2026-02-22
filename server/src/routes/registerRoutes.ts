import type { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "./auth.js";
import { registerCoreRoutes } from "./core.js";
import { registerPlatformRoutes } from "./platform.js";
import { registerPublicRoutes } from "./public.js";
import { registerTenantRoutes } from "./tenant.js";
import { registerUploadsRoutes } from "./uploads.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerCoreRoutes(app);
  await registerAuthRoutes(app);
  await registerPlatformRoutes(app);
  await registerTenantRoutes(app);
  await registerPublicRoutes(app);
  await registerUploadsRoutes(app);
}
