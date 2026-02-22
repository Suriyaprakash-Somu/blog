// Core API Types
// ================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListResponse<T> {
  rows: T[];
  count: number;
}

/**
 * Query parameters for paginated requests
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: string | Record<string, string | number | boolean | undefined>;
}

/**
 * Fetch options extending RequestInit
 */
export interface FetchOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  organizationId?: string;
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
}

// Entity Types
// ============

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User session info
 */
export interface UserSession {
  id: string;
  email: string;
  name: string;
  current_organization?: {
    id: string;
    name: string;
    role: string;
  };
}

// Component Utility Types
// =======================

/**
 * Extract props type from a component
 */
export type PropsOf<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Make specific keys optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific keys required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Strict omit that only allows existing keys
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
