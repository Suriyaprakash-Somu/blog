import "fastify";
import type { TenantSessionData } from "../middlewares/tenant.guard.js";
import type { PlatformSessionData } from "../middlewares/auth.guard.js";

declare module "fastify" {
  interface FastifyRequest {
    tenantSession?: TenantSessionData;
    platformUser?: PlatformSessionData;
    metricsStart?: bigint;
  }
}
