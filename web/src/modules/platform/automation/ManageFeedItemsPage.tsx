"use client";

import { useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/dataTable/DataTable";
import { PageHeader } from "@/components/layout/PageHeader";
import { clientFetch } from "@/lib/client-fetch";
import { getQueryClient } from "@/lib/queryClient";
import { buttonVariants } from "@/components/ui/button";
import { ExternalLink, FileText, ShieldAlert, ShieldCheck } from "lucide-react";

export interface FeedItemRow {
  id: string;
  sourceId: string;
  guid: string;
  url: string;
  title: string;
  description: string | null;
  author: string | null;
  publishedAt: string | null;
  processingStatus: "unprocessed" | "ignored" | "processed" | "failed";
  processingError: string | null;
  createdAt: string;
  [key: string]: unknown;
}

const TAG = "platform-feed-items" as const;

function statusBadge(status: FeedItemRow["processingStatus"]) {
  switch (status) {
    case "unprocessed":
      return <Badge variant="outline">Unprocessed</Badge>;
    case "ignored":
      return <Badge variant="secondary">Ignored</Badge>;
    case "processed":
      return <Badge variant="default">Processed</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
  }
}

export function ManageFeedItemsPage() {
  const invalidate = useCallback(async () => {
    const qc = getQueryClient();
    await qc.invalidateQueries({ queryKey: [TAG], exact: false });
  }, []);

  const ignore = useCallback(
    async (row?: FeedItemRow) => {
      if (!row) return;
      await clientFetch(`/api/platform/automation/feed-items/${row.id}/ignore`, {
        method: "POST",
        body: {},
      });
      toast.success("Item ignored");
      await invalidate();
    },
    [invalidate],
  );

  const unignore = useCallback(
    async (row?: FeedItemRow) => {
      if (!row) return;
      await clientFetch(`/api/platform/automation/feed-items/${row.id}/unignore`, {
        method: "POST",
        body: {},
      });
      toast.success("Item restored to unprocessed");
      await invalidate();
    },
    [invalidate],
  );

  const generate = useCallback(
    async (row?: FeedItemRow) => {
      if (!row) return;
      await clientFetch(`/api/platform/automation/feed-items/${row.id}/generate`, {
        method: "POST",
        body: {},
      });
      toast.success("Draft generation started");
      await invalidate();
    },
    [invalidate],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="RSS Items"
        description="Browse synced RSS feed items and manually ignore/unignore or generate drafts."
        actions={
          <Link
            href="/platform/automation/rss-sources"
            className={buttonVariants({ variant: "outline" })}
          >
            Manage Sources
          </Link>
        }
      />

      <DataTable<FeedItemRow>
        tag={TAG}
        title="Feed Items"
        moduleKey="platform.feedItems"
        organizationRequired={false}
        fetchData={{
          key: TAG,
          endpoint: "/api/platform/automation/feed-items",
          method: "GET",
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "title",
                accessorKey: "title",
                header: "Title",
                cell: ({ row }: any) => (
                  <div className="space-y-1">
                    <div className="font-medium line-clamp-2">{row.original.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <a
                        href={row.original.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        Open
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {row.original.author ? <span>by {row.original.author}</span> : null}
                    </div>
                  </div>
                ),
              },
              {
                id: "status",
                accessorKey: "processingStatus",
                header: "Status",
                cell: ({ row }: any) => statusBadge(row.original.processingStatus),
              },
              {
                id: "publishedAt",
                accessorKey: "publishedAt",
                header: "Published",
                cell: ({ row }: any) => (
                  <span className="text-xs text-muted-foreground">
                    {row.original.publishedAt
                      ? new Date(row.original.publishedAt).toLocaleString()
                      : "—"}
                  </span>
                ),
              },
              {
                id: "createdAt",
                accessorKey: "createdAt",
                header: "Synced",
                cell: ({ row }: any) => (
                  <span className="text-xs text-muted-foreground">
                    {row.original.createdAt
                      ? new Date(row.original.createdAt).toLocaleString()
                      : "—"}
                  </span>
                ),
              },
              {
                id: "error",
                accessorKey: "processingError",
                header: "Error",
                cell: ({ row }: any) =>
                  row.original.processingError ? (
                    <span className="text-xs text-destructive line-clamp-2">
                      {row.original.processingError}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  ),
              },
            ],
          },
        ]}
        operations={{
          generate: {
            label: "Generate Draft",
            icon: <FileText className="h-4 w-4" />,
            handler: generate,
            confirmation: {
              title: "Generate Draft",
              message: "Generate a draft blog post from this RSS item?",
              confirmText: "Generate",
              cancelText: "Cancel",
            },
            isVisible: (row) => row.processingStatus !== "processed",
          },
          ignore: {
            label: "Ignore",
            icon: <ShieldAlert className="h-4 w-4" />,
            handler: ignore,
            confirmation: {
              title: "Ignore Item",
              message: "Mark this RSS item as ignored? It will still appear in Telegram /topics.",
              confirmText: "Ignore",
              cancelText: "Cancel",
            },
            isVisible: (row) => row.processingStatus !== "ignored" && row.processingStatus !== "processed",
          },
          unignore: {
            label: "Unignore",
            icon: <ShieldCheck className="h-4 w-4" />,
            handler: unignore,
            confirmation: {
              title: "Unignore Item",
              message: "Move this RSS item back to unprocessed?",
              confirmText: "Unignore",
              cancelText: "Cancel",
            },
            isVisible: (row) => row.processingStatus === "ignored",
          },
        }}
      />
    </div>
  );
}
