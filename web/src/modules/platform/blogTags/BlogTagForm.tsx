"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformBlogTagsApi } from "@/lib/api/platform-blog-tags";
import { clientFetch } from "@/lib/client-fetch";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { PlatformBlogTag } from "./types";
import { revalidateCache } from "@/actions/cache-actions";

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
        uploadMode: "public",
      }),
    ),
  icon: z.string().optional().describe(
    JSON.stringify({
      label: "Tag Icon",
      inputType: "icon-picker",
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

interface GeneratedData {
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

export function BlogTagForm({
  data,
  onSuccess,
}: OperationComponentProps<PlatformBlogTag>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);
  const [generating, setGenerating] = useState(false);

  const mutation = useApiMutation<
    PlatformBlogTag,
    TagFormData & { id?: string }
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? platformBlogTagsApi.update.endpoint({ id: data!.id })
      : platformBlogTagsApi.create.endpoint,
    revalidateTags: [platformBlogTagsApi.getList.key],
    revalidateNextTags: ["landing"],
    revalidatePaths: ["/", "/tags", "/blog"],
  });

  const generateMutation = useApiMutation<{ data: GeneratedData }, { name: string }>({
    endpoint: platformBlogTagsApi.generate.endpoint,
    method: "POST",
  });

  const handleGenerateWithAI = async () => {
    const form = formRef.current;
    if (!form) return;

    const name = form.state.values.name as string | undefined;
    if (!name || name.length < 2) {
      toast.error("Enter a tag name first");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({ name });

      const generated = result.data;
      form.setFieldValue("slug", generated.slug);
      form.setFieldValue("description", generated.description);
      form.setFieldValue("metaTitle", generated.metaTitle);
      form.setFieldValue("metaDescription", generated.metaDescription);
      form.setFieldValue("metaKeywords", generated.metaKeywords);

      toast.success("AI generated fields filled in!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "AI generation failed. Check LLM settings.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (values: TagFormData) => {
    try {
      await mutation.mutateAsync(values as TagFormData & { id?: string });

      const paths = ["/", "/tags", `/tags/${values.slug}`, "/blog"];
      if (isEdit && data?.slug && data.slug !== values.slug) {
        paths.push(`/tags/${data.slug}`);
      }
      await revalidateCache({ tags: ["landing"], paths });

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
            icon: data.icon || "",
            imageFileId: data.imageFileId || "",
            metaTitle: data.metaTitle || "",
            metaDescription: data.metaDescription || "",
            metaKeywords: data.metaKeywords || "",
            status: data.status,
          }
          : {
            status: "active",
            icon: "",
          }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Tag" : "Create Tag"}
      isLoading={mutation.isPending}
      renderActions={({ canSubmit, isSubmitting }) => (
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={generating}
            onClick={handleGenerateWithAI}
          >
            {generating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-4 w-4" />
            )}
            {generating ? "Generating..." : "Generate with AI"}
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Update Tag" : "Create Tag"}
          </Button>
        </div>
      )}
    />
  );
}
