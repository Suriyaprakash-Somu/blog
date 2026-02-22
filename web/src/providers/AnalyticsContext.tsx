"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { clientFetch } from "@/lib/client-fetch";
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

  const flushQueue = useCallback(async () => {
    if (flushingRef.current || queueRef.current.length === 0) {
      return;
    }

    const batch = [...queueRef.current];
    queueRef.current = [];
    flushingRef.current = true;

    try {
      if (tenantScope) {
        await clientFetch(endpoint, {
          method: "POST",
          body: batch,
        });
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
  }, [endpoint, tenantScope, baseUrl]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void flushQueue();
    }, BATCH_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushQueue();
      }
    };

    const onBeforeUnload = () => {
      void flushQueue();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flushQueue();
    };
  }, [flushQueue]);

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      trackEvent: enqueue,
    }),
    [enqueue],
  );

  useEffect(() => {
    if (!pathname) return;
    enqueue("PAGE_VIEW", { path: pathname });
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
