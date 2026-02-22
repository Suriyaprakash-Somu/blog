"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-32 lg:py-40">
      <div className="container px-4 md:px-6">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
              Smart Blog Platform <br className="hidden sm:inline" />
              for Content Creators
            </h1>
            <p className="mx-auto mt-4 max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Create, manage, and publish your content with our comprehensive platform.
              Track analytics, manage team collaboration, and grow your audience—all in one place.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 flex flex-wrap justify-center gap-4"
          >
            <Link href="/tenant/signup">
              <Button size="lg" className="h-12 px-8 text-base">
                Get Started for Free
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
              >
                Explore Features
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Abstract Background Element (Optional) */}
      <div className="absolute -top-24 -z-10 h-full w-full opacity-10 blur-3xl">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/20 mix-blend-multiply" />
        <div className="absolute left-0 bottom-0 h-[500px] w-[500px] rounded-full bg-secondary/20 mix-blend-multiply" />
      </div>
    </section>
  );
}
