export const publicAnalyticsApi = {
  trackBatch: {
    key: "public-analytics",
    endpoint: "/api/public/analytics/track-batch",
    method: "POST" as const,
  },
} as const;
