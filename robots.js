// app/robots.js

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/media", "/api/media/"],
        disallow: [
          "/dashboard",
          "/author",
          "/api",
        ],
      },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`],
  };
}
