"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export type LandingTag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
};

export function LandingTags({ tags }: { tags: LandingTag[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <section className="border-t bg-background py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.45 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Explore by Tag
            </h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Jump into topics and connect related posts across categories.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <Link
              href="/tags"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Browse All Tags
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="flex flex-wrap gap-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.04 } },
          }}
        >
          {tags.map((tag) => (
            <motion.div
              key={tag.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <Link
                href={`/tags/${tag.slug}`}
                className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              >
                <Badge
                  variant="secondary"
                  className="rounded-full px-4 py-2 text-sm hover:bg-secondary/80 transition-colors"
                  title={tag.description ?? tag.name}
                >
                  {tag.name}
                </Badge>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
