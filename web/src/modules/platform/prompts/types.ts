import { z } from "zod";

export interface PlatformPrompt {
  id: string;
  module: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isTemplate: boolean;
  isDefault: boolean;
  templateName: string | null;
  defaultInstructions: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  [key: string]: unknown;
}

export interface PromptTemplate {
  id: string;
  module: string;
  name: string | null;
  defaultInstructions: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export const promptFormSchema = z.object({
  id: z.string().optional(),
  module: z.string().min(1, "Module is required"),
  name: z.string().min(1, "Name is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),
  userPromptTemplate: z.string()
    .min(1, "User prompt template is required")
    .refine(
      (val) => val.includes("{{title}}") || val.includes("{{name}}"),
      "Must contain {{title}} or {{name}} placeholder"
    ),
});

export type PromptFormData = z.infer<typeof promptFormSchema>;
