import { type AppSubject, Subjects } from "@/lib/casl";

export interface ModuleBinding {
  moduleKey: string;
  scope: "platform" | "tenant";
  routeBase: string;
  subject: AppSubject;
}

export const MODULE_BINDINGS: Record<string, ModuleBinding> = {
  "platform.dashboard": {
    moduleKey: "platform.dashboard",
    scope: "platform",
    routeBase: "/platform/dashboard",
    subject: Subjects.PLATFORM_ADMIN,
  },
  "platform.users": {
    moduleKey: "platform.users",
    scope: "platform",
    routeBase: "/platform/users",
    subject: Subjects.USER,
  },
  "platform.tenants": {
    moduleKey: "platform.tenants",
    scope: "platform",
    routeBase: "/platform/tenants",
    subject: Subjects.TENANT,
  },
  "platform.auditLogs": {
    moduleKey: "platform.auditLogs",
    scope: "platform",
    routeBase: "/platform/audit-logs",
    subject: Subjects.AUDIT_LOG,
  },
  "platform.banners": {
    moduleKey: "platform.banners",
    scope: "platform",
    routeBase: "/platform/banners",
    subject: Subjects.BANNER,
  },
  "platform.analytics": {
    moduleKey: "platform.analytics",
    scope: "platform",
    routeBase: "/platform/analytics",
    subject: Subjects.ANALYTICS,
  },
  "platform.blogCategories": {
    moduleKey: "platform.blogCategories",
    scope: "platform",
    routeBase: "/platform/blog-categories",
    subject: "BlogCategory" as AppSubject,
  },
  "platform.blogTags": {
    moduleKey: "platform.blogTags",
    scope: "platform",
    routeBase: "/platform/blog-tags",
    subject: "BlogTag" as AppSubject,
  },
  "platform.blogPosts": {
    moduleKey: "platform.blogPosts",
    scope: "platform",
    routeBase: "/platform/blog-posts",
    subject: "BlogPost" as AppSubject,
  },
  "tenant.users": {
    moduleKey: "tenant.users",
    scope: "tenant",
    routeBase: "/tenant/users",
    subject: Subjects.USER,
  },
  "tenant.dashboard": {
    moduleKey: "tenant.dashboard",
    scope: "tenant",
    routeBase: "/tenant/dashboard",
    subject: Subjects.ORGANIZATION,
  },
  "tenant.analytics": {
    moduleKey: "tenant.analytics",
    scope: "tenant",
    routeBase: "/tenant/analytics",
    subject: Subjects.ANALYTICS,
  },
  "tenant.branches": {
    moduleKey: "tenant.branches",
    scope: "tenant",
    routeBase: "/tenant/branches",
    subject: Subjects.BRANCH,
  },
};

export function getModuleBinding(moduleKey: string): ModuleBinding | undefined {
  return MODULE_BINDINGS[moduleKey];
}
