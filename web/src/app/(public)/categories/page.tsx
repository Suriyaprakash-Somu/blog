import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import { LayoutGrid } from "lucide-react";
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
    title: page > 1 ? `Categories (Page ${page})` : "Categories",
    description: "Explore posts by category.",
    alternates: { canonical: "/categories" },
    robots: page > 1 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: page > 1 ? `Categories (Page ${page})` : "Categories",
      description: "Explore posts by category.",
      url: "/categories",
    },
    twitter: {
      card: "summary",
      title: page > 1 ? `Categories (Page ${page})` : "Categories",
      description: "Explore posts by category.",
    },
  };
}

type PublicCategory = {
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

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 60;

  const res = await fetchJson<{
    success: true;
    data: PublicCategory[];
    pagination?: { page: number; pageSize: number; rowCount: number };
  }>(`/api/public/blog-categories?page=${page}&pageSize=${pageSize}`).catch(() => ({
    success: true as const,
    data: [] as PublicCategory[],
    pagination: { page, pageSize, rowCount: 0 },
  }));
  const categories = res.data ?? [];
  const rowCount = res.pagination?.rowCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));

  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Categories", url: absoluteUrl("/categories") },
  ]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <JsonLd data={breadcrumbs} />

      <PublicBreadcrumbs />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
          Categories
        </h1>
        <p className="text-xl text-muted-foreground w-full max-w-2xl mx-auto">
          Explore topics curated by the editorial taxonomy.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center p-12 bg-secondary/20 rounded-lg">
          <p className="text-muted-foreground">No categories available yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              <Card className="h-full bg-card hover:bg-muted/50 transition-colors border shadow-sm hover:shadow-md group relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    {category.icon ? (
                      <DynamicIcon name={category.icon} className="h-6 w-6" />
                    ) : (
                      <LayoutGrid className="h-6 w-6" />
                    )}
                  </div>
                  <h3 className="mb-2 font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {category.description || "Explore posts in this category."}
                  </p>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-14 flex items-center justify-center gap-3">
          <Link
            href={page > 1 ? `/categories?page=${page - 1}` : "/categories"}
            className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            aria-disabled={page <= 1}
          >
            Prev
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={page < totalPages ? `/categories?page=${page + 1}` : `/categories?page=${totalPages}`}
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
