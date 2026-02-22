import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { tenantRoles } from "../../roles/tenant/tenant.schema.js";
import { tenants } from "../../tenants/tenants.schema.js";
import { platformUser } from "../platform/platform.schema.js";

/**
 * Tenant User - Organization members
 */
export const tenantUser = pgTable("tenant_user", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: varchar("phone", { length: 20 }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  roleId: uuid("role_id").references(() => tenantRoles.id),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  tenantIndex: index("tenant_user_tenant_idx").on(table.tenantId),
  tenantEmailUnique: uniqueIndex("tenant_user_tenant_email_unique").on(table.tenantId, table.email),
}));

/**
 * Tenant User Session
 */
export const tenantUserSession = pgTable("tenant_user_session", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid("user_id").notNull().references(() => tenantUser.id, { onDelete: "cascade" }),
  impersonatorAdminId: uuid("impersonator_admin_id").references(() => platformUser.id, {
    onDelete: "set null",
  }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Tenant User Account - For OAuth and credentials
 */
export const tenantUserAccount = pgTable("tenant_user_account", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid("user_id").notNull().references(() => tenantUser.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 50 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Tenant User Verification - Email verification, password reset, etc.
 */
export const tenantUserVerification = pgTable("tenant_user_verification", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tenantUserRelations = relations(tenantUser, ({ one }) => ({
  account: one(tenantUserAccount, {
    fields: [tenantUser.id],
    references: [tenantUserAccount.userId],
  }),
}));

export const tenantUserAccountRelations = relations(tenantUserAccount, ({ one }) => ({
  user: one(tenantUser, {
    fields: [tenantUserAccount.userId],
    references: [tenantUser.id],
  }),
}));
