"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { Eye, Users, Layers, MousePointerClick, Layers3 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { QueryBuilder } from "@/components/queryBuilder/QueryBuilder";
import { AnalyticsCardGrid } from "@/components/analytics/AnalyticsCardGrid";
import { AnalyticsStatCard } from "@/components/analytics/AnalyticsStatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/hooks/useApiQuery";
import { tenantAnalyticsApi } from "@/lib/api/tenant-analytics";

type DashboardResponse = {
  eventCounts: Record<string, number>;
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
  trendDaily: Array<{ date: string; count: number }>;
  heatmapData: Array<{ day: number; hour: number; count: number }>;
};

type FunnelResponse = {
  pageViews: number;
  impressions: number;
  ctaClicks: number;
};

type SessionDepthResponse = Array<{ bucket: string; sessions: number }>;

const analyticsFilterSchema = z.object({
  startDate: z.string().optional().describe(JSON.stringify({ label: "Start Date", inputType: "date" })),
  endDate: z.string().optional().describe(JSON.stringify({ label: "End Date", inputType: "date" })),
  eventType: z.string().optional().describe("Event Type"),
  path: z.string().optional().describe("Path contains"),
});

export function TenantAnalyticsPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters || {})) {
      if (value !== undefined && value !== null && value !== "") {
        params[key] = value;
      }
    }
    return params;
  }, [filters]);

  const { data, isLoading } = useApiQuery<DashboardResponse>({
    key: tenantAnalyticsApi.dashboard.key,
    endpoint: tenantAnalyticsApi.dashboard.endpoint,
    method: tenantAnalyticsApi.dashboard.method,
    queryParams,
    requireOrganization: true,
    options: { placeholderData: (prev) => prev },
  });

  const { data: funnel } = useApiQuery<FunnelResponse>({
    key: tenantAnalyticsApi.funnel.key,
    endpoint: tenantAnalyticsApi.funnel.endpoint,
    method: tenantAnalyticsApi.funnel.method,
    queryParams,
    requireOrganization: true,
    options: { placeholderData: (prev) => prev },
  });

  const { data: sessionDepth } = useApiQuery<{ data: SessionDepthResponse }>({
    key: tenantAnalyticsApi.leadTime.key,
    endpoint: tenantAnalyticsApi.leadTime.endpoint,
    method: tenantAnalyticsApi.leadTime.method,
    queryParams,
    requireOrganization: true,
    options: { placeholderData: (prev) => prev },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Track tenant usage and product events." />

      <QueryBuilder
        schema={analyticsFilterSchema}
        initialValue={filters}
        onSubmit={(next) => setFilters((next ?? {}) as Record<string, unknown>)}
        defaultOpen={true}
      />

      <AnalyticsCardGrid>
        <AnalyticsStatCard title="Page Views" value={data?.eventCounts?.PAGE_VIEW ?? 0} isLoading={isLoading} icon={Eye} />
        <AnalyticsStatCard title="Total Events" value={data?.totalEvents ?? 0} isLoading={isLoading} icon={Layers} />
        <AnalyticsStatCard title="Unique Users" value={data?.uniqueUsers ?? 0} isLoading={isLoading} icon={Users} />
        <AnalyticsStatCard title="Unique Sessions" value={data?.uniqueSessions ?? 0} isLoading={isLoading} icon={Layers3} />
      </AnalyticsCardGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Event Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>Page Views</span><Badge>{funnel?.pageViews ?? 0}</Badge></div>
            <div className="flex items-center justify-between"><span>Impressions</span><Badge>{funnel?.impressions ?? 0}</Badge></div>
            <div className="flex items-center justify-between"><span>CTA Clicks</span><Badge>{funnel?.ctaClicks ?? 0}</Badge></div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Session Depth</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(sessionDepth?.data ?? []).map((row) => (
              <div key={row.bucket} className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{row.bucket} events</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
                  <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                  {row.sessions}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Event Types</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.topEventTypes ?? []).map((row) => (
            <div key={row.eventType} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="truncate" title={row.eventType}>{row.eventType}</span>
              <Badge>{row.count}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
