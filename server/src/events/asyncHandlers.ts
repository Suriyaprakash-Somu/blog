import type { OutboxHandlers } from "./outboxProcessor.js";

/**
 * Async Outbox Handlers
 * These handlers process events asynchronously via the outbox pattern
 * Perfect for side effects like sending emails, notifications, etc.
 */
export const OUTBOX_HANDLERS: OutboxHandlers = {
  // Example: Send welcome email when branch is created
  // [BRANCH_EVENTS.CREATED]: [
  //   {
  //     name: "SendBranchCreatedNotification",
  //     async handle(envelope: EventEnvelope, { log }) {
  //       const branch = envelope.data;
  //       log?.info(`[Outbox] Sending notification for new branch: ${branch.name}`);
  //       // Implement email sending logic here
  //     },
  //   },
  // ],
  
  // Example: Sync with external system when branch is updated
  // [BRANCH_EVENTS.UPDATED]: [
  //   {
  //     name: "SyncBranchToExternalSystem",
  //     async handle(envelope: EventEnvelope, { log }) {
  //       const { id, changes } = envelope.data;
  //       log?.info(`[Outbox] Syncing branch ${id} changes to external system`);
  //       // Implement external API call here
  //     },
  //   },
  // ],
};
