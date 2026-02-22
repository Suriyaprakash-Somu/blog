import type { FastifyInstance } from "fastify";
import { PUBLIC_ROUTES, ROUTE_PREFIXES } from "./manifest.js";
import { registerWithPrefix } from "./prefixGuard.js";

export async function registerUploadsRoutes(app: FastifyInstance) {
  const { uploadsRoutes, publicUploadsRoutes } = await import(
    "../modules/uploads/index.js"
  );
  await registerWithPrefix(app, uploadsRoutes, {
    prefix: ROUTE_PREFIXES.uploads,
    basePrefix: ROUTE_PREFIXES.uploads,
    label: "uploads.auth",
  });
  await registerWithPrefix(app, publicUploadsRoutes, {
    prefix: PUBLIC_ROUTES.uploads,
    basePrefix: ROUTE_PREFIXES.public,
    label: "uploads.public",
  });
}
