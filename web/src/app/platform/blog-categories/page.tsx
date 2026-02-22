"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ManageBlogCategoriesPage } from "@/modules/platform/blogCategories/ManageBlogCategoriesPage";

export default function Page() {
  return (
    <PageShell>
      <ManageBlogCategoriesPage />
    </PageShell>
  );
}
