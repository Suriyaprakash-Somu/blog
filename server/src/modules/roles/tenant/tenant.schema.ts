import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { tenants } from "../../tenants/tenants.schema.js";

/**
 * Tenant Roles Table
 * For tenant users: owner, admin, manager, member
 */
export const tenantRoles = pgTable("tenant_roles", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  // Optional: supports future tenant-scoped custom roles.
  // System roles keep tenantId = null.
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default([]),
  isSystem: boolean("is_system").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  tenantIndex: index("tenant_roles_tenant_idx").on(table.tenantId),
}));

export const TENANT_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
} as const;

export type TenantRole = (typeof TENANT_ROLES)[keyof typeof TENANT_ROLES];
