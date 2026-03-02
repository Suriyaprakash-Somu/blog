import Link from "next/link";
import { format } from "date-fns";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";
import { absoluteUrl, breadcrumbList } from "@/lib/seo/jsonld";
import { getPublicImageUrl } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export const revalidate = 60 * 60 * 3;

export const metadata: Metadata = {
  title: "Blog",
  description: "Browse the latest posts, announcements, and tutorials.",
};

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

export default async function BlogIndexPage() {
  const res = await fetchJson<{ success: true; data: PublicPostListing[] }>(
    "/api/public/blog-posts",
  ).catch(() => ({ success: true as const, data: [] }));

  const posts = res.data ?? [];

  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Blog", url: absoluteUrl("/blog") },
  ]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <JsonLd data={breadcrumbs} />

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
    </div>
  );
}
