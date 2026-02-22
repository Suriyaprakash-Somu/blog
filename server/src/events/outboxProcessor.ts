import { and, eq, isNull, lte, or } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { db } from "../db/index.js";
import { outboxEvents, processedEvents } from "../db/schema/events.js";
import type { EventEnvelope } from "./EventBus.js";
import type { Console } from "node:console";

export interface OutboxHandler {
  name: string;
  handle: (envelope: EventEnvelope, options: { log?: Console }) => Promise<void>;
}

export type OutboxHandlers = Record<string, OutboxHandler[]>;

function now(): Date {
  return new Date();
}

function backoffMs(retryCount: number): number {
  const ms = 1000 * Math.pow(2, Math.max(0, retryCount));
  return Math.min(ms, 60_000);
}

function getOutboxBatchSize(): number {
  const raw = process.env.OUTBOX_BATCH_SIZE;
  if (!raw) return 50;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 50;
  return parsed;
}

function getProcessingStaleMs(): number {
  const raw = process.env.OUTBOX_PROCESSING_STALE_MS;
  if (!raw) return 10 * 60_000; // 10 minutes
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 10 * 60_000;
  return parsed;
}

function getHandlerStaleMs(): number {
  const raw = process.env.OUTBOX_HANDLER_STALE_MS;
  if (!raw) return 10 * 60_000; // 10 minutes
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 10 * 60_000;
  return parsed;
}

export class OutboxProcessor {
  private log: Console;
  private instanceId: string;
  private isRunning: boolean = false;
  private handlers: OutboxHandlers;

  constructor({ log = console, handlers }: { log?: Console; handlers: OutboxHandlers }) {
    this.log = log;
    this.instanceId = uuidv7();
    this.handlers = handlers;
  }

  async processOnce(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      await this.releaseStaleLocks();

      const events = await this.fetchPendingEvents();
      if (events.length === 0) return;

      for (const eventRow of events) {
        await this.processOneEvent(eventRow);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async releaseStaleLocks(): Promise<void> {
    const staleMs = getProcessingStaleMs();
    const cutoff = new Date(Date.now() - staleMs);

    await db
      .update(outboxEvents)
      .set({
        status: "PENDING",
        lockedAt: null,
        lockedBy: null,
      })
      .where(and(eq(outboxEvents.status, "PROCESSING"), lte(outboxEvents.lockedAt, cutoff)));
  }

  private async fetchPendingEvents(): Promise<(typeof outboxEvents.$inferSelect)[]> {
    const batchSize = getOutboxBatchSize();
    const current = now();

    return db
      .select()
      .from(outboxEvents)
      .where(
        and(
          eq(outboxEvents.status, "PENDING"),
          or(isNull(outboxEvents.nextRetryAt), lte(outboxEvents.nextRetryAt, current))
        )
      )
      .orderBy(outboxEvents.createdAt)
      .limit(batchSize);
  }

  private async tryLockEvent(eventId: string): Promise<boolean> {
    const result = await db
      .update(outboxEvents)
      .set({
        status: "PROCESSING",
        lockedAt: now(),
        lockedBy: this.instanceId,
      })
      .where(and(eq(outboxEvents.id, eventId), eq(outboxEvents.status, "PENDING")))
      .returning({ id: outboxEvents.id });

    return result.length === 1;
  }

  private async processOneEvent(eventRow: typeof outboxEvents.$inferSelect): Promise<void> {
    const locked = await this.tryLockEvent(eventRow.id);
    if (!locked) return;

    const envelope: EventEnvelope =
      typeof eventRow.payload === "string"
        ? JSON.parse(eventRow.payload)
        : (eventRow.payload as EventEnvelope);

    const handlers = this.handlers[envelope.eventType] || [];

    try {
      for (const handler of handlers) {
        const shouldRun = await this.beginHandler(eventRow.id, handler.name);
        if (!shouldRun) continue;

        try {
          await handler.handle(envelope, { log: this.log });
          await this.markHandlerCompleted(eventRow.id, handler.name);
        } catch (error) {
          await this.markHandlerFailed(eventRow.id, handler.name, error as Error);
          throw error;
        }
      }

      await db
        .update(outboxEvents)
        .set({
          status: "COMPLETED",
          completedAt: now(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        })
        .where(eq(outboxEvents.id, eventRow.id));
    } catch (error) {
      const nextRetryCount = (eventRow.retryCount ?? 0) + 1;
      const maxRetries = eventRow.maxRetries ?? 5;

      if (nextRetryCount >= maxRetries) {
        await db
          .update(outboxEvents)
          .set({
            status: "FAILED",
            retryCount: nextRetryCount,
            lockedAt: null,
            lockedBy: null,
            lastError: (error as Error)?.message || String(error),
          })
          .where(eq(outboxEvents.id, eventRow.id));
        return;
      }

      const nextRetryAt = new Date(Date.now() + backoffMs(nextRetryCount));

      await db
        .update(outboxEvents)
        .set({
          status: "PENDING",
          retryCount: nextRetryCount,
          nextRetryAt,
          lockedAt: null,
          lockedBy: null,
          lastError: (error as Error)?.message || String(error),
        })
        .where(eq(outboxEvents.id, eventRow.id));
    }
  }

  private async beginHandler(eventId: string, handlerName: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(processedEvents)
      .where(
        and(
          eq(processedEvents.eventId, eventId),
          eq(processedEvents.handler, handlerName)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const row = existing[0];

      if (row.status === "COMPLETED") return false;

      if (row.status === "STARTED") {
        const staleMs = getHandlerStaleMs();
        const startedAt = row.startedAt ? new Date(row.startedAt) : null;
        const isStale =
          startedAt instanceof Date &&
          Number.isFinite(startedAt.getTime()) &&
          Date.now() - startedAt.getTime() > staleMs;

        if (!isStale) return false;
      }

      const nextAttempts = (row.attempts ?? 0) + 1;

      await db
        .update(processedEvents)
        .set({
          status: "STARTED",
          attempts: nextAttempts,
          startedAt: now(),
          completedAt: null,
          lastError: null,
        })
        .where(eq(processedEvents.id, row.id));

      return true;
    }

    try {
      await db.insert(processedEvents).values({
        id: uuidv7(),
        eventId,
        handler: handlerName,
        status: "STARTED",
        attempts: 1,
        startedAt: now(),
        completedAt: null,
        lastError: null,
      });
      return true;
    } catch {
      // Unique constraint violation - another instance is processing
      return false;
    }
  }

  private async markHandlerCompleted(eventId: string, handlerName: string): Promise<void> {
    await db
      .update(processedEvents)
      .set({
        status: "COMPLETED",
        completedAt: now(),
        lastError: null,
      })
      .where(
        and(
          eq(processedEvents.eventId, eventId),
          eq(processedEvents.handler, handlerName)
        )
      );
  }

  private async markHandlerFailed(
    eventId: string,
    handlerName: string,
    error: Error
  ): Promise<void> {
    await db
      .update(processedEvents)
      .set({
        status: "FAILED",
        lastError: error?.message || String(error),
      })
      .where(
        and(
          eq(processedEvents.eventId, eventId),
          eq(processedEvents.handler, handlerName)
        )
      );
  }
}

let processor: OutboxProcessor | null = null;

export function initializeOutboxProcessor(handlers: OutboxHandlers): OutboxProcessor {
  if (!processor) {
    processor = new OutboxProcessor({ handlers });
  }
  return processor;
}

export function getOutboxProcessor(): OutboxProcessor | null {
  return processor;
}
