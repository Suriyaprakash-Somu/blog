import { clientFetch } from "../client-fetch";

export interface PlatformSetting {
  key: string;
  value: any;
  isPublic: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const result = await clientFetch<{ rows: PlatformSetting[] }>("/api/platform/settings");
  return result.rows || [];
}

export async function updatePlatformSetting(
  key: string,
  data: { value: any; isPublic?: boolean; description?: string }
): Promise<PlatformSetting> {
  const result = await clientFetch<{ data: PlatformSetting }>(`/api/platform/settings/${key}`, {
    method: "PUT",
    body: data,
  });
  return result.data;
}

/* ── LLM Providers ─────────────────────────────────────────────── */

export interface LlmProviderMeta {
  id: string;
  name: string;
  description: string;
  keyPlaceholder: string;
}

export interface LlmModel {
  id: string;
  name: string;
  ownedBy?: string;
}

export async function getLlmProviders(): Promise<LlmProviderMeta[]> {
  const result = await clientFetch<{ data: LlmProviderMeta[] }>(
    "/api/platform/settings/llm/providers",
  );
  return result.data ?? [];
}

export async function fetchLlmModels(
  provider: string,
  apiKey: string,
): Promise<LlmModel[]> {
  const result = await clientFetch<{ data: LlmModel[] }>(
    "/api/platform/settings/llm/models",
    {
      method: "POST",
      body: { provider, apiKey },
    },
  );
  return result.data ?? [];
}
