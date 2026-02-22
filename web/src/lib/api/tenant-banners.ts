export const tenantBannersApi = {
  getList: {
    key: "tenant-banners",
    endpoint: "/api/tenant/banners",
    method: "GET" as const,
  },
  getActive: {
    key: "tenant-banners-active",
    endpoint: "/api/tenant/banners/active",
    method: "GET" as const,
  },
} as const;
