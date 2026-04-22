import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";
import { absoluteUrl, breadcrumbList } from "@/lib/seo/jsonld";
import { getPublicImageUrl } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { getPublicSiteSettings } from "@/lib/api/public-settings";

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
    title: page > 1 ? `Blog (Page ${page})` : "Blog",
    description: "Browse the latest posts, announcements, and tutorials.",
    alternates: { canonical: "/blog" },
    robots: page > 1 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: page > 1 ? `Blog (Page ${page})` : "Blog",
      description: "Browse the latest posts, announcements, and tutorials.",
      url: "/blog",
    },
    twitter: {
      card: "summary",
      title: page > 1 ? `Blog (Page ${page})` : "Blog",
      description: "Browse the latest posts, announcements, and tutorials.",
    },
  };
}

type PublicPostListing = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  readTimeMinutes: number;
  isFeatured: boolean;
  featuredImageUrl: string | null;
  authorName: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";
  const res = await fetch(`${apiBase}${url}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return (await res.json()) as T;
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const settings = await getPublicSiteSettings();
  const logoUrl = settings.logos.lightLogoUrl;
  const siteName = settings.identity.siteName || "Indian Context";

  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 24;

  const res = await fetchJson<{
    success: true;
    data: PublicPostListing[];
    pagination?: { page: number; pageSize: number; rowCount: number };
  }>(`/api/public/blog-posts?page=${page}&pageSize=${pageSize}`).catch(() => ({
    success: true as const,
    data: [],
    pagination: { page, pageSize, rowCount: 0 },
  }));

  const posts = res.data ?? [];
  const rowCount = res.pagination?.rowCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));

  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Blog", url: absoluteUrl("/blog") },
  ]);

  const pageUrl = absoluteUrl(page > 1 ? `/blog?page=${page}` : "/blog");
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page > 1 ? `Blog (Page ${page})` : "Blog",
    url: pageUrl,
    description: "Browse the latest posts, announcements, and tutorials.",
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: absoluteUrl("/"),
    },
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: posts.length,
    itemListElement: posts.slice(0, 24).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: absoluteUrl(`/blog/${p.slug}`),
      name: p.title,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <JsonLd data={[breadcrumbs, collectionSchema, itemListSchema]} />

      <PublicBreadcrumbs />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
          Latest Insights & Articles
        </h1>
        <p className="text-xl text-muted-foreground w-full max-w-2xl mx-auto">
          Explore our latest thoughts, tutorials, and ecosystem updates.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-12 bg-secondary/20 rounded-lg">
          <p className="text-muted-foreground">No posts published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              data-article-click="true"
              data-article-slug={post.slug}
              data-article-title={post.title}
              className="group relative flex flex-col justify-end rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ring-1 ring-border/40 hover:ring-primary/40 bg-muted/60 min-h-[460px] sm:min-h-[420px]"
            >
              {/* Full Background Image */}
              <div className="absolute inset-0 w-full h-full">
                {post.featuredImageUrl ? (
                  <img
                    src={getPublicImageUrl(post.featuredImageUrl) ?? undefined}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                ) : logoUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/15 to-primary/5">
                    <img
                      src={logoUrl}
                      alt="Site logo"
                      className="w-[58%] max-w-[240px] h-auto object-contain opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5 transition-transform duration-700 ease-out group-hover:scale-110">
                    <span className="text-primary/40 font-semibold text-xl">
                      Blog Post
                    </span>
                  </div>
                )}
                {/* Subtle dark gradient to ensure text readability if it overflows or background is too bright */}
                <div className="absolute inset-0 bg-linear-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />

                {/* Floating Badge */}
                <div className="absolute top-5 right-5 bg-background/60 backdrop-blur-md shadow-sm rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase text-foreground z-20 border border-white/10 transition-transform group-hover:scale-105">
                  {post.readTimeMinutes || 5} min read
                </div>
              </div>

              {/* Glassmorphic Text Area Overlay */}
              <div className="relative z-10 p-6 sm:p-8 flex flex-col w-full bg-background/50 backdrop-blur-xl border-t border-white/10 group-hover:bg-background/60 transition-colors duration-500">
                <div className="flex items-center gap-x-2 text-xs mb-3 text-foreground/80 font-medium">
                  {post.authorName && (
                    <>
                      <span>{post.authorName}</span>
                      <span className="w-1 h-1 rounded-full bg-foreground/40 mx-1"></span>
                    </>
                  )}
                  <time dateTime={post.publishedAt || new Date().toISOString()}>
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "MMM d, yyyy")
                      : "Recently"}
                  </time>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {post.title}
                </h3>

                <p className="line-clamp-2 text-sm leading-relaxed text-foreground/80 mb-5">
                  {post.excerpt ?? ""}
                </p>

                <div className="inline-flex items-center text-sm font-bold text-primary group-hover:text-primary/80 transition-colors">
                  Read article
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-14 flex items-center justify-center gap-3">
          <Link
            href={page > 1 ? `/blog?page=${page - 1}` : "/blog"}
            className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            aria-disabled={page <= 1}
          >
            Prev
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={page < totalPages ? `/blog?page=${page + 1}` : `/blog?page=${totalPages}`}
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
