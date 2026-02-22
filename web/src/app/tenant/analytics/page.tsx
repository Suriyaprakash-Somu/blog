"use client";

import { PageShell } from "@/components/layout/PageShell";
import { TenantAnalyticsPage } from "@/modules/tenant/analytics/TenantAnalyticsPage";

export default function Page() {
  return (
    <PageShell>
      <TenantAnalyticsPage />
    </PageShell>
  );
}
