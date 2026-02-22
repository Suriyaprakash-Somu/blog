import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

/**
 * Platform Roles Table
 * For platform admins: super_admin, platform_admin
 */
export const platformRoles = pgTable(
  "platform_roles",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    name: varchar("name", { length: 50 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    description: text("description"),
    permissions: jsonb("permissions").notNull().default([]),
    isSystem: boolean("is_system").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
  }
);

export const PLATFORM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];
