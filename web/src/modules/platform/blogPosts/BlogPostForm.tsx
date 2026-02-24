"use client";

import { useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformBlogPostsApi } from "@/lib/api/platform-blog-posts";
import { clientFetch } from "@/lib/client-fetch";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { PlatformBlogPost } from "./types";

const postFormSchema = z.object({
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
    .enum(["draft", "published", "archived"])
    .default("draft")
    .describe(
      JSON.stringify({
        label: "Status",
        inputType: "select",
        options: [
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
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

type PostFormData = z.infer<typeof postFormSchema>;

interface GeneratedData {
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  faq: { question: string; answer: string }[];
}

export function BlogPostForm({
  data,
  onSuccess,
}: OperationComponentProps<PlatformBlogPost>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);
  const [generating, setGenerating] = useState(false);

  const mutation = useApiMutation<
    PlatformBlogPost,
    PostFormData & { id?: string }
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? platformBlogPostsApi.update.endpoint({ id: data!.id })
      : platformBlogPostsApi.create.endpoint,
    revalidateTags: [platformBlogPostsApi.getList.key],
  });

  const handleGenerateWithAI = async () => {
    const form = formRef.current;
    if (!form) return;

    const title = form.state.values.title as string | undefined;
    if (!title || title.length < 2) {
      toast.error("Enter a post title first");
      return;
    }

    setGenerating(true);
    try {
      const result = await clientFetch<{ data: GeneratedData }>(
        platformBlogPostsApi.generate.endpoint,
        {
          method: "POST",
          body: { title },
        },
      );

      const generated = result.data;
      form.setFieldValue("slug", generated.slug);
      form.setFieldValue("excerpt", generated.excerpt);
      form.setFieldValue("content", generated.content);
      form.setFieldValue("metaTitle", generated.metaTitle);
      form.setFieldValue("metaDescription", generated.metaDescription);
      form.setFieldValue("metaKeywords", generated.metaKeywords);
      if (generated.faq && generated.faq.length > 0) {
        form.setFieldValue("faq", generated.faq);
      }

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

  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");

  const handleImportJsonParse = () => {
    try {
      const form = formRef.current;
      if (!form) return;

      const cleaned = importJson
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const generated = JSON.parse(cleaned) as GeneratedData;

      form.setFieldValue("slug", generated.slug || "");
      form.setFieldValue("excerpt", generated.excerpt || "");
      form.setFieldValue("content", generated.content || "");
      form.setFieldValue("metaTitle", generated.metaTitle || "");
      form.setFieldValue("metaDescription", generated.metaDescription || "");
      form.setFieldValue("metaKeywords", generated.metaKeywords || "");
      if (generated.faq && generated.faq.length > 0) {
        form.setFieldValue("faq", generated.faq);
      }

      toast.success("JSON imported successfully!");
      setShowImport(false);
      setImportJson("");
    } catch (err) {
      toast.error("Invalid JSON format. Make sure it's valid JSON.");
    }
  };

  const handleSubmit = async (values: PostFormData) => {
    try {
      await mutation.mutateAsync(values as PostFormData & { id?: string });
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
      schema={postFormSchema}
      defaultValues={
        data
          ? {
              title: data.title,
              slug: data.slug,
              excerpt: data.excerpt || "",
              content: data.content || "",
              status: data.status,
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
          {showImport && (
            <div className="flex flex-col gap-2 p-3 border rounded-md bg-secondary/10">
              <label className="text-sm font-medium">
                Paste the raw JSON from LLM here:
              </label>
              <textarea
                className="w-full h-32 p-2 text-sm font-mono border rounded-md bg-background"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{ "slug": "...", "content": "..." }'
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImport(false)}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleImportJsonParse}>
                  Import & Parse
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={generating || showImport}
                onClick={handleGenerateWithAI}
              >
                {generating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-4 w-4" />
                )}
                {generating ? "Generating..." : "Generate with AI"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowImport(!showImport)}
              >
                Manual JSON
              </Button>
            </div>
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
