export const platformTenantsApi = {
  getList: {
    key: "platform-tenants",
    endpoint: "/api/platform/tenants",
    method: "GET" as const,
  },
  create: {
    key: "platform-tenants",
    endpoint: "/api/platform/tenants",
    method: "POST" as const,
  },
  update: {
    key: "platform-tenants",
    endpoint: (data: { id: string }) => `/api/platform/tenants/${data.id}`,
    method: "PATCH" as const,
  },
  updateStatus: {
    key: "platform-tenants",
    endpoint: (data: { id: string }) => `/api/platform/tenants/${data.id}/status`,
    method: "PATCH" as const,
  },
  delete: {
    key: "platform-tenants",
    endpoint: (data: { id: string }) => `/api/platform/tenants/${data.id}`,
    method: "DELETE" as const,
  },
  impersonateLogin: {
    key: "platform-tenants",
    endpoint: "/api/auth/platform/impersonation/login",
    method: "POST" as const,
  },
} as const;
