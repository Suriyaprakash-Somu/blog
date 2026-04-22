import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbList } from "@/lib/seo/jsonld";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";

export const revalidate = 10800; // 3 hours

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 1 ? pageRaw : 1;

  return {
    title: page > 1 ? `Tags (Page ${page})` : "Tags",
    description: "Browse topics and discover related posts.",
    alternates: { canonical: "/tags" },
    robots: page > 1 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: page > 1 ? `Tags (Page ${page})` : "Tags",
      description: "Browse topics and discover related posts.",
      url: "/tags",
    },
    twitter: {
      card: "summary",
      title: page > 1 ? `Tags (Page ${page})` : "Tags",
      description: "Browse topics and discover related posts.",
    },
  };
}

type PublicTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";
  const res = await fetch(`${apiBase}${url}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return (await res.json()) as T;
}

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 100;

  const res = await fetchJson<{
    success: true;
    data: PublicTag[];
    pagination?: { page: number; pageSize: number; rowCount: number };
  }>(`/api/public/blog-tags?page=${page}&pageSize=${pageSize}`).catch(() => ({
    success: true as const,
    data: [] as PublicTag[],
    pagination: { page, pageSize, rowCount: 0 },
  }));
  const tags = res.data ?? [];
  const rowCount = res.pagination?.rowCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));

  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Tags", url: absoluteUrl("/tags") },
  ]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <JsonLd data={breadcrumbs} />

      <PublicBreadcrumbs />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
          Tags
        </h1>
        <p className="text-xl text-muted-foreground w-full max-w-2xl mx-auto">
          Browse topics and discover related posts.
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="text-center p-12 bg-secondary/20 rounded-lg">
          <p className="text-muted-foreground">No tags available yet.</p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              title={tag.description ?? tag.name}
            >
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-2 text-sm hover:bg-secondary/80 transition-colors"
              >
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-14 flex items-center justify-center gap-3">
          <Link
            href={page > 1 ? `/tags?page=${page - 1}` : "/tags"}
            className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            aria-disabled={page <= 1}
          >
            Prev
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={page < totalPages ? `/tags?page=${page + 1}` : `/tags?page=${totalPages}`}
            className={`rounded-md border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            aria-disabled={page >= totalPages}
          >
            Next
          </Link>
        </div>
      ) : null}
    </div>
  );
}
