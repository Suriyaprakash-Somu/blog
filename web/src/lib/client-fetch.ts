import { fetchCore, normalizeHeaders } from "@/lib/fetch-core";
import type { FetchOptions } from "@/lib/types";

export interface ClientFetchOptions extends FetchOptions {
  organizationId?: string;
}

function getCookieValue(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!value) return undefined;
  return decodeURIComponent(value.slice(name.length + 1));
}

/**
 * Client-side fetch wrapper that adds organization context
 */
export async function clientFetch<T>(
  url: string,
  options: ClientFetchOptions = {}
): Promise<T> {
  const { organizationId, ...fetcherOptions } = options;

  const headers = normalizeHeaders(fetcherOptions.headers);

  const csrfCookieName =
    process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
  const csrfHeaderName =
    process.env.NEXT_PUBLIC_CSRF_HEADER_NAME ?? "x-csrf-token";
  const csrfToken = getCookieValue(csrfCookieName);
  if (csrfToken && !headers.has(csrfHeaderName)) {
    headers.set(csrfHeaderName, csrfToken);
  }

  // Add organization header if provided
  if (organizationId) {
    headers.set("X-Organization-Id", organizationId);
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";

  return fetchCore<T>(url, {
    ...fetcherOptions,
    headers,
    cache: "no-store",
    credentials: "include",
    baseUrl,
  });
}
