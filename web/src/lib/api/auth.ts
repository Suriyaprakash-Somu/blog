export const platformAuthApi = {
  login: {
    endpoint: "/api/auth/platform/login",
    method: "POST",
  },
  signup: {
    endpoint: "/api/auth/platform/signup",
    method: "POST",
  },
} as const;

export const tenantAuthApi = {
  login: {
    endpoint: "/api/auth/tenant/login",
    method: "POST",
  },
  signup: {
    endpoint: "/api/auth/tenant/signup",
    method: "POST",
  },
} as const;
