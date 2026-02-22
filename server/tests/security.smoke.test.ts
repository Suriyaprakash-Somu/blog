import fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { csrfGuard } from "../src/middlewares/csrf.guard.js";
import { env } from "../src/common/env.js";
import { PLATFORM_SESSION_COOKIE } from "../src/core/security.js";

describe("security smoke", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
    await app.register(cookie, { secret: env.COOKIE_SECRET });
    app.addHook("preHandler", csrfGuard());

    app.post("/api/public/analytics/track-batch", async () => ({ ok: true }));
    app.post("/api/secure", async () => ({ ok: true }));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("allows public analytics without CSRF even with session cookie", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/public/analytics/track-batch",
      headers: {
        cookie: `${PLATFORM_SESSION_COOKIE}=test-session`,
      },
      payload: [],
    });

    expect(response.statusCode).toBe(200);
  });

  it("blocks CSRF when session cookie is present", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/secure",
      headers: {
        cookie: `${PLATFORM_SESSION_COOKIE}=test-session`,
      },
      payload: { ok: true },
    });

    expect(response.statusCode).toBe(403);
  });

  it("allows CSRF when cookie and header match", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/secure",
      headers: {
        cookie: `${PLATFORM_SESSION_COOKIE}=test-session; ${env.CSRF_COOKIE_NAME}=token`,
        [env.CSRF_HEADER_NAME]: "token",
      },
      payload: { ok: true },
    });

    expect(response.statusCode).toBe(200);
  });
});
