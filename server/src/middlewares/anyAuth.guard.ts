import type { FastifyReply, FastifyRequest } from "fastify";
import { getTenantFromAuth } from "./tenant.guard.js";
import { getPlatformUserFromSession } from "./auth.guard.js";

export function requireAnyAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantSession = await getTenantFromAuth(request);
    if (tenantSession) {
      request.tenantSession = tenantSession;
      return;
    }

    const platformSession = await getPlatformUserFromSession(request);
    if (platformSession) {
      request.platformUser = platformSession;
      return;
    }

    return reply.status(401).send({ error: "Unauthorized" });
  };
}
