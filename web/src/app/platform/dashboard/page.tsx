"use client";

import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionCard } from "@/components/layout/SectionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformTenantsApi } from "@/lib/api/platform-tenants";
import { platformAnalyticsApi } from "@/lib/api/platform-analytics";

type PaginatedResponse<T> = {
  rows: T[];
  rowCount: number;
};

type PlatformAnalyticsDashboard = {
  totalEvents: number;
  uniqueSessions: number;
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export default function PlatformDashboardPage() {
  const { data: tenants, isLoading: tenantsLoading } = useApiQuery<PaginatedResponse<unknown>>({
    key: platformTenantsApi.getList.key,
    endpoint: platformTenantsApi.getList.endpoint,
    method: platformTenantsApi.getList.method,
    queryParams: { page: 1, pageSize: 1 },
    requireOrganization: false,
    options: { placeholderData: (prev) => prev },
  });

  const { data: analytics, isLoading: analyticsLoading } = useApiQuery<PlatformAnalyticsDashboard>({
    key: platformAnalyticsApi.dashboard.key,
    endpoint: platformAnalyticsApi.dashboard.endpoint,
    method: platformAnalyticsApi.dashboard.method,
    queryParams: {
      startDate: daysAgo(7).toISOString(),
      endDate: new Date().toISOString(),
    },
    requireOrganization: false,
    options: { placeholderData: (prev) => prev },
  });

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Platform Dashboard"
          description="System health and onboarding activity overview."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantsLoading ? "…" : (tenants?.rowCount ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                From the tenants registry
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsLoading ? "…" : (analytics?.totalEvents ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Unique sessions: {analyticsLoading ? "…" : (analytics?.uniqueSessions ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <SectionCard
          title="Welcome back"
          description="Keep an eye on tenant activity and system usage."
        >
          <p className="text-muted-foreground">
            This overview is live and backed by platform APIs.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}
