import { QueryClient } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

/**
 * Get query client instance (singleton on client, fresh on server)
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create new instance
    return makeQueryClient();
  }

  // Browser: reuse existing or create new
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export const queryClient = getQueryClient();
