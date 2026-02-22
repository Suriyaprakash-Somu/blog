/**
 * Compute the difference between two objects
 * Returns only the changed fields
 */
export function computeDiff<T extends Record<string, unknown>>(
  original: T,
  updated: Partial<T>
): Partial<T> {
  const diff: Record<string, unknown> = {};
  
  for (const key in updated) {
    if (Object.prototype.hasOwnProperty.call(updated, key)) {
      const originalValue = original[key];
      const updatedValue = updated[key];
      
      // Handle dates
      if (
        originalValue instanceof Date &&
        updatedValue instanceof Date
      ) {
        if (originalValue.getTime() !== updatedValue.getTime()) {
          diff[key] = updatedValue;
        }
      }
      // Handle objects (shallow comparison)
      else if (
        typeof originalValue === "object" &&
        originalValue !== null &&
        typeof updatedValue === "object" &&
        updatedValue !== null
      ) {
        if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
          diff[key] = updatedValue as unknown;
        }
      }
      // Handle primitives
      else if (originalValue !== updatedValue) {
        diff[key] = updatedValue as unknown;
      }
    }
  }
  
  return diff as Partial<T>;
}

export function hasOwn<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Create a shallow copy of an object without specified keys
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick specific keys from an object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
