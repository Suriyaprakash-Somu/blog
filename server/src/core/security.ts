import crypto from "node:crypto";
import type { FastifyReply } from "fastify";
import type { Env } from "../common/env.js";

export const PLATFORM_SESSION_COOKIE = "platform_admin_session";
export const TENANT_SESSION_COOKIE = "tenant_session";
export const TENANT_IMPERSONATION_COOKIE = "tenant_impersonating";

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string, pepper: string): string {
  return crypto
    .createHash("sha256")
    .update(`${token}.${pepper}`)
    .digest("hex");
}

export function buildSessionExpiry(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function buildSessionCookieOptions(env: Env, expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    path: "/",
    expires: expiresAt,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN as string } : {}),
  } as const;
}

export function buildCsrfCookieOptions(env: Env, expiresAt: Date) {
  return {
    httpOnly: false,
    sameSite: env.CSRF_COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    path: "/",
    expires: expiresAt,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN as string } : {}),
  } as const;
}

export function buildImpersonationCookieOptions(env: Env, expiresAt: Date) {
  return {
    httpOnly: false,
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    path: "/",
    expires: expiresAt,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN as string } : {}),
  } as const;
}

export function setCsrfCookie(reply: FastifyReply, env: Env, expiresAt: Date): string {
  const token = generateCsrfToken();
  reply.setCookie(env.CSRF_COOKIE_NAME, token, buildCsrfCookieOptions(env, expiresAt));
  return token;
}

export function clearSessionCookie(reply: FastifyReply, env: Env, cookieName: string) {
  reply.clearCookie(cookieName, {
    path: "/",
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN as string } : {}),
  });
}

export function clearCsrfCookie(reply: FastifyReply, env: Env) {
  reply.clearCookie(env.CSRF_COOKIE_NAME, {
    path: "/",
    sameSite: env.CSRF_COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN as string } : {}),
  });
}
