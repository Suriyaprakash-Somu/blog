export const publicFeaturedApi = {
  getBySlug: {
    key: "public-featured-collection-by-slug",
    endpoint: (data: { slug: string }) => `/api/public/featured/${data.slug}`,
    method: "GET" as const,
  },
} as const;
