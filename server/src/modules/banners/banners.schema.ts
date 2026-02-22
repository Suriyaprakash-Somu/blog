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
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { uploadedFiles } from "../uploads/uploadedFiles.schema.js";
import { platformUser } from "../users/platform/platform.schema.js";

export const bannerTypes = ["HEADER", "CTA"] as const;
export const bannerSegments = ["GUEST", "USER"] as const;

export type BannerType = (typeof bannerTypes)[number];
export type BannerSegment = (typeof bannerSegments)[number];

export const banners = pgTable(
  "banners",
  {
    id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
    title: text("title").notNull(),
    description: text("description"),
    pathPattern: text("path_pattern").notNull(),
    type: varchar("type", { length: 20 }).notNull().default("HEADER"),
    slot: varchar("slot", { length: 100 }),
    targetSegments: jsonb("target_segments").$type<string[]>().default([]),
    imageFileId: uuid("image_file_id").references(() => uploadedFiles.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    props: jsonb("props").default({}),
    createdByAdminId: uuid("created_by_admin_id").references(() => platformUser.id, {
      onDelete: "set null",
    }),
    updatedByAdminId: uuid("updated_by_admin_id").references(() => platformUser.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    typeIndex: index("banners_type_idx").on(table.type),
    activeIndex: index("banners_active_idx").on(table.isActive),
    activeDateIndex: index("banners_active_date_idx").on(table.startDate, table.endDate),
  }),
);

export type Banner = InferSelectModel<typeof banners>;
export type NewBanner = InferInsertModel<typeof banners>;
