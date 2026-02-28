"use client";

import { motion } from "framer-motion";
import { ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { DynamicIcon } from "@/components/icons/DynamicIcon";

export type LandingCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
};

const COLORS = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100 },
  },
};

export function LandingCategories({ categories }: { categories: LandingCategory[] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-32 border-t">
      <div className="container px-4 md:px-6 z-10 relative mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Core Pillars of Research
            </h2>
            <p className="mt-4 text-muted-foreground md:text-lg leading-relaxed">
              Explore our comprehensive taxonomy. Every article is meticulously
              categorized to streamline your research and learning experience.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="/categories"
              className="group inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Browse All Categories
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {categories.map((category, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <motion.div key={category.id} variants={itemVariants}>
                <Link
                  href={`/categories/${category.slug}`}
                  className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                >
                  <Card className="h-full bg-card hover:bg-muted/50 transition-colors border shadow-sm hover:shadow-md group relative overflow-hidden">
                    <CardContent className="p-6">
                      <div
                        className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}
                      >
                        {category.icon ? (
                          <DynamicIcon name={category.icon} className="h-6 w-6" />
                        ) : (
                          <LayoutGrid className="h-6 w-6" /> // fallback
                        )}
                      </div>
                      <h3 className="mb-2 font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {category.description || "Explore articles in this category."}
                      </p>
                    </CardContent>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
