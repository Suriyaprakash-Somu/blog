"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Banner } from "@/components/banner/Banner";
import { useBanner } from "@/providers/BannerContext";
import { ImpressionTracker } from "@/components/analytics/ImpressionTracker";

type BannerType = "HEADER" | "CTA";

function pathMatches(pattern: string, path: string) {
  if (!pattern) return false;
  if (pattern === path) return true;
  if (pattern.endsWith("*")) return path.startsWith(pattern.slice(0, -1));
  if (pattern.startsWith("^")) {
    try {
      return new RegExp(pattern).test(path);
    } catch {
      return false;
    }
  }
  return false;
}

export function BannerManager({
  type = "HEADER",
  slot,
  className,
}: {
  type?: BannerType;
  slot?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const { banners, isLoading } = useBanner();
  const [currentIndex, setCurrentIndex] = useState(0);

  const matched = useMemo(() => {
    return (banners || []).filter((row) => {
      if (row.type !== type) return false;
      if (slot && row.slot !== slot) return false;
      if (!row.pathPattern) return false;
      return pathMatches(row.pathPattern, pathname);
    });
  }, [banners, pathname, slot, type]);

  useEffect(() => {
    if (matched.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % matched.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [matched.length]);

  if (isLoading && matched.length === 0) {
    return <div className={cn("h-[120px] w-full animate-pulse rounded-md bg-muted/50", className)} />;
  }

  if (matched.length === 0) return null;

  const normalizedIndex = currentIndex % matched.length;
  const current = matched[normalizedIndex] || matched[0];
  if (!current) return null;
  const props = (current.props ?? {}) as Record<string, unknown>;
  const rawBackground = (props.background as Record<string, unknown> | undefined) ?? {};
  const imageFileId = current.imageFileId || (typeof rawBackground.value === "string" ? rawBackground.value : null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3020";

  const background = {
    type: imageFileId ? "image" : ((rawBackground.type as "color" | "image" | "gradient") ?? "color"),
    value: imageFileId
      ? `${apiBaseUrl}/api/uploads/${imageFileId}/content`
      : (rawBackground.value as string | undefined),
    overlay: typeof rawBackground.overlay === "number" ? rawBackground.overlay : undefined,
  } as const;

  return (
    <div className={cn("group relative w-full", className)}>
      <ImpressionTracker
        eventType="IMPRESSION"
        eventData={{
          bannerId: current.id,
          bannerType: current.type,
          slot: current.slot,
          pathPattern: current.pathPattern,
          path: pathname,
        }}
        threshold={0.5}
      >
        <Banner
          title={current.title}
          description={current.description ?? undefined}
          href={typeof props.href === "string" ? props.href : undefined}
          actions={Array.isArray(props.actions) ? (props.actions as never[]) : []}
          background={background}
          align={(props.align as "left" | "center" | "right") || "left"}
          verticalAlign={(props.verticalAlign as "top" | "center" | "bottom") || "center"}
          variant={(props.variant as "banner" | "hero" | "fullscreen") || "banner"}
          theme={(props.theme as "light" | "dark") || "light"}
          priority={type === "HEADER"}
        />
      </ImpressionTracker>

      {matched.length > 1 ? (
        <>
          <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-2">
            {matched.map((banner, idx) => (
              <button
                key={banner.id}
                type="button"
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === normalizedIndex ? "w-5 bg-white" : "w-2 bg-white/50",
                )}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + matched.length) % matched.length)}
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/25 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % matched.length)}
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
