"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BlogHeroAnimation } from "./BlogHeroAnimation";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-12 lg:pt-24 lg:pb-16" aria-label="Introduction to Insights Into India">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 opacity-30 blur-[120px] pointer-events-none bg-gradient-to-b from-primary/30 to-transparent" />

      <div className="container relative z-10 px-4 md:px-6 mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Text & Call To Actions */}
          <div className="flex flex-col justify-center space-y-10 text-center lg:text-left">
            <div className="space-y-6">
              <motion.h1
                className="text-5xl font-black leading-[1.1] tracking-tight sm:text-6xl md:text-7xl xl:text-8xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" as const }}
              >
                Insights <br />
                <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">Into India</span>
              </motion.h1>
              <motion.p
                className="mx-auto max-w-[600px] text-muted-foreground text-lg md:text-xl lg:mx-0 leading-relaxed font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" as const }}
              >
                The definitive encyclopedic portal decoding every dimension of
                India. Curated insights and deep dives designed for
                the intellectually curious.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col gap-4 min-[400px]:flex-row justify-center lg:justify-start pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" as const }}
            >
              <Link href="/blog">
                <Button
                  size="lg"
                  className="rounded-full h-14 px-10 text-lg font-bold shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all hover:scale-105 active:scale-95 group/btn"
                >
                  Start Exploring
                  <ArrowRight className="ml-2 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full h-14 px-10 text-lg font-bold border-2 backdrop-blur-md hover:bg-background/80 transition-all hover:scale-105 active:scale-95"
                >
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Animated Blog News Feed Scene */}
          <motion.div
            className="hidden lg:flex w-full h-[600px] justify-center items-center relative"
            initial={{ opacity: 0, scale: 0.8, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" as const }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent z-10 w-20 h-full pointer-events-none" />
            <BlogHeroAnimation />
            {/* Added floating decorative elements */}
            <div className="absolute top-20 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
            <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent/20 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
