import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

import { tenants } from "../tenants/tenants.schema.js";
import { uploadedFiles } from "../uploads/uploadedFiles.schema.js";
import { tenantUser } from "../users/tenant/tenant.schema.js";

/**
 * Branches - Physical locations belonging to a tenant
 */
export const branches = pgTable("branches", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  // Core
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  type: varchar("type", { length: 50 }).notNull().default("farm"), // farm, outlet, warehouse, office
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive

  // Image (required)
  imageFileId: uuid("image_file_id").references(() => uploadedFiles.id),

  // Address (editable by user)
  addressLine1: varchar("address_line_1", { length: 255 }),
  addressLine2: varchar("address_line_2", { length: 255 }),

  // Address (from MapPicker - disabled/readonly)
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  pincode: varchar("pincode", { length: 20 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),

  // Contact
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  managerId: uuid("manager_id").references(() => tenantUser.id),

  // Tax/Legal (India)
  gstin: varchar("gstin", { length: 15 }),

  // Operations
  isHeadquarters: boolean("is_headquarters").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relations
export const branchesRelations = relations(branches, ({ one }) => ({
  tenant: one(tenants, {
    fields: [branches.tenantId],
    references: [tenants.id],
  }),
  manager: one(tenantUser, {
    fields: [branches.managerId],
    references: [tenantUser.id],
  }),
  image: one(uploadedFiles, {
    fields: [branches.imageFileId],
    references: [uploadedFiles.id],
  }),
}));

// Types
export type Branch = InferSelectModel<typeof branches>;
export type NewBranch = InferInsertModel<typeof branches>;
