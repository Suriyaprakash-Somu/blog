import React from "react";
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

export const revalidate = 60 * 60 * 3;

type PublicPostDetail = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  faq: { question: string; answer: string }[];
  tags: { id: string; name: string; slug: string }[];
  secondaryCategories: { id: string; name: string; slug: string }[];
  tableOfContents: { id: string; text: string; level: number }[] | null;
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
};

async function fetchJson<T>(url: string): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3005";
  const res = await fetch(`${apiBase}${url} `, { next: { revalidate } });
  if (!res.ok) throw new Error(`Request failed: ${url} `);
  return (await res.json()) as T;
}

function toKeywords(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function asOgImage(url: string | null): string | undefined {
  if (!url) return undefined;
  // Only include if it already looks like a URL.
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = await params;

  const res = await fetchJson<{ success: true; data: PublicPostDetail }>(
    `/api/public/blog-posts/${encodeURIComponent(slug)}`,
  ).catch(() => null);

  if (!res?.data) {
    return {
      title: "Post Not Found",
      robots: { index: false, follow: false },
    };
  }

  const post = res.data;
  const title = post.metaTitle?.trim() || post.title;
  const description =
    post.metaDescription?.trim() || post.excerpt?.trim() || undefined;
  const keywords = toKeywords(post.metaKeywords);
  const ogImage = asOgImage(getPublicImageUrl(post.featuredImageUrl) ?? null);

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

  const res = await fetchJson<{ success: true; data: PublicPostDetail }>(
    `/api/public/blog-posts/${encodeURIComponent(slug)}`,
  ).catch(() => null);

  if (!res?.data) notFound();
  const post = res.data;

  const breadcrumbs = breadcrumbList([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Blog", url: absoluteUrl("/blog") },
    { name: post.title, url: absoluteUrl(`/blog/${post.slug}`) },
  ]);

  const faqSchema = post.faq && post.faq.length > 0 ? faqPage(post.faq) : null;

  return (
    <article className="container mx-auto px-4 py-8 pb-24">
      <JsonLd data={[breadcrumbs, ...(faqSchema ? [faqSchema] : [])]} />

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
          />
        </div>
      </div>
    </article>
  );
}
