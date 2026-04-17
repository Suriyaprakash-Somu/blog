"use client";

import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformPromptsApi } from "@/lib/api/prompts-api";
import { PromptForm } from "@/modules/platform/prompts/PromptForm";
import type { PlatformPrompt } from "@/modules/platform/prompts/types";
import { PageShell } from "@/components/layout/PageShell";
import { format } from "date-fns";

const promptsFilterSchema = z.object({
  name: z.string().optional().describe("Version Name"),
  module: z
    .enum(["prompt_blog_post", "prompt_blog_category", "prompt_blog_tag", "prompt_rss_topic"])
    .optional()
    .describe("Module"),
});

export default function PromptsPage() {
  return (
    <PageShell>
      <div className="space-y-6">
        <DataTable<PlatformPrompt>
          tag={platformPromptsApi.getList.key}
          title="Prompts"
          moduleKey="platform.prompts"
          organizationRequired={false}
          fetchData={{
            key: platformPromptsApi.getList.key,
            endpoint: platformPromptsApi.getList.endpoint,
            method: platformPromptsApi.getList.method,
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
                    const label = module.replace("prompt_", "").replace("_", " ");
                    return (
                      <Badge variant="outline" className="capitalize">
                        {label}
                      </Badge>
                    );
                  },
                },
                {
                  id: "version",
                  accessorKey: "version",
                  header: "Version",
                  cell: ({ row }) => (
                    <Badge variant="secondary">v{row.original.version}</Badge>
                  ),
                },
                {
                  id: "name",
                  accessorKey: "name",
                  header: "Name",
                  cell: ({ row }) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{row.original.name}</span>
                      {row.original.isActive && (
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          Currently Active
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  id: "status",
                  header: "Status",
                  cell: ({ row }) =>
                    row.original.isActive ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="ghost" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    ),
                },
                {
                  id: "updatedAt",
                  accessorKey: "updatedAt",
                  header: "Last Updated",
                  cell: ({ row }) => (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(row.original.updatedAt), "MMM d, yyyy")}
                    </span>
                  ),
                },
              ],
            },
          ]}
          operations={{
            add: {
              component: PromptForm,
              displayMode: "sheet",
              label: "Create Version",
              modalTitle: "New Prompt Version",
              modalDescription: "Create a new version of a system prompt.",
            },
            edit: {
              component: PromptForm,
              displayMode: "sheet",
              label: "Clone & Edit",
            },
            complete: {
              label: "Activate",
              api: {
                endpoint: platformPromptsApi.activate.endpoint,
                method: platformPromptsApi.activate.method,
                key: platformPromptsApi.activate.key,
              },
              confirmation: {
                title: "Activate Prompt",
                message: "Are you sure you want to make this version active? The current active version for this module will be deactivated.",
                confirmText: "Activate",
                cancelText: "Cancel",
              },
              isVisible: (data) => !data.isActive,
            },
            delete: {
              api: {
                endpoint: platformPromptsApi.delete.endpoint,
                method: platformPromptsApi.delete.method,
                key: platformPromptsApi.delete.key,
              },
              confirmation: {
                title: "Delete Prompt",
                message: "Are you sure you want to delete this prompt version? This is a soft delete.",
                confirmText: "Delete",
                cancelText: "Cancel",
              },
              isVisible: (data) => !data.isActive,
            },
          }}
          filterConfig={{ schema: promptsFilterSchema }}
          showPagination={true}
        />
      </div>
    </PageShell>
  );
}
