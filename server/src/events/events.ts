/**
 * Branch Events
 */
export const BRANCH_EVENTS = {
  CREATED: "branch.created",
  UPDATED: "branch.updated",
  DELETED: "branch.deleted",
} as const;

/**
 * Tenant Events
 */
export const TENANT_EVENTS = {
  CREATED: "tenant.created",
  UPDATED: "tenant.updated",
  DELETED: "tenant.deleted",
} as const;

/**
 * Auth Events
 */
export const AUTH_EVENTS = {
  USER_REGISTERED: "auth.user.registered",
  USER_LOGGED_IN: "auth.user.loggedIn",
  USER_LOGGED_OUT: "auth.user.loggedOut",
  PASSWORD_CHANGED: "auth.password.changed",
} as const;

/**
 * Upload Events
 */
export const UPLOAD_EVENTS = {
  CREATED: "upload.created",
  DELETED: "upload.deleted",
} as const;
