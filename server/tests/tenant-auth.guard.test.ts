import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    findUser: vi.fn(),
    findTenant: vi.fn(),
    findRole: vi.fn(),
    findSession: vi.fn(),
  };
});

vi.mock("../src/db/index.js", () => {
  return {
    db: {
      query: {
        tenantUser: { findFirst: mocks.findUser },
        tenants: { findFirst: mocks.findTenant },
        tenantRoles: { findFirst: mocks.findRole },
        tenantUserSession: { findFirst: mocks.findSession },
      },
    },
  };
});

type TenantUserRow = {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  roleId: string | null;
  status: string;
};

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

describe("tenant auth guard (bearer)", () => {
  const user: TenantUserRow = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Test User",
    email: "test@example.com",
    tenantId: "22222222-2222-2222-2222-222222222222",
    roleId: null,
    status: "active",
  };

  const tenant: TenantRow = {
    id: user.tenantId,
    name: "Test Tenant",
    slug: "test-tenant",
    status: "active",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findSession.mockResolvedValue(null);
    mocks.findUser.mockResolvedValue(user);
    mocks.findTenant.mockResolvedValue(tenant);
    mocks.findRole.mockResolvedValue(null);
  });

  function makeRequest(token: string) {
    return {
      headers: { authorization: `Bearer ${token}` },
      cookies: {},
    };
  }

  async function signToken(payload: Record<string, unknown>) {
    const { env } = await import("../src/common/env.js");
    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: "HS256",
      issuer: "blog",
      audience: "tenant",
      expiresIn: "5m",
      jwtid: "test-jti",
    });
  }

  it("rejects bearer token when typ is missing", async () => {
    const { getTenantFromAuth } = await import("../src/middlewares/tenant.guard.js");
    const token = await signToken({ sub: user.id, tenantId: user.tenantId, scope: "tenant" });

    const session = await getTenantFromAuth(makeRequest(token) as never);
    expect(session).toBeNull();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("rejects bearer token when scope is missing", async () => {
    const { getTenantFromAuth } = await import("../src/middlewares/tenant.guard.js");
    const token = await signToken({ sub: user.id, tenantId: user.tenantId, typ: "access" });

    const session = await getTenantFromAuth(makeRequest(token) as never);
    expect(session).toBeNull();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("accepts bearer token when typ/access and scope/tenant match", async () => {
    const { getTenantFromAuth } = await import("../src/middlewares/tenant.guard.js");
    const token = await signToken({
      sub: user.id,
      tenantId: user.tenantId,
      typ: "access",
      scope: "tenant",
    });

    const session = await getTenantFromAuth(makeRequest(token) as never);
    expect(session?.user.id).toBe(user.id);
    expect(session?.tenant.id).toBe(user.tenantId);
    expect(mocks.findUser).toHaveBeenCalledTimes(1);
    expect(mocks.findTenant).toHaveBeenCalledTimes(1);
  });

  it("rejects bearer token with wrong issuer", async () => {
    const { env } = await import("../src/common/env.js");
    const { getTenantFromAuth } = await import("../src/middlewares/tenant.guard.js");

    const token = jwt.sign(
      { sub: user.id, tenantId: user.tenantId, typ: "access", scope: "tenant" },
      env.JWT_SECRET,
      {
        algorithm: "HS256",
        issuer: "wrong-issuer",
        audience: "tenant",
        expiresIn: "5m",
        jwtid: "test-jti",
      },
    );

    const session = await getTenantFromAuth(makeRequest(token) as never);
    expect(session).toBeNull();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("rejects bearer token with wrong audience", async () => {
    const { env } = await import("../src/common/env.js");
    const { getTenantFromAuth } = await import("../src/middlewares/tenant.guard.js");

    const token = jwt.sign(
      { sub: user.id, tenantId: user.tenantId, typ: "access", scope: "tenant" },
      env.JWT_SECRET,
      {
        algorithm: "HS256",
        issuer: "blog",
        audience: "wrong-audience",
        expiresIn: "5m",
        jwtid: "test-jti",
      },
    );

    const session = await getTenantFromAuth(makeRequest(token) as never);
    expect(session).toBeNull();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("rejects bearer token signed with a non-HS256 algorithm", async () => {
    const { env } = await import("../src/common/env.js");
    const { getTenantFromAuth } = await import("../src/middlewares/tenant.guard.js");

    const token = jwt.sign(
      { sub: user.id, tenantId: user.tenantId, typ: "access", scope: "tenant" },
      env.JWT_SECRET,
      {
        algorithm: "HS512",
        issuer: "blog",
        audience: "tenant",
        expiresIn: "5m",
        jwtid: "test-jti",
      },
    );

    const session = await getTenantFromAuth(makeRequest(token) as never);
    expect(session).toBeNull();
    expect(mocks.findUser).not.toHaveBeenCalled();
  });
});
