import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import client from "prom-client";
import { env } from "../common/env.js";
import { rateLimitConfig } from "../core/rateLimit.js";
import { requireTenantAuth } from "../middlewares/tenant.guard.js";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [register],
});

const httpRequestErrors = new client.Counter({
  name: "http_request_errors_total",
  help: "Total number of HTTP 5xx responses",
  labelNames: ["method", "route", "status"] as const,
  registers: [register],
});

function getRouteLabel(request: FastifyRequest): string {
  const route = request.routeOptions?.url;
  if (route) return route;
  const url = request.url || "unknown";
  return url.split("?")[0] || "unknown";
}

export function setupMetrics(app: FastifyInstance) {
  app.addHook("onRequest", async (request) => {
    request.metricsStart = process.hrtime.bigint();
  });

  app.addHook("onResponse", async (request, reply) => {
    const start = request.metricsStart;
    if (!start) return;

    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = getRouteLabel(request);
    const status = String(reply.statusCode || 0);

    httpRequestDuration.observe(
      { method: request.method, route, status },
      durationSeconds
    );
    httpRequestTotal.inc({ method: request.method, route, status });
    if (reply.statusCode >= 500) {
      httpRequestErrors.inc({ method: request.method, route, status });
    }
  });

  app.get(
    "/metrics",
    {
      preHandler: (request, reply, done) => {
        if (env.METRICS_AUTH_MODE === "none") {
          return done();
        }

        if (env.METRICS_AUTH_MODE === "token") {
          const token = env.METRICS_TOKEN;
          if (!token) {
            reply.status(500).send({ error: "Metrics token not configured" });
            return;
          }

          const hdr = request.headers["x-metrics-token"];
          const provided = Array.isArray(hdr) ? hdr[0] : hdr;
          const auth = request.headers.authorization;
          const bearer = auth && auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;

          if (provided === token || bearer === token) {
            return done();
          }
          reply.status(401).send({ error: "Unauthorized" });
          return;
        }

        requireTenantAuth()(request, reply)
          .then(() => done())
          .catch((err) => done(err as Error));
      },
      config: { rateLimit: rateLimitConfig.tenant },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const metrics = await register.metrics();
      reply.type(register.contentType);
      return reply.send(metrics);
    }
  );
}

export function getMetricsRegistry() {
  return register;
}
