import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (token !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const tag = url.searchParams.get("tag");
  const path = url.searchParams.get("path");

  const revalidated: { tag?: string; paths?: string[] } = {};

  if (tag) {
    revalidateTag(tag, "max");
    revalidated.tag = tag;
  }

  if (path) {
    const paths = path
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.startsWith("/"));
    for (const p of paths) {
      revalidatePath(p, "page");
    }
    revalidated.paths = paths;
  }

  // Backward-compatible default
  if (!tag && !path) {
    revalidateTag("landing", "max");
    revalidated.tag = "landing";
  }

  return NextResponse.json({ ok: true, revalidated });
}
