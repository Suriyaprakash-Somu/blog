export const platformBlogTagsApi = {
  getList: {
    key: "platform-blog-tags",
    endpoint: "/api/platform/blog-tags",
    method: "GET" as const,
  },
  getOne: {
    key: "platform-blog-tags",
    endpoint: (data: { id: string }) => `/api/platform/blog-tags/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "platform-blog-tags",
    endpoint: "/api/platform/blog-tags",
    method: "POST" as const,
  },
  update: {
    key: "platform-blog-tags",
    endpoint: (data: { id: string }) => `/api/platform/blog-tags/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "platform-blog-tags",
    endpoint: "/api/platform/blog-tags",
    method: "DELETE" as const,
  },
} as const;
