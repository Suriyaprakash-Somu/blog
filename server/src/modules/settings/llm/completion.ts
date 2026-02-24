/**
 * Centralized LLM Chat Completion Utility
 *
 * Reads the active provider + API key from platform_settings,
 * then calls the appropriate provider's chat completions API.
 * All providers are normalized to a single interface.
 */

import { eq } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { platformSettings } from "../../../db/schema/settings.js";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  /** Force JSON output (supported by most providers) */
  jsonMode?: boolean;
}

interface LlmConfig {
  activeProvider: string;
  providers: Record<string, { apiKey: string; model: string }>;
}

/* ------------------------------------------------------------------ */
/*  Provider-specific callers                                         */
/* ------------------------------------------------------------------ */

interface ProviderCaller {
  call(
    apiKey: string,
    model: string,
    opts: CompletionOptions,
  ): Promise<string>;
}

/**
 * OpenAI-compatible caller — works for OpenAI, Groq, and any
 * provider that follows the `/v1/chat/completions` convention.
 */
function openaiCompatible(baseUrl: string): ProviderCaller {
  return {
    async call(apiKey, model, opts) {
      const body: Record<string, unknown> = {
        model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
      };
      if (opts.maxTokens) body.max_tokens = opts.maxTokens;
      if (opts.jsonMode) body.response_format = { type: "json_object" };

      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(240_000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`LLM request failed (HTTP ${res.status}): ${text}`);
      }

      const json = (await res.json()) as {
        choices: { message: { content: string } }[];
      };
      return json.choices[0]?.message?.content ?? "";
    },
  };
}

function anthropicCaller(): ProviderCaller {
  return {
    async call(apiKey, model, opts) {
      // Separate system from user/assistant messages
      const systemMsg = opts.messages.find((m) => m.role === "system");
      const chatMessages = opts.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content }));

      const body: Record<string, unknown> = {
        model,
        messages: chatMessages,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.7,
      };
      if (systemMsg) body.system = systemMsg.content;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180_000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Anthropic request failed (HTTP ${res.status}): ${text}`);
      }

      const json = (await res.json()) as {
        content: { type: string; text: string }[];
      };
      return json.content.find((c) => c.type === "text")?.text ?? "";
    },
  };
}

function googleCaller(): ProviderCaller {
  return {
    async call(apiKey, model, opts) {
      // Map ChatMessage[] to Google's content format
      const systemInstruction = opts.messages.find((m) => m.role === "system");
      const contents = opts.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxTokens ?? 2048,
          ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      };
      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction.content }],
        };
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180_000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Google AI request failed (HTTP ${res.status}): ${text}`);
      }

      const json = (await res.json()) as {
        candidates: { content: { parts: { text: string }[] } }[];
      };
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Caller registry                                                   */
/* ------------------------------------------------------------------ */

const CALLERS: Record<string, ProviderCaller> = {
  openai: openaiCompatible("https://api.openai.com"),
  anthropic: anthropicCaller(),
  google: googleCaller(),
  groq: openaiCompatible("https://api.groq.com/openai"),
};

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Load the active LLM config from platform_settings.
 * Returns null if no config or no active provider.
 */
async function getActiveLlmConfig(): Promise<{
  provider: string;
  apiKey: string;
  model: string;
} | null> {
  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.key, "llm_config"))
    .limit(1);

  if (!row) return null;

  const config = row.value as LlmConfig;
  if (!config.activeProvider) return null;

  const providerConf = config.providers[config.activeProvider];
  if (!providerConf?.apiKey || !providerConf?.model) return null;

  return {
    provider: config.activeProvider,
    apiKey: providerConf.apiKey,
    model: providerConf.model,
  };
}

/**
 * Run a chat completion using the platform's active LLM provider.
 * Throws if no provider is configured or the request fails.
 */
export async function chatCompletion(
  opts: CompletionOptions,
): Promise<string> {
  const config = await getActiveLlmConfig();
  if (!config) {
    throw new Error(
      "No active LLM provider configured. Go to Platform Settings → Integrations.",
    );
  }

  const caller = CALLERS[config.provider];
  if (!caller) {
    throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }

  return caller.call(config.apiKey, config.model, opts);
}

/**
 * Convenience: run a chat completion and parse the response as JSON.
 */
export async function chatCompletionJSON<T = unknown>(
  opts: CompletionOptions,
): Promise<T> {
  const raw = await chatCompletion({ ...opts, jsonMode: true });

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as T;
    return parsed;
  } catch (err) {
    console.error("[LLM parse error] Raw response:", raw);
    throw new Error(`LLM returned invalid JSON: ${raw.slice(0, 500)}`);
  }
}
