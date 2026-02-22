// filterBuilder.ts
// Converts QueryBuilder filter objects into Drizzle ORM conditions
// TypeScript port of Reference Project's filterBuilder.js

import { and, or, eq, ne, like, gt, lt, gte, lte, inArray, isNull, isNotNull, sql, type SQL } from "drizzle-orm";
import type { Column } from "drizzle-orm";

// Allowed operators - whitelist to prevent injection
const ALLOWED_OPERATORS = new Set([
  "equals", "notEquals", "contains", "startsWith", "endsWith",
  "isEmpty", "isNotEmpty", "greaterThan", "lessThan", "greaterOrEqual",
  "lessOrEqual", "isTrue", "isFalse", "includesAny", "includesAll",
  "before", "after", "between"
]);

// Allowed logic operators
const ALLOWED_LOGIC = new Set(["AND", "OR"]);

// Max depth for nested groups to prevent DoS
const MAX_NESTING_DEPTH = 5;

// Max conditions to prevent DoS
const MAX_CONDITIONS = 50;

// Types
export interface FilterCondition {
  field: string;
  operator: string;
  value?: unknown;
}

export interface FilterGroup {
  logic: "AND" | "OR";
  conditions: (FilterCondition | FilterGroup)[];
  search?: string;
}

export interface ColumnMap {
  [key: string]: Column;
}

export interface RelationFieldConfig {
  tableName: string;
  mainIdColumn: string;
  foreignIdColumn: string;
  mainTableId: Column;
}

export interface RelationFields {
  [key: string]: RelationFieldConfig;
}

export interface FilterBuilderOptions {
  columnMap?: ColumnMap;
  relationFields?: RelationFields;
  searchableColumns?: string[];
  search?: string | null;
}

/**
 * Sanitize string value to prevent SQL injection patterns
 * Drizzle ORM uses parameterized queries, but we add defense-in-depth
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    // Remove null bytes
    let sanitized = value.replace(/\0/g, "");
    // Limit length to prevent DoS
    if (sanitized.length > 1000) {
      sanitized = sanitized.slice(0, 1000);
    }
    return sanitized;
  }

  if (typeof value === "number") {
    // Ensure it's a valid finite number
    if (!Number.isFinite(value)) return null;
    return value;
  }

  if (Array.isArray(value)) {
    // Limit array size
    return value.slice(0, 100).map(v => sanitizeValue(v)).filter(v => v !== null);
  }

  return value;
}

/**
 * Validate field name
 */
function isValidField(field: string): boolean {
  if (typeof field !== "string") return false;
  if (field.length > 100) return false;
  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) return false;
  return true;
}

/**
 * Operator handlers for different filter operations
 */
const OPERATOR_HANDLERS: Record<string, (column: Column, value?: unknown) => SQL | null> = {
  // Text operators
  equals: (column, value) => eq(column, sanitizeValue(value) as string | number | boolean),
  notEquals: (column, value) => ne(column, sanitizeValue(value) as string | number | boolean),
  contains: (column, value) => {
    const sanitized = sanitizeValue(value);
    const escaped = String(sanitized).replace(/[%_]/g, "\\$&");
    return like(column, `%${escaped}%`);
  },
  startsWith: (column, value) => {
    const sanitized = sanitizeValue(value);
    const escaped = String(sanitized).replace(/[%_]/g, "\\$&");
    return like(column, `${escaped}%`);
  },
  endsWith: (column, value) => {
    const sanitized = sanitizeValue(value);
    const escaped = String(sanitized).replace(/[%_]/g, "\\$&");
    return like(column, `%${escaped}`);
  },
  isEmpty: (column) => or(isNull(column), eq(column, "")) ?? null,
  isNotEmpty: (column) => and(isNotNull(column), ne(column, "")) ?? null,

  // Number operators
  greaterThan: (column, value) => gt(column, Number(sanitizeValue(value))),
  lessThan: (column, value) => lt(column, Number(sanitizeValue(value))),
  greaterOrEqual: (column, value) => gte(column, Number(sanitizeValue(value))),
  lessOrEqual: (column, value) => lte(column, Number(sanitizeValue(value))),

  // Boolean operators
  isTrue: (column) => eq(column, true),
  isFalse: (column) => eq(column, false),

  // Date operators
  before: (column, value) => {
    const date = new Date(sanitizeValue(value) as string);
    return isNaN(date.getTime()) ? null : lt(column, date);
  },
  after: (column, value) => {
    const date = new Date(sanitizeValue(value) as string);
    return isNaN(date.getTime()) ? null : gt(column, date);
  },
  between: (column, value) => {
    const sanitized = sanitizeValue(value) as unknown;
    let from: string | number | null = null;
    let to: string | number | null = null;

    if (Array.isArray(sanitized) && sanitized.length === 2) {
      from = sanitized[0] as string | number | null;
      to = sanitized[1] as string | number | null;
    } else if (
      sanitized &&
      typeof sanitized === "object" &&
      "from" in sanitized &&
      "to" in sanitized
    ) {
      const typed = sanitized as { from?: string | number; to?: string | number };
      from = typed.from ?? null;
      to = typed.to ?? null;
    }

    if (from === null || to === null) return null;

    const date1 = new Date(String(from));
    const date2 = new Date(String(to));
    const dateValid = !isNaN(date1.getTime()) && !isNaN(date2.getTime());

    if (dateValid) {
      return and(gte(column, date1), lte(column, date2)) ?? null;
    }

    const num1 = Number(from);
    const num2 = Number(to);
    if (Number.isFinite(num1) && Number.isFinite(num2)) {
      return and(gte(column, num1), lte(column, num2)) ?? null;
    }

    return null;
  },

  // Array/List operators
  includesAny: (column, value) => {
    const sanitized = sanitizeValue(value) as unknown[];
    if (!Array.isArray(sanitized) || sanitized.length === 0) return null;
    return inArray(column, sanitized);
  },
  includesAll: (column, value) => {
    const sanitized = sanitizeValue(value) as unknown;
    if (!Array.isArray(sanitized) || sanitized.length === 0) return null;
    return sql`${column} @> ${sanitized}`;
  },
};

/**
 * Build a Drizzle condition from a single filter condition
 */
function buildCondition(
  condition: FilterCondition,
  columnMap: ColumnMap,
  _relationFields: RelationFields = {}
): SQL | null {
  const { field, operator, value } = condition;

  // Validate field and operator
  if (!field || !operator) return null;
  if (!isValidField(field)) return null;
  if (!ALLOWED_OPERATORS.has(operator)) return null;

  // Note: Relation field handling can be added here if needed

  const column = columnMap[field];
  if (!column) return null;

  const handler = OPERATOR_HANDLERS[operator];
  if (!handler) return null;

  try {
    return handler(column, value);
  } catch {
    return null;
  }
}

/**
 * Recursively build Drizzle conditions from a filter group
 */
function buildGroupCondition(
  group: FilterGroup | null,
  columnMap: ColumnMap,
  relationFields: RelationFields = {},
  depth = 0,
  counter = { count: 0 }
): SQL | null {
  // Prevent deeply nested structures (DoS protection)
  if (depth > MAX_NESTING_DEPTH) return null;

  if (!group || !group.conditions || group.conditions.length === 0) {
    return null;
  }

  // Validate logic operator
  if (group.logic && !ALLOWED_LOGIC.has(group.logic)) {
    return null;
  }

  const conditions: SQL[] = [];

  for (const item of group.conditions) {
    // Check total condition count (DoS protection)
    counter.count++;
    if (counter.count > MAX_CONDITIONS) break;

    if ("logic" in item && "conditions" in item) {
      // Nested group - increment depth
      const nestedCondition = buildGroupCondition(
        item as FilterGroup,
        columnMap,
        relationFields,
        depth + 1,
        counter
      );
      if (nestedCondition) conditions.push(nestedCondition);
    } else {
      // Build condition
      const condition = buildCondition(item as FilterCondition, columnMap, relationFields);
      if (condition) conditions.push(condition);
    }
  }

  if (conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];

  const result = group.logic === "OR" ? or(...conditions) : and(...conditions);
  return result ?? null;
}

/**
 * Build filter conditions from QueryBuilder output
 * 
 * @param filtersInput - JSON string or object from QueryBuilder
 * @param options - Configuration options
 * @returns Complete WHERE condition or null if no filters
 * 
 * @example
 * const filterCondition = buildFilters(filtersParam, {
 *   columnMap: {
 *     name: tenants.name,
 *     status: tenants.status,
 *   },
 *   searchableColumns: ["name"],
 * });
 */
export function buildFilters(
  filtersInput: string | FilterGroup | null,
  options: FilterBuilderOptions = {}
): SQL | null {
  const { columnMap = {}, relationFields = {}, searchableColumns = [] } = options;
  let { search = null } = options;

  let filters: FilterGroup | null = null;
  
  if (filtersInput) {
    try {
      filters = typeof filtersInput === "string" 
        ? JSON.parse(filtersInput) 
        : filtersInput;

      // If search is embedded in the filter object, use it
      if (!search && filters && filters.search) {
        search = filters.search;
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  const conditions: SQL[] = [];

  // 1. Build complex filters
  if (filters) {
    const filterCond = buildGroupCondition(filters, columnMap, relationFields);
    if (filterCond) conditions.push(filterCond);
  }

  // 2. Build simple search
  if (search && searchableColumns.length > 0) {
    const searchVal = sanitizeValue(search) as string;
    if (searchVal && String(searchVal).trim().length > 0) {
      const searchConditions: SQL[] = [];
      const term = `%${String(searchVal).trim().replace(/[%_]/g, "\\$&")}%`;

      for (const colName of searchableColumns) {
        if (typeof colName === "string" && columnMap[colName]) {
          searchConditions.push(like(columnMap[colName], term));
        }
      }

      if (searchConditions.length > 0) {
        const searchOr = or(...searchConditions);
        if (searchOr) conditions.push(searchOr);
      }
    }
  }

  if (conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions)!;
}

/**
 * Parse sorting parameter from frontend
 * @param sortingInput - JSON string like [{"id":"name","desc":false}]
 * @returns Parsed sorting array or null
 */
export function parseSorting(sortingInput: string | null): Array<{ id: string; desc: boolean }> | null {
  if (!sortingInput) return null;
  try {
    const parsed = JSON.parse(sortingInput);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

/**
 * Build ORDER BY clause from sorting parameter
 */
export function buildOrderBy(
  sortingInput: string | null,
  columnMap: ColumnMap,
  defaultColumn?: Column,
  _defaultDesc = true
): SQL | Column | undefined {
  const sorting = parseSorting(sortingInput);
  
  if (!sorting || sorting.length === 0) {
    return defaultColumn;
  }

  const firstSort = sorting[0];
  const column = columnMap[firstSort.id];
  
  if (!column) return defaultColumn;
  
  return firstSort.desc ? sql`${column} DESC` : sql`${column} ASC`;
}
