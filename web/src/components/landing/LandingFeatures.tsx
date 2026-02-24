"use client";

import {
  BookOpen,
  Database,
  Globe,
  GraduationCap,
  LineChart,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    title: "Comprehensive Coverage",
    description:
      "Thousands of articles spanning India's rich history, diverse geography, emerging economy, and profound culture.",
    icon: BookOpen,
  },
  {
    title: "Reputable Sources",
    description:
      "Every data point and historical fact is gathered strictly from verified, globally and nationally reputed sources.",
    icon: Database,
  },
  {
    title: "For Students & Researchers",
    description:
      "Carefully tailored deep-dives featuring academic-friendly formatting, citations, and structured chronologies.",
    icon: GraduationCap,
  },
  {
    title: "Data-Driven Insights",
    description:
      "Interactive infographics, geospatial charts, and hard facts driving the narratives behind public policy.",
    icon: LineChart,
  },
  {
    title: "Regular Updates",
    description:
      "Consistently fresh content based on current events, archeological discoveries, and new socio-economic research.",
    icon: Globe,
  },
  {
    title: "Open Knowledge",
    description:
      "An accessible platform designed for both quick referencing and long-form deep study.",
    icon: Search,
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
  hidden: { opacity: 0, scale: 0.95, y: 30 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100 },
  },
};

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="bg-muted/30 py-16 md:py-24 relative overflow-hidden"
    >
      <div className="container px-4 md:px-6 relative z-10">
        <div className="mx-auto mb-16 flex max-w-[800px] flex-col items-center justify-center gap-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold leading-[1.1] tracking-tighter sm:text-4xl md:text-5xl text-foreground">
              Built for Intellectual Curiosity
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto mt-6 rounded-full" />
            <p className="mt-6 leading-relaxed text-muted-foreground sm:text-lg">
              Explore a curated portal that transforms raw data and vast
              histories into digestible, fascinating articles.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="bg-background/80 backdrop-blur-sm border-muted/50 transition-all hover:shadow-xl hover:border-primary/50 group h-full">
                <CardHeader>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
