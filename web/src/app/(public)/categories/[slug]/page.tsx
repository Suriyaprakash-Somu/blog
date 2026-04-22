import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbList } from "@/lib/seo/jsonld";
import { getPublicImageUrl } from "@/lib/utils";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";
import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getPublicSiteSettings } from "@/lib/api/public-settings";
import { buildOgImageUrl } from "@/lib/utils";

export const revalidate = 10800; // 3 hours

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  content?: string | null;
  faq?: Array<{ question: string; answer: string }> | null;
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

const getCategory = cache(async (slug: string): Promise<PublicCategory | null> => {
  try {
    const res = await fetch(
      `${apiBase}/api/public/blog-categories/slug/${encodeURIComponent(slug)}`,
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 1 ? pageRaw : 1;
  const category = await getCategory(slug);
  const settings = await getPublicSiteSettings();

  if (!category) {
    return {
      title: "Category Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = category.metaTitle?.trim() || category.name;
  const description =
    category.metaDescription?.trim() ||
    category.description?.trim() ||
    undefined;
  const keywords = toKeywords(category.metaKeywords);
  const ogImage = buildOgImageUrl(category.imageUrl, settings.logos.lightLogoUrl);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/categories/${category.slug}` },
    robots: page > 1 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: `/categories/${category.slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : NaN;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = 24;

  const [category, postsRes] = await Promise.all([
    getCategory(slug),
    fetch(`${apiBase}/api/public/blog-posts?categorySlug=${encodeURIComponent(slug)}&page=${page}&pageSize=${pageSize}`, {
      next: { revalidate },
    })
      .then((r) => r.ok ? r.json() : { data: [] })
      .catch(() => ({ data: [] })),
  ]);

  if (!category) notFound();
  const posts: PublicPostListing[] = postsRes.data ?? [];
  const rowCount = postsRes.pagination?.rowCount ?? posts.length;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));

  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Categories", url: absoluteUrl("/categories") },
    { name: category.name, url: absoluteUrl(`/categories/${category.slug}`) },
  ]);

  const hasFaq = category.faq && category.faq.length > 0;
  const faqSchema = hasFaq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: category.faq!.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <JsonLd data={breadcrumbs} />
      {hasFaq && <JsonLd data={faqSchema} />}

      <PublicBreadcrumbs
        customCrumbs={[
          { label: "Categories", href: "/categories", isLast: false },
          { label: category.name, href: `/categories/${category.slug}`, isLast: true },
        ]}
      />

      <div className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
          {category.name}
        </h1>
        {category.description ? (
          <p className="text-xl text-muted-foreground max-w-3xl">
            {category.description}
          </p>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-12 bg-secondary/20 rounded-lg">
          <p className="text-muted-foreground">
            No posts in this category yet.
          </p>
        </div>
      ) : (
        <>
          {category.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none mt-10 mb-12 bg-card/50 rounded-3xl p-8 md:p-12 border border-border shadow-sm">
              <ReactMarkdown>{category.content}</ReactMarkdown>
            </div>
          )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              data-article-click="true"
              data-article-slug={post.slug}
              data-article-title={post.title}
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
        </>
      )}

      {totalPages > 1 ? (
        <div className="mt-14 flex items-center justify-center gap-3">
          <Link
            href={page > 1 ? `/categories/${category.slug}?page=${page - 1}` : `/categories/${category.slug}`}
            className={`rounded-md border px-3 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            aria-disabled={page <= 1}
          >
            Prev
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={page < totalPages ? `/categories/${category.slug}?page=${page + 1}` : `/categories/${category.slug}?page=${totalPages}`}
            className={`rounded-md border px-3 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
            aria-disabled={page >= totalPages}
          >
            Next
          </Link>
        </div>
      ) : null}

      {hasFaq && (
        <div className="mt-20 mb-16 max-w-4xl mx-auto bg-card rounded-3xl p-8 md:p-12 border shadow-sm">
          <h2 className="text-3xl font-extrabold mb-8 text-center text-foreground">
            Frequently Asked Questions
          </h2>
          <Accordion className="w-full">
            {category.faq!.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b-border/30">
                <AccordionTrigger className="text-lg font-medium text-left hover:text-primary hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
