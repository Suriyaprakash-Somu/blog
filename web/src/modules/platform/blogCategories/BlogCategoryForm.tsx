"use client";

import { useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformBlogCategoriesApi } from "@/lib/api/platform-blog-categories";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { PlatformBlogCategory } from "./types";

const categoryFormSchema = z.object({
  name: z.string().min(2, "Name is required").describe("Category Name"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .describe("URL Slug (e.g. tech-news)"),
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
        label: "Category Image",
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

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export function BlogCategoryForm({
  data,
  onSuccess,
}: OperationComponentProps<PlatformBlogCategory>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);

  const mutation = useApiMutation<
    PlatformBlogCategory,
    CategoryFormData & { id?: string }
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? platformBlogCategoriesApi.update.endpoint({ id: data!.id })
      : platformBlogCategoriesApi.create.endpoint,
    revalidateTags: [platformBlogCategoriesApi.getList.key],
  });

  const handleSubmit = async (values: CategoryFormData) => {
    try {
      await mutation.mutateAsync(values as CategoryFormData & { id?: string });
      toast.success(isEdit ? "Category updated" : "Category created");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save category",
      );
    }
  };

  return (
    <SchemaForm
      formRef={formRef}
      schema={categoryFormSchema}
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
      submitLabel={isEdit ? "Update Category" : "Create Category"}
      isLoading={mutation.isPending}
    />
  );
}
