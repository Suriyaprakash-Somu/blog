export const platformBannersApi = {
  getList: {
    key: "platform-banners",
    endpoint: "/api/platform/banners",
    method: "GET" as const,
  },
  getActive: {
    key: "platform-banners-active",
    endpoint: "/api/platform/banners/active",
    method: "GET" as const,
  },
  getOne: {
    key: "platform-banners",
    endpoint: (data: { id: string }) => `/api/platform/banners/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "platform-banners",
    endpoint: "/api/platform/banners",
    method: "POST" as const,
  },
  update: {
    key: "platform-banners",
    endpoint: (data: { id: string }) => `/api/platform/banners/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "platform-banners",
    endpoint: "/api/platform/banners",
    method: "DELETE" as const,
  },
} as const;
