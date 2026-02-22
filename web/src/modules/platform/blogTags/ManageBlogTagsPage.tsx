"use client";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformBlogTagsApi } from "@/lib/api/platform-blog-tags";
import { BlogTagForm } from "./BlogTagForm";
import type { PlatformBlogTag } from "./types";

const tagFilterSchema = z.object({
  name: z.string().optional().describe("Name"),
  slug: z.string().optional().describe("Slug"),
  status: z.enum(["active", "inactive"]).optional().describe("Status"),
});

export function ManageBlogTagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blog Tags</h1>
        <p className="mt-2 text-muted-foreground">
          Manage global blog tags across the platform.
        </p>
      </div>

      <DataTable<PlatformBlogTag>
        tag={platformBlogTagsApi.getList.key}
        title="Tags"
        moduleKey="platform.blogTags"
        organizationRequired={false}
        fetchData={{
          key: platformBlogTagsApi.getList.key,
          endpoint: platformBlogTagsApi.getList.endpoint,
          method: platformBlogTagsApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "name",
                accessorKey: "name",
                header: "Tag & Slug",
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                      #{row.original.slug}
                    </div>
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
                  >
                    {row.original.status === "active" ? "Active" : "Inactive"}
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
            component: BlogTagForm,
            displayMode: "sheet",
            label: "Add Tag",
            modalTitle: "Add Blog Tag",
            modalDescription: "Create a new platform-wide blog tag.",
          },
          edit: {
            component: BlogTagForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: platformBlogTagsApi.delete.endpoint,
              method: platformBlogTagsApi.delete.method,
              key: platformBlogTagsApi.delete.key,
            },
            confirmation: {
              title: "Delete Tag",
              message: "Are you sure you want to delete this tag?",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
          },
        }}
        filterConfig={{ schema: tagFilterSchema }}
        showPagination={true}
      />
    </div>
  );
}
