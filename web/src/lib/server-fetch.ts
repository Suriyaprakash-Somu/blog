import type { FetchOptions } from "@/lib/types";
import { fetchCore } from "@/lib/fetch-core";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(name.length + 1));
}

/**
 * Server-side fetch wrapper with typed responses
 */
export async function serverFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";

  const headers = new Headers(options.headers ?? {});
  const forwardAuth = process.env.NEXT_SERVER_FETCH_FORWARD_AUTH === "true";

  if (forwardAuth) {
    const cookieHeader = headers.get("cookie") ?? null;
    const csrfCookieName =
      process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
    const csrfHeaderName =
      process.env.NEXT_PUBLIC_CSRF_HEADER_NAME ?? "x-csrf-token";
    const method = (options.method ?? "GET").toUpperCase();

    if (!SAFE_METHODS.has(method)) {
      const csrfToken = getCookieValue(cookieHeader, csrfCookieName);
      if (csrfToken && !headers.has(csrfHeaderName)) {
        headers.set(csrfHeaderName, csrfToken);
      }
    }
  }

  return fetchCore<T>(url, {
    ...options,
    headers,
    baseUrl,
  });
}
