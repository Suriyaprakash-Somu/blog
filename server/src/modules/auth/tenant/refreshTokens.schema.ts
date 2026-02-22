import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import { tenants } from "../../tenants/tenants.schema.js";
import { tenantUser } from "../../users/tenant/tenant.schema.js";

// Refresh tokens for mobile/bearer auth (hashed at rest)
export const tenantRefreshTokens = pgTable(
  "tenant_refresh_tokens",
  {
    id: uuid("id").primaryKey().$defaultFn(uuidv7),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => tenantUser.id, { onDelete: "cascade" }),

    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    deviceId: varchar("device_id", { length: 128 }),
    deviceInfo: text("device_info"),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),

    expiresAt: timestamp("expires_at").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
    replacedByTokenId: uuid("replaced_by_token_id"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("tenant_refresh_tokens_token_hash_uidx").on(table.tokenHash),
    userIdx: index("tenant_refresh_tokens_user_idx").on(table.userId),
    tenantUserIdx: index("tenant_refresh_tokens_tenant_user_idx").on(
      table.tenantId,
      table.userId,
    ),
  }),
);

export type TenantRefreshToken = InferSelectModel<typeof tenantRefreshTokens>;
export type NewTenantRefreshToken = InferInsertModel<typeof tenantRefreshTokens>;
