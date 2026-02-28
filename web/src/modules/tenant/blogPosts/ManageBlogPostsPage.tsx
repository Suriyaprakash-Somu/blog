"use client";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { tenantBlogPostsApi } from "@/lib/api/tenant-blog-posts";
import { BlogPostForm } from "./BlogPostForm";
import type { PlatformBlogPost as TenantBlogPost } from "./types";
import { PageHeader } from "@/components/layout/PageHeader";

const postFilterSchema = z.object({
  title: z.string().optional().describe("Title"),
  slug: z.string().optional().describe("Slug"),
  status: z
    .enum(["draft", "archived"])
    .optional()
    .describe("Status"),
});

export function ManageBlogPostsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Posts"
        description="Create and manage blog posts across the platform."
      />

      <DataTable<TenantBlogPost>
        tag={tenantBlogPostsApi.getList.key}
        title="Posts"
        moduleKey="tenant.blogPosts"
        organizationRequired={false}
        fetchData={{
          key: tenantBlogPostsApi.getList.key,
          endpoint: tenantBlogPostsApi.getList.endpoint,
          method: tenantBlogPostsApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "title",
                accessorKey: "title",
                header: "Title & Slug",
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium">{row.original.title}</div>
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
                cell: ({ row }) => {
                  const status = row.original.status;
                  const variant =
                    status === "published"
                      ? "default"
                      : status === "draft"
                        ? "outline"
                        : "secondary";
                  return (
                    <Badge variant={variant}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  );
                },
              },
              {
                id: "readTime",
                accessorKey: "readTimeMinutes",
                header: "Read Time",
                cell: ({ row }) => (
                  <span className="text-xs text-muted-foreground">
                    {row.original.readTimeMinutes ?? 0} min
                  </span>
                ),
              },
              {
                id: "isFeatured",
                accessorKey: "isFeatured",
                header: "Featured",
                cell: ({ row }) =>
                  row.original.isFeatured ? (
                    <Badge variant="default">Featured</Badge>
                  ) : null,
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
            component: BlogPostForm,
            displayMode: "sheet",
            label: "Add Post",
            modalTitle: "Add Blog Post",
            modalDescription: "Create a new blog post.",
          },
          edit: {
            component: BlogPostForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: tenantBlogPostsApi.delete.endpoint,
              method: tenantBlogPostsApi.delete.method,
              key: tenantBlogPostsApi.delete.key,
              revalidateNextTags: ["landing"],
              revalidatePaths: ["/", "/blog"],
            },
            confirmation: {
              title: "Delete Post",
              message: "Are you sure you want to delete this post?",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
          },
        }}
        filterConfig={{ schema: postFilterSchema }}
        showPagination={true}
      />
    </div>
  );
}
