import type { core, ZodObject, ZodRawShape } from "zod";
import type { Table } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

type ZodObjectAny = ZodObject<ZodRawShape>;

export interface SchemaFactoryOptions {
  omit?: string[];
  pick?: string[];
  overrides?: Record<string, core.$ZodType>;
  required?: string[];
  strict?: boolean;
}

function applyPickOmit(schema: ZodObjectAny, options: SchemaFactoryOptions): ZodObjectAny {
  const { pick, omit } = options;

  if (pick && pick.length > 0) {
    const pickMap = Object.fromEntries(pick.map((key) => [key, true]));
    schema = schema.pick(pickMap as Record<string, true>);
  }

  if (omit && omit.length > 0) {
    const omitMap = Object.fromEntries(omit.map((key) => [key, true]));
    schema = schema.omit(omitMap as Record<string, true>);
  }

  return schema;
}

function unwrapOptional(schema: core.$ZodType): core.$ZodType {
  const anySchema = schema as unknown as {
    _def?: { typeName?: string };
    unwrap?: () => core.$ZodType;
  };
  if (anySchema?._def?.typeName === "ZodOptional" && typeof anySchema.unwrap === "function") {
    return anySchema.unwrap();
  }
  return schema;
}

function applyRequired(schema: ZodObjectAny, fields: string[]): ZodObjectAny {
  const shape = schema.shape;
  const overrides: Record<string, core.$ZodType> = {};

  fields.forEach((field) => {
    const current = shape[field];
    if (current) {
      overrides[field] = unwrapOptional(current);
    }
  });

  return schema.extend(overrides);
}

function applyOverrides(schema: ZodObjectAny, overrides?: Record<string, core.$ZodType>) {
  if (!overrides || Object.keys(overrides).length === 0) return schema;
  return schema.extend(overrides);
}

function applyStrict(schema: ZodObjectAny, strict?: boolean) {
  if (strict === false) return schema;
  return schema.strict();
}

export function createZodSchemas<TTable extends Table>(
  table: TTable,
  options: SchemaFactoryOptions = {}
) {
  const selectSchema = applyStrict(
    applyOverrides(
      applyPickOmit(createSelectSchema(table) as ZodObjectAny, options),
      options.overrides
    ),
    options.strict
  );

  const baseInsertSchema = applyStrict(
    applyOverrides(
      applyPickOmit(createInsertSchema(table) as ZodObjectAny, options),
      options.overrides
    ),
    options.strict
  );

  const insertSchema = options.required
    ? applyRequired(baseInsertSchema, options.required)
    : baseInsertSchema;

  const updateSchema = insertSchema.partial();

  return {
    selectSchema,
    insertSchema,
    updateSchema,
  };
}
