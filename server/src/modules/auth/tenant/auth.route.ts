
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "../../../db/index.js";
import {
  tenants,
} from "../../tenants/tenants.schema.js";
import {
  tenantUser,
  tenantUserAccount,
  tenantUserSession,
} from "../../users/tenant/tenant.schema.js";
import { tenantRoles, type TenantRole } from "../../roles/tenant/tenant.schema.js";
import crypto from "crypto";
import { env } from "../../../common/env.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import { z } from "zod";
import { validateBody, validateParams } from "../../../core/validate.js";
import {
  invalidateTenantSession,
  invalidateTenantSessionHash,
  requireTenantAuth,
} from "../../../middlewares/tenant.guard.js";
import { tenantTokenAuthRoutes } from "./token.route.js";
import { buildTenantAbility } from "../../rbac/tenant/abilities.js";
import { buildTenantNavigation } from "../../navigation/navigation.js";
import { logAudit } from "../../../audit/auditLogger.js";
import { passwordSchema } from "../../../core/password.js";
import {
  TENANT_SESSION_COOKIE,
  TENANT_IMPERSONATION_COOKIE,
  buildSessionExpiry,
  buildSessionCookieOptions,
  buildImpersonationCookieOptions,
  clearCsrfCookie,
  clearSessionCookie,
  hashSessionToken,
  setCsrfCookie,
  generateSessionToken,
} from "../../../core/security.js";

const idParamsSchema = z.object({ id: z.string().uuid() }).strict();

function wrapPreHandler(
  fn: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
) {
  return (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    fn(request, reply)
      .then(() => done())
      .catch((err) => done(err as Error));
  };
}

export const tenantAuthRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(tenantTokenAuthRoutes, { prefix: "/token" });

  const signupSchema = z
    .object({
      penName: z.string().min(1).max(255),
      ownerName: z.string().min(1).max(255),
      email: z.string().email(),
      password: passwordSchema(),
    })
    .strict();

  const loginSchema = z
    .object({
      email: z.string().email(),
      password: passwordSchema(),
    })
    .strict();
  fastify.post(
    "/signup",
    {
      config: { rateLimit: rateLimitConfig.auth },
      preHandler: wrapPreHandler(validateBody(signupSchema)),
    },
    async (request, reply) => {
      try {
        const { penName, ownerName, email, password } =
          request.body as z.infer<typeof signupSchema>;

        // 1. Check if email exists
        const existingUser = await db.query.tenantUser.findFirst({
          where: eq(tenantUser.email, email.toLowerCase()),
        });

        if (existingUser) {
          return reply.status(409).send({
            error: "Email taken",
            message: "This email is already registered.",
          });
        }

        // 2. Generate and Check Slug
        // Simple slugify: lowercase, alphanum only, dashes
        const baseSlug = penName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        // Append minimal random suffix for uniqueness
        const randomSuffix = crypto.randomBytes(3).toString("hex"); // 6 chars
        const slug = `${baseSlug}-${randomSuffix}`;
        const companyName = slug; // Auto-generate the company name based on the slug

        // Optionally double check collision (highly unlikely with 6 hex chars unless massive scale)
        const existingTenant = await db.query.tenants.findFirst({
          where: eq(tenants.slug, slug)
        });
        if (existingTenant) {
          return reply.status(409).send({
            error: "System Error",
            message: "Generated slug collision, please try again."
          });
        }

        // 3. Get Owner Role
        const ownerRole = await db.query.tenantRoles.findFirst({
          where: eq(tenantRoles.slug, "owner"),
        });

        if (!ownerRole) {
          return reply.status(500).send({ error: "System Error", message: "Owner role not found" });
        }

        // 4. Transaction: Create Tenant, User, Account
        await db.transaction(async (tx) => {
          const tenantId = uuidv7();
          const userId = uuidv7();

          // Create Tenant (Pending Status)
          await tx.insert(tenants).values({
            id: tenantId,
            name: companyName,
            slug: slug,
            status: "pending", // Wait for platform approval
          });

          // Create User
          await tx.insert(tenantUser).values({
            id: userId,
            name: ownerName,
            email: email.toLowerCase(),
            tenantId: tenantId,
            roleId: ownerRole.id,
            status: "active", // User is active, but tenant is pending
          });

          // Create Account
          const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
          await tx.insert(tenantUserAccount).values({
            userId,
            accountId: userId,
            providerId: "credential",
            password: hashedPassword,
          });
        });

        return reply.status(201).send({
          message: "Signup successful. Your account is pending approval.",
          slug: slug // Return generated slug for info
        });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        fastify.log.error(error);
        return reply.status(500).send({ error: "Server error", message });
      }
    }
  );

  fastify.post(
    "/login",
    {
      config: { rateLimit: rateLimitConfig.auth },
      preHandler: wrapPreHandler(validateBody(loginSchema)),
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as z.infer<typeof loginSchema>;

        // 1. Find User by Email (Email is unique per signup logic)
        const user = await db.query.tenantUser.findFirst({
          where: eq(tenantUser.email, email.toLowerCase()),
          with: {
            account: true, // Join account to get password
          },
        });

        if (!user) {
          return reply.status(401).send({
            error: "Invalid credentials",
            message: "Invalid email or password",
          });
        }

        // 2. Get Associated Tenant
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, user.tenantId),
        });

        if (!tenant) {
          return reply.status(404).send({
            error: "Tenant not found",
            message: "Associated organization not found."
          });
        }

        // 3. Check Tenant Status (CRITICAL REQUIREMENT)
        if (tenant.status !== "active") {
          return reply.status(403).send({
            error: "Access Denied",
            message: `Your organization account is currently ${tenant.status}. Please contact support.`,
          });
        }

        // 4. Verify Password
        // Drizzle 'with' returns joined data differently depending on relation definition.
        // Assuming 'account' is a relation in schema. If not, manual query needed.
        // Let's check relation if this fails, but `tenantUserAccount` references `tenantUser`.
        // We need to fetch account manually if relation isn't set up in `query` builder yet.
        // Let's play safe and fetch account manually to be sure.

        const account = await db.query.tenantUserAccount.findFirst({
          where: eq(tenantUserAccount.userId, user.id),
        });

        if (!account || !account.password) {
          return reply.status(401).send({
            error: "Invalid credentials",
            message: "Invalid email or password",
          });
        }

        const validPassword = await bcrypt.compare(password, account.password);
        if (!validPassword) {
          return reply.status(401).send({
            error: "Invalid credentials",
            message: "Invalid email or password",
          });
        }

        let role = null;
        let permissions: unknown[] = [];
        let navigation: unknown[] = [];

        if (user.roleId) {
          role = await db.query.tenantRoles.findFirst({
            where: eq(tenantRoles.id, user.roleId),
          });

          if (role) {
            const ability = buildTenantAbility(role.slug as TenantRole);
            permissions = ability.rules;
            navigation = buildTenantNavigation(ability);
          }
        }

        // 5. Create Session
        const token = generateSessionToken();
        const expiresAt = buildSessionExpiry(env.SESSION_TTL_DAYS);
        const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);

        await db.insert(tenantUserSession).values({
          token: tokenHash,
          userId: user.id,
          expiresAt,
          userAgent: request.headers["user-agent"],
          ipAddress: request.ip,
        });

        // Set Cookie
        reply.setCookie(
          TENANT_SESSION_COOKIE,
          token,
          buildSessionCookieOptions(env, expiresAt)
        );
        setCsrfCookie(reply, env, expiresAt);

        return reply.send({
          message: "Login successful",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            tenantId: user.tenantId,
            roleId: user.roleId
          },
          tenant,
          role: role ? { id: role.id, name: role.name, slug: role.slug } : null,
          permissions,
          navigation,
        });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        fastify.log.error(error);
        return reply.status(500).send({ error: "Server error", message });
      }
    }
  );

  fastify.get(
    "/me",
    { config: { rateLimit: rateLimitConfig.tenant } },
    async (request, reply) => {
      try {
        const token = request.cookies[TENANT_SESSION_COOKIE];

        if (!token) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        // Verify Session
        const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
        const session = await db.query.tenantUserSession.findFirst({
          where: eq(tenantUserSession.token, tokenHash),
        });

        if (!session || session.expiresAt < new Date()) {
          return reply.status(401).send({ error: "Session invalid or expired" });
        }

        // Get User with Tenant Info
        const user = await db.query.tenantUser.findFirst({
          where: eq(tenantUser.id, session.userId),
        });

        if (!user) {
          return reply.status(401).send({ error: "User not found" });
        }

        // Get Tenant details
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, user.tenantId)
        });

        // Get Role details
        let role = null;
        let permissions: unknown[] = [];
        let navigation: unknown[] = [];

        if (user.roleId) {
          role = await db.query.tenantRoles.findFirst({
            where: eq(tenantRoles.id, user.roleId)
          });

          if (role) {
            const ability = buildTenantAbility(role.slug as TenantRole);
            permissions = ability.rules;
            navigation = buildTenantNavigation(ability);
          }
        }

        setCsrfCookie(reply, env, session.expiresAt);
        return reply.send({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            tenantId: user.tenantId,
            roleId: user.roleId
          },
          tenant: tenant,
          role: role ? { id: role.id, name: role.name, slug: role.slug } : null,
          impersonator: session.impersonatorAdminId
            ? { adminId: session.impersonatorAdminId }
            : null,
          permissions,
          navigation,
        });

      } catch (error) {
        fastify.log.error(error);
        return reply.status(401).send({ error: "Unauthorized" });
      }
    }
  );

  fastify.post(
    "/logout",
    { config: { rateLimit: rateLimitConfig.tenant } },
    async (request, reply) => {
      try {
        const token = request.cookies[TENANT_SESSION_COOKIE];
        if (token) {
          const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
          const session = await db.query.tenantUserSession.findFirst({
            where: eq(tenantUserSession.token, tokenHash),
          });

          if (session?.impersonatorAdminId) {
            const user = await db.query.tenantUser.findFirst({
              where: eq(tenantUser.id, session.userId),
            });

            if (user) {
              await logAudit({
                db,
                ctx: {
                  tenantSession: {
                    user: {
                      id: user.id,
                      tenantId: user.tenantId,
                    },
                    tenant: {
                      id: user.tenantId,
                    },
                    impersonator: {
                      adminId: session.impersonatorAdminId,
                    },
                  },
                },
                action: "impersonation.logout",
                resourceType: "tenant_user_session",
                resourceId: session.id,
                tenantId: user.tenantId,
                metadata: {
                  impersonatedUserId: user.id,
                  impersonatorAdminId: session.impersonatorAdminId,
                  tenantId: user.tenantId,
                },
              });
            }
          }

          await db.delete(tenantUserSession).where(eq(tenantUserSession.token, tokenHash));
          invalidateTenantSession(token);
        }

        clearSessionCookie(reply, env, TENANT_SESSION_COOKIE);
        clearCsrfCookie(reply, env);
        reply.clearCookie(
          TENANT_IMPERSONATION_COOKIE,
          buildImpersonationCookieOptions(env, new Date(0))
        );
        return reply.send({ message: "Logged out" });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Logout failed" });
      }
    }
  );

  fastify.get(
    "/sessions",
    { preHandler: wrapPreHandler(requireTenantAuth()), config: { rateLimit: rateLimitConfig.tenant } },
    async (request, reply) => {
      const tenantSession = request.tenantSession!;
      const current = tenantSession.session;
      const userId = tenantSession.user.id;

      const rows = await db
        .select({
          id: tenantUserSession.id,
          userId: tenantUserSession.userId,
          expiresAt: tenantUserSession.expiresAt,
          ipAddress: tenantUserSession.ipAddress,
          userAgent: tenantUserSession.userAgent,
          impersonatorAdminId: tenantUserSession.impersonatorAdminId,
          createdAt: tenantUserSession.createdAt,
        })
        .from(tenantUserSession)
        .where(eq(tenantUserSession.userId, userId));

      return reply.send({ rows, rowCount: rows.length, currentSessionId: current.id });
    },
  );

  fastify.post(
    "/sessions/:id/revoke",
    {
      preHandler: [
        wrapPreHandler(requireTenantAuth()),
        wrapPreHandler((request) => validateParams(idParamsSchema)(request)),
      ],
      config: { rateLimit: rateLimitConfig.tenant },
    },
    async (request, reply) => {
      const tenantSession = request.tenantSession!;
      const current = tenantSession.session;
      const userId = tenantSession.user.id;
      const tenantId = tenantSession.user.tenantId;
      const { id } = request.params as { id: string };

      const [target] = await db
        .select({ id: tenantUserSession.id, token: tenantUserSession.token })
        .from(tenantUserSession)
        .where(and(eq(tenantUserSession.id, id), eq(tenantUserSession.userId, userId)))
        .limit(1);

      if (!target) return reply.status(404).send({ error: "Session not found" });

      await db.delete(tenantUserSession).where(eq(tenantUserSession.id, target.id));
      invalidateTenantSessionHash(target.token);

      await logAudit({
        db,
        ctx: request,
        action: "tenant_session.revoked",
        resourceType: "tenant_user_session",
        resourceId: target.id,
        tenantId,
        metadata: {
          revokedByUserId: userId,
          revokedSessionId: target.id,
          self: target.id === current.id,
        },
      });

      if (target.id === current.id) {
        const token = request.cookies[TENANT_SESSION_COOKIE];
        if (token) invalidateTenantSession(token);
        clearSessionCookie(reply, env, TENANT_SESSION_COOKIE);
        clearCsrfCookie(reply, env);
        reply.clearCookie(
          TENANT_IMPERSONATION_COOKIE,
          buildImpersonationCookieOptions(env, new Date(0))
        );
      }

      return reply.send({ ok: true });
    },
  );

  fastify.post(
    "/sessions/revoke-others",
    { preHandler: wrapPreHandler(requireTenantAuth()), config: { rateLimit: rateLimitConfig.tenant } },
    async (request, reply) => {
      const tenantSession = request.tenantSession!;
      const current = tenantSession.session;
      const userId = tenantSession.user.id;
      const tenantId = tenantSession.user.tenantId;

      const otherSessions = await db
        .select({ id: tenantUserSession.id, token: tenantUserSession.token })
        .from(tenantUserSession)
        .where(and(eq(tenantUserSession.userId, userId), ne(tenantUserSession.id, current.id)));

      if (otherSessions.length > 0) {
        await db
          .delete(tenantUserSession)
          .where(and(eq(tenantUserSession.userId, userId), ne(tenantUserSession.id, current.id)));
        for (const s of otherSessions) invalidateTenantSessionHash(s.token);
      }

      await logAudit({
        db,
        ctx: request,
        action: "tenant_session.revoked_others",
        resourceType: "tenant_user",
        resourceId: userId,
        tenantId,
        metadata: {
          revokedByUserId: userId,
          revokedCount: otherSessions.length,
          currentSessionId: current.id,
        },
      });

      return reply.send({ ok: true, revokedCount: otherSessions.length });
    },
  );
};
