"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformBlogCategoriesApi } from "@/lib/api/platform-blog-categories";
import { clientFetch } from "@/lib/client-fetch";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { IconPicker } from "@/components/icons/IconPicker";
import { Label } from "@/components/ui/label";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { PlatformBlogCategory } from "./types";
import { revalidateCache } from "@/actions/cache-actions";
import { GenerationDialog } from "@/components/generation/GenerationSheet";

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
        uploadMode: "public",
      }),
    ),
  icon: z.string().optional().describe(
    JSON.stringify({
      label: "Category Icon",
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
  content: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Pillar Content",
        inputType: "markdown",
        placeholder: "Write extended markdown content about this category...",
      })
    ),
  faq: z
    .array(
      z.object({
        question: z.string().describe(JSON.stringify({ label: "Question" })),
        answer: z.string().describe(JSON.stringify({ label: "Answer", inputType: "textarea" })),
      })
    )
    .optional()
    .describe(
      JSON.stringify({
        label: "Frequently Asked Questions (FAQ)",
        inputType: "array",
        singularLabel: "FAQ Item",
        sortable: true,
      })
    ),
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

interface GeneratedData {
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  content: string;
  faq: Array<{ question: string; answer: string }>;
}

export function BlogCategoryForm({
  data,
  onSuccess,
}: OperationComponentProps<PlatformBlogCategory>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);
  const [generating, setGenerating] = useState(false);
  const [showGenerateSheet, setShowGenerateSheet] = useState(false);

  const mutation = useApiMutation<
    PlatformBlogCategory,
    CategoryFormData & { id?: string }
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? platformBlogCategoriesApi.update.endpoint({ id: data!.id })
      : platformBlogCategoriesApi.create.endpoint,
    revalidateTags: [platformBlogCategoriesApi.getList.key],
    revalidateNextTags: ["landing"],
    revalidatePaths: ["/", "/categories", "/blog"],
  });

  const generateMutation = useApiMutation<{ data: GeneratedData }, { name: string; additionalInstructions?: string | null; templateId?: string }>({
    endpoint: platformBlogCategoriesApi.generate.endpoint,
    method: "POST",
  });

  const handleGenerateWithAI = () => {
    setShowGenerateSheet(true);
  };

  const handleGenerateSubmit = async (
    name: string,
    additionalInstructions?: string,
    templateId?: string
  ) => {
    setGenerating(true);
    try {
      const result = await generateMutation.mutateAsync({
        name,
        additionalInstructions: additionalInstructions || null,
        templateId: templateId || undefined,
      });

      const generated = result.data;
      const form = formRef.current;
      if (form) {
        form.setFieldValue("slug", generated.slug);
        form.setFieldValue("description", generated.description);
        form.setFieldValue("metaTitle", generated.metaTitle);
        form.setFieldValue("metaDescription", generated.metaDescription);
        form.setFieldValue("metaKeywords", generated.metaKeywords);
        form.setFieldValue("content", generated.content);
        form.setFieldValue("faq", generated.faq);
      }

      toast.success("AI generated fields filled in!");
      setShowGenerateSheet(false);
    } catch (error: any) {
      if (error?.error?.cacheKey) {
        toast.error(
          `AI generation failed to parse. Response saved for review.`,
          {
            description: `Cache Key: ${error.error.cacheKey}`,
          }
        );
      } else {
        toast.error(
          error instanceof Error ? error.message : "AI generation failed",
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (values: CategoryFormData) => {
    try {
      await mutation.mutateAsync(values as CategoryFormData & { id?: string });

      const paths = [
        "/",
        "/categories",
        `/categories/${values.slug}`,
        "/blog",
        "/rss.xml",
        "/sitemap.xml",
        "/llms.txt",
      ];
      if (isEdit && data?.slug && data.slug !== values.slug) {
        paths.push(`/categories/${data.slug}`);
      }
      await revalidateCache({ tags: ["landing"], paths });

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
            icon: data.icon || "",
            imageFileId: data.imageFileId || "",
            metaTitle: data.metaTitle || "",
            metaDescription: data.metaDescription || "",
            metaKeywords: data.metaKeywords || "",
            content: data.content || "",
            faq: data.faq || [],
            status: data.status,
          }
          : {
            status: "active",
            icon: "LayoutGrid",
            faq: [],
          }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Category" : "Create Category"}
      isLoading={mutation.isPending}
      renderActions={({ canSubmit, isSubmitting }) => (
        <>
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
              {isEdit ? "Update Category" : "Create Category"}
            </Button>
          </div>

          <GenerationDialog
            open={showGenerateSheet}
            onOpenChange={setShowGenerateSheet}
            onGenerate={handleGenerateSubmit}
            moduleType="blog_category"
            initialTitle={formRef.current?.state.values.name as string || ""}
            isLoading={generating}
            titleLabel="Category Name"
            titlePlaceholder="e.g., Technology News"
            instructionsPlaceholder="e.g., Emphasize latest trends, include industry examples..."
          />
        </>
      )}
    />
  );
}
