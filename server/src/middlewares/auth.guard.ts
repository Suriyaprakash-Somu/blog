import type { FastifyReply, FastifyRequest } from "fastify";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  platformUser,
  platformUserSession,
} from "../modules/users/platform/platform.schema.js";
import { platformRoles } from "../modules/roles/platform/platform.schema.js";
import { LRUCache } from "lru-cache";
import { env } from "../common/env.js";
import {
  clearCsrfCookie,
  clearSessionCookie,
  hashSessionToken,
  PLATFORM_SESSION_COOKIE,
} from "../core/security.js";

export interface PlatformSessionData {
  user: {
    id: string;
    name: string;
    email: string;
    roleId: string | null;
  };
  role: {
    id: string;
    name: string;
    slug: string;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

const platformSessionCache = new LRUCache<string, PlatformSessionData>({
  max: 1000,
  ttl: env.SESSION_CACHE_TTL_MS,
});

export async function getPlatformUserFromSession(
  request: FastifyRequest
): Promise<PlatformSessionData | null> {
  const token = request.cookies?.[PLATFORM_SESSION_COOKIE];
  if (!token) return null;

  const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
  const cached = platformSessionCache.get(tokenHash);
  if (cached) return cached;

  // In reference project: tokenHash. Here we used raw token in `auth.route.ts`.
  // Matching implementation to current `auth.route.ts` storage.
  
  const session = await db.query.platformUserSession.findFirst({
    where: and(
        eq(platformUserSession.token, tokenHash),
        gt(platformUserSession.expiresAt, new Date())
    ),
  });

  if (!session) return null;

  const user = await db.query.platformUser.findFirst({
    where: eq(platformUser.id, session.userId),
  });

  if (!user) return null;

  // Helper to fetch role manually since relations might be tricky or not loaded
  const role = await db.query.platformRoles.findFirst({
      where: eq(platformRoles.id, user.roleId!)
  });

  if (!role) return null;

  const data: PlatformSessionData = {
    user,
    role,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      token,
    },
  };
  platformSessionCache.set(tokenHash, data);
  return data;
}

export function invalidatePlatformSession(token: string) {
  const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
  platformSessionCache.delete(tokenHash);
}

export function invalidatePlatformSessionHash(tokenHash: string) {
  platformSessionCache.delete(tokenHash);
}

export function requirePlatformAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionData = await getPlatformUserFromSession(request);
    
    if (!sessionData) {
      clearSessionCookie(reply, env, PLATFORM_SESSION_COOKIE);
      clearCsrfCookie(reply, env);
      return reply.status(401).send({ error: "Unauthorized", message: "Invalid or expired session" });
    }

    request.platformUser = sessionData;
  };
}
