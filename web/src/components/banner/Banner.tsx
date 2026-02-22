"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useAnalytics } from "@/providers/AnalyticsContext";

type BannerAction = {
  label: string;
  href?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
};

type BannerBackground = {
  type?: "color" | "image" | "gradient";
  value?: string;
  overlay?: number;
};

export interface BannerProps {
  title?: string;
  description?: string;
  actions?: BannerAction[];
  href?: string;
  background?: BannerBackground;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "center" | "bottom";
  variant?: "banner" | "hero" | "fullscreen";
  theme?: "light" | "dark";
  className?: string;
  priority?: boolean;
}

export function Banner({
  title,
  description,
  actions = [],
  href,
  background = { type: "color", value: "bg-primary/5" },
  align = "left",
  verticalAlign = "center",
  variant = "banner",
  theme = "light",
  className,
  priority = false,
}: BannerProps) {
  const { trackEvent } = useAnalytics();
  const isHero = variant === "hero" || variant === "fullscreen";
  const isDark = theme === "dark";

  const heightClasses = {
    banner: "h-[200px] py-0",
    hero: "h-[500px] py-0",
    fullscreen: "h-screen py-0",
  } as const;

  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  } as const;

  const verticalClasses = {
    top: "justify-start",
    center: "justify-center",
    bottom: "justify-end",
  } as const;

  const isImage = background.type === "image";
  const isGradient = background.type === "gradient";
  const isColor = background.type === "color";
  const bgClass = isColor ? (background.value ?? "bg-primary/5") : "bg-transparent";
  const shouldPrioritize = priority || isHero;

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden",
        heightClasses[variant],
        verticalClasses[verticalAlign],
        bgClass,
        className,
      )}
    >
      {href ? <Link href={href} className="absolute inset-0 z-10" aria-label={title || "Banner link"} /> : null}

      {isImage && background.value ? (
        <Image
          src={background.value}
          alt={title || "Banner"}
          fill
          priority={shouldPrioritize}
          fetchPriority={shouldPrioritize ? "high" : "auto"}
          sizes="100vw"
          className="object-cover"
          unoptimized={background.value.startsWith("http")}
        />
      ) : null}

      {isGradient && background.value ? (
        <div className="absolute inset-0" style={{ background: background.value }} />
      ) : null}

      {background.overlay ? (
        <div
          className={cn("absolute inset-0", isDark ? "bg-black" : "bg-white")}
          style={{ opacity: background.overlay }}
        />
      ) : null}

      <div
        className={cn(
          "pointer-events-none relative z-20 mx-auto flex w-full max-w-6xl flex-col gap-4 px-6",
          alignClasses[align],
        )}
      >
        <div className="pointer-events-auto max-w-3xl">
          {title ? (
            <h2
              className={cn(
                "mb-2 font-bold tracking-tight",
                isHero ? "text-4xl md:text-5xl lg:text-6xl" : "text-2xl md:text-3xl",
                isDark ? "text-white" : "text-foreground",
              )}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p
              className={cn(
                "mb-6 max-w-[680px]",
                isHero ? "text-lg md:text-xl" : "text-base",
                isDark ? "text-white/90" : "text-muted-foreground",
                align === "center" ? "mx-auto" : "",
              )}
            >
              {description}
            </p>
          ) : null}

          {actions.length > 0 ? (
            <div className="relative z-30 mt-4 flex flex-wrap gap-3">
              {actions.map((action, idx) => (
                <Link
                  key={`${action.label}-${idx}`}
                  href={action.href || "#"}
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent("CTA_CLICK", {
                      bannerTitle: title ?? null,
                      ctaLabel: action.label,
                      href: action.href ?? null,
                      variant: action.variant ?? null,
                    });
                  }}
                  className={cn(buttonVariants({ variant: action.variant || "default" }), "gap-2")}
                >
                  <span>{action.label}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
