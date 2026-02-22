"use client";

import { DataTable } from "@/components/dataTable/DataTable";
import type { ColumnGroup } from "@/components/dataTable/types";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";

interface AuditLogRow extends Record<string, unknown> {
  id: string;
  tenantId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  actorId: string;
  actorType: string;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRoleName?: string | null;
  impersonatedByAdminId?: string | null;
  impersonatorName?: string | null;
  impersonatorEmail?: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  "tenant.status.updated": "Tenant Status Updated",
  "tenant.updated": "Tenant Updated",
  "tenant.deleted": "Tenant Deleted",
  "impersonation.login": "Impersonation Started",
  "impersonation.logout": "Impersonation Ended",
  create: "Created",
  update: "Updated",
  delete: "Deleted",
};

function humanizeAction(action: string): string {
  if (ACTION_LABELS[action]) {
    return ACTION_LABELS[action];
  }

  return action
    .split(/[._]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const columns: ColumnGroup<AuditLogRow>[] = [
  {
    columns: [
      {
        id: "action",
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium">{humanizeAction(row.original.action)}</div>
            <div className="text-xs text-muted-foreground">{row.original.action}</div>
          </div>
        ),
      },
      {
        id: "resourceType",
        accessorKey: "resourceType",
        header: "Resource",
      },
      {
        id: "resourceId",
        accessorKey: "resourceId",
        header: "Resource ID",
      },
      {
        id: "actor",
        header: "Actor",
        cell: ({ row }) => {
          const roleLabel = row.original.actorRoleName || row.original.actorType;
          return (
            <div className="space-y-1">
              <div className="font-medium">
                {row.original.actorName || row.original.actorId}
                {roleLabel ? ` (${roleLabel})` : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                {row.original.actorEmail || row.original.actorId}
              </div>
            </div>
          );
        },
      },
      {
        id: "impersonation",
        header: "Impersonation",
        cell: ({ row }) =>
          row.original.impersonatedByAdminId ? (
            <div className="space-y-1">
              <div className="font-medium">{row.original.impersonatorName || "Platform Admin"}</div>
              <div className="text-xs text-muted-foreground">
                {row.original.impersonatorEmail || row.original.impersonatedByAdminId}
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleString()
              : "-"}
          </span>
        ),
      },
    ],
  },
];

export default function AuditLogsPage() {
  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Audit Logs"
          description="Track platform and tenant changes across the system."
        />
        <DataTable<AuditLogRow>
          tag="audit-logs"
          title="Audit Logs"
          moduleKey="platform.auditLogs"
          organizationId="platform"
          fetchData={{
            endpoint: "/api/platform/audit-logs",
            method: "GET",
            key: ["audit-logs"],
          }}
          columnsConfig={columns}
          showPagination
          organizationRequired={false}
          operations={{}}
        />
      </div>
    </PageShell>
  );
}
