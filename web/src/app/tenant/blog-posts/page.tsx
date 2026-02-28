"use client";

import { PageShell } from "@/components/layout/PageShell";
import { ManageBlogPostsPage } from "@/modules/tenant/blogPosts/ManageBlogPostsPage";

export default function Page() {
  return (
    <PageShell>
      <ManageBlogPostsPage />
    </PageShell>
  );
}
