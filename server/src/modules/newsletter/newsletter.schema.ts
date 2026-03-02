import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    // For multi-tenant context (optional for global landing page)
    tenantId: uuid("tenant_id"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
