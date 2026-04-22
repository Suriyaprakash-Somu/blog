import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/api/media", "/api/media/", "/llms.txt"],
                disallow: [
                    "/dashboard",
                    "/author",
                    "/api",
                    "/platform",
                    "/tenant",
                ],
            },
            {
                userAgent: ["GPTBot", "Claude-bot", "PerplexityBot", "CCBot"],
                allow: [
                    "/",
                    "/llms.txt",
                    "/sitemap.xml",
                    "/rss.xml",
                    "/blog",
                    "/blog/",
                    "/categories",
                    "/categories/",
                    "/tags",
                    "/tags/",
                ],
            }
        ],
        sitemap: [`${BASE_URL}/sitemap.xml`],
    };
}
