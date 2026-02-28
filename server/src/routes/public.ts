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

  const { publicBlogPostsRoutes } = await import("../modules/blogPosts/public/index.js");
  await registerWithPrefix(app, publicBlogPostsRoutes, {
    prefix: PUBLIC_ROUTES.blogPosts,
    basePrefix: ROUTE_PREFIXES.public,
    label: "public.blogPosts",
  });

  const { publicBlogCategoriesRoutes } = await import("../modules/blogCategories/public/index.js");
  await registerWithPrefix(app, publicBlogCategoriesRoutes, {
    prefix: PUBLIC_ROUTES.blogCategories,
    basePrefix: ROUTE_PREFIXES.public,
    label: "public.blogCategories",
  });

  const { publicBlogTagsRoutes } = await import("../modules/blogTags/public/index.js");
  await registerWithPrefix(app, publicBlogTagsRoutes, {
    prefix: PUBLIC_ROUTES.blogTags,
    basePrefix: ROUTE_PREFIXES.public,
    label: "public.blogTags",
  });

  const { publicFeaturedRoutes } = await import("../modules/featured/public/index.js");
  await registerWithPrefix(app, publicFeaturedRoutes, {
    prefix: PUBLIC_ROUTES.featured,
    basePrefix: ROUTE_PREFIXES.public,
    label: "public.featured",
  });
}
