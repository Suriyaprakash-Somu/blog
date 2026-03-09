"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformAutomationApi, syncRssFeeds } from "@/lib/api/automation";
import { RssSourceForm } from "./RssSourceForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { RefreshCw, Rss } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function ManageRssSourcesPage() {
    const syncMutation = useApiMutation<{ success: boolean; message: string }, any>({
        endpoint: platformAutomationApi.sync.endpoint,
        method: platformAutomationApi.sync.method,
        revalidateTags: [platformAutomationApi.getList.key],
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message || "Failed to start sync");
            }
        },
        onError: () => {
            toast.error("Sync failed");
        },
    });

    const handleSync = () => {
        syncMutation.mutate({});
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="RSS Sources"
                description="Manage external RSS feeds to automatically generate blog topics and drafts."
                actions={
                    <Button variant="outline" onClick={handleSync} disabled={syncMutation.isPending}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                        Sync All Feeds
                    </Button>
                }
            />

            <DataTable
                tag={platformAutomationApi.getList.key}
                title="Sources"
                moduleKey="platform.automation"
                organizationRequired={false}
                fetchData={{
                    key: platformAutomationApi.getList.key,
                    endpoint: platformAutomationApi.getList.endpoint,
                    method: platformAutomationApi.getList.method,
                }}
                columnsConfig={[
                    {
                        id: "main",
                        columns: [
                            {
                                id: "name",
                                accessorKey: "name",
                                header: "Name",
                                cell: ({ row }: any) => (
                                    <div className="flex items-center gap-2">
                                        <Rss className="h-4 w-4 text-primary opacity-70" />
                                        <span className="font-medium">{row.original.name}</span>
                                    </div>
                                ),
                            },
                            {
                                id: "url",
                                accessorKey: "url",
                                header: "Feed URL",
                                cell: ({ row }: any) => (
                                    <span className="text-xs text-muted-foreground truncate max-w-[300px] block">
                                        {row.original.url}
                                    </span>
                                ),
                            },
                            {
                                id: "status",
                                accessorKey: "isActive",
                                header: "Status",
                                cell: ({ row }: any) => (
                                    <Badge variant={row.original.isActive ? "default" : "secondary"}>
                                        {row.original.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                ),
                            },
                            {
                                id: "lastSyncedAt",
                                accessorKey: "lastSyncedAt",
                                header: "Last Synced",
                                cell: ({ row }: any) => (
                                    <span className="text-xs text-muted-foreground">
                                        {row.original.lastSyncedAt
                                            ? new Date(row.original.lastSyncedAt).toLocaleString()
                                            : "Never"}
                                    </span>
                                ),
                            },
                        ],
                    },
                ]}
                operations={{
                    add: {
                        component: RssSourceForm,
                        displayMode: "sheet",
                        label: "Add Source",
                        modalTitle: "Add RSS Source",
                    },
                    edit: {
                        component: RssSourceForm,
                        displayMode: "sheet",
                        label: "Edit",
                    },
                    delete: {
                        api: {
                            endpoint: platformAutomationApi.delete.endpoint as unknown as string,
                            method: platformAutomationApi.delete.method,
                            key: platformAutomationApi.delete.key,
                        },
                        confirmation: {
                            title: "Delete Source",
                            message: "Are you sure you want to delete this RSS source?",
                        },
                    },
                }}
            />
        </div>
    );
}
