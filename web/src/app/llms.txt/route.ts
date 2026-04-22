import { NextRequest, NextResponse } from "next/server";

export const revalidate = 43200; // 12 hours

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com").replace(/\/+$/, "");
const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3020";

interface SeoDataResponse {
    success: boolean;
    data: {
        categories: Array<{
            name: string;
            slug: string;
            description: string | null;
            lastPostPublishedAt: string | null;
        }>;
        latestPosts: Array<{
            title: string;
            slug: string;
            publishedAt: string | null;
            updatedAt: string;
            isFeatured: boolean;
            categoryName: string | null;
            categorySlug: string | null;
        }>;
        topPostsByCategory: Record<string, Array<{
            title: string;
            slug: string;
            publishedAt: string | null;
            updatedAt: string;
            isFeatured: boolean;
            categoryName: string | null;
            categorySlug: string | null;
        }>>;
    };
}

async function getSiteName(): Promise<string> {
    try {
        const res = await fetch(`${API_URL}/api/public/settings`, {
            next: { revalidate: 300 },
        });
        if (!res.ok) return "Indian Context";
        const { rows } = await res.json();
        const identity = rows?.find((r: any) => r.key === "site_identity")?.value;
        return identity?.siteName?.trim() || "Indian Context";
    } catch {
        return "Indian Context";
    }
}

function formatDate(value?: string | null): string {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
    try {
        const [res, siteName] = await Promise.all([
            fetch(`${API_URL}/api/public/seo/llms`, {
            next: { revalidate: 43200 }
            }),
            getSiteName(),
        ]);

        if (!res.ok) throw new Error("Failed to fetch data for llms.txt");

        const { data }: SeoDataResponse = await res.json();

        const categories = data.categories || [];
        const latest = data.latestPosts || [];
        const byCategory = data.topPostsByCategory || {};

        // Build the Markdown content
        let md = `# ${siteName}\n\n`;
        md += `> Research, analysis, and explainers.\n\n`;

        md += `## Sections\n`;
        md += `- [Home](${BASE_URL}/)\n`;
        md += `- [Blog Hub](${BASE_URL}/blog)\n`;
        md += `- [Categories](${BASE_URL}/categories)\n`;
        md += `- [RSS](${BASE_URL}/rss.xml)\n`;
        md += `- [Sitemap](${BASE_URL}/sitemap.xml)\n`;
        md += `- [About](${BASE_URL}/about)\n\n`;

        md += `## Categories (Evergreen Index)\n`;
        for (const c of categories) {
            md += `\n### ${c.name}\n`;
            md += `- Hub: ${BASE_URL}/categories/${c.slug}\n`;
            if (c.description) md += `- Summary: ${c.description}\n`;
            const posts = (byCategory[c.slug] || []).slice(0, 8);
            if (posts.length > 0) {
                md += `- Top posts:\n`;
                for (const p of posts) {
                    const date = formatDate(p.publishedAt) || formatDate(p.updatedAt);
                    md += `  - [${p.title}](${BASE_URL}/blog/${p.slug})${date ? ` (${date})` : ""}\n`;
                }
            }
        }

        md += `\n\n`;

        md += `## Latest Research & Articles\n`;
        for (const p of latest.slice(0, 30)) {
            const date = formatDate(p.publishedAt) || formatDate(p.updatedAt);
            const cat = p.categoryName ? ` | ${p.categoryName}` : "";
            md += `- [${p.title}](${BASE_URL}/blog/${p.slug})${date ? ` (${date})` : ""}${cat}\n`;
        }

        md += `\n---\n`;
        md += `*This is an AI-optimized knowledge index. Link to this file at ${BASE_URL}/llms.txt*\n`;

        return new NextResponse(md, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400",
            },
        });
    } catch (error) {
        console.error("Error generating llms.txt:", error);
        return new NextResponse("Error generating knowledge index.", { status: 500 });
    }
}
