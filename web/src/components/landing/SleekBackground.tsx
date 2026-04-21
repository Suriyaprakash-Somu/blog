"use client";

import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function SleekBackground({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 5000], [0, 300]);
  const y2 = useTransform(scrollY, [0, 5000], [0, -200]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Animated Dot Grid */}
        <div
          className="absolute inset-0 opacity-[0.2] dark:opacity-[0.3]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating Gradients */}
        <motion.div
          style={{ y: y1 }}
          className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[120px]"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute top-[40%] -right-[10%] h-[60%] w-[50%] rounded-full bg-accent/10 blur-[150px]"
        />
        <motion.div
           style={{ y: y1 }}
          className="absolute bottom-[-10%] left-[20%] h-[40%] w-[40%] rounded-full bg-secondary/10 blur-[130px]"
        />
      </div>

      {/* Grid Overlay for extra "Vite/Cloudflare" feel */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.2)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
