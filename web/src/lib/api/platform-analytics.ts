export const platformAnalyticsApi = {
  dashboard: {
    key: "platform-analytics-dashboard",
    endpoint: "/api/platform/analytics/dashboard",
    method: "GET" as const,
  },
  heatmap: {
    key: "platform-analytics-heatmap",
    endpoint: "/api/platform/analytics/reports/heatmap",
    method: "GET" as const,
  },
  leadTime: {
    key: "platform-analytics-lead-time",
    endpoint: "/api/platform/analytics/reports/lead-time",
    method: "GET" as const,
  },
} as const;
