export const platformBlogCategoriesApi = {
  getList: {
    key: "platform-blog-categories",
    endpoint: "/api/platform/blog-categories",
    method: "GET" as const,
  },
  options: {
    key: "platform-blog-categories-options",
    endpoint: "/api/platform/blog-categories/options",
    method: "GET" as const,
  },
  getOne: {
    key: "platform-blog-categories",
    endpoint: (data: { id: string }) => `/api/platform/blog-categories/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "platform-blog-categories",
    endpoint: "/api/platform/blog-categories",
    method: "POST" as const,
  },
  update: {
    key: "platform-blog-categories",
    endpoint: (data: { id: string }) => `/api/platform/blog-categories/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "platform-blog-categories",
    endpoint: "/api/platform/blog-categories",
    method: "DELETE" as const,
  },
  generate: {
    key: "platform-blog-categories-generate",
    endpoint: "/api/platform/blog-categories/generate",
    method: "POST" as const,
  },
} as const;
