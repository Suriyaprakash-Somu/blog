"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  Building2,
  Eye,
  Layers,
  Users,
  Layers3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { QueryBuilder } from "@/components/queryBuilder/QueryBuilder";
import { AnalyticsCardGrid } from "@/components/analytics/AnalyticsCardGrid";
import { AnalyticsStatCard } from "@/components/analytics/AnalyticsStatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformAnalyticsApi } from "@/lib/api/platform-analytics";

type DashboardResponse = {
  eventCounts: Record<string, number>;
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
  trendDaily: Array<{ date: string; count: number }>;
  heatmapData: Array<{ day: number; hour: number; count: number }>;
  tenantCount: number;
};

const analyticsFilterSchema = z.object({
  startDate: z
    .string()
    .optional()
    .describe(JSON.stringify({ label: "Start Date", inputType: "date" })),
  endDate: z
    .string()
    .optional()
    .describe(JSON.stringify({ label: "End Date", inputType: "date" })),
  tenantId: z.string().optional().describe("Tenant ID"),
  eventType: z.string().optional().describe("Event Type"),
  path: z.string().optional().describe("Path contains"),
});

export function PlatformAnalyticsPage() {
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
    key: platformAnalyticsApi.dashboard.key,
    endpoint: platformAnalyticsApi.dashboard.endpoint,
    method: platformAnalyticsApi.dashboard.method,
    queryParams,
    requireOrganization: false,
    options: { placeholderData: (prev) => prev },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="Global analytics across all tenants and traffic."
      />

      <QueryBuilder
        schema={analyticsFilterSchema}
        initialValue={filters}
        onSubmit={(next) => setFilters((next ?? {}) as Record<string, unknown>)}
        defaultOpen={true}
      />

      <AnalyticsCardGrid>
        <AnalyticsStatCard
          title="Active Tenants"
          value={data?.tenantCount ?? 0}
          isLoading={isLoading}
          icon={Building2}
          tone="success"
        />
        <AnalyticsStatCard title="Page Views" value={data?.eventCounts?.PAGE_VIEW ?? 0} isLoading={isLoading} icon={Eye} />
        <AnalyticsStatCard title="Total Events" value={data?.totalEvents ?? 0} isLoading={isLoading} icon={Layers} />
        <AnalyticsStatCard title="Unique Users" value={data?.uniqueUsers ?? 0} isLoading={isLoading} icon={Users} />
        <AnalyticsStatCard title="Unique Sessions" value={data?.uniqueSessions ?? 0} isLoading={isLoading} icon={Layers3} />
      </AnalyticsCardGrid>

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
