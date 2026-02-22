import fs from "node:fs";
import path from "node:path";
import { and, eq, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { logAudit } from "../../audit/auditLogger.js";
import { env } from "../../common/env.js";
import type { DbConn } from "../../db/types.js";
import { uploadedFiles } from "./uploadedFiles.schema.js";

type LogLike = {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};

function uploadsDir(): string {
  return path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR);
}

export async function purgeExpiredUploadOrphans(params: {
  db: DbConn;
  limit: number;
  log?: LogLike;
}) {
  const { db, limit, log } = params;
  const now = new Date();

  const rows = await db
    .select({
      id: uploadedFiles.id,
      tenantId: uploadedFiles.tenantId,
      storageKey: uploadedFiles.storageKey,
      status: uploadedFiles.status,
      expiresAt: uploadedFiles.expiresAt,
    })
    .from(uploadedFiles)
    .where(
      and(
        eq(uploadedFiles.status, "UPLOADED"),
        isNull(uploadedFiles.attachedToId),
        isNotNull(uploadedFiles.expiresAt),
        lt(uploadedFiles.expiresAt, now),
      ),
    )
    .orderBy(sql`${uploadedFiles.expiresAt} asc`)
    .limit(limit);

  if (!rows.length) return { purged: 0 };

  let purged = 0;
  const baseDir = uploadsDir();
  for (const row of rows) {
    const filePath = path.join(baseDir, row.storageKey);
    let lastError: string | null = null;

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await db
      .update(uploadedFiles)
      .set({
        status: "PURGED",
        deletedAt: now,
        lastError,
      })
      .where(eq(uploadedFiles.id, row.id));

    await logAudit({
      db,
      ctx: null,
      action: "uploaded_file.purged",
      resourceType: "uploaded_files",
      resourceId: row.id,
      tenantId: row.tenantId,
      oldValue: row as unknown as Record<string, unknown>,
      newValue: {
        ...row,
        status: "PURGED",
        deletedAt: now.toISOString(),
        lastError,
      },
    });

    purged += 1;
    if (lastError) {
      log?.warn({ fileId: row.id, storageKey: row.storageKey, err: lastError }, "[uploads] Purge failed to delete file on disk");
    }
  }

  log?.info({ purged }, "[uploads] Purged expired upload orphans");
  return { purged };
}
