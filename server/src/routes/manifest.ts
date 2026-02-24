export const ROUTE_PREFIXES = {
  auth: "/api/auth",
  authPlatform: "/api/auth/platform",
  authTenant: "/api/auth/tenant",
  platform: "/api/platform",
  tenant: "/api/tenant",
  public: "/api/public",
  uploads: "/api/uploads",
} as const;

export const PUBLIC_ROUTES = {
  analytics: "/api/public/analytics",
  banners: "/api/public/banners",
  settings: "/api/public/settings",
  uploads: "/api/public/uploads",
} as const;

export const PLATFORM_ROUTES = {
  tenants: "/api/platform/tenants",
  auditLogs: "/api/platform/audit-logs",
  users: "/api/platform/users",
  banners: "/api/platform/banners",
  settings: "/api/platform/settings",
  analytics: "/api/platform/analytics",
  blogCategories: "/api/platform/blog-categories",
  blogTags: "/api/platform/blog-tags",
} as const;

export const TENANT_ROUTES = {
  banners: "/api/tenant/banners",
  analytics: "/api/tenant/analytics",
  branches: "/api/tenant/branches",
  users: "/api/tenant/users",
} as const;
