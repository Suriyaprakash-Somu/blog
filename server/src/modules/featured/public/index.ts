import type { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { db } from "../../../db/index.js";
import { featuredCollections, featuredItems } from "../featured.schema.js";
import { blogPosts } from "../../blogPosts/blogPosts.schema.js";
import { blogCategories } from "../../blogCategories/blogCategories.schema.js";
import { blogTags } from "../../blogTags/blogTags.schema.js";
import { eq, and, inArray } from "drizzle-orm";

export const publicFeaturedRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get(
    "/:slug",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug } = request.params as { slug: string };

      // 1. Find the collection
      const [collection] = await db
        .select()
        .from(featuredCollections)
        .where(
          and(
            eq(featuredCollections.slug, slug),
            eq(featuredCollections.isActive, true)
          )
        )
        .limit(1);

      if (!collection) {
        return reply.status(404).send({ error: "Collection not found" });
      }

      // 2. Find the items
      const items = await db
        .select()
        .from(featuredItems)
        .where(
          and(
            eq(featuredItems.collectionId, collection.id),
            eq(featuredItems.isActive, true)
          )
        )
        .orderBy(featuredItems.order);

      if (items.length === 0) {
        return reply.send({ collection, items: [] });
      }

      // 3. Group items by type to fetch entities in batches
      const postIds = items.filter((i) => i.entityType === "POST").map((i) => i.entityId);
      const categoryIds = items.filter((i) => i.entityType === "CATEGORY").map((i) => i.entityId);
      const tagIds = items.filter((i) => i.entityType === "TAG").map((i) => i.entityId);

      // Fetch
      const [posts, categories, tags] = await Promise.all([
        postIds.length
          ? db.select().from(blogPosts).where(inArray(blogPosts.id, postIds))
          : Promise.resolve([]),
        categoryIds.length
          ? db.select().from(blogCategories).where(inArray(blogCategories.id, categoryIds))
          : Promise.resolve([]),
        tagIds.length
          ? db.select().from(blogTags).where(inArray(blogTags.id, tagIds))
          : Promise.resolve([]),
      ]);

      // Map by ID for quick lookup
      const postsMap = new Map(posts.map((p) => [p.id, p]));
      const categoriesMap = new Map(categories.map((c) => [c.id, c]));
      const tagsMap = new Map(tags.map((t) => [t.id, t]));

      // Combine sorting them back essentially keeping the order
      const enrichedItems = items
        .map((item) => {
          let entityData = null;
          if (item.entityType === "POST") entityData = postsMap.get(item.entityId);
          if (item.entityType === "CATEGORY") entityData = categoriesMap.get(item.entityId);
          if (item.entityType === "TAG") entityData = tagsMap.get(item.entityId);

          return {
            id: item.id,
            entityType: item.entityType,
            entityId: item.entityId,
            order: item.order,
            data: entityData,
          };
        })
        .filter((item) => item.data); // Remove items where the underlying entity was deleted

      return reply.send({
        collection,
        items: enrichedItems,
      });
    }
  );
};
