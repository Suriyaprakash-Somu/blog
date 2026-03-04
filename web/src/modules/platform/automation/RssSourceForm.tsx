"use client";

import { z } from "zod";
import { SchemaForm } from "@/components/form/SchemaForm";
import { platformAutomationApi } from "@/lib/api/automation";

const rssSourceSchema = z.object({
    name: z.string().min(1, "Name is required").describe("Name"),
    url: z.string().url("Invalid RSS URL").describe("RSS Feed URL"),
    isActive: z.boolean().default(true).describe("Active"),
});

type RssSourceFormValues = z.infer<typeof rssSourceSchema>;

interface RssSourceFormProps {
    initialValues?: Partial<RssSourceFormValues>;
    id?: string;
    onSuccess?: () => void;
}

export function RssSourceForm({ initialValues, id, onSuccess }: RssSourceFormProps) {
    return (
        <SchemaForm<any>
            schema={rssSourceSchema as any}
            defaultValues={
                initialValues || {
                    name: "",
                    url: "",
                    isActive: true,
                }
            }
            onSubmit={async (values: RssSourceFormValues) => {
                if (id) {
                    await fetch(platformAutomationApi.update.endpoint({ id }), {
                        method: platformAutomationApi.update.method,
                        body: JSON.stringify(values),
                        headers: { "Content-Type": "application/json" },
                    });
                } else {
                    await fetch(platformAutomationApi.create.endpoint, {
                        method: platformAutomationApi.create.method,
                        body: JSON.stringify(values),
                        headers: { "Content-Type": "application/json" },
                    });
                }
                onSuccess?.();
            }}
            submitLabel={id ? "Update Source" : "Add Source"}
        />
    );
}
