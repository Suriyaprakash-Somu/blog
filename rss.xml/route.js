// app/rss.xml/route.js
export const revalidate = 21600; // 6h ISR
export const dynamic = "force-static"; // cacheable at the edge
export const runtime = "nodejs"; // add this

import { unstable_cache } from "next/cache";
import { db } from "@/db/client";
import {
	blogPost,
	blogCategory,
	mediaAsset,
} from "@/db/schema/blog/blog-schema";
import { user as userTable } from "@/db/schema/auth/auth-schema";
import { and, eq, sql, desc, inArray } from "drizzle-orm";

/* ---------- config ---------- */
const BASE = (
	process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com"
).replace(/\/+$/, "");
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "IndianContext";
const RSS_LIMIT = 50;

/* ---------- helpers ---------- */
const mediaUrl = (id) => `/api/media/${id}`;
const cdata = (s = "") =>
	`<![CDATA[${String(s).replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

const escapeXml = (s = "") =>
	String(s).replace(
		/[<>&'"]/g,
		(c) =>
		({
			"<": "&lt;",
			">": "&gt;",
			"&": "&amp;",
			"'": "&apos;",
			'"': "&quot;",
		}[c])
	);


/** Simple: use coverAssetId only */
async function pickCovers(posts) {
	if (!posts.length) return {};
	const result = {};

	// Only use coverAssetId (validate it's an IMAGE that exists)
	const coverPairs = posts
		.filter((p) => p.coverAssetId)
		.map((p) => ({ postId: p.id, assetId: p.coverAssetId }));

	if (coverPairs.length) {
		const ids = coverPairs.map((p) => p.assetId);
		const rows = await db
			.select({ id: mediaAsset.id, mimeType: mediaAsset.mimeType })
			.from(mediaAsset)
			.where(inArray(mediaAsset.id, ids));
		const ok = new Set(
			rows
				.filter((r) => (r.mimeType || "").toLowerCase().startsWith("image/"))
				.map((r) => r.id)
		);
		for (const { postId, assetId } of coverPairs) {
			if (ok.has(assetId)) result[postId] = mediaUrl(assetId);
		}
	}

	return result;
}

/* ---------- cached DB reads (align with other pages) ---------- */

const getLatestPostsCached = unstable_cache(
	async () => {
		return (
			(await db
				.select({
					id: blogPost.id,
					slug: blogPost.slug,
					title: blogPost.title,
					excerpt: blogPost.excerpt,
					seoDescription: blogPost.seoDescription,
					publishedAt: blogPost.publishedAt,
					updatedAt: blogPost.updatedAt,
					createdAt: blogPost.createdAt,
					coverAssetId: blogPost.coverAssetId,
					categoryId: blogPost.primaryCategoryId,
					categoryName: blogCategory.name,
					authorName: userTable.name,
				})
				.from(blogPost)
				.leftJoin(userTable, eq(blogPost.authorId, userTable.id))
				.leftJoin(blogCategory, eq(blogPost.primaryCategoryId, blogCategory.id))
				.where(
					and(
						eq(blogPost.status, "published"),
						sql`${blogPost.publishedAt} IS NOT NULL`,
						sql`${blogPost.publishedAt} <= NOW()`
					)
				)
				.orderBy(desc(blogPost.publishedAt), desc(blogPost.createdAt))
				.limit(RSS_LIMIT)) || []
		);
	},
	["blog", "rss:latest"],
	{ revalidate: 21600, tags: ["blog", "blog:list", "blog:rss"] }
);

// optional: cache the cover picking (keyed by post IDs)
const getCoversCached = (posts) =>
	unstable_cache(
		async () => pickCovers(posts),
		["blog", "rss:covers", posts.map((p) => p.id).join(",")],
		{ revalidate: 21600, tags: ["blog", "blog:list", "blog:rss"] }
	)();

/* ---------- route ---------- */
export async function GET() {
	const rows = await getLatestPostsCached();
	const covers = await getCoversCached(rows);

	const itemsXml = rows
		.map((p) => {
			const link = `${BASE}/blog/${p.slug}`;
			const title = escapeXml(p.title || "Untitled");
			const descText = p.excerpt || p.seoDescription || "";
			const pub = p.publishedAt ? new Date(p.publishedAt) : new Date();
			const catTag = p.categoryName
				? `<category>${escapeXml(p.categoryName)}</category>`
				: "";
			const coverUrl = covers[p.id] ? `${BASE}${covers[p.id]}` : "";
			const mediaTag = coverUrl
				? `<media:content url="${coverUrl}" medium="image" />`
				: "";

			// keep description short; provide full HTML in content:encoded
			const description = cdata(descText);
			const content =
				p.contentMdx && p.contentMdx.trim() ? cdata(p.contentMdx) : description;

			return `
        <item>
          <title>${title}</title>
          <link>${link}</link>
          <guid isPermaLink="true">${link}</guid>
          <pubDate>${pub.toUTCString()}</pubDate>
          ${catTag}
          <description>${description}</description>
          <content:encoded>${content}</content:encoded>
          ${mediaTag}
        </item>`;
		})
		.join("");

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(SITE_NAME)} — RSS</title>
    <link>${BASE}</link>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(`Latest posts from ${SITE_NAME}`)}</description>
    <language>en-IN</language>
    <generator>Next.js RSS</generator>
    <ttl>60</ttl>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			"content-type": "application/rss+xml; charset=utf-8",
			// Explicit cache headers; HTML/XML still benefits from ISR via `revalidate`
			"cache-control": "public, s-maxage=21600, stale-while-revalidate=43200",
		},
	});
}
