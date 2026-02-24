export const platformBlogPostsApi = {
  getList: {
    key: "platform-blog-posts",
    endpoint: "/api/platform/blog-posts",
    method: "GET" as const,
  },
  getOne: {
    key: "platform-blog-posts",
    endpoint: (data: { id: string }) => `/api/platform/blog-posts/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "platform-blog-posts",
    endpoint: "/api/platform/blog-posts",
    method: "POST" as const,
  },
  update: {
    key: "platform-blog-posts",
    endpoint: (data: { id: string }) => `/api/platform/blog-posts/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "platform-blog-posts",
    endpoint: "/api/platform/blog-posts",
    method: "DELETE" as const,
  },
  generate: {
    key: "platform-blog-posts-generate",
    endpoint: "/api/platform/blog-posts/generate",
    method: "POST" as const,
  },
} as const;
