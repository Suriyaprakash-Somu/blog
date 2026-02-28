"use client";

import { useRef, useState, useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { tenantBlogPostsApi } from "@/lib/api/tenant-blog-posts";
import { platformBlogCategoriesApi } from "@/lib/api/platform-blog-categories";
import { platformBlogTagsApi } from "@/lib/api/platform-blog-tags";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { PlatformBlogPost as TenantBlogPost } from "./types";
import type { PlatformBlogCategory } from "@/modules/platform/blogCategories/types";
import type { PlatformBlogTag } from "@/modules/platform/blogTags/types";
import { revalidateCache } from "@/actions/cache-actions";

const baseSchema = z.object({
  title: z.string().min(2, "Title is required").describe("Post Title"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .describe("URL Slug (e.g. how-to-learn-react)"),
  excerpt: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Excerpt",
        inputType: "textarea",
      }),
    ),
  content: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Content",
        inputType: "markdown",
      }),
    ),
  status: z
    .enum(["draft", "archived"])
    .default("draft")
    .describe(
      JSON.stringify({
        label: "Status",
        inputType: "select",
        options: [
          { value: "draft", label: "Draft" },
          { value: "archived", label: "Archived" },
        ],
      }),
    ),
  isFeatured: z
    .boolean()
    .default(false)
    .describe(
      JSON.stringify({
        label: "Featured Post",
        inputType: "switch",
      }),
    ),
  featuredImageFileId: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Featured / OG Image",
        inputType: "file",
        accept: "image/jpeg,image/png,image/webp",
        minFiles: 0,
        maxFiles: 1,
        uploadMode: "public",
      }),
    ),
  faq: z
    .array(
      z.object({
        question: z.string().describe("Question"),
        answer: z.string().describe("Answer"),
      }),
    )
    .optional()
    .describe(
      JSON.stringify({
        label: "FAQ (SEO Rich Snippets)",
        inputType: "array",
        singularLabel: "FAQ Item",
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
});

type PostFormData = z.infer<typeof baseSchema> & {
  categoryId?: string;
  secondaryCategoryIds?: string[];
  tagIds?: string[];
};

export function BlogPostForm({
  data,
  onSuccess,
}: OperationComponentProps<
  TenantBlogPost & { tagIds?: string[]; secondaryCategoryIds?: string[] }
>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);

  const { data: categoriesData } = useApiQuery<{ id: string; name: string }[]>({
    ...platformBlogCategoriesApi.options,
    requireOrganization: false,
  });
  const { data: tagsData } = useApiQuery<{ id: string; name: string }[]>({
    ...platformBlogTagsApi.options,
    requireOrganization: false,
  });

  const categoryOptions = useMemo(
    () => categoriesData?.map((c) => ({ label: c.name, value: c.id })) || [],
    [categoriesData],
  );

  const tagOptions = useMemo(
    () => tagsData?.map((t) => ({ label: t.name, value: t.id })) || [],
    [tagsData],
  );

  const schema = useMemo(() => {
    return baseSchema.extend({
      categoryId: z
        .string()
        .optional()
        .describe(
          JSON.stringify({
            label: "Primary Category",
            inputType: "select",
            options: categoryOptions,
          }),
        ),
      secondaryCategoryIds: z
        .array(z.string())
        .optional()
        .describe(
          JSON.stringify({
            label: "Secondary Categories",
            inputType: "multiselect",
            options: categoryOptions,
          }),
        ),
      tagIds: z
        .array(z.string())
        .optional()
        .describe(
          JSON.stringify({
            label: "Tags",
            inputType: "multiselect",
            options: tagOptions,
          }),
        ),
    });
  }, [categoryOptions, tagOptions]);

  const mutation = useApiMutation<
    TenantBlogPost,
    PostFormData & { id?: string }
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? tenantBlogPostsApi.update.endpoint({ id: data!.id })
      : tenantBlogPostsApi.create.endpoint,
    revalidateTags: [tenantBlogPostsApi.getList.key],
    revalidateNextTags: ["landing"],
    revalidatePaths: ["/", "/blog", "/categories", "/tags"],
  });

  const handleSubmit = async (values: PostFormData) => {
    try {
      await mutation.mutateAsync(values as PostFormData & { id?: string });

      // Also revalidate detail pages that depend on slug.
      const paths = ["/", "/blog", `/blog/${values.slug}`];
      if (isEdit && data?.slug && data.slug !== values.slug) {
        paths.push(`/blog/${data.slug}`);
      }
      await revalidateCache({ tags: ["landing"], paths });

      toast.success(isEdit ? "Post updated" : "Post created");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save post",
      );
    }
  };

  return (
    <SchemaForm
      formRef={formRef}
      schema={schema}
      defaultValues={
        data
          ? {
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt || "",
            content: data.content || "",
            status: data.status === "published" ? "draft" : data.status,
            categoryId: data.categoryId || "",
            secondaryCategoryIds: data.secondaryCategoryIds || [],
            tagIds: data.tagIds || [],
            isFeatured: data.isFeatured,
            featuredImageFileId: data.featuredImageFileId || "",
            faq: data.faq || [],
            metaTitle: data.metaTitle || "",
            metaDescription: data.metaDescription || "",
            metaKeywords: data.metaKeywords || "",
          }
          : {
            status: "draft",
            isFeatured: false,
            faq: [],
          }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Post" : "Create Post"}
      isLoading={mutation.isPending}
      renderActions={({ canSubmit, isSubmitting }) => (
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-end gap-3">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Update Post" : "Create Post"}
            </Button>
          </div>
        </div>
      )}
    />
  );
}
