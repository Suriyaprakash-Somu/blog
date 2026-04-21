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

  const { platformBlogPostsRoutes } = await import("../modules/blogPosts/platform/index.js");
  await registerWithPrefix(app, platformBlogPostsRoutes, {
    prefix: PLATFORM_ROUTES.blogPosts,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.blogPosts",
  });

  const { platformSettingsRoutes } = await import("../modules/settings/platform/index.js");
  await registerWithPrefix(app, platformSettingsRoutes, {
    prefix: PLATFORM_ROUTES.settings,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.settings",
  });

  const { platformFeaturedRoutes } = await import("../modules/featured/platform/index.js");
  await registerWithPrefix(app, platformFeaturedRoutes, {
    prefix: PLATFORM_ROUTES.featured,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.featured",
  });

  const { platformNewsletterRoutes } = await import("../modules/newsletter/platform/index.js");
  await registerWithPrefix(app, platformNewsletterRoutes, {
    prefix: PLATFORM_ROUTES.newsletter,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.newsletter",
  });

  const { automationRoutes } = await import("../modules/automation/platform/index.js");
  await registerWithPrefix(app, automationRoutes, {
    prefix: PLATFORM_ROUTES.automation,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.automation",
  });

  const { promptsRoutes } = await import("../modules/prompts/platform/index.js");
  await registerWithPrefix(app, promptsRoutes, {
    prefix: PLATFORM_ROUTES.prompts,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.prompts",
  });

  const { llmCacheRoutes } = await import("../modules/llmCache/platform/llmCache.route.js");
  await registerWithPrefix(app, llmCacheRoutes, {
    prefix: PLATFORM_ROUTES.llmCache,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.llmCache",
  });

  const { platformSystemRoutes } = await import("../modules/system/platform/index.js");
  await registerWithPrefix(app, platformSystemRoutes, {
    prefix: PLATFORM_ROUTES.system,
    basePrefix: ROUTE_PREFIXES.platform,
    label: "platform.system",
  });
}
