// Schema barrel export - re-exports all schemas from domain modules

// Roles
export * from "../../modules/roles/platform/platform.schema.js";
export * from "../../modules/roles/tenant/tenant.schema.js";

// Users (Better Auth pattern)
export * from "../../modules/users/platform/platform.schema.js";
export * from "../../modules/users/tenant/tenant.schema.js";

// Mobile auth
export * from "../../modules/auth/tenant/refreshTokens.schema.js";

// Tenants
export * from "../../modules/tenants/tenants.schema.js";

// Uploads
export * from "../../modules/uploads/uploadedFiles.schema.js";

// Branches
export * from "../../modules/branches/branches.schema.js";

// Events (Outbox pattern)
export * from "./events.js";

// Audit Logs
export * from "./auditLogs.js";

// Banners
export * from "../../modules/banners/banners.schema.js";

// Analytics
export * from "../../modules/analytics/analytics.schema.js";
