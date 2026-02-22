import { getEventBus } from "../EventBus.js";
import { BRANCH_EVENTS } from "../events.js";
import { getCache } from "../../core/cache.js";
import type { EventHandlerPayload } from "../EventBus.js";
import { logger } from "../../core/logger.js";

function getString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Register tenant-scoped event handlers
 * These handlers run synchronously within the transaction
 */
export function registerTenantHandlers() {
  const eventBus = getEventBus();

  // Branch Created - Audit log and cache invalidation
  eventBus.subscribe(BRANCH_EVENTS.CREATED, async ({ payload }: EventHandlerPayload) => {
    const data = payload as Record<string, unknown>;
    const tenantId = getString(data, "tenantId");

    // Invalidate list cache
    if (tenantId) {
      const cache = getCache();
      await cache.invalidateTag(`branches:${tenantId}`);
    }

    const id = getString(data, "id") ?? getString(data, "name") ?? "unknown";
    logger.info(`[Audit] Branch created: ${id} in tenant ${tenantId}`);
  });

  // Branch Updated - Audit log and cache invalidation
  eventBus.subscribe(BRANCH_EVENTS.UPDATED, async ({ payload }: EventHandlerPayload) => {
    const data = payload as Record<string, unknown>;
    const tenantId = getString(data, "tenantId");
    const id = getString(data, "id");

    // Invalidate both list and detail cache
    if (tenantId) {
      const cache = getCache();
      await cache.invalidateTag(`branches:${tenantId}`);
      if (id) {
        await cache.delete(`branch:${tenantId}:${id}`);
      }
    }

    logger.info(`[Audit] Branch updated: ${id} in tenant ${tenantId}`);
  });

  // Branch Deleted - Audit log and cache invalidation
  eventBus.subscribe(BRANCH_EVENTS.DELETED, async ({ payload }: EventHandlerPayload) => {
    const data = payload as Record<string, unknown>;
    const tenantId = getString(data, "tenantId");
    const id = getString(data, "id");

    // Invalidate both list and detail cache
    if (tenantId) {
      const cache = getCache();
      await cache.invalidateTag(`branches:${tenantId}`);
      if (id) {
        await cache.delete(`branch:${tenantId}:${id}`);
      }
    }

    logger.info(`[Audit] Branch deleted: ${id} from tenant ${tenantId}`);
  });

  logger.info("[Handlers] Tenant handlers registered");
}
