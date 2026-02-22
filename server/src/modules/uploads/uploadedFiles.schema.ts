import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { tenants } from "../tenants/tenants.schema.js";

/**
 * Uploaded Files - Tracks file uploads with lifecycle management
 * Status: UPLOADED -> ATTACHED -> DELETED/PURGED
 */
export const uploadedFiles = pgTable(
  "uploaded_files",
  {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),

  // Ownership + visibility
  // tenantId: set for tenant-auth uploads (including platform impersonation)
  // isPublic: when true, anyone can read metadata/content
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  isPublic: boolean("is_public").notNull().default(false),

  storageKey: varchar("storage_key", { length: 255 }).notNull().unique(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 150 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),

  // Lifecycle status: UPLOADED, ATTACHED, DELETED, PURGED, MISSING
  status: varchar("status", { length: 20 }).notNull().default("UPLOADED"),

  // Entity attachment (polymorphic)
  attachedToType: varchar("attached_to_type", { length: 50 }),
  attachedToId: uuid("attached_to_id"),
  attachedAt: timestamp("attached_at"),

  // Orphan cleanup
  expiresAt: timestamp("expires_at"),
  deletedAt: timestamp("deleted_at"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  // Error tracking
  lastError: text("last_error"),
  },
  (table) => ({
    tenantIndex: index("uploaded_files_tenant_idx").on(table.tenantId),
    publicIndex: index("uploaded_files_public_idx").on(table.isPublic),
    tenantPublicIndex: index("uploaded_files_tenant_public_idx").on(table.tenantId, table.isPublic),
    statusIndex: index("uploaded_files_status_idx").on(table.status),
    tenantStatusIndex: index("uploaded_files_tenant_status_idx").on(table.tenantId, table.status),
    attachedIndex: index("uploaded_files_attached_idx").on(table.attachedToType, table.attachedToId),
    tenantAttachedIndex: index("uploaded_files_tenant_attached_idx").on(
      table.tenantId,
      table.attachedToType,
      table.attachedToId,
    ),
    expiresIndex: index("uploaded_files_expires_idx").on(table.expiresAt),
  }),
);

// Types
export type UploadedFile = InferSelectModel<typeof uploadedFiles>;
export type NewUploadedFile = InferInsertModel<typeof uploadedFiles>;
