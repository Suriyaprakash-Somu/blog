// Convert Zod schema to field configurations
import { z } from "zod";
import { getMeta, type SchemaMetadata } from "./utils/schemaMetadata";
import type { FieldConfig, FieldType, FieldOption } from "./types";

function unwrapZodType(type: z.ZodTypeAny): z.ZodTypeAny {
  if (type instanceof z.ZodOptional || type instanceof z.ZodNullable) {
    return unwrapZodType(type.unwrap() as z.ZodTypeAny);
  }
  if (type instanceof z.ZodDefault) {
    return unwrapZodType(type.removeDefault() as z.ZodTypeAny);
  }
  // Safe check for ZodEffects using typeName to avoid runtime errors
  // if ZodEffects class is not available on the z object
  const def = (type as { _def?: { typeName?: string; schema?: z.ZodTypeAny } })._def;
  if (def?.typeName === "ZodEffects" && def.schema) {
    return unwrapZodType(def.schema);
  }
  return type;
}

/**
 * Check if field is required
 */
function isOptionalUnion(type: z.ZodTypeAny): boolean {
  const def = (type as z.ZodTypeAny & { _def?: { typeName?: string; options?: z.ZodTypeAny[] } })._def;
  if (!def) return false;
  if (def.typeName !== "ZodUnion" && def.typeName !== "ZodDiscriminatedUnion") return false;
  const options = def.options ?? [];
  return options.some((option) => {
    if (!option) return true;
    if (option instanceof z.ZodLiteral && option.value === "") {
      return true;
    }
    return !isRequired(option);
  });
}

function isRequired(type: z.ZodTypeAny): boolean {
  if (type instanceof z.ZodOptional) return false;
  if (type instanceof z.ZodNullable) return false;
  if (type instanceof z.ZodDefault) return false;

  // Safe check for ZodEffects
  const def = (type as { _def?: { typeName?: string; schema?: z.ZodTypeAny } })._def;
  if (def?.typeName === "ZodEffects" && def.schema) {
    return isRequired(def.schema);
  }

  if (isOptionalUnion(type)) return false;
  return true;
}

/**
 * Check if ZodString has email validation
 */
function hasEmailCheck(type: z.ZodTypeAny): boolean {
  if (type instanceof z.ZodString) {
    const checks = (type._def as { checks?: Array<{ kind: string }> })?.checks;
    if (Array.isArray(checks)) {
      return checks.some((c) => c.kind === "email");
    }
  }
  return false;
}

function humanizeLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/^./, (s) => s.toUpperCase());
}

const DEFAULT_MAX_FILE_SIZE_BYTES = 1024 * 1024;

/**
 * Convert Zod schema to field configurations
 */
export function zodToFields<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
): FieldConfig[] {
  const shape = schema.shape;
  const entries = Object.entries(shape);

  return entries.map(([name, zodType], index) => {
    const typeAny = zodType as z.ZodTypeAny;
    const inner = unwrapZodType(typeAny);

    // Get metadata
    let metadata: SchemaMetadata = getMeta(typeAny) ?? {};
    const description = typeAny.description;
    let label = humanizeLabel(name);

    // Parse metadata from description if no WeakMap metadata
    if (Object.keys(metadata).length === 0 && description) {
      try {
        const parsed = JSON.parse(description) as SchemaMetadata;
        metadata = parsed;
        if (metadata.label) {
          label = metadata.label;
        }
      } catch {
        label = description;
      }
    } else if (metadata.label) {
      label = metadata.label;
    }

    let type: FieldType = "text";
    let options: FieldOption[] | undefined;
    let arrayItemSchema: FieldConfig[] | undefined;

    // Type deduction
    if (inner instanceof z.ZodNumber || inner instanceof z.ZodBigInt) {
      type = "number";
    } else if (inner instanceof z.ZodBoolean) {
      type = "switch";
    } else if (inner instanceof z.ZodEnum) {
      type = "select";
      options = (inner.options as string[]).map((value) => ({
        value,
        label: humanizeLabel(value),
      }));
    } else if (inner instanceof z.ZodDate) {
      type = "date";
    } else if (inner instanceof z.ZodArray) {
      type = "array";
      const itemType = inner.element;
      if (itemType instanceof z.ZodObject) {
        arrayItemSchema = zodToFields(itemType);
      }
    }

    // Email detection
    if (inner instanceof z.ZodString) {
      if (hasEmailCheck(inner) || /email/i.test(name)) {
        type = "email";
      }
    }

    let required = isRequired(typeAny);
    if (metadata.optional) {
      required = false;
    }

    // Override from metadata
    if (metadata.inputType) {
      type = metadata.inputType as FieldType;
    }

    if (metadata.options) {
      options = metadata.options;
    }

    const minFiles =
      typeof metadata.minFiles === "number"
        ? metadata.minFiles
        : type === "file"
          ? 1
          : undefined;
    const maxFiles =
      typeof metadata.maxFiles === "number"
        ? metadata.maxFiles
        : type === "file"
          ? 1
          : undefined;
    const maxSizeBytes =
      typeof metadata.maxSizeBytes === "number"
        ? metadata.maxSizeBytes
        : type === "file"
          ? DEFAULT_MAX_FILE_SIZE_BYTES
          : undefined;
    const maxTotalSizeBytes =
      typeof metadata.maxTotalSizeBytes === "number"
        ? metadata.maxTotalSizeBytes
        : undefined;

    // Build field config based on type
    const baseConfig = {
      name,
      label,
      type,
      required,
      order: metadata.order ?? index + 1,
      colSpan: (metadata.colSpan ?? 12) as FieldConfig["colSpan"],
      placeholder: metadata.placeholder,
      disabled: metadata.disabled,
      visibleWhen: metadata.visibleWhen,
      excludeFrom: metadata.excludeFrom,
      filterBy: metadata.filterBy,
    };

    if (type === "array" && arrayItemSchema) {
      return {
        ...baseConfig,
        type: "array" as const,
        singularLabel: metadata.singularLabel,
        sortable: metadata.sortable,
        arrayItemSchema,
      };
    }

    if (type === "file") {
      return {
        ...baseConfig,
        type: "file" as const,
        accept: metadata.accept,
        maxSizeBytes,
        maxTotalSizeBytes,
        minFiles,
        maxFiles,
        uploadMode: metadata.uploadMode,
      };
    }

    if (type === "select" || type === "radio" || type === "autocomplete") {
      return {
        ...baseConfig,
        type: type as "select" | "radio" | "autocomplete",
        options,
        emptyIndicator: metadata.emptyIndicator,
      };
    }

    if (type === "multiselect") {
      return {
        ...baseConfig,
        type: "multiselect" as const,
        options,
      };
    }

    return baseConfig as FieldConfig;
  });
}

// Re-export as parseZodSchema for compatibility
export const parseZodSchema = zodToFields;
