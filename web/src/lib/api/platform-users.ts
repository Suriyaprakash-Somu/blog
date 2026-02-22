export const platformUsersApi = {
  getList: {
    key: "platform-users",
    endpoint: "/api/platform/users",
    method: "GET" as const,
  },
  roles: {
    key: "platform-user-roles",
    endpoint: "/api/platform/users/roles",
    method: "GET" as const,
  },
  create: {
    key: "platform-users",
    endpoint: "/api/platform/users",
    method: "POST" as const,
  },
  update: {
    key: "platform-users",
    endpoint: (data: { id: string }) => `/api/platform/users/${data.id}`,
    method: "PUT" as const,
  },
  delete: {
    key: "platform-users",
    endpoint: "/api/platform/users",
    method: "DELETE" as const,
  },
} as const;
