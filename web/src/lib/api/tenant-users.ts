export const tenantUsersApi = {
  getList: {
    key: "tenant-users",
    endpoint: "/api/tenant/users",
    method: "GET" as const,
  },
  roles: {
    key: "tenant-user-roles",
    endpoint: "/api/tenant/users/roles",
    method: "GET" as const,
  },
  create: {
    key: "tenant-users",
    endpoint: "/api/tenant/users",
    method: "POST" as const,
  },
  update: {
    key: "tenant-users",
    endpoint: (data: { id: string }) => `/api/tenant/users/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "tenant-users",
    endpoint: "/api/tenant/users",
    method: "DELETE" as const,
  },
} as const;
