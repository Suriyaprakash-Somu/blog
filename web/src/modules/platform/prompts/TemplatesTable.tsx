"use client";

import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformPromptsApi } from "@/lib/api/prompts-api";
import { TemplateForm } from "./TemplateForm";
import type { PromptTemplate } from "./types";
import { format } from "date-fns";

const templatesFilterSchema = z.object({
  module: z
    .enum(["prompt_blog_post", "prompt_blog_category", "prompt_blog_tag", "prompt_rss_topic"])
    .optional(),
  isDefault: z.boolean().optional(),
});

export function TemplatesTable() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <DataTable<any>
      key={refreshKey}
      tag="platform-prompts-templates"
      title="Generation Templates"
      moduleKey="platform.prompts"
      organizationRequired={false}
      fetchData={{
        key: "platform-prompts-templates",
        endpoint: "/api/platform/prompts/templates",
        method: "GET",
      }}
      columnsConfig={[
        {
          id: "main",
          columns: [
            {
              id: "module",
              accessorKey: "module",
              header: "Module",
              cell: ({ row }) => {
                const module = row.original.module;
                const label = module.replace("prompt_", "").replace(/_/g, " ");
                return (
                  <Badge variant="outline" className="capitalize">
                    {label}
                  </Badge>
                );
              },
            },
            {
              id: "name",
              accessorKey: "name",
              header: "Template Name",
              cell: ({ row }) => (
                <div className="flex flex-col">
                  <span className="font-medium">{row.original.name || "Unnamed"}</span>
                  {row.original.isDefault && (
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                      Default Template
                    </span>
                  )}
                </div>
              ),
            },
            {
              id: "defaultInstructions",
              accessorKey: "defaultInstructions",
              header: "Default Instructions",
              cell: ({ row }) => (
                <span className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                  {row.original.defaultInstructions || "—"}
                </span>
              ),
            },
            {
              id: "status",
              header: "Status",
              cell: ({ row }) =>
                row.original.isDefault ? (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    Default
                  </Badge>
                ) : (
                  <Badge variant="ghost" className="text-muted-foreground">
                    Active
                  </Badge>
                ),
            },
            {
              id: "createdAt",
              accessorKey: "createdAt",
              header: "Created",
              cell: ({ row }) => (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(row.original.createdAt), "MMM d, yyyy")}
                </span>
              ),
            },
          ],
        },
      ]}
      operations={{
        add: {
          component: TemplateForm,
          displayMode: "sheet",
          label: "Create Template",
          modalTitle: "Create Generation Template",
          modalDescription: "Create a new template with default instructions.",
        },
        edit: {
          component: TemplateForm,
          displayMode: "sheet",
          label: "Edit",
        },
        complete: {
          label: "Set as Default",
          api: {
            endpoint: "/api/platform/prompts/templates/:id/set-default",
            method: "PUT",
            key: "platform-prompts-set-default",
          },
          confirmation: {
            title: "Set as Default Template",
            message: "Are you sure you want to make this the default template for this module? The current default will be unset.",
            confirmText: "Set as Default",
            cancelText: "Cancel",
          },
          isVisible: (data) => !data.isDefault,
        },
        delete: {
          api: {
            endpoint: "/api/platform/prompts/templates/:id",
            method: "DELETE",
            key: "platform-prompts-delete",
          },
          confirmation: {
            title: "Delete Template",
            message: "Are you sure you want to delete this template? This is a soft delete.",
            confirmText: "Delete",
            cancelText: "Cancel",
          },
          isVisible: (data) => !data.isDefault,
        },
      }}
      filterConfig={{ schema: templatesFilterSchema }}
      showPagination={true}
    />
  );
}
