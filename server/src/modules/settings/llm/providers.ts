/**
 * Centralized LLM Provider Abstraction
 *
 * Each provider implements the same interface. To add a new provider,
 * just add an entry to the PROVIDERS map — everything else (route,
 * frontend) picks it up automatically.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Shared types                                                      */
/* ------------------------------------------------------------------ */

export interface LlmModel {
  id: string;
  name: string;
  ownedBy?: string;
}

export interface LlmProviderMeta {
  id: string;
  name: string;
  description: string;
  keyPlaceholder: string;
}

interface LlmProviderAdapter {
  meta: LlmProviderMeta;
  /** Fetch available models using the given API key. */
  listModels(apiKey: string): Promise<LlmModel[]>;
}

/* ------------------------------------------------------------------ */
/*  Provider implementations                                          */
/* ------------------------------------------------------------------ */

/**
 * Generic OpenAI-compatible adapter.
 * Works for OpenAI, Groq, and any provider that follows the
 * `GET /v1/models` convention.
 */
function openaiCompatibleAdapter(
  meta: LlmProviderMeta,
  baseUrl: string,
  opts?: { filterFn?: (m: { id: string; owned_by?: string }) => boolean },
): LlmProviderAdapter {
  return {
    meta,
    async listModels(apiKey) {
      const res = await fetch(`${baseUrl}/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `${meta.name}: failed to list models (HTTP ${res.status}): ${body}`,
        );
      }

      const json = (await res.json()) as {
        data: { id: string; owned_by?: string }[];
      };

      let models = json.data ?? [];
      if (opts?.filterFn) models = models.filter(opts.filterFn);

      return models
        .map((m) => ({
          id: m.id,
          name: m.id,
          ownedBy: m.owned_by,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  };
}

function googleAdapter(): LlmProviderAdapter {
  return {
    meta: {
      id: "google",
      name: "Google AI",
      description: "Gemini Pro and other Google models.",
      keyPlaceholder: "AIza...",
    },
    async listModels(apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        { signal: AbortSignal.timeout(10_000) },
      );

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Google AI: failed to list models (HTTP ${res.status}): ${body}`);
      }

      const json = (await res.json()) as {
        models: { name: string; displayName: string }[];
      };

      return (json.models ?? [])
        .filter((m) => m.name.startsWith("models/gemini"))
        .map((m) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  };
}

function anthropicAdapter(): LlmProviderAdapter {
  return {
    meta: {
      id: "anthropic",
      name: "Anthropic",
      description: "Claude Sonnet, Haiku, and Opus models.",
      keyPlaceholder: "sk-ant-...",
    },
    async listModels(apiKey) {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Anthropic: failed to list models (HTTP ${res.status}): ${body}`,
        );
      }

      const json = (await res.json()) as {
        data: { id: string; display_name?: string }[];
      };

      return (json.data ?? [])
        .map((m) => ({
          id: m.id,
          name: m.display_name ?? m.id,
        }))
        .sort((a, b) => a.id.localeCompare(b.id));
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Provider registry                                                 */
/* ------------------------------------------------------------------ */

const PROVIDERS = new Map<string, LlmProviderAdapter>();

function register(adapter: LlmProviderAdapter) {
  PROVIDERS.set(adapter.meta.id, adapter);
}

register(
  openaiCompatibleAdapter(
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4o, GPT-4o Mini, and other OpenAI models.",
      keyPlaceholder: "sk-...",
    },
    "https://api.openai.com",
    {
      filterFn: (m) =>
        m.id.startsWith("gpt-") ||
        m.id.startsWith("o1") ||
        m.id.startsWith("o3") ||
        m.id.startsWith("o4"),
    },
  ),
);

register(anthropicAdapter());
register(googleAdapter());

register(
  openaiCompatibleAdapter(
    {
      id: "groq",
      name: "Groq",
      description: "Fast inference with Llama and Mixtral models.",
      keyPlaceholder: "gsk_...",
    },
    "https://api.groq.com/openai",
  ),
);

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export function getProvider(providerId: string): LlmProviderAdapter | undefined {
  return PROVIDERS.get(providerId);
}

export function getAllProvidersMeta(): LlmProviderMeta[] {
  return [...PROVIDERS.values()].map((p) => p.meta);
}

export async function listModelsForProvider(
  providerId: string,
  apiKey: string,
): Promise<LlmModel[]> {
  const provider = PROVIDERS.get(providerId);
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return provider.listModels(apiKey);
}

/* ------------------------------------------------------------------ */
/*  Validation schemas                                                */
/* ------------------------------------------------------------------ */

export const listModelsBodySchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().min(1),
});
