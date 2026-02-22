import "dotenv/config";

import { createApp } from "../app.js";

type RouteInfo = {
  method: string;
  url: string;
  hasRateLimitConfig: boolean;
};

function normalizeMethod(method: unknown): string {
  if (typeof method === "string") return method;
  if (Array.isArray(method)) return method.join(",");
  return "UNKNOWN";
}

function isApiRoute(url: string): boolean {
  return url.startsWith("/api/");
}

function isIgnoredMethod(method: string): boolean {
  // Fastify often auto-creates HEAD routes for GET.
  return method.split(",").includes("HEAD") || method.split(",").includes("OPTIONS");
}

function isExempt(url: string): boolean {
  return url === "/health" || url === "/metrics";
}

async function main() {
  const routes: RouteInfo[] = [];

  const app = await createApp({
    onRoute: (routeOptions) => {
      const url = routeOptions.url;
      if (typeof url !== "string") return;

      const method = normalizeMethod(routeOptions.method);
      const config = routeOptions.config as unknown;
      const configRecord = config && typeof config === "object" ? (config as Record<string, unknown>) : null;
      const hasRateLimitConfig = Boolean(configRecord && "rateLimit" in configRecord);

      routes.push({ method, url, hasRateLimitConfig });
    },
  });

  await app.ready();
  await app.close();

  const apiRoutes = routes.filter(
    (r) => isApiRoute(r.url) && !isExempt(r.url) && !isIgnoredMethod(r.method)
  );
  const missingRateLimit = apiRoutes.filter((r) => !r.hasRateLimitConfig);

  if (missingRateLimit.length > 0) {
    // Keep output intentionally short and deterministic for CI logs.
    // One line per route: METHOD URL
    // eslint-disable-next-line no-console
    console.error("[check-route-security] Missing per-route rateLimit config:");
    for (const r of missingRateLimit.sort((a, b) => (a.url + a.method).localeCompare(b.url + b.method))) {
      // eslint-disable-next-line no-console
      console.error(`${r.method} ${r.url}`);
    }
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`[check-route-security] OK (${apiRoutes.length} API routes checked)`);
}

void main();
