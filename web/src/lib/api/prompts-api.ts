export const platformPromptsApi = {
  getList: {
    key: "platform-prompts",
    endpoint: "/api/platform/prompts",
    method: "GET" as const,
  },
  getOne: {
    key: "platform-prompts",
    endpoint: "/api/platform/prompts/:id",
    method: "GET" as const,
  },
  create: {
    key: "platform-prompts",
    endpoint: "/api/platform/prompts",
    method: "POST" as const,
  },
  activate: {
    key: "platform-prompts-activate",
    endpoint: "/api/platform/prompts/:id/activate",
    method: "PUT" as const,
  },
  delete: {
    key: "platform-prompts-delete",
    endpoint: "/api/platform/prompts/:id",
    method: "DELETE" as const,
  },
} as const;
