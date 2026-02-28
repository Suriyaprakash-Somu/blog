"use client";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformFeaturedCollectionsApi } from "@/lib/api/platform-featured-collections";
import { FeaturedCollectionForm } from "./FeaturedCollectionForm";
import type { PlatformFeaturedCollection } from "./types";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const collectionFilterSchema = z.object({
  name: z.string().optional().describe("Name"),
  slug: z.string().optional().describe("Slug"),
});

export function ManageFeaturedCollectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Featured Collections
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage curated content zones to showcase on the platform frontend.
        </p>
      </div>

      <DataTable<PlatformFeaturedCollection>
        tag={platformFeaturedCollectionsApi.getList.key}
        title="Collections"
        moduleKey="platform.featuredCollections"
        organizationRequired={false}
        fetchData={{
          key: platformFeaturedCollectionsApi.getList.key,
          endpoint: platformFeaturedCollectionsApi.getList.endpoint,
          method: platformFeaturedCollectionsApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "name",
                accessorKey: "name",
                header: "Collection",
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                      {row.original.description || "No description provided"}
                    </div>
                  </div>
                ),
              },
              {
                id: "slug",
                accessorKey: "slug",
                header: "Usage Slug",
                cell: ({ row }) => (
                  <div className="flex items-center space-x-2">
                    <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                      {row.original.slug}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(row.original.slug);
                        toast.success("Copied to clipboard");
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy slug"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ),
              },
              {
                id: "isActive",
                accessorKey: "isActive",
                header: "Status",
                cell: ({ row }) => (
                  <Badge
                    variant={row.original.isActive ? "default" : "secondary"}
                  >
                    {row.original.isActive ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
              {
                id: "updatedAt",
                accessorKey: "updatedAt",
                header: "Last Updated",
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
            component: FeaturedCollectionForm,
            displayMode: "sheet",
            label: "Create Collection",
            modalTitle: "Create Featured Collection",
            modalDescription: "Define a new zone for curated content.",
          },
          edit: {
            component: FeaturedCollectionForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: platformFeaturedCollectionsApi.delete.endpoint,
              method: platformFeaturedCollectionsApi.delete.method,
              key: platformFeaturedCollectionsApi.delete.key,
              revalidateNextTags: ["landing"],
              revalidatePaths: ["/"],
            },
            confirmation: {
              title: "Delete Collection",
              message:
                "Are you sure you want to delete this collection? This will also remove all featured items associated with it.",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
          },
        }}
        filterConfig={{ schema: collectionFilterSchema }}
        showPagination={true}
      />
    </div>
  );
}
