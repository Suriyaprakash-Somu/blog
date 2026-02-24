import type { FastifyInstance } from "fastify";
import { PUBLIC_ROUTES, ROUTE_PREFIXES } from "./manifest.js";
import { registerWithPrefix } from "./prefixGuard.js";

export async function registerPublicRoutes(app: FastifyInstance) {
  const { publicBannersRoutes } = await import("../modules/banners/index.js");
  await registerWithPrefix(app, publicBannersRoutes, {
    prefix: PUBLIC_ROUTES.banners,
    basePrefix: ROUTE_PREFIXES.public,
    label: "public.banners",
  });

  const { publicAnalyticsRoutes } = await import("../modules/analytics/index.js");
  await registerWithPrefix(app, publicAnalyticsRoutes, {
    prefix: PUBLIC_ROUTES.analytics,
    basePrefix: ROUTE_PREFIXES.public,
    label: "public.analytics",
  });

  const { publicSettingsRoutes } = await import("../modules/settings/public/index.js");
  await registerWithPrefix(app, publicSettingsRoutes, {
    prefix: PUBLIC_ROUTES.settings,
    basePrefix: ROUTE_PREFIXES.public,
    label: "public.settings",
  });
}
