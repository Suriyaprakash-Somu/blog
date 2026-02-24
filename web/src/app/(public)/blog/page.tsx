"use client";

import { useQuery } from "@tanstack/react-query";
import { publicBlogPostsApi } from "@/lib/api/public-blog-posts";
import { clientFetch } from "@/lib/client-fetch";
import Link from "next/link";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface PublicPostListing {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  readTimeMinutes: number;
  isFeatured: boolean;
  featuredImageUrl: string | null;
}

export default function BlogIndexPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: [publicBlogPostsApi.getList.key],
    queryFn: async () => {
      const res = await clientFetch<{ data: PublicPostListing[] }>(
        publicBlogPostsApi.getList.endpoint,
      );
      return res.data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4">
          Latest Insights & Articles
        </h1>
        <p className="text-xl text-muted-foreground w-full max-w-2xl mx-auto">
          Explore our latest thoughts, tutorials, and ecosystem updates.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts?.length === 0 ? (
        <div className="text-center p-12 bg-secondary/20 rounded-lg">
          <p className="text-muted-foreground">No posts published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts?.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col items-start justify-between bg-card text-card-foreground rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              {post.featuredImageUrl ? (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={post.featuredImageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center bg-linear-to-br from-primary/10 to-primary/5">
                  <span className="text-primary/40 font-semibold text-lg">
                    Read Post
                  </span>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1 w-full">
                <div className="flex items-center gap-x-4 text-xs mb-4">
                  <time
                    dateTime={post.publishedAt || new Date().toISOString()}
                    className="text-muted-foreground"
                  >
                    {post.publishedAt
                      ? format(new Date(post.publishedAt), "MMMM d, yyyy")
                      : "Recently"}
                  </time>
                  <span className="relative z-10 rounded-full bg-secondary px-3 py-1.5 font-medium text-secondary-foreground">
                    {post.readTimeMinutes || 5} min read
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-semibold leading-6 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground flex-1">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
