"use client";

import {
  BookOpen,
  Database,
  Globe,
  GraduationCap,
  LineChart,
  Search,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Comprehensive Coverage",
    description:
      "Thousands of articles spanning India's rich history, diverse geography, and emerging economy.",
    icon: BookOpen,
    className: "lg:col-span-2",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    title: "Reputable Sources",
    description:
      "Verified, globally and nationally reputed sources.",
    icon: Database,
    className: "lg:col-span-1",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    title: "Tailored for Researchers",
    description:
      "Deep-dives featuring academic-friendly formatting, citations, and structured chronologies.",
    icon: GraduationCap,
    className: "lg:col-span-1 lg:row-span-2",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    isTall: true,
  },
  {
    title: "Data-Driven Insights",
    description:
      "Interactive infographics and hard facts driving the narratives behind public policy.",
    icon: LineChart,
    className: "lg:col-span-1",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    title: "Live Updates",
    description:
      "Fresh content based on current events and new socio-economic research.",
    icon: Zap,
    className: "lg:col-span-1",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
  },
  {
    title: "Open Knowledge",
    description:
      "An accessible platform designed for both quick referencing and long-form deep study.",
    icon: Globe,
    className: "lg:col-span-2",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function LandingFeatures() {
  return (
    <section id="features" className="py-8 lg:py-12 relative overflow-hidden" aria-label="Core platform features and capabilities">
      <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-7xl">
        <div className="mx-auto mb-20 flex max-w-[800px] flex-col items-center justify-center gap-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl text-foreground mb-6">
              Built for <span className="text-primary italic">Precision</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Explore a curated portal that transforms raw data and vast
              histories into digestible, fascinating articles.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[240px]"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={item}
              title={feature.title}
              role="article"
              aria-label={`Feature: ${feature.title}`}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-white/5 bg-background/50 p-8 backdrop-blur-xl transition-all hover:border-primary/50 hover:bg-background/80",
                feature.className
              )}
            >
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div
                    className={cn(
                      "mb-6 flex h-12 w-12 items-center justify-center rounded-2xl transition-all group-hover:scale-110 group-hover:rotate-3",
                      feature.iconBg,
                      feature.iconColor
                    )}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Decorative element for large cards */}
                {feature.className?.includes("lg:col-span-2") && (
                   <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
                )}
              </div>
              
              {/* Interaction Glow */}
              <div className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-10 dark:group-hover:opacity-10 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_100%)] blur-2xl" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
