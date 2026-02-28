import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "../common/env.js";

export async function setupSwagger(app: FastifyInstance) {
  const isEnabled = env.SWAGGER_ENABLED;
  if (!isEnabled) return;

  await app.register(swagger, {
    openapi: {
      info: {
        title: "Blog Manager API",
        description: "API documentation for Blog Manager",
        version: "1.0.0",
      },
      servers: [{ url: "/" }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "tenant_session",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });
}
