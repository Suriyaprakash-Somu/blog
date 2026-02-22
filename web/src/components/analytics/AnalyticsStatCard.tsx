"use client";

import { useEffect, useRef, useState } from "react";
import { motion, animate, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AnalyticsStatCardProps = {
  title: string;
  value: number;
  format?: (value: number) => string;
  icon?: LucideIcon;
  isLoading?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
};

const toneStyles: Record<NonNullable<AnalyticsStatCardProps["tone"]>, string> = {
  default: "from-slate-50/80 via-white to-slate-100/70",
  success: "from-emerald-50/80 via-white to-emerald-100/70",
  warning: "from-amber-50/80 via-white to-amber-100/70",
  danger: "from-rose-50/80 via-white to-rose-100/70",
};

export function AnalyticsStatCard({
  title,
  value,
  format,
  icon: Icon,
  isLoading = false,
  tone = "default",
}: AnalyticsStatCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    if (isLoading || prefersReducedMotion) {
      previousValue.current = value;
      return;
    }

    const controls = animate(previousValue.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest),
    });

    previousValue.current = value;

    return () => {
      controls.stop();
    };
  }, [value, isLoading, prefersReducedMotion]);

  const shownValue = isLoading || prefersReducedMotion ? value : displayValue;
  const formatted = format ? format(shownValue) : shownValue.toFixed(0);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-gradient-to-br shadow-sm",
        toneStyles[tone],
        "backdrop-blur"
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <div className="mt-2 text-2xl font-semibold text-foreground">
            {isLoading ? "—" : formatted}
          </div>
        </div>
        {Icon && (
          <motion.div
            initial={{ opacity: 0.6, rotate: -6 }}
            animate={{ opacity: 1, rotate: 0 }}
            whileHover={{ rotate: -4, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-700 shadow-inner"
          >
            <Icon size={20} />
          </motion.div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.div>
  );
}
