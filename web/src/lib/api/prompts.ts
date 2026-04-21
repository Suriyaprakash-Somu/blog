import { clientFetch } from "../client-fetch";

export type Prompt = {
  id: string;
  module: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export async function getPrompts(module?: string): Promise<Prompt[]> {
  const query = module ? `?module=${encodeURIComponent(module)}` : "";
  const res = await clientFetch<{ data: Prompt[] }>(`/api/platform/prompts${query}`);
  return res.data;
}

export async function createPrompt(data: {
  module: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
}): Promise<Prompt> {
  const res = await clientFetch<{ data: Prompt }>(`/api/platform/prompts`, {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function activatePrompt(id: string): Promise<void> {
  await clientFetch(`/api/platform/prompts/${id}/activate`, {
    method: "PUT",
    body: {},
  });
}

export async function deletePrompt(id: string): Promise<void> {
  await clientFetch(`/api/platform/prompts/${id}`, {
    method: "DELETE",
  });
}
