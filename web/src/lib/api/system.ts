import { clientFetch } from "../client-fetch";
import { normalizeHeaders } from "../fetch-core";

/**
 * Triggers a database backup download
 */
export async function downloadBackup(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";
  const url = `${baseUrl}/api/platform/system/backup`;
  
  // We need to use native fetch for Blobs because fetchCore is hardcoded for JSON
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  
  // Get CSRF token if present
  const csrfCookieName = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
  const csrfHeaderName = process.env.NEXT_PUBLIC_CSRF_HEADER_NAME ?? "x-csrf-token";
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return undefined;
    return document.cookie
      .split("; ")
      .find(row => row.startsWith(`${name}=`))
      ?.split("=")[1];
  };
  const csrfToken = getCookie(csrfCookieName);
  if (csrfToken) headers.set(csrfHeaderName, csrfToken);

  const response = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.message || "Failed to download backup");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  // Try to get filename from Content-Disposition
  const disposition = response.headers.get("Content-Disposition");
  let filename = `indiancontext_backup_${new Date().toISOString().slice(0, 10)}.dump`;
  if (disposition && disposition.includes("filename=")) {
    const parts = disposition.split("filename=");
    const filenamePart = parts[1];
    if (filenamePart) {
      filename = filenamePart.replace(/"/g, "");
    }
  }

  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * Uploads a database dump for restoration
 */
export async function restoreDatabase(file: File): Promise<{ ok: boolean; message: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return clientFetch("/api/platform/system/restore", {
    method: "POST",
    body: formData,
  });
}
