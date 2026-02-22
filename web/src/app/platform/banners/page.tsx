"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ManageBannersPage } from "@/modules/platform/banners/ManageBannersPage";

export default function Page() {
  return (
    <PageShell>
      <ManageBannersPage />
    </PageShell>
  );
}
