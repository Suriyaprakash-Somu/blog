"use client";

import { useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformBlogTagsApi } from "@/lib/api/platform-blog-tags";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { PlatformBlogTag } from "./types";

const tagFormSchema = z.object({
  name: z.string().min(2, "Name is required").describe("Tag Name"),
  slug: z.string().min(2, "Slug is required").describe("URL Slug (e.g. tech)"),
  description: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Description",
        inputType: "textarea",
      }),
    ),
  imageFileId: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Tag Image",
        inputType: "file",
        accept: "image/jpeg,image/png,image/webp",
        minFiles: 0,
        maxFiles: 1,
      }),
    ),
  metaTitle: z.string().optional().describe("SEO Meta Title"),
  metaDescription: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "SEO Meta Description",
        inputType: "textarea",
      }),
    ),
  metaKeywords: z
    .string()
    .optional()
    .describe("SEO Meta Keywords (comma separated)"),
  status: z
    .enum(["active", "inactive"])
    .default("active")
    .describe(
      JSON.stringify({
        label: "Status",
        inputType: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      }),
    ),
});

type TagFormData = z.infer<typeof tagFormSchema>;

export function BlogTagForm({
  data,
  onSuccess,
}: OperationComponentProps<PlatformBlogTag>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);

  const mutation = useApiMutation<
    PlatformBlogTag,
    TagFormData & { id?: string }
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? platformBlogTagsApi.update.endpoint({ id: data!.id })
      : platformBlogTagsApi.create.endpoint,
    revalidateTags: [platformBlogTagsApi.getList.key],
  });

  const handleSubmit = async (values: TagFormData) => {
    try {
      await mutation.mutateAsync(values as TagFormData & { id?: string });
      toast.success(isEdit ? "Tag updated" : "Tag created");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save tag",
      );
    }
  };

  return (
    <SchemaForm
      formRef={formRef}
      schema={tagFormSchema}
      defaultValues={
        data
          ? {
              name: data.name,
              slug: data.slug,
              description: data.description || "",
              imageFileId: data.imageFileId || "",
              metaTitle: data.metaTitle || "",
              metaDescription: data.metaDescription || "",
              metaKeywords: data.metaKeywords || "",
              status: data.status,
            }
          : {
              status: "active",
            }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Tag" : "Create Tag"}
      isLoading={mutation.isPending}
    />
  );
}
