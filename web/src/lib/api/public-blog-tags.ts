export const publicBlogTagsApi = {
    getList: {
        key: "public-blog-tags-list",
        endpoint: "/api/public/blog-tags",
        method: "GET" as const,
    },
    getBySlug: {
        key: "public-blog-tags-by-slug",
        endpoint: (data: { slug: string }) => `/api/public/blog-tags/slug/${data.slug}`,
        method: "GET" as const,
    },
};
