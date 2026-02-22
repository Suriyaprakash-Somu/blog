import type { FastifyInstance } from "fastify";

function normalizePrefix(prefix: string): string {
  if (prefix === "/") return "/";
  return prefix.replace(/\/+$/, "");
}

export function assertRoutePrefix(params: {
  prefix: string;
  basePrefix: string;
  label: string;
}): void {
  const prefix = normalizePrefix(params.prefix);
  const basePrefix = normalizePrefix(params.basePrefix);

  if (!prefix.startsWith("/api/")) {
    throw new Error(`[Routes] ${params.label}: prefix must start with /api/: ${prefix}`);
  }
  if (!basePrefix.startsWith("/api/")) {
    throw new Error(`[Routes] ${params.label}: basePrefix must start with /api/: ${basePrefix}`);
  }
  if (!prefix.startsWith(basePrefix)) {
    throw new Error(
      `[Routes] ${params.label}: prefix ${prefix} must start with basePrefix ${basePrefix}`,
    );
  }
  if (params.prefix !== prefix) {
    throw new Error(`[Routes] ${params.label}: prefix must not end with '/': ${params.prefix}`);
  }
  if (params.basePrefix !== basePrefix) {
    throw new Error(
      `[Routes] ${params.label}: basePrefix must not end with '/': ${params.basePrefix}`,
    );
  }
}

export async function registerWithPrefix(
  app: FastifyInstance,
  plugin: unknown,
  params: {
    prefix: string;
    basePrefix: string;
    label: string;
  },
) {
  assertRoutePrefix(params);
  await app.register(plugin as never, { prefix: params.prefix });
}
