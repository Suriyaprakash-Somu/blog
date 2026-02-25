"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ManageFeaturedCollectionsPage } from "@/modules/platform/featuredCollections/ManageFeaturedCollectionsPage";

export default function Page() {
  return (
    <PageShell>
      <ManageFeaturedCollectionsPage />
    </PageShell>
  );
}
