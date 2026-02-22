import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { tenants } from "../../modules/tenants/tenants.schema.js";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

  // What happened
  action: varchar("action", { length: 100 }).notNull(),

  // What was affected
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: varchar("resource_id", { length: 36 }).notNull(),

  // Who did it
  actorId: varchar("actor_id", { length: 36 }).notNull(),
  actorType: varchar("actor_type", { length: 20 }).notNull(),

  // Impersonation tracking
  impersonatedByAdminId: varchar("impersonated_by_admin_id", { length: 36 }),

  // Changes
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index("audit_logs_tenant_idx").on(table.tenantId),
  tenantRequiredForUserActor: check(
    "audit_logs_tenant_required_for_user_actor",
    sql`(${table.actorType} <> 'user') OR (${table.tenantId} IS NOT NULL)`,
  ),
}));
