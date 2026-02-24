export const publicBlogPostsApi = {
  getList: {
    key: "public-blog-posts",
    endpoint: "/api/public/blog-posts",
    method: "GET" as const,
  },
  getBySlug: {
    key: "public-blog-posts-by-slug",
    endpoint: (data: { slug: string }) => `/api/public/blog-posts/${data.slug}`,
    method: "GET" as const,
  },
} as const;
