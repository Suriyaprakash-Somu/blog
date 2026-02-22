export const Actions = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage",
  DISPLAY_LINK: "display_link",
} as const;

export const Subjects = {
  ALL: "all",
  ORGANIZATION: "Organization",
  PLATFORM_ADMIN: "PlatformAdmin",
  USER: "User",
  ROLE: "Role",
  BRANCH: "Branch",
  AUDIT_LOG: "AuditLog",
  TENANT: "Tenant",
  BANNER: "Banner",
  ANALYTICS: "Analytics",
} as const;

export type AppAction = (typeof Actions)[keyof typeof Actions];
export type AppSubject = (typeof Subjects)[keyof typeof Subjects];
