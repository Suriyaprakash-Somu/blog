"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { clientFetch } from "@/lib/client-fetch";
import { useApiMutation } from "@/hooks/useApiMutation";
import { fetchCore } from "@/lib/fetch-core";
import { tenantAnalyticsApi } from "@/lib/api/tenant-analytics";
import { publicAnalyticsApi } from "@/lib/api/public-analytics";
import { useTenantSession } from "@/lib/auth/useTenantSession";

type AnalyticsEvent = {
  eventType: string;
  eventData: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
};

interface AnalyticsContextValue {
  trackEvent: (eventType: string, eventData?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);
const BATCH_INTERVAL_MS = 5000;

function isTenantScope(pathname: string): boolean {
  return pathname.startsWith("/tenant");
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tenantScope = isTenantScope(pathname || "/");

  const { data: tenantSession } = useTenantSession({ enabled: tenantScope });
  const queueRef = useRef<AnalyticsEvent[]>([]);
  const flushingRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Track scroll milestones
  const scrolledMilestones = useRef(new Set<number>());
  // Track time on page
  const pageEnterTime = useRef<number>(Date.now());

  const endpoint = tenantScope
    ? tenantAnalyticsApi.trackBatch.endpoint
    : publicAnalyticsApi.trackBatch.endpoint;

  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3005";

  const getSessionId = useCallback((): string | undefined => {
    if (typeof window === "undefined") return undefined;
    if (sessionIdRef.current) return sessionIdRef.current;

    try {
      const key = "lm_session_id";
      const existing = window.localStorage.getItem(key);
      if (existing && existing.trim()) {
        sessionIdRef.current = existing;
        return existing;
      }

      const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sess_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
      window.localStorage.setItem(key, id);
      sessionIdRef.current = id;
      return id;
    } catch {
      return undefined;
    }
  }, []);

  const enqueue = useCallback(
    (eventType: string, eventData: Record<string, unknown> = {}) => {
      const userId = tenantScope ? tenantSession?.user?.id : undefined;
      const sessionId = getSessionId();

      queueRef.current.push({
        eventType,
        eventData,
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
      });
    },
    [tenantScope, tenantSession?.user?.id, getSessionId],
  );

  const trackMutation = useApiMutation<any, any>({
    endpoint,
    method: "POST",
  });

  const flushQueue = useCallback(async () => {
    if (flushingRef.current || queueRef.current.length === 0) {
      return;
    }

    const batch = [...queueRef.current];
    queueRef.current = [];
    flushingRef.current = true;

    try {
      if (tenantScope) {
        await trackMutation.mutateAsync(batch);
      } else {
        await fetchCore(endpoint, {
          method: "POST",
          body: batch,
          baseUrl,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isAuthFailure =
        message.includes("401") ||
        message.includes("403") ||
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("forbidden") ||
        message.toLowerCase().includes("csrf");
      if (!isAuthFailure) {
        queueRef.current = [...batch, ...queueRef.current].slice(0, 1000);
      }
    } finally {
      flushingRef.current = false;
    }
  }, [endpoint, tenantScope, baseUrl, trackMutation]);

  // Use refs for stable function identities in effects
  const enqueueRef = useRef(enqueue);
  const flushQueueRef = useRef(flushQueue);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    enqueueRef.current = enqueue;
    flushQueueRef.current = flushQueue;
    pathnameRef.current = pathname;
  }, [enqueue, flushQueue, pathname]);

  // Track Time On Page before leaving
  const trackTimeOnPage = useCallback(() => {
    if (!pathnameRef.current) return;
    const durationMs = Date.now() - pageEnterTime.current;
    if (durationMs > 1000) { // Only track if they stayed at least 1 second
      enqueueRef.current("TIME_ON_PAGE", {
        path: pathnameRef.current,
        durationSeconds: Math.round(durationMs / 1000),
      });
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void flushQueueRef.current();
    }, BATCH_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        trackTimeOnPage();
        void flushQueueRef.current();
      } else {
        // Reset enter time when coming back
        pageEnterTime.current = Date.now();
      }
    };

    const onBeforeUnload = () => {
      trackTimeOnPage();
      void flushQueueRef.current();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // Removed immediate flushQueue call from general cleanup to prevent loops 
      // during re-renders. beforeunload handles actual tab closing.
    };
  }, [trackTimeOnPage]); // interval no longer needs to reset when flushQueue changes identity

  // Global click tracker for outbound links and data-analytics elements
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check for data-analytics attribute anywhere in the clicked tree
      const analyticsElem = target.closest('[data-analytics]');
      if (analyticsElem) {
        const id = analyticsElem.getAttribute('data-analytics');
        if (id) {
          enqueue("CTA_CLICK", { id, path: window.location.pathname });
        }
      }

      // Check for article click attribute anywhere in the clicked tree
      const articleElem = target.closest('[data-article-click]');
      if (articleElem) {
        const slug = articleElem.getAttribute('data-article-slug');
        const title = articleElem.getAttribute('data-article-title');
        if (slug) {
          enqueue("ARTICLE_CLICK", { slug, title, path: window.location.pathname });
        }
      }

      // Check for outbound links
      const link = target.closest('a');
      if (link && link.href) {
        try {
          const url = new URL(link.href);
          if (url.origin !== window.location.origin) {
            enqueue("OUTBOUND_CLICK", {
              url: link.href,
              path: window.location.pathname,
            });
          }
        } catch {
          // invalid url, ignore
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [enqueue]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Calculate percentage (avoid division by zero)
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) return;

      const percentage = (scrollTop / scrollable) * 100;

      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (percentage >= milestone && !scrolledMilestones.current.has(milestone)) {
          scrolledMilestones.current.add(milestone);
          enqueue("SCROLL_DEPTH", {
            path: window.location.pathname,
            depth: milestone,
          });
        }
      }
    };

    // Throttle scroll event
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollListener);
    return () => window.removeEventListener("scroll", scrollListener);
  }, [enqueue, pathname]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      trackEvent: enqueue,
    }),
    [enqueue],
  );

  useEffect(() => {
    if (!pathname) return;

    // Reset page-level state on navigation
    scrolledMilestones.current.clear();
    pageEnterTime.current = Date.now();

    // Gather rich context for PAGE_VIEW
    const searchParams = new URLSearchParams(window.location.search);
    const utms = {
      source: searchParams.get("utm_source"),
      medium: searchParams.get("utm_medium"),
      campaign: searchParams.get("utm_campaign"),
      term: searchParams.get("utm_term"),
      content: searchParams.get("utm_content"),
    };

    // Only include UTMs if they exist
    const activeUtms = Object.fromEntries(
      Object.entries(utms).filter(([_, v]) => v !== null)
    );

    // Get device info
    const device = {
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
      screen: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer || undefined,
    };

    enqueue("PAGE_VIEW", {
      path: pathname,
      ...activeUtms,
      ...device,
    });
  }, [enqueue, pathname]);

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
}
