import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

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

  const tag = url.searchParams.get("tag") ?? "landing";
  revalidateTag(tag, "max");
  return NextResponse.json({ ok: true, revalidated: { tag } });
}
