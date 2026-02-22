import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { fastifyRequestContext } from "@fastify/request-context";
import type { onRouteHookHandler } from "fastify";
import fastify from "fastify";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { env } from "./common/env.js";
import { rateLimitConfig } from "./core/rateLimit.js";
import { setupSwagger } from "./core/swagger.js";
import { AppError } from "./errors/AppError.js";
import { ERROR_CODES } from "./errors/errorCodes.js";
import { OUTBOX_HANDLERS } from "./events/asyncHandlers.js";
import { initializeEventBus } from "./events/index.js";
import { registerTenantHandlers } from "./events/tenant/index.js";
import { csrfGuard } from "./middlewares/csrf.guard.js";
import { setupMetrics } from "./observability/metrics.js";
import { registerRoutes } from "./routes/registerRoutes.js";
import { hasOwn } from "./utils/objectUtils.js";
import { startOutboxRunner } from "./utils/outboxRunner.js";

export async function createApp(options: { onRoute?: onRouteHookHandler } = {}) {
  // Initialize Event Bus
  await initializeEventBus();
  
  // Register event handlers
  registerTenantHandlers();
  
  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === "development" && env.LOG_PRETTY
          ? { target: "pino-pretty" }
          : undefined,
    },
    requestTimeout: env.REQUEST_TIMEOUT_MS,
    connectionTimeout: env.CONNECTION_TIMEOUT_MS,
    keepAliveTimeout: env.KEEP_ALIVE_TIMEOUT_MS,
    bodyLimit: env.REQUEST_BODY_MAX_BYTES,
  });

  // Request context
  await app.register(fastifyRequestContext, {
    defaultStoreValues: {
      requestId: "",
      correlationId: "",
      startTime: 0,
    },
  });

  // Request logging and request id
  app.addHook("onRequest", async (request, reply) => {
    const requestIdHeader = env.REQUEST_ID_HEADER.toLowerCase();
    const correlationHeader = env.CORRELATION_ID_HEADER.toLowerCase();
    const incomingRequestId = request.headers[requestIdHeader];
    const incomingCorrelationId = request.headers[correlationHeader];

    const requestId =
      typeof incomingRequestId === "string" && incomingRequestId.trim()
        ? incomingRequestId.trim()
        : uuidv7();

    const correlationId =
      typeof incomingCorrelationId === "string" && incomingCorrelationId.trim()
        ? incomingCorrelationId.trim()
        : requestId;

    request.requestContext.set("requestId", requestId);
    request.requestContext.set("correlationId", correlationId);
    request.requestContext.set("startTime", Date.now());

    reply.header("x-request-id", requestId);
    reply.header("x-correlation-id", correlationId);

    request.log = request.log.child({
      requestId,
      correlationId,
      method: request.method,
      path: request.url,
    });

    request.log.info({ event: "request.start" }, "Request started");
  });

  app.addHook("onResponse", async (request, reply) => {
    const startTime = request.requestContext.get("startTime");
    const durationMs = startTime ? Date.now() - startTime : undefined;
    request.log.info(
      {
        event: "request.complete",
        statusCode: reply.statusCode,
        durationMs,
      },
      "Request completed"
    );
  });

  // Security
  await app.register(helmet, {
    // In production we still primarily serve JSON, but we harden the default
    // browser-facing headers to reduce risk if any HTML endpoints are added.
    contentSecurityPolicy:
      env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'none'"],
              baseUri: ["'none'"],
              formAction: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
    strictTransportSecurity:
      env.NODE_ENV === "production"
        ? {
            maxAge: 15552000, // 180 days
            includeSubDomains: true,
          }
        : false,
  });

  // CORS
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  if (env.NODE_ENV === "production" && allowedOrigins.length === 0) {
    throw new Error("ALLOWED_ORIGINS must be configured in production");
  }

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow non-browser clients (no Origin header).
      if (!origin) {
        cb(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      cb(new Error("CORS origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  });

  // Cookies (sessions)
  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
  });

  // CSRF protection for cookie-authenticated routes
  app.addHook("preHandler", csrfGuard());

  // File uploads
  await app.register(multipart, {
    limits: {
      fileSize: env.UPLOAD_MAX_BYTES,
      files: 1,
    },
  });

  // Swagger docs (non-production by default)
  if (env.NODE_ENV !== "production" && env.SWAGGER_ENABLED) {
    await setupSwagger(app);
  }

  // Rate limiting
  if (env.RATE_LIMIT_ENABLED) {
    await app.register(rateLimit, {
      ...rateLimitConfig.global,
      addHeaders: {
        "x-ratelimit-limit": true,
        "x-ratelimit-remaining": true,
        "x-ratelimit-reset": true,
        "retry-after": true,
      },
      errorResponseBuilder: (request, context) => {
        const requestId = request.requestContext.get("requestId") || request.id;
        return {
          success: false,
          error: {
            code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: "Too many requests",
            details: {
              limit: context.max,
              retryAfterSeconds: context.after,
            },
            requestId,
            timestamp: new Date().toISOString(),
          },
        };
      },
    });
  }

  // Metrics (local, tenant-protected)
  setupMetrics(app);

  // Outbox runner (optional)
  if (env.OUTBOX_ENABLED) {
    startOutboxRunner(OUTBOX_HANDLERS, { intervalMs: 5000 });
  }

  if (options.onRoute) {
    app.addHook("onRoute", options.onRoute);
  }

  // Routes
  await registerRoutes(app);

  // 404 handler
  app.setNotFoundHandler(async (request, reply) => {
    const requestId = request.requestContext.get("requestId") || request.id;
    reply.status(404).send({
      success: false,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: `Route ${request.method} ${request.url} not found`,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Error handler
  app.setErrorHandler(async (error, request, reply) => {
    request.log.error({ err: error }, "Request error");

    const requestId = request.requestContext.get("requestId") || request.id;
    const isDev = env.NODE_ENV === "development" || env.EXPOSE_ERROR_DETAILS;

    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Invalid request",
          details: {
            issues: error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            })),
          },
          requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Honor Fastify-style status codes for non-AppError throws.
    // Many route modules throw `{ statusCode: 400 }` for bad requests.
    if (error && typeof error === "object") {
      const statusCode =
        hasOwn(error, "statusCode") && typeof error.statusCode === "number"
          ? error.statusCode
          : null;
      const message = hasOwn(error, "message") && typeof error.message === "string" ? error.message : null;
      const details = hasOwn(error, "details") && typeof error.details === "object" ? error.details : null;

      if (statusCode && statusCode >= 400 && statusCode < 500) {
        const code =
          statusCode === 400
            ? ERROR_CODES.BAD_REQUEST
            : statusCode === 401
              ? ERROR_CODES.UNAUTHORIZED
              : statusCode === 403
                ? ERROR_CODES.FORBIDDEN
                : statusCode === 404
                  ? ERROR_CODES.NOT_FOUND
                  : statusCode === 409
                    ? ERROR_CODES.CONFLICT
                    : ERROR_CODES.BAD_REQUEST;

        return reply.status(statusCode).send({
          success: false,
          error: {
            code,
            message: message ?? "Request rejected",
            details,
            requestId,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Map common Postgres errors to stable API responses.
    if (error && typeof error === "object") {
      const code = hasOwn(error, "code") && typeof error.code === "string" ? error.code : null;
      const constraint =
        hasOwn(error, "constraint") && typeof error.constraint === "string" ? error.constraint : null;
      const detail = hasOwn(error, "detail") && typeof error.detail === "string" ? error.detail : null;

      if (code === "23505") {
        return reply.status(409).send({
          success: false,
          error: {
            code: ERROR_CODES.CONFLICT,
            message: "Conflict",
            details: { constraint, detail },
            requestId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Foreign key violation
      if (code === "23503") {
        return reply.status(400).send({
          success: false,
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: "Invalid reference",
            details: { constraint, detail },
            requestId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check constraint violation
      if (code === "23514") {
        return reply.status(400).send({
          success: false,
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: "Invalid value",
            details: { constraint, detail },
            requestId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Invalid text representation (e.g., invalid uuid)
      if (code === "22P02") {
        return reply.status(400).send({
          success: false,
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: "Invalid input",
            details: { detail },
            requestId,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return reply.status(500).send({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: isDev ? (error as Error).message : "Internal server error",
        ...(isDev ? { stack: (error as Error).stack } : {}),
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  return app;
}
