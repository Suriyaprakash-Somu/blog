import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { logAudit } from "../../../audit/auditLogger.js";
import { env } from "../../../common/env.js";
import { passwordSchema } from "../../../core/password.js";
import { rateLimitConfig } from "../../../core/rateLimit.js";
import {
  buildImpersonationCookieOptions,
  buildSessionCookieOptions,
  buildSessionExpiry,
  clearCsrfCookie,
  clearSessionCookie,
  generateSessionToken,
  hashSessionToken,
  PLATFORM_SESSION_COOKIE,
  setCsrfCookie,
  TENANT_IMPERSONATION_COOKIE,
  TENANT_SESSION_COOKIE,
} from "../../../core/security.js";
import { validateBody, validateParams } from "../../../core/validate.js";
import { db } from "../../../db/index.js";
import { platformAbilityGuard } from "../../../middlewares/ability.guard.js";
import {
  invalidatePlatformSession,
  invalidatePlatformSessionHash,
  requirePlatformAuth,
} from "../../../middlewares/auth.guard.js";
import { buildPlatformNavigation } from "../../navigation/navigation.js";
import { buildPlatformAbility } from "../../rbac/platform/abilities.js";
import { ACTIONS, SUBJECTS } from "../../rbac/public/permissions.js";
import type { PlatformRole } from "../../roles/platform/platform.schema.js";
import { platformRoles } from "../../roles/platform/platform.schema.js";
import { tenants } from "../../tenants/tenants.schema.js";
import {
  platformUser,
  platformUserAccount,
  platformUserSession,
} from "../../users/platform/platform.schema.js";
import { tenantUser, tenantUserSession } from "../../users/tenant/tenant.schema.js";

function wrapPreHandler(
  fn: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
) {
  return (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    fn(request, reply)
      .then(() => done())
      .catch((err) => done(err as Error));
  };
}


export const platformAuthRoutes: FastifyPluginAsync = async (fastify) => {
  const loginSchema = z
    .object({
      email: z.string().email(),
      password: passwordSchema(),
    })
    .strict();

  const signupSchema = z
    .object({
      name: z.string().min(1).max(255),
      email: z.string().email(),
      password: passwordSchema(),
    })
    .strict();

  const impersonationSchema = z
    .object({
      userId: z.string().uuid(),
      tenantId: z.string().uuid(),
    })
    .strict();

  const idParamsSchema = z.object({ id: z.string().uuid() }).strict();
  fastify.post(
    "/login",
    {
      config: { rateLimit: rateLimitConfig.auth },
      preHandler: wrapPreHandler(validateBody(loginSchema)),
    },
    async (request, reply) => {
      try {
        const { email, password } = request.body as z.infer<typeof loginSchema>;

      // 1. Find User by Email
      const user = await db.query.platformUser.findFirst({
        where: eq(platformUser.email, email.toLowerCase()),

      });

      if (!user) {
        return reply.status(401).send({
          error: "Invalid credentials",
          message: "Invalid email or password",
        });
      }

      // 2. Find Account (Credential)
      const account = await db.query.platformUserAccount.findFirst({
        where: eq(platformUserAccount.userId, user.id),
      });

       if (!account || !account.password) {
         return reply.status(401).send({
           error: "Invalid credentials",
           message: "Invalid email or password",
         });
       }

      // 3. Verify Password
      const isValid = await bcrypt.compare(password, account.password);
      if (!isValid) {
        return reply.status(401).send({
          error: "Invalid credentials",
          message: "Invalid email or password",
        });
      }

      // 4. Fetch Role Details
      // If relations aren't set up perfectly, fetch manually
      const role = await db.query.platformRoles.findFirst({
         where: eq(platformRoles.id, user.roleId!) // roleId is nullable in schema but guaranteed for admin?
      });

      if (!role) {
           return reply.status(403).send({ error: "Access Denied", message: "User has no role assigned" });
      }

      const ability = buildPlatformAbility(role.slug as PlatformRole);
      const permissions = ability.rules;
      const navigation = buildPlatformNavigation(ability);

      // 5. Create Session
       const sessionId = uuidv7();
       const token = generateSessionToken();
       const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
       const expiresAt = buildSessionExpiry(env.SESSION_TTL_DAYS);

       await db.insert(platformUserSession).values({
         id: sessionId,
         userId: user.id,
         token: tokenHash,
         expiresAt,
         ipAddress: request.ip,
         userAgent: request.headers["user-agent"],
       });

       // 6. Set Cookie
       reply.setCookie(
         PLATFORM_SESSION_COOKIE,
         token,
         buildSessionCookieOptions(env, expiresAt)
       );
       setCsrfCookie(reply, env, expiresAt);

      // 7. Generate JWT (Optional, for client state)
       const jwtToken = jwt.sign(
         {
           userId: user.id,
           email: user.email,
           role: role.slug,
           typ: "access",
           scope: "platform",
         },
          env.JWT_SECRET,
          {
            expiresIn: `${env.PLATFORM_JWT_TTL_DAYS}d`,
            issuer: "blog",
            audience: "platform",
            algorithm: "HS256",
          }
        );

      return reply.send({
        message: "Login successful",
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        role: {
          slug: role.slug,
          name: role.name,
        },
        permissions,
        navigation,
        session: {
          id: sessionId,
          expiresAt,
        },
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
    { preHandler: wrapPreHandler(requirePlatformAuth()), config: { rateLimit: rateLimitConfig.platform } },
    async (request, reply) => {
    try {
      const { user, role, session } = request.platformUser!;
      const ability = buildPlatformAbility(role.slug as PlatformRole);
      const permissions = ability.rules;
      const navigation = buildPlatformNavigation(ability);
      setCsrfCookie(reply, env, session.expiresAt);
      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        role: {
          slug: role.slug,
          name: role.name,
        },
        permissions,
        navigation,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      fastify.log.error(error);
      return reply.status(500).send({ error: "Server error", message });
    }
    }
  );

  fastify.post(
    "/impersonation/login",
    {
      preHandler: [
        wrapPreHandler(requirePlatformAuth()),
        wrapPreHandler(platformAbilityGuard(ACTIONS.UPDATE, SUBJECTS.TENANT)),
        wrapPreHandler(validateBody(impersonationSchema)),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async (request, reply) => {
      try {
        const { userId, tenantId } = request.body as z.infer<typeof impersonationSchema>;
        const adminId = request.platformUser!.user.id;

        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, tenantId),
        });

        if (!tenant) {
          return reply.status(404).send({ error: "Tenant not found" });
        }

        if (tenant.status !== "active") {
          return reply.status(400).send({
            error: "Invalid tenant status",
            message: "Tenant must be active to impersonate",
          });
        }

        const user = await db.query.tenantUser.findFirst({
          where: and(
            eq(tenantUser.id, userId),
            eq(tenantUser.tenantId, tenantId),
            eq(tenantUser.status, "active"),
          ),
        });

        if (!user) {
          return reply.status(404).send({
            error: "Tenant user not found",
            message: "User is not an active member of this tenant",
          });
        }

        const token = generateSessionToken();
        const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
        const expiresAt = buildSessionExpiry(env.SESSION_TTL_DAYS);
        const sessionId = uuidv7();

        await db.insert(tenantUserSession).values({
          id: sessionId,
          token: tokenHash,
          userId: user.id,
          expiresAt,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"],
          impersonatorAdminId: adminId,
        });

        await logAudit({
          db,
          ctx: request,
          action: "impersonation.login",
          resourceType: "tenant_user_session",
          resourceId: sessionId,
          tenantId,
          metadata: {
            impersonatedUserId: user.id,
            impersonatorAdminId: adminId,
            tenantId,
          },
        });

        reply.setCookie(
          TENANT_SESSION_COOKIE,
          token,
          buildSessionCookieOptions(env, expiresAt)
        );
        reply.setCookie(
          TENANT_IMPERSONATION_COOKIE,
          "true",
          buildImpersonationCookieOptions(env, expiresAt)
        );
        setCsrfCookie(reply, env, expiresAt);

        return reply.send({
          message: "Impersonation successful",
          redirectUrl: "/tenant/dashboard",
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        fastify.log.error(error);
        return reply.status(500).send({ error: "Server error", message });
      }
    },
  );

  fastify.post(
    "/logout",
    { preHandler: wrapPreHandler(requirePlatformAuth()), config: { rateLimit: rateLimitConfig.platform } },
    async (request, reply) => {
      try {
        const { session } = request.platformUser!;
        
        await db.delete(platformUserSession).where(eq(platformUserSession.id, session.id));
        
        const token = request.cookies?.[PLATFORM_SESSION_COOKIE];
        if (token) invalidatePlatformSession(token);
        clearSessionCookie(reply, env, PLATFORM_SESSION_COOKIE);
        clearCsrfCookie(reply, env);
        return reply.send({ message: "Logged out" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        fastify.log.error(error);
        return reply.status(500).send({ error: "Server error", message });
      }
    }
  );

  fastify.get(
    "/sessions",
    { preHandler: wrapPreHandler(requirePlatformAuth()), config: { rateLimit: rateLimitConfig.platform } },
    async (request, reply) => {
    const { user, session } = request.platformUser!;
    const rows = await db
      .select({
        id: platformUserSession.id,
        userId: platformUserSession.userId,
        expiresAt: platformUserSession.expiresAt,
        ipAddress: platformUserSession.ipAddress,
        userAgent: platformUserSession.userAgent,
        createdAt: platformUserSession.createdAt,
      })
      .from(platformUserSession)
      .where(eq(platformUserSession.userId, user.id));

    return reply.send({
      rows,
      rowCount: rows.length,
      currentSessionId: session.id,
    });
    }
  );

  fastify.post(
    "/sessions/:id/revoke",
    {
      preHandler: [
        wrapPreHandler(requirePlatformAuth()),
        wrapPreHandler((request) => validateParams(idParamsSchema)(request)),
      ],
      config: { rateLimit: rateLimitConfig.platform },
    },
    async (request, reply) => {
      const { user, session: currentSession } = request.platformUser!;
      const { id } = request.params as { id: string };

      const [target] = await db
        .select({
          id: platformUserSession.id,
          token: platformUserSession.token,
        })
        .from(platformUserSession)
        .where(and(eq(platformUserSession.id, id), eq(platformUserSession.userId, user.id)))
        .limit(1);

      if (!target) return reply.status(404).send({ error: "Session not found" });

      await db.delete(platformUserSession).where(eq(platformUserSession.id, target.id));
      invalidatePlatformSessionHash(target.token);

      await logAudit({
        db,
        ctx: request,
        action: "platform_session.revoked",
        resourceType: "platform_user_session",
        resourceId: target.id,
        metadata: {
          revokedByUserId: user.id,
          revokedSessionId: target.id,
          self: target.id === currentSession.id,
        },
      });

      if (target.id === currentSession.id) {
        const token = request.cookies?.[PLATFORM_SESSION_COOKIE];
        if (token) invalidatePlatformSession(token);
        clearSessionCookie(reply, env, PLATFORM_SESSION_COOKIE);
        clearCsrfCookie(reply, env);
      }

      return reply.send({ ok: true });
    },
  );

  fastify.post(
    "/sessions/revoke-others",
    { preHandler: wrapPreHandler(requirePlatformAuth()), config: { rateLimit: rateLimitConfig.platform } },
    async (request, reply) => {
      const { user, session: currentSession } = request.platformUser!;

      const otherSessions = await db
        .select({ id: platformUserSession.id, token: platformUserSession.token })
        .from(platformUserSession)
        .where(and(eq(platformUserSession.userId, user.id), ne(platformUserSession.id, currentSession.id)));

      if (otherSessions.length > 0) {
        await db
          .delete(platformUserSession)
          .where(and(eq(platformUserSession.userId, user.id), ne(platformUserSession.id, currentSession.id)));

        for (const s of otherSessions) invalidatePlatformSessionHash(s.token);
      }

      await logAudit({
        db,
        ctx: request,
        action: "platform_session.revoked_others",
        resourceType: "platform_user",
        resourceId: user.id,
        metadata: {
          revokedByUserId: user.id,
          revokedCount: otherSessions.length,
          currentSessionId: currentSession.id,
        },
      });

      return reply.send({ ok: true, revokedCount: otherSessions.length });
    },
  );

  fastify.post(
    "/signup",
    {
      config: { rateLimit: rateLimitConfig.auth },
      preHandler: wrapPreHandler(validateBody(signupSchema)),
    },
    async (request, reply) => {
      try {
        const { name, email, password } = request.body as z.infer<typeof signupSchema>;

      // 1. Validation
      const emailLower = email.toLowerCase();

      // 2. Check Existing User
      const existingUser = await db.query.platformUser.findFirst({
        where: eq(platformUser.email, emailLower),
      });

      if (existingUser) {
        return reply.status(409).send({
          error: "Email already exists",
          message: "A user with this email already exists",
        });
      }

      // 3. Get Default Role (Member)
      // Note: In a real app, maybe only 'member' is allowed for public signup.
      // Reference project allowed passing `roleSlug` but defaulted to MEMBER.
      // We will stick to MEMBER for now unless we want to allow allowing role selection (unsafe for public).
      const roleSlug = "member"; 
      const role = await db.query.platformRoles.findFirst({
          where: eq(platformRoles.slug, roleSlug)
      });

      if (!role) {
          return reply.status(500).send({ error: "System Error", message: "Default role not configured" });
      }

      // 4. Create User
      const userId = uuidv7();
      await db.insert(platformUser).values({
        id: userId,
        name,
        email: emailLower,
        roleId: role.id,
      });

      // 5. Create Account (Credentials)
       const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
      await db.insert(platformUserAccount).values({
          userId,
          accountId: userId, // Using userId as accountId for simple credentials
          providerId: "credential",
          password: hashedPassword
      });


      // 6. Create Session (Auto-Login)
      const sessionId = uuidv7();
       const token = generateSessionToken();
       const tokenHash = hashSessionToken(token, env.SESSION_TOKEN_PEPPER);
       const expiresAt = buildSessionExpiry(env.SESSION_TTL_DAYS);

       await db.insert(platformUserSession).values({
         id: sessionId,
         userId,
         token: tokenHash,
         expiresAt,
         ipAddress: request.ip,
         userAgent: request.headers["user-agent"],
       });

       // 7. Set Cookie
       reply.setCookie(
         PLATFORM_SESSION_COOKIE,
         token,
         buildSessionCookieOptions(env, expiresAt)
       );
       setCsrfCookie(reply, env, expiresAt);

       // 8. Generate JWT (Optional)
       const jwtToken = jwt.sign(
         {
           userId,
           email: emailLower,
           role: role.slug,
           typ: "access",
           scope: "platform",
         },
          env.JWT_SECRET,
          {
            expiresIn: `${env.PLATFORM_JWT_TTL_DAYS}d`,
            issuer: "blog",
            audience: "platform",
            algorithm: "HS256",
          }
        );

      return reply.status(201).send({
        message: "Signup successful",
        token: jwtToken,
        user: {
          id: userId,
          name,
          email: emailLower,
        },
        role: {
            slug: role.slug,
            name: role.name
        }
      });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        fastify.log.error(error);
        return reply.status(500).send({ error: "Server error", message });
      }
    }
  );
};
