import { LRUCache } from "lru-cache";
import { logger } from "./logger.js";

/**
 * Cache Adapter Interface
 * Implement this for different backends (memory, Redis, etc.)
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, data: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  
  // Tag operations
  addToTag(tag: string, key: string): Promise<void>;
  getTagKeys(tag: string): Promise<string[]>;
  deleteTag(tag: string): Promise<void>;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Adapter to use (default: memory) */
  adapter?: CacheAdapter;
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTtlMs?: number;
  /** Enable debug logging (default: false in prod) */
  debug?: boolean;
}

/**
 * CacheService - Modular, adapter-based caching utility
 * 
 * Supports:
 * - In-memory (default) - for development/single instance
 * - Redis - for production/scaling (swap adapter)
 * 
 * @example
 * // Use default memory adapter
 * const cache = new CacheService();
 * 
 * // Use Redis adapter (when scaling)
 * const cache = new CacheService({ adapter: new RedisCacheAdapter(redisClient) });
 * 
 * // Get or set pattern
 * const data = await cache.getOrSet('branches:t1', () => db.query(...), ['branches']);
 * 
 * // Invalidate by tag
 * await cache.invalidateTag('branches');
 */
export class CacheService {
  private adapter: CacheAdapter;
  private defaultTtlMs: number;
  private debug: boolean;

  constructor(config: CacheConfig = {}) {
    this.adapter = config.adapter ?? new MemoryCacheAdapter();
    this.defaultTtlMs = config.defaultTtlMs ?? 5 * 60 * 1000;
    this.debug = config.debug ?? process.env.NODE_ENV === "development";
  }

  /**
   * Get cached value by key
   */
  async get<T>(key: string): Promise<T | undefined> {
    const data = await this.adapter.get<T>(key);
    this.log(data !== undefined ? `HIT: ${key}` : `MISS: ${key}`);
    return data;
  }

  /**
   * Set value with optional tags for grouped invalidation
   */
  async set<T>(key: string, data: T, tags: string[] = [], ttlMs?: number): Promise<void> {
    await this.adapter.set(key, data, ttlMs ?? this.defaultTtlMs);

    // Index tags
    for (const tag of tags) {
      await this.adapter.addToTag(tag, key);
    }

    this.log(`SET: ${key} [tags: ${tags.join(", ")}]`);
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.adapter.has(key);
  }

  /**
   * Delete specific key
   */
  async delete(key: string): Promise<boolean> {
    this.log(`DELETE: ${key}`);
    return this.adapter.delete(key);
  }

  /**
   * Invalidate all entries with a specific tag
   */
  async invalidateTag(tag: string): Promise<number> {
    const keys = await this.adapter.getTagKeys(tag);
    
    for (const key of keys) {
      await this.adapter.delete(key);
    }
    await this.adapter.deleteTag(tag);
    
    this.log(`INVALIDATE TAG: ${tag} (${keys.length} keys)`);
    return keys.length;
  }

  /**
   * Invalidate multiple tags
   */
  async invalidateTags(tags: string[]): Promise<number> {
    let total = 0;
    for (const tag of tags) {
      total += await this.invalidateTag(tag);
    }
    return total;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    await this.adapter.clear();
    this.log("CLEAR: all cache cleared");
  }

  /**
   * Get or set pattern - fetch from cache or execute getter
   */
  async getOrSet<T>(
    key: string,
    getter: () => T | Promise<T>,
    tags: string[] = [],
    ttlMs?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const data = await getter();
    await this.set(key, data, tags, ttlMs);
    return data;
  }

  private log(message: string): void {
    if (this.debug) {
      logger.info(`[Cache] ${message}`);
    }
  }
}

// ============================================================================
// Memory Adapter (Default - for development/single instance)
// ============================================================================



export class MemoryCacheAdapter implements CacheAdapter {
  private cache: LRUCache<string, { value: unknown }>;
  private tagIndex: Map<string, Set<string>> = new Map();

  constructor(maxItems = 1000) {
    this.cache = new LRUCache<string, { value: unknown }>({ max: maxItems });
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    return entry ? (entry.value as T) : undefined;
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    this.cache.set(key, { value: data }, { ttl: ttlMs });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
  }

  async addToTag(tag: string, key: string): Promise<void> {
    if (!this.tagIndex.has(tag)) {
      this.tagIndex.set(tag, new Set());
    }
    this.tagIndex.get(tag)!.add(key);
  }

  async getTagKeys(tag: string): Promise<string[]> {
    return Array.from(this.tagIndex.get(tag) ?? []);
  }

  async deleteTag(tag: string): Promise<void> {
    this.tagIndex.delete(tag);
  }
}

// ============================================================================
// Redis Adapter Placeholder (Uncomment when scaling)
// ============================================================================

/*
import Redis from 'ioredis';

export class RedisCacheAdapter implements CacheAdapter {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | undefined> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : undefined;
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    const value = JSON.stringify(data);
    if (ttlMs) {
      await this.redis.psetex(key, ttlMs, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  async has(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) > 0;
  }

  async clear(): Promise<void> {
    await this.redis.flushdb();
  }

  async addToTag(tag: string, key: string): Promise<void> {
    await this.redis.sadd(`_tag:${tag}`, key);
  }

  async getTagKeys(tag: string): Promise<string[]> {
    return this.redis.smembers(`_tag:${tag}`);
  }

  async deleteTag(tag: string): Promise<void> {
    await this.redis.del(`_tag:${tag}`);
  }
}
*/

// ============================================================================
// Singleton & Helpers
// ============================================================================

let defaultCache: CacheService | null = null;

/**
 * Get default cache instance
 */
export function getCache(): CacheService {
  if (!defaultCache) {
    defaultCache = new CacheService();
  }
  return defaultCache;
}

/**
 * Initialize cache with custom config (call once at startup)
 */
export function initCache(config: CacheConfig): CacheService {
  defaultCache = new CacheService(config);
  return defaultCache;
}

/**
 * Build cache key from parts
 */
export function buildKey(...parts: (string | number)[]): string {
  return parts.join(":");
}

/**
 * Build tenant-scoped tags
 */
export function tenantTags(resource: string, tenantId: string): string[] {
  return [resource, `tenant:${tenantId}`, `${resource}:${tenantId}`];
}
