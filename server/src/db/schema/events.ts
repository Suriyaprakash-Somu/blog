import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
  integer,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Outbox Events Table
 * Stores events for async processing with retry logic
 */
export const outboxEvents = pgTable("outbox_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(5),
  nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockedBy: varchar("locked_by", { length: 64 }),
  lastError: text("last_error"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Processed Events Table
 * Tracks which handlers have processed which events (for idempotency)
 */
export const processedEvents = pgTable(
  "processed_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    eventId: varchar("event_id", { length: 36 }).notNull(),
    handler: varchar("handler", { length: 100 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastError: text("last_error"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    eventHandlerUnique: uniqueIndex("processed_events_event_handler_unique").on(
      t.eventId,
      t.handler
    ),
  })
);
