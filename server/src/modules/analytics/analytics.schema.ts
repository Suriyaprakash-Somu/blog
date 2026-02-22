import {
  index,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { tenants } from "../tenants/tenants.schema.js";
import { tenantUser } from "../users/tenant/tenant.schema.js";

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    eventData: jsonb("event_data").notNull().default({}),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    userId: uuid("user_id").references(() => tenantUser.id, { onDelete: "set null" }),
    sessionId: text("session_id"),
    ip: varchar("ip", { length: 45 }),
  },
  (table) => ({
    tenantTypeTimeIdx: index("analytics_events_tenant_type_time_idx").on(
      table.tenantId,
      table.eventType,
      table.timestamp,
    ),
    timeIdx: index("analytics_events_time_idx").on(table.timestamp),
  }),
);

export const analyticsDailyMetrics = pgTable(
  "analytics_daily_metrics",
  {
    date: timestamp("date").notNull(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    count: numeric("count", { precision: 14, scale: 0 }).notNull().default("0"),
    sumValue: numeric("sum_value", { precision: 18, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.date, table.tenantId, table.eventType] }),
  }),
);

export const analyticsDashboardCache = pgTable("analytics_dashboard_cache", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
