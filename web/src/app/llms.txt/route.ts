import { NextRequest, NextResponse } from "next/server";

export const revalidate = 43200; // 12 hours

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com").replace(/\/+$/, "");
const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3020";

interface SeoDataResponse {
    success: boolean;
    data: {
        posts: any[];
        categories: any[];
        tags: any[];
    };
}

export async function GET(request: NextRequest) {
    try {
        const res = await fetch(`${API_URL}/api/public/seo/sitemap`, {
            next: { revalidate: 43200 }
        });

        if (!res.ok) throw new Error("Failed to fetch data for llms.txt");

        const { data }: SeoDataResponse = await res.json();

        // Build the Markdown content
        let md = `# Insights Into India\n\n`;
        md += `> The definitive encyclopedic portal decoding every dimension of India.\n\n`;

        md += `## Sections\n`;
        md += `- [Home](${BASE_URL}/)\n`;
        md += `- [Blog Hub](${BASE_URL}/blog)\n`;
        md += `- [About](${BASE_URL}/about)\n\n`;

        md += `## Academic Pillars (Categories)\n`;
        data.categories.forEach(c => {
            md += `- [${c.name}](${BASE_URL}/categories/${c.slug}): ${c.description || "Research and articles"}\n`;
        });
        md += `\n`;

        md += `## Latest Research & Articles\n`;
        // Limit to top 20 for llms.txt standard clarity
        data.posts.slice(0, 20).forEach(p => {
            const date = new Date(p.publishedAt || p.createdAt).toLocaleDateString();
            md += `- [${p.title}](${BASE_URL}/blog/${p.slug}) (${date})\n`;
        });

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
