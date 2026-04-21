"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export type LandingPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  readTimeMinutes: number | null;
  isFeatured: boolean;
  featuredImageUrl: string | null;
  authorName: string | null;
};

export function LandingFeaturedPosts({ posts }: { posts: LandingPost[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="bg-muted/30 py-12 lg:py-16 relative overflow-hidden border-t" aria-label="Featured Research Articles">
      <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Featured Reads
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg leading-relaxed">
              Hand-picked posts curated via featured collections.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View All Posts
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
        >
          {posts.map((post) => (
            <motion.div
              key={post.id}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <Link
                href={`/blog/${post.slug}`}
                data-article-click="true"
                data-article-slug={post.slug}
                data-article-title={post.title}
                className="group block h-full rounded-[2rem] border-white/5 bg-background/50 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="aspect-[16/10] w-full bg-linear-to-br from-primary/10 via-accent/5 to-secondary/15 overflow-hidden">
                  {post.featuredImageUrl ? (
                    <img
                      src={post.featuredImageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/5 to-accent/5" />
                  )}
                </div>

                <div className="p-8 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/70">
                    {post.authorName && (
                      <>
                        <span>{post.authorName}</span>
                        <span className="text-muted-foreground/30">•</span>
                      </>
                    )}
                    <span>{post.readTimeMinutes || 5} min read</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed line-clamp-3 font-medium">
                    {post.excerpt ?? "Read the full post."}
                  </p>
                  <div className="pt-2 inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
                    Read depth
                    <ArrowRight className="size-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
