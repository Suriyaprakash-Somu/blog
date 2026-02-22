import type { FastifyInstance } from "fastify";
import { platformAuthRoutes } from "../modules/auth/platform/index.js";
import { tenantAuthRoutes } from "../modules/auth/tenant/index.js";
import { ROUTE_PREFIXES } from "./manifest.js";
import { registerWithPrefix } from "./prefixGuard.js";

export async function registerAuthRoutes(app: FastifyInstance) {
  await registerWithPrefix(app, platformAuthRoutes, {
    prefix: ROUTE_PREFIXES.authPlatform,
    basePrefix: ROUTE_PREFIXES.auth,
    label: "auth.platform",
  });
  await registerWithPrefix(app, tenantAuthRoutes, {
    prefix: ROUTE_PREFIXES.authTenant,
    basePrefix: ROUTE_PREFIXES.auth,
    label: "auth.tenant",
  });
}
