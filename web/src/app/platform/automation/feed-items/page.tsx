"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ManageFeedItemsPage } from "@/modules/platform/automation/ManageFeedItemsPage";

export default function Page() {
  return (
    <PageShell>
      <ManageFeedItemsPage />
    </PageShell>
  );
}
