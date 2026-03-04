import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbList } from "@/lib/seo/jsonld";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";

export const revalidate = 10800; // 3 hours

export const metadata: Metadata = {
  title: "Tags",
  description: "Browse topics and discover related posts.",
  alternates: { canonical: "/tags" },
  openGraph: {
    type: "website",
    title: "Tags",
    description: "Browse topics and discover related posts.",
    url: "/tags",
  },
  twitter: {
    card: "summary",
    title: "Tags",
    description: "Browse topics and discover related posts.",
  },
};

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

export default async function TagsPage() {
  const res = await fetchJson<{ success: true; data: PublicTag[] }>(
    "/api/public/blog-tags",
  ).catch(() => ({ success: true as const, data: [] as PublicTag[] }));
  const tags = res.data ?? [];

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
    </div>
  );
}
