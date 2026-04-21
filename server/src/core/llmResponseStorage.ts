import crypto from "crypto";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { llmResponseCache, type LLMResponseCache, type NewLLMResponseCache } from "../modules/llmCache/llmCache.schema.js";

interface LLMCacheEntry {
  cacheKey: string;
  promptHash: string;
  module: string;
  rawResponse: string;
  parsedData?: unknown;
  status: "pending" | "success" | "failed" | "needs_review" | "corrected";
  createdAt: Date;
}

// Memory cache (LRU-style with size limit)
const memoryCache = new Map<string, LLMCacheEntry>();
const MAX_MEMORY_CACHE_SIZE = 1000;

function evictIfNeeded() {
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) {
      memoryCache.delete(firstKey);
    }
  }
}

export function createCacheKey(params: {
  module: string;
  systemPrompt: string;
  userPrompt: string;
  inputTitle?: string;
  inputName?: string;
  temperature?: number;
}): string {
  const base = `${params.module}:${params.inputTitle || params.inputName || "unknown"}:${Date.now()}`;
  return base.replace(/\s+/g, "-").toLowerCase();
}

export function createPromptHash(systemPrompt: string, userPrompt: string): string {
  return crypto.createHash("sha256").update(systemPrompt + userPrompt).digest("hex");
}

export async function getFromCache(cacheKey: string): Promise<LLMCacheEntry | null> {
  // Check memory first
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    return memoryEntry;
  }

  // Check DB
  const [dbEntry] = await db
    .select()
    .from(llmResponseCache)
    .where(eq(llmResponseCache.cacheKey, cacheKey))
    .limit(1);

  if (!dbEntry) {
    return null;
  }

  const entry: LLMCacheEntry = {
    cacheKey: dbEntry.cacheKey,
    promptHash: dbEntry.promptHash,
    module: dbEntry.module,
    rawResponse: dbEntry.rawResponse,
    parsedData: dbEntry.parsedData ?? undefined,
    status: dbEntry.status as LLMCacheEntry["status"],
    createdAt: dbEntry.createdAt,
  };

  // Load to memory cache
  evictIfNeeded();
  memoryCache.set(cacheKey, entry);

  return entry;
}

export async function saveToCache(entry: NewLLMResponseCache): Promise<void> {
  // Save to DB first - explicitly set timestamps to avoid DEFAULT issues
  const [saved] = await db.insert(llmResponseCache).values({
    ...entry,
    createdAt: new Date(),
    expiresAt: entry.expiresAt ?? null,
  }).returning();

  // Update memory cache
  const memoryEntry: LLMCacheEntry = {
    cacheKey: saved.cacheKey,
    promptHash: saved.promptHash,
    module: saved.module,
    rawResponse: saved.rawResponse,
    parsedData: saved.parsedData ?? undefined,
    status: saved.status as LLMCacheEntry["status"],
    createdAt: saved.createdAt,
  };

  evictIfNeeded();
  memoryCache.set(saved.cacheKey, memoryEntry);
}

export async function removeFromCache(cacheKey: string): Promise<void> {
  // Delete from DB
  await db.delete(llmResponseCache).where(eq(llmResponseCache.cacheKey, cacheKey));

  // Delete from memory
  memoryCache.delete(cacheKey);
}

export async function invalidateByModule(module: string): Promise<void> {
  // Delete from DB
  await db.delete(llmResponseCache).where(eq(llmResponseCache.module, module));

  // Clear memory cache for this module
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.module === module) {
      memoryCache.delete(key);
    }
  }
}

export async function updateCacheStatus(
  cacheKey: string,
  status: LLMCacheEntry["status"],
  parsedData?: unknown,
  errorMessage?: string,
  errorStack?: string
): Promise<void> {
  // Update DB
  await db
    .update(llmResponseCache)
    .set({
      status,
      parsedData: parsedData !== undefined ? parsedData : null,
      errorMessage: errorMessage ?? null,
      errorStack: errorStack ?? null,
    })
    .where(eq(llmResponseCache.cacheKey, cacheKey));

  // Update memory
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry) {
    memoryEntry.status = status;
    if (parsedData !== undefined) {
      memoryEntry.parsedData = parsedData;
    }
    memoryCache.set(cacheKey, memoryEntry);
  }
}

export async function getCacheEntry(id: string): Promise<LLMResponseCache | null> {
  const [entry] = await db
    .select()
    .from(llmResponseCache)
    .where(eq(llmResponseCache.id, id))
    .limit(1);

  return entry || null;
}

export async function getCacheEntries(filters: {
  module?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: LLMResponseCache[]; rowCount: number }> {
  const { module, status, dateFrom, dateTo, page = 1, pageSize = 20 } = filters;

  const conditions = [];

  if (module) {
    conditions.push(eq(llmResponseCache.module, module));
  }

  if (status) {
    conditions.push(eq(llmResponseCache.status, status));
  }

  if (dateFrom) {
    conditions.push(eq(llmResponseCache.createdAt, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(eq(llmResponseCache.createdAt, new Date(dateTo)));
  }

  // Get total count
  const countResult = await db
    .select({ count: db.$count(llmResponseCache.id) })
    .from(llmResponseCache)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const rowCount = countResult[0]?.count ?? 0;

  // Get paginated results
  const rows = await db
    .select()
    .from(llmResponseCache)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(llmResponseCache.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return { rows, rowCount };
}

export async function updateCacheEntry(
  id: string,
  updates: Partial<LLMResponseCache>
): Promise<LLMResponseCache | null> {
  const [updated] = await db
    .update(llmResponseCache)
    .set(updates)
    .where(eq(llmResponseCache.id, id))
    .returning();

  // Update memory cache if exists
  if (updated) {
    const memoryEntry = memoryCache.get(updated.cacheKey);
    if (memoryEntry) {
      memoryEntry.status = updated.status as LLMCacheEntry["status"];
      if (updated.parsedData !== undefined) {
        memoryEntry.parsedData = updated.parsedData;
      }
      memoryCache.set(updated.cacheKey, memoryEntry);
    }
  }

  return updated || null;
}
