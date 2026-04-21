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

      console.log(`[LLM PROVIDER] Calling OpenAI-compatible endpoint at ${baseUrl}...`);
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

      console.log(`[LLM PROVIDER] Calling Anthropic API...`);
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

      console.log(`[LLM PROVIDER] Calling Google GenAI API...`);
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
  console.log(`[LLM DB] Fetching active LLM config from platform_settings...`);
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
  console.log(`[LLM CORE] chatCompletion invoked.`);
  const config = await getActiveLlmConfig();
  console.log(`[LLM CORE] Config retrieved:`, config ? config.provider : "null");
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
  console.log(`[LLM CORE] chatCompletionJSON invoked.`);
  const raw = await chatCompletion({ ...opts, jsonMode: true });
  console.log(`[LLM CORE] Raw text received. Length:`, raw.length);

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

/* ------------------------------------------------------------------ */
/*  Enhanced Generation with Cache                                    */
/* ------------------------------------------------------------------ */

import { z } from "zod";
import { createCacheKey, createPromptHash, getFromCache, saveToCache } from "../../../core/llmResponseStorage.js";
import { parseAndStoreResponse } from "../../../core/llmResponseParser.js";

export interface LLMGenerationOptions<T> {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  
  // Caching
  cacheKey?: string;
  enableCache?: boolean;
  
  // Context
  module: string;
  inputTitle?: string;
  inputName?: string;
  additionalInstructions?: string | null;
  
  // Schema for validation
  schema: z.ZodSchema<T>;
}

export interface LLMGenerationResult<T> {
  data: T;
  fromCache: boolean;
  cacheKey: string;
}

export class LLMGenerationError extends Error {
  constructor(
    message: string,
    public cacheKey: string,
    public rawResponse?: string
  ) {
    super(message);
    this.name = "LLMGenerationError";
  }
}

export async function generateWithCache<T>(
  opts: LLMGenerationOptions<T>,
): Promise<LLMGenerationResult<T>> {
  const {
    messages,
    temperature = 0.7,
    maxTokens,
    jsonMode = true,
    cacheKey,
    enableCache = true,
    module,
    inputTitle,
    inputName,
    additionalInstructions,
    schema,
  } = opts;

  // Extract system and user prompts from messages
  const systemPrompt = messages.find((m) => m.role === "system")?.content ?? "";
  const userPrompt = messages.find((m) => m.role === "user")?.content ?? "";
  const promptHash = createPromptHash(systemPrompt, userPrompt);

  // Generate cache key if not provided
  const finalCacheKey = cacheKey ?? createCacheKey({
    module,
    systemPrompt,
    userPrompt,
    inputTitle,
    inputName,
    temperature,
  });

  // Check cache
  if (enableCache) {
    const cached = await getFromCache(finalCacheKey);
    if (cached && cached.status === "success" && cached.parsedData) {
      console.log(`[LLM Cache] HIT for key: ${finalCacheKey}`);
      return {
        data: cached.parsedData as T,
        fromCache: true,
        cacheKey: finalCacheKey,
      };
    }
    if (cached) {
      console.log(`[LLM Cache] Found but status is ${cached.status}, regenerating...`);
    } else {
      console.log(`[LLM Cache] MISS for key: ${finalCacheKey}`);
    }
  }

  // Call LLM
  console.log(`[LLM Generation] Calling LLM for module: ${module}`);
  let rawResponse: string;
  try {
    rawResponse = await chatCompletion({
      messages,
      temperature,
      maxTokens,
      jsonMode,
    });
  } catch (llmError) {
    console.error(`[LLM Generation] LLM call failed for module: ${module}`, llmError);
    throw llmError;
  }

  console.log(`[LLM Generation] LLM response received for module: ${module}, length: ${rawResponse?.length ?? 0}`);

  // Parse and store
  const result = await parseAndStoreResponse({
    cacheKey: finalCacheKey,
    promptHash,
    module,
    rawResponse,
    schema,
    inputTitle,
    inputName,
    additionalInstructions,
    systemPrompt,
    userPrompt,
    model: undefined,
    temperature: temperature?.toString(),
    tokenUsage: undefined,
  });

  if (!result.success) {
    console.error(`[LLM Generation] Failed to parse response for module: ${module}`);
    throw new LLMGenerationError(
      result.errorMessage ?? "LLM response could not be parsed",
      finalCacheKey,
      rawResponse
    );
  }

  return {
    data: result.data!,
    fromCache: false,
    cacheKey: finalCacheKey,
  };
}

/**
 * Manual correction function (for UI)
 */
export async function correctCachedResponse(params: {
  cacheKey: string;
  correctedJson: string;
  schema: z.ZodSchema<unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const { cacheKey, correctedJson, schema } = params;

  try {
    const parsed = JSON.parse(correctedJson);
    const validated = schema.parse(parsed);

    await saveToCache({
      cacheKey,
      promptHash: "",
      module: "",
      inputTitle: null,
      inputName: null,
      additionalInstructions: null,
      systemPrompt: "",
      userPrompt: "",
      rawResponse: correctedJson,
      parsedData: validated as unknown,
      status: "corrected",
      errorMessage: null,
      errorStack: null,
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    return { success: false, error: message };
  }
}
