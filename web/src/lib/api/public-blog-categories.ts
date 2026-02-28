export const publicBlogCategoriesApi = {
    getList: {
        key: "public-blog-categories-list",
        endpoint: "/api/public/blog-categories",
        method: "GET" as const,
    },
    getBySlug: {
        key: "public-blog-categories-by-slug",
        endpoint: (data: { slug: string }) => `/api/public/blog-categories/slug/${data.slug}`,
        method: "GET" as const,
    },
};
