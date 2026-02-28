import type { FastifyInstance } from "fastify";
import { TENANT_ROUTES, ROUTE_PREFIXES } from "./manifest.js";
import { registerWithPrefix } from "./prefixGuard.js";

export async function registerTenantRoutes(app: FastifyInstance) {
  const { tenantBannersRoutes } = await import("../modules/banners/index.js");
  await registerWithPrefix(app, tenantBannersRoutes, {
    prefix: TENANT_ROUTES.banners,
    basePrefix: ROUTE_PREFIXES.tenant,
    label: "tenant.banners",
  });

  const { tenantAnalyticsRoutes } = await import("../modules/analytics/index.js");
  await registerWithPrefix(app, tenantAnalyticsRoutes, {
    prefix: TENANT_ROUTES.analytics,
    basePrefix: ROUTE_PREFIXES.tenant,
    label: "tenant.analytics",
  });

  // const { tenantBranchesRoutes } = await import("../modules/branches/index.js");
  // await registerWithPrefix(app, tenantBranchesRoutes, {
  //   prefix: TENANT_ROUTES.branches,
  //   basePrefix: ROUTE_PREFIXES.tenant,
  //   label: "tenant.branches",
  // });

  // const { tenantUsersRoutes } = await import("../modules/users/tenant/index.js");
  // await registerWithPrefix(app, tenantUsersRoutes, {
  //   prefix: TENANT_ROUTES.users,
  //   basePrefix: ROUTE_PREFIXES.tenant,
  //   label: "tenant.users",
  // });

  const { tenantBlogPostsRoutes } = await import("../modules/blogPosts/tenant/index.js");
  await registerWithPrefix(app, tenantBlogPostsRoutes, {
    prefix: TENANT_ROUTES.blogPosts,
    basePrefix: ROUTE_PREFIXES.tenant,
    label: "tenant.blogPosts",
  });
}
