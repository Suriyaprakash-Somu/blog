export const tenantBranchesApi = {
  getList: {
    key: "tenant-branches",
    endpoint: "/api/tenant/branches",
    method: "GET" as const,
  },
  getOne: {
    key: "tenant-branches",
    endpoint: (data: { id: string }) => `/api/tenant/branches/${data.id}`,
    method: "GET" as const,
  },
  create: {
    key: "tenant-branches",
    endpoint: "/api/tenant/branches",
    method: "POST" as const,
  },
  update: {
    key: "tenant-branches",
    endpoint: (data: { id: string }) => `/api/tenant/branches/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "tenant-branches",
    // Base endpoint - DataTable's useOperationHandler appends /:id automatically
    endpoint: "/api/tenant/branches",
    method: "DELETE" as const,
  },
} as const;

