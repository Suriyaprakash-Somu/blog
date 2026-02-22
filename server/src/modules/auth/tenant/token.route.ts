import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { logAudit } from "../../../audit/auditLogger.js";
import { env } from "../../../common/env.js";
import { passwordSchema } from "../../../core/password.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { hashSessionToken } from "../../../core/security.js";
import { validateBody } from "../../../core/validate.js";
import { db } from "../../../db/index.js";
import { buildTenantAbility } from "../../rbac/tenant/abilities.js";
import { type TenantRole, tenantRoles } from "../../roles/tenant/tenant.schema.js";
import { tenants } from "../../tenants/tenants.schema.js";
import {
  tenantUser,
  tenantUserAccount,
} from "../../users/tenant/tenant.schema.js";
import { tenantRefreshTokens } from "./refreshTokens.schema.js";

const JWT_ISSUER = "blog";
const JWT_AUDIENCE = "tenant";

function wrapPreHandler(
  fn: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
) {
  return (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    fn(request, reply)
      .then(() => done())
      .catch((err) => done(err as Error));
  };
}

function headerToString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function generateRefreshToken(): string {
  // hex keeps it URL-safe and simple to store/transport
  return crypto.randomBytes(32).toString("hex");
}

function buildRefreshExpiry(): Date {
  return new Date(Date.now() + env.MOBILE_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function signTenantAccessToken(params: {
  userId: string;
  tenantId: string;
  roleId: string | null;
}) {
  const jti = uuidv7();
  const expiresInSec = env.MOBILE_ACCESS_TOKEN_TTL_MIN * 60;

  const token = jwt.sign(
    {
      sub: params.userId,
      tenantId: params.tenantId,
      roleId: params.roleId,
      typ: "access",
      scope: "tenant",
      jti,
    },
    env.JWT_SECRET,
    {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
      expiresIn: expiresInSec,
    },
  );

  return { token, expiresInSec, jti };
}

async function resolveTenantRole(user: { roleId: string | null }): Promise<TenantRole | null> {
  if (!user.roleId) return null;
  const role = await db.query.tenantRoles.findFirst({ where: eq(tenantRoles.id, user.roleId) });
  return (role?.slug as TenantRole) ?? null;
}

export const tenantTokenAuthRoutes: FastifyPluginAsync = async (fastify) => {
  const loginSchema = z
    .object({
      email: z.string().email(),
      password: passwordSchema(),
      deviceId: z.string().min(1).max(128).optional(),
      deviceInfo: z.string().min(1).max(2000).optional(),
    })
    .strict();

  const refreshSchema = z
    .object({
      refreshToken: z.string().min(16),
      deviceId: z.string().min(1).max(128).optional(),
      deviceInfo: z.string().min(1).max(2000).optional(),
    })
    .strict();

  const revokeSchema = z
    .object({
      refreshToken: z.string().min(16),
    })
    .strict();

  fastify.post(
    "/login",
    {
      config: { rateLimit: rateLimitConfig.auth },
      preHandler: wrapPreHandler(validateBody(loginSchema)),
    },
    async (request, reply) => {
      const { email, password, deviceId, deviceInfo } =
        request.body as z.infer<typeof loginSchema>;
      const emailLower = email.toLowerCase();

      const user = await db.query.tenantUser.findFirst({ where: eq(tenantUser.email, emailLower) });
      if (!user) {
        return reply.status(401).send({ error: "Invalid credentials", message: "Invalid email or password" });
      }

      if (user.status !== "active") {
        return reply.status(403).send({ error: "Access Denied", message: "User is inactive" });
      }

      const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, user.tenantId) });
      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found", message: "Associated organization not found." });
      }
      if (tenant.status !== "active") {
        return reply.status(403).send({
          error: "Access Denied",
          message: `Your organization account is currently ${tenant.status}. Please contact support.`,
        });
      }

      const account = await db.query.tenantUserAccount.findFirst({ where: eq(tenantUserAccount.userId, user.id) });
      if (!account?.password) {
        return reply.status(401).send({ error: "Invalid credentials", message: "Invalid email or password" });
      }
      const validPassword = await bcrypt.compare(password, account.password);
      if (!validPassword) {
        return reply.status(401).send({ error: "Invalid credentials", message: "Invalid email or password" });
      }

      const access = signTenantAccessToken({ userId: user.id, tenantId: user.tenantId, roleId: user.roleId });
      const refreshToken = generateRefreshToken();
      const refreshTokenHash = hashSessionToken(refreshToken, env.SESSION_TOKEN_PEPPER);
      const refreshExpiresAt = buildRefreshExpiry();

      await db.insert(tenantRefreshTokens).values({
        id: uuidv7(),
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpiresAt,
        deviceId: deviceId ?? null,
        deviceInfo: deviceInfo ?? null,
        ipAddress: request.ip,
        userAgent: headerToString(request.headers["user-agent"]) ?? null,
      });

      await logAudit({
        db,
        ctx: request,
        action: "tenant_token.login",
        resourceType: "tenant_user",
        resourceId: user.id,
        tenantId: user.tenantId,
        metadata: {
          deviceId: deviceId ?? null,
          tokenId: access.jti,
        },
      });

      const roleSlug = await resolveTenantRole(user);
      const ability = roleSlug ? buildTenantAbility(roleSlug) : null;

      return reply.send({
        accessToken: access.token,
        accessTokenExpiresIn: access.expiresInSec,
        refreshToken,
        refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
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
        permissions: ability ? ability.rules : [],
      });
    },
  );

  fastify.post(
    "/refresh",
    {
      config: { rateLimit: rateLimitConfig.auth },
      preHandler: wrapPreHandler(validateBody(refreshSchema)),
    },
    async (request, reply) => {
      const { refreshToken, deviceId, deviceInfo } =
        request.body as z.infer<typeof refreshSchema>;

      const tokenHash = hashSessionToken(refreshToken, env.SESSION_TOKEN_PEPPER);
      const [existing] = await db
        .select()
        .from(tenantRefreshTokens)
        .where(
          and(
            eq(tenantRefreshTokens.tokenHash, tokenHash),
            isNull(tenantRefreshTokens.revokedAt),
            gt(tenantRefreshTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!existing) {
        return reply.status(401).send({ error: "Invalid token", message: "Refresh token is invalid or expired" });
      }

      const user = await db.query.tenantUser.findFirst({ where: eq(tenantUser.id, existing.userId) });
      if (!user || user.tenantId !== existing.tenantId) {
        return reply.status(401).send({ error: "Invalid token", message: "Refresh token is invalid" });
      }

      if (user.status !== "active") {
        return reply.status(403).send({ error: "Access Denied", message: "User is inactive" });
      }

      const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, user.tenantId) });
      if (!tenant || tenant.status !== "active") {
        return reply.status(403).send({ error: "Access Denied", message: "Tenant inactive" });
      }

      const nextRefreshToken = generateRefreshToken();
      const nextHash = hashSessionToken(nextRefreshToken, env.SESSION_TOKEN_PEPPER);
      const nextExpiresAt = buildRefreshExpiry();
      const nextId = uuidv7();

      await db.transaction(async (tx) => {
        await tx
          .update(tenantRefreshTokens)
          .set({
            revokedAt: new Date(),
            lastUsedAt: new Date(),
            replacedByTokenId: nextId,
          })
          .where(eq(tenantRefreshTokens.id, existing.id));

        await tx.insert(tenantRefreshTokens).values({
          id: nextId,
          tenantId: existing.tenantId,
          userId: existing.userId,
          tokenHash: nextHash,
          expiresAt: nextExpiresAt,
          deviceId: deviceId ?? existing.deviceId,
          deviceInfo: deviceInfo ?? existing.deviceInfo,
          ipAddress: request.ip,
          userAgent: headerToString(request.headers["user-agent"]) ?? null,
        });
      });

      const access = signTenantAccessToken({ userId: user.id, tenantId: user.tenantId, roleId: user.roleId });

      await logAudit({
        db,
        ctx: request,
        action: "tenant_token.refreshed",
        resourceType: "tenant_user",
        resourceId: user.id,
        tenantId: user.tenantId,
        metadata: {
          refreshTokenId: existing.id,
          nextRefreshTokenId: nextId,
          accessTokenId: access.jti,
        },
      });

      return reply.send({
        accessToken: access.token,
        accessTokenExpiresIn: access.expiresInSec,
        refreshToken: nextRefreshToken,
        refreshTokenExpiresAt: nextExpiresAt.toISOString(),
      });
    },
  );

  fastify.post(
    "/revoke",
    {
      config: { rateLimit: rateLimitConfig.auth },
      preHandler: wrapPreHandler(validateBody(revokeSchema)),
    },
    async (request, reply) => {
      const { refreshToken } = request.body as z.infer<typeof revokeSchema>;
      const tokenHash = hashSessionToken(refreshToken, env.SESSION_TOKEN_PEPPER);

      const [existing] = await db
        .select()
        .from(tenantRefreshTokens)
        .where(and(eq(tenantRefreshTokens.tokenHash, tokenHash), isNull(tenantRefreshTokens.revokedAt)))
        .limit(1);

      if (!existing) {
        // Avoid leaking whether the token existed
        return reply.send({ ok: true });
      }

      await db
        .update(tenantRefreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(tenantRefreshTokens.id, existing.id));

      await logAudit({
        db,
        ctx: request,
        action: "tenant_token.revoked",
        resourceType: "tenant_refresh_token",
        resourceId: existing.id,
        tenantId: existing.tenantId,
      });

      return reply.send({ ok: true });
    },
  );
};
