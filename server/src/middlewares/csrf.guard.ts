import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../common/env.js";
import { ForbiddenError } from "../errors/AppError.js";
import { PLATFORM_SESSION_COOKIE, TENANT_SESSION_COOKIE } from "../core/security.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_BYPASS_PATHS = new Set([
  "/api/auth/platform/login",
  "/api/auth/platform/signup",
  "/api/auth/tenant/login",
  "/api/auth/tenant/signup",
  "/api/auth/tenant/token/login",
  "/api/auth/tenant/token/refresh",
  "/api/auth/tenant/token/revoke",
  "/api/public/analytics/track-batch",
  "/api/public/uploads",
]);

function stripQuery(path: string): string {
  const index = path.indexOf("?");
  return index >= 0 ? path.slice(0, index) : path;
}

function getHeaderValue(request: FastifyRequest, headerName: string): string | undefined {
  const key = headerName.toLowerCase();
  const value = request.headers[key];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

export function csrfGuard() {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (SAFE_METHODS.has(request.method)) return;

    const requestPath = stripQuery(request.url || "");
    if (CSRF_BYPASS_PATHS.has(requestPath)) return;

    const hasSession = Boolean(
      request.cookies?.[TENANT_SESSION_COOKIE] ||
        request.cookies?.[PLATFORM_SESSION_COOKIE]
    );

    if (!hasSession) return;

    const csrfCookie = request.cookies?.[env.CSRF_COOKIE_NAME];
    const csrfHeader = getHeaderValue(request, env.CSRF_HEADER_NAME);

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenError("Invalid CSRF token");
    }
  };
}
