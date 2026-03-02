"use client";

import { z } from "zod";
import { DataTable } from "@/components/dataTable/DataTable";
import { platformNewsletterApi } from "@/lib/api/platform-newsletter";
import { format } from "date-fns";

const filterSchema = z.object({
    // Adding a simple filter schema even if filtering isn't heavily used right away
});

export type WaitlistSubscriber = {
    id: string;
    email: string;
    createdAt: string;
};

export function NewsletterWaitlistPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Newsletter Waitlist</h1>
                <p className="text-muted-foreground mt-2">
                    View all users who have subscribed to the newsletter waitlist
                </p>
            </div>

            <DataTable<WaitlistSubscriber>
                tag={platformNewsletterApi.getList.key}
                title="Subscribers"
                moduleKey="platform.newsletter"
                fetchData={{
                    key: platformNewsletterApi.getList.key,
                    endpoint: platformNewsletterApi.getList.endpoint,
                    method: platformNewsletterApi.getList.method,
                }}
                columnsConfig={[
                    {
                        id: "main",
                        columns: [
                            {
                                id: "email",
                                accessorKey: "email",
                                header: "Email",
                            },
                            {
                                id: "createdAt",
                                accessorKey: "createdAt",
                                header: "Subscribed On",
                                cell: ({ row }) => {
                                    return format(new Date(row.original.createdAt), "MMM d, yyyy HH:mm");
                                },
                            },
                        ],
                    },
                ]}
                filterConfig={{
                    schema: filterSchema,
                }}
                showPagination={true}
                organizationRequired={false}
            />
        </div>
    );
}
