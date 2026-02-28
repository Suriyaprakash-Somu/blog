"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

export type LandingStat = {
  label: string;
  value: number;
  suffix?: string;
  description: string;
};

export function LandingStats({ stats }: { stats: LandingStat[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!stats || stats.length === 0) return;

    const ctx = gsap.context(() => {
      // Setup timeline for the number counters to run when scrolled into view
      // We will use IntersectionObserver to trigger the GSAP animation
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              countersRef.current.forEach((counter, idx) => {
                if (!counter || !stats[idx]) return;

                const targetValue = stats[idx].value;

                // Animate DOM element text content from 0 to targetValue
                gsap.to(counter, {
                  innerHTML: targetValue,
                  duration: 2.5,
                  ease: "power2.out",
                  snap: { innerHTML: 1 }, // Round to integers
                  onUpdate: function () {
                    // Update text content safely
                    if (counter) {
                      counter.innerText = Math.round(
                        this.targets()[0].innerHTML,
                      ).toLocaleString();
                    }
                  },
                });
              });

              // Only animate once
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
      className="relative py-24 bg-primary text-primary-foreground overflow-hidden"
    >
      {/* Abstract Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      ></div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="mx-auto flex max-w-[800px] flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Trusted by the Academic Community
            </h2>
            <p className="mt-4 text-primary-foreground/80 md:text-lg max-w-2xl mx-auto">
              We compile and synthesize massive datasets so you don't have to.
              Our scale ensures you always have the complete picture.
            </p>
          </motion.div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors"
            >
              <div className="flex items-baseline gap-1">
                <div
                  ref={(el) => {
                    countersRef.current[idx] = el;
                  }}
                  className="text-4xl font-extrabold tracking-tight lg:text-5xl"
                >
                  0
                </div>
                <span className="text-3xl font-bold text-primary-foreground/70">
                  {stat.suffix ?? ""}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{stat.label}</h3>
              <p className="mt-2 text-sm text-primary-foreground/70 leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
