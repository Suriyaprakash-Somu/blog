"use client";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformBlogPostsApi } from "@/lib/api/platform-blog-posts";
import { BlogPostForm } from "./BlogPostForm";
import type { PlatformBlogPost } from "./types";

const postFilterSchema = z.object({
  title: z.string().optional().describe("Title"),
  slug: z.string().optional().describe("Slug"),
  status: z
    .enum(["draft", "published", "archived"])
    .optional()
    .describe("Status"),
});

export function ManageBlogPostsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
        <p className="mt-2 text-muted-foreground">
          Create and manage blog posts across the platform.
        </p>
      </div>

      <DataTable<PlatformBlogPost>
        tag={platformBlogPostsApi.getList.key}
        title="Posts"
        moduleKey="platform.blogPosts"
        organizationRequired={false}
        fetchData={{
          key: platformBlogPostsApi.getList.key,
          endpoint: platformBlogPostsApi.getList.endpoint,
          method: platformBlogPostsApi.getList.method,
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
              endpoint: platformBlogPostsApi.delete.endpoint,
              method: platformBlogPostsApi.delete.method,
              key: platformBlogPostsApi.delete.key,
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
