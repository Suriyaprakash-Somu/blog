"use client";

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { clientFetch } from "@/lib/client-fetch";
import { getQueryClient } from "@/lib/queryClient";
import { revalidateCache } from "@/actions/cache-actions";
import type { FetchOptions } from "@/lib/types";

/**
 * Configuration for useApiMutation hook
 */
export interface UseApiMutationConfig<TData, TVariables, TError = Error> {
  /** API endpoint - can be string or function that receives variables */
  endpoint: string | ((variables: TVariables) => string);
  /** HTTP method (default: POST) */
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  /** Organization ID for multi-tenant context */
  organizationId?: string;
  /** Callback on success */
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
  /** Callback on error */
  onError?: (error: TError, variables: TVariables, context: unknown) => void;
  /** Tags/query keys to invalidate on success (for React Query) */
  revalidateTags?: string[];
  /** Paths to revalidate on success (for Next.js page cache) */
  revalidatePaths?: string[];
  /** Additional react-query mutation options */
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables>,
    "mutationFn" | "onSuccess" | "onError"
  >;
}

/**
 * Invalidate React Query cache by tags/query keys
 * This triggers refetch for any active queries matching the keys
 */
function invalidateQueryCache(tags: string[]): void {
  if (tags.length === 0) return;
  
  const queryClient = getQueryClient();
  
  for (const tag of tags) {
    void queryClient.invalidateQueries({
      queryKey: [tag],
      exact: false,
      refetchType: "active",
    });
  }
}

/**
 * Type-safe API mutation hook
 *
 * @example
 * // Create user
 * const mutation = useApiMutation<User, CreateUserInput>({
 *   endpoint: '/api/users',
 *   method: 'POST',
 *   revalidateTags: ['users'],
 * });
 *
 * @example
 * // Update with dynamic endpoint
 * const mutation = useApiMutation<User, UpdateUserInput>({
 *   endpoint: (vars) => `/api/users/${vars.id}`,
 *   method: 'PUT',
 * });
 */
export function useApiMutation<TData, TVariables, TError = Error>(
  config: UseApiMutationConfig<TData, TVariables, TError>
): UseMutationResult<TData, TError, TVariables> {
  const {
    endpoint,
    method = "POST",
    organizationId,
    onSuccess,
    onError,
    revalidateTags = [],
    revalidatePaths = [],
    options,
  } = config;

  return useMutation<TData, TError, TVariables>({
    mutationFn: (variables: TVariables) => {
      const url =
        typeof endpoint === "function" ? endpoint(variables) : endpoint;
      return clientFetch<TData>(url, {
        method,
        body: variables as FetchOptions["body"],
        organizationId,
      });
    },
    onSuccess: async (data, variables, context) => {
      // Invalidate React Query cache for listed tags (client-side)
      if (revalidateTags.length > 0) {
        invalidateQueryCache(revalidateTags);
      }
      
      // Revalidate Next.js cache for paths/tags (server-side)
      if (revalidatePaths.length > 0) {
        await revalidateCache({ paths: revalidatePaths });
      }
      
      onSuccess?.(data, variables, context);
    },
    onError,
    ...options,
  });
}
