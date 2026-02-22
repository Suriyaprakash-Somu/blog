import { initializeOutboxProcessor, type OutboxHandlers } from "../events/index.js";
import type { Console } from "node:console";

/**
 * Start the outbox processor to handle async events
 * Runs indefinitely, processing batches every interval
 * 
 * Usage:
 * ```typescript
 * import { startOutboxRunner } from "./utils/outboxRunner.js";
 * import { OUTBOX_HANDLERS } from "../events/asyncHandlers.js";
 * 
 * startOutboxRunner(OUTBOX_HANDLERS, { intervalMs: 5000 });
 * ```
 */
export function startOutboxRunner(
  handlers: OutboxHandlers,
  options: { intervalMs?: number; log?: Console } = {}
): { stop: () => void } {
  const { intervalMs = 5000, log = console } = options;
  
  const processor = initializeOutboxProcessor(handlers);
  let isRunning = true;
  
  async function processLoop() {
    while (isRunning) {
      try {
        await processor.processOnce();
      } catch (error) {
        log.error("[OutboxRunner] Error processing events:", error);
      }
      
      // Wait before next batch
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  
  // Start the loop
  void processLoop();
  
  log.info(`[OutboxRunner] Started with ${intervalMs}ms interval`);
  
  // Return stop function
  return {
    stop: () => {
      isRunning = false;
      log.info("[OutboxRunner] Stopped");
    },
  };
}

/**
 * Process outbox once (for manual triggering or cron jobs)
 */
export async function processOutboxOnce(
  handlers: OutboxHandlers,
  log: Console = console
): Promise<void> {
  const processor = initializeOutboxProcessor(handlers);
  log.info("[OutboxRunner] Processing outbox once");
  await processor.processOnce();
}
