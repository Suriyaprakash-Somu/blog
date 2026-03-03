import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { and, eq, isNull } from "drizzle-orm";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { uuidv7 } from "uuidv7";
import { logAudit } from "../../audit/auditLogger.js";
import { env } from "../../common/env.js";
import { rateLimitConfig } from "../../core/rateLimit.js";
import { db } from "../../db/index.js";
import { requireAnyAuth } from "../../middlewares/anyAuth.guard.js";
import { getPlatformUserFromSession } from "../../middlewares/auth.guard.js";
import { getTenantFromSession } from "../../middlewares/tenant.guard.js";
import { banners } from "../banners/banners.schema.js";
import { branches } from "../branches/branches.schema.js";
import { purgeExpiredUploadOrphans } from "./orphanCleanup.js";
import { uploadedFiles } from "./uploadedFiles.schema.js";

// Types
interface FileMetaResponse {
  fileId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  isImage: boolean;
  url: string;
  previewUrl: string;
  downloadUrl: string;
}

interface AttachBody {
  entityType: string;
  entityId: string;
}

interface IdParams {
  id: string;
}

type UploadActor =
  | { kind: "tenant"; tenantId: string }
  | { kind: "platform" }
  | { kind: "anonymous" };

type HttpError = Error & { statusCode?: number };

type ExecFileError = Error & {
  code?: number | string;
  killed?: boolean;
  signal?: NodeJS.Signals;
};

function httpError(statusCode: number, message: string): HttpError {
  const err = new Error(message) as HttpError;
  err.statusCode = statusCode;
  return err;
}

const ALLOWED_ATTACH_ENTITY_TYPES = new Set([
  "branch",
  "platform_banner",
]);

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type DbExec = Pick<typeof db, "select">;

async function assertAttachTargetExists(params: {
  tx: DbExec;
  actor: UploadActor;
  entityType: string;
  entityId: string;
}): Promise<void> {
  const { tx, actor, entityType, entityId } = params;

  if (!ALLOWED_ATTACH_ENTITY_TYPES.has(entityType)) {
    throw httpError(400, "Unsupported entityType");
  }
  if (!isUuid(entityId)) {
    throw httpError(400, "entityId must be a UUID");
  }

  if (entityType === "platform_banner") {
    if (actor.kind !== "platform") {
      throw httpError(403, "Forbidden");
    }
    const [row] = await tx
      .select({ id: banners.id })
      .from(banners)
      .where(eq(banners.id, entityId))
      .limit(1);
    if (!row) throw httpError(400, "Invalid entityId");
    return;
  }

  if (actor.kind !== "tenant") {
    throw httpError(403, "Forbidden");
  }

  if (entityType === "branch") {
    const [row] = await tx
      .select({ id: branches.id })
      .from(branches)
      .where(and(eq(branches.id, entityId), eq(branches.tenantId, actor.tenantId)))
      .limit(1);
    if (!row) throw httpError(400, "Invalid entityId");
    return;
  }
}

// Helpers
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getStorageBaseUrl(): string | null {
  const storageUrl = process.env.STORAGE_URL;
  if (!isNonEmptyString(storageUrl)) return null;
  return storageUrl.replace(/\/+$/, "");
}

function getRequestBaseUrl(request: { headers: Record<string, unknown> }): string {
  const host = request.headers.host as string | undefined;
  if (!isNonEmptyString(host)) return "";
  const protoHeader = request.headers["x-forwarded-proto"] as string | undefined;
  const proto = isNonEmptyString(protoHeader) ? protoHeader : "http";
  return `${proto}://${host}`;
}

function uploadsDir(): string {
  return path.resolve(process.cwd(), env.UPLOAD_DIR);
}

function ensureUploadsDir(): void {
  fs.mkdirSync(uploadsDir(), { recursive: true });
}

function safeExtension(filename: string): string {
  const ext = path.extname(filename || "").toLowerCase();
  if (!ext) return "";
  if (!/^\.[a-z0-9]{1,10}$/i.test(ext)) return "";
  return ext;
}

function isImageContentType(contentType: string | undefined): boolean {
  return typeof contentType === "string" && contentType.startsWith("image/");
}

function actorFromRequest(request: FastifyRequest): UploadActor {
  const req = request as FastifyRequest & {
    tenantSession?: { user?: { tenantId?: string } };
    platformUser?: { user?: { id?: string } };
  };

  const tenantId = req.tenantSession?.user?.tenantId;
  if (isNonEmptyString(tenantId)) return { kind: "tenant", tenantId };

  const platformUserId = req.platformUser?.user?.id;
  if (isNonEmptyString(platformUserId)) return { kind: "platform" };

  return { kind: "anonymous" };
}

async function resolveActorForRead(request: FastifyRequest): Promise<UploadActor> {
  const fromRequest = actorFromRequest(request);
  if (fromRequest.kind !== "anonymous") return fromRequest;

  const tenantSession = await getTenantFromSession(request);
  if (tenantSession) return { kind: "tenant", tenantId: tenantSession.user.tenantId };

  const platformSession = await getPlatformUserFromSession(request);
  if (platformSession) return { kind: "platform" };

  return { kind: "anonymous" };
}

function canReadUpload(
  row: { isPublic: boolean; tenantId: string | null },
  actor: UploadActor
): boolean {
  if (row.isPublic) return true;
  if (actor.kind === "platform") return true;
  // Tenant sessions can read tenant-owned files and platform-owned files (tenantId null).
  // This keeps shared platform assets (e.g. banners) readable in tenant UI.
  if (actor.kind === "tenant") return row.tenantId === actor.tenantId || row.tenantId === null;
  return false;
}

function buildWriteWhere(id: string, actor: UploadActor) {
  if (actor.kind === "tenant") {
    return and(eq(uploadedFiles.id, id), eq(uploadedFiles.tenantId, actor.tenantId));
  }
  if (actor.kind === "platform") {
    return and(eq(uploadedFiles.id, id), isNull(uploadedFiles.tenantId));
  }
  return eq(uploadedFiles.id, id);
}

function getAllowedMimeTypes(): Set<string> | null {
  const raw = env.UPLOAD_ALLOWED_MIME?.trim();
  if (!raw) return DEFAULT_UPLOAD_ALLOWED_MIME;

  const lowered = raw.toLowerCase();
  if (lowered === "*" || lowered === "any") return null;

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!values.length) return DEFAULT_UPLOAD_ALLOWED_MIME;
  return new Set(values);
}

const DEFAULT_UPLOAD_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
]);

const PUBLIC_UPLOAD_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function execFileWithTimeout(
  command: string,
  args: string[],
  timeoutMs: number
): Promise<{ exitCode: number; stdout: string; stderr: string; error: ExecFileError | null }> {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: timeoutMs }, (error, stdout, stderr) => {
      const err = (error ? (error as ExecFileError) : null) ?? null;
      const code = err && typeof err.code === "number" ? err.code : err ? 2 : 0;
      resolve({ exitCode: code, stdout: String(stdout ?? ""), stderr: String(stderr ?? ""), error: err });
    });
  });
}

async function scanUpload(params: {
  filePath: string;
}): Promise<{ allowed: boolean; infected: boolean; lastError: string | null }> {
  if (env.UPLOAD_SCAN_MODE === "none") {
    return { allowed: true, infected: false, lastError: null };
  }

  if (env.UPLOAD_SCAN_MODE !== "clamav") {
    return { allowed: true, infected: false, lastError: `Unknown UPLOAD_SCAN_MODE: ${env.UPLOAD_SCAN_MODE}` };
  }

  const { filePath } = params;
  const { exitCode, stdout, stderr, error } = await execFileWithTimeout(
    env.UPLOAD_SCAN_COMMAND,
    ["--no-summary", filePath],
    env.UPLOAD_SCAN_TIMEOUT_MS,
  );

  // clamscan exit codes:
  // 0 = clean, 1 = infected, 2 = error
  if (exitCode === 0) {
    return { allowed: true, infected: false, lastError: null };
  }

  if (exitCode === 1) {
    return { allowed: false, infected: true, lastError: "File failed malware scan" };
  }

  const details = [stdout, stderr].filter(Boolean).join("\n").slice(0, 2000);
  const reason = error?.message ? `${error.message}${details ? `\n${details}` : ""}` : details;

  if (env.UPLOAD_SCAN_FAIL_CLOSED) {
    return { allowed: false, infected: false, lastError: reason || "Upload scanner error" };
  }

  return { allowed: true, infected: false, lastError: reason || "Upload scanner error" };
}

export const __uploadsTest = {
  DEFAULT_UPLOAD_ALLOWED_MIME,
  PUBLIC_UPLOAD_ALLOWED_MIME,
  getAllowedMimeTypes,
  scanUpload,
} as const;

function buildFileUrls(params: {
  request: { headers: Record<string, unknown> };
  fileId: string;
  storageKey: string;
}): { url: string; previewUrl: string; downloadUrl: string } {
  const { request, fileId, storageKey } = params;
  const storageBase = getStorageBaseUrl();
  const apiBase = getRequestBaseUrl(request);

  const directUrl = storageBase
    ? `${storageBase}/${storageKey}`
    : `${apiBase}/api/uploads/${fileId}/content`;

  return {
    url: directUrl,
    previewUrl: `${apiBase}/api/uploads/${fileId}/content`,
    downloadUrl: `${apiBase}/api/uploads/${fileId}/content?download=1`,
  };
}

function buildUploadExpiry(): Date | null {
  const ttlMinutes = env.UPLOAD_ORPHAN_TTL_MINUTES;
  return Number.isFinite(ttlMinutes) && ttlMinutes > 0
    ? new Date(Date.now() + ttlMinutes * 60_000)
    : null;
}

async function handleUpload(
  request: FastifyRequest,
  reply: FastifyReply,
  options: { tenantId: string | null; isPublic?: boolean }
) {
  const parts = request.parts();
  let filePart: any = null;
  let isPublicValue = options.isPublic;

  for await (const part of parts) {
    if (part.type === "file") {
      filePart = part;
      break;
    } else {
      if (part.fieldname === "isPublic" && part.value !== undefined) {
        isPublicValue = String(part.value) === "true";
      }
    }
  }

  if (!filePart) {
    return reply.status(400).send({ error: "No file provided" });
  }

  const globalAllowedMimeTypes = getAllowedMimeTypes();
  const isPublicUpload = isPublicValue === true;
  const allowedByPolicy = globalAllowedMimeTypes ? globalAllowedMimeTypes.has(filePart.mimetype) : true;
  const allowedByPublicRules = isPublicUpload ? PUBLIC_UPLOAD_ALLOWED_MIME.has(filePart.mimetype) : true;

  if (!allowedByPolicy || !allowedByPublicRules) {
    return reply.status(415).send({
      error: "Unsupported media type",
      message: `File type ${filePart.mimetype} is not allowed`,
    });
  }

  const fileId = uuidv7();
  const ext = safeExtension(filePart.filename);
  const storageKey = `${fileId}${ext}`;
  const filePath = path.join(uploadsDir(), storageKey);

  await pipeline(filePart.file, fs.createWriteStream(filePath));
  const stats = fs.statSync(filePath);
  const expiresAt = buildUploadExpiry();

  const scan = await scanUpload({ filePath });
  if (!scan.allowed) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // best effort
    }

    await logAudit({
      db,
      ctx: request,
      action: "uploaded_file.rejected",
      resourceType: "uploaded_files",
      resourceId: fileId,
      tenantId: options.tenantId,
      newValue: {
        id: fileId,
        tenantId: options.tenantId,
        isPublic: isPublicUpload,
        originalName: filePart.filename,
        contentType: filePart.mimetype,
        sizeBytes: stats.size,
        status: "REJECTED",
        lastError: scan.lastError,
      },
    });

    const statusCode = scan.infected ? 422 : 503;
    return reply.status(statusCode).send({
      error: "Upload rejected",
      message: scan.infected ? "File failed security scan" : "Upload scanning unavailable",
    });
  }

  await db.insert(uploadedFiles).values({
    id: fileId,
    tenantId: options.tenantId,
    isPublic: isPublicUpload,
    storageKey,
    originalName: filePart.filename,
    contentType: filePart.mimetype,
    sizeBytes: stats.size,
    status: "UPLOADED",
    expiresAt,
    attachedToType: null,
    attachedToId: null,
    attachedAt: null,
    deletedAt: null,
    lastError: scan.lastError,
  });

  const urls = buildFileUrls({ request, fileId, storageKey });

  await logAudit({
    db,
    ctx: request,
    action: "uploaded_file.created",
    resourceType: "uploaded_files",
    resourceId: fileId,
    tenantId: options.tenantId,
    oldValue: null,
    newValue: {
      id: fileId,
      tenantId: options.tenantId,
      isPublic: isPublicUpload,
      storageKey,
      originalName: filePart.filename,
      contentType: filePart.mimetype,
      sizeBytes: stats.size,
      status: "UPLOADED",
    },
  });

  const response: FileMetaResponse = {
    fileId,
    originalName: filePart.filename,
    contentType: filePart.mimetype,
    sizeBytes: stats.size,
    status: "UPLOADED",
    isImage: isImageContentType(filePart.mimetype),
    ...urls,
  };

  return reply.status(201).send(response);
}

export const uploadsRoutes: FastifyPluginAsync = async (fastify) => {
  ensureUploadsDir();

  fastify.addHook("onSend", async (_request, reply, _payload) => {
    reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  });

  if (env.UPLOAD_ORPHAN_CLEANUP_ENABLED) {
    const intervalMs = env.UPLOAD_ORPHAN_CLEANUP_INTERVAL_MINUTES * 60_000;
    const timer = setInterval(() => {
      purgeExpiredUploadOrphans({
        db,
        limit: env.UPLOAD_ORPHAN_CLEANUP_BATCH_SIZE,
        log: fastify.log,
      }).catch((error) => {
        fastify.log.warn({ err: error }, "[uploads] Orphan cleanup tick failed");
      });
    }, intervalMs);
    // allow process to exit
    timer.unref?.();
    fastify.addHook("onClose", async () => clearInterval(timer));
    fastify.log.info(
      {
        intervalMinutes: env.UPLOAD_ORPHAN_CLEANUP_INTERVAL_MINUTES,
        batchSize: env.UPLOAD_ORPHAN_CLEANUP_BATCH_SIZE,
      },
      "[uploads] Orphan cleanup job enabled",
    );
  }

  // POST /api/uploads - Upload a file
  fastify.post(
    "/",
    { config: { rateLimit: rateLimitConfig.upload }, preHandler: [requireAnyAuth()] },
    async (request, reply) => {
      const actor = actorFromRequest(request);
      const tenantId = actor.kind === "tenant" ? actor.tenantId : null;
      return handleUpload(request, reply, { tenantId, isPublic: false });
    }
  );

  // GET /api/uploads/:id - Get file metadata
  fastify.get<{ Params: IdParams }>(
    "/:id",
    { config: { rateLimit: rateLimitConfig.global } },
    async (request, reply) => {
      const { id } = request.params;

      const [row] = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.id, id))
        .limit(1);

      if (!row) {
        return reply.status(404).send({ error: "File not found" });
      }

      const actor = await resolveActorForRead(request);
      if (!canReadUpload({ isPublic: row.isPublic, tenantId: row.tenantId }, actor)) {
        return reply.status(404).send({ error: "File not found" });
      }

      const urls = buildFileUrls({
        request,
        fileId: row.id,
        storageKey: row.storageKey,
      });

      const response: FileMetaResponse = {
        fileId: row.id,
        originalName: row.originalName,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        status: row.status,
        isImage: isImageContentType(row.contentType),
        ...urls,
      };

      return reply.send(response);
    }
  );

  // GET /api/uploads/:id/content - Stream file content
  fastify.get<{ Params: IdParams; Querystring: { download?: string } }>(
    "/:id/content",
    { config: { rateLimit: rateLimitConfig.global } },
    async (request, reply) => {
      const { id } = request.params;

      const [row] = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.id, id))
        .limit(1);

      if (!row) {
        return reply.status(404).send({ error: "File not found" });
      }

      const actor = await resolveActorForRead(request);
      if (!canReadUpload({ isPublic: row.isPublic, tenantId: row.tenantId }, actor)) {
        return reply.status(404).send({ error: "File not found" });
      }

      if (row.status === "DELETED" || row.status === "PURGED") {
        return reply.status(410).send({
          error: "File unavailable",
          message: `File status is ${row.status}`,
        });
      }

      const filePath = path.join(uploadsDir(), row.storageKey);
      if (!fs.existsSync(filePath)) {
        await db
          .update(uploadedFiles)
          .set({ status: "MISSING", lastError: "File missing on disk" })
          .where(eq(uploadedFiles.id, id));
        return reply.status(404).send({ error: "File missing on disk" });
      }

      const download = request.query?.download === "1";
      const isImage = isImageContentType(row.contentType);

      reply.header("Content-Type", row.contentType);
      reply.header("X-Content-Type-Options", "nosniff");

      const dispositionType = !download && isImage ? "inline" : "attachment";
      const safeName = row.originalName.replace(/[\r\n"]/g, "_");
      reply.header(
        "Content-Disposition",
        `${dispositionType}; filename="${safeName}"`
      );

      return reply.send(fs.createReadStream(filePath));
    }
  );

  // DELETE /api/uploads/:id - Delete orphan upload
  fastify.delete<{ Params: IdParams }>(
    "/:id",
    { config: { rateLimit: rateLimitConfig.upload }, preHandler: [requireAnyAuth()] },
    async (request, reply) => {
      const { id } = request.params;

      const actor = actorFromRequest(request);

      const [row] = await db
        .select()
        .from(uploadedFiles)
        .where(buildWriteWhere(id, actor))
        .limit(1);

      if (!row) {
        return reply.status(404).send({ error: "File not found" });
      }

      if (row.status !== "UPLOADED") {
        return reply.status(409).send({
          error: "Cannot delete",
          message: `File status is ${row.status}`,
        });
      }

      const filePath = path.join(uploadsDir(), row.storageKey);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await db
          .update(uploadedFiles)
          .set({ lastError: message })
          .where(eq(uploadedFiles.id, id));
        throw error;
      }

      await db
        .update(uploadedFiles)
        .set({ status: "DELETED", deletedAt: new Date() })
        .where(buildWriteWhere(id, actor));

      await logAudit({
        db,
        ctx: request,
        action: "uploaded_file.deleted",
        resourceType: "uploaded_files",
        resourceId: row.id,
        tenantId: row.tenantId,
        oldValue: row as Record<string, unknown>,
      });

      return reply.send({ ok: true });
    }
  );

  // POST /api/uploads/:id/attach - Attach file to entity
  fastify.post<{ Params: IdParams; Body: AttachBody }>(
    "/:id/attach",
    { config: { rateLimit: rateLimitConfig.upload }, preHandler: [requireAnyAuth()] },
    async (request, reply) => {
      const { id } = request.params;
      const { entityType, entityId } = request.body || {};

      const actor = actorFromRequest(request);

      if (!isNonEmptyString(entityType) || !isNonEmptyString(entityId)) {
        return reply
          .status(400)
          .send({ error: "entityType and entityId are required" });
      }

      try {
        await db.transaction(async (tx) => {
          await assertAttachTargetExists({ tx, actor, entityType, entityId });

          const [row] = await tx
            .select()
            .from(uploadedFiles)
            .where(buildWriteWhere(id, actor))
            .limit(1);

          if (!row) {
            throw httpError(404, "File not found");
          }

          const status = String(row.status);
          if (status === "DELETED" || status === "PURGED") {
            throw httpError(409, "File is unavailable");
          }

          if (status === "ATTACHED") {
            if (row.attachedToType === entityType && row.attachedToId === entityId) {
              return;
            }
            throw httpError(409, "File is already attached");
          }

          await tx
            .update(uploadedFiles)
            .set({
              status: "ATTACHED",
              attachedToType: entityType,
              attachedToId: entityId,
              attachedAt: new Date(),
              expiresAt: null,
            })
            .where(buildWriteWhere(id, actor));

          await logAudit({
            db: tx,
            ctx: request,
            action: "uploaded_file.attached",
            resourceType: "uploaded_files",
            resourceId: row.id,
            tenantId: row.tenantId,
            oldValue: row as Record<string, unknown>,
            newValue: {
              ...row,
              status: "ATTACHED",
              attachedToType: entityType,
              attachedToId: entityId,
            } as Record<string, unknown>,
            metadata: { entityType, entityId },
          });
        });

        return reply.send({ ok: true });
      } catch (error) {
        const err = error as { statusCode?: number; message?: string };
        return reply
          .status(err.statusCode ?? 500)
          .send({ error: err.message || "Internal Server Error" });
      }
    }
  );

  // POST /api/uploads/:id/detach - Detach file from entity
  fastify.post<{ Params: IdParams }>(
    "/:id/detach",
    { config: { rateLimit: rateLimitConfig.upload }, preHandler: [requireAnyAuth()] },
    async (request, reply) => {
      const { id } = request.params;

      const actor = actorFromRequest(request);

      const [row] = await db
        .select()
        .from(uploadedFiles)
        .where(buildWriteWhere(id, actor))
        .limit(1);

      if (!row) {
        return reply.status(404).send({ error: "File not found" });
      }

      if (row.status === "DELETED" || row.status === "PURGED") {
        return reply.status(409).send({
          error: "Cannot detach",
          message: "File has already been deleted",
        });
      }

      await db
        .update(uploadedFiles)
        .set({
          status: "UPLOADED",
          attachedToType: null,
          attachedToId: null,
          attachedAt: null,
          expiresAt: buildUploadExpiry(),
        })
        .where(buildWriteWhere(id, actor));

      await logAudit({
        db,
        ctx: request,
        action: "uploaded_file.detached",
        resourceType: "uploaded_files",
        resourceId: row.id,
        tenantId: row.tenantId,
        oldValue: row as Record<string, unknown>,
        newValue: {
          ...row,
          status: "UPLOADED",
          attachedToType: null,
          attachedToId: null,
        } as Record<string, unknown>,
      });

      return reply.send({ ok: true });
    }
  );
};

export const publicUploadsRoutes: FastifyPluginAsync = async (fastify) => {
  ensureUploadsDir();

  fastify.addHook("onSend", async (_request, reply, _payload) => {
    reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  });

  fastify.post(
    "/",
    { config: { rateLimit: rateLimitConfig.upload } },
    async (request, reply) => handleUpload(request, reply, { tenantId: null, isPublic: true })
  );
};
