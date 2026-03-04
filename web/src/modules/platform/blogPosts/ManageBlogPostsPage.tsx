"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformBlogPostsApi } from "@/lib/api/platform-blog-posts";
import { BlogPostForm } from "./BlogPostForm";
import type { PlatformBlogPost } from "./types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { generateDraftFromRss } from "@/lib/api/automation";
import { toast } from "sonner";

const postFilterSchema = z.object({
  title: z.string().optional().describe("Title"),
  slug: z.string().optional().describe("Slug"),
  status: z
    .enum(["draft", "published", "archived"])
    .optional()
    .describe("Status"),
});

export function ManageBlogPostsPage() {
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Posts"
        description="Create and manage blog posts across the platform."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                const toastId = toast.loading("Generating draft post from RSS...");
                try {
                  const result = await generateDraftFromRss();
                  console.log("[RSS Generate] Response:", result);
                  if (result?.success) {
                    toast.success(result.title ? `Draft generated: ${result.title}` : "Draft generated successfully!", { id: toastId });
                    // Revalidate the table data
                    queryClient.invalidateQueries({ queryKey: [platformBlogPostsApi.getList.key] });
                  } else {
                    toast.error(result?.message || "Failed to generate draft", { id: toastId });
                  }
                } catch (err: any) {
                  console.error("[RSS Generate] Error:", err);
                  toast.error(err?.message || "Generation failed", { id: toastId });
                }
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate from RSS
            </Button>
          </div>
        }
      />

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
