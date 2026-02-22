import { useQuery } from "@tanstack/react-query";
import { clientFetch } from "@/lib/client-fetch";
import type { TenantSessionData } from "@/lib/auth/sessionTypes";

export function useTenantSession(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ["tenant-session"],
    queryFn: async () => {
      return clientFetch<TenantSessionData>("/api/auth/tenant/me", {
        method: "GET",
      });
    },
    retry: false,
    enabled,
  });
}
