import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbList } from "@/lib/seo/jsonld";
import { getPublicImageUrl } from "@/lib/utils";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";

export const revalidate = 10800; // 3 hours

type PublicTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
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

const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";

const getTag = cache(async (slug: string): Promise<PublicTag | null> => {
  try {
    const res = await fetch(
      `${apiBase}/api/public/blog-tags/slug/${encodeURIComponent(slug)}`,
      { next: { revalidate } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
});

function toKeywords(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    return {
      title: "Tag Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = tag.metaTitle?.trim() || tag.name;
  const description =
    tag.metaDescription?.trim() || tag.description?.trim() || undefined;
  const keywords = toKeywords(tag.metaKeywords);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/tags/${tag.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/tags/${tag.slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [tag, postsRes] = await Promise.all([
    getTag(slug),
    fetch(`${apiBase}/api/public/blog-posts?tagSlug=${encodeURIComponent(slug)}&limit=24`, {
      next: { revalidate },
    })
      .then((r) => r.ok ? r.json() : { data: [] })
      .catch(() => ({ data: [] })),
  ]);

  if (!tag) notFound();
  const posts: PublicPostListing[] = postsRes.data ?? [];


  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Tags", url: absoluteUrl("/tags") },
    { name: tag.name, url: absoluteUrl(`/tags/${tag.slug}`) },
  ]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <JsonLd data={breadcrumbs} />

      <PublicBreadcrumbs
        customCrumbs={[
          { label: "Tags", href: "/tags", isLast: false },
          { label: tag.name, href: `/tags/${tag.slug}`, isLast: true },
        ]}
      />

      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
          {tag.name}
        </h1>
        {tag.description ? (
          <p className="text-xl text-muted-foreground max-w-3xl">
            {tag.description}
          </p>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-12 bg-secondary/20 rounded-lg">
          <p className="text-muted-foreground">No posts with this tag yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col items-start justify-between bg-card text-card-foreground rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              {post.featuredImageUrl ? (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={getPublicImageUrl(post.featuredImageUrl) ?? undefined}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
                  <span className="text-primary/40 font-semibold text-lg">
                    Read Post
                  </span>
                </div>
              )}
              <div className="p-6 flex flex-col flex-1 w-full">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  {post.authorName && (
                    <>
                      <span>{post.authorName}</span>
                      <span>•</span>
                    </>
                  )}
                  <span>{post.readTimeMinutes || 5} min read</span>
                </div>
                <h3 className="text-xl font-semibold leading-6 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground flex-1">
                  {post.excerpt ?? ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
