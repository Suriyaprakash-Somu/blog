import { z } from "zod";
import {
  createPromptHash,
  saveToCache,
  updateCacheStatus,
} from "./llmResponseStorage.js";
import type { NewLLMResponseCache } from "../modules/llmCache/llmCache.schema.js";

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  status: "success" | "failed" | "needs_review";
  errorMessage?: string;
}

export async function parseAndStoreResponse<T>(params: {
  cacheKey: string;
  promptHash: string;
  module: string;
  rawResponse: string;
  schema: z.ZodSchema<T>;
  inputTitle?: string;
  inputName?: string;
  additionalInstructions?: string | null;
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number | string;
  tokenUsage?: number;
}): Promise<ParseResult<T>> {
  const {
    cacheKey,
    promptHash,
    module,
    rawResponse,
    schema,
    inputTitle,
    inputName,
    additionalInstructions,
    systemPrompt,
    userPrompt,
    model,
    temperature,
    tokenUsage,
  } = params;

  // Prepare base cache entry
  const baseEntry: Omit<NewLLMResponseCache, 'errorMessage' | 'errorStack' | 'parsedData'> = {
    cacheKey,
    promptHash,
    module,
    inputTitle: inputTitle ?? null,
    inputName: inputName ?? null,
    additionalInstructions: additionalInstructions ?? null,
    systemPrompt,
    userPrompt,
    rawResponse,
    model: model ?? null,
    temperature: typeof temperature === 'string' ? temperature : (temperature?.toString() ?? null),
    tokenUsage: tokenUsage ?? null,
    status: "pending",
  };

  try {
    // Clean raw response
    let cleanedText = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // Extract JSON between braces
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    // Parse JSON
    const parsedData = JSON.parse(cleanedText) as unknown;

    // Validate with schema
    const validated = schema.parse(parsedData);

    console.log(`[LLM Parser] Successfully parsed response for cacheKey ${cacheKey}`);

    // Success - save with parsed data
    await saveToCache({
      ...baseEntry,
      parsedData: validated as unknown,
      status: "success",
      errorMessage: null,
      errorStack: null,
    });

    console.log(`[LLM Parser] Saved to cache for cacheKey ${cacheKey}`);

    return {
      success: true,
      data: validated,
      status: "success",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown parsing error";
    const errorStack = err instanceof Error ? err.stack : undefined;

    console.error(`[LLM Parser] Parsing failed for cacheKey ${cacheKey}:`, errorMessage);

    // Save with needs_review status
    await saveToCache({
      ...baseEntry,
      parsedData: null,
      status: "needs_review",
      errorMessage: errorMessage ?? null,
      errorStack: errorStack ?? null,
    });

    return {
      success: false,
      status: "needs_review",
      errorMessage,
    };
  }
}
