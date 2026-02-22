import type { FastifyInstance } from "fastify";
import { PLATFORM_ROUTES, ROUTE_PREFIXES } from "./manifest.js";
import { registerWithPrefix } from "./prefixGuard.js";

export async function registerPlatformRoutes(app: FastifyInstance) {
  const { platformTenantsRoutes } = await import(
    "../modules/tenants/platform/index.js"
  );
  await registerWithPrefix(app, platformTenantsRoutes, {
    prefix: PLATFORM_ROUTES.tenants,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.tenants",
  });

  const { platformAuditLogsRoutes } = await import(
    "../modules/audit/platform/index.js"
  );
  await registerWithPrefix(app, platformAuditLogsRoutes, {
    prefix: PLATFORM_ROUTES.auditLogs,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.auditLogs",
  });

  const { platformUsersRoutes } = await import(
    "../modules/users/platform/index.js"
  );
  await registerWithPrefix(app, platformUsersRoutes, {
    prefix: PLATFORM_ROUTES.users,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.users",
  });

  const { platformBannersRoutes } = await import("../modules/banners/index.js");
  await registerWithPrefix(app, platformBannersRoutes, {
    prefix: PLATFORM_ROUTES.banners,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.banners",
  });

  const { platformAnalyticsRoutes } = await import("../modules/analytics/index.js");
  await registerWithPrefix(app, platformAnalyticsRoutes, {
    prefix: PLATFORM_ROUTES.analytics,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.analytics",
  });

  const { platformBlogCategoriesRoutes } = await import("../modules/blogCategories/platform/index.js");
  await registerWithPrefix(app, platformBlogCategoriesRoutes, {
    prefix: PLATFORM_ROUTES.blogCategories,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.blogCategories",
  });

  const { platformBlogTagsRoutes } = await import("../modules/blogTags/platform/index.js");
  await registerWithPrefix(app, platformBlogTagsRoutes, {
    prefix: PLATFORM_ROUTES.blogTags,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.blogTags",
  });
}
