"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ManageBlogTagsPage } from "@/modules/platform/blogTags/ManageBlogTagsPage";

export default function Page() {
  return (
    <PageShell>
      <ManageBlogTagsPage />
    </PageShell>
  );
}
