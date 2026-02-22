"use client";

import { z } from "zod";
import Image from "next/image";
import { DataTable } from "@/components/dataTable/DataTable";
import { Badge } from "@/components/ui/badge";
import { tenantBranchesApi } from "@/lib/api/tenant-branches";
import { BranchForm } from "./BranchForm";
import type { Branch } from "./types";
import { BRANCH_TYPES, BRANCH_STATUSES } from "./types";

// Zod schema for QueryBuilder filtering
const branchFilterSchema = z.object({
  name: z.string().optional().describe("Branch Name"),
  type: z.enum(BRANCH_TYPES).optional().describe("Type"),
  status: z.enum(BRANCH_STATUSES).optional().describe("Status"),
  city: z.string().optional().describe("City"),
});

// Helper to build image URL
function getImageUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  const apiBase = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3005";
  return `${apiBase}/api/uploads/${fileId}/content`;
}

export function ManageBranchesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization&apos;s branches and locations
        </p>
      </div>

      <DataTable<Branch>
        tag="tenant-branches"
        title="Branches"
        moduleKey="tenant.branches"
        fetchData={{
          key: tenantBranchesApi.getList.key,
          endpoint: tenantBranchesApi.getList.endpoint,
          method: tenantBranchesApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "image",
                accessorKey: "imageFileId",
                header: "Image",
                cell: ({ row }) => {
                  const imageUrl = getImageUrl(row.original.imageFileId);
                  return imageUrl ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md">
                      <Image
                        src={imageUrl}
                        alt={row.original.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  );
                },
              },
              {
                id: "name",
                accessorKey: "name",
                header: "Branch",
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium">{row.original.name}</div>
                    {row.original.code && (
                      <div className="text-xs text-muted-foreground">
                        {row.original.code}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: "type",
                accessorKey: "type",
                header: "Type",
                cell: ({ row }) => (
                  <Badge variant="outline" className="capitalize">
                    {row.original.type}
                  </Badge>
                ),
              },
              {
                id: "location",
                accessorKey: "city",
                header: "Location",
                cell: ({ row }) => (
                  <div className="text-sm">
                    {row.original.city && row.original.state ? (
                      <>
                        <div>{row.original.city}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.original.state}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                ),
              },
              {
                id: "status",
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => (
                  <Badge
                    variant={
                      row.original.status === "active" ? "default" : "secondary"
                    }
                    className="capitalize"
                  >
                    {row.original.status}
                  </Badge>
                ),
              },
              {
                id: "isHeadquarters",
                accessorKey: "isHeadquarters",
                header: "HQ",
                cell: ({ row }) =>
                  row.original.isHeadquarters ? (
                    <Badge variant="default">HQ</Badge>
                  ) : null,
              },
            ],
          },
        ]}
        operations={{
          add: {
            component: BranchForm,
            displayMode: "sheet",
            label: "Add Branch",
          },
          edit: {
            component: BranchForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: tenantBranchesApi.delete.endpoint,
              method: tenantBranchesApi.delete.method,
              key: tenantBranchesApi.delete.key,
            },
            confirmation: {
              title: "Delete Branch",
              message:
                "Are you sure you want to delete this branch? This action cannot be undone.",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
          },
        }}
        filterConfig={{
          schema: branchFilterSchema,
        }}
        showPagination={true}
        organizationRequired={false}
      />
    </div>
  );
}
