"use client";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformBlogCategoriesApi } from "@/lib/api/platform-blog-categories";
import { BlogCategoryForm } from "./BlogCategoryForm";
import type { PlatformBlogCategory } from "./types";

const categoryFilterSchema = z.object({
  name: z.string().optional().describe("Name"),
  slug: z.string().optional().describe("Slug"),
  status: z.enum(["active", "inactive"]).optional().describe("Status"),
});

export function ManageBlogCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blog Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Manage global blog categories across the platform.
        </p>
      </div>

      <DataTable<PlatformBlogCategory>
        tag={platformBlogCategoriesApi.getList.key}
        title="Categories"
        moduleKey="platform.blogCategories"
        organizationRequired={false}
        fetchData={{
          key: platformBlogCategoriesApi.getList.key,
          endpoint: platformBlogCategoriesApi.getList.endpoint,
          method: platformBlogCategoriesApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "name",
                accessorKey: "name",
                header: "Category & Slug",
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                      /{row.original.slug}
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
            component: BlogCategoryForm,
            displayMode: "sheet",
            label: "Add Category",
            modalTitle: "Add Blog Category",
            modalDescription: "Create a new platform-wide blog category.",
          },
          edit: {
            component: BlogCategoryForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: platformBlogCategoriesApi.delete.endpoint,
              method: platformBlogCategoriesApi.delete.method,
              key: platformBlogCategoriesApi.delete.key,
            },
            confirmation: {
              title: "Delete Category",
              message: "Are you sure you want to delete this category?",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
          },
        }}
        filterConfig={{ schema: categoryFilterSchema }}
        showPagination={true}
      />
    </div>
  );
}
