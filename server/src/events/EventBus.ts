/**
 * Event Bus Interface
 *
 * Abstract interface for event-driven architecture.
 * Can be swapped for Redis, RabbitMQ, etc.
 */

import { uuidv7 } from "uuidv7";
import { outboxEvents } from "../db/schema/events.js";
import { logger } from "../core/logger.js";
import type { DbConn } from "../db/types.js";

export interface EventEnvelope<T = unknown> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  correlationId: string;
  causationId: string | null;
  aggregateType: string | null;
  aggregateId: string | null;
  schemaVersion: number;
  data: T;
}

export interface EventContext {
  tx?: DbConn;
  correlationId?: string;
  causationId?: string | null;
  eventDepth?: number;
  requestId?: string;
  [key: string]: unknown;
}

export interface EventMetadata {
  aggregateType?: string;
  aggregateId?: string;
}

export interface EventHandlerPayload<T = unknown> {
  eventType: string;
  eventId: string;
  payload: T;
  envelope: EventEnvelope<T>;
  ctx: EventContext;
}

export type EventHandler<T = unknown> = (payload: EventHandlerPayload<T>) => Promise<void>;

function parseOptionalPositiveInt(value: string | undefined): number | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function buildEnvelope<T>(
  eventType: string,
  data: T,
  ctx: EventContext,
  meta: EventMetadata = {}
): EventEnvelope<T> {
  const occurredAt = new Date().toISOString();
  const eventId = uuidv7();

  return {
    eventId,
    eventType,
    occurredAt,
    correlationId: ctx?.correlationId || ctx?.requestId || uuidv7(),
    causationId: ctx?.causationId ?? null,
    aggregateType: meta.aggregateType ?? null,
    aggregateId: meta.aggregateId ?? null,
    schemaVersion: 1,
    data,
  };
}

class InMemoryEventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  constructor() {
    logger.info("[EventBus] InMemory event bus initialized");
  }

  async emitStrict<T>(
    eventType: string,
    data: T,
    ctx: EventContext = {},
    meta: EventMetadata = {}
  ): Promise<EventEnvelope<T>> {
    if (!ctx?.tx) {
      throw new Error(`emitStrict(${eventType}) requires ctx.tx`);
    }

    const maxDepth = parseOptionalPositiveInt(process.env.EVENT_MAX_DEPTH);
    const currentDepth = typeof ctx.eventDepth === "number" ? ctx.eventDepth : 0;
    if (maxDepth !== null && currentDepth >= maxDepth) {
      throw new Error(
        `Event depth exceeded for ${eventType} (depth=${currentDepth}, max=${maxDepth})`
      );
    }

    const envelope = buildEnvelope(eventType, data, ctx, meta);

    const nextCtx: EventContext = {
      ...ctx,
      eventDepth: currentDepth + 1,
      correlationId: envelope.correlationId,
    };

    const handlers = this.handlers.get(eventType) || [];
    const wildcardHandlers = this.handlers.get("*") || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    for (const handler of allHandlers) {
      await handler({
        eventType: envelope.eventType,
        eventId: envelope.eventId,
        payload: envelope.data,
        envelope,
        ctx: nextCtx,
      });
    }

    return envelope;
  }

  async enqueueOutbox<T>(
    eventType: string,
    data: T,
    ctx: EventContext = {},
    meta: EventMetadata = {}
  ): Promise<EventEnvelope<T>> {
    if (!ctx?.tx) {
      throw new Error(`enqueueOutbox(${eventType}) requires ctx.tx`);
    }

    const envelope = buildEnvelope(eventType, data, ctx, meta);

    await ctx.tx.insert(outboxEvents).values({
      id: envelope.eventId,
      eventType: envelope.eventType,
      payload: envelope,
      status: "PENDING",
      retryCount: 0,
      maxRetries: 5,
      nextRetryAt: null,
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    });

    return envelope;
  }

  async publish<T>(
    eventType: string,
    data: T,
    ctx: EventContext = {},
    meta: EventMetadata = {}
  ): Promise<EventEnvelope<T>> {
    if (ctx?.tx) {
      throw new Error(
        `publish(${eventType}) is not allowed inside a transaction; use emitStrict or enqueueOutbox`
      );
    }

    const envelope = buildEnvelope(eventType, data, ctx, meta);

    const handlers = this.handlers.get(eventType) || [];
    const wildcardHandlers = this.handlers.get("*") || [];
    const allHandlers = [...handlers, ...wildcardHandlers];

    for (const handler of allHandlers) {
      try {
        await handler({
          eventType: envelope.eventType,
          eventId: envelope.eventId,
          payload: envelope.data,
          envelope,
          ctx,
        });
      } catch (error) {
        logger.error({ err: error }, `[EventBus] Handler error for ${eventType}`);
      }
    }

    return envelope;
  }

  /**
   * Subscribe to an event
   * @param event - Event name (or '*' for all)
   * @param handler - Handler function
   * @returns Unsubscribe function
   */
  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler as EventHandler);

    logger.info(`[EventBus] Subscribed to: ${event}`);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event) || [];
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Close the event bus
   */
  async close(): Promise<void> {
    this.handlers.clear();
    logger.info("[EventBus] Closed");
  }
}

// Singleton instance
let eventBus: InMemoryEventBus | null = null;

/**
 * Get or create the event bus instance
 */
export function getEventBus(): InMemoryEventBus {
  if (!eventBus) {
    eventBus = new InMemoryEventBus();
  }
  return eventBus;
}

/**
 * Initialize the event bus
 */
export async function initializeEventBus(): Promise<InMemoryEventBus> {
  return getEventBus();
}

/**
 * Close the event bus
 */
export async function closeEventBus(): Promise<void> {
  if (eventBus) {
    await eventBus.close();
    eventBus = null;
  }
}

// Export the class for testing
export { InMemoryEventBus };
