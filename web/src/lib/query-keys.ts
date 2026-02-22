type SerializableValue =
  | string
  | number
  | boolean
  | null
  | SerializableValue[]
  | { [key: string]: SerializableValue };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function toSerializable(value: unknown): SerializableValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => toSerializable(item));
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    const normalized: { [key: string]: SerializableValue } = {};
    for (const [key, entryValue] of entries) {
      normalized[key] = toSerializable(entryValue);
    }
    return normalized;
  }

  return String(value);
}

export function serializeQueryParams(params: unknown): string | undefined {
  if (params === null || params === undefined) return undefined;
  const normalized = toSerializable(params);
  if (typeof normalized === "object" && normalized !== null) {
    if (Array.isArray(normalized) && normalized.length === 0) return undefined;
    if (!Array.isArray(normalized) && Object.keys(normalized).length === 0) {
      return undefined;
    }
  }
  return JSON.stringify(normalized);
}
