import React, { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { MarkdownContentServer } from "@/components/blog/MarkdownContentServer";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbList, faqPage } from "@/lib/seo/jsonld";
import { getPublicImageUrl } from "@/lib/utils";
import { PublicBreadcrumbs } from "@/components/layout/PublicBreadcrumbs";
import {
  ClientWidgets,
  SidebarWidgets,
} from "@/components/blog/ClientWidgets.client";
import { getPublicSiteSettings } from "@/lib/api/public-settings";
import { buildOgImageUrl } from "@/lib/utils";

export const revalidate = 10800; // 3 hours

type PublicPostDetail = {
  id: string;
  categoryId?: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  faq: { question: string; answer: string }[];
  tags: { id: string; name: string; slug: string }[];
  secondaryCategories: { id: string; name: string; slug: string }[];
  tableOfContents: { id: string; text: string; level: number }[] | null;
  updatedAt: string | null;
  publishedAt: string | null;
  readTimeMinutes: number;
  featuredImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  authorName: string | null;
  authorEmail: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  relatedPosts?: { slug: string; title: string }[];
  popularPosts?: { slug: string; title: string }[];
};

const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";

// Deduplicated fetch: generateMetadata and page component share a single call
const getPost = cache(async (slug: string): Promise<PublicPostDetail | null> => {
  try {
    const res = await fetch(
      `${apiBase}/api/public/blog-posts/${encodeURIComponent(slug)}`,
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
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  const settings = await getPublicSiteSettings();

  if (!post) {
    return {
      title: "Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = post.metaTitle?.trim() || post.title;
  const description =
    post.metaDescription?.trim() || post.excerpt?.trim() || undefined;
  const keywords = toKeywords(post.metaKeywords);
  const ogImage = buildOgImageUrl(
    getPublicImageUrl(post.featuredImageUrl),
    settings.logos.lightLogoUrl,
  );
  const modifiedTime = post.updatedAt ?? post.publishedAt ?? undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime,
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

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const settings = await getPublicSiteSettings();
  const siteName = settings.identity.siteName || "Indian Context";
  const ogImage = buildOgImageUrl(
    getPublicImageUrl(post.featuredImageUrl),
    settings.logos.lightLogoUrl,
  );
  const published = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
  const modified = (post.updatedAt || post.publishedAt)
    ? new Date(String(post.updatedAt || post.publishedAt)).toISOString()
    : undefined;


  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Blog", url: absoluteUrl("/blog") },
    { name: post.title, url: absoluteUrl(`/blog/${post.slug}`) },
  ]);

  const faqSchema = post.faq && post.faq.length > 0 ? faqPage(post.faq) : null;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
    headline: post.metaTitle?.trim() || post.title,
    description: post.metaDescription?.trim() || post.excerpt?.trim() || undefined,
    image: ogImage ? [ogImage] : undefined,
    datePublished: published,
    dateModified: modified,
    author: post.authorName
      ? {
          "@type": "Person",
          name: post.authorName,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: settings.logos.lightLogoUrl
        ? {
            "@type": "ImageObject",
            url: settings.logos.lightLogoUrl,
          }
        : undefined,
    },
    keywords: (post.tags || []).map((t) => t.name).filter(Boolean),
    articleSection: post.categoryName || undefined,
    inLanguage: "en",
    isAccessibleForFree: true,
  };

  return (
    <article className="container mx-auto px-4 py-8 pb-24">
      <JsonLd data={[breadcrumbs, ...(faqSchema ? [faqSchema] : [])]} />
      <JsonLd data={blogPostingSchema} />

      <div className="mx-auto max-w-6xl">
        <PublicBreadcrumbs
          customCrumbs={[
            { label: "Blog", href: "/blog", isLast: false },
            { label: post.title, href: `/blog/${post.slug}`, isLast: true },
          ]}
        />
      </div>

      <ClientWidgets
        headings={post.tableOfContents || []}
        tags={post.tags || []}
        secondaryCategories={post.secondaryCategories || []}
        // Related/Popular are rendered server-side below for SEO; avoid duplicate UI.
        relatedPosts={[]}
        popularPosts={[]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10 relative mx-auto max-w-6xl">
        <div className="min-w-0">
          <div className="space-y-6 mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl lg:leading-tight text-balance">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm mt-8 mb-8 font-medium text-muted-foreground w-full border-y py-4">
              {post.authorName ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {post.authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-foreground">{post.authorName}</span>
                </div>
              ) : null}

              {post.authorName && (post.categoryName || post.publishedAt) && (
                <span className="hidden sm:inline">•</span>
              )}

              {post.categoryName && post.categorySlug ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/categories/${post.categorySlug}`}
                    className="text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    {post.categoryName}
                  </Link>
                </div>
              ) : null}

              {post.categoryName && post.publishedAt && (
                <span className="hidden sm:inline">•</span>
              )}

              <time dateTime={post.publishedAt || new Date().toISOString()}>
                {post.publishedAt
                  ? format(new Date(post.publishedAt), "MMMM d, yyyy")
                  : "Recently"}
              </time>

              <span className="hidden sm:inline">•</span>
              <span>{post.readTimeMinutes || 5} min read</span>
            </div>

            {post.excerpt ? (
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mt-6 text-justify leading-relaxed">
                {post.excerpt}
              </p>
            ) : null}
          </div>

          {post.featuredImageUrl ? (
            <div className="aspect-21/9 w-full overflow-hidden max-w-6xl mx-auto rounded-3xl bg-muted mb-16 shadow-lg border">
              <img
                src={getPublicImageUrl(post.featuredImageUrl) ?? undefined}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          <div className="w-full">
            <MarkdownContentServer
              source={post.content || "_No content provided._"}
            />
          </div>

          {(post.relatedPosts && post.relatedPosts.length > 0) ||
          (post.popularPosts && post.popularPosts.length > 0) ? (
            <div className="mt-16 border-t pt-12 mx-auto max-w-[98ch]">
              {post.relatedPosts && post.relatedPosts.length > 0 ? (
                <section>
                  <h2 className="text-2xl font-extrabold tracking-tight mb-6">
                    Related Posts
                  </h2>
                  <div className="grid gap-3">
                    {post.relatedPosts.slice(0, 6).map((p) => (
                      <Link
                        key={p.slug}
                        href={`/blog/${p.slug}`}
                        className="group rounded-xl border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {p.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {post.popularPosts && post.popularPosts.length > 0 ? (
                <section className={post.relatedPosts && post.relatedPosts.length > 0 ? "mt-12" : ""}>
                  <h2 className="text-2xl font-extrabold tracking-tight mb-6">
                    Popular Posts
                  </h2>
                  <div className="grid gap-3">
                    {post.popularPosts.slice(0, 6).map((p) => (
                      <Link
                        key={p.slug}
                        href={`/blog/${p.slug}`}
                        className="group rounded-xl border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {p.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          {post.faq && post.faq.length > 0 ? (
            <div className="mt-24 border-t pt-16 mx-auto max-w-[98ch]">
              <h2 className="text-3xl font-extrabold tracking-tight mb-10 text-balance">
                Frequently Asked Questions
              </h2>
              <div className="space-y-8">
                {post.faq.map((item, index) => (
                  <div key={index}>
                    <h3 className="text-xl font-semibold mb-3 text-balance">
                      {item.question}
                    </h3>
                    <p className="leading-7 text-foreground/90">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden lg:block relative">
          <SidebarWidgets
            headings={post.tableOfContents || []}
            tags={post.tags || []}
            secondaryCategories={post.secondaryCategories || []}
            // Related/Popular are rendered server-side below for SEO; avoid duplicate UI.
            relatedPosts={[]}
            popularPosts={[]}
          />
        </div>
      </div>
    </article>
  );
}
