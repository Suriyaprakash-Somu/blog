"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export type LandingStat = {
  label: string;
  value: number;
  suffix?: string;
  description: string;
};

export function LandingStats({ stats }: { stats: LandingStat[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.8, 1]);

  useEffect(() => {
    if (!stats || stats.length === 0) return;

    const ctx = gsap.context(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              countersRef.current.forEach((counter, idx) => {
                if (!counter || !stats[idx]) return;

                const targetValue = stats[idx].value;

                gsap.to(counter, {
                  innerHTML: targetValue,
                  duration: 2,
                  ease: "power3.out",
                  snap: { innerHTML: 1 },
                  onUpdate: function () {
                    if (counter) {
                      counter.innerText = Math.round(
                        this.targets()[0].innerHTML,
                      ).toLocaleString();
                    }
                  },
                });
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 },
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => {
        if (sectionRef.current) observer.unobserve(sectionRef.current);
      };
    }, sectionRef);

    return () => ctx.revert();
  }, [stats]);

  return (
    <section
      ref={sectionRef}
      className="relative py-12 lg:py-16 overflow-hidden"
      aria-label="Platform reach and impact statistics"
    >
      <motion.div 
        style={{ opacity, scale }}
        className="container relative z-10 px-4 md:px-6 mx-auto max-w-7xl"
      >
        <h2 className="sr-only">Platform Impact Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={cn(
                "group relative border border-white/5 bg-background/40 p-10 backdrop-blur-2xl transition-all hover:bg-background/60 rounded-[2.5rem] flex flex-col items-center text-center overflow-hidden"
              )}
            >
              {/* Background gradient for cards */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex items-baseline gap-1">
                <div
                  ref={(el) => {
                    countersRef.current[idx] = el;
                  }}
                  className="text-6xl font-black tracking-tighter text-foreground"
                >
                  0
                </div>
                {stat.suffix && (
                   <span className="text-3xl font-bold text-primary italic">
                    {stat.suffix}
                  </span>
                )}
              </div>
              
              <h3 className="relative z-10 mt-6 text-xl font-bold text-foreground">
                {stat.label}
              </h3>
              <p className="relative z-10 mt-3 text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                {stat.description}
              </p>
              
              {/* Hover highlight border line */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-primary group-hover:w-1/2 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
