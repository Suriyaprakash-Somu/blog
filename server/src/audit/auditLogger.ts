import { auditLogs } from "../db/schema/auditLogs.js";
import { logger } from "../core/logger.js";
import { uuidv7 } from "uuidv7";
import type { DbConn } from "../db/types.js";

interface AuditLogParams {
  db: DbConn;
  ctx?: unknown;
  action: string;
  resourceType: string;
  resourceId: string;
  tenantId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export async function logAudit({
  db,
  ctx,
  action,
  resourceType,
  resourceId,
  tenantId,
  oldValue = null,
  newValue = null,
  metadata = {},
}: AuditLogParams) {
  if (!db) return;

  try {
    const ctxRecord = ctx && typeof ctx === "object" ? (ctx as Record<string, unknown>) : null;
    const request = (ctxRecord && "req" in ctxRecord ? ctxRecord.req : ctx) as unknown;

    type TenantSessionLike = {
      user?: { id?: string; tenantId?: string | null };
      tenant?: { id?: string | null };
      impersonator?: { adminId?: string | null };
    };
    type TenantRequestLike = { tenantSession?: TenantSessionLike };
    type PlatformRequestLike = { platformUser?: { user?: { id?: string } } };
    const req = request && typeof request === "object" ? (request as TenantRequestLike & PlatformRequestLike) : null;

    let actorId = "system";
    let actorType = "system";
    let impersonatedByAdminId: string | null = null;
    let resolvedTenantId: string | null = tenantId ?? null;

    if (req?.tenantSession) {
      actorId = req.tenantSession.user?.id || "unknown";
      actorType = "user";
      resolvedTenantId =
        resolvedTenantId ??
        req.tenantSession.tenant?.id ??
        req.tenantSession.user?.tenantId ??
        null;

      if (req.tenantSession.impersonator?.adminId) {
        impersonatedByAdminId = req.tenantSession.impersonator.adminId;
      }
    } else if (req?.platformUser) {
      actorId = req.platformUser.user?.id || "unknown";
      actorType = "admin";
    }

    await db.insert(auditLogs).values({
      id: uuidv7(),
      tenantId: resolvedTenantId,
      action,
      resourceType,
      resourceId,
      actorId,
      actorType,
      impersonatedByAdminId,
      oldValue,
      newValue,
      metadata,
    });
  } catch (error) {
    logger.error({ err: error }, "[Audit] Failed to log event");
  }
}
