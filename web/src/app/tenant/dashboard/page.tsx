"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { SectionCard } from "@/components/layout/SectionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTenantSession } from "@/lib/auth/useTenantSession";

export default function TenantDashboardPage() {
  const { data: session } = useTenantSession();

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Overview of your blog."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Published blog posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">All time views</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Total comments</p>
            </CardContent>
          </Card>
        </div>

        <SectionCard
          title={`Welcome${session?.user?.name ? `, ${session.user.name}` : ""}`}
          description="Your blog is ready."
        >
          <p className="text-muted-foreground">
            You are logged in to the <strong>{session?.tenant?.name}</strong>{" "}
            workspace.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}
