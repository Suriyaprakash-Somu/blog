import { env } from "../common/env.js";

export async function webRevalidatePaths(paths: string[]) {
  if (!env.WEB_REVALIDATE_URL || !env.WEB_REVALIDATE_SECRET) return;
  const normalized = paths
    .map((p) => p.trim())
    .filter((p) => p.startsWith("/"));
  if (normalized.length === 0) return;

  const url = new URL("/api/revalidate", env.WEB_REVALIDATE_URL);
  url.searchParams.set("token", env.WEB_REVALIDATE_SECRET);
  url.searchParams.set("path", normalized.join(","));

  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Web revalidate failed: ${res.status} ${body}`);
  }
}
