import { and, eq } from "drizzle-orm";
import { db, closeDatabase } from "../db/index.js";
import { blogCategories } from "../modules/blogCategories/blogCategories.schema.js";
import { blogPosts } from "../modules/blogPosts/blogPosts.schema.js";
import { blogPostTags } from "../modules/blogPosts/blogPostTags.schema.js";
import { blogTags } from "../modules/blogTags/blogTags.schema.js";
import { featuredCollections, featuredItems } from "../modules/featured/featured.schema.js";

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  icon: string;
};

type SeedTag = {
  name: string;
  slug: string;
  description: string;
  icon: string;
};

type SeedPost = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  isFeatured: boolean;
  readTimeMinutes: number;
  categorySlug: string;
  tagSlugs: string[];
};

async function upsertCategory(input: SeedCategory): Promise<{ id: string; slug: string }>
{
  const [existing] = await db
    .select({ id: blogCategories.id, slug: blogCategories.slug })
    .from(blogCategories)
    .where(eq(blogCategories.slug, input.slug))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(blogCategories)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      icon: input.icon,
      status: "active",
    })
    .returning({ id: blogCategories.id, slug: blogCategories.slug });

  if (!created) throw new Error(`Failed to create category: ${input.slug}`);
  return created;
}

async function upsertTag(input: SeedTag): Promise<{ id: string; slug: string }>
{
  const [existing] = await db
    .select({ id: blogTags.id, slug: blogTags.slug })
    .from(blogTags)
    .where(eq(blogTags.slug, input.slug))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(blogTags)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      icon: input.icon,
      status: "active",
    })
    .returning({ id: blogTags.id, slug: blogTags.slug });

  if (!created) throw new Error(`Failed to create tag: ${input.slug}`);
  return created;
}

async function upsertPost(input: SeedPost, ids: {
  categoryIdBySlug: Map<string, string>;
  tagIdBySlug: Map<string, string>;
}): Promise<{ id: string; slug: string }>
{
  const [existing] = await db
    .select({ id: blogPosts.id, slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.slug, input.slug))
    .limit(1);

  let postId = existing?.id;
  if (!postId) {
    const categoryId = ids.categoryIdBySlug.get(input.categorySlug) ?? null;
    const publishedAt = new Date();

    const [created] = await db
      .insert(blogPosts)
      .values({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        status: "published",
        publishedAt,
        isFeatured: input.isFeatured,
        readTimeMinutes: input.readTimeMinutes,
        categoryId,
      })
      .returning({ id: blogPosts.id, slug: blogPosts.slug });

    if (!created) throw new Error(`Failed to create post: ${input.slug}`);
    postId = created.id;
  }

  // Ensure post tags exist (best-effort; ignore duplicates)
  for (const tagSlug of input.tagSlugs) {
    const tagId = ids.tagIdBySlug.get(tagSlug);
    if (!tagId) continue;
    const [existingLink] = await db
      .select({ postId: blogPostTags.postId })
      .from(blogPostTags)
      .where(and(eq(blogPostTags.postId, postId), eq(blogPostTags.tagId, tagId)))
      .limit(1);
    if (existingLink) continue;
    await db.insert(blogPostTags).values({ postId, tagId });
  }

  return { id: postId, slug: input.slug };
}

async function upsertCollection(input: {
  name: string;
  slug: string;
  description: string;
}): Promise<{ id: string; slug: string }>
{
  const [existing] = await db
    .select({ id: featuredCollections.id, slug: featuredCollections.slug })
    .from(featuredCollections)
    .where(eq(featuredCollections.slug, input.slug))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(featuredCollections)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      isActive: true,
    })
    .returning({ id: featuredCollections.id, slug: featuredCollections.slug });

  if (!created) throw new Error(`Failed to create collection: ${input.slug}`);
  return created;
}

async function setCollectionItems(params: {
  collectionId: string;
  items: Array<{ entityType: "POST" | "CATEGORY" | "TAG"; entityId: string }>;
}) {
  const { collectionId, items } = params;
  await db.delete(featuredItems).where(eq(featuredItems.collectionId, collectionId));
  if (items.length === 0) return;
  await db.insert(featuredItems).values(
    items.map((item, idx) => ({
      collectionId,
      entityType: item.entityType,
      entityId: item.entityId,
      order: idx,
      isActive: true,
    })),
  );
}

async function main() {
  const categories: SeedCategory[] = [
    {
      name: "Product",
      slug: "product",
      description: "Launch notes, roadmaps, and how the platform evolves.",
      icon: "Rocket",
    },
    {
      name: "Engineering",
      slug: "engineering",
      description: "Architecture, performance, and practical implementation guides.",
      icon: "Wrench",
    },
    {
      name: "Design",
      slug: "design",
      description: "Systems, typography, and UX patterns for content products.",
      icon: "Palette",
    },
    {
      name: "Marketing",
      slug: "marketing",
      description: "Distribution, SEO, newsletters, and growth playbooks.",
      icon: "Megaphone",
    },
    {
      name: "Company",
      slug: "company",
      description: "Culture, hiring, and the behind-the-scenes building story.",
      icon: "Building2",
    },
    {
      name: "Tutorials",
      slug: "tutorials",
      description: "Step-by-step walkthroughs to ship faster with the stack.",
      icon: "GraduationCap",
    },
  ];

  const tags: SeedTag[] = [
    {
      name: "Next.js",
      slug: "nextjs",
      description: "Routing, caching, and production patterns.",
      icon: "Sparkles",
    },
    {
      name: "Fastify",
      slug: "fastify",
      description: "High-performance APIs with guardrails.",
      icon: "Zap",
    },
    {
      name: "Drizzle",
      slug: "drizzle",
      description: "Typed SQL and migrations.",
      icon: "Database",
    },
    {
      name: "SEO",
      slug: "seo",
      description: "Structured content and discoverability.",
      icon: "Search",
    },
    {
      name: "Content",
      slug: "content",
      description: "Editorial workflows and writing systems.",
      icon: "FileText",
    },
    {
      name: "Analytics",
      slug: "analytics",
      description: "Events, funnels, and instrumentation.",
      icon: "LineChart",
    },
  ];

  const posts: SeedPost[] = [
    {
      title: "Shipping a Blog Platform with ISR (and When to Revalidate)",
      slug: "isr-and-revalidation",
      excerpt:
        "How we use a 3-hour ISR window for the landing page, and still ship updates instantly with on-demand revalidation.",
      content:
        "# ISR and On-Demand Revalidation\n\nThis is seeded content. Replace with real editorial posts.\n\n## Why ISR\n\n- Fast loads\n- Predictable cache windows\n\n## When to revalidate\n\nUse on-demand revalidation when content updates are published.\n",
      isFeatured: true,
      readTimeMinutes: 6,
      categorySlug: "engineering",
      tagSlugs: ["nextjs", "seo"],
    },
    {
      title: "Featured Collections: Curating Landing Content Without Deploys",
      slug: "featured-collections",
      excerpt:
        "Model landing sections as named collections (featured-categories, featured-tags, featured-posts) so editors can swap content anytime.",
      content:
        "# Featured Collections\n\nThis is seeded content.\n\nUse collections to curate content without code changes.\n",
      isFeatured: true,
      readTimeMinutes: 5,
      categorySlug: "product",
      tagSlugs: ["content", "analytics"],
    },
    {
      title: "A Practical Tagging System for Editorial Teams",
      slug: "tagging-system",
      excerpt:
        "A lightweight approach to tags and categories that keeps navigation clean as content scales.",
      content:
        "# Tagging System\n\nThis is seeded content.\n",
      isFeatured: false,
      readTimeMinutes: 4,
      categorySlug: "design",
      tagSlugs: ["content", "seo"],
    },
    {
      title: "Instrumenting the Landing Page: Events That Matter",
      slug: "landing-analytics",
      excerpt:
        "Track what users actually do: category clicks, tag exploration, and newsletter intent.",
      content:
        "# Landing Analytics\n\nThis is seeded content.\n",
      isFeatured: false,
      readTimeMinutes: 4,
      categorySlug: "marketing",
      tagSlugs: ["analytics"],
    },
  ];

  const createdCategoryIds = new Map<string, string>();
  const createdTagIds = new Map<string, string>();
  const createdPostIds = new Map<string, string>();

  for (const category of categories) {
    const row = await upsertCategory(category);
    createdCategoryIds.set(row.slug, row.id);
  }
  for (const tag of tags) {
    const row = await upsertTag(tag);
    createdTagIds.set(row.slug, row.id);
  }
  for (const post of posts) {
    const row = await upsertPost(post, {
      categoryIdBySlug: createdCategoryIds,
      tagIdBySlug: createdTagIds,
    });
    createdPostIds.set(row.slug, row.id);
  }

  const featuredCategories = await upsertCollection({
    name: "Featured Categories",
    slug: "featured-categories",
    description: "Curated categories for the landing page.",
  });
  const featuredTags = await upsertCollection({
    name: "Featured Tags",
    slug: "featured-tags",
    description: "Curated tags for the landing page.",
  });
  const featuredPosts = await upsertCollection({
    name: "Featured Posts",
    slug: "featured-posts",
    description: "Curated posts for the landing page.",
  });

  await setCollectionItems({
    collectionId: featuredCategories.id,
    items: [
      "engineering",
      "product",
      "tutorials",
      "design",
      "marketing",
      "company",
    ]
      .map((slug) => createdCategoryIds.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((entityId) => ({ entityType: "CATEGORY" as const, entityId })),
  });

  await setCollectionItems({
    collectionId: featuredTags.id,
    items: ["nextjs", "fastify", "drizzle", "seo", "content", "analytics"]
      .map((slug) => createdTagIds.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((entityId) => ({ entityType: "TAG" as const, entityId })),
  });

  await setCollectionItems({
    collectionId: featuredPosts.id,
    items: ["featured-collections", "isr-and-revalidation", "tagging-system"]
      .map((slug) => createdPostIds.get(slug))
      .filter((id): id is string => Boolean(id))
      .map((entityId) => ({ entityType: "POST" as const, entityId })),
  });

  console.log("[seed-landing] Done");
}

main()
  .catch((err) => {
    console.error("[seed-landing] FAILED", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase().catch(() => undefined);
  });
