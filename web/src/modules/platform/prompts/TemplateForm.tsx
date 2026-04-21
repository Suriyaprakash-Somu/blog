"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformPromptsApi } from "@/lib/api/prompts-api";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { PromptTemplate } from "./types";

const templateFormSchema = z.object({
  id: z.string().optional(),
  module: z.string().min(1, "Module is required").describe("Module"),
  templateName: z.string().min(1, "Template name is required").describe("Template Name"),
  systemPromptId: z.string().uuid("Please select a system prompt").describe("System Prompt"),
  defaultInstructions: z.string().optional().describe("Default Instructions"),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

export function TemplateForm({
  data,
  onSuccess,
}: OperationComponentProps<PromptTemplate>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);
  const [selectedModule, setSelectedModule] = useState<string>(data?.module || "prompt_blog_post");

  // Fetch active prompts for the selected module
  const { data: promptsData } = useApiQuery<{ rows: any[] }>(
    `/api/platform/prompts?module=${selectedModule}`
  );

  const systemPromptOptions = useMemo(() => {
    const prompts = promptsData?.rows || [];
    return prompts
      .filter((p: any) => p.isActive && !p.isTemplate)
      .map((p: any) => ({
        label: `${p.name} (v${p.version})`,
        value: p.id,
      }));
  }, [promptsData]);

  const moduleOptions = useMemo(() => [
    { label: "Blog Post", value: "prompt_blog_post" },
    { label: "Blog Category", value: "prompt_blog_category" },
    { label: "Blog Tag", value: "prompt_blog_tag" },
  ], []);

  const mutation = useApiMutation<
    PromptTemplate,
    TemplateFormData
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? `/api/platform/prompts/templates/${data!.id}`
      : "/api/platform/prompts/templates",
    revalidateTags: ["platform-prompts-templates"],
  });

  const handleSubmit = async (values: TemplateFormData) => {
    try {
      await mutation.mutateAsync(values);
      toast.success(isEdit ? "Template updated" : "Template created");
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save template",
      );
    }
  };

  // Update selected module when module changes
  useEffect(() => {
    if (data?.module) {
      setSelectedModule(data.module);
    }
  }, [data?.module]);

  return (
    <SchemaForm
      formRef={formRef}
      schema={templateFormSchema}
      defaultValues={
        data
          ? {
              id: data.id,
              module: data.module,
              templateName: data.name || "",
              systemPromptId: data.id,
              defaultInstructions: data.defaultInstructions || "",
            }
          : {
              module: "prompt_blog_post",
              templateName: "",
              systemPromptId: "",
              defaultInstructions: "",
            }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Template" : "Create Template"}
      isLoading={mutation.isPending}
    />
  );
}
