export const publicBannersApi = {
  getActive: {
    key: "public-banners-active",
    endpoint: "/api/public/banners/active",
    method: "GET" as const,
  },
} as const;
