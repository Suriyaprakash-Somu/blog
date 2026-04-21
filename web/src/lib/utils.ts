import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind merge support
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Type-safe object keys
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Type-safe object entries
 */
export function typedEntries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Check if value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Assert condition and narrow type
 */
export function assert(
  condition: unknown,
  message?: string
): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

/**
 * Exhaustive check for switch statements
 */
export function exhaustiveCheck(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

/**
 * Build OG image URL chain with fallback
 */
export function buildOgImageUrl(
  entityImageUrl: string | null | undefined,
  fallbackImageUrl: string | null | undefined
): string | undefined {
  if (entityImageUrl && (entityImageUrl.startsWith("http://") || entityImageUrl.startsWith("https://"))) {
    return entityImageUrl;
  }
  if (fallbackImageUrl && (fallbackImageUrl.startsWith("http://") || fallbackImageUrl.startsWith("https://"))) {
    return fallbackImageUrl;
  }
  return undefined;
}

/**
 * Format storage key to public image URL
 */
export function getPublicImageUrl(storageKey: string | null): string | null {
  if (!storageKey) return null;
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }
  const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3005";
  const fileId = storageKey.split(".")[0];
  return `${apiBase}/api/uploads/${fileId}/content`;
}
