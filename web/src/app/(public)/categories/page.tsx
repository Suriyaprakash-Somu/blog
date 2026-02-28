import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { DynamicIcon } from "@/components/icons/DynamicIcon";
import { LayoutGrid } from "lucide-react";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbList } from "@/lib/seo/jsonld";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";

export const revalidate = 60 * 60 * 3;

export const metadata: Metadata = {
  title: "Categories",
  description: "Explore posts by category.",
};

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3005";
  const res = await fetch(`${apiBase}${url}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return (await res.json()) as T;
}

export default async function CategoriesPage() {
  const res = await fetchJson<{ success: true; data: PublicCategory[] }>(
    "/api/public/blog-categories",
  );
  const categories = res.data ?? [];

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
    </div>
  );
}
