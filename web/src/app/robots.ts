import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://indiancontext.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/api/media", "/api/media/"],
                disallow: [
                    "/dashboard",
                    "/author",
                    "/api",
                    "/platform",
                    "/tenant",
                ],
            },
        ],
        sitemap: [`${BASE_URL}/sitemap.xml`],
    };
}
