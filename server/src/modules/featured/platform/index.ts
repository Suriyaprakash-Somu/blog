import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import { collectionsCrud } from "./collections.controller.js";
import { itemsCrud } from "./items.controller.js";

export const platformFeaturedRoutes: FastifyPluginAsyncZod = async (app: FastifyInstance) => {
  app.register(collectionsCrud, { prefix: "/collections" });
  app.register(itemsCrud, { prefix: "/items" });
};
