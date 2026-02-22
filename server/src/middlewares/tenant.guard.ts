import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { LRUCache } from "lru-cache";
import { env } from "../common/env.js";
import {
  buildImpersonationCookieOptions,
  clearCsrfCookie,
  clearSessionCookie,
  hashSessionToken,
  TENANT_IMPERSONATION_COOKIE,
  TENANT_SESSION_COOKIE,
} from "../core/security.js";
import { db } from "../db/index.js";
import { tenantRoles } from "../modules/roles/tenant/tenant.schema.js";
import { tenants } from "../modules/tenants/tenants.schema.js";
import {
  tenantUser,
  tenantUserSession,
} from "../modules/users/tenant/tenant.schema.js";

export interface TenantSessionData {
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    roleId: string | null;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  role: {
    id: string;
    name: string;
    slug: string;
  } | null;
  impersonator: {
    adminId: string;
  } | null;
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
}

type TenantAccessTokenClaims = {
  sub: string;
  tenantId: string;
  roleId?: string | null;
  typ?: string;
  scope?: string;
  jti?: string;
  exp?: number;
};

function getBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

const tenantSessionCache = new LRUCache<string, TenantSessionData>({
  max: 1000,
  ttl: env.SESSION_CACHE_TTL_MS,
});

/**
 * Get tenant user from session cookie
 */
export async function getTenantFromSession(
  request: FastifyRequest
): Promise<TenantSessionData | null> {
  const token = request.cookies?.[TENANT_SESSION_COOKIE];
  if (!token) return null;

  const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
  const cached = tenantSessionCache.get(tokenHash);
  if (cached) return cached;

  // Find valid session
  const session = await db.query.tenantUserSession.findFirst({
    where: and(
      eq(tenantUserSession.token, tokenHash),
      gt(tenantUserSession.expiresAt, new Date())
    ),
  });

  if (!session) return null;

  // Find associated user
  const user = await db.query.tenantUser.findFirst({
    where: eq(tenantUser.id, session.userId),
  });

  if (!user) return null;

  // Find tenant
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, user.tenantId),
  });

  if (!tenant) return null;

  // Check tenant status
  if (tenant.status !== "active") return null;

  // Find role if assigned
  let role = null;
  if (user.roleId) {
    role = await db.query.tenantRoles.findFirst({
      where: and(
        eq(tenantRoles.id, user.roleId),
        or(isNull(tenantRoles.tenantId), eq(tenantRoles.tenantId, user.tenantId)),
      ),
    });
  }

  const data: TenantSessionData = {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    },
    role: role
      ? {
          id: role.id,
          name: role.name,
          slug: role.slug,
        }
      : null,
    impersonator: session.impersonatorAdminId
      ? {
          adminId: session.impersonatorAdminId,
        }
      : null,
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      token,
    },
  };
  tenantSessionCache.set(tokenHash, data);
  return data;
}

export function invalidateTenantSession(token: string) {
  const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
  tenantSessionCache.delete(tokenHash);
}

export function invalidateTenantSessionHash(tokenHash: string) {
  tenantSessionCache.delete(tokenHash);
}

async function getTenantFromAccessToken(request: FastifyRequest): Promise<TenantSessionData | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  let decoded: TenantAccessTokenClaims;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "blog",
      audience: "tenant",
      algorithms: ["HS256"],
    }) as TenantAccessTokenClaims;
  } catch {
    return null;
  }

  if (!decoded?.sub || !decoded.tenantId) return null;
  if (decoded.typ !== "access") return null;
  if (decoded.scope !== "tenant") return null;

  const session = {
    id: decoded.jti ?? "bearer",
    expiresAt: decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 60 * 1000),
    token: "bearer",
  };

  const user = await db.query.tenantUser.findFirst({ where: eq(tenantUser.id, decoded.sub) });
  if (!user) return null;
  if (user.status !== "active") return null;
  if (user.tenantId !== decoded.tenantId) return null;

  const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, user.tenantId) });
  if (!tenant) return null;
  if (tenant.status !== "active") return null;

  let role = null;
  if (user.roleId) {
    role = await db.query.tenantRoles.findFirst({
      where: and(
        eq(tenantRoles.id, user.roleId),
        or(isNull(tenantRoles.tenantId), eq(tenantRoles.tenantId, user.tenantId)),
      ),
    });
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    },
    role: role
      ? {
          id: role.id,
          name: role.name,
          slug: role.slug,
        }
      : null,
    impersonator: null,
    session,
  };
}

export async function getTenantFromAuth(request: FastifyRequest): Promise<TenantSessionData | null> {
  const cookieSession = await getTenantFromSession(request);
  if (cookieSession) return cookieSession;
  return getTenantFromAccessToken(request);
}

/**
 * Middleware to require a valid tenant session
 * Attaches tenantSession to request object
 */
export function requireTenantAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionData = await getTenantFromAuth(request);

    if (!sessionData) {
      clearSessionCookie(reply, env, TENANT_SESSION_COOKIE);
      clearCsrfCookie(reply, env);
      reply.clearCookie(
        TENANT_IMPERSONATION_COOKIE,
        buildImpersonationCookieOptions(env, new Date(0))
      );
      return reply
        .status(401)
        .send({ error: "Unauthorized", message: "Invalid or expired session" });
    }

    // Check tenant is active
    if (sessionData.tenant.status !== "active") {
      clearSessionCookie(reply, env, TENANT_SESSION_COOKIE);
      clearCsrfCookie(reply, env);
      reply.clearCookie(
        TENANT_IMPERSONATION_COOKIE,
        buildImpersonationCookieOptions(env, new Date(0))
      );
      return reply.status(403).send({
        error: "Tenant inactive",
        message: "Your organization is not active yet",
      });
    }

    // Attach to request
    request.tenantSession = sessionData;
  };
}
