/**
 * Blog Tag Generation Prompt
 *
 * Given a tag name, generates:
 *  - slug, description, metaTitle, metaDescription, metaKeywords
 */

import { z } from "zod";
import type { ChatMessage } from "../../settings/llm/completion.js";

/* ------------------------------------------------------------------ */
/*  Output schema (for validation)                                    */
/* ------------------------------------------------------------------ */

export const blogTagGeneratedSchema = z.object({
  slug: z.string(),
  description: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  metaKeywords: z.string(),
});

export type BlogTagGenerated = z.infer<typeof blogTagGeneratedSchema>;

/* ------------------------------------------------------------------ */
/*  Prompt builder                                                    */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an expert SEO content strategist for an Indian blog platform targeting readers in India.
Given a blog tag name, generate high-quality metadata optimized for Indian audiences and search trends.

A tag is more specific and granular than a category — it represents a focused topic or keyword that readers might search for.

Rules:
- slug: URL-friendly, lowercase, hyphenated, no special characters (e.g. "react-hooks")
- description: 1-2 concise sentences describing what this tag covers, written for an Indian audience
- metaTitle: SEO-optimized for Indian search queries, under 60 characters, includes the tag concept
- metaDescription: compelling, under 160 characters, uses keywords that Indian users commonly search for
- metaKeywords: 5-8 relevant comma-separated keywords targeting Indian search trends

Respond ONLY with valid JSON matching this exact schema:
{
  "slug": "string",
  "description": "string",
  "metaTitle": "string",
  "metaDescription": "string",
  "metaKeywords": "string"
}`;

export function buildBlogTagPrompt(tagName: string): ChatMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Generate blog tag metadata for: "${tagName}"`,
    },
  ];
}
