"use client";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformBannersApi } from "@/lib/api/platform-banners";
import { BannerForm } from "./BannerForm";
import type { PlatformBanner } from "./types";

const bannerFilterSchema = z.object({
  title: z.string().optional().describe("Title"),
  pathPattern: z.string().optional().describe("Path Pattern"),
  type: z.enum(["HEADER", "CTA"]).optional().describe("Type"),
  isActive: z.boolean().optional().describe("Is Active"),
});

export function ManageBannersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
        <p className="mt-2 text-muted-foreground">Manage platform banners, hero sections, and CTA placements.</p>
      </div>

      <DataTable<PlatformBanner>
        tag={platformBannersApi.getList.key}
        title="Platform Banners"
        moduleKey="platform.banners"
        organizationRequired={false}
        fetchData={{
          key: platformBannersApi.getList.key,
          endpoint: platformBannersApi.getList.endpoint,
          method: platformBannersApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "title",
                accessorKey: "title",
                header: "Title",
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium">{row.original.title}</div>
                    <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                      {row.original.description || "-"}
                    </div>
                  </div>
                ),
              },
              {
                id: "pathPattern",
                accessorKey: "pathPattern",
                header: "Path",
                cell: ({ row }) => (
                  <code className="rounded bg-muted px-2 py-1 text-xs">{row.original.pathPattern}</code>
                ),
              },
              {
                id: "type",
                accessorKey: "type",
                header: "Type",
                cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
              },
              {
                id: "status",
                accessorKey: "isActive",
                header: "Status",
                cell: ({ row }) => (
                  <Badge variant={row.original.isActive ? "default" : "secondary"}>
                    {row.original.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                id: "updatedAt",
                accessorKey: "updatedAt",
                header: "Updated",
                cell: ({ row }) => (
                  <span className="text-xs text-muted-foreground">
                    {new Date(row.original.updatedAt).toLocaleDateString()}
                  </span>
                ),
              },
            ],
          },
        ]}
        operations={{
          add: {
            component: BannerForm,
            displayMode: "sheet",
            label: "Add Banner",
            modalTitle: "Add Banner",
            modalDescription: "Create a new platform banner.",
          },
          edit: {
            component: BannerForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: platformBannersApi.delete.endpoint,
              method: platformBannersApi.delete.method,
              key: platformBannersApi.delete.key,
            },
            confirmation: {
              title: "Delete Banner",
              message: "Are you sure you want to delete this banner?",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
          },
        }}
        filterConfig={{ schema: bannerFilterSchema }}
        showPagination={true}
      />
    </div>
  );
}
