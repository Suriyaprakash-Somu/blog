export const platformFeaturedItemsApi = {
  getList: {
    key: "platform-featured-items",
    endpoint: "/api/platform/featured/items",
    method: "GET" as const,
  },
  getOne: {
    key: "platform-featured-items",
    endpoint: (data: { id: string }) => `/api/platform/featured/items/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "platform-featured-items",
    endpoint: "/api/platform/featured/items",
    method: "POST" as const,
  },
  update: {
    key: "platform-featured-items",
    endpoint: (data: { id: string }) => `/api/platform/featured/items/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "platform-featured-items",
    endpoint: "/api/platform/featured/items",
    method: "DELETE" as const,
  },
} as const;
