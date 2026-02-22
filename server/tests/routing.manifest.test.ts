import { describe, expect, it } from "vitest";
import { PLATFORM_ROUTES, PUBLIC_ROUTES, ROUTE_PREFIXES, TENANT_ROUTES } from "../src/routes/manifest.js";

function valuesOf(obj: Record<string, string>): string[] {
  return Object.values(obj);
}

describe("route manifest", () => {
  it("public routes are under /api/public", () => {
    for (const path of valuesOf(PUBLIC_ROUTES)) {
      expect(path.startsWith(ROUTE_PREFIXES.public)).toBe(true);
    }
  });

  it("tenant routes are under /api/tenant", () => {
    for (const path of valuesOf(TENANT_ROUTES)) {
      expect(path.startsWith(ROUTE_PREFIXES.tenant)).toBe(true);
    }
  });

  it("platform routes are under /api/platform", () => {
    for (const path of valuesOf(PLATFORM_ROUTES)) {
      expect(path.startsWith(ROUTE_PREFIXES.platform)).toBe(true);
    }
  });

  it("all route bases are unique", () => {
    const all = [...valuesOf(PUBLIC_ROUTES), ...valuesOf(TENANT_ROUTES), ...valuesOf(PLATFORM_ROUTES)];
    const set = new Set(all);
    expect(set.size).toBe(all.length);
  });
});
