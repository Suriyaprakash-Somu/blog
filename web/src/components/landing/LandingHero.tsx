"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BlogHeroAnimation } from "./BlogHeroAnimation";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-32">
      <div className="container relative z-10 px-4 md:px-6 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Text & Call To Actions */}
          <div className="flex flex-col justify-center space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <motion.h1
                className="text-4xl font-extrabold tracking-tighter sm:text-5xl xl:text-6xl/none"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Discover the Depths <br />
                <span className="text-primary">of Knowledge</span>
              </motion.h1>
              <motion.p
                className="mx-auto max-w-[600px] text-muted-foreground md:text-xl lg:mx-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              >
                The definitive encyclopedic portal decoding every dimension of
                India. Curated insights, hard facts, and deep dives designed for
                students, researchers, and the intellectually curious.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col gap-3 min-[400px]:flex-row justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <Link href="/articles">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all"
                >
                  Start Reading
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                >
                  Our Methodology
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Animated Blog News Feed Scene */}
          <motion.div
            className="hidden lg:flex w-full h-[500px] justify-center items-center relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          >
            <BlogHeroAnimation />
          </motion.div>
        </div>
      </div>

      {/* Abstract Background Element (Fading gradients linking to the theme) */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
  );
}
