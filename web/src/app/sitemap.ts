import type { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com").replace(/\/+$/, "");
const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3020";

const STATIC_PAGES = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/blog", changeFrequency: "daily", priority: 0.9 },
    { path: "/tags", changeFrequency: "weekly", priority: 0.6 },
    { path: "/blog-categories", changeFrequency: "weekly", priority: 0.6 },
    { path: "/about", changeFrequency: "yearly", priority: 0.5 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
    { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
    { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.2 },
];

export const revalidate = 43200; // 12 hours

interface SeoDataResponse {
    success: boolean;
    data: {
        posts: any[];
        categories: any[];
        tags: any[];
    };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    try {
        const res = await fetch(`${API_URL}/api/public/seo/sitemap`, {
            next: { revalidate: 43200 }
        });

        if (!res.ok) throw new Error("Failed to fetch sitemap data");

        const { data }: SeoDataResponse = await res.json();

        const entries: MetadataRoute.Sitemap = [
            // 1) Static Pages
            ...STATIC_PAGES.map((p) => ({
                url: `${BASE_URL}${p.path}`,
                lastModified: now,
                changeFrequency: p.changeFrequency as any,
                priority: p.priority,
            })),

            // 2) Blog Posts
            ...data.posts.map((p) => ({
                url: `${BASE_URL}/blog/${p.slug}`,
                lastModified: new Date(p.updatedAt || p.publishedAt || p.createdAt),
                changeFrequency: "daily" as const,
                priority: 0.8,
            })),

            // 3) Categories
            ...data.categories.map((c) => ({
                url: `${BASE_URL}/blog-categories/${c.slug}`,
                lastModified: new Date(c.updatedAt || now),
                changeFrequency: "weekly" as const,
                priority: 0.7,
            })),

            // 4) Tags
            ...data.tags.map((t) => ({
                url: `${BASE_URL}/tags/${t.slug}`,
                lastModified: new Date(t.updatedAt || now),
                changeFrequency: "weekly" as const,
                priority: 0.6,
            })),
        ];

        return entries;
    } catch (error) {
        console.error("Sitemap generation error:", error);
        // Fallback to static pages only
        return STATIC_PAGES.map((p) => ({
            url: `${BASE_URL}${p.path}`,
            lastModified: now,
            changeFrequency: p.changeFrequency as any,
            priority: p.priority,
        }));
    }
}
