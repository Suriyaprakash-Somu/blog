import { NextResponse } from "next/server";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com").replace(/\/+$/, "");
const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3020";

export const revalidate = 43200; // 12 hours

function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "&": return "&amp;";
            case "'": return "&apos;";
            case "\"": return "&quot;";
        }
        return c;
    });
}

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/api/public/seo/rss`, {
            next: { revalidate: 43200 }
        });

        if (!res.ok) throw new Error("Failed to fetch RSS data");

        const { data: posts } = await res.json();

        const rssItems = posts
            .map((post: any) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid>${BASE_URL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || "")}</description>
    </item>`)
            .join("");

        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Indian Context</title>
    <link>${BASE_URL}</link>
    <description>The latest stories from Indian Context</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;

        return new NextResponse(rss, {
            headers: {
                "Content-Type": "application/xml",
            },
        });
    } catch (error) {
        console.error("RSS generation error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
