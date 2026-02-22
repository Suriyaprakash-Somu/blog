export const tenantAnalyticsApi = {
  trackBatch: {
    key: "tenant-analytics",
    endpoint: "/api/tenant/analytics/track-batch",
    method: "POST" as const,
  },
  dashboard: {
    key: "tenant-analytics-dashboard",
    endpoint: "/api/tenant/analytics/dashboard",
    method: "GET" as const,
  },
  heatmap: {
    key: "tenant-analytics-heatmap",
    endpoint: "/api/tenant/analytics/reports/heatmap",
    method: "GET" as const,
  },
  funnel: {
    key: "tenant-analytics-funnel",
    endpoint: "/api/tenant/analytics/reports/funnel",
    method: "GET" as const,
  },
  leadTime: {
    key: "tenant-analytics-lead-time",
    endpoint: "/api/tenant/analytics/reports/lead-time",
    method: "GET" as const,
  },
} as const;
