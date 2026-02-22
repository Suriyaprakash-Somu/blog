// Pure business logic for form operations (no React dependencies)

import type { FieldConfig, FormValues, ArrayItemWithLocalId } from "../types";
import { ensureLocalIds } from "../utils/formHelpers";

/**
 * Build default values based on field configurations
 */
export function buildDefaultValues(fields: FieldConfig[]): FormValues {
  const values: FormValues = {};

  for (const field of fields) {
    const fieldName = field.name;
    switch (field.type) {
      case "number":
        values[fieldName] = undefined;
        break;
      case "checkbox":
      case "switch":
        values[fieldName] = false;
        break;
      case "array":
      case "multiselect":
        values[fieldName] = [];
        break;
      case "file":
        values[fieldName] = null;
        break;
      case "select":
      case "radio":
      case "text":
      case "email":
      case "password":
      case "textarea":
      case "date":
      case "time":
      case "datetime":
      case "autocomplete":
        values[fieldName] = "";
        break;
      case "map-picker":
        values[fieldName] = null;
        break;
      default:
        values[fieldName] = "";
        break;
    }
  }

  return values;
}

/**
 * Add local IDs to array items for tracking
 */
export function addLocalIdsToArrayItems(
  obj: FormValues | null | undefined,
  fields: FieldConfig[]
): FormValues {
  const copy: FormValues = { ...(obj ?? {}) };

  for (const field of fields) {
    if (field.type === "array" && Array.isArray(copy[field.name])) {
      copy[field.name] = ensureLocalIds(
        copy[field.name] as Record<string, unknown>[]
      );
    }
  }

  return copy;
}

/**
 * Normalize form values for submission
 */
export function normalizeValues(
  raw: FormValues | null | undefined,
  fields: FieldConfig[]
): FormValues {
  const result: FormValues = {};

  for (const field of fields) {
    const value = raw?.[field.name];

    if (field.type === "number") {
      const n = Number(value);
      result[field.name] =
        value === "" || value === null || value === undefined || isNaN(n)
          ? undefined
          : n;
      continue;
    }

    if (field.type === "checkbox" || field.type === "switch") {
      result[field.name] = Boolean(value);
      continue;
    }

    if (field.type === "array") {
      if (Array.isArray(value) && field.arrayItemSchema) {
        result[field.name] = (value as ArrayItemWithLocalId[]).map((item) => {
          const normalized: Record<string, unknown> = {};

          for (const itemField of field.arrayItemSchema) {
            const itemValue = item?.[itemField.name];

            if (itemField.type === "number") {
              const nItem = Number(itemValue);
              normalized[itemField.name] =
                itemValue === "" ||
                itemValue === null ||
                itemValue === undefined ||
                isNaN(nItem)
                  ? undefined
                  : nItem;
            } else if (
              itemField.type === "checkbox" ||
              itemField.type === "switch"
            ) {
              normalized[itemField.name] = Boolean(itemValue);
            } else {
              normalized[itemField.name] = itemValue;
            }
          }

          return normalized;
        });
      } else {
        result[field.name] = value;
      }
      continue;
    }

    if (field.type === "multiselect") {
      result[field.name] = Array.isArray(value) ? value : [];
      continue;
    }

    result[field.name] = value;
  }

  return result;
}
