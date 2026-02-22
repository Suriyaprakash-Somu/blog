"use client";

import { PageShell } from "@/components/layout/PageShell";
import { PlatformAnalyticsPage } from "@/modules/platform/analytics/PlatformAnalyticsPage";

export default function Page() {
  return (
    <PageShell>
      <PlatformAnalyticsPage />
    </PageShell>
  );
}
