import type { FastifyRequest } from "fastify";
import { env } from "../common/env.js";

export interface RateLimitConfig {
  max: number;
  timeWindow: string | number;
  keyGenerator?: (request: FastifyRequest) => string;
}

function getNumberEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getWindowEnv(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return value;
}

export const rateLimitConfig = {
  global: {
    max: getNumberEnv(env.RATE_LIMIT_GLOBAL_MAX, 100),
    timeWindow: getWindowEnv(env.RATE_LIMIT_GLOBAL_WINDOW, "1 minute"),
    keyGenerator: (request: FastifyRequest) => request.ip,
  },
  auth: {
    max: getNumberEnv(env.RATE_LIMIT_AUTH_MAX, 5),
    timeWindow: getWindowEnv(env.RATE_LIMIT_AUTH_WINDOW, "15 minutes"),
    keyGenerator: (request: FastifyRequest) => `auth:${request.ip}`,
  },
  tenant: {
    max: getNumberEnv(env.RATE_LIMIT_TENANT_MAX, 1000),
    timeWindow: getWindowEnv(env.RATE_LIMIT_TENANT_WINDOW, "1 minute"),
    keyGenerator: (request: FastifyRequest) => {
      const tenantId = request.tenantSession?.tenant?.id;
      return tenantId ? `tenant:${tenantId}` : request.ip;
    },
  },
  user: {
    max: getNumberEnv(env.RATE_LIMIT_USER_MAX, 100),
    timeWindow: getWindowEnv(env.RATE_LIMIT_USER_WINDOW, "1 minute"),
    keyGenerator: (request: FastifyRequest) => {
      const userId = request.tenantSession?.user?.id;
      return userId ? `user:${userId}` : request.ip;
    },
  },
  upload: {
    max: getNumberEnv(env.RATE_LIMIT_UPLOAD_MAX, 10),
    timeWindow: getWindowEnv(env.RATE_LIMIT_UPLOAD_WINDOW, "1 minute"),
    keyGenerator: (request: FastifyRequest) => {
      const userId = request.tenantSession?.user?.id;
      return userId ? `upload:${userId}` : request.ip;
    },

  },
  platform: {
    max: getNumberEnv(env.RATE_LIMIT_PLATFORM_MAX, 100),
    timeWindow: getWindowEnv(env.RATE_LIMIT_PLATFORM_WINDOW, "1 minute"),
    keyGenerator: (request: FastifyRequest) => request.ip,
  },
} as const;
