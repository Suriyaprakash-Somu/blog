import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Roles Table
 *
 * System roles with two scopes:
 * - "platform": For platform admins (super_admin, platform_admin)
 * - "tenant": For tenant users (owner, admin, manager, member)
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    description: text("description"),
    permissions: jsonb("permissions").notNull().default([]),
    scope: varchar("scope", { length: 20 }).notNull().default("tenant"), // 'platform' | 'tenant'
    isSystem: boolean("is_system").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("roles_slug_scope_unique").on(table.slug, table.scope),
  ]
);

/**
 * Default system role slugs
 */
export const SYSTEM_ROLES = {
  // Platform roles
  SUPER_ADMIN: "super_admin",
  PLATFORM_ADMIN: "platform_admin",

  // Tenant roles
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
} as const;

export type RoleScope = "platform" | "tenant";
export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
