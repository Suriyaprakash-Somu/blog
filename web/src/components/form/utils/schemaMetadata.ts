// Schema metadata storage using WeakMap
import type { z } from "zod";
import type { FieldConfig } from "../types";

/**
 * Metadata that can be attached to a Zod schema
 */
export interface SchemaMetadata {
  label?: string;
  placeholder?: string;
  colSpan?: number;
  order?: number;
  inputType?: string;
  options?: Array<{ label: string; value: string | number }>;
  singularLabel?: string;
  excludeFrom?: string;
  filterBy?: { field: string; optionKey: string };
  visibleWhen?: FieldConfig["visibleWhen"];
  asyncValidator?: unknown;
  accept?: string;
  maxSizeBytes?: number;
  maxTotalSizeBytes?: number;
  minFiles?: number;
  maxFiles?: number;
  disabled?: boolean;
  emptyIndicator?: string;
  optional?: boolean;
  uploadMode?: "auth" | "public";
  sortable?: boolean;
}

// Store metadata in WeakMap
const metaMap = new WeakMap<z.ZodTypeAny, SchemaMetadata>();

/**
 * Attach metadata to a Zod schema
 */
export function withMeta<T extends z.ZodTypeAny>(
  schema: T,
  metadata: SchemaMetadata
): T {
  metaMap.set(schema, metadata);
  return schema;
}

/**
 * Retrieve metadata from a Zod schema
 */
export function getMeta(schema: z.ZodTypeAny): SchemaMetadata | undefined {
  return metaMap.get(schema);
}

/**
 * Check if a schema has metadata
 */
export function hasMeta(schema: z.ZodTypeAny): boolean {
  return metaMap.has(schema);
}
