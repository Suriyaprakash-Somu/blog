"use client";

import { z } from "zod";
import { useApiMutation } from "@/hooks/useApiMutation";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type RssSource, platformAutomationApi } from "@/lib/api/automation";

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
    const isEdit = !!id;

    const mutation = useApiMutation<RssSource, RssSourceFormValues>({
        method: isEdit ? "PATCH" : "POST",
        endpoint: isEdit
            ? platformAutomationApi.update.endpoint({ id })
            : platformAutomationApi.create.endpoint,
        revalidateTags: [platformAutomationApi.getList.key],
        onSuccess: () => {
            onSuccess?.();
        },
    });

    const handleSubmit = async (values: RssSourceFormValues) => {
        try {
            await mutation.mutateAsync(values);
        } catch (error) {
            // Error handling is managed by SchemaForm or toast if needed
            // useApiMutation results in an error being thrown if it fails
        }
    };

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
            onSubmit={handleSubmit}
            submitLabel={id ? "Update Source" : "Add Source"}
            isLoading={mutation.isPending}
        />
    );
}
