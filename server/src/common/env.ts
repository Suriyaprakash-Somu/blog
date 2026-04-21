import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (value === undefined || value === null) return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes" || v === "y" || v === "on") return true;
    if (v === "false" || v === "0" || v === "no" || v === "n" || v === "off" || v === "") return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3005),
  LOG_LEVEL: z.string().default("info"),
  LOG_PRETTY: booleanFromEnv.default(true),
  EXPOSE_ERROR_DETAILS: booleanFromEnv.default(false),
  SWAGGER_ENABLED: booleanFromEnv.default(true),
  REQUEST_ID_HEADER: z.string().default("x-request-id"),
  CORRELATION_ID_HEADER: z.string().default("x-correlation-id"),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(180000),
  CONNECTION_TIMEOUT_MS: z.coerce.number().default(10000),
  KEEP_ALIVE_TIMEOUT_MS: z.coerce.number().default(60000),
  REQUEST_BODY_MAX_BYTES: z.coerce.number().min(1024).default(1024 * 1024),
  SESSION_CACHE_TTL_MS: z.coerce.number().default(30000),
  OUTBOX_ENABLED: booleanFromEnv.default(false),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().default(180000),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().default(10000),

  COOKIE_SECRET: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  SESSION_TOKEN_PEPPER: z.string().min(1).optional(),
  SESSION_TTL_DAYS: z.coerce.number().min(1).default(7),
  PLATFORM_JWT_TTL_DAYS: z.coerce.number().min(1).default(1),
  MOBILE_ACCESS_TOKEN_TTL_MIN: z.coerce.number().min(1).default(30),
  MOBILE_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().min(1).default(60),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),
  CSRF_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),
  COOKIE_SECURE: booleanFromEnv.optional(),
  COOKIE_DOMAIN: z.string().min(1).optional(),
  CSRF_COOKIE_NAME: z.string().min(1).optional(),
  CSRF_HEADER_NAME: z.string().min(1).optional(),

  // Database
  DATABASE_HOST: z.string().default("localhost"),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USER: z.string().default("postgres"),
  DATABASE_PASSWORD: z.string().optional(),
  DATABASE_NAME: z.string().default("blog"),
  DATABASE_SSL: booleanFromEnv.default(false),
  DATABASE_SSL_REJECT_UNAUTHORIZED: booleanFromEnv.default(true),
  DATABASE_POOL_MAX: z.coerce.number().min(1).default(20),
  DATABASE_POOL_MIN: z.coerce.number().min(0).default(0),
  DATABASE_POOL_IDLE_TIMEOUT_MS: z.coerce.number().min(1000).default(30000),
  DATABASE_POOL_MAX_USES: z.coerce.number().min(0).default(0),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  // Uploads
  UPLOAD_MAX_BYTES: z.coerce.number().default(5 * 1024 * 1024),
  UPLOAD_DIR: z.string().default("uploads"),
  UPLOAD_ORPHAN_TTL_MINUTES: z.coerce.number().default(1440), // 24 hours
  UPLOAD_ALLOWED_MIME: z.string().optional(),
  UPLOAD_SCAN_MODE: z.enum(["none", "clamav"]).default("none"),
  UPLOAD_SCAN_COMMAND: z.string().default("clamscan"),
  UPLOAD_SCAN_TIMEOUT_MS: z.coerce.number().min(1000).default(120000),
  UPLOAD_SCAN_FAIL_CLOSED: booleanFromEnv.default(false),
  UPLOAD_ORPHAN_CLEANUP_ENABLED: booleanFromEnv.default(false),
  UPLOAD_ORPHAN_CLEANUP_INTERVAL_MINUTES: z.coerce.number().min(1).default(15),
  UPLOAD_ORPHAN_CLEANUP_BATCH_SIZE: z.coerce.number().min(1).max(1000).default(200),

  // Metrics
  METRICS_AUTH_MODE: z.enum(["tenant", "none", "token"]).default("tenant"),
  METRICS_TOKEN: z.string().optional(),

  // Rate limiting
  RATE_LIMIT_ENABLED: booleanFromEnv.default(true),
  RATE_LIMIT_GLOBAL_MAX: z.string().optional(),
  RATE_LIMIT_GLOBAL_WINDOW: z.string().optional(),
  RATE_LIMIT_AUTH_MAX: z.string().optional(),
  RATE_LIMIT_AUTH_WINDOW: z.string().optional(),
  RATE_LIMIT_TENANT_MAX: z.string().optional(),
  RATE_LIMIT_TENANT_WINDOW: z.string().optional(),
  RATE_LIMIT_USER_MAX: z.string().optional(),
  RATE_LIMIT_USER_WINDOW: z.string().optional(),
  RATE_LIMIT_UPLOAD_MAX: z.string().optional(),
  RATE_LIMIT_UPLOAD_WINDOW: z.string().optional(),
  RATE_LIMIT_PLATFORM_MAX: z.string().optional(),
  RATE_LIMIT_PLATFORM_WINDOW: z.string().optional(),

});

type EnvInput = z.infer<typeof envSchema>;

function requireSecret(env: EnvInput, key: keyof EnvInput) {
  if (env.NODE_ENV === "production" && !env[key]) {
    throw new Error(`Missing required env var in production: ${String(key)}`);
  }
}

function resolveEnv(env: EnvInput) {
  requireSecret(env, "COOKIE_SECRET");
  requireSecret(env, "JWT_SECRET");
  requireSecret(env, "SESSION_TOKEN_PEPPER");

  const isProd = env.NODE_ENV === "production";

  const cookieSecret =
    env.COOKIE_SECRET ?? (isProd ? undefined : "dev-cookie-secret-change-me");
  const jwtSecret = env.JWT_SECRET ?? (isProd ? undefined : "dev-jwt-secret-change-me");
  const sessionTokenPepper =
    env.SESSION_TOKEN_PEPPER ?? (isProd ? undefined : "dev-session-pepper-change-me");

  if (!cookieSecret) {
    throw new Error("Missing required env var: COOKIE_SECRET");
  }
  if (!jwtSecret) {
    throw new Error("Missing required env var: JWT_SECRET");
  }
  if (!sessionTokenPepper) {
    throw new Error("Missing required env var: SESSION_TOKEN_PEPPER");
  }

  return {
    ...env,
    COOKIE_SECRET: cookieSecret,
    JWT_SECRET: jwtSecret,
    SESSION_TOKEN_PEPPER: sessionTokenPepper,
    COOKIE_SAME_SITE: env.COOKIE_SAME_SITE ?? "lax",
    CSRF_COOKIE_SAME_SITE: env.CSRF_COOKIE_SAME_SITE ?? "lax",
    COOKIE_SECURE: env.COOKIE_SECURE ?? env.NODE_ENV === "production",
    COOKIE_DOMAIN: env.COOKIE_DOMAIN as string | undefined,
    CSRF_COOKIE_NAME: env.CSRF_COOKIE_NAME ?? "csrf_token",
    CSRF_HEADER_NAME: env.CSRF_HEADER_NAME ?? "x-csrf-token",
  } as const;
}

export const env = resolveEnv(envSchema.parse(process.env));

export type Env = typeof env;
