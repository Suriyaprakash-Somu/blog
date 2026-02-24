/**
 * Shared Permission Actions
 */
export const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
  DISPLAY_LINK: "display_link",
  APPROVE: "approve",
  REJECT: "reject",
  EXPORT: "export",
  IMPORT: "import",
  ASSIGN: "assign",
  TRANSFER: "transfer",
} as const;

export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

/**
 * Shared Permission Subjects
 */
export const SUBJECTS = {
  ALL: "all",
  ORGANIZATION: "Organization",
  TENANT: "Tenant",
  PLATFORM_ADMIN: "PlatformAdmin",
  USER: "User",
  ROLE: "Role",
  BRANCH: "Branch",
  AUDIT_LOG: "AuditLog",
  BANNER: "Banner",
  ANALYTICS: "Analytics",
  BLOG_CATEGORY: "BlogCategory",
  BLOG_TAG: "BlogTag",
  PLATFORM_SETTINGS: "PlatformSettings",
} as const;

export type Subject = (typeof SUBJECTS)[keyof typeof SUBJECTS];
