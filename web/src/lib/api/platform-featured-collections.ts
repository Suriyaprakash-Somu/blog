export const platformFeaturedCollectionsApi = {
  getList: {
    key: "platform-featured-collections",
    endpoint: "/api/platform/featured/collections",
    method: "GET" as const,
  },
  getOne: {
    key: "platform-featured-collections",
    endpoint: (data: { id: string }) => `/api/platform/featured/collections/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "platform-featured-collections",
    endpoint: "/api/platform/featured/collections",
    method: "POST" as const,
  },
  update: {
    key: "platform-featured-collections",
    endpoint: (data: { id: string }) => `/api/platform/featured/collections/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "platform-featured-collections",
    endpoint: "/api/platform/featured/collections",
    method: "DELETE" as const,
  },
} as const;
