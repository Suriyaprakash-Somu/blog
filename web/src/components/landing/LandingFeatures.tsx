"use client";

import {
  BarChart3,
  CalendarDays,
  PenTool,
  Shield,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const features = [
  {
    title: "Content Management",
    description:
      "Create, edit, and publish blog posts with a powerful rich text editor.",
    icon: PenTool,
  },
  {
    title: "Media Library",
    description:
      "Upload and manage images, videos, and files for your blog posts.",
    icon: BarChart3,
  },
  {
    title: "Scheduling",
    description:
      "Schedule posts to publish automatically at the perfect time.",
    icon: CalendarDays,
  },
  {
    title: "Team Collaboration",
    description:
      "Invite team members with role-based access control.",
    icon: Users,
  },
  {
    title: "Analytics",
    description:
      "Track views, engagement, and growth with detailed analytics.",
    icon: BarChart3,
  },
  {
    title: "Security",
    description:
      "Multi-tenant architecture keeps your content safe and isolated.",
    icon: Shield,
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
  show: { opacity: 1, y: 0 },
};

export function LandingFeatures() {
  return (
    <section id="features" className="bg-muted/30 py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="mx-auto mb-12 flex max-w-232 flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-3xl font-bold leading-[1.1] tracking-tighter sm:text-4xl md:text-5xl">
            Everything you need to run your blog
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Our platform provides end-to-end content management tools designed
            specifically for modern blogging needs.
          </p>
        </div>
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="bg-background transition-shadow hover:shadow-lg h-full">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
