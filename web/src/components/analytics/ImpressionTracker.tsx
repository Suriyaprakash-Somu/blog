"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "@/providers/AnalyticsContext";

export function ImpressionTracker({
  children,
  eventType,
  eventData,
  threshold = 0.5,
}: {
  children: React.ReactNode;
  eventType: string;
  eventData: Record<string, unknown>;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const hasTrackedRef = useRef(false);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold && !hasTrackedRef.current) {
            hasTrackedRef.current = true;
            trackEvent(eventType, eventData);
            observer.disconnect();
          }
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [trackEvent, eventType, eventData, threshold]);

  return <div ref={ref}>{children}</div>;
}
