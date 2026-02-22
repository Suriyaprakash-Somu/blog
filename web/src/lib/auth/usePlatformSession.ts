import { useQuery } from "@tanstack/react-query";
import { clientFetch } from "../client-fetch";
import type { PlatformSessionData } from "@/lib/auth/sessionTypes";

export function usePlatformSession({ enabled = true } = {}) {
  const { data, isLoading, error } = useQuery<PlatformSessionData>({
    queryKey: ["platform-session"],
    queryFn: () => clientFetch("/api/auth/platform/me"),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    enabled,
  });

  return { data, loading: isLoading, error };
}
