// app/sitemap.js

import { db } from "@/db/client";
import {
  blogPost,
  blogCategory,
  blogTag,
  blogPostTag,
} from "@/db/schema/blog/blog-schema";
import { and, eq, sql } from "drizzle-orm";

// Normalize BASE URL and provide a safe fallback
const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com"
).replace(/\/+$/, "");

const STATIC_PUBLIC = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/tags", changeFrequency: "weekly", priority: 0.6 },
  { path: "/blog-categories", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.2 },
];

const NOINDEX_PREFIXES = ["/dashboard", "/author", "/api"];

const escSegments = (s = "") =>
  String(s).split("/").map(encodeURIComponent).join("/");

const shouldInclude = (path) =>
  !NOINDEX_PREFIXES.some((p) => path.startsWith(p));

export const revalidate = 43200;

// helper: pick latest valid date
function pickLastMod(...dates) {
  const ts = dates
    .map((d) => (d ? new Date(d).getTime() : 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  const max = ts.length ? Math.max(...ts) : 0;
  return max ? new Date(max) : new Date();
}

export default async function sitemap() {
  // 1) Published blog posts
  const posts =
    (await db
      .select({
        slug: blogPost.slug,
        publishedAt: blogPost.publishedAt,
        createdAt: blogPost.createdAt,
        updatedAt: blogPost.updatedAt, // ⬅️ use updatedAt for lastmod
      })
      .from(blogPost)
      .where(
        and(
          eq(blogPost.status, "published"),
          sql`${blogPost.publishedAt} IS NOT NULL`,
          sql`${blogPost.publishedAt} <= NOW()`
        )
      )) || [];

  // 2) Category landing pages
  const categories =
    (await db
      .select({
        fullSlug: blogCategory.fullSlug,
        updatedAt: blogCategory.updatedAt, // ⬅️ use updatedAt for lastmod
      })
      .from(blogCategory)) || [];

  // 3) Tag pages: LEFT JOIN to keep tags with zero posts,
  // lastModified = max(updatedAt) among published posts under the tag
  const tags =
    (await db
      .select({
        slug: blogTag.slug,
        tagUpdatedAt: blogTag.updatedAt,
        latestPostUpdatedAt: sql`
          MAX(${blogPost.updatedAt}) FILTER (
            WHERE ${blogPost.id} IS NOT NULL
              AND ${blogPost.status} = 'published'
              AND ${blogPost.publishedAt} IS NOT NULL
              AND ${blogPost.publishedAt} <= NOW()
          )
        `.as("latestPostUpdatedAt"),
      })
      .from(blogTag)
      .leftJoin(blogPostTag, eq(blogPostTag.tagId, blogTag.id))
      .leftJoin(blogPost, eq(blogPost.id, blogPostTag.postId))
      .groupBy(blogTag.slug, blogTag.updatedAt)) || [];

  const now = new Date();

  // 3) Assemble entries
  const entries = [
    // Static public pages
    ...STATIC_PUBLIC.filter((r) => shouldInclude(r.path)).map((r) => ({
      url: `${BASE}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })),

    // Category pages
    ...categories
      .filter((c) => c.fullSlug)
      .map((c) => {
        const path = `/blog-categories/${escSegments(c.fullSlug)}`;
        if (!shouldInclude(path)) return null;
        return {
          url: `${BASE}${path}`,
          lastModified: pickLastMod(c.updatedAt) || now,
          changeFrequency: "weekly",
          priority: 0.8,
        };
      })
      .filter(Boolean),
    // Tag pages
    ...tags
      .filter((t) => t.slug)
      .map((t) => {
        const path = `/tags/${escSegments(t.slug)}`;
        if (!shouldInclude(path)) return null;
        const lastMod = pickLastMod(t.latestPostUpdatedAt, t.tagUpdatedAt);
        return {
          url: `${BASE}${path}`,
          lastModified: lastMod,
          changeFrequency: "weekly",
          priority: 0.6,
        };
      })
      .filter(Boolean),

    // Blog posts — set to daily
    ...posts
      .map((p) => {
        const path = `/blog/${p.slug}`;
        if (!shouldInclude(path)) return null;
        return {
          url: `${BASE}${path}`,
          lastModified: pickLastMod(p.updatedAt, p.publishedAt, p.createdAt),
          changeFrequency: "weekly", // ⬅️ changed from "weekly" to "daily"
          priority: 0.7,
        };
      })
      .filter(Boolean),
  ];

  return entries;
}
