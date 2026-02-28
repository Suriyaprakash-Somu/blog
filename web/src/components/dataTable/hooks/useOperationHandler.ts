"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useApiMutation } from "@/hooks/useApiMutation";
import { getQueryClient } from "@/lib/queryClient";
import { validateOperation } from "../utils/validateOperation";
import type { BaseOperationConfig } from "../types";

interface UseOperationHandlerOptions<TData> {
  operationKey: string;
  operation?: BaseOperationConfig<TData>;
  organizationId?: string;
  onSuccess?: () => void;
  validationMode?: "strict" | "priority";
}

export function useOperationHandler<TData>({
  operationKey,
  operation,
  organizationId,
  onSuccess,
  validationMode = "strict",
}: UseOperationHandlerOptions<TData>) {
  const [isExecuting, setIsExecuting] = useState(false);

  // Validate operation config
  const validation = useMemo(() => {
    return validateOperation(operationKey, operation, validationMode);
  }, [operationKey, operation, validationMode]);

  // Log validation errors in development
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    
    if (validation.errors.length > 0) {
      console.error("[useOperationHandler]", validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn("[useOperationHandler]", validation.warnings);
    }
  }, [validation]);

  // Determine execution type based on validation
  const executionType = validation.isValid ? validation.executionType : "none";
  
  const hasComponent = executionType === "component";
  const hasApi = executionType === "api";
  const hasHandler = executionType === "handler";
  const needsConfirmation = Boolean(operation?.confirmation);

  // API mutation setup
  const mutation = useApiMutation<unknown, TData>({
    endpoint: (variables) => {
      let url = operation?.api?.endpoint ?? "";
      if (variables && typeof variables === "object" && "id" in variables) {
        const id = (variables as { id: string | number }).id;
        // Replace :id placeholder or append /{id} if not present
        if (url.includes(":id")) {
          url = url.replace(":id", String(id));
        } else if (id && !url.endsWith(String(id))) {
          // If endpoint doesn't have ID placeholder and ID exists, append it
          url = url.replace(/\/$/, "") + "/" + String(id);
        }
      }
      return url;
    },
    method: operation?.api?.method ?? "POST",
    organizationId,
    revalidateNextTags: operation?.api?.revalidateNextTags ?? [],
    revalidatePaths: operation?.api?.revalidatePaths ?? [],
    onSuccess: (data: unknown) => {
      const message =
        typeof data === "object" && data && "message" in data
          ? (data as { message: string }).message
          : "Operation completed successfully";
      
      toast.success(message);

      // Invalidate cache
      if (operation?.api?.key) {
        const queryKey = Array.isArray(operation.api.key)
          ? operation.api.key
          : [operation.api.key];
        const queryClient = getQueryClient();
        void queryClient.invalidateQueries({
          queryKey,
          exact: false,
          refetchType: "all",
        });
      }

      onSuccess?.();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Operation failed";
      toast.error(message);
    },
    // Options removed as 'enabled' is not supported in mutation options
  });

  // Execute API operation
  const executeApiOperation = useCallback(
    (data?: TData) => {
      if (!hasApi || !operation?.api) return;
      mutation.mutate(data as TData);
    },
    [hasApi, operation, mutation]
  );

  // Execute handler function
  const executeHandler = useCallback(
    async (data?: TData) => {
      if (!hasHandler || !operation?.handler) return;

      try {
        setIsExecuting(true);
        await Promise.resolve(operation.handler(data));
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Operation failed";
        toast.error(message);
        console.error("[useOperationHandler] Handler error:", error);
      } finally {
        setIsExecuting(false);
      }
    },
    [hasHandler, operation, onSuccess]
  );

  // Unified execute function
  const execute = useCallback(
    (data?: TData) => {
      // Block execution if validation failed (strict mode)
      if (!validation.isValid) {
        console.error(
          `[useOperationHandler] Cannot execute "${operationKey}": validation failed`,
          validation.errors
        );
        toast.error(`Cannot execute ${operationKey}: configuration error`);
        return;
      }

      if (hasApi) {
        executeApiOperation(data);
      } else if (hasHandler) {
        void executeHandler(data);
      }
    },
    [validation, operationKey, hasApi, hasHandler, executeApiOperation, executeHandler]
  );

  return {
    validation,
    hasComponent,
    hasApi,
    hasHandler,
    executionType,
    needsConfirmation,
    component: operation?.component,
    confirmation: operation?.confirmation,
    requiresModal: operation?.requiresModal ?? hasComponent,
    execute,
    isLoading: mutation.isPending || isExecuting,
  };
}
