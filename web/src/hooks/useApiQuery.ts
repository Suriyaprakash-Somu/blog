"use client";

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { clientFetch } from "@/lib/client-fetch";
import type { QueryParams } from "@/lib/types";
import { serializeQueryParams } from "@/lib/query-keys";
import { useTenantSession } from "@/lib/auth/useTenantSession";

/**
 * Configuration for useApiQuery hook
 */
export interface UseApiQueryConfig<
  TData,
  TParams extends QueryParams = QueryParams,
> {
  /** Query key - string or array */
  key: string | readonly unknown[];
  /** API endpoint */
  endpoint: string;
  /** HTTP method (default: GET) */
  method?: "GET" | "POST";
  /** Query parameters to send */
  queryParams?: TParams;
  /** Organization ID for multi-tenant context */
  organizationId?: string;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
  /** Whether organization is required (default: true) */
  requireOrganization?: boolean;
  /** Additional react-query options */
  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;
}

/**
 * Type-safe API query hook with organization context
 *
 * @example
 * // Simple usage
 * const { data } = useApiQuery<User[]>('/api/users');
 *
 * @example
 * // With config
 * const { data } = useApiQuery<Product[], { category: string }>({
 *   key: ['products', category],
 *   endpoint: '/api/products',
 *   queryParams: { category },
 * });
 */
export function useApiQuery<
  TData,
  TParams extends Record<string, unknown> = Record<string, unknown>,
>(
  args: UseApiQueryConfig<TData, TParams> | string
): UseQueryResult<TData> {
  // Normalize arguments: support simple string endpoint or config object
  const config: UseApiQueryConfig<TData, TParams> =
    typeof args === "string" ? { endpoint: args, key: args } : args;

  const {
    key,
    endpoint,
    method = "GET",
    queryParams,
    organizationId: explicitOrgId,
    enabled = true,
    requireOrganization = true,
    options,
  } = config;

  // Auto-fetch session if organizationId is not provided AND organization is required
  const { data: session } = useTenantSession({
    enabled: !explicitOrgId && requireOrganization,
  });

  const organizationId = explicitOrgId ?? session?.tenant?.id;

  // Determine if query should be enabled
  const shouldEnable =
    enabled && (requireOrganization ? Boolean(organizationId) : true);

  // Build query key
  const paramsKey = serializeQueryParams(queryParams);
  const baseKey = Array.isArray(key) ? [...key] : [key];
  const queryKey: readonly unknown[] = paramsKey
    ? [...baseKey, organizationId, paramsKey]
    : [...baseKey, organizationId];

  return useQuery<TData>({
    queryKey,
    enabled: shouldEnable,
    queryFn: () =>
      clientFetch<TData>(endpoint, {
        method,
        params: queryParams as Record<string, string | number | boolean | undefined>,
        organizationId,
      }),
    ...options,
  });
}
