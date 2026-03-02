import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCategories } from "@/components/landing/LandingCategories";
import { LandingFeaturedPosts } from "@/components/landing/LandingFeaturedPosts";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingStats } from "@/components/landing/LandingStats";
import { LandingNewsletter } from "@/components/landing/LandingNewsletter";

export const revalidate = 60 * 60 * 3;

type FeaturedCollectionResponse<T> = {
  success: true;
  data: {
    collection: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      isActive: boolean;
    };
    items: Array<{
      id: string;
      entityType: "POST" | "CATEGORY" | "TAG";
      entityId: string;
      order: number;
      data: T;
    }>;
  };
};

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl?: string | null;
};

type PublicTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl?: string | null;
};

type PublicPostListing = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  readTimeMinutes: number;
  isFeatured: boolean;
  featuredImageUrl: string | null;
  authorName: string | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const apiBase = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3020";
  const res = await fetch(`${apiBase}${url}`, {
    next: { revalidate, tags: ["landing"] },
  });
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return (await res.json()) as T;
}

async function getFeaturedCollection<T>(
  slug: string,
): Promise<FeaturedCollectionResponse<T> | null> {
  try {
    return await fetchJson<FeaturedCollectionResponse<T>>(
      `/api/public/featured/${slug}`,
    );
  } catch {
    return null;
  }
}

export default async function Home() {
  const [
    featuredCategories,
    featuredTags,
    featuredPostsFallback,
    allCategoriesFallback,
    allTagsFallback,
  ] = await Promise.all([
    getFeaturedCollection<PublicCategory>("featured-categories"),
    getFeaturedCollection<PublicTag>("featured-tags"),
    getFeaturedCollection<PublicPostListing>("featured-posts"),
    fetchJson<{ success: true; data: PublicCategory[] }>(
      "/api/public/blog-categories",
    ).catch(() => ({
      success: true as const,
      data: [],
    })),
    fetchJson<{ success: true; data: PublicTag[] }>(
      "/api/public/blog-tags",
    ).catch(() => ({
      success: true as const,
      data: [],
    })),
  ]);

  const categoriesFromFeatured =
    featuredCategories?.data.items
      .filter((i) => i.entityType === "CATEGORY")
      .map((i) => i.data)
      .slice(0, 6) ?? [];

  const categories =
    categoriesFromFeatured.length > 0
      ? categoriesFromFeatured
      : allCategoriesFallback.data.slice(0, 6);

  const tagsFromFeatured =
    featuredTags?.data.items
      .filter((i) => i.entityType === "TAG")
      .map((i) => i.data)
      .slice(0, 12) ?? [];

  const tags =
    tagsFromFeatured.length > 0
      ? tagsFromFeatured
      : allTagsFallback.data.slice(0, 12);

  let featuredPosts =
    featuredPostsFallback?.data.items
      .filter((i) => i.entityType === "POST")
      .map((i) => i.data)
      .slice(0, 6) ?? [];

  if (featuredPosts.length === 0) {
    const res = await fetchJson<{ success: true; data: PublicPostListing[] }>(
      "/api/public/blog-posts?featuredOnly=1&limit=6",
    ).catch(() => ({ success: true as const, data: [] }));
    featuredPosts = res.data;
  }

  const stats = [
    {
      label: "Initial Topics",
      value: Math.max(categories.length, 3), // Show at least 3 even if empty
      suffix: "",
      description: "Core pillars establishing our foundation.",
    },
    {
      label: "Contributors",
      value: 5,
      suffix: "+",
      description: "Experts building our knowledge base.",
    },
    {
      label: "Data Points",
      value: 500,
      suffix: "+",
      description: "Verified facts in our platform.",
    },
    {
      label: "Early Readers",
      value: 100,
      suffix: "+",
      description: "Join our growing community.",
    },
  ];

  return (
    <>
      <LandingHero />
      <LandingCategories
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description ?? null,
          icon: c.icon ?? null,
          imageUrl: c.imageUrl ?? null,
        }))}
      />
      <LandingFeaturedPosts
        posts={featuredPosts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt ?? null,
          publishedAt: p.publishedAt ?? null,
          readTimeMinutes: p.readTimeMinutes ?? null,
          isFeatured: Boolean(p.isFeatured),
          featuredImageUrl: p.featuredImageUrl ?? null,
          authorName: p.authorName ?? null,
        }))}
      />
      <LandingFeatures />
      <LandingStats stats={stats} />
      <LandingNewsletter />
    </>
  );
}
