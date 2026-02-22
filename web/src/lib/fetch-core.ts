import type { FetchOptions } from "@/lib/types";

export interface FetchCoreOptions extends FetchOptions {
  baseUrl?: string;
}

function buildUrl(url: string, baseUrl?: string, params?: FetchOptions["params"]): string {
  const resolvedBaseUrl = baseUrl ?? "";
  let finalUrl = url.startsWith("http") ? url : `${resolvedBaseUrl}${url}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl += `?${queryString}`;
    }
  }

  return finalUrl;
}

function normalizeHeaders(headersInit: FetchOptions["headers"]): Headers {
  const headers = new Headers();

  if (headersInit instanceof Headers) {
    headersInit.forEach((value, key) => {
      headers.set(key, value);
    });
  } else if (Array.isArray(headersInit)) {
    headersInit.forEach(([key, value]) => {
      headers.set(key, String(value));
    });
  } else if (headersInit && typeof headersInit === "object") {
    for (const [key, value] of Object.entries(headersInit)) {
      if (value !== undefined) {
        headers.set(key, String(value));
      }
    }
  }

  return headers;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isURLSearchParams(value: unknown): value is URLSearchParams {
  return typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams;
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}

function isArrayBufferView(value: unknown): value is ArrayBufferView {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value);
}

function isReadableStream(value: unknown): value is ReadableStream {
  return typeof ReadableStream !== "undefined" && value instanceof ReadableStream;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function shouldSetJsonContentType(body: FetchOptions["body"]): boolean {
  if (body === null || body === undefined) return false;
  if (typeof body === "string") return false;
  if (isFormData(body)) return false;
  if (isBlob(body)) return false;
  if (isURLSearchParams(body)) return false;
  if (isArrayBuffer(body)) return false;
  if (isArrayBufferView(body)) return false;
  if (isReadableStream(body)) return false;
  return isPlainObject(body) || Array.isArray(body);
}

function normalizeBody(body: FetchOptions["body"]): BodyInit | null {
  if (body === null || body === undefined) return null;
  if (typeof body === "string") {
    return body;
  }
  if (isFormData(body)) return body;
  if (isBlob(body)) return body;
  if (isURLSearchParams(body)) return body;
  if (isArrayBuffer(body)) return body;
  if (isArrayBufferView(body)) return body;
  if (isReadableStream(body)) return body;
  return JSON.stringify(body);
}

export async function fetchCore<T>(
  url: string,
  options: FetchCoreOptions = {},
): Promise<T> {
  const { params, body, baseUrl, headers: headersInit, ...fetchOptions } = options;
  const finalUrl = buildUrl(url, baseUrl, params);
  const headers = normalizeHeaders(headersInit);
  if (!headers.has("Content-Type") && shouldSetJsonContentType(body)) {
    headers.set("Content-Type", "application/json");
  }
  const processedBody = normalizeBody(body);

  const response = await fetch(finalUrl, {
    ...fetchOptions,
    headers,
    body: processedBody,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    
    // Try to parse JSON error response and extract message
    let errorMessage = errorText || response.statusText;
    try {
      const errorJson = JSON.parse(errorText);
      if (Array.isArray(errorJson?.details?.issues) && errorJson.details.issues.length > 0) {
        const issueMessages = errorJson.details.issues.map((issue: { path?: string; message?: string }) => {
          const path = issue?.path ? String(issue.path) : "";
          const message = issue?.message ? String(issue.message) : "Invalid value";
          return path ? `${path}: ${message}` : message;
        });
        errorMessage = issueMessages.join("; ");
      } else {
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      }
    } catch {
      // Not JSON, use raw text
    }
    
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return {} as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export { buildUrl, normalizeHeaders, normalizeBody };
