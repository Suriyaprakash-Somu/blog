# Event-Driven Architecture

This document describes the event-driven architecture implemented in the Livestock Manager server.

## Overview

The server implements a robust event-driven architecture with three event publishing modes:

1. **emitStrict** - Synchronous event handling within database transactions
2. **enqueueOutbox** - Asynchronous event processing via the Outbox pattern
3. **publish** - Immediate event handling outside of transactions

## Event Bus

The Event Bus is implemented as an in-memory pub/sub system that can be swapped for Redis or other message brokers.

### Key Features

- **Event Envelopes**: All events include metadata (eventId, correlationId, causationId, timestamps)
- **Loop Protection**: Event depth limiting prevents infinite event cascades
- **Transaction Safety**: Events participate in database transactions
- **Idempotency**: Outbox processor tracks processed events to prevent duplicates

## Usage

### Basic Event Emission

```typescript
import { getEventBus } from "../events/index.js";

const eventBus = getEventBus();

// Emit event synchronously within transaction
await eventBus.emitStrict(
  "branch.created",
  { id: "123", name: "Main Branch" },
  { tx, correlationId: "abc-123" },
  { aggregateType: "branch", aggregateId: "123" }
);

// Queue event for async processing
await eventBus.enqueueOutbox(
  "email.welcome",
  { email: "user@example.com" },
  { tx },
  { aggregateType: "user", aggregateId: "user-123" }
);
```

### CRUD Factory Events

Events are automatically emitted when using the CRUD factory with event configuration:

```typescript
export const tenantBranchesRoutes = createCrudRoutes({
  table: branches,
  cache: {
    tag: "branches",
    keyPrefix: "branch",
  },
  searchableColumns: SEARCHABLE_COLUMNS,
  columnMap: COLUMN_MAP,
  
  // Event configuration
  events: {
    resource: "branch",
    emitOn: ["create", "update", "delete"],
    enrichPayload: true,    // Include full entity in event
    includeDiff: true,      // Include changes in update events
  },
});
```

This configuration will automatically emit:
- `branch.created` - When a new branch is created
- `branch.updated` - When a branch is updated
- `branch.deleted` - When a branch is deleted

### Event Handlers

Register event handlers in the appropriate handler file:

```typescript
// src/events/tenant/index.ts
import { getEventBus } from "../EventBus.js";
import { BRANCH_EVENTS } from "../events.js";

export function registerTenantHandlers() {
  const eventBus = getEventBus();
  
  eventBus.subscribe(BRANCH_EVENTS.CREATED, async ({ payload, ctx }) => {
    console.log(`Branch created: ${payload.name}`);
    // Perform side effects (audit logging, cache invalidation, etc.)
  });
}
```

## Outbox Pattern

The Outbox pattern ensures reliable async event processing:

1. Events are stored in the `outbox_events` table within the same transaction as business logic
2. The OutboxProcessor polls pending events and processes them
3. Each handler tracks completion in `processed_events` for idempotency
4. Failed events are retried with exponential backoff

### Database Schema

#### outbox_events
- Stores pending events for async processing
- Tracks retry count and next retry time
- Supports distributed locking (lockedAt, lockedBy)

#### processed_events
- Tracks which handlers have processed which events
- Prevents duplicate processing
- Supports handler-level retries

## Configuration

Environment variables:

```env
# Event depth limit to prevent infinite loops
EVENT_MAX_DEPTH=10

# Outbox processing
OUTBOX_BATCH_SIZE=50
OUTBOX_PROCESSING_STALE_MS=600000  # 10 minutes
OUTBOX_HANDLER_STALE_MS=600000     # 10 minutes
```

## Event Types

### Branch Events
- `branch.created`
- `branch.updated`
- `branch.deleted`

### Tenant Events
- `tenant.created`
- `tenant.updated`
- `tenant.deleted`

### Auth Events
- `auth.user.registered`
- `auth.user.loggedIn`
- `auth.user.loggedOut`

### Upload Events
- `upload.created`
- `upload.deleted`

## Best Practices

1. **Use emitStrict for synchronous side effects** that must complete with the transaction (audit logging, cache invalidation)

2. **Use enqueueOutbox for async side effects** that can be processed later (emails, notifications, external API calls)

3. **Always provide aggregate metadata** to enable event sourcing and debugging

4. **Use correlationId** to trace related events through the system

5. **Keep handlers idempotent** - they may be called multiple times due to retries

6. **Handle errors gracefully** - don't let handler errors break the main transaction

## Future Enhancements

- Redis adapter for distributed deployments
- Webhook support for external integrations
- Dead letter queue for failed events
- Event replay capability
