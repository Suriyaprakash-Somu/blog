"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";
import { BannerProvider } from "@/providers/BannerContext";
import { AnalyticsProvider } from "@/providers/AnalyticsContext";
import { PublicBannerManager } from "@/components/banner/PublicBannerManager";
import type { BannerRow } from "@/lib/banner/types";

export default function Providers({
  children,
  initialPublicBanners,
}: {
  children: React.ReactNode;
  initialPublicBanners?: { rows: BannerRow[]; rowCount?: number } | null;
}): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ErrorBoundary>
          <AnalyticsProvider>
            <BannerProvider initialPublicBanners={initialPublicBanners}>
              <PublicBannerManager />
              {children}
            </BannerProvider>
          </AnalyticsProvider>
          <Toaster richColors position="top-right" />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
