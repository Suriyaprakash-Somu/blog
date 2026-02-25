import type { CrudAccessConfig } from "../core/crudFactory.js";
import { ACTIONS, type Action, SUBJECTS, type Subject } from "../modules/rbac/public/permissions.js";

export type ModuleScope = "platform" | "tenant";
export type CrudOperation = "list" | "detail" | "create" | "update" | "delete";

export interface AbilityRequirement {
  action: Action;
  subject: Subject;
}

export interface PermissionExpression {
  allOf?: AbilityRequirement[];
  anyOf?: AbilityRequirement[];
}

export interface ModuleNavigationPolicy {
  title: string;
  path: string;
  section?: string;
  order?: number;
  iconKey?: string;
  parentModuleKey?: string;
  visibleWhen?: AbilityRequirement;
}

export interface ModuleCrudPolicy {
  key: string;
  mode: ModuleScope;
  tenantScope?: boolean;
  operations: Partial<Record<CrudOperation, AbilityRequirement>>;
}

export interface ModuleSupportEndpointPolicy {
  endpointKey: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  allowedWhen: PermissionExpression;
}

export interface ModulePolicy {
  moduleKey: string;
  scope: ModuleScope;
  subject: Subject;
  routeBase: string;
  navigation?: ModuleNavigationPolicy;
  crud?: ModuleCrudPolicy;
  supportEndpoints?: ModuleSupportEndpointPolicy[];
  metadata?: Record<string, unknown>;
}

const crudFull = (subject: Subject): ModuleCrudPolicy["operations"] => ({
  list: { action: ACTIONS.READ, subject },
  detail: { action: ACTIONS.READ, subject },
  create: { action: ACTIONS.CREATE, subject },
  update: { action: ACTIONS.UPDATE, subject },
  delete: { action: ACTIONS.DELETE, subject },
});

const crudReadOnly = (subject: Subject): ModuleCrudPolicy["operations"] => ({
  list: { action: ACTIONS.READ, subject },
  detail: { action: ACTIONS.READ, subject },
});

export const MODULE_POLICIES: ModulePolicy[] = [
  {
    moduleKey: "platform.dashboard",
    scope: "platform",
    subject: SUBJECTS.PLATFORM_ADMIN,
    routeBase: "/platform/dashboard",
    navigation: {
      title: "Dashboard",
      path: "/platform/dashboard",
      iconKey: "shield",
      section: "Overview",
      order: 1,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.PLATFORM_ADMIN },
    },
  },
  {
    moduleKey: "platform.tenants",
    scope: "platform",
    subject: SUBJECTS.TENANT,
    routeBase: "/platform/tenants",
    navigation: {
      title: "Tenants",
      path: "/platform/tenants",
      iconKey: "shield",
      section: "Management",
      order: 2,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.TENANT },
    },
  },
  {
    moduleKey: "platform.users",
    scope: "platform",
    subject: SUBJECTS.USER,
    routeBase: "/platform/users",
    navigation: {
      title: "Users",
      path: "/platform/users",
      iconKey: "users",
      section: "Management",
      order: 3,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.USER },
    },
    crud: {
      key: "platformUsers",
      mode: "platform",
      tenantScope: false,
      operations: crudFull(SUBJECTS.USER),
    },
    supportEndpoints: [
      {
        endpointKey: "roles-options",
        method: "GET",
        path: "/roles",
        allowedWhen: {
          anyOf: [
            { action: ACTIONS.READ, subject: SUBJECTS.ROLE },
            { action: ACTIONS.CREATE, subject: SUBJECTS.USER },
            { action: ACTIONS.UPDATE, subject: SUBJECTS.USER },
          ],
        },
      },
    ],
  },
  {
    moduleKey: "platform.auditLogs",
    scope: "platform",
    subject: SUBJECTS.AUDIT_LOG,
    routeBase: "/platform/audit-logs",
    navigation: {
      title: "Audit Logs",
      path: "/platform/audit-logs",
      iconKey: "file-text",
      section: "System",
      order: 6,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.AUDIT_LOG },
    },
    crud: {
      key: "auditLogs",
      mode: "platform",
      tenantScope: false,
      operations: crudReadOnly(SUBJECTS.AUDIT_LOG),
    },
  },
  {
    moduleKey: "platform.banners",
    scope: "platform",
    subject: SUBJECTS.BANNER,
    routeBase: "/platform/banners",
    navigation: {
      title: "Banners",
      path: "/platform/banners",
      iconKey: "bell",
      section: "System",
      order: 7,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.BANNER },
    },
    crud: {
      key: "bannersPlatform",
      mode: "platform",
      tenantScope: false,
      operations: crudFull(SUBJECTS.BANNER),
    },
  },
  {
    moduleKey: "platform.analytics",
    scope: "platform",
    subject: SUBJECTS.ANALYTICS,
    routeBase: "/platform/analytics",
    navigation: {
      title: "Analytics",
      path: "/platform/analytics",
      iconKey: "trending-up",
      section: "Overview",
      order: 8,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.ANALYTICS },
    },
  },  
  {
    moduleKey: "platform.featuredCollections",
    scope: "platform",
    subject: SUBJECTS.PLATFORM_SETTINGS,
    routeBase: "/platform/featured-collections",
    navigation: {
      title: "Featured Content",
      path: "/platform/featured-collections",
      iconKey: "layout-list",
      section: "Content",
      order: 1,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.PLATFORM_SETTINGS },
    },
  },
  {
    moduleKey: "platform.settings",
    scope: "platform",
    subject: SUBJECTS.PLATFORM_SETTINGS,
    routeBase: "/platform/settings",
    navigation: {
      title: "Settings",
      path: "/platform/settings",
      iconKey: "settings",
      section: "System",
      order: 9,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.PLATFORM_SETTINGS },
    },
  },

  {
    moduleKey: "platform.blogCategories",
    scope: "platform",
    subject: SUBJECTS.BLOG_CATEGORY,
    routeBase: "/platform/blog-categories",
    navigation: {
      title: "Blog Categories",
      path: "/platform/blog-categories",
      iconKey: "folder",
      section: "Content",
      order: 2,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.BLOG_CATEGORY },
    },
    crud: {
      key: "platformBlogCategories",
      mode: "platform",
      tenantScope: false,
      operations: crudFull(SUBJECTS.BLOG_CATEGORY),
    },
  },

  {
    moduleKey: "platform.blogTags",
    scope: "platform",
    subject: SUBJECTS.BLOG_TAG,
    routeBase: "/platform/blog-tags",
    navigation: {
      title: "Blog Tags",
      path: "/platform/blog-tags",
      iconKey: "tag",
      section: "Content",
      order: 3,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.BLOG_TAG },
    },
    crud: {
      key: "platformBlogTags",
      mode: "platform",
      tenantScope: false,
      operations: crudFull(SUBJECTS.BLOG_TAG),
    },
  },

  {
    moduleKey: "platform.blogPosts",
    scope: "platform",
    subject: SUBJECTS.BLOG_POST,
    routeBase: "/platform/blog-posts",
    navigation: {
      title: "Blog Posts",
      path: "/platform/blog-posts",
      iconKey: "file-text",
      section: "Content",
      order: 4,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.BLOG_POST },
    },
    crud: {
      key: "platformBlogPosts",
      mode: "platform",
      tenantScope: false,
      operations: crudFull(SUBJECTS.BLOG_POST),
    },
  },

  {
    moduleKey: "tenant.dashboard",
    scope: "tenant",
    subject: SUBJECTS.ORGANIZATION,
    routeBase: "/tenant/dashboard",
    navigation: {
      title: "Dashboard",
      path: "/tenant/dashboard",
      iconKey: "layout-dashboard",
      section: "Main",
      order: 1,
    },
  },
  {
    moduleKey: "tenant.analytics",
    scope: "tenant",
    subject: SUBJECTS.ANALYTICS,
    routeBase: "/tenant/analytics",
    navigation: {
      title: "Analytics",
      path: "/tenant/analytics",
      iconKey: "trending-up",
      section: "Main",
      order: 2,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.ANALYTICS },
    },
  },
  {
    moduleKey: "tenant.branches",
    scope: "tenant",
    subject: SUBJECTS.BRANCH,
    routeBase: "/tenant/branches",
    navigation: {
      title: "Branches",
      path: "/tenant/branches",
      iconKey: "building-2",
      section: "Management",
      order: 2,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.BRANCH },
    },
    crud: {
      key: "branches",
      mode: "tenant",
      tenantScope: true,
      operations: crudFull(SUBJECTS.BRANCH),
    },
  },
  {
    moduleKey: "tenant.users",
    scope: "tenant",
    subject: SUBJECTS.USER,
    routeBase: "/tenant/users",
    navigation: {
      title: "Users",
      path: "/tenant/users",
      iconKey: "users",
      section: "Management",
      order: 3,
      visibleWhen: { action: ACTIONS.DISPLAY_LINK, subject: SUBJECTS.USER },
    },
    crud: {
      key: "tenantUsers",
      mode: "tenant",
      tenantScope: true,
      operations: crudFull(SUBJECTS.USER),
    },
    supportEndpoints: [
      {
        endpointKey: "roles-options",
        method: "GET",
        path: "/roles",
        allowedWhen: {
          anyOf: [
            { action: ACTIONS.READ, subject: SUBJECTS.ROLE },
            { action: ACTIONS.CREATE, subject: SUBJECTS.USER },
            { action: ACTIONS.UPDATE, subject: SUBJECTS.USER },
          ],
        },
      },
    ],
  },
];

export function buildCrudAccessFromPolicies(): Record<string, CrudAccessConfig> {
  const result: Record<string, CrudAccessConfig> = {};
  for (const policy of MODULE_POLICIES) {
    if (!policy.crud) continue;
    result[policy.crud.key] = {
      mode: policy.crud.mode,
      tenantScope: policy.crud.tenantScope ?? policy.crud.mode === "tenant",
      abilities: policy.crud.operations,
    } satisfies CrudAccessConfig;
  }
  return result;
}

export function getSupportEndpointRequirements(
  moduleKey: string,
  endpointKey: string,
): PermissionExpression | undefined {
  const policy = MODULE_POLICIES.find((item) => item.moduleKey === moduleKey);
  const endpoint = policy?.supportEndpoints?.find((item) => item.endpointKey === endpointKey);
  return endpoint?.allowedWhen;
}

function validateModulePolicies() {
  const moduleKeySet = new Set<string>();
  const crudKeySet = new Set<string>();

  for (const policy of MODULE_POLICIES) {
    if (moduleKeySet.has(policy.moduleKey)) {
      throw new Error(`Duplicate module policy key: ${policy.moduleKey}`);
    }
    moduleKeySet.add(policy.moduleKey);

    if (policy.navigation?.path && policy.navigation.path !== "#") {
      if (!policy.navigation.path.startsWith("/")) {
        throw new Error(
          `Navigation path for ${policy.moduleKey} must start with '/' or be '#': ${policy.navigation.path}`,
        );
      }
    }

    if (policy.crud) {
      if (crudKeySet.has(policy.crud.key)) {
        throw new Error(`Duplicate CRUD access key in module policies: ${policy.crud.key}`);
      }
      crudKeySet.add(policy.crud.key);
    }

    for (const endpoint of policy.supportEndpoints ?? []) {
      const hasAny = !!endpoint.allowedWhen.anyOf?.length;
      const hasAll = !!endpoint.allowedWhen.allOf?.length;
      if (!hasAny && !hasAll) {
        throw new Error(
          `Support endpoint policy ${policy.moduleKey}:${endpoint.endpointKey} must define anyOf and/or allOf`,
        );
      }
    }
  }
}

validateModulePolicies();
