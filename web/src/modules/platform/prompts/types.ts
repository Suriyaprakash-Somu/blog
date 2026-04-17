import { z } from "zod";

export interface PlatformPrompt {
  id: string;
  module: string;
  name: string;
  content: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  [key: string]: unknown;
}

export const promptFormSchema = z.object({
  id: z.string().optional(),
  module: z.string().min(1, "Module is required"),
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Content is required"),
});

export type PromptFormData = z.infer<typeof promptFormSchema>;
