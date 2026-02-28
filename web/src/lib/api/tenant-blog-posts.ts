export const tenantBlogPostsApi = {
  getList: {
    key: "tenant-blog-posts",
    endpoint: "/api/tenant/blog-posts",
    method: "GET" as const,
  },
  getOne: {
    key: "tenant-blog-posts",
    endpoint: (data: { id: string }) => `/api/tenant/blog-posts/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "tenant-blog-posts",
    endpoint: "/api/tenant/blog-posts",
    method: "POST" as const,
  },
  update: {
    key: "tenant-blog-posts",
    endpoint: (data: { id: string }) => `/api/tenant/blog-posts/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "tenant-blog-posts",
    endpoint: "/api/tenant/blog-posts",
    method: "DELETE" as const,
  },
  generate: {
    key: "tenant-blog-posts-generate",
    endpoint: "/api/tenant/blog-posts/generate",
    method: "POST" as const,
  },
} as const;
